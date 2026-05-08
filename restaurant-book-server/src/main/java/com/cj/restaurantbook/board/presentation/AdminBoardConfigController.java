package com.cj.restaurantbook.board.presentation;

import com.cj.restaurantbook.board.application.BoardConfigService;
import com.cj.restaurantbook.board.presentation.dto.BoardConfigResponse;
import com.cj.restaurantbook.board.presentation.dto.CreateBoardConfigRequest;
import com.cj.restaurantbook.board.presentation.dto.UpdateBoardConfigRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/board-configs")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Board Configs", description = "관리자 게시판 설정")
public class AdminBoardConfigController {

    private final BoardConfigService boardConfigService;

    @GetMapping
    @Operation(summary = "게시판 설정 목록 조회")
    public List<BoardConfigResponse> list() {
        return boardConfigService.findAll().stream()
                .map(BoardConfigResponse::from)
                .toList();
    }

    @PostMapping
    @Operation(summary = "게시판 설정 생성")
    public ResponseEntity<BoardConfigResponse> create(@Valid @RequestBody CreateBoardConfigRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(BoardConfigResponse.from(boardConfigService.create(request)));
    }

    @PatchMapping("/{code}")
    @Operation(summary = "게시판 설정 수정")
    public BoardConfigResponse update(
            @PathVariable String code,
            @Valid @RequestBody UpdateBoardConfigRequest request
    ) {
        return BoardConfigResponse.from(boardConfigService.update(code, request));
    }

    @DeleteMapping("/{code}")
    @Operation(summary = "게시판 설정 비활성화")
    public ResponseEntity<Void> deactivate(@PathVariable String code) {
        boardConfigService.deactivate(code);
        return ResponseEntity.noContent().build();
    }
}
