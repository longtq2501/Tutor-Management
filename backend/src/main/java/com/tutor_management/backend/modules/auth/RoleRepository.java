package com.tutor_management.backend.modules.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * Repository interface for managing RoleEntity instances.
 * Provides methods to perform CRUD operations and custom queries on the RoleEntity table.
 */
public interface RoleRepository extends JpaRepository<RoleEntity, Long> {
    Optional<RoleEntity> findByName(String name);
}
