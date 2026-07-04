package com.qmspharma.model.entity;

import com.qmspharma.model.enums.FilingStatus;
import com.qmspharma.model.enums.FilingType;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "change_regulatory_filings")
@Data
public class ChangeRegulatoryFiling {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "change_request_id", nullable = false, unique = true)
    private ChangeRequest changeRequest;

    @Column(name = "filing_required", nullable = false)
    private Boolean filingRequired = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "filing_type", length = 30)
    private FilingType filingType;

    @Column(columnDefinition = "text[]")
    private String[] markets;

    @Column(name = "filing_details", columnDefinition = "TEXT")
    private String filingDetails;

    @Column(name = "target_filing_date")
    private Instant targetFilingDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "filing_status", length = 20)
    private FilingStatus filingStatus;
}
