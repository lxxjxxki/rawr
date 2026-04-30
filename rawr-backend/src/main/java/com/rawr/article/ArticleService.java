package com.rawr.article;

import com.rawr.article.dto.ArticleRequest;
import com.rawr.article.dto.ArticleResponse;
import com.rawr.article.dto.ArticleRevisionResponse;
import com.rawr.subscription.SubscriptionService;
import com.rawr.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final ArticleRevisionRepository revisionRepository;
    private final UserRepository userRepository;
    private final SubscriptionService subscriptionService;

    public ArticleService(ArticleRepository articleRepository,
                          ArticleRevisionRepository revisionRepository,
                          UserRepository userRepository,
                          SubscriptionService subscriptionService) {
        this.articleRepository = articleRepository;
        this.revisionRepository = revisionRepository;
        this.userRepository = userRepository;
        this.subscriptionService = subscriptionService;
    }

    public ArticleResponse create(UUID authorId, ArticleRequest request) {
        if (request.instagramTimestamp() != null) {
            var existing = articleRepository.findByInstagramTimestamp(request.instagramTimestamp());
            if (existing.isPresent()) {
                return ArticleResponse.from(existing.get());
            }
        }
        var author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        String slug = uniqueSlug(toSlug(request.title()));
        Article article = new Article(request.title(), slug, request.content(),
                request.coverImage(), request.category(), author);
        if (request.instagramTimestamp() != null) {
            article.setInstagramTimestamp(request.instagramTimestamp());
        }
        return ArticleResponse.from(articleRepository.save(article));
    }

    @Transactional(readOnly = true)
    public Page<ArticleResponse> search(String q, Pageable pageable) {
        return articleRepository.search(q, pageable).map(ArticleResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<ArticleResponse> listPublished(Category category, Pageable pageable) {
        Page<Article> page = category != null
                ? articleRepository.findActiveByStatusAndCategory(ArticleStatus.PUBLISHED, category, pageable)
                : articleRepository.findActiveByStatus(ArticleStatus.PUBLISHED, pageable);
        return page.map(ArticleResponse::from);
    }

    @Transactional(readOnly = true)
    public ArticleResponse getBySlug(String slug) {
        return articleRepository.findBySlugAndDeletedAtIsNull(slug)
                .map(ArticleResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found"));
    }

    @Transactional(readOnly = true)
    public List<ArticleResponse> listAllForEditors() {
        return articleRepository.findAllActive().stream()
                .map(ArticleResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ArticleResponse> listAllDeletedForEditors() {
        return articleRepository.findAllDeleted().stream()
                .map(ArticleResponse::from)
                .toList();
    }

    public ArticleResponse update(UUID articleId, UUID userId, ArticleRequest request) {
        Article article = findActiveArticle(articleId);
        revisionRepository.save(new ArticleRevision(article, userId));
        String slug = article.getTitle().equals(request.title())
                ? article.getSlug()
                : uniqueSlug(toSlug(request.title()));
        article.update(request.title(), slug, request.content(), request.coverImage(), request.category());
        return ArticleResponse.from(articleRepository.save(article));
    }

    public ArticleResponse publish(UUID articleId) {
        Article article = articleRepository.findById(articleId)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found"));
        article.publish();
        Article saved = articleRepository.save(article);
        subscriptionService.notifyNewArticle(saved);
        return ArticleResponse.from(saved);
    }

    public ArticleResponse unpublish(UUID articleId) {
        Article article = articleRepository.findById(articleId)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found"));
        article.unpublish();
        return ArticleResponse.from(articleRepository.save(article));
    }

    public void delete(UUID articleId, UUID userId) {
        Article article = findActiveArticle(articleId);
        article.markDeleted();
        articleRepository.save(article);
    }

    public ArticleResponse restore(UUID articleId, UUID userId) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found"));
        if (!article.isDeleted()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Article is not deleted");
        }
        article.restore();
        return ArticleResponse.from(articleRepository.save(article));
    }

    @Transactional(readOnly = true)
    public List<ArticleRevisionResponse> listRevisions(UUID articleId, UUID userId) {
        Article article = findActiveArticle(articleId);
        return revisionRepository.findByArticleIdOrderBySavedAtDesc(article.getId()).stream()
                .map(ArticleRevisionResponse::from)
                .toList();
    }

    public ArticleResponse revertToRevision(UUID articleId, UUID revisionId, UUID userId) {
        Article article = findActiveArticle(articleId);
        ArticleRevision revision = revisionRepository.findById(revisionId)
                .filter(r -> r.getArticleId().equals(article.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Revision not found"));
        // snapshot current state before reverting so the user can re-revert
        revisionRepository.save(new ArticleRevision(article, userId));
        article.update(revision.getTitle(), revision.getSlug(), revision.getContent(),
                revision.getCoverImage(), revision.getCategory());
        return ArticleResponse.from(articleRepository.save(article));
    }

    private Article findActiveArticle(UUID articleId) {
        return articleRepository.findById(articleId)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article not found"));
    }

    private String toSlug(String title) {
        return Normalizer.normalize(title, Normalizer.Form.NFD)
                .replaceAll("[^\\p{ASCII}]", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-");
    }

    private String uniqueSlug(String base) {
        if (!articleRepository.existsBySlug(base)) return base;
        int i = 2;
        while (articleRepository.existsBySlug(base + "-" + i)) i++;
        return base + "-" + i;
    }
}
