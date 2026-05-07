package com.cj.restaurantbook.order.infrastructure;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderSchemaMigrator implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!isPostgres() || !tableExists("orders") || !columnExists("orders", "status")) {
            return;
        }

        syncOrderStatusCheckConstraint();
        addCancelMessageColumn();
    }

    private void syncOrderStatusCheckConstraint() {
        jdbcTemplate.execute("alter table orders drop constraint if exists orders_status_check");
        jdbcTemplate.execute("""
                alter table orders
                add constraint orders_status_check
                check (status in ('RECEIVED', 'ACCEPTED', 'COOKING', 'READY', 'COMPLETED', 'CANCELED'))
                """);
        log.info("Synchronized orders_status_check constraint");
    }

    private void addCancelMessageColumn() {
        if (!columnExists("orders", "cancel_message")) {
            jdbcTemplate.execute("alter table orders add column cancel_message varchar(500)");
            log.info("Added orders.cancel_message column");
        }
    }

    private boolean isPostgres() {
        try {
            String database = jdbcTemplate.queryForObject("select version()", String.class);
            return database != null && database.toLowerCase().contains("postgresql");
        } catch (Exception e) {
            log.debug("Skipping order schema migration because database type could not be detected", e);
            return false;
        }
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject("""
                select count(*)
                from information_schema.tables
                where table_schema = current_schema()
                  and table_name = ?
                """, Integer.class, tableName);
        return count != null && count > 0;
    }

    private boolean columnExists(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject("""
                select count(*)
                from information_schema.columns
                where table_schema = current_schema()
                  and table_name = ?
                  and column_name = ?
                """, Integer.class, tableName, columnName);
        return count != null && count > 0;
    }
}
