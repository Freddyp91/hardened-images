#!/usr/bin/env bash
# Smoke test: the image must boot Keycloak in dev mode, report healthy, and serve
# the admin console, running as a non-root user. Usage: smoke-test.sh <image-ref>
set -euo pipefail
image="$1"
name="kc-smoke-$$"

cleanup() { docker rm -f "$name" >/dev/null 2>&1 || true; }
trap cleanup EXIT

user=$(docker image inspect "$image" --format '{{.Config.User}}')
echo "Image user: ${user:-<root>}"
[ -n "$user" ] && [ "$user" != "0" ] && [ "$user" != "root" ] || { echo "FAIL: image runs as root"; exit 1; }

docker run -d --name "$name" -p 18080:8080 -p 19000:9000 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=smoke-test \
  -e KC_HEALTH_ENABLED=true \
  "$image" start-dev >/dev/null

for i in $(seq 1 60); do
  if ! docker ps -q --filter "name=$name" | grep -q .; then
    echo "FAIL: container exited"; docker logs "$name" || true; exit 1
  fi
  if curl -fsS http://localhost:19000/health/ready >/dev/null 2>&1; then
    echo "Ready after $((i * 3))s"
    break
  fi
  [ "$i" -eq 60 ] && { echo "FAIL: not ready after 180s"; docker logs "$name" | tail -100; exit 1; }
  sleep 3
done

curl -fsS http://localhost:18080/realms/master/.well-known/openid-configuration | grep -q '"issuer"' \
  || { echo "FAIL: OIDC discovery endpoint"; docker logs "$name" | tail -50; exit 1; }

token=$(curl -fsS -d client_id=admin-cli -d username=admin -d password=smoke-test -d grant_type=password \
  http://localhost:18080/realms/master/protocol/openid-connect/token | grep -o '"access_token":"[^"]*"' || true)
[ -n "$token" ] || { echo "FAIL: admin login"; docker logs "$name" | tail -50; exit 1; }

echo "PASS: Keycloak boots, is healthy, serves OIDC and accepts admin login"
