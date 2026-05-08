package com.cj.restaurantbook.site_settings.presentation.dto;

import com.cj.restaurantbook.site_settings.domain.SiteSetting;

import java.time.Instant;

public record SiteSettingResponse(
        String heroImageUrl,
        String introTitle,
        String introSubtitle,
        Boolean headerNavVisible,
        Instant updatedAt
) {
    public static SiteSettingResponse from(SiteSetting s) {
        return new SiteSettingResponse(
                s.getHeroImageUrl(),
                s.getIntroTitle(),
                s.getIntroSubtitle(),
                s.isHeaderNavVisible(),
                s.getUpdatedAt()
        );
    }
}
