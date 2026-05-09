package com.cj.restaurantbook.admin_calendar.infrastructure;

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
public class AdminCalendarSchemaMigrator implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!isPostgres() || !tableExists("admin_calendar_entries") || !tableExists("users")) {
            return;
        }

        addIndexes();
        addForeignKeys();
    }

    private void addIndexes() {
        jdbcTemplate.execute("""
                create index if not exists idx_admin_calendar_entries_date
                on admin_calendar_entries (schedule_date)
                """);
        jdbcTemplate.execute("""
                create index if not exists idx_admin_calendar_entries_date_type
                on admin_calendar_entries (schedule_date, type)
                """);
        log.info("Synchronized admin calendar indexes");
    }

    private void addForeignKeys() {
        jdbcTemplate.execute("""
                alter table admin_calendar_entries
                drop constraint if exists fk_admin_calendar_entries_created_by
                """);
        jdbcTemplate.execute("""
                alter table admin_calendar_entries
                add constraint fk_admin_calendar_entries_created_by
                foreign key (created_by) references users(id) on delete restrict
                """);
        jdbcTemplate.execute("""
                alter table admin_calendar_entries
                drop constraint if exists fk_admin_calendar_entries_updated_by
                """);
        jdbcTemplate.execute("""
                alter table admin_calendar_entries
                add constraint fk_admin_calendar_entries_updated_by
                foreign key (updated_by) references users(id) on delete set null
                """);
        log.info("Synchronized admin calendar foreign keys");
    }

    private boolean isPostgres() {
        try {
            String database = jdbcTemplate.queryForObject("select version()", String.class);
            return database != null && database.toLowerCase().contains("postgresql");
        } catch (Exception e) {
            log.debug("Skipping admin calendar schema migration because database type could not be detected", e);
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
