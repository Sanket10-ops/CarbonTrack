
package com.CarbonTrack.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
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

    @Column(name = "energy_source", length = 50)
    private String energySource;

    @Column(name = "meal_type", length = 50)
    private String mealType;

    @Column(name = "servings", precision = 10, scale = 2)
    private BigDecimal servings;

    @Column(name = "product_category", length = 100)
    private String productCategory;

    @Column(name = "spend_amount", precision = 12, scale = 2)
    private BigDecimal spendAmount;

    @Column(name = "spend_currency", length = 3)
    private String spendCurrency;

    @Column(name = "flight_distance_km", precision = 12, scale = 2)
    private BigDecimal flightDistanceKm;

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
            LocalDate logDate,
            String energySource,
            String mealType,
            BigDecimal servings,
            String productCategory,
            BigDecimal spendAmount,
            String spendCurrency,
            BigDecimal flightDistanceKm) {

        this.user = user;
        this.category = category;
        this.activityType = activityType;
        this.quantity = quantity;
        this.unit = unit;
        this.co2eKg = co2eKg;
        this.logDate = logDate;
        this.energySource = energySource;
        this.mealType = mealType;
        this.servings = servings;
        this.productCategory = productCategory;
        this.spendAmount = spendAmount;
        this.spendCurrency = spendCurrency;
        this.flightDistanceKm = flightDistanceKm;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getCategory() { return category; }
    public String getActivityType() { return activityType; }
    public BigDecimal getQuantity() { return quantity; }
    public String getUnit() { return unit; }
    public BigDecimal getCo2eKg() { return co2eKg; }
    public LocalDate getLogDate() { return logDate; }
    public String getEnergySource() { return energySource; }
    public String getMealType() { return mealType; }
    public BigDecimal getServings() { return servings; }
    public String getProductCategory() { return productCategory; }
    public BigDecimal getSpendAmount() { return spendAmount; }
    public String getSpendCurrency() { return spendCurrency; }
    public BigDecimal getFlightDistanceKm() { return flightDistanceKm; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
