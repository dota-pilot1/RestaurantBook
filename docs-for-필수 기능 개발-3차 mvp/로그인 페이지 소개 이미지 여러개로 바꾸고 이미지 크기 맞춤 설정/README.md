# 로그인 페이지 소개 이미지 다중화 및 크기 맞춤 설정

## 목표

로그인/회원가입 화면 왼쪽 소개 이미지를 여러 장 등록할 수 있게 만들고, 로그인 화면에서는 슬라이드로 넘길 수 있게 한다.

기존 소개 제목/소개 문구는 더 이상 필요하지 않으므로 관리자 설정 화면에서 제거한다.

## 최종 방향

이미지 표시 문제는 세 가지 요구가 서로 충돌한다.

- 이미지 전체를 보이게 하기
- 여백 없이 영역을 꽉 채우기
- 슬라이드 영역 높이를 항상 고정하기

서로 다른 비율의 원본 이미지를 그대로 쓰면 세 조건을 동시에 만족할 수 없다. 따라서 최종 정책은 아래처럼 정한다.

- 로그인 이미지 영역은 고정 비율 `16:11`으로 둔다.
- 로그인 화면 표시는 `background-size: cover`와 `background-position: center`로 풀커버 처리한다.
- 새로 업로드하는 이미지는 브라우저에서 `1600x1100` WebP로 센터 크롭/리사이즈해서 저장한다.
- 기존 단일 이미지 필드 `heroImageUrl`은 첫 번째 이미지로 유지해 하위 호환성을 보장한다.
- 실제 다중 이미지는 `heroImageUrls` 배열로 관리한다.

## 핵심 CSS 원칙

로그인 슬라이더는 Next `Image`의 `object-fit` 대신 CSS background 풀커버 방식을 사용한다.

```tsx
<motion.div
  className="absolute inset-0"
  style={{
    backgroundImage: `url("${activeHeroImageUrl}")`,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
  }}
/>
```

슬라이더 프레임은 고정 비율이다.

```tsx
className="relative aspect-[16/11] w-full overflow-hidden rounded-xl ..."
```

이 조합은 영역 높이를 고정하고, 여백 없이 꽉 채운다. 원본 비율이 다르면 가장자리 일부가 잘릴 수 있으므로 업로드 시점에 `16:11`으로 정규화한다.

## 업로드 정규화

관리자 메인 설정 화면에서 이미지 파일을 선택하면 원본을 그대로 업로드하지 않는다.

`SiteSettingsForm.tsx`에서 다음 처리를 수행한다.

- 이미지 파일을 브라우저 `img.decode()`로 로드한다.
- 목표 비율 `1600 / 1100 = 16:11`에 맞춰 중앙 기준 crop 영역을 계산한다.
- `canvas.drawImage()`로 `1600x1100` 캔버스에 그린다.
- `canvas.toBlob("image/webp", 0.9)`로 WebP 파일을 만든다.
- 변환된 파일을 기존 `uploadImage(file, "site")` 경로로 업로드한다.

이후 로그인 화면에서는 모든 신규 이미지가 같은 규격이므로 슬라이드마다 높이나 여백이 달라지는 문제가 사라진다.

## 변경 파일

프론트엔드:

- `restaurant-book-front/src/features/site-settings/SiteSettingsForm.tsx`
  - 소개 제목/소개 문구 입력 제거
  - 이미지 다중 업로드
  - 이미지 개별 삭제
  - 업로드 전 `1600x1100` WebP 정규화
  - 관리자 미리보기/썸네일 `16:11` 기준으로 표시

- `restaurant-book-front/src/shared/ui/AuthLayout.tsx`
  - `heroImageUrls` 배열 기반 슬라이더
  - 이전/다음 버튼
  - 하단 dot indicator
  - `framer-motion` 기반 좌우 슬라이드 전환
  - 로그인 이미지 프레임 `aspect-[16/11]`
  - CSS background `cover` 풀커버 표시

- `restaurant-book-front/src/entities/site-setting/model/types.ts`
  - `heroImageUrls: string[]` 추가

- `restaurant-book-front/src/entities/site-setting/api/siteSettingApi.ts`
  - update body에 `heroImageUrls` 추가
  - 소개 문구 필드는 optional 처리

백엔드:

- `restaurant-book-server/src/main/java/com/cj/restaurantbook/site_settings/domain/SiteSetting.java`
  - `@ElementCollection` 기반 `heroImageUrls` 추가
  - 기존 `heroImageUrl`은 첫 번째 이미지로 유지
  - `getEffectiveHeroImageUrls()`로 기존 단일 이미지 fallback 제공

- `restaurant-book-server/src/main/java/com/cj/restaurantbook/site_settings/presentation/dto/SiteSettingResponse.java`
  - `heroImageUrls` 응답 추가

- `restaurant-book-server/src/main/java/com/cj/restaurantbook/site_settings/presentation/dto/UpdateSiteSettingRequest.java`
  - `heroImageUrls` 요청 추가
  - 소개 제목/문구 필수 검증 제거

- `restaurant-book-server/src/main/java/com/cj/restaurantbook/site_settings/application/SiteSettingService.java`
  - 배열 요청 우선 처리
  - 기존 `heroImageUrl` 단일 요청 fallback 유지

## 운영 규칙

기존에 이미 업로드된 이미지는 원본 파일 자체가 정규화되어 있지 않으므로, 화면에서 완전히 동일하게 보이지 않을 수 있다.

완전히 안정적인 결과를 얻으려면 기존 이미지를 삭제하고 다시 업로드한다. 다시 업로드되는 시점부터 `1600x1100` 규격으로 변환되어 저장된다.

## 검증

프론트:

```bash
cd /Users/terecal/RestaurantBook/restaurant-book-front
npm run build
npm run lint
```

백엔드:

```bash
cd /Users/terecal/RestaurantBook/restaurant-book-server
./gradlew test
```

확인할 화면:

- `/site-settings`
  - 이미지 여러 장 추가 가능
  - 등록 개수 표시
  - 개별 이미지 삭제 가능
  - 소개 제목/소개 문구 입력이 없어야 함

- `/login`
  - 이미지가 2장 이상이면 좌우 버튼과 dot indicator 표시
  - 이미지 영역 높이가 슬라이드마다 변하지 않아야 함
  - 이미지가 영역을 풀커버로 채워야 함
