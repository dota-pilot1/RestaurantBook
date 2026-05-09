# 다국어 기능 적용 for 로그인 페이지

작성일: 2026-05-09

대상:
- `/login`
- `/register` 일부 공유 영역
- 비로그인 헤더의 언어/테마/로그인/회원가입 버튼
- 로그인 페이지에서 호출되는 테이블 선택 모달
- 테스트 계정 영역

## 결론

시연 준비 단계에서는 로그인 페이지 다국어를 먼저 강하게 잡는 것이 맞다.

이유:
- 로그인 페이지는 첫 인상 화면이다.
- 현재 헤더 언어 선택은 이미 노출되어 있어, 언어 전환 후 로그인 폼 일부가 한국어로 남으면 완성도가 바로 낮아 보인다.
- 전체 앱 다국어를 한 번에 끝내기보다, 시연 동선의 시작점인 로그인/회원가입/테이블 선택을 먼저 잠그는 것이 효율적이다.

MVP 목표는 **로그인 화면에서 사용자가 직접 보는 텍스트, 버튼, placeholder, 토스트, validation, aria-label/title까지 4개 언어로 일관되게 전환**되도록 하는 것이다.

지원 언어는 현재 i18n 설정과 동일하게 유지한다.

- `ko`
- `en`
- `ja`
- `zh`

## 현재 상태 요약

이미 있는 구조:

- `restaurant-book-front/src/shared/i18n/index.ts`
- `restaurant-book-front/src/shared/i18n/resources/{ko,en,ja,zh}/auth.ts`
- `restaurant-book-front/src/shared/i18n/resources/{ko,en,ja,zh}/form.ts`
- `restaurant-book-front/src/shared/i18n/resources/{ko,en,ja,zh}/nav.ts`
- `LanguageSelect`
- `AuthLayout`
- `LoginForm`
- `SignupForm`

이미 다국어 처리된 부분:

- 로그인/회원가입 제목과 부제
- 이메일/비밀번호/사용자명 기본 라벨
- 로그인/회원가입 버튼
- 일부 토스트 문구
- zod validation key 기반 `form` namespace 번역
- 비로그인 헤더의 `로그인`, `회원가입`

아직 하드코딩이 남은 주요 영역:

- 로그인 페이지 테이블 선택 라벨/힌트/placeholder
- 고객 로그인 시 테이블 선택 필요 에러
- 테스트 계정 제목, 역할 라벨, 로그인 중 문구, 실패 문구
- 테이블 선택 모달 전체 문구
- `AuthLayout`의 서비스 소개 버튼, hero 이미지 alt
- `LanguageSelect`의 aria-label
- `Header`의 비로그인/공통 테이블 선택 관련 aria-label/title 일부
- 서버 에러 메시지 일부를 그대로 표시하는 흐름

## 구현 범위

### 1차 범위: 시연 전 필수

1. 로그인 페이지 내 모든 고정 문구를 i18n key로 이동
2. 테스트 계정 영역 다국어 처리
3. 테이블 선택 모달 다국어 처리
4. AuthLayout의 `서비스 소개`, 이미지 alt 다국어 처리
5. LanguageSelect 접근성 라벨 다국어 처리
6. 로그인 실패/고객 테이블 미선택 에러 다국어 처리
7. 4개 언어에서 레이아웃 깨짐 확인

### 2차 범위: 여유 있으면

1. `/register`의 인증 코드 안내/토스트/서버 에러 fallback 정리
2. `/about` 페이지 다국어 처리
3. Header fallback 메뉴 한글 label을 i18n key 중심으로 정리
4. 서버 `ErrorCode.message`도 code 기반 클라이언트 번역으로 전환

이번 문서의 구현 기준은 1차 범위다.

## 파일별 작업 계획

### 1. i18n 리소스 확장

파일:

