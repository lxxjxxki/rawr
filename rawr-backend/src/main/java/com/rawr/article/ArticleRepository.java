package com.rawr.article;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ArticleRepository extends JpaRepository<Article, UUID> {
    Optional<Article> findBySlugAndDeletedAtIsNull(String slug);
    boolean existsBySlug(String slug);
    Optional<Article> findByInstagramTimestamp(String instagramTimestamp);

    @Query("SELECT a FROM Article a WHERE a.status = :status AND a.deletedAt IS NULL")
    Page<Article> findActiveByStatus(@Param("status") ArticleStatus status, Pageable pageable);

    @Query("SELECT a FROM Article a WHERE a.status = :status AND a.category = :category AND a.deletedAt IS NULL")
    Page<Article> findActiveByStatusAndCategory(@Param("status") ArticleStatus status,
                                                @Param("category") Category category,
                                                Pageable pageable);

    @Query("SELECT a FROM Article a WHERE a.deletedAt IS NOT NULL ORDER BY a.deletedAt DESC")
    List<Article> findAllDeleted();

    @Query("SELECT a FROM Article a WHERE a.deletedAt IS NULL ORDER BY a.updatedAt DESC")
    List<Article> findAllActive();

    @Query("SELECT a FROM Article a WHERE a.status = 'PUBLISHED' AND a.deletedAt IS NULL AND " +
           "(LOWER(a.title) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(a.content) LIKE LOWER(CONCAT('%', :q, '%'))) " +
           "ORDER BY a.publishedAt DESC")
    Page<Article> search(@Param("q") String q, Pageable pageable);
}
