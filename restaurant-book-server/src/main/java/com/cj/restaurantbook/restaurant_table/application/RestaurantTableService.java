package com.cj.restaurantbook.restaurant_table.application;

import com.cj.restaurantbook.common.exception.BusinessException;
import com.cj.restaurantbook.common.exception.ErrorCode;
import com.cj.restaurantbook.restaurant_table.domain.RestaurantTable;
import com.cj.restaurantbook.restaurant_table.infrastructure.RestaurantTableRepository;
import com.cj.restaurantbook.restaurant_table.presentation.dto.CreateRestaurantTableRequest;
import com.cj.restaurantbook.restaurant_table.presentation.dto.RestaurantTableResponse;
import com.cj.restaurantbook.restaurant_table.presentation.dto.UpdateRestaurantTableRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RestaurantTableService {

    private final RestaurantTableRepository tableRepository;

    @Transactional(readOnly = true)
    public List<RestaurantTableResponse> findAll() {
        return tableRepository.findAllOrdered().stream()
                .map(RestaurantTableResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RestaurantTableResponse> findAllActive() {
        return tableRepository.findAllOrdered().stream()
                .filter(RestaurantTable::isActive)
                .map(RestaurantTableResponse::from)
                .toList();
    }

    @Transactional
    public RestaurantTableResponse create(CreateRestaurantTableRequest req) {
        if (tableRepository.existsByName(req.name())) {
            throw new BusinessException(ErrorCode.TABLE_NAME_DUPLICATE);
        }
        RestaurantTable table = RestaurantTable.create(req.name(), req.active(), req.displayOrder());
        return RestaurantTableResponse.from(tableRepository.save(table));
    }

    @Transactional
    public RestaurantTableResponse update(Long id, UpdateRestaurantTableRequest req) {
        RestaurantTable table = getById(id);
        if (tableRepository.existsByNameAndIdNot(req.name(), id)) {
            throw new BusinessException(ErrorCode.TABLE_NAME_DUPLICATE);
        }
        table.update(req.name(), req.active(), req.displayOrder());
        return RestaurantTableResponse.from(table);
    }

    @Transactional
    public void delete(Long id) {
        RestaurantTable table = getById(id);
        tableRepository.delete(table);
    }

    @Transactional(readOnly = true)
    public RestaurantTable getById(Long id) {
        return tableRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.TABLE_NOT_FOUND));
    }
}