- `restaurant-book-front/src/shared/i18n/resources/ko/auth.ts`
- `restaurant-book-front/src/shared/i18n/resources/en/auth.ts`
- `restaurant-book-front/src/shared/i18n/resources/ja/auth.ts`
- `restaurant-book-front/src/shared/i18n/resources/zh/auth.ts`
- `restaurant-book-front/src/shared/i18n/resources/ko/common.ts`
- `restaurant-book-front/src/shared/i18n/resources/en/common.ts`
- `restaurant-book-front/src/shared/i18n/resources/ja/common.ts`
- `restaurant-book-front/src/shared/i18n/resources/zh/common.ts`

`auth.ts`에 로그인 화면 전용 key를 추가한다.

권장 key:

```ts
tableSelect: "테이블 선택",
tableSelectHint: "이 브라우저에서 사용할 테이블을 선택합니다.",
tableSelectPlaceholder: "테이블을 선택하세요",
tableSelectFallbackPlaceholder: "예: 3번 테이블",
tableRequiredForCustomer: "고객 로그인은 테이블을 먼저 선택해주세요.",
openTablePicker: "전체 테이블 목록에서 선택",
testAccounts: "테스트 계정",
testLoginFailed: "테스트 로그인에 실패했습니다.",
testLoginPending: "로그인...",
testLoginSuccess: "{{role}} 계정으로 로그인되었습니다.",
serviceIntro: "서비스 소개",
heroImageAlt: "RestaurantBook 소개 이미지",
```

테이블 선택 모달용 key:

```ts
tablePickerTitle: "테이블 선택",
tablePickerDescription: "사용할 테이블을 선택하세요.",
tableSearchPlaceholder: "테이블 이름 검색",
tableManage: "테이블 관리",
tableCurrentSelection: "현재 선택",
tableNoSelection: "없음",
tableLoading: "테이블 목록을 불러오는 중...",
tableNoSearchResults: "검색 결과가 없습니다.",
tableEmpty: "등록된 테이블이 없습니다.",
tableTotalCount: "총 {{count}}개",
closeWithEsc: "Esc로 닫기",
close: "닫기",
```

역할 라벨은 `nav.roles`가 이미 있으므로 재사용한다.

```ts
t(`roles.${account.roleCode}`, { ns: "nav" })
```

`common.ts`에는 접근성/공통 버튼으로 쓸 key만 추가한다.

```ts
language: "언어",
theme: "테마",
close: "닫기",
```

`language`, `theme`, `close`는 이미 있으므로 누락 언어만 확인하면 된다.

### 2. `LoginForm.tsx`

파일:

`restaurant-book-front/src/features/auth/login/LoginForm.tsx`

작업:

1. 아래 하드코딩 제거
   - `테이블 선택`
   - `이 브라우저에서 사용할 테이블을 선택합니다.`
   - `테이블을 선택하세요`
   - `전체 테이블 목록에서 선택`
   - `예: 3번 테이블`
   - `고객 로그인은 테이블을 먼저 선택해주세요.`
2. `useTranslation("auth")`를 이미 쓰고 있으므로 `t("...")`로 치환
3. `aria-label`, `title`도 번역 key 사용
4. 서버 에러 중 `AUTH_003`, `AUTH_004`는 가능하면 code 기반 번역 우선

권장 처리:

```tsx
setFormError(t("tableRequiredForCustomer"));
```

서버 에러는 단계적으로 처리한다.

```tsx
if (apiError?.code === "AUTH_003") {
  setError("password", { type: "server", message: t("invalidCredentials") });
}
```

### 3. `TestLoginButtons.tsx`

파일:

`restaurant-book-front/src/features/auth/test-login/TestLoginButtons.tsx`

작업:

1. `useTranslation(["auth", "nav"])` 또는 `useTranslation("auth")` + `t(..., { ns: "nav" })` 사용
2. `테스트 계정` → `t("testAccounts")`
3. 버튼 라벨은 `account.label` 대신 `nav.roles.${roleCode}` 사용
4. pending 문구 `로그인...` → `t("testLoginPending")`
5. 성공 토스트 → `t("testLoginSuccess", { role: roleLabel })`
6. 고객 테이블 미선택 에러 → `t("tableRequiredForCustomer")`
7. 실패 fallback → `t("testLoginFailed")`

