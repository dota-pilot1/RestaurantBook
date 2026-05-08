package com.cj.restaurantbook.board.presentation;

import com.cj.restaurantbook.auth.security.UserPrincipal;
import com.cj.restaurantbook.board.application.BoardConfigService;
import com.cj.restaurantbook.board.application.BoardService;
import com.cj.restaurantbook.board.domain.Board;
import com.cj.restaurantbook.board.presentation.dto.BoardCommentResponse;
import com.cj.restaurantbook.board.presentation.dto.BoardConfigResponse;
import com.cj.restaurantbook.board.presentation.dto.BoardDetailResponse;
import com.cj.restaurantbook.board.presentation.dto.BoardSummaryResponse;
import com.cj.restaurantbook.board.presentation.dto.CreateBoardCommentRequest;
import com.cj.restaurantbook.board.presentation.dto.CreateBoardRequest;
import com.cj.restaurantbook.board.presentation.dto.UpdateBoardRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/boards")
@PreAuthorize("isAuthenticated()")
@Tag(name = "Boards", description = "로그인 사용자 게시판")
public class BoardController {

    private final BoardService boardService;
    private final BoardConfigService boardConfigService;

    @GetMapping("/configs")
    @Operation(summary = "활성 게시판 목록 조회")
    public List<BoardConfigResponse> configs() {
        return boardConfigService.findActive().stream()
                .map(BoardConfigResponse::from)
                .toList();
    }

    @GetMapping("/{code}")
    @Operation(summary = "게시글 목록 조회")
    public Page<BoardSummaryResponse> list(@PathVariable String code, Pageable pageable) {
        return boardService.listVisible(code, pageable).map(BoardSummaryResponse::from);
    }

    @GetMapping("/{code}/{id}")
    @Operation(summary = "게시글 상세 조회")
    public BoardDetailResponse detail(
            @PathVariable String code,
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Board board = boardService.getVisibleAndIncrementView(code, id);
        return BoardDetailResponse.from(board, boardService.canEdit(board, principal.getId(), principal.getRoleCode()));
    }

    @GetMapping("/{code}/{id}/comments")
    @Operation(summary = "게시글 답변 목록 조회")
    public List<BoardCommentResponse> comments(@PathVariable String code, @PathVariable Long id) {
        return boardService.listComments(code, id).stream()
                .map(BoardCommentResponse::from)
                .toList();
    }

    @PostMapping("/{code}")
    @Operation(summary = "게시글 작성")
    public ResponseEntity<BoardDetailResponse> create(
            @PathVariable String code,
            @Valid @RequestBody CreateBoardRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Board board = boardService.createByMember(code, request, principal.getId(), displayName(principal));
        return ResponseEntity.status(HttpStatus.CREATED).body(BoardDetailResponse.from(board, true));
    }

    @PostMapping("/{code}/{id}/comments")
    @Operation(summary = "게시글 댓글 작성")
    public ResponseEntity<BoardCommentResponse> createComment(
            @PathVariable String code,
            @PathVariable Long id,
            @Valid @RequestBody CreateBoardCommentRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(BoardCommentResponse.from(
                boardService.createComment(code, id, request.content(), principal.getId(), displayName(principal))));
    }

    @PatchMapping("/{code}/{id}")
    @Operation(summary = "게시글 수정")
    public BoardDetailResponse update(
            @PathVariable String code,
            @PathVariable Long id,
            @Valid @RequestBody UpdateBoardRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Board board = boardService.updateByAuthor(code, id, request, principal.getId());
        return BoardDetailResponse.from(board, true);
    }

    @DeleteMapping("/{code}/{id}")
    @Operation(summary = "게시글 삭제")
    public ResponseEntity<Void> delete(
            @PathVariable String code,
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        boardService.deleteByAuthor(code, id, principal.getId());
        return ResponseEntity.noContent().build();
    }

    private String displayName(UserPrincipal principal) {
        String username = principal.getUsername();
        return username == null || username.isBlank() ? "사용자" : username;
    }
}
