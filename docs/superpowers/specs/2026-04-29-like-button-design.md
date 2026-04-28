# Article Like Button — Design

## Goal

Add a Like button to article detail pages so readers can express appreciation. Backend (LikeService, LikeController, GET/POST `/api/articles/{id}/likes`) and frontend API client (`getLikeStatus`, `toggleLike`) already exist; only the UI is missing.

Comment UI is explicitly out of scope.

## Scope

In scope:
- `LikeButton` client component
- Integration into `app/articles/[slug]/page.tsx`

Out of scope:
- Comment UI
- Edits to backend or `lib/api.ts`
- New `/auth/login` page

## User Stories

1. As an anonymous reader, I see the like count on each article. When I click LIKE, I am redirected to `/mypage` (the existing sign-in entry).
2. As a logged-in reader, I see whether I have liked the article. Clicking toggles my like and updates the count immediately.
3. If the toggle request fails, the optimistic UI change is rolled back and the count returns to the server's value.

## Architecture

### New file

`rawr-frontend/components/LikeButton.tsx` — `'use client'` component.

Pattern reference: `components/BookmarkButton.tsx`.

### Modified file

`rawr-frontend/app/articles/[slug]/page.tsx` — render `<LikeButton articleId={article.id} />` after the article content (`<div className="prose ..." />` block), in a centered block separated by margin.

## Component Behavior

**Props:** `{ articleId: string }`

**State:**
- `count: number` — like count
- `liked: boolean` — whether the current user has liked
- `loading: boolean` — true during a click in flight (prevents double-click)

**On mount:**
- Call `getLikeStatus(articleId)`; set `count` and `liked` from response.
- If the call fails, fall back to `count = 0`, `liked = false` and disable the button silently.

**On click:**
1. If no user (`useUIStore().user` is null): `router.push('/mypage')` and return.
2. If `loading`: ignore.
3. Optimistic update: set `count = count + (liked ? -1 : 1)`, `liked = !liked`, `loading = true`.
4. Call `toggleLike(articleId)`.
5. On success: replace state with server response (`{ count, liked }`).
6. On failure: revert to the pre-click state (snapshot taken before step 3).
7. Always: set `loading = false`.

## Visual

Plain text button, matching the magazine typography:

```
LIKE · 12        (default, both anon and logged-in not-yet-liked)
LIKE · 13        (logged-in, liked — text color is accent #ccff00)
```

Tailwind classes (proposed, may be tuned during implementation):
```
text-xs uppercase tracking-widest transition-colors disabled:opacity-40
```
- Liked: `text-accent`
- Not liked: `text-white` (or `text-zinc-400` for softer)

Centered horizontally below the article body, separated by `mt-12`.

## Data Flow

```
mount  →  GET /api/articles/{id}/likes        →  { count, liked }
click  →  POST /api/articles/{id}/likes       →  { count, liked }   // toggle on backend
```

## Error Handling

- Mount fetch fails → show `LIKE · 0`, button disabled. No user-visible error.
- Toggle fails → optimistic state is rolled back. No toast/alert (consistent with `BookmarkButton`'s silent-fail style).

## Auth Integration

`useUIStore().user` provides the current user. If null:
- The button is still rendered with the count (so anon users see engagement).
- Click triggers `router.push('/mypage')` because `/mypage` already serves as the sign-in entry — when `user` is null it shows the OAuth buttons (Google + Kakao). After login, the user lands on `/mypage`; auto-return to the article is not implemented in this iteration.

## Testing

Manual verification on staging after deploy:
1. Anon user visits an article → sees `LIKE · N`. Click → lands on `/mypage` sign-in screen.
2. Logged-in user visits → sees `LIKE · N` with current liked state correctly indicated by color.
3. Click toggles count by ±1 immediately and persists across page reload.
4. Disconnect network and click → optimistic change reverts after request fails.

No automated tests required for this iteration.

## Open Questions

None at design time. Implementation may surface minor styling adjustments.
