package com.qmspharma.service;

import com.qmspharma.model.dto.response.AuditTrailResponse;
import com.qmspharma.model.entity.AuditTrail;
import com.qmspharma.model.entity.User;
import com.qmspharma.repository.AuditTrailRepository;
import com.qmspharma.security.CurrentUserProvider;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditTrailService {

    private final AuditTrailRepository auditTrailRepository;
    private final CurrentUserProvider currentUserProvider;

    @Transactional
    public void logAction(String recordType, UUID recordId, String recordNumber, String action,
                          String fieldName, String oldValue, String newValue, String comments) {
        User user = currentUserProvider.getCurrentUser();
        AuditTrail entry = new AuditTrail();
        entry.setRecordType(recordType);
        entry.setRecordId(recordId);
        entry.setRecordNumber(recordNumber);
        entry.setAction(action);
        entry.setFieldName(fieldName);
        entry.setOldValue(oldValue);
        entry.setNewValue(newValue);
        entry.setComments(comments);
        entry.setUser(user);
        entry.setUserName(user.getDisplayName() != null ? user.getDisplayName() : user.getUsername());

        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpServletRequest req = attrs.getRequest();
            entry.setIpAddress(req.getRemoteAddr());
            entry.setUserAgent(req.getHeader("User-Agent"));
        }
        auditTrailRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public List<AuditTrailResponse> getByRecord(String recordType, UUID recordId) {
        return auditTrailRepository.findByRecordTypeAndRecordIdOrderByTimestampDesc(recordType, recordId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<AuditTrailResponse> search(String recordType, UUID recordId, Pageable pageable) {
        return auditTrailRepository.findByRecordTypeAndRecordId(recordType, recordId, pageable)
                .map(this::toResponse);
    }

    private AuditTrailResponse toResponse(AuditTrail a) {
        return AuditTrailResponse.builder()
                .id(a.getId()).recordType(a.getRecordType()).recordId(a.getRecordId())
                .recordNumber(a.getRecordNumber()).action(a.getAction()).fieldName(a.getFieldName())
                .oldValue(a.getOldValue()).newValue(a.getNewValue()).comments(a.getComments())
                .reasonForChange(a.getReasonForChange()).userId(a.getUser().getId())
                .userName(a.getUserName()).ipAddress(a.getIpAddress()).timestamp(a.getTimestamp())
                .build();
    }
}
