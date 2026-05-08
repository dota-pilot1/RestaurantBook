package com.cj.restaurantbook.user.presentation.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileImageRequest(
        @Size(max = 1000) String profileImageUrl
) {
}
