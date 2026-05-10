package com.cj.restaurantbook.payment.infrastructure;

import com.cj.restaurantbook.payment.domain.PaymentRefund;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRefundRepository extends JpaRepository<PaymentRefund, Long> {
}
