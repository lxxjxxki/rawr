#!/usr/bin/env python3
"""
Instagram posts → rawr.co.kr importer.

Reads instaloader-downloaded `.txt` (caption) and `.jpg` (image) files from
BASE_DIR and creates articles in the FASHION category via the rawr API.

Idempotent: each article carries `instagramTimestamp` (e.g. "2025-11-03_10-34-01_UTC"),
and the backend's POST /api/articles short-circuits to the existing record on
duplicate. Disk-cache wipes are therefore safe.

Configuration is via environment variables (see run.sh):
- IG_BASE_DIR        path to instaloader output (e.g. /home/ec2-user/rawr/ig-import/rawr.co.kr)
- IG_API_BASE        backend base URL (e.g. https://api.rawr.co.kr)
- IG_TOKEN_FILE      path to file containing the long-lived service JWT
- IG_SLACK_WEBHOOK_FILE   (optional) path to file with Slack webhook URL
"""

import json
import os
import sys
import time
from glob import glob
from pathlib import Path

import requests

BASE_DIR = os.environ["IG_BASE_DIR"]
API_BASE = os.environ["IG_API_BASE"]
TOKEN_FILE = os.environ["IG_TOKEN_FILE"]
SLACK_WEBHOOK_FILE = os.environ.get("IG_SLACK_WEBHOOK_FILE")

JWT_TOKEN = Path(TOKEN_FILE).read_text().strip()
HEADERS = {"Authorization": f"Bearer {JWT_TOKEN}"}


def slack_notify(text: str) -> None:
    if not SLACK_WEBHOOK_FILE:
        return
    try:
        url = Path(SLACK_WEBHOOK_FILE).read_text().strip()
        if not url:
            return
        requests.post(url, json={"text": text}, timeout=10)
    except Exception as exc:
        print(f"  [slack notify failed] {exc}")


def make_title(text: str) -> str:
    for line in text.splitlines():
        line = line.strip()
        if line:
            return line[:120]
    return "Untitled"


def upload_image(image_path: str) -> str | None:
    with open(image_path, "rb") as f:
        resp = requests.post(
            f"{API_BASE}/api/images",
            headers=HEADERS,
            files={"file": (os.path.basename(image_path), f, "image/jpeg")},
            timeout=60,
        )
    if resp.status_code in (200, 201):
        return resp.json().get("url")
    print(f"  [image upload failed] {resp.status_code}: {resp.text[:200]}")
    return None


def create_article(title: str, content: str, cover_image: str | None, ts: str) -> dict | None:
    payload = {
        "title": title,
        "content": content,
        "category": "FASHION",
        "coverImage": cover_image,
        "instagramTimestamp": ts,
    }
    resp = requests.post(
        f"{API_BASE}/api/articles",
        headers={**HEADERS, "Content-Type": "application/json"},
        data=json.dumps(payload),
        timeout=30,
    )
    if resp.status_code in (200, 201):
        return resp.json()
    print(f"  [create article failed] {resp.status_code}: {resp.text[:300]}")
    return None


def publish_article(article_id: str) -> bool:
    resp = requests.post(
        f"{API_BASE}/api/articles/{article_id}/publish",
        headers=HEADERS,
        timeout=30,
    )
    return resp.status_code in (200, 201)


def main() -> int:
    txt_files = sorted(glob(os.path.join(BASE_DIR, "*.txt")))
    print(f"Found {len(txt_files)} caption files in {BASE_DIR}")

    created = 0
    duplicates = 0
    failed = 0

    for txt_path in txt_files:
        ts = os.path.basename(txt_path).replace(".txt", "")
        print(f"[{ts}]")

        caption = Path(txt_path).read_text(encoding="utf-8").strip()
        if not caption:
            print("  empty caption — skipping")
            continue

        title = make_title(caption)

        single = os.path.join(BASE_DIR, f"{ts}.jpg")
        multi = sorted(glob(os.path.join(BASE_DIR, f"{ts}_*.jpg")))
        image_path = single if os.path.exists(single) else (multi[0] if multi else None)

        cover_url = upload_image(image_path) if image_path else None

        article = create_article(title, caption, cover_url, ts)
        if not article:
            failed += 1
            continue

        if article.get("instagramTimestamp") == ts and article.get("status") == "PUBLISHED":
            duplicates += 1
            print(f"  duplicate — already imported")
        else:
            article_id = article.get("id")
            if publish_article(article_id):
                created += 1
                print(f"  published: {article_id}")
            else:
                failed += 1

        time.sleep(0.3)

    summary = f"IG import done: {created} new, {duplicates} duplicates skipped, {failed} failed"
    print(f"\n{summary}")

    if failed > 0:
        slack_notify(f":warning: rawr IG import — {failed} failures. {summary}")
        return 1
    if created == 0 and duplicates == 0:
        slack_notify(":warning: rawr IG import — no posts processed (instaloader cache empty?)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
