# 🚀 VPS Deployment Guide - Fix 502 Bad Gateway

## What Changed?

**Added Nginx reverse proxy** to `docker-compose.prod.yml`:
- Routes `/oauth2/*` → Backend (Spring Boot)
- Routes `/api/*` → Backend  
- Routes `/ws/*` → Backend (WebSocket for live rooms)
- Handles SSL/TLS termination
- Serves both `api.tutorpro.vn` and `tutorpro.id.vn` domains

**New files created:**
- `nginx.prod.conf` - Nginx configuration for production
- `VPS_OAUTH_FIX.md` - Troubleshooting guide
- Updated `docker-compose.prod.yml` - Added Nginx service

---

## Step 1: Prepare SSL Certificates on VPS

Before deploying, you need SSL certificates for HTTPS. Copy them to VPS:

```bash
# From your local machine (or certificate provider):
scp -P 2222 api-tutorpro-vn.crt user@14.225.255.59:/etc/ssl/certs/
scp -P 2222 api-tutorpro-vn.key user@14.225.255.59:/etc/ssl/private/
scp -P 2222 tutorpro-id-vn.crt user@14.225.255.59:/etc/ssl/certs/
scp -P 2222 tutorpro-id-vn.key user@14.225.255.59:/etc/ssl/private/

# Set proper permissions
ssh -p 2222 user@14.225.255.59
sudo chmod 644 /etc/ssl/certs/*.crt
sudo chmod 600 /etc/ssl/private/*.key
```

**Certificate names in nginx.prod.conf:**
- API: `api-tutorpro-vn.crt` and `api-tutorpro-vn.key`
- Frontend: `tutorpro-id-vn.crt` and `tutorpro-id-vn.key`

If using Let's Encrypt with Certbot:
```bash
sudo certbot certonly --standalone -d api.tutorpro.vn -d tutorpro.id.vn
# Certificates will be at: /etc/letsencrypt/live/api.tutorpro.vn/
# Update paths in nginx.prod.conf accordingly
```

---

## Step 2: Deploy Updated Files to VPS

```bash
# SSH to VPS
ssh -p 2222 user@14.225.255.59
cd /app

# Download updated files
git pull origin main

# Verify files exist
ls -la nginx.prod.conf docker-compose.prod.yml
```

---

## Step 3: Verify .env Has Google Credentials

```bash
# On VPS
nano .env

# Verify these lines exist and are NOT empty:
GOOGLE_CLIENT_ID=15595329789-cv4o4tj87djfuau8n3c6lp6e7li8q0c.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=Gl8dq15m  # (or actual secret)
FRONTEND_URL=https://tutorpro.id.vn
NEXT_PUBLIC_API_URL=https://api.tutorpro.vn

# Save and exit (Ctrl+O, Enter, Ctrl+X)
```

---

## Step 4: Deploy Containers

```bash
# On VPS, in /app directory
docker compose -f docker-compose.prod.yml down  # Stop old containers

# Pull latest images from Docker Hub
docker compose -f docker-compose.prod.yml pull

# Start all services including new Nginx
docker compose -f docker-compose.prod.yml up -d --build

# Watch startup logs
docker compose -f docker-compose.prod.yml logs -f

# Should see:
# mysql_db_prod    ✅ running
# spring_backend_prod ✅ running  
# nextjs_frontend_prod ✅ running
# nginx_prod ✅ running
```

---

## Step 5: Verify Services are Connected

```bash
# Check if Nginx can reach backend
docker exec nginx_prod curl -v http://backend:8080/actuator/health
# Expected: HTTP/1.1 200 OK

# Check if backend is accepting requests
docker exec spring_backend_prod curl http://localhost:8080/actuator/health
# Expected: {"status":"UP"}

# Check Nginx is running
docker exec nginx_prod nginx -t
# Expected: nginx: configuration file test is successful
```

---

## Step 6: Test OAuth Endpoints

From your browser or curl:

```bash
# Test HTTP → HTTPS redirect
curl -v http://api.tutorpro.vn/

# Expected: 301 redirect to https://api.tutorpro.vn

# Test OAuth endpoint
curl -v https://api.tutorpro.vn/oauth2/authorization/google

# Expected: 302 redirect to Google login page
# If 502: Nginx can't reach backend, check Step 5 above
```

---

## Step 7: Test Full OAuth Flow

1. Open browser: `https://tutorpro.id.vn/login`
2. Click "Đăng nhập bằng Google"
3. Expected flow:
   - Page redirects to: `api.tutorpro.vn/oauth2/authorization/google`
   - Nginx routes to: Backend `/oauth2/authorization/google`
   - Backend redirects to: Google login page
   - After Google approve: Redirects to `https://api.tutorpro.vn/login/oauth2/code/google`
   - Backend exchanges code for token
   - Redirects to: `https://tutorpro.id.vn/dashboard`

---

## Troubleshooting

### Still Getting 502?

**Check 1: Is Nginx container running?**
```bash
docker ps | grep nginx
# If not listed, check logs
docker logs nginx_prod
```

**Check 2: Is Nginx config valid?**
```bash
docker exec nginx_prod nginx -t
# Should say "configuration file test is successful"
```

**Check 3: Can Nginx reach backend?**
```bash
docker exec nginx_prod curl http://backend:8080/actuator/health
# Should return: {"status":"UP"}
```

**Check 4: Backend responding?**
```bash
docker logs spring_backend_prod | tail -30
# Look for errors
```

**Check 5: DNS resolving correctly?**
```bash
nslookup api.tutorpro.vn
# Should return VPS IP: 14.225.255.59
```

---

### If Certificates Not Found

Nginx will fail to start if certs don't exist. Either:

**Option A: Use Let's Encrypt**
```bash
sudo apt-get install certbot
sudo certbot certonly --standalone -d api.tutorpro.vn -d tutorpro.id.vn
# Certs will be in /etc/letsencrypt/live/
# Update paths in nginx.prod.conf to use: /etc/letsencrypt/live/api.tutorpro.vn/fullchain.pem
```

**Option B: Use self-signed cert (testing only)**
```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/api-tutorpro-vn.key \
  -out /etc/ssl/certs/api-tutorpro-vn.crt
```

---

### Still Need Help?

Check logs for specific errors:
```bash
# Nginx logs
docker logs nginx_prod

# Backend logs
docker logs spring_backend_prod

# Full compose output
docker compose -f docker-compose.prod.yml logs
```

Save output and share for debugging.

---

## Summary

After completing all steps:
- ✅ Nginx reverse proxy routes traffic correctly
- ✅ Google OAuth flow works end-to-end
- ✅ SSL/TLS secures all connections
- ✅ WebSockets work for live teaching rooms
- ✅ No more 502 Bad Gateway errors
