package com.qmspharma.service;

import com.qmspharma.exception.UnauthorizedException;
import com.qmspharma.model.dto.request.VerifyESignatureRequest;
import com.qmspharma.model.entity.ElectronicSignature;
import com.qmspharma.model.entity.User;
import com.qmspharma.repository.ElectronicSignatureRepository;
import com.qmspharma.security.CurrentUserProvider;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ESignatureService {

    private final ElectronicSignatureRepository esigRepository;
    private final CurrentUserProvider currentUserProvider;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public ElectronicSignature verify(VerifyESignatureRequest request) {
        User user = currentUserProvider.getCurrentUser();
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid electronic signature: password mismatch");
        }

        ElectronicSignature esig = new ElectronicSignature();
        esig.setUser(user);
        esig.setRecordType(request.getRecordType());
        esig.setRecordId(request.getRecordId());
        esig.setAction(request.getAction());
        esig.setMeaning(request.getMeaning());
        esig.setSignatureHash(passwordEncoder.encode(user.getId() + ":" + request.getMeaning() + ":" + System.currentTimeMillis()));

        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            esig.setIpAddress(attrs.getRequest().getRemoteAddr());
        }
        return esigRepository.save(esig);
    }

    @Transactional
    public ElectronicSignature verifyInline(String password, String meaning, String recordType, UUID recordId, String action) {
        VerifyESignatureRequest req = new VerifyESignatureRequest();
        req.setPassword(password);
        req.setMeaning(meaning);
        req.setRecordType(recordType);
        req.setRecordId(recordId);
        req.setAction(action);
        return verify(req);
    }
}
