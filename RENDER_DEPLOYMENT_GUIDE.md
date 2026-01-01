# Deploying Iron & Neon Gym Backend to Render

## Overview
This guide walks you through deploying the FastAPI backend to [Render](https://render.com) with your Neon.tech PostgreSQL database.

---

## Prerequisites
- GitHub account (to push your code)
- Render account (free tier available)
- Neon.tech database already set up ✅

---

## Step 1: Prepare Your Backend for Deployment

### 1.1 Create `render.yaml` (Optional - for Blueprint deployments)
Already created at `/app/backend/render.yaml`

### 1.2 Verify `requirements.txt`
Your requirements.txt should include all dependencies. Already configured ✅

### 1.3 Create a startup script
Already created at `/app/backend/start.sh`

---

## Step 2: Push Code to GitHub

### 2.1 Create a new GitHub repository
1. Go to [github.com/new](https://github.com/new)
2. Name it: `iron-neon-gym-backend`
3. Keep it **Public** or **Private**
4. Click **Create repository**

### 2.2 Push your backend code
```bash
cd /app/backend

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial backend deployment"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/iron-neon-gym-backend.git

# Push
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy on Render

### 3.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with **GitHub** (recommended for easy repo access)

### 3.2 Create New Web Service
1. From Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository:
   - Click **"Connect GitHub"**
   - Authorize Render to access your repos
   - Select `iron-neon-gym-backend`

### 3.3 Configure the Web Service

| Setting | Value |
|---------|-------|
| **Name** | `iron-neon-gym-api` |
| **Region** | `Oregon (US West)` or closest to your users |
| **Branch** | `main` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn server:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | `Free` (or paid for production) |

### 3.4 Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**

Add these variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_0RFlb6jDLcBd@ep-old-flower-a4aucfit-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | `your-super-secret-jwt-key-change-this` |
| `CORS_ORIGINS` | `*` (or your frontend URL for production) |
| `CASHFREE_CLIENT_ID` | (your Cashfree client ID - optional) |
| `CASHFREE_CLIENT_SECRET` | (your Cashfree secret - optional) |
| `CASHFREE_ENVIRONMENT` | `SANDBOX` |
| `PYTHON_VERSION` | `3.11.0` |

### 3.5 Deploy
1. Click **"Create Web Service"**
2. Render will:
   - Clone your repo
   - Install dependencies
   - Start your server
3. Wait 2-5 minutes for deployment

---

## Step 4: Verify Deployment

### 4.1 Check Render Logs
- Go to your service dashboard
- Click **"Logs"** tab
- Look for:
  ```
  Database tables created
  Default admin created: admin@ironandneon.com / admin123
  Uvicorn running on http://0.0.0.0:10000
  ```

### 4.2 Test Your API
Your API will be available at:
```
https://iron-neon-gym-api.onrender.com
```

Test endpoints:
```bash
# Health check
curl https://iron-neon-gym-api.onrender.com/api/

# Get plans
curl https://iron-neon-gym-api.onrender.com/api/plans

# Admin login
curl -X POST https://iron-neon-gym-api.onrender.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ironandneon.com","password":"admin123"}'
```

---

## Step 5: Update Frontend to Use Render Backend

Update your frontend `.env` to point to Render:
```env
REACT_APP_BACKEND_URL=https://iron-neon-gym-api.onrender.com
```

---

## Render Free Tier Limitations

⚠️ **Important for Free Tier:**
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds (cold start)
- 750 free hours/month

### Solutions for Cold Start:
1. **Upgrade to paid tier** ($7/month) - always on
2. **Use a health check service** like UptimeRobot to ping your API every 14 minutes
3. **Accept the delay** for low-traffic apps

---

## Troubleshooting

### Build Failed
Check logs for missing dependencies. Common fixes:
```bash
# Add to requirements.txt if missing
uvicorn==0.29.0
gunicorn==21.2.0
```

### Database Connection Error
1. Verify `DATABASE_URL` is set correctly in Render environment variables
2. Ensure Neon.tech allows connections (no IP restrictions)
3. Check SSL mode: `?sslmode=require`

### CORS Errors
Update `CORS_ORIGINS` environment variable:
```
CORS_ORIGINS=https://your-frontend-domain.com,http://localhost:3000
```

### 502 Bad Gateway
- Check if the start command is correct
- Verify PORT is using `$PORT` (Render assigns dynamically)
- Check application logs for errors

---

## Production Checklist

- [ ] Change `JWT_SECRET` to a strong, unique value
- [ ] Set `CORS_ORIGINS` to your actual frontend domain
- [ ] Upgrade to paid Render tier for always-on service
- [ ] Enable Neon.tech connection pooling for better performance
- [ ] Add custom domain in Render settings
- [ ] Enable HTTPS (automatic on Render)

---

## File Structure for Deployment

```
/app/backend/
├── server.py           # Main FastAPI application
├── requirements.txt    # Python dependencies
├── render.yaml         # Render deployment config (optional)
├── start.sh           # Startup script (optional)
└── .env               # Local environment (NOT pushed to git)
```

---

## Quick Reference

| Resource | URL |
|----------|-----|
| Render Dashboard | https://dashboard.render.com |
| Your API (after deploy) | https://iron-neon-gym-api.onrender.com |
| API Health Check | https://iron-neon-gym-api.onrender.com/api/ |
| Neon Dashboard | https://console.neon.tech |

---

## Support
- Render Docs: https://render.com/docs
- FastAPI Deployment: https://render.com/docs/deploy-fastapi