`testAccounts.ts`의 `label`은 남겨도 되지만, UI 표시는 i18n role label을 우선한다.

### 4. `TablePickerDialog.tsx`

파일:

`restaurant-book-front/src/features/table-picker/TablePickerDialog.tsx`

작업:

1. `useTranslation("auth")` 추가
2. 모달 제목/설명/검색 placeholder/현재 선택/없음/로딩/빈 상태/총 N개/Esc 안내 다국어 처리
3. `aria-label`, `title`도 다국어 처리
4. count interpolation 사용

예:

```tsx
<span>{t("tableTotalCount", { count: tables.length })}</span>
```

중국어/일본어에서 `Esc` 표기는 그대로 둔다.

### 5. `AuthLayout.tsx`

파일:

`restaurant-book-front/src/shared/ui/AuthLayout.tsx`

작업:

1. `서비스 소개` → `t("serviceIntro")`
2. hero image alt `대문 이미지` → `t("heroImageAlt")`
3. `RestaurantBook` 브랜드명은 번역하지 않는다.
4. 현재 hero image 자체에 한국어가 박혀 있으면 시연에서 언어 전환 시 어색할 수 있다. 당장 이미지를 언어별로 만들지 않을 거면, 텍스트가 적은 이미지나 언어 중립 이미지를 쓰는 것을 권장한다.

### 6. `LanguageSelect.tsx`

파일:

`restaurant-book-front/src/shared/ui/LanguageSelect.tsx`

작업:

1. `useTranslation("common")` 사용
2. `aria-label="Language"` → `aria-label={t("language")}`
3. 필요하면 버튼 `title={t("language")}` 추가

시연 중 스크린리더까지 보여주지는 않더라도, 접근성 문구까지 처리하면 하드코딩 점검에서 깔끔하다.

### 7. `Header.tsx`

파일:

`restaurant-book-front/src/widgets/header/ui/Header.tsx`

로그인 페이지에서 비로그인 상태로 보이는 부분은 이미 대부분 `nav.login`, `nav.register`를 쓴다.

추가 점검:

- 로그인/회원가입 버튼은 현재 정상
- `LanguageSelect`, `ThemeSwitcher` 접근성 문구 확인
- 인증 상태에서만 보이는 테이블 변경 버튼은 이번 1차 범위에서는 필수 아님
- 다만 로그인 직후 시연까지 자연스럽게 보려면 `테이블 변경`, `테이블 선택`, `전체 테이블 목록에서 선택`도 key로 이동 권장

### 8. `form` namespace 검증

파일:

- `restaurant-book-front/src/shared/lib/validation/auth.schema.ts`
- `restaurant-book-front/src/shared/ui/FormField.tsx`
- `restaurant-book-front/src/shared/i18n/resources/{ko,en,ja,zh}/form.ts`

현재 구조는 좋다.

- zod schema는 message에 번역 key를 넣음
- `FormField`가 `form` namespace로 번역

추가 작업:

- 로그인 페이지에서 새 validation key를 만들지 않는 한 수정 없음
- 서버 에러 메시지를 zod field error로 직접 넣을 때는 이미 번역된 문구를 넣을지, code key를 넣을지 일관성 있게 결정

시연 안정성 기준으로는 **클라이언트에서 아는 서버 에러 code는 즉시 번역된 auth 문구로 바꿔 넣는 방식**이 가장 안전하다.

## 번역 품질 기준

### 한국어

- 기존 문구 유지
- 너무 개발자스러운 표현은 피함
- 예: `고객 로그인은 테이블을 먼저 선택해주세요.`

### 영어

- 짧고 UI에 맞게
- 예: `Select a table first for customer login.`

### 일본어

- 정중하지만 길지 않게
- 예: `顧客ログインの前にテーブルを選択してください。`

### 중국어

