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

### 1. Create an IG session (one time, ~every 60–90 days)

`@rawr.co.kr` is a public profile, so we don't need the operator's account.
We use any logged-in IG account to fetch it via instaloader.

On your local machine, with whichever IG account you want to use as the
"reader" (the username is wired into `run.sh` as `IG_LOGIN_USER`; default
`_jinkilee`):

```bash
pip install instaloader
instaloader -l <your-ig-username>
# enter password / 2FA when prompted
# locate the session file:
#   macOS:  ~/Library/Application Support/Instaloader/session-<your-ig-username>
#   Linux:  ~/.config/instaloader/session-<your-ig-username>
```

If you change the IG account, update `IG_LOGIN_USER` in `run.sh` to match.

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

scp the secret files from your machine. Replace `<USER>` with your IG
username (the same one used in step 1 and in `IG_LOGIN_USER`):
```bash
scp -i rawr-key.pem ~/.config/instaloader/session-<USER>  ec2-user@13.209.65.184:/home/ec2-user/rawr/ig-import/
scp -i rawr-key.pem service-token.txt                     ec2-user@13.209.65.184:/home/ec2-user/rawr/ig-import/
scp -i rawr-key.pem slack-webhook.txt                     ec2-user@13.209.65.184:/home/ec2-user/rawr/ig-import/
scp -i rawr-key.pem run.sh import_instagram.py requirements.txt \
    ec2-user@13.209.65.184:/home/ec2-user/rawr/ig-import/

# tighten permissions
ssh -i rawr-key.pem ec2-user@13.209.65.184 \
  "cd /home/ec2-user/rawr/ig-import && \
   chmod 0600 session-<USER> service-token.txt slack-webhook.txt && \
   chmod 0700 run.sh"
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

When Slack alerts ":x: rawr IG import — instaloader failed (Session for <USER> may be expired)":
1. Re-run `instaloader -l <USER>` on your local machine, enter password / 2FA.
2. `scp` the refreshed session file to EC2 (overwrite).
3. Manually re-run `run.sh` to confirm.

## Operations Notes

- Logs at `/home/ec2-user/rawr/ig-import/ig-import.log`.
- instaloader cache dir at `/home/ec2-user/rawr/ig-import/rawr.co.kr/`.
- Wiping the cache is safe — backend dedup blocks duplicate articles.
- Service JWT (`service-token.txt`) expires in 1 year. Re-issue and `scp` before that date.
