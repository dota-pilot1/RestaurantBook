package com.cj.restaurantbook.board.infrastructure;

import com.cj.restaurantbook.board.domain.Board;
import com.cj.restaurantbook.board.domain.BoardStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BoardRepository extends JpaRepository<Board, Long> {

    @Query("""
            select b from Board b
            where b.boardConfig.code = :code
              and b.boardConfig.active = true
              and b.deletedAt is null
              and b.status = com.cj.restaurantbook.board.domain.BoardStatus.PUBLISHED
            order by b.pinned desc,
                     case when b.pinnedOrder is null then 1 else 0 end asc,
                     b.pinnedOrder asc,
                     b.createdAt desc
            """)
    Page<Board> findVisibleByCode(@Param("code") String code, Pageable pageable);

    @Query("""
            select b from Board b
            where b.boardConfig.code = :code
              and b.deletedAt is null
            order by b.pinned desc,
                     case when b.pinnedOrder is null then 1 else 0 end asc,
                     b.pinnedOrder asc,
                     b.createdAt desc
            """)
    Page<Board> findAdminByCode(@Param("code") String code, Pageable pageable);

    Optional<Board> findByIdAndDeletedAtIsNull(Long id);

    @Query("""
            select count(b) from Board b
            where b.boardConfig.code = 'inquiry'
              and b.deletedAt is null
              and b.answered = false
              and b.status = com.cj.restaurantbook.board.domain.BoardStatus.PUBLISHED
            """)
    long countUnansweredInquiries();

    long countByBoardConfigCodeAndDeletedAtIsNull(String code);

    @Query("""
            select coalesce(max(b.pinnedOrder), -1) from Board b
            where b.boardConfig.code = :code
              and b.deletedAt is null
              and b.pinned = true
            """)
    int maxPinnedOrderByCode(@Param("code") String code);
}
