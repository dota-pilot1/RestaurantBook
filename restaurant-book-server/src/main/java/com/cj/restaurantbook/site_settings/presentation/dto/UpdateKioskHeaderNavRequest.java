package com.cj.restaurantbook.site_settings.presentation.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateKioskHeaderNavRequest(
        @NotBlank
        String password,

        boolean headerNavVisible
) {}
