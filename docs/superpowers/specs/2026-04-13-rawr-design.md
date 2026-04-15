# rawr.co.kr — Design Spec
**Date:** 2026-04-13

---

## Concept

> This magazine is built on the taste of one man.
> It may be subjective and biased, and that is not denied.
> In an age of excess information, we hope personal taste can still reach the world.

rawr.co.kr is an independent editorial magazine covering fashion and culture. It is opinionated by design — curated by one owner, open to a small circle of contributors, and written entirely in English.

---

## Architecture

```
[Next.js Frontend]            [Spring Boot API]
 - Article list/detail (SSG)   - Auth (OAuth2 JWT)
 - Admin UI (editor)           - Article CRUD
 - Comments, likes, bookmarks  - Comments / Likes / Bookmarks
 - Email subscription UI       - Email subscription + notifications
        │                      - Contributor management
        └──── REST API ────────┘
                    │
               PostgreSQL
                    │
                AWS S3
              (image storage)
```

### Pages
| Route | Description |
|---|---|
| `/` | Home — featured article + category grid |
| `/articles/[slug]` | Article detail (SSR/SSG) |
| `/category/[name]` | Fashion / Culture filter |
| `/admin` | Editor dashboard (protected) |
| Auth | Social login modal — not a dedicated page, appears contextually |

---

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | Next.js (SSR/SSG for SEO), TypeScript |
| Backend | Java 21, Spring Boot 3.4, Spring Security OAuth2 |
| Database | PostgreSQL, Flyway |
| Auth | Kakao / Google / Apple OAuth2 → JWT |
| Image Storage | AWS S3 |
| State Management | Zustand (or React Query) |

---

## Data Model

### User
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| email | VARCHAR | from OAuth provider |
| username | VARCHAR | display name |
| profile_image | VARCHAR | URL |
| role | ENUM | `OWNER`, `CONTRIBUTOR`, `READER` |
| oauth_provider | ENUM | `KAKAO`, `GOOGLE`, `APPLE` |
| oauth_id | VARCHAR | provider's unique user ID |
| created_at | TIMESTAMP | |

### Article
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| title | VARCHAR | |
| slug | VARCHAR | unique, auto-generated from title |
| content | TEXT | rich text (HTML) |
| cover_image | VARCHAR | S3 URL |
| category | ENUM | `FASHION`, `CULTURE` |
| status | ENUM | `DRAFT`, `PUBLISHED` |
| author_id | UUID | FK → User |
| published_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### Comment
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| content | TEXT | |
| article_id | UUID | FK → Article |
| user_id | UUID | FK → User |
| created_at | TIMESTAMP | |

### Like
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| article_id | UUID | FK → Article |
| user_id | UUID | FK → User |

### Bookmark
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| article_id | UUID | FK → Article |
| user_id | UUID | FK → User |

### Subscription
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| email | VARCHAR | |
| user_id | UUID | FK → User, nullable |
| created_at | TIMESTAMP | |

---

## User Roles & Permissions

| Action | Owner | Contributor | Reader |
|---|---|---|---|
| Read articles | ✓ | ✓ | ✓ |
| Like / Bookmark | ✓ | ✓ | ✓ |
| Comment | ✓ | ✓ | ✓ |
| Subscribe (email) | ✓ | ✓ | ✓ |
| Write articles | ✓ | ✓ (own only) | ✗ |
| Publish articles | ✓ | ✗ | ✗ |
| Delete any article | ✓ | ✗ | ✗ |
| Invite contributors | ✓ | ✗ | ✗ |

---

## Admin Editor

**Article editor features:**
- Title input
- Slug (auto-generated, editable)
- Category selector (Fashion / Culture)
- Cover image upload → S3
- Rich text editor (bold, italic, links, image embed)
- Auto-save (draft)
- Publish / Unpublish toggle

**Article list management:**
- Filter by status (Draft / Published)
- Edit / Delete

---

## Auth Flow

- No email/password signup
- Social login only: **Kakao**, **Google**, **Apple**
- Login is not shown on the homepage — triggered contextually (e.g., when attempting to comment or bookmark)
- On OAuth callback: create user if new, issue JWT, return to previous page

---

## Email Subscription

- Readers enter their email to subscribe (no account required)
- On new article published: send notification email to all subscribers
- Unsubscribe via link in email

---

## MVP Scope

**Included:**
- Article reading (SSG, SEO-optimized)
- Likes / Bookmarks
- Comments (login required)
- Email subscription + new article notifications
- Admin editor
- Kakao / Google / Apple social login

**Deferred:**
- Search
- Tags / Series
- Newsletter campaigns

---

## Design Direction

- Dark, subcultural, raw aesthetic
- Reference: [Visla](https://visla.kr) — but rougher, more underground
- Frontend visual design: **pending Figma from owner**
- Implementation of frontend will begin after Figma handoff
