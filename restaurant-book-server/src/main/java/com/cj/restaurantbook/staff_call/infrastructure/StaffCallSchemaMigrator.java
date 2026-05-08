package com.cj.restaurantbook.staff_call.infrastructure;

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
public class StaffCallSchemaMigrator implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!isPostgres() || !tableExists("staff_calls")) {
            return;
        }

        syncStatusCheckConstraint();
        syncTypeCheckConstraint();
    }

    private void syncStatusCheckConstraint() {
        jdbcTemplate.execute("alter table staff_calls drop constraint if exists staff_calls_status_check");
        jdbcTemplate.execute("""
                alter table staff_calls
                add constraint staff_calls_status_check
                check (status in ('PENDING', 'ACKNOWLEDGED', 'CANCELED'))
                """);
        log.info("Synchronized staff_calls_status_check constraint");
    }

    private void syncTypeCheckConstraint() {
        jdbcTemplate.execute("alter table staff_calls drop constraint if exists staff_calls_type_check");
        jdbcTemplate.execute("""
                alter table staff_calls
                add constraint staff_calls_type_check
                check (type in ('GENERAL', 'REFILL', 'QUESTION', 'PAYMENT', 'OTHER'))
                """);
        log.info("Synchronized staff_calls_type_check constraint");
    }

    private boolean isPostgres() {
        try {
            String database = jdbcTemplate.queryForObject("select version()", String.class);
            return database != null && database.toLowerCase().contains("postgresql");
        } catch (Exception e) {
            log.debug("Skipping staff_call schema migration because database type could not be detected", e);
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
}
