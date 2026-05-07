package com.cj.restaurantbook.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "AUTH_001", "이미 사용 중인 이메일입니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "AUTH_002", "사용자를 찾을 수 없습니다."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "AUTH_003", "이메일 또는 비밀번호가 올바르지 않습니다."),
    ACCOUNT_INACTIVE(HttpStatus.FORBIDDEN, "AUTH_004", "비활성화된 계정입니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH_005", "유효하지 않은 토큰입니다."),
    INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH_006", "유효하지 않은 리프레시 토큰입니다."),
    INVALID_EMAIL_CODE(HttpStatus.BAD_REQUEST, "AUTH_007", "이메일 인증코드가 올바르지 않습니다."),
    EMAIL_CODE_EXPIRED(HttpStatus.BAD_REQUEST, "AUTH_008", "이메일 인증코드가 만료되었습니다."),
    EMAIL_NOT_VERIFIED(HttpStatus.FORBIDDEN, "AUTH_009", "이메일 인증이 필요합니다."),
    MAIL_NOT_CONFIGURED(HttpStatus.SERVICE_UNAVAILABLE, "AUTH_010", "이메일 발송 설정이 필요합니다."),
    ROLE_NOT_FOUND(HttpStatus.NOT_FOUND, "ROLE_001", "롤을 찾을 수 없습니다."),
    ROLE_CODE_DUPLICATE(HttpStatus.CONFLICT, "ROLE_002", "이미 존재하는 롤 코드입니다."),
    ROLE_SYSTEM_READONLY(HttpStatus.BAD_REQUEST, "ROLE_003", "시스템 롤은 수정할 수 없습니다."),
    ROLE_IN_USE(HttpStatus.CONFLICT, "ROLE_004", "해당 롤을 사용 중인 유저가 있어 삭제할 수 없습니다."),
    PERMISSION_NOT_FOUND(HttpStatus.NOT_FOUND, "PERM_001", "권한을 찾을 수 없습니다."),
    PERMISSION_CODE_DUPLICATE(HttpStatus.CONFLICT, "PERM_002", "이미 존재하는 권한 코드입니다."),
    PERMISSION_CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "PCAT_001", "권한 카테고리를 찾을 수 없습니다."),
    PERMISSION_CATEGORY_CODE_DUPLICATE(HttpStatus.CONFLICT, "PCAT_002", "이미 존재하는 카테고리 코드입니다."),
    PERMISSION_CATEGORY_IN_USE(HttpStatus.CONFLICT, "PCAT_003", "해당 카테고리를 사용 중인 권한이 있어 삭제할 수 없습니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "COMMON_002", "접근 권한이 없습니다."),
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "COMMON_001", "입력값이 올바르지 않습니다."),
    UPLOAD_NOT_CONFIGURED(HttpStatus.SERVICE_UNAVAILABLE, "UPLOAD_001", "파일 업로드(S3)가 설정되지 않았습니다."),
    UPLOAD_INVALID_CONTENT_TYPE(HttpStatus.BAD_REQUEST, "UPLOAD_002", "허용되지 않은 파일 형식입니다."),
    SITE_SETTING_NOT_FOUND(HttpStatus.NOT_FOUND, "SITE_001", "사이트 설정을 찾을 수 없습니다."),
    NAVIGATION_MENU_NOT_FOUND(HttpStatus.NOT_FOUND, "NAV_MENU_001", "내비게이션 메뉴를 찾을 수 없습니다."),
    NAVIGATION_MENU_CODE_DUPLICATE(HttpStatus.CONFLICT, "NAV_MENU_002", "이미 존재하는 내비게이션 메뉴 코드입니다."),
    NAVIGATION_MENU_PARENT_NOT_FOUND(HttpStatus.NOT_FOUND, "NAV_MENU_003", "부모 내비게이션 메뉴를 찾을 수 없습니다."),
    SALE_MENU_NOT_FOUND(HttpStatus.NOT_FOUND, "SALE_MENU_001", "판매 메뉴를 찾을 수 없습니다."),
    SALE_MENU_CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "SALE_MENU_002", "판매 메뉴 카테고리를 찾을 수 없습니다."),
    SALE_MENU_INVALID_PRICE(HttpStatus.BAD_REQUEST, "SALE_MENU_003", "판매 메뉴 가격이 올바르지 않습니다."),
    SALE_MENU_CATEGORY_IN_USE(HttpStatus.CONFLICT, "SALE_MENU_004", "해당 카테고리를 사용 중인 판매 메뉴가 있어 삭제할 수 없습니다."),
    SALE_MENU_SET_NOT_FOUND(HttpStatus.NOT_FOUND, "SALE_MENU_SET_001", "세트 메뉴를 찾을 수 없습니다."),
    SALE_MENU_SET_INVALID_PRICE(HttpStatus.BAD_REQUEST, "SALE_MENU_SET_002", "세트 메뉴 가격이 올바르지 않습니다."),
    SALE_MENU_SET_EMPTY_ITEMS(HttpStatus.BAD_REQUEST, "SALE_MENU_SET_003", "세트 메뉴 구성 품목은 최소 1개 이상이어야 합니다."),
    SALE_MENU_SET_ITEM_INVALID(HttpStatus.BAD_REQUEST, "SALE_MENU_SET_004", "세트 메뉴 구성 품목이 올바르지 않습니다."),
    SALE_MENU_SET_NOT_ORDERABLE(HttpStatus.BAD_REQUEST, "SALE_MENU_SET_005", "주문할 수 없는 세트 메뉴입니다."),
    ORDER_EMPTY_ITEMS(HttpStatus.BAD_REQUEST, "ORDER_001", "주문 상품을 1개 이상 선택해주세요."),
    ORDER_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "ORDER_002", "주문 상품을 찾을 수 없습니다."),
    ORDER_ITEM_NOT_ORDERABLE(HttpStatus.BAD_REQUEST, "ORDER_003", "주문할 수 없는 상품입니다."),
    ORDER_ITEM_INVALID_QUANTITY(HttpStatus.BAD_REQUEST, "ORDER_004", "주문 수량이 올바르지 않습니다."),
    ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "ORDER_005", "주문을 찾을 수 없습니다."),
    ORDER_CANCEL_NOT_ALLOWED(HttpStatus.CONFLICT, "ORDER_006", "주문 접수 대기 상태에서만 취소할 수 있습니다."),
    ORDER_TABLE_MISMATCH(HttpStatus.FORBIDDEN, "ORDER_007", "테이블 정보가 일치하지 않습니다."),
    ORDER_STATUS_TRANSITION_NOT_ALLOWED(HttpStatus.CONFLICT, "ORDER_008", "현재 주문 상태에서는 처리할 수 없습니다."),
    PAYMENT_ALREADY_EXISTS(HttpStatus.CONFLICT, "PAYMENT_001", "이미 결제 완료된 주문입니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "COMMON_999", "서버 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String code;
    private final String message;
}