- 간체 기준
- 예: `顾客登录前请先选择桌号。`

## 레이아웃 주의

언어별 텍스트 길이 차이 때문에 다음 영역을 확인한다.

1. 테스트 계정 버튼 5개
   - 영어 `Manager`, `Customer`는 괜찮음
   - 일본어 `マネージャー`가 길 수 있음
   - 버튼은 `text-xs`, 필요하면 `truncate` 추가
2. 테이블 선택 placeholder
   - 영어가 길어질 수 있으므로 SelectInput 내부 overflow 확인
3. `서비스 소개` 버튼
   - 영어 `About Service` 정도로 짧게 유지
4. 모달 하단 `총 N개`, `Esc로 닫기`
   - 좌우 배치가 모바일에서 겹치면 `flex-wrap` 또는 세로 배치

## QA 시나리오

### 기본 언어 전환

1. `/login` 진입
2. KO 확인
3. EN 선택
4. 로그인 페이지 전체 문구가 영어로 전환
5. JA 선택
6. 일본어 문구로 전환
7. ZH 선택
8. 중국어 문구로 전환
9. 새로고침 후 선택 언어 유지

### 로그인 폼

1. 이메일 비움 → email required 번역 확인
2. 이메일 형식 오류 → email invalid 번역 확인
3. 비밀번호 비움 → password required 번역 확인
4. 잘못된 계정 → invalid credentials 번역 확인
5. 고객 테스트 계정 클릭 전 테이블 미선택 → table required 번역 확인

### 테이블 선택

1. 테이블 select placeholder 번역 확인
2. grid 버튼 title/aria-label 번역 확인
3. 테이블 선택 모달 열기
4. 제목/설명/search placeholder/current/empty/loading/footer 번역 확인
5. 검색 결과 없음 상태 번역 확인
6. Esc 닫기 동작 유지

### 테스트 계정

1. `테스트 계정` 제목 번역 확인
2. 역할 버튼 라벨이 언어별 role label로 표시되는지 확인
3. pending 상태 문구 번역 확인
4. 성공 toast 번역 확인
5. 실패 fallback 번역 확인

### 회원가입 공유 영역

1. `/register` 진입
2. AuthLayout의 서비스 소개/hero alt/placeholder 번역 확인
3. 기존 회원가입 form 문구 회귀 없음

## 구현 순서

1. `auth.ts` 4개 언어에 login/table/test key 추가
2. `LoginForm.tsx` 하드코딩 제거
3. `TestLoginButtons.tsx` role label과 toast 다국어 처리
4. `TablePickerDialog.tsx` 다국어 처리
5. `AuthLayout.tsx` 서비스 소개/alt 다국어 처리
6. `LanguageSelect.tsx` aria-label 다국어 처리
7. 필요하면 `Header.tsx`의 공통 테이블 버튼 문구도 처리
8. `npm run lint`
9. 브라우저에서 4개 언어 시나리오 확인

## 검증 명령

```bash
cd /Users/terecal/RestaurantBook/restaurant-book-front
npm run lint
```

브라우저 확인:

```text
http://localhost:4200/login
http://localhost:4200/register
```

## 완료 기준

- `/login`에서 보이는 고정 한국어 문구가 없음
- 언어 선택 후 즉시 로그인 폼, 테스트 계정, 테이블 선택, 모달 문구가 전환됨
- 새로고침 후 선택 언어 유지
- validation/error/toast가 4개 언어로 표시됨
- 테스트 계정 버튼과 모달이 모바일 폭에서 깨지지 않음
- `npm run lint` 통과

## 후속 작업

로그인 페이지 시연 품질이 잡힌 뒤 다음 순서로 확장한다.

1. `/about` 페이지 다국어 처리
2. `/register` 세부 에러와 인증 코드 문구 보강
3. `/guide`의 ja/zh 실제 번역 채우기
4. 관리자 메가메뉴 description 다국어 처리
5. 서버 ErrorCode message를 code 기반 클라이언트 번역으로 전환
