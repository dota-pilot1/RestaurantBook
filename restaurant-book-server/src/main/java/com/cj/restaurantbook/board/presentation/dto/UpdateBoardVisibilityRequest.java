package com.cj.restaurantbook.board.presentation.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateBoardVisibilityRequest(@NotNull Boolean visible) {}
