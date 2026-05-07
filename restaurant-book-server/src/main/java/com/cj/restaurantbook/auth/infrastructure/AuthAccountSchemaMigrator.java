package com.cj.restaurantbook.auth.infrastructure;

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
public class AuthAccountSchemaMigrator implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!isPostgres() || !tableExists("users") || !tableExists("auth_accounts")) {
            return;
        }

        relaxLegacyUserColumns();
        backfillEmailAuthAccounts();
    }

    private boolean isPostgres() {
        try {
            String database = jdbcTemplate.queryForObject("select version()", String.class);
            return database != null && database.toLowerCase().contains("postgresql");
        } catch (Exception e) {
            log.debug("Skipping auth schema migration because database type could not be detected", e);
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

    private void relaxLegacyUserColumns() {
        if (columnExists("users", "email")) {
            jdbcTemplate.execute("alter table users alter column email drop not null");
        }
        if (columnExists("users", "password_hash")) {
            jdbcTemplate.execute("alter table users alter column password_hash drop not null");
        }
    }

    private void backfillEmailAuthAccounts() {
        if (!columnExists("users", "email") || !columnExists("users", "password_hash")) {
            return;
        }
        jdbcTemplate.update("""
                insert into auth_accounts (
                    user_id,
                    provider_type,
                    identifier,
                    password_hash,
                    verified,
                    verified_at,
                    created_at,
                    updated_at
                )
                select
                    u.id,
                    'EMAIL',
                    lower(trim(u.email)),
                    u.password_hash,
                    true,
                    now(),
                    coalesce(u.created_at, now()),
                    coalesce(u.updated_at, now())
                from users u
                where u.email is not null
                  and u.password_hash is not null
                on conflict (provider_type, identifier) do nothing
                """);
    }
}
