#!/bin/bash
# rawr.co.kr 백엔드 EC2 배포 스크립트
# 사용법: ./deploy.sh

set -e

echo "=== rawr backend deploy ==="

# 환경변수 파일 로드 (.env가 있으면)
if [ -f /home/ec2-user/rawr/.env ]; then
  export $(cat /home/ec2-user/rawr/.env | grep -v '^#' | xargs)
fi

# JAR 실행 중인 프로세스 종료
PID=$(pgrep -f "app.jar" || true)
if [ -n "$PID" ]; then
  echo "Stopping existing process (PID: $PID)..."
  kill $PID
  sleep 3
fi

# 새 JAR 실행
echo "Starting app..."
nohup java \
  -Dspring.profiles.active=prod \
  -jar /home/ec2-user/rawr/app.jar \
  >> /home/ec2-user/rawr/app.log 2>&1 &

echo "Started (PID: $!)"
echo "Logs: tail -f /home/ec2-user/rawr/app.log"
