package com.cj.restaurantbook.site_settings.domain;

import jakarta.persistence.Column;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "site_settings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SiteSetting {

    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id;

    @Column(length = 1024)
    private String heroImageUrl;

    @ElementCollection
    @CollectionTable(name = "site_setting_hero_images", joinColumns = @JoinColumn(name = "site_setting_id"))
    @OrderColumn(name = "display_order")
    @Column(name = "image_url", length = 1024, nullable = false)
    private List<String> heroImageUrls = new ArrayList<>();

    @Column(length = 200)
    private String introTitle;

    @Column(length = 500)
    private String introSubtitle;

    @Column
    private Boolean headerNavVisible = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public static SiteSetting createDefault() {
        SiteSetting s = new SiteSetting();
        s.id = SINGLETON_ID;
        s.heroImageUrl = null;
        s.introTitle = "팀을 위한\n깔끔한 인증 보일러플레이트";
        s.introSubtitle =
                "Spring Boot + Next.js 기반. 회원·역할·권한까지 갖춘 스타터 템플릿.";
        s.headerNavVisible = true;
        return s;
    }

    public boolean isHeaderNavVisible() {
        return headerNavVisible == null || headerNavVisible;
    }

    public List<String> getEffectiveHeroImageUrls() {
        if (heroImageUrls != null && !heroImageUrls.isEmpty()) {
            return List.copyOf(heroImageUrls);
        }
        return heroImageUrl == null || heroImageUrl.isBlank() ? List.of() : List.of(heroImageUrl);
    }

    public void update(List<String> heroImageUrls, String introTitle, String introSubtitle, Boolean headerNavVisible) {
        this.heroImageUrls.clear();
        if (heroImageUrls != null) {
            this.heroImageUrls.addAll(heroImageUrls.stream()
                    .filter(url -> url != null && !url.isBlank())
                    .distinct()
                    .toList());
        }
        this.heroImageUrl = this.heroImageUrls.isEmpty() ? null : this.heroImageUrls.get(0);
        if (introTitle != null) {
            this.introTitle = introTitle;
        }
        if (introSubtitle != null) {
            this.introSubtitle = introSubtitle;
        }
        if (headerNavVisible != null) {
            this.headerNavVisible = headerNavVisible;
        }
    }

    public void updateHeaderNavVisible(boolean headerNavVisible) {
        this.headerNavVisible = headerNavVisible;
    }
}
