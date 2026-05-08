package com.cj.restaurantbook.config;

import com.cj.restaurantbook.board.domain.BoardConfig;
import com.cj.restaurantbook.board.domain.BoardKind;
import com.cj.restaurantbook.board.infrastructure.BoardConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@Order(5)
@RequiredArgsConstructor
public class BoardConfigSeeder implements ApplicationRunner {

    private final BoardConfigRepository boardConfigRepository;

    private record BoardConfigDef(
            String code,
            BoardKind kind,
            String displayName,
            String description,
            boolean allowCustomerWrite,
            boolean allowComment,
            int sortOrder
    ) {}

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<BoardConfigDef> defs = List.of(
                new BoardConfigDef("notice", BoardKind.NOTICE, "공지사항", "매장 공지와 안내를 게시합니다.", false, false, 0),
                new BoardConfigDef("inquiry", BoardKind.INQUIRY, "문의 게시판", "로그인 사용자가 문의를 남기고 관리자가 답변합니다.", true, true, 1)
        );

        for (BoardConfigDef def : defs) {
            boardConfigRepository.findByCode(def.code()).ifPresentOrElse(
                    existing -> existing.update(
                            def.displayName(),
                            def.description(),
                            def.allowCustomerWrite(),
                            def.allowComment(),
                            true,
                            def.sortOrder()
                    ),
                    () -> {
                        boardConfigRepository.save(BoardConfig.create(
                                def.code(),
                                def.kind(),
                                def.displayName(),
                                def.description(),
                                def.allowCustomerWrite(),
                                def.allowComment(),
                                def.sortOrder()
                        ));
                        log.info("Seeded board config: {}", def.code());
                    }
            );
        }
    }
}
