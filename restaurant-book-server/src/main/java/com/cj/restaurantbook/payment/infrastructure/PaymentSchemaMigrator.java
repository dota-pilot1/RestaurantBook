package com.cj.restaurantbook.payment.infrastructure;

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
public class PaymentSchemaMigrator implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!isPostgres() || !tableExists("payments")) {
            return;
        }

        addPaymentProviderColumns();
        syncPaymentMethodConstraint();
        createPaymentOrderTable();
        createPaymentRefundTable();
        backfillLegacyPaymentOrders();
        removeLegacyPaymentOrderIdConstraints();
        addPaymentProviderIndexes();
    }

    private void addPaymentProviderColumns() {
        addColumnIfMissing("payments", "provider", "varchar(20)");
        addColumnIfMissing("payments", "provider_payment_key", "varchar(200)");
        addColumnIfMissing("payments", "provider_order_id", "varchar(100)");
        addColumnIfMissing("payments", "provider_method", "varchar(50)");
        addColumnIfMissing("payments", "receipt_url", "varchar(500)");
        addColumnIfMissing("payments", "approved_at", "timestamp with time zone");
    }

    private void syncPaymentMethodConstraint() {
        if (!columnExists("payments", "method")) {
            return;
        }
        jdbcTemplate.execute("""
                do $$
                declare
                    constraint_name text;
                begin
                    for constraint_name in
                        select c.conname
                        from pg_constraint c
                        where c.conrelid = to_regclass(format('%I.payments', current_schema()))
                          and c.contype = 'c'
                          and pg_get_constraintdef(c.oid) like '%method%'
                    loop
                        execute format('alter table payments drop constraint if exists %I', constraint_name);
                    end loop;
                end $$;
                """);
        jdbcTemplate.execute("""
                alter table payments
                add constraint payments_method_check
                check (method in ('CARD', 'CASH', 'EASY_PAY', 'TRANSFER', 'ETC'))
                """);
    }

    private void createPaymentOrderTable() {
        jdbcTemplate.execute("""
                create table if not exists payment_orders (
                    id bigserial primary key,
                    payment_id bigint not null,
                    order_id bigint not null,
                    amount integer not null,
                    created_at timestamp with time zone not null default now(),
                    constraint fk_payment_orders_payment foreign key (payment_id) references payments(id),
                    constraint fk_payment_orders_order foreign key (order_id) references orders(id),
                    constraint uk_payment_orders_order_id unique (order_id)
                )
                """);
    }

    private void createPaymentRefundTable() {
        jdbcTemplate.execute("""
                create table if not exists payment_refunds (
                    id bigserial primary key,
                    payment_id bigint not null,
                    amount integer not null,
                    reason varchar(500),
                    status varchar(20) not null,
                    provider_refund_id varchar(200),
                    refunded_at timestamp with time zone,
                    handled_by bigint,
                    created_at timestamp with time zone not null default now(),
                    updated_at timestamp with time zone not null default now(),
                    constraint fk_payment_refunds_payment foreign key (payment_id) references payments(id)
                )
                """);
    }

    private void backfillLegacyPaymentOrders() {
        if (!columnExists("payments", "order_id") || !tableExists("payment_orders")) {
            return;
        }
        jdbcTemplate.update("""
                insert into payment_orders (payment_id, order_id, amount, created_at)
                select p.id, p.order_id, p.amount, coalesce(p.created_at, now())
                from payments p
                where p.order_id is not null
                on conflict (order_id) do nothing
                """);
    }

    private void removeLegacyPaymentOrderIdConstraints() {
        if (!columnExists("payments", "order_id")) {
            return;
        }
        jdbcTemplate.execute("""
                do $$
                declare
                    constraint_name text;
                begin
                    for constraint_name in
                        select c.conname
                        from pg_constraint c
                        join pg_attribute a
                          on a.attrelid = c.conrelid
                         and a.attnum = any(c.conkey)
                        where c.conrelid = to_regclass(format('%I.payments', current_schema()))
                          and a.attname = 'order_id'
                          and c.contype in ('f', 'u')
                    loop
                        execute format('alter table payments drop constraint if exists %I', constraint_name);
                    end loop;
                end $$;
                """);
        jdbcTemplate.execute("alter table payments alter column order_id drop not null");
        log.info("Relaxed legacy payments.order_id constraints");
    }

    private void addPaymentProviderIndexes() {
        jdbcTemplate.execute("""
                create unique index if not exists uk_payments_provider_payment_key
                on payments(provider, provider_payment_key)
                where provider is not null and provider_payment_key is not null
                """);
        jdbcTemplate.execute("""
                create unique index if not exists uk_payments_provider_order_id
                on payments(provider, provider_order_id)
                where provider is not null and provider_order_id is not null
                """);
    }

    private void addColumnIfMissing(String tableName, String columnName, String definition) {
        if (!columnExists(tableName, columnName)) {
            jdbcTemplate.execute("alter table " + tableName + " add column " + columnName + " " + definition);
            log.info("Added {}.{} column", tableName, columnName);
        }
    }

    private boolean isPostgres() {
        try {
            String database = jdbcTemplate.queryForObject("select version()", String.class);
            return database != null && database.toLowerCase().contains("postgresql");
        } catch (Exception e) {
            log.debug("Skipping payment schema migration because database type could not be detected", e);
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
