package com.cj.restaurantbook.common.upload;

import com.cj.restaurantbook.common.exception.BusinessException;
import com.cj.restaurantbook.common.exception.ErrorCode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
@Tag(name = "Upload", description = "S3 업로드용 Presigned URL 발급")
public class UploadController {

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp",
            "image/gif"
    );

    private final UploadService uploadService;

    @PostMapping("/presign")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "이미지 업로드용 Presigned URL 발급")
    public UploadService.PresignResponse presign(@Valid @RequestBody PresignRequest request) {
        if (!ALLOWED_IMAGE_TYPES.contains(request.contentType())) {
            throw new BusinessException(ErrorCode.UPLOAD_INVALID_CONTENT_TYPE);
        }
        return uploadService.presign(request.filename(), request.contentType(), request.folder());
    }

    @PostMapping("/profile-image/presign")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "프로필 이미지 업로드용 Presigned URL 발급")
    public UploadService.PresignResponse presignProfileImage(@Valid @RequestBody ProfileImagePresignRequest request) {
        if (!ALLOWED_IMAGE_TYPES.contains(request.contentType())) {
            throw new BusinessException(ErrorCode.UPLOAD_INVALID_CONTENT_TYPE);
        }
        return uploadService.presign(request.filename(), request.contentType(), "profile-images");
    }

    @PostMapping("/board-image/presign")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "게시판 이미지 업로드용 Presigned URL 발급")
    public UploadService.PresignResponse presignBoardImage(@Valid @RequestBody BoardImagePresignRequest request) {
        if (!ALLOWED_IMAGE_TYPES.contains(request.contentType())) {
            throw new BusinessException(ErrorCode.UPLOAD_INVALID_CONTENT_TYPE);
        }
        return uploadService.presign(request.filename(), request.contentType(), "board");
    }

    public record PresignRequest(
            @NotBlank String filename,
            @NotBlank String contentType,
            String folder
    ) {}

    public record ProfileImagePresignRequest(
            @NotBlank String filename,
            @NotBlank String contentType
    ) {}

    public record BoardImagePresignRequest(
            @NotBlank String filename,
            @NotBlank String contentType
    ) {}
}
