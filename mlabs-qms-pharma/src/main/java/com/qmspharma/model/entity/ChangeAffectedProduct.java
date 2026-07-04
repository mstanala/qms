package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Entity
@Table(name = "change_affected_products")
@Data
public class ChangeAffectedProduct {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "change_request_id", nullable = false)
    private ChangeRequest changeRequest;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "product_code", nullable = false, length = 100)
    private String productCode;

    @Column(name = "dosage_form", length = 100)
    private String dosageForm;

    @Column(columnDefinition = "text[]")
    private String[] markets;

    @Column(name = "impact_description", columnDefinition = "TEXT")
    private String impactDescription;
}
