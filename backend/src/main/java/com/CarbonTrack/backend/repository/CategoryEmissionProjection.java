
package com.CarbonTrack.backend.repository;

import java.math.BigDecimal;

public interface CategoryEmissionProjection {

    String getCategory();

    BigDecimal getTotalEmissions();
}
