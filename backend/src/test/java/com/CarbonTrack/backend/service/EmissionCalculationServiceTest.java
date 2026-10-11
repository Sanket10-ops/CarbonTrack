
package com.CarbonTrack.backend.service;

import com.CarbonTrack.backend.entity.EmissionFactor;
import com.CarbonTrack.backend.repository.EmissionFactorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class EmissionCalculationServiceTest {

    private EmissionFactorRepository repository;
    private EmissionCalculationService service;

    @BeforeEach
    void setUp() {
        repository = mock(EmissionFactorRepository.class);
        service = new EmissionCalculationService(repository);

        EmissionFactor factor = new EmissionFactor(
                "car_travel",
                "km",
                new BigDecimal("0.192"),
                "Unit test",
                LocalDate.now()
        );

        when(repository.findByActivityTypeAndUnit("car_travel", "km"))
                .thenReturn(Optional.of(factor));
    }

    @ParameterizedTest
    @CsvSource({
            "1, 0.1920",
            "10, 1.9200",
            "100, 19.2000",
            "0, 0.0000",
            "0.5, 0.0960"
    })
    void calculatesEmissionsCorrectly(
            String quantity,
            String expected) {

        BigDecimal result = service.calculateEmissions(
                "car_travel",
                "km",
                new BigDecimal(quantity)
        );

        assertEquals(0, result.compareTo(new BigDecimal(expected)));
        assertEquals(4, result.scale());
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", " "})
    void rejectsBlankOrNullActivityType(String activityType) {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.calculateEmissions(
                        activityType,
                        "km",
                        BigDecimal.ONE
                )
        );
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", " "})
    void rejectsBlankOrNullUnit(String unit) {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.calculateEmissions(
                        "car_travel",
                        unit,
                        BigDecimal.ONE
                )
        );
    }

    @Test
    void rejectsNegativeQuantity() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.calculateEmissions(
                        "car_travel",
                        "km",
                        new BigDecimal("-1")
                )
        );
    }

    @Test
    void rejectsNullQuantity() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.calculateEmissions(
                        "car_travel",
                        "km",
                        null
                )
        );
    }

    @Test
    void rejectsUnknownActivityType() {
        when(repository.findByActivityTypeAndUnit("unknown", "km"))
                .thenReturn(Optional.empty());

        assertThrows(
                IllegalArgumentException.class,
                () -> service.calculateEmissions(
                        "unknown",
                        "km",
                        BigDecimal.ONE
                )
        );
    }

    @Test
    void rejectsUnknownUnit() {
        when(repository.findByActivityTypeAndUnit("car_travel", "miles"))
                .thenReturn(Optional.empty());

        assertThrows(
                IllegalArgumentException.class,
                () -> service.calculateEmissions(
                        "car_travel",
                        "miles",
                        BigDecimal.ONE
                )
        );
    }

    @Test
    void roundsResultToFourDecimalPlaces() {
        EmissionFactor factor = new EmissionFactor(
                "car_travel",
                "km",
                new BigDecimal("0.123456"),
                "Unit test",
                LocalDate.now()
        );

        when(repository.findByActivityTypeAndUnit("car_travel", "km"))
                .thenReturn(Optional.of(factor));

        BigDecimal result = service.calculateEmissions(
                "car_travel",
                "km",
                BigDecimal.ONE
        );

        assertEquals(new BigDecimal("0.1235"), result);
    }

    @Test
    void handlesLargeQuantityWithinDatabasePrecision() {
        BigDecimal quantity = new BigDecimal("99999999.9999");

        BigDecimal result = service.calculateEmissions(
                "car_travel",
                "km",
                quantity
        );

        assertEquals(
                new BigDecimal("19200000.0000"),
                result
        );
    }

    @Test
    void rejectsNullEmissionFactorValue() {
        EmissionFactor factor = new EmissionFactor(
                "car_travel",
                "km",
                null,
                "Unit test",
                LocalDate.now()
        );

        when(repository.findByActivityTypeAndUnit("car_travel", "km"))
                .thenReturn(Optional.of(factor));

        assertThrows(
                IllegalStateException.class,
                () -> service.calculateEmissions(
                        "car_travel",
                        "km",
                        BigDecimal.ONE
                )
        );
    }

    @Test
    void rejectsNegativeEmissionFactorValue() {
        EmissionFactor factor = new EmissionFactor(
                "car_travel",
                "km",
                new BigDecimal("-0.192"),
                "Unit test",
                LocalDate.now()
        );

        when(repository.findByActivityTypeAndUnit("car_travel", "km"))
                .thenReturn(Optional.of(factor));

        assertThrows(
                IllegalStateException.class,
                () -> service.calculateEmissions(
                        "car_travel",
                        "km",
                        BigDecimal.ONE
                )
        );
    }

}
