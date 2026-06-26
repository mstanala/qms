package com.qmspharma.service;

import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.HttpMethod;
import com.google.cloud.storage.Storage;
import com.qmspharma.exception.ResourceNotFoundException;
import com.qmspharma.exception.BusinessRuleException;
import com.qmspharma.model.dto.response.AttachmentResponse;
import com.qmspharma.model.dto.response.UserRef;
import com.qmspharma.model.entity.Attachment;
import com.qmspharma.model.enums.AttachmentCategory;
import com.qmspharma.repository.AttachmentRepository;
import com.qmspharma.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final CurrentUserProvider currentUserProvider;
    private final ObjectProvider<Storage> storageProvider;

    @Value("${gcs.bucket-name}")
    private String bucketName;

    @Value("${gcs.signed-url-duration-minutes:15}")
    private long signedUrlDurationMinutes;

    @Transactional
    public AttachmentResponse upload(MultipartFile file, String recordType, UUID recordId,
                                     String category, String description) {
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("Attachment file is required", "ATTACHMENT_FILE_REQUIRED");
        }

        var user = currentUserProvider.getCurrentUser();
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "attachment");
        String contentType = StringUtils.hasText(file.getContentType()) ? file.getContentType() : "application/octet-stream";
        String objectKey = String.format("%s/%s/%s_%s", recordType.toLowerCase(), recordId, UUID.randomUUID(), originalFileName);
        byte[] bytes = readBytes(file);

        BlobInfo blobInfo = BlobInfo.newBuilder(bucketName, objectKey)
                .setContentType(contentType)
                .setMetadata(java.util.Map.of(
                        "recordType", recordType,
                        "recordId", recordId.toString(),
                        "uploadedBy", user.getId().toString(),
                        "originalFileName", originalFileName
                ))
                .build();

        try {
            storage().create(blobInfo, bytes);
        } catch (RuntimeException ex) {
            throw new BusinessRuleException("Unable to upload attachment to Google Cloud Storage: " + ex.getMessage(), "GCS_UPLOAD_FAILED");
        }

        Attachment attachment = new Attachment();
        attachment.setRecordType(recordType);
        attachment.setRecordId(recordId);
        attachment.setFileName(originalFileName);
        attachment.setFileType(contentType);
        attachment.setFileSize(file.getSize());
        attachment.setStoragePath(objectKey);
        attachment.setGcsBucket(bucketName);
        attachment.setGcsObjectKey(objectKey);
        attachment.setChecksumSha256(sha256(bytes));
        attachment.setCategory(category != null ? AttachmentCategory.valueOf(category) : AttachmentCategory.OTHER);
        attachment.setDescription(description);
        attachment.setUploadedBy(user);

        attachment = attachmentRepository.save(attachment);
        return toResponse(attachment);
    }

    @Transactional(readOnly = true)
    public List<AttachmentResponse> listByRecord(String recordType, UUID recordId) {
        return attachmentRepository.findByRecordTypeAndRecordIdAndIsDeletedFalse(recordType, recordId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public String getDownloadUrl(UUID id, boolean forceDownload) {
        Attachment a = attachmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", "id", id));
        try {
            var signOptions = new java.util.ArrayList<Storage.SignUrlOption>();
            signOptions.add(Storage.SignUrlOption.httpMethod(HttpMethod.GET));
            signOptions.add(Storage.SignUrlOption.withV4Signature());
            if (forceDownload) {
                signOptions.add(Storage.SignUrlOption.withQueryParams(Map.of(
                        "response-content-disposition", "attachment; filename=\"" + sanitizeFileName(a.getFileName()) + "\""
                )));
            }

            return storage().signUrl(
                    BlobInfo.newBuilder(a.getGcsBucket(), a.getGcsObjectKey()).build(),
                    signedUrlDurationMinutes,
                    TimeUnit.MINUTES,
                    signOptions.toArray(Storage.SignUrlOption[]::new)
            ).toString();
        } catch (RuntimeException ex) {
            throw new BusinessRuleException("Unable to generate attachment download URL: " + ex.getMessage(), "GCS_SIGNED_URL_FAILED");
        }
    }

    @Transactional(readOnly = true)
    public AttachmentContent getContent(UUID id) {
        Attachment a = attachmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", "id", id));
        if (Boolean.TRUE.equals(a.getIsDeleted())) {
            throw new ResourceNotFoundException("Attachment", "id", id);
        }

        try {
            Blob blob = storage().get(a.getGcsBucket(), a.getGcsObjectKey());
            if (blob == null || !blob.exists()) {
                throw new ResourceNotFoundException("Attachment object", "id", id);
            }
            return new AttachmentContent(blob.getContent(), a.getFileName(), a.getFileType());
        } catch (ResourceNotFoundException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            throw new BusinessRuleException("Unable to read attachment from Google Cloud Storage: " + ex.getMessage(), "GCS_DOWNLOAD_FAILED");
        }
    }

    @Transactional
    public void softDelete(UUID id) {
        Attachment a = attachmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", "id", id));
        a.setIsDeleted(true);
        a.setDeletedAt(Instant.now());
        a.setDeletedBy(currentUserProvider.getCurrentUser());
        attachmentRepository.save(a);
    }

    private AttachmentResponse toResponse(Attachment a) {
        return AttachmentResponse.builder()
                .id(a.getId()).recordType(a.getRecordType()).recordId(a.getRecordId())
                .fileName(a.getFileName()).fileType(a.getFileType()).fileSize(a.getFileSize())
                .category(a.getCategory().name()).description(a.getDescription())
                .uploadedBy(UserRef.builder().id(a.getUploadedBy().getId())
                        .displayName(a.getUploadedBy().getDisplayName())
                        .email(a.getUploadedBy().getEmail()).build())
                .uploadedDate(a.getUploadedDate()).build();
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException ex) {
            throw new BusinessRuleException("Unable to read attachment file: " + ex.getMessage(), "ATTACHMENT_READ_FAILED");
        }
    }

    private String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException ex) {
            throw new BusinessRuleException("Unable to calculate attachment checksum", "ATTACHMENT_CHECKSUM_FAILED");
        }
    }

    private String sanitizeFileName(String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return "attachment";
        }
        return fileName.replace("\\", "_").replace("\"", "_").replace("\r", "_").replace("\n", "_");
    }

    private Storage storage() {
        return storageProvider.getObject();
    }

    public record AttachmentContent(byte[] bytes, String fileName, String contentType) {}
}
