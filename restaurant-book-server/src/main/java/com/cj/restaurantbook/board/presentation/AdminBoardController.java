package com.cj.restaurantbook.board.presentation;

import com.cj.restaurantbook.auth.security.UserPrincipal;
import com.cj.restaurantbook.board.application.BoardService;
import com.cj.restaurantbook.board.domain.Board;
import com.cj.restaurantbook.board.presentation.dto.BoardCommentResponse;
import com.cj.restaurantbook.board.presentation.dto.BoardDetailResponse;
import com.cj.restaurantbook.board.presentation.dto.BoardSummaryResponse;
import com.cj.restaurantbook.board.presentation.dto.CreateBoardCommentRequest;
import com.cj.restaurantbook.board.presentation.dto.CreateBoardRequest;
import com.cj.restaurantbook.board.presentation.dto.InquiryUnansweredCountResponse;
import com.cj.restaurantbook.board.presentation.dto.UpdateBoardRequest;
import com.cj.restaurantbook.board.presentation.dto.UpdateBoardVisibilityRequest;
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
@RequestMapping("/api/admin/boards")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Boards", description = "관리자 게시글 관리")
public class AdminBoardController {

    private final BoardService boardService;

    @GetMapping("/inquiries/unanswered-count")
    @Operation(summary = "미답변 문의 개수 조회")
    public InquiryUnansweredCountResponse unansweredInquiryCount() {
        return new InquiryUnansweredCountResponse(boardService.countUnansweredInquiries());
    }

    @GetMapping("/{code}")
    @Operation(summary = "관리자 게시글 목록 조회")
    public Page<BoardSummaryResponse> list(@PathVariable String code, Pageable pageable) {
        return boardService.listAdmin(code, pageable).map(BoardSummaryResponse::from);
    }

    @GetMapping("/{code}/{id}")
    @Operation(summary = "관리자 게시글 상세 조회")
    public BoardDetailResponse detail(@PathVariable String code, @PathVariable Long id) {
        return BoardDetailResponse.from(boardService.getByCodeAndId(code, id), true);
    }

    @GetMapping("/{code}/{id}/comments")
    @Operation(summary = "게시글 답변 목록 조회")
    public List<BoardCommentResponse> comments(@PathVariable String code, @PathVariable Long id) {
        return boardService.listComments(code, id).stream()
                .map(BoardCommentResponse::from)
                .toList();
    }

    @PostMapping("/{code}")
    @Operation(summary = "관리자 게시글 작성")
    public ResponseEntity<BoardDetailResponse> create(
            @PathVariable String code,
            @Valid @RequestBody CreateBoardRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Board board = boardService.createByAdmin(code, request, principal.getId(), displayName(principal));
        return ResponseEntity.status(HttpStatus.CREATED).body(BoardDetailResponse.from(board, true));
    }

    @PatchMapping("/{code}/{id}")
    @Operation(summary = "관리자 게시글 수정")
    public BoardDetailResponse update(
            @PathVariable String code,
            @PathVariable Long id,
            @Valid @RequestBody UpdateBoardRequest request
    ) {
        return BoardDetailResponse.from(boardService.updateByAdmin(code, id, request), true);
    }

    @PatchMapping("/{code}/{id}/visibility")
    @Operation(summary = "게시글 노출 상태 변경")
    public ResponseEntity<Void> visibility(
            @PathVariable String code,
            @PathVariable Long id,
            @Valid @RequestBody UpdateBoardVisibilityRequest request
    ) {
        boardService.updateVisibility(code, id, request.visible());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{code}/{id}/pin")
    @Operation(summary = "게시글 고정")
    public ResponseEntity<Void> pin(@PathVariable String code, @PathVariable Long id) {
        boardService.pin(code, id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{code}/{id}/unpin")
    @Operation(summary = "게시글 고정 해제")
    public ResponseEntity<Void> unpin(@PathVariable String code, @PathVariable Long id) {
        boardService.unpin(code, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{code}/{id}/comments")
    @Operation(summary = "관리자 답변 작성")
    public ResponseEntity<BoardCommentResponse> createComment(
            @PathVariable String code,
            @PathVariable Long id,
            @Valid @RequestBody CreateBoardCommentRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(BoardCommentResponse.from(
                boardService.createAdminReply(code, id, request.content(), principal.getId(), displayName(principal))));
    }

    @PatchMapping("/comments/{commentId}")
    @Operation(summary = "관리자 답변 수정")
    public BoardCommentResponse updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody CreateBoardCommentRequest request
    ) {
        return BoardCommentResponse.from(boardService.updateComment(commentId, request.content()));
    }

    @DeleteMapping("/comments/{commentId}")
    @Operation(summary = "관리자 답변 삭제")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {
        boardService.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{code}/{id}")
    @Operation(summary = "관리자 게시글 삭제")
    public ResponseEntity<Void> delete(@PathVariable String code, @PathVariable Long id) {
        boardService.deleteByAdmin(code, id);
        return ResponseEntity.noContent().build();
    }

    private String displayName(UserPrincipal principal) {
        String username = principal.getUsername();
        return username == null || username.isBlank() ? "관리자" : username;
    }
}
