# Backend CI/CD — Design

## Goal

Replace the manual `./gradlew bootJar → scp → ssh deploy.sh` cycle with a GitHub Actions pipeline triggered on PR merge to `main`.

## Scope

In:
- `.github/workflows/deploy-backend.yml`
- GitHub repository secrets registration (out-of-band action by repo owner)

Out:
- Frontend (Vercel handles it already)
- Rollback automation
- Multi-environment (staging) — single prod target
- Slack notifications — GitHub Actions UI is sufficient for now

## Trigger

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'rawr-backend/**'
      - '.github/workflows/deploy-backend.yml'
  workflow_dispatch:
```

Path filter avoids rebuilding when only frontend or docs change. `workflow_dispatch` allows manual runs from the Actions tab.

## Pipeline

1. Checkout (`actions/checkout@v4`)
2. Set up JDK 21 (`actions/setup-java@v4`, `temurin`)
3. `./gradlew test --no-daemon` (working dir `rawr-backend/`)
4. `./gradlew bootJar --no-daemon`
5. Install SSH key from secret to a tmp file with `chmod 600`
6. `scp` the built JAR to `${EC2_USER}@${EC2_HOST}:/home/ec2-user/rawr/app.jar`
7. `ssh` and run `bash /home/ec2-user/rawr/deploy.sh`
8. Health check: `curl -f -s https://api.rawr.co.kr/api/articles?size=1 -o /dev/null -w "%{http_code}"` — expect HTTP 200; fail the workflow if not.

Tests gate the deploy: a failing test stops the pipeline before any prod artifacts move.

## Secrets

Registered manually by repo owner in GitHub → Settings → Secrets and variables → Actions:

| Secret | Value |
|---|---|
| `EC2_SSH_KEY` | Full contents of `~/Downloads/rawr-key.pem` (PEM, BEGIN/END lines included) |
| `EC2_HOST` | `13.209.65.184` |
| `EC2_USER` | `ec2-user` |

## Strict-host-key handling

Use `ssh -o StrictHostKeyChecking=accept-new` to accept the host key on first run. After that, the runner regenerates each time anyway, so we accept it every run. (Acceptable for now; a future hardening step could pin the host key.)

## Failure Modes

| Failure | Behavior |
|---|---|
| Tests fail | Workflow fails at step 3, no prod changes |
| `bootJar` fails | Workflow fails at step 4 |
| `scp` fails (network/SSH) | Workflow fails at step 6, prod still on old JAR |
| `deploy.sh` fails | App may be in mid-restart; old PID killed but new fails to start. Current `deploy.sh` doesn't roll back. Out of scope for this PR. |
| Health check fails | Workflow fails at step 8. Operator gets a red ❌ in Actions and must SSH to investigate. |

## Testing / Verification

- Trigger one no-op backend change (e.g., add a comment to README), merge to main, watch Actions tab.
- Verify deploy completes within ~3 minutes; verify https://api.rawr.co.kr/api/articles?size=1 returns 200.
- Manually trigger via `workflow_dispatch` from the Actions tab — same pipeline executes.

## Out-of-band Setup Steps (one-time)

1. Repo owner: add the 3 secrets above to GitHub.
2. Verify the SSH key has the right permissions/format (PEM, no passphrase).
3. Confirm `deploy.sh` exists at `/home/ec2-user/rawr/deploy.sh` and is executable on EC2 (already true).
