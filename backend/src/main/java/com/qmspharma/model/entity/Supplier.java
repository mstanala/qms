package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "suppliers")
@Data
public class Supplier {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "supplier_number", nullable = false, unique = true, length = 50)
    private String supplierNumber;

    @Column(nullable = false, length = 500)
    private String name;

    @Column(name = "legal_name", length = 500)
    private String legalName;

    @Column(name = "supplier_type", nullable = false, length = 30)
    private String supplierType;

    @Column(nullable = false, length = 30)
    private String category;

    @Column(nullable = false, length = 30)
    private String status = "PENDING_QUALIFICATION";

    @Column(columnDefinition = "TEXT")
    private String address;

    private String city;
    private String state;
    private String country;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(name = "primary_contact_name")
    private String primaryContactName;

    @Column(name = "primary_contact_email")
    private String primaryContactEmail;

    @Column(name = "primary_contact_phone", length = 50)
    private String primaryContactPhone;

    @Column(name = "gmp_certification", length = 100)
    private String gmpCertification;

    @Column(name = "iso_certification", length = 100)
    private String isoCertification;

    @Column(name = "fda_registration", length = 100)
    private String fdaRegistration;

    @Column(name = "duns_number", length = 20)
    private String dunsNumber;

    @Column(name = "qualification_date")
    private Instant qualificationDate;

    @Column(name = "next_requalification_date")
    private Instant nextRequalificationDate;

    @Column(name = "requalification_frequency_months")
    private Integer requalificationFrequencyMonths = 36;

    @Column(name = "overall_score", precision = 5, scale = 2)
    private BigDecimal overallScore;

    @Column(name = "quality_score", precision = 5, scale = 2)
    private BigDecimal qualityScore;

    @Column(name = "delivery_score", precision = 5, scale = 2)
    private BigDecimal deliveryScore;

    @Column(name = "compliance_score", precision = 5, scale = 2)
    private BigDecimal complianceScore;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_site_id")
    private PlantSite plantSite;

    @Column(name = "current_workflow_step", length = 100)
    private String currentWorkflowStep = "Pending";

    @Column(name = "flowable_process_id")
    private String flowableProcessId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by", nullable = false)
    private User updatedBy;

    @Version
    private Integer version = 1;
}
