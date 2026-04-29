#!/bin/bash
# Daily Instagram → rawr.co.kr import.
# Cron entry:  0 4 * * * /home/ec2-user/rawr/ig-import/run.sh

set -u
cd /home/ec2-user/rawr/ig-import

LOG_FILE=/home/ec2-user/rawr/ig-import/ig-import.log
SLACK_WEBHOOK_FILE=/home/ec2-user/rawr/ig-import/slack-webhook.txt

slack() {
  if [ -f "$SLACK_WEBHOOK_FILE" ]; then
    URL=$(cat "$SLACK_WEBHOOK_FILE")
    [ -n "$URL" ] && curl -s -X POST -H 'Content-Type: application/json' \
      --data "{\"text\":\"$1\"}" "$URL" > /dev/null || true
  fi
}

echo "=== $(date -u '+%Y-%m-%d %H:%M:%S UTC') run start ==="

# 1) instaloader: fetch new posts only
# We log in with our own IG account (IG_LOGIN_USER) and scrape the public
# @rawr.co.kr profile. The operator's account is NOT involved.
IG_LOGIN_USER=_jinkilee
SESSION_FILE=/home/ec2-user/rawr/ig-import/session-${IG_LOGIN_USER}

source venv/bin/activate
instaloader \
  --fast-update \
  --no-videos \
  --login="$IG_LOGIN_USER" \
  --sessionfile="$SESSION_FILE" \
  --dirname-pattern=/home/ec2-user/rawr/ig-import/{target} \
  rawr.co.kr
INSTALOADER_RC=$?

if [ $INSTALOADER_RC -ne 0 ]; then
  MSG=":x: rawr IG import — instaloader failed (rc=$INSTALOADER_RC). Session for ${IG_LOGIN_USER} may be expired; re-run \`instaloader -l ${IG_LOGIN_USER}\` locally and scp the new session file to EC2."
  echo "$MSG"
  slack "$MSG"
  exit 1
fi

# 2) python importer
export IG_BASE_DIR=/home/ec2-user/rawr/ig-import/rawr.co.kr
export IG_API_BASE=https://api.rawr.co.kr
export IG_TOKEN_FILE=/home/ec2-user/rawr/ig-import/service-token.txt
export IG_SLACK_WEBHOOK_FILE=$SLACK_WEBHOOK_FILE

python import_instagram.py
PY_RC=$?

echo "=== $(date -u '+%Y-%m-%d %H:%M:%S UTC') run end (rc=$PY_RC) ==="
exit $PY_RC
