package com.cj.restaurantbook.board.application;

import com.cj.restaurantbook.board.domain.*;
import com.cj.restaurantbook.board.infrastructure.BoardCommentRepository;
import com.cj.restaurantbook.board.infrastructure.BoardConfigRepository;
import com.cj.restaurantbook.board.infrastructure.BoardRepository;
import com.cj.restaurantbook.board.presentation.dto.CreateBoardRequest;
import com.cj.restaurantbook.board.presentation.dto.UpdateBoardRequest;
import com.cj.restaurantbook.common.exception.BusinessException;
import com.cj.restaurantbook.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;
    private final BoardConfigRepository boardConfigRepository;
    private final BoardCommentRepository boardCommentRepository;

    @Transactional(readOnly = true)
    public Page<Board> listVisible(String code, Pageable pageable) {
        return boardRepository.findVisibleByCode(code, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Board> listAdmin(String code, Pageable pageable) {
        return boardRepository.findAdminByCode(code, pageable);
    }

    @Transactional
    public Board getVisibleAndIncrementView(String code, Long id) {
        Board board = getByCodeAndId(code, id);
        if (!board.getBoardConfig().isActive() || board.getStatus() != BoardStatus.PUBLISHED) {
            throw new BusinessException(ErrorCode.BOARD_NOT_FOUND);
        }
        board.incrementView();
        return board;
    }

    @Transactional(readOnly = true)
    public Board getByCodeAndId(String code, Long id) {
        Board board = boardRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));
        if (!board.getBoardConfig().getCode().equals(code)) {
            throw new BusinessException(ErrorCode.BOARD_NOT_FOUND);
        }
        return board;
    }

    @Transactional(readOnly = true)
    public Board getById(Long id) {
        return boardRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public List<BoardComment> listComments(String code, Long boardId) {
        getByCodeAndId(code, boardId);
        return boardCommentRepository.findAllByBoardIdAndDeletedAtIsNullOrderByCreatedAtAscIdAsc(boardId);
    }

    @Transactional(readOnly = true)
    public long countUnansweredInquiries() {
        return boardRepository.countUnansweredInquiries();
    }

    @Transactional
    public Board createByMember(String code, CreateBoardRequest req, Long userId, String userName) {
        BoardConfig config = getConfig(code);
        if (!config.isActive()) {
            throw new BusinessException(ErrorCode.BOARD_CONFIG_NOT_FOUND);
        }
        if (!config.isAllowCustomerWrite()) {
            throw new BusinessException(ErrorCode.BOARD_WRITE_FORBIDDEN);
        }
        return boardRepository.save(Board.create(
                config,
                req.title(),
                req.content(),
                userId,
                userName,
                BoardStatus.PUBLISHED
        ));
    }

    @Transactional
    public Board createByAdmin(String code, CreateBoardRequest req, Long adminId, String adminName) {
        BoardConfig config = getConfig(code);
        return boardRepository.save(Board.create(
                config,
                req.title(),
                req.content(),
                adminId,
                adminName,
                req.status() != null ? req.status() : BoardStatus.PUBLISHED
        ));
    }

    @Transactional
    public Board updateByAuthor(String code, Long id, UpdateBoardRequest req, Long userId) {
        Board board = getByCodeAndId(code, id);
        if (!board.isAuthor(userId)) {
            throw new BusinessException(ErrorCode.BOARD_AUTHOR_REQUIRED);
        }
        board.update(req.title(), req.content(), null);
        return board;
    }

    @Transactional
    public void deleteByAuthor(String code, Long id, Long userId) {
        Board board = getByCodeAndId(code, id);
        if (!board.isAuthor(userId)) {
            throw new BusinessException(ErrorCode.BOARD_AUTHOR_REQUIRED);
        }
        softDelete(board);
    }

    @Transactional
    public Board updateByAdmin(String code, Long id, UpdateBoardRequest req) {
        Board board = getByCodeAndId(code, id);
        board.update(req.title(), req.content(), req.status());
        return board;
    }

    @Transactional
    public void deleteByAdmin(String code, Long id) {
        softDelete(getByCodeAndId(code, id));
    }

    @Transactional
    public void updateVisibility(String code, Long id, boolean visible) {
        Board board = getByCodeAndId(code, id);
        if (visible) {
            board.publish();
        } else {
            board.hide();
        }
    }

    @Transactional
    public void pin(String code, Long id) {
        Board board = getByCodeAndId(code, id);
        int nextOrder = boardRepository.maxPinnedOrderByCode(code) + 1;
        board.pin(nextOrder);
    }

    @Transactional
    public void unpin(String code, Long id) {
        getByCodeAndId(code, id).unpin();
    }

    @Transactional
    public BoardComment createComment(String code, Long boardId, String content, Long userId, String userName) {
        Board board = getByCodeAndId(code, boardId);
        if (!board.getBoardConfig().isActive() || board.getStatus() != BoardStatus.PUBLISHED) {
            throw new BusinessException(ErrorCode.BOARD_NOT_FOUND);
        }
        return boardCommentRepository.save(BoardComment.create(board, userId, userName, content));
    }

    @Transactional
    public BoardComment createAdminReply(String code, Long boardId, String content, Long adminId, String adminName) {
        Board board = getByCodeAndId(code, boardId);
        BoardComment comment = boardCommentRepository.save(BoardComment.createAdminReply(board, adminId, adminName, content));
        if (board.getBoardConfig().getKind() == BoardKind.INQUIRY && !board.isAnswered()) {
            board.markAnswered();
        }
        return comment;
    }

    @Transactional
    public BoardComment updateComment(Long commentId, String content) {
        BoardComment comment = boardCommentRepository.findByIdAndDeletedAtIsNull(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_COMMENT_NOT_FOUND));
        comment.update(content);
        return comment;
    }

    @Transactional
    public void deleteComment(Long commentId) {
        BoardComment comment = boardCommentRepository.findByIdAndDeletedAtIsNull(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_COMMENT_NOT_FOUND));
        Board board = comment.getBoard();
        comment.softDelete();
        if (board.isAnswered()
                && !boardCommentRepository.existsByBoardIdAndAdminReplyTrueAndDeletedAtIsNull(board.getId())) {
            board.markUnanswered();
        }
    }

    public boolean canEdit(Board board, Long userId, String roleCode) {
        return "ROLE_ADMIN".equals(roleCode) || board.isAuthor(userId);
    }

    private BoardConfig getConfig(String code) {
        return boardConfigRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_CONFIG_NOT_FOUND));
    }

    private void softDelete(Board board) {
        board.softDelete();
    }
}
