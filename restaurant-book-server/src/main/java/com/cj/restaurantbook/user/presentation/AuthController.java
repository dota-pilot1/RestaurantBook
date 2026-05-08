package com.cj.restaurantbook.user.presentation;

import com.cj.restaurantbook.auth.application.EmailVerificationService;
import com.cj.restaurantbook.auth.presentation.dto.EmailSendCodeRequest;
import com.cj.restaurantbook.auth.presentation.dto.EmailVerifyCodeRequest;
import com.cj.restaurantbook.auth.presentation.dto.EmailVerifyCodeResponse;
import com.cj.restaurantbook.auth.security.UserPrincipal;
import com.cj.restaurantbook.user.application.AuthService;
import com.cj.restaurantbook.user.presentation.dto.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {

    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;

    @PostMapping("/signup")
    public ResponseEntity<TokenResponse> signup(@Valid @RequestBody SignupRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.signup(req));
    }

    @PostMapping("/email/send-code")
    public ResponseEntity<Void> sendEmailCode(@Valid @RequestBody EmailSendCodeRequest req) {
        emailVerificationService.sendSignupCode(req.email());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/email/verify-code")
    public ResponseEntity<EmailVerifyCodeResponse> verifyEmailCode(@Valid @RequestBody EmailVerifyCodeRequest req) {
        String verifiedToken = emailVerificationService.verifySignupCode(req.email(), req.code());
        return ResponseEntity.ok(new EmailVerifyCodeResponse(
                verifiedToken,
                emailVerificationService.getVerifiedTokenTtlSeconds()
        ));
    }

    @GetMapping("/check-email")
    public ResponseEntity<CheckEmailResponse> checkEmail(
            @RequestParam @Email(message = "올바른 이메일 형식이 아닙니다.") String email
    ) {
        return ResponseEntity.ok(new CheckEmailResponse(authService.isEmailAvailable(email)));
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshRequest req) {
        return ResponseEntity.ok(authService.refresh(req));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal UserPrincipal principal) {
        authService.logout(principal.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserSummary> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(authService.me(principal.getId()));
    }

    @PatchMapping("/me/profile-image")
    public ResponseEntity<UserSummary> updateProfileImage(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileImageRequest request
    ) {
        return ResponseEntity.ok(authService.updateProfileImage(principal.getId(), request));
    }
}
