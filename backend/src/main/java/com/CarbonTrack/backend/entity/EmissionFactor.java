
package com.CarbonTrack.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "emission_factors")
public class EmissionFactor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "activity_type", nullable = false, length = 100)
    private String activityType;

    @Column(name = "unit", nullable = false, length = 50)
    private String unit;

    @Column(name = "kg_co2e_per_unit", nullable = false, precision = 12, scale = 6)
    private BigDecimal kgCo2ePerUnit;

    @Column(name = "source", length = 255)
    private String source;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    protected EmissionFactor() {
        // Required by JPA
    }

    public EmissionFactor(
            String activityType,
            String unit,
            BigDecimal kgCo2ePerUnit,
            String source,
            LocalDate effectiveDate) {
        this.activityType = activityType;
        this.unit = unit;
        this.kgCo2ePerUnit = kgCo2ePerUnit;
        this.source = source;
        this.effectiveDate = effectiveDate;
    }

    public Long getId() {
        return id;
    }

    public String getActivityType() {
        return activityType;
    }

    public String getUnit() {
        return unit;
    }

    public BigDecimal getKgCo2ePerUnit() {
        return kgCo2ePerUnit;
    }

    public String getSource() {
        return source;
    }

    public LocalDate getEffectiveDate() {
        return effectiveDate;
    }
}
