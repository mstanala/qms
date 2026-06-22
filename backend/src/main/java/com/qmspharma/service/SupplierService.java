package com.qmspharma.service;

import com.qmspharma.model.entity.*;
import com.qmspharma.repository.*;
import com.qmspharma.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private static final String RECORD_TYPE = "SUPPLIER";

    private final SupplierRepository supplierRepository;
    private final PlantSiteRepository plantSiteRepository;
    private final UserRepository userRepository;
    private final SequenceGeneratorService sequenceGenerator;
    private final AuditTrailService auditTrailService;
    private final CurrentUserProvider currentUserProvider;

    @Transactional(readOnly = true)
    public Page<Supplier> list(String status, String supplierType, String category, String search, Pageable pageable) {
        Specification<Supplier> spec = Specification.where(null);
        if (status != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("status"), status));
        if (supplierType != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("supplierType"), supplierType));
        if (category != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("category"), category));
        if (search != null && !search.isBlank()) {
            String like = "%" + search.toLowerCase() + "%";
            spec = spec.and((r, q, cb) -> cb.or(
                    cb.like(cb.lower(r.get("name")), like),
                    cb.like(cb.lower(r.get("supplierNumber")), like)
            ));
        }
        return supplierRepository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public Supplier getById(UUID id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Supplier not found: " + id));
    }

    @Transactional
    public Supplier create(Map<String, Object> request) {
        User currentUser = currentUserProvider.getCurrentUser();
        Supplier s = new Supplier();
        s.setSupplierNumber(sequenceGenerator.generateNumber("SUPPLIER"));
        s.setName((String) request.get("name"));
        s.setLegalName((String) request.get("legalName"));
        s.setSupplierType((String) request.get("supplierType"));
        s.setCategory((String) request.get("category"));
        s.setAddress((String) request.get("address"));
        s.setCity((String) request.get("city"));
        s.setCountry((String) request.get("country"));
        s.setPrimaryContactName((String) request.get("primaryContactName"));
        s.setPrimaryContactEmail((String) request.get("primaryContactEmail"));
        s.setOwner(userRepository.getReferenceById(UUID.fromString((String) request.get("ownerId"))));
        if (request.containsKey("plantSiteId")) {
            s.setPlantSite(plantSiteRepository.getReferenceById(UUID.fromString((String) request.get("plantSiteId"))));
        }
        s.setCreatedBy(currentUser);
        s.setUpdatedBy(currentUser);
        return supplierRepository.save(s);
    }

    @Transactional
    public Supplier update(UUID id, Map<String, Object> request) {
        Supplier s = getById(id);
        if (request.containsKey("name")) s.setName((String) request.get("name"));
        if (request.containsKey("address")) s.setAddress((String) request.get("address"));
        if (request.containsKey("primaryContactName")) s.setPrimaryContactName((String) request.get("primaryContactName"));
        if (request.containsKey("primaryContactEmail")) s.setPrimaryContactEmail((String) request.get("primaryContactEmail"));
        s.setUpdatedBy(currentUserProvider.getCurrentUser());
        return supplierRepository.save(s);
    }

    @Transactional
    public Supplier transitionStatus(UUID id, String newStatus) {
        Supplier s = getById(id);
        String old = s.getStatus();
        s.setStatus(newStatus);
        s.setUpdatedBy(currentUserProvider.getCurrentUser());
        auditTrailService.logAction(RECORD_TYPE, s.getId(), s.getSupplierNumber(),
                "STATUS_CHANGE", "status", old, newStatus, null);
        return supplierRepository.save(s);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardMetrics() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("totalSuppliers", supplierRepository.count());
        m.put("byStatus", supplierRepository.countByStatusGrouped());
        m.put("byType", supplierRepository.countBySupplierType());
        m.put("byCategory", supplierRepository.countByCategory());
        return m;
    }
}
