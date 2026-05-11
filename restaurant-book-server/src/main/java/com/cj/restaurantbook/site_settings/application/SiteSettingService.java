package com.cj.restaurantbook.site_settings.application;

import com.cj.restaurantbook.site_settings.domain.SiteSetting;
import com.cj.restaurantbook.site_settings.infrastructure.SiteSettingRepository;
import com.cj.restaurantbook.site_settings.presentation.dto.SiteSettingResponse;
import com.cj.restaurantbook.site_settings.presentation.dto.UpdateKioskHeaderNavRequest;
import com.cj.restaurantbook.site_settings.presentation.dto.UpdateSiteSettingRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SiteSettingService {

    private static final String KIOSK_SETTINGS_PASSWORD = "admin123";

    private final SiteSettingRepository repository;

    @Transactional(readOnly = true)
    public SiteSettingResponse get() {
        SiteSetting setting = repository.findById(SiteSetting.SINGLETON_ID)
                .orElseGet(SiteSetting::createDefault);
        return SiteSettingResponse.from(setting);
    }

    @Transactional
    public SiteSettingResponse update(UpdateSiteSettingRequest request) {
        SiteSetting setting = repository.findById(SiteSetting.SINGLETON_ID)
                .orElseGet(() -> repository.save(SiteSetting.createDefault()));
        List<String> heroImageUrls = request.heroImageUrls() != null
                ? request.heroImageUrls()
                : (request.heroImageUrl() == null ? List.of() : List.of(request.heroImageUrl()));
        setting.update(
                heroImageUrls,
                request.introTitle(),
                request.introSubtitle(),
                request.headerNavVisible()
        );
        SiteSetting saved = repository.save(setting);
        return SiteSettingResponse.from(saved);
    }

    @Transactional
    public SiteSettingResponse updateKioskHeaderNav(UpdateKioskHeaderNavRequest request) {
        if (!KIOSK_SETTINGS_PASSWORD.equals(request.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid kiosk settings password");
        }

        SiteSetting setting = repository.findById(SiteSetting.SINGLETON_ID)
                .orElseGet(() -> repository.save(SiteSetting.createDefault()));
        setting.updateHeaderNavVisible(request.headerNavVisible());
        SiteSetting saved = repository.save(setting);
        return SiteSettingResponse.from(saved);
    }
}
