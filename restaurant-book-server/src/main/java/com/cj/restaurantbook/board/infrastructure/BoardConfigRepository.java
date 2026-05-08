package com.cj.restaurantbook.board.infrastructure;

import com.cj.restaurantbook.board.domain.BoardConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BoardConfigRepository extends JpaRepository<BoardConfig, Long> {
    Optional<BoardConfig> findByCode(String code);
    boolean existsByCode(String code);
    List<BoardConfig> findAllByActiveTrueOrderBySortOrderAscIdAsc();
    List<BoardConfig> findAllByOrderBySortOrderAscIdAsc();
}
