package com.tutor_management.backend.modules.support.repository;

import com.tutor_management.backend.modules.support.entity.SupportMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long> {

    List<SupportMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId, Pageable pageable);

    @Modifying
    @Transactional
    @Query("UPDATE SupportMessage m SET m.isRead = true WHERE m.conversationId = :conversationId AND m.isRead = false")
    void markAllAsReadByConversationId(Long conversationId);

    List<SupportMessage> findTop1ByConversationIdOrderByCreatedAtDesc(Long conversationId);
}
