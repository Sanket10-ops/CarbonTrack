
package com.CarbonTrack.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "activity_logs")
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @Column(name = "activity_type", nullable = false, length = 100)
    private String activityType;

    @Column(name = "quantity", nullable = false, precision = 12, scale = 4)
    private BigDecimal quantity;

    @Column(name = "unit", nullable = false, length = 50)
    private String unit;

    @Column(name = "co2e_kg", nullable = false, precision = 12, scale = 4)
    private BigDecimal co2eKg;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected ActivityLog() {
        // Required by JPA
    }

    public ActivityLog(
            User user,
            String category,
            String activityType,
            BigDecimal quantity,
            String unit,
            BigDecimal co2eKg,
            LocalDate logDate) {
        this.user = user;
        this.category = category;
        this.activityType = activityType;
        this.quantity = quantity;
        this.unit = unit;
        this.co2eKg = co2eKg;
        this.logDate = logDate;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getCategory() {
        return category;
    }

    public String getActivityType() {
        return activityType;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public String getUnit() {
        return unit;
    }

    public BigDecimal getCo2eKg() {
        return co2eKg;
    }

    public LocalDate getLogDate() {
        return logDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
