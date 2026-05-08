package com.cj.restaurantbook.staff_call.infrastructure;

import com.cj.restaurantbook.staff_call.domain.StaffCall;
import com.cj.restaurantbook.staff_call.domain.StaffCallStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface StaffCallRepository extends JpaRepository<StaffCall, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<StaffCall> findForUpdateById(Long id);

    List<StaffCall> findByStatusOrderByCreatedAtAscIdAsc(StaffCallStatus status);

    List<StaffCall> findByTableNameAndStatusOrderByCreatedAtAscIdAsc(
            String tableName,
            StaffCallStatus status
    );

    boolean existsByTableNameAndStatusAndCreatedAtGreaterThanEqual(
            String tableName,
            StaffCallStatus status,
            Instant createdAtThreshold
    );

    long countByStatus(StaffCallStatus status);
}
