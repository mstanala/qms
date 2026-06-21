package com.qmspharma.service;

import com.qmspharma.exception.ResourceNotFoundException;
import com.qmspharma.model.dto.response.AttachmentResponse;
import com.qmspharma.model.dto.response.UserRef;
import com.qmspharma.model.entity.Attachment;
import com.qmspharma.model.enums.AttachmentCategory;
import com.qmspharma.repository.AttachmentRepository;
import com.qmspharma.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final CurrentUserProvider currentUserProvider;

    @Value("${gcs.bucket-name}")
    private String bucketName;

    @Transactional
    public AttachmentResponse upload(MultipartFile file, String recordType, UUID recordId,
                                     String category, String description) {
        var user = currentUserProvider.getCurrentUser();
        String objectKey = String.format("%s/%s/%s_%s", recordType.toLowerCase(), recordId, UUID.randomUUID(), file.getOriginalFilename());

        // TODO: Integrate with Google Cloud Storage for actual upload
        Attachment attachment = new Attachment();
        attachment.setRecordType(recordType);
        attachment.setRecordId(recordId);
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFileType(file.getContentType());
        attachment.setFileSize(file.getSize());
        attachment.setStoragePath(objectKey);
        attachment.setGcsBucket(bucketName);
        attachment.setGcsObjectKey(objectKey);
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
    public String getDownloadUrl(UUID id) {
        Attachment a = attachmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", "id", id));
        // TODO: Generate signed GCS URL
        return String.format("https://storage.googleapis.com/%s/%s", a.getGcsBucket(), a.getGcsObjectKey());
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
}
