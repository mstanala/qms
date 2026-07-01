package com.qmspharma.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "products")
@Data
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "product_code", nullable = false, unique = true, length = 100)
    private String productCode;

    @Column(name = "product_name", nullable = false, length = 500)
    private String productName;

    @Column(name = "dosage_form", length = 100)
    private String dosageForm;

    @Column(length = 100)
    private String strength;

    @Column(name = "therapeutic_category")
    private String therapeuticCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_site_id")
    private PlantSite plantSite;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
