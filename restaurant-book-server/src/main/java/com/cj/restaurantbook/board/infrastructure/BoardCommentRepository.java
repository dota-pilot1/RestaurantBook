package com.cj.restaurantbook.board.infrastructure;

import com.cj.restaurantbook.board.domain.BoardComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BoardCommentRepository extends JpaRepository<BoardComment, Long> {
    List<BoardComment> findAllByBoardIdAndDeletedAtIsNullOrderByCreatedAtAscIdAsc(Long boardId);
    Optional<BoardComment> findByIdAndDeletedAtIsNull(Long id);
    boolean existsByBoardIdAndAdminReplyTrueAndDeletedAtIsNull(Long boardId);
}
