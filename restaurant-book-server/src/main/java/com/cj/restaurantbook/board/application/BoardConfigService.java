package com.cj.restaurantbook.board.application;

import com.cj.restaurantbook.board.domain.BoardConfig;
import com.cj.restaurantbook.board.infrastructure.BoardConfigRepository;
import com.cj.restaurantbook.board.presentation.dto.CreateBoardConfigRequest;
import com.cj.restaurantbook.board.presentation.dto.UpdateBoardConfigRequest;
import com.cj.restaurantbook.common.exception.BusinessException;
import com.cj.restaurantbook.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BoardConfigService {

    private final BoardConfigRepository boardConfigRepository;

    @Transactional(readOnly = true)
    public List<BoardConfig> findActive() {
        return boardConfigRepository.findAllByActiveTrueOrderBySortOrderAscIdAsc();
    }

    @Transactional(readOnly = true)
    public List<BoardConfig> findAll() {
        return boardConfigRepository.findAllByOrderBySortOrderAscIdAsc();
    }

    @Transactional(readOnly = true)
    public BoardConfig getByCode(String code) {
        return boardConfigRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOARD_CONFIG_NOT_FOUND));
    }

    @Transactional
    public BoardConfig create(CreateBoardConfigRequest req) {
        if (boardConfigRepository.existsByCode(req.code())) {
            throw new BusinessException(ErrorCode.BOARD_CONFIG_CODE_DUPLICATE);
        }
        return boardConfigRepository.save(BoardConfig.create(
                req.code(),
                req.kind(),
                req.displayName(),
                req.description(),
                req.allowCustomerWrite(),
                req.allowComment(),
                req.sortOrder()
        ));
    }

    @Transactional
    public BoardConfig update(String code, UpdateBoardConfigRequest req) {
        BoardConfig config = getByCode(code);
        config.update(
                req.displayName(),
                req.description(),
                req.allowCustomerWrite(),
                req.allowComment(),
                req.active(),
                req.sortOrder()
        );
        return config;
    }

    @Transactional
    public void deactivate(String code) {
        getByCode(code).deactivate();
    }
}
