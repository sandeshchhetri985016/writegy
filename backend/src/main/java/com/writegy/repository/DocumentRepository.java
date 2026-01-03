package com.writegy.repository;

import com.writegy.model.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByUserId(Long userId);

    // Tree hierarchy methods
    List<Document> findByUserIdAndParentIdIsNullOrderByTreeOrderAsc(Long userId);

    List<Document> findByParentIdOrderByTreeOrderAsc(Long parentId);

    @Query("SELECT d FROM Document d WHERE d.user.id = :userId ORDER BY d.depth, d.treeOrder")
    List<Document> findAllByUserIdOrderByHierarchy(@Param("userId") Long userId);
}
