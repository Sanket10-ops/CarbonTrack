
package com.CarbonTrack.backend.repository;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface DateEmissionProjection {

    LocalDate getLogDate();

    BigDecimal getTotalEmissions();
}
