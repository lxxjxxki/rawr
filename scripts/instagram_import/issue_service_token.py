#!/usr/bin/env python3
"""
Issue a long-lived service JWT for the cron importer.

Run once (locally or on EC2 with access to the JWT secret):

    RAWR_JWT_SECRET=... \\
    SERVICE_USER_ID=<owner-uuid> \\
    SERVICE_USER_EMAIL=<owner-email> \\
    DAYS=365 \\
    python issue_service_token.py > service-token.txt

Then `scp service-token.txt` to /home/ec2-user/rawr/ig-import/ on EC2 (mode 0600).
"""

import os
import sys
import time

import jwt


def main() -> int:
    secret = os.environ["RAWR_JWT_SECRET"]
    user_id = os.environ["SERVICE_USER_ID"]
    email = os.environ["SERVICE_USER_EMAIL"]
    days = int(os.environ.get("DAYS", "365"))

    now = int(time.time())
    payload = {
        "sub": user_id,
        "role": "OWNER",
        "email": email,
        "iat": now,
        "exp": now + days * 24 * 3600,
    }
    token = jwt.encode(payload, secret, algorithm="HS512")
    print(token)
    return 0


if __name__ == "__main__":
    sys.exit(main())
