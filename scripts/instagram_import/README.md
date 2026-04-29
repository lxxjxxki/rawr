# Instagram → rawr.co.kr Auto Import

Daily EC2 cron that fetches new `@rawr.co.kr` Instagram posts via instaloader and creates them as FASHION articles on rawr.co.kr. Idempotent through the `instagramTimestamp` column on `articles`.

See spec: `docs/superpowers/specs/2026-04-29-instagram-auto-import-design.md`

## Files

| File | Purpose |
|---|---|
| `run.sh` | Cron entry point. Runs instaloader → python importer. |
| `import_instagram.py` | Reads `.txt`/`.jpg` files, calls rawr API. |
| `issue_service_token.py` | One-time helper: prints a long-lived JWT. |
| `requirements.txt` | Python deps (instaloader, requests, PyJWT) |

## One-time Setup

### 1. Get IG session from operator (one time, ~every 60–90 days)

On the **operator's** machine:
```bash
pip install instaloader
instaloader -l rawr.co.kr
# enter password / 2FA when prompted
# locate the session file:
#   macOS:  ~/Library/Application Support/Instaloader/session-rawr.co.kr
#   Linux:  ~/.config/instaloader/session-rawr.co.kr
```

Send the session file securely to the project owner.

### 2. Issue a service JWT (1 year)

On any machine with the JWT secret:
```bash
pip install PyJWT
RAWR_JWT_SECRET='...' \
SERVICE_USER_ID='<owner-uuid>' \
SERVICE_USER_EMAIL='<owner-email>' \
DAYS=365 \
python issue_service_token.py > service-token.txt
```

### 3. Create Slack incoming webhook

Slack workspace → Apps → Incoming Webhooks → Add → choose channel → copy URL.
Save URL to a file:
```bash
echo 'https://hooks.slack.com/services/XXX/YYY/ZZZ' > slack-webhook.txt
```

### 4. Stage on EC2

```bash
ssh -i rawr-key.pem ec2-user@13.209.65.184

mkdir -p /home/ec2-user/rawr/ig-import
cd /home/ec2-user/rawr/ig-import

# venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
```

scp the four secret files from your machine:
```bash
scp -i rawr-key.pem session-rawr.co.kr   ec2-user@13.209.65.184:/home/ec2-user/rawr/ig-import/
scp -i rawr-key.pem service-token.txt    ec2-user@13.209.65.184:/home/ec2-user/rawr/ig-import/
scp -i rawr-key.pem slack-webhook.txt    ec2-user@13.209.65.184:/home/ec2-user/rawr/ig-import/
scp -i rawr-key.pem run.sh import_instagram.py requirements.txt \
    ec2-user@13.209.65.184:/home/ec2-user/rawr/ig-import/

# tighten permissions
ssh -i rawr-key.pem ec2-user@13.209.65.184 \
  'cd /home/ec2-user/rawr/ig-import && \
   chmod 0600 session-rawr.co.kr service-token.txt slack-webhook.txt && \
   chmod 0700 run.sh'
```

### 5. Crontab

```bash
ssh -i rawr-key.pem ec2-user@13.209.65.184
crontab -e
```

Add:
```
0 4 * * * /home/ec2-user/rawr/ig-import/run.sh >> /home/ec2-user/rawr/ig-import/ig-import.log 2>&1
```
(04:00 KST is 19:00 UTC — adjust if EC2 timezone is UTC.)

### 6. Smoke test

```bash
ssh -i rawr-key.pem ec2-user@13.209.65.184 \
  'bash /home/ec2-user/rawr/ig-import/run.sh'
```

Expected: instaloader downloads (or no-op), python script reports `created: N, duplicates: M, failed: 0`. New posts should appear at https://rawr.co.kr/fashion within seconds.

## Renewal

When Slack alerts ":x: rawr IG import — instaloader failed (Session may be expired)":
1. Get a fresh `session-rawr.co.kr` from the operator.
2. `scp` it to EC2 (overwrite).
3. Manually re-run `run.sh` to confirm.

## Operations Notes

- Logs at `/home/ec2-user/rawr/ig-import/ig-import.log`.
- instaloader cache dir at `/home/ec2-user/rawr/ig-import/rawr.co.kr/`.
- Wiping the cache is safe — backend dedup blocks duplicate articles.
- Service JWT (`service-token.txt`) expires in 1 year. Re-issue and `scp` before that date.
