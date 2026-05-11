package com.cj.restaurantbook.site_settings.presentation.dto;

import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateSiteSettingRequest(
        @Size(max = 1024)
        String heroImageUrl,

        List<@Size(max = 1024) String> heroImageUrls,

        @Size(max = 200)
        String introTitle,

        @Size(max = 500)
        String introSubtitle,

        Boolean headerNavVisible
) {}
