package com.tutor_management.backend.modules.support.repository;

import com.tutor_management.backend.modules.support.entity.SupportConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupportConversationRepository extends JpaRepository<SupportConversation, Long> {

    Optional<SupportConversation> findByUserId(Long userId);

    List<SupportConversation> findAllByOrderByLastMessageAtDesc();
}
