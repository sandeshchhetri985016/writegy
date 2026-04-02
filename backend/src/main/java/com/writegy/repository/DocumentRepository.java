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

    long countByUserId(Long userId);

    /**
     * PERF-002 FIX: Check if startId is an ancestor of targetId using recursive CTE.
     * This replaces the O(N) while loop with a single database round-trip.
     * 
     * @param startId The document to check if it's an ancestor
     * @param targetId The document to check if it's a descendant
     * @return true if startId is an ancestor of targetId
     */
    @Query(value = """
            WITH RECURSIVE ancestors AS (
                SELECT id, parent_id FROM documents WHERE id = :targetId
                UNION ALL
                SELECT d.id, d.parent_id FROM documents d
                INNER JOIN ancestors a ON d.id = a.parent_id
            )
            SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END
            FROM ancestors WHERE id = :startId
            """, nativeQuery = true)
    boolean isAncestorOf(@Param("startId") Long startId, @Param("targetId") Long targetId);
}
