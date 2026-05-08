package com.cj.restaurantbook.board.presentation.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateBoardCommentRequest(@NotBlank String content) {}
