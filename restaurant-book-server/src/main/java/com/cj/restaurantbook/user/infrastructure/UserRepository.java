package com.cj.restaurantbook.user.infrastructure;

import com.cj.restaurantbook.user.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByRoleCode(String code);
    boolean existsByRoleId(Long roleId);
    List<User> findByRoleCode(String code);
    Page<User> findAll(Pageable pageable);
}
