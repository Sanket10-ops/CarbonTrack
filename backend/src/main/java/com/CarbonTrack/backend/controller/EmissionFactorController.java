
package com.CarbonTrack.backend.controller;

import com.CarbonTrack.backend.entity.EmissionFactor;
import com.CarbonTrack.backend.repository.EmissionFactorRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/emission-factors")
public class EmissionFactorController {

    private final EmissionFactorRepository emissionFactorRepository;

    public EmissionFactorController(
            EmissionFactorRepository emissionFactorRepository) {
        this.emissionFactorRepository = emissionFactorRepository;
    }

    @GetMapping
    public List<EmissionFactor> getAllEmissionFactors() {
        return emissionFactorRepository.findAll();
    }
}
