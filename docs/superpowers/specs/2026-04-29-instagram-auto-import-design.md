# Instagram → FASHION Auto Import — Design

## Goal

Automate the existing manual instaloader-based import workflow so new Instagram posts from `@rawr.co.kr` appear as FASHION articles on rawr.co.kr without operator intervention. The script that powered the original 75-article seeding (`/Users/jinki/.config/superpowers/worktrees/rawr/feature-rawr-backend/import_instagram.py`) is the starting point.

## Scope

In scope:
- Daily EC2 cron that runs instaloader + import script
- Backend changes to support deduplication
- A long-lived service JWT for the script's API calls
- Slack notifications on failures
- Refactor of the existing import script (drop categorization, drop hardcoded token, add dedup, add Slack alert)

Out of scope:
- Admin "Sync Now" button (deferred — see memory `project_admin_sync_button_followup.md`)
- API key system on backend (long-lived service JWT used instead)
- IG operator-side automation (operator's session cookie required at setup time and at each ~60–90 day renewal)

## Decisions

| Item | Choice |
|---|---|
| Schedule | EC2 cron, daily at 04:00 KST |
| IG auth | Operator-supplied session cookie file |
| Backend auth | 1-year service JWT for OWNER user |
| Category | Hardcoded FASHION |
| Title | First non-empty line of caption, trimmed to 120 chars |
| Dedup | `instaloader --fast-update` (disk cache) + `instagram_timestamp` unique column on `articles` |
| Failure alerts | Slack incoming webhook |
| Manual trigger | SSH for now (Phase 1). Admin button deferred to follow-up |

## Architecture

### Backend (Spring Boot)

**Article entity** gains:
```
@Column(unique = true)
private String instagramTimestamp;   // e.g. "2025-11-03_10-34-01_UTC"; nullable for non-IG articles
```

**Article DTO** (`ArticleRequest`) gains an optional `instagramTimestamp` field. When present, the request is treated as an IG-sourced import.

**ArticleRepository** gains `boolean existsByInstagramTimestamp(String ts)`.

**ArticleService.create**: when `instagramTimestamp` is present, skip creation (return the existing article) if already imported. Idempotent on duplicate IG posts.

**Migration** `V6__add_instagram_timestamp.sql`:
```sql
ALTER TABLE articles ADD COLUMN instagram_timestamp VARCHAR(40);
CREATE UNIQUE INDEX idx_articles_instagram_timestamp ON articles(instagram_timestamp) WHERE instagram_timestamp IS NOT NULL;
```
The partial unique index keeps the constraint while allowing many NULLs for hand-authored articles.

**Service JWT generation** (one-time use):
- Add a `JwtUtil#generateServiceToken(userId, role, expirySeconds)` method or simple Spring Boot CLI runner that prints a 1-year JWT for the OWNER user to stdout. Run once locally with prod env vars; copy result to EC2.
- Alternative: dedicated `ServiceTokenIssuer` main method invoked via `java -cp app.jar`.

### EC2

```
/home/ec2-user/rawr/
├── app.jar
├── deploy.sh
└── ig-import/
    ├── run.sh                 # cron entry point
    ├── import_instagram.py    # refactored script (in repo at scripts/instagram_import/)
    ├── requirements.txt
    ├── venv/                  # python virtualenv
    ├── session-rawr.co.kr     # operator's IG session, 0600
    ├── service-token.txt      # 1-year JWT, 0600
    ├── slack-webhook.txt      # webhook URL, 0600
    ├── rawr.co.kr/            # instaloader cache (created on first run)
    ├── ig-import.log
    └── ig-import.error.log
```

Crontab entry:
```
0 4 * * * /home/ec2-user/rawr/ig-import/run.sh >> /home/ec2-user/rawr/ig-import/ig-import.log 2>&1
```

### Repository

The Python script lives in the repo for versioning:
```
rawr/
└── scripts/
    └── instagram_import/
        ├── import_instagram.py
        ├── run.sh
        ├── requirements.txt
        └── README.md          # operator setup instructions
```

Deployment to EC2 is via `scp` (manual on update). Could be wrapped into the future backend CI/CD work.

## Data Flow (per cron run)

```
cron 04:00 KST
  → run.sh
      1. instaloader --fast-update --sessionfile session-rawr.co.kr --no-videos rawr.co.kr
         → downloads only newly added posts into rawr.co.kr/
         → exit code != 0 → Slack alert "instaloader failed" + exit
      2. python import_instagram.py
         For each *.txt file in rawr.co.kr/:
           a. parse timestamp from filename (e.g. "2025-11-03_10-34-01_UTC")
           b. read caption
           c. resolve cover image (ts.jpg or first ts_*.jpg)
           d. POST /api/images → cover URL
           e. POST /api/articles  (body includes instagramTimestamp, category=FASHION)
                - backend returns existing article if duplicate
                - new articles auto-published via subsequent POST /articles/{id}/publish
           f. on any HTTP error → record failure, continue
      3. summary:
           - if any failures or instaloader exit != 0 → POST to slack-webhook
           - else → silent success
```

## Failure Modes & Handling

| Failure | Detection | Action |
|---|---|---|
| IG session expired | instaloader exit code, "Login required" in stderr | Slack alert: "Session expired — get new session-rawr.co.kr from operator" |
| IG rate limit / temporary block | instaloader exit code, 429 in stderr | Slack alert: "IG blocked — backing off"; next-day retry |
| Backend down | requests connection error / 5xx | Slack alert with count of failed posts; next-day retry safe due to dedup |
| Image upload fails | non-2xx from /api/images | Continue with `coverImage = null`; log; no Slack alert (matches current script behavior) |
| Disk cache wiped | instaloader re-downloads everything | DB unique constraint blocks re-inserts; script logs "X duplicates skipped"; no Slack alert |
| Slack webhook itself down | webhook POST fails | Log only, don't fail the run |

## Testing / Verification

Manual verification after deployment:
1. Operator posts a new IG photo. Wait for next cron (or trigger manually).
2. Verify article appears at /fashion within ~24 hours.
3. SSH to EC2 and re-run `run.sh` immediately. Verify no duplicate is created (DB unique constraint kicks in).
4. Temporarily break the session file (rename it). Re-run. Verify Slack message arrives.
5. Temporarily stop the backend (`pkill -f app.jar`). Re-run. Verify Slack message arrives.

No automated tests for the script. Backend unit test covers `existsByInstagramTimestamp` + idempotent `create`.

## Operational Setup (one-time, manual)

**Operator side (with operator):**
1. Install instaloader on operator's PC: `pip install instaloader`
2. Operator runs: `instaloader -l rawr.co.kr` and authenticates
3. Locate session file: `~/Library/Application Support/Instaloader/session-rawr.co.kr` (macOS) or equivalent
4. Hand the file to project owner via secure channel

**Owner side:**
1. Issue 1-year service JWT using backend tool. Save to `service-token.txt`.
2. Create Slack workspace incoming webhook. Save URL to `slack-webhook.txt`.
3. `scp` the three secret files + `session-rawr.co.kr` to EC2 with mode 0600.
4. `ssh` to EC2: create `/home/ec2-user/rawr/ig-import/`, copy `import_instagram.py` and `run.sh`, create Python venv and `pip install -r requirements.txt`.
5. Add crontab entry.
6. Deploy backend with V6 migration.
7. Trigger one manual run (`bash /home/ec2-user/rawr/ig-import/run.sh`), verify articles appear and Slack alerts work.

**Renewal cycle (~60–90 days):**
- When Slack alerts "session expired" arrive, re-acquire session from operator and `scp` to EC2.

## Open Questions

None at design time. Implementation may need to revisit:
- Exact Slack message format (text vs blocks)
- Whether to use a venv or system Python on EC2
- Whether `--no-videos` is the right default (videos balloon disk usage; can revisit if videos are wanted)
