package com.cj.restaurantbook.board.presentation.dto;

import com.cj.restaurantbook.board.domain.BoardStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateBoardRequest(
        @NotBlank @Size(max = 500) String title,
        @NotBlank String content,
        BoardStatus status
) {}
