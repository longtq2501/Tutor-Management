# 🚨 VPS OAuth 502 Bad Gateway - Fix Guide

## Problem Summary
- ✅ Google OAuth credentials are configured correctly
- ❌ Production VPS (`api.tutorpro.vn`) returns **502 Bad Gateway**
- ❌ Nginx reverse proxy is likely down or not configured

---

## Step 1: SSH to VPS and Check Services

```bash
# SSH to VPS
ssh -p 2222 user@14.225.255.59

# Check if Docker containers are running
docker ps

# You should see:
# - mysql_db_prod     (MySQL)
# - spring_backend_prod (Java)
# - nginx_prod        (Nginx) ← THIS MIGHT BE MISSING!

# Check if Nginx is running
curl http://localhost/

# If NOT running, you'll get: Connection refused
# If BAD CONFIG, you'll get: 502 Bad Gateway
```

---

## Step 2: Verify Backend is Healthy

```bash
# Test if Spring Boot responds on port 8080
curl -v http://localhost:8080/actuator/health

# Expected response:
# HTTP/1.1 200 OK
# {"status":"UP"}

# If FAILS → Backend crashed, check logs:
docker logs spring_backend_prod | tail -50
```

---

## Step 3: Check Google Credentials in .env

```bash
# SSH to VPS
cd /app  # or wherever your .env is

# Check if credentials are set
cat .env | grep GOOGLE

# Should show:
# GOOGLE_CLIENT_ID=15595329789-cv4o4tj87djfuau8n3c6lp6e7li8q0c.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=****dq15m

# If EMPTY → ADD THEM and restart containers
# docker compose -f docker-compose.prod.yml restart backend
```

---

## Step 4: Fix Nginx Configuration (IF NOT RUNNING)

**Option A: Check if Nginx container exists**
```bash
docker ps | grep nginx

# If NOT listed → Need to add Nginx to docker-compose.prod.yml
```

**Option B: Add Nginx to docker-compose.prod.yml**

See `nginx.prod.yml` below - add the `nginx` service section.

---

## Step 5: Restart Containers

```bash
cd /app

# Update .env with Google credentials if missing
nano .env
# Add/verify:
# GOOGLE_CLIENT_ID=15595329789-cv4o4tj87djfuau8n3c6lp6e7li8q0c.apps.googleusercontent.com
# GOOGLE_CLIENT_SECRET=****

# Restart services
docker compose -f docker-compose.prod.yml up -d --build

# Watch logs
docker compose -f docker-compose.prod.yml logs -f backend
```

---

## Step 6: Test OAuth Flow

```bash
# From local machine, test the OAuth endpoint
curl -v https://api.tutorpro.vn/oauth2/authorization/google

# Expected: 302 redirect to Google login
# Actual: 502? → Nginx not configured or Backend not responding
```

---

## Quick Check Checklist

- [ ] SSH to VPS: `ssh -p 2222 user@14.225.255.59`
- [ ] Check containers: `docker ps`
- [ ] Is `nginx_prod` running? If NO → Step 4
- [ ] Test backend: `curl http://localhost:8080/actuator/health`
- [ ] Check .env has `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- [ ] Restart: `docker compose -f docker-compose.prod.yml restart backend`
- [ ] Test OAuth again: Visit `https://api.tutorpro.vn/login` and click "Google"

---

## If Still Getting 502

**Most likely cause: Nginx not routing correctly to backend**

Check Nginx config:
```bash
docker exec nginx_prod cat /etc/nginx/nginx.conf | grep -A 5 "upstream backend"

# Should show:
# upstream backend {
#   server backend:8080;
# }
```

If missing or wrong, update the Nginx config file and redeploy.
