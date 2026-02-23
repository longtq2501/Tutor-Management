package com.tutor_management.backend.modules.document.repository;

import com.tutor_management.backend.modules.document.entity.Folder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FolderRepository extends JpaRepository<Folder, Long> {

    @Query("SELECT f FROM Folder f WHERE f.tutor.id = :tutorId AND f.parent IS NULL ORDER BY f.name ASC")
    List<Folder> findRootFoldersByTutorId(@Param("tutorId") Long tutorId);

    @Query("SELECT f FROM Folder f WHERE f.parent.id = :parentId ORDER BY f.name ASC")
    List<Folder> findByParentId(@Param("parentId") Long parentId);

    @Query("SELECT f FROM Folder f WHERE f.tutor.id = :tutorId ORDER BY f.name ASC")
    List<Folder> findAllByTutorId(@Param("tutorId") Long tutorId);

    Optional<Folder> findByIdAndTutorId(Long id, Long tutorId);
}
