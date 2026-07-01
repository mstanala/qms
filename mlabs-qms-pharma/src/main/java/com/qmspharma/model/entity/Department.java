package com.qmspharma.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "departments", uniqueConstraints = @UniqueConstraint(columnNames = {"plant_site_id", "code"}))
@Data
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_site_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "organization"})
    private PlantSite plantSite;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 50)
    private String code;

    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_department_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "parentDepartment", "plantSite"})
    private Department parentDepartment;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}