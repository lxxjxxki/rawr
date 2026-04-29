package com.rawr.article;

import com.rawr.article.dto.ArticleRequest;
import com.rawr.subscription.SubscriptionService;
import com.rawr.user.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ArticleServiceTest {

    @Mock ArticleRepository articleRepository;
    @Mock ArticleRevisionRepository revisionRepository;
    @Mock UserRepository userRepository;
    @Mock SubscriptionService subscriptionService;
    @InjectMocks ArticleService articleService;

    User author;

    @BeforeEach
    void setUp() {
        author = new User("author@test.com", "Author", null, OAuthProvider.GOOGLE, "google-123");
        ReflectionTestUtils.setField(author, "id", UUID.randomUUID());
    }

    @Test
    @DisplayName("기사 생성 시 DRAFT 상태로 저장된다")
    void createArticle_savesAsDraft() {
        when(userRepository.findById(any())).thenReturn(Optional.of(author));
        when(articleRepository.existsBySlug(anyString())).thenReturn(false);
        when(articleRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        var request = new ArticleRequest("My Title", "Content here", "cover.jpg", Category.FASHION, null);
        var response = articleService.create(UUID.randomUUID(), request);

        assertThat(response.status()).isEqualTo(ArticleStatus.DRAFT);
        assertThat(response.slug()).isEqualTo("my-title");
        assertThat(response.title()).isEqualTo("My Title");
        assertThat(response.category()).isEqualTo(Category.FASHION);
    }

    @Test
    @DisplayName("기사 발행 시 PUBLISHED 상태로 변경되고 구독자에게 알림이 전송된다")
    void publishArticle_setsPublishedStatusAndNotifiesSubscribers() {
        Article article = new Article("Title", "title", "Content", null, Category.FASHION, author);
        ReflectionTestUtils.setField(article, "id", UUID.randomUUID());
        when(articleRepository.findById(any())).thenReturn(Optional.of(article));
        when(articleRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        doNothing().when(subscriptionService).notifyNewArticle(any());

        var response = articleService.publish(article.getId());

        assertThat(response.status()).isEqualTo(ArticleStatus.PUBLISHED);
        assertThat(response.publishedAt()).isNotNull();
        verify(subscriptionService, times(1)).notifyNewArticle(any());
    }

    @Test
    @DisplayName("발행된 기사를 다시 DRAFT로 되돌릴 수 있다")
    void unpublishArticle_revertsToDraft() {
        Article article = new Article("Title", "title", "Content", null, Category.FASHION, author);
        ReflectionTestUtils.setField(article, "id", UUID.randomUUID());
        article.publish();
        when(articleRepository.findById(any())).thenReturn(Optional.of(article));
        when(articleRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        var response = articleService.unpublish(article.getId());

        assertThat(response.status()).isEqualTo(ArticleStatus.DRAFT);
        assertThat(response.publishedAt()).isNull();
    }

    @Test
    @DisplayName("슬러그 중복 시 숫자를 붙여 유니크하게 만든다")
    void createArticle_duplicateSlug_appendsNumber() {
        when(userRepository.findById(any())).thenReturn(Optional.of(author));
        when(articleRepository.existsBySlug("my-title")).thenReturn(true);
        when(articleRepository.existsBySlug("my-title-2")).thenReturn(false);
        when(articleRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        var request = new ArticleRequest("My Title", "Content", null, Category.FASHION, null);
        var response = articleService.create(UUID.randomUUID(), request);

        assertThat(response.slug()).isEqualTo("my-title-2");
    }

    @Test
    @DisplayName("슬러그가 연속으로 중복될 경우 빈 번호를 찾아 붙인다")
    void createArticle_multipleDuplicateSlugs_appendsCorrectNumber() {
        when(userRepository.findById(any())).thenReturn(Optional.of(author));
        when(articleRepository.existsBySlug("my-title")).thenReturn(true);
        when(articleRepository.existsBySlug("my-title-2")).thenReturn(true);
        when(articleRepository.existsBySlug("my-title-3")).thenReturn(false);
        when(articleRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        var response = articleService.create(UUID.randomUUID(), new ArticleRequest("My Title", "C", null, Category.FASHION, null));

        assertThat(response.slug()).isEqualTo("my-title-3");
    }

    @Test
    @DisplayName("한글 제목은 슬러그 생성 시 ASCII 문자만 남긴다")
    void createArticle_koreanTitle_stripsNonAscii() {
        when(userRepository.findById(any())).thenReturn(Optional.of(author));
        when(articleRepository.existsBySlug(anyString())).thenReturn(false);
        when(articleRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        var response = articleService.create(UUID.randomUUID(),
                new ArticleRequest("패션 트렌드 2026", "Content", null, Category.FASHION, null));

        // Korean characters stripped, only remaining ASCII kept
        assertThat(response.slug()).doesNotContain("패").doesNotContain("션");
    }

    @Test
    @DisplayName("본인 기사만 수정할 수 있다")
    void updateArticle_byNonOwner_throwsForbidden() {
        UUID otherUserId = UUID.randomUUID();
        Article article = new Article("Title", "title", "Content", null, Category.FASHION, author);
        ReflectionTestUtils.setField(article, "id", UUID.randomUUID());
        when(articleRepository.findById(any())).thenReturn(Optional.of(article));

        assertThatThrownBy(() ->
            articleService.update(article.getId(), otherUserId,
                new ArticleRequest("New Title", "New Content", null, Category.FASHION, null))
        ).hasMessageContaining("Not your article");
    }

    @Test
    @DisplayName("존재하지 않는 기사 조회 시 404 예외가 발생한다")
    void getBySlug_nonExistent_throwsNotFound() {
        when(articleRepository.findBySlugAndDeletedAtIsNull("non-existent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> articleService.getBySlug("non-existent"))
                .hasMessageContaining("Article not found");
    }

    @Test
    @DisplayName("Instagram timestamp이 이미 존재하면 기존 기사를 반환한다 (idempotent)")
    void createArticle_duplicateInstagramTimestamp_returnsExisting() {
        Article existing = new Article("Existing", "existing", "Content", null, Category.FASHION, author);
        ReflectionTestUtils.setField(existing, "id", UUID.randomUUID());
        existing.setInstagramTimestamp("2025-11-03_10-34-01_UTC");
        when(articleRepository.findByInstagramTimestamp("2025-11-03_10-34-01_UTC"))
                .thenReturn(Optional.of(existing));

        var request = new ArticleRequest("New Title", "New Content", null, Category.FASHION, "2025-11-03_10-34-01_UTC");
        var response = articleService.create(UUID.randomUUID(), request);

        assertThat(response.id()).isEqualTo(existing.getId());
        assertThat(response.title()).isEqualTo("Existing");
        verify(articleRepository, never()).save(any());
    }

    @Test
    @DisplayName("Instagram timestamp이 새로운 경우 정상 저장된다")
    void createArticle_newInstagramTimestamp_persistsField() {
        when(articleRepository.findByInstagramTimestamp(anyString())).thenReturn(Optional.empty());
        when(userRepository.findById(any())).thenReturn(Optional.of(author));
        when(articleRepository.existsBySlug(anyString())).thenReturn(false);
        when(articleRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        var request = new ArticleRequest("Title", "Content", null, Category.FASHION, "2025-12-01_09-00-00_UTC");
        articleService.create(UUID.randomUUID(), request);

        verify(articleRepository).save(argThat(a ->
                "2025-12-01_09-00-00_UTC".equals(a.getInstagramTimestamp())
        ));
    }

    @Test
    @DisplayName("본인 기사를 삭제하면 deletedAt이 설정된다 (soft delete)")
    void deleteArticle_byOwner_marksDeleted() {
        Article article = new Article("Title", "title", "Content", null, Category.FASHION, author);
        ReflectionTestUtils.setField(article, "id", UUID.randomUUID());
        when(articleRepository.findById(any())).thenReturn(Optional.of(article));
        when(articleRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        articleService.delete(article.getId(), author.getId());

        assertThat(article.isDeleted()).isTrue();
        verify(articleRepository).save(article);
        verify(articleRepository, never()).delete(any(Article.class));
    }

    @Test
    @DisplayName("삭제된 기사를 본인이 복구할 수 있다")
    void restoreArticle_byOwner_clearsDeletedAt() {
        Article article = new Article("Title", "title", "Content", null, Category.FASHION, author);
        ReflectionTestUtils.setField(article, "id", UUID.randomUUID());
        article.markDeleted();
        when(articleRepository.findById(any())).thenReturn(Optional.of(article));
        when(articleRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        articleService.restore(article.getId(), author.getId());

        assertThat(article.isDeleted()).isFalse();
    }

    @Test
    @DisplayName("update 시 변경 전 상태가 revision으로 저장된다")
    void updateArticle_savesRevision() {
        Article article = new Article("Old", "old", "Old content", null, Category.FASHION, author);
        ReflectionTestUtils.setField(article, "id", UUID.randomUUID());
        when(articleRepository.findById(any())).thenReturn(Optional.of(article));
        when(articleRepository.existsBySlug(anyString())).thenReturn(false);
        when(articleRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        articleService.update(article.getId(), author.getId(),
                new ArticleRequest("New", "New content", null, Category.FASHION, null));

        verify(revisionRepository).save(any(ArticleRevision.class));
    }
}
