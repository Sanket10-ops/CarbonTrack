
package com.CarbonTrack.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "badges")
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "trigger_type", nullable = false, length = 30)
    private String triggerType;

    @Column(name = "threshold", precision = 12, scale = 2)
    private BigDecimal threshold;

    protected Badge() {
        // Required by JPA
    }

    public Badge(
            String name,
            String description,
            String triggerType,
            BigDecimal threshold) {
        this.name = name;
        this.description = description;
        this.triggerType = triggerType;
        this.threshold = threshold;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getTriggerType() {
        return triggerType;
    }

    public BigDecimal getThreshold() {
        return threshold;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setTriggerType(String triggerType) {
        this.triggerType = triggerType;
    }

    public void setThreshold(BigDecimal threshold) {
        this.threshold = threshold;
    }
}
