package com.cj.restaurantbook.auth.presentation.dto;

public record EmailVerifyCodeResponse(
        String verifiedToken,
        long expiresInSec
) {
}
