# Neon.tech PostgreSQL Setup & Deployment Guide

## Overview
This guide explains how to set up Neon.tech PostgreSQL database for the Iron & Neon Gym application backend.

---

## Step 1: Create a Neon.tech Account

1. Go to [https://neon.tech](https://neon.tech)
2. Click **"Sign Up"** or **"Start Free"**
3. Sign up using:
   - GitHub account (recommended)
   - Google account
   - Email & password

---

## Step 2: Create a New Project

1. After logging in, click **"New Project"**
2. Configure your project:
   - **Project Name**: `iron-neon-gym` (or your preferred name)
   - **Region**: Choose the closest to your users (e.g., `us-east-1`, `eu-central-1`)
   - **PostgreSQL Version**: 16 (latest)
3. Click **"Create Project"**

---

## Step 3: Get Your Connection String

1. After project creation, you'll see the **Connection Details** panel
2. Click **"Connection string"** tab
3. Copy the connection string - it looks like:
   ```
   postgresql://username:password@ep-cool-name-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### Connection String Components:
| Component | Example | Description |
|-----------|---------|-------------|
| Protocol | `postgresql://` | Database protocol |
| Username | `username` | Your Neon username |
| Password | `password` | Auto-generated password |
| Host | `ep-cool-name-123456.us-east-1.aws.neon.tech` | Neon endpoint |
| Database | `neondb` | Default database name |
| SSL Mode | `sslmode=require` | Required for secure connection |

---

## Step 4: Configure Backend Environment

### Update `/app/backend/.env`:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="your-secure-secret-key-here"
CORS_ORIGINS="*"
CASHFREE_CLIENT_ID="your-cashfree-client-id"
CASHFREE_CLIENT_SECRET="your-cashfree-secret"
CASHFREE_ENVIRONMENT="SANDBOX"
```

### Important Notes:
- Replace the entire `DATABASE_URL` value with your Neon connection string
- Keep the quotes around the value
- Do NOT commit `.env` files to version control
- Generate a strong `JWT_SECRET` for production

---

## Step 5: Restart Backend & Verify

```bash
# Restart the backend server
sudo supervisorctl restart backend

# Check logs for successful connection
tail -20 /var/log/supervisor/backend.err.log

# You should see:
# - "Database tables created"
# - "Default admin created: admin@ironandneon.com / admin123"
# - "Membership plans seeded"
# - "Trainers seeded"
```

---

## Step 6: Verify Database Tables

### Option A: Using Neon Dashboard
1. Go to your Neon project dashboard
2. Click **"Tables"** in the left sidebar
3. You should see these tables:
   - `admins`
   - `membership_plans`
   - `trainers`
   - `members`
   - `payments`
   - `contact_messages`

### Option B: Using SQL Editor
1. In Neon dashboard, click **"SQL Editor"**
2. Run this query:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

---

## Database Schema

### Tables Created:

#### `admins`
```sql
CREATE TABLE admins (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE
);
```

#### `membership_plans`
```sql
CREATE TABLE membership_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    duration_months INTEGER NOT NULL,
    price FLOAT NOT NULL,
    benefits TEXT NOT NULL,  -- JSON array
    popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE
);
```

#### `trainers`
```sql
CREATE TABLE trainers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialty VARCHAR(200) NOT NULL,
    experience_years INTEGER NOT NULL,
    bio TEXT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    certifications TEXT DEFAULT '[]',  -- JSON array
    created_at TIMESTAMP WITH TIME ZONE
);
```

#### `members`
```sql
CREATE TABLE members (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    date_of_joining TIMESTAMP WITH TIME ZONE,
    membership_plan_id VARCHAR(50) REFERENCES membership_plans(id),
    membership_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    membership_expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    trainer_id VARCHAR(36) REFERENCES trainers(id),
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE
);
```

#### `payments`
```sql
CREATE TABLE payments (
    id VARCHAR(36) PRIMARY KEY,
    member_id VARCHAR(36) REFERENCES members(id),
    order_id VARCHAR(50) UNIQUE NOT NULL,
    cf_order_id VARCHAR(100),
    payment_session_id VARCHAR(255),
    amount FLOAT NOT NULL,
    payment_method VARCHAR(50),
    payment_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'PENDING',
    due_amount FLOAT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE
);
```

#### `contact_messages`
```sql
CREATE TABLE contact_messages (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE
);
```

---

## Neon.tech Features & Tips

### 1. **Branching (Database Branches)**
Create isolated database copies for testing:
```bash
# In Neon Dashboard -> Branches -> Create Branch
# Use for staging/testing without affecting production
```

### 2. **Connection Pooling**
For high-traffic apps, enable pooling:
- Go to Project Settings -> Compute
- Connection pooling is enabled by default
- Use pooled connection string for production

### 3. **Auto-suspend**
- Free tier: Compute suspends after 5 minutes of inactivity
- First query after suspend takes ~1 second to "wake up"
- Upgrade to disable auto-suspend for production

### 4. **Backups**
- Point-in-time recovery available
- Go to Project -> Backups to restore

---

## Deployment Checklist

- [ ] Create Neon.tech account
- [ ] Create new project
- [ ] Copy connection string
- [ ] Update `/app/backend/.env` with connection string
- [ ] Set strong `JWT_SECRET` for production
- [ ] Restart backend: `sudo supervisorctl restart backend`
- [ ] Verify tables created in Neon dashboard
- [ ] Test API endpoints
- [ ] Add Cashfree credentials (optional)

---

## Troubleshooting

### Connection Refused
```
Error: connection refused
```
**Solution**: Check if connection string is correct, ensure `sslmode=require` is included

### SSL Certificate Error
```
Error: SSL SYSCALL error
```
**Solution**: Add `?sslmode=require` to connection string

### Tables Not Created
```
Error: relation "admins" does not exist
```
**Solution**: Restart backend to trigger table creation on startup

### Slow First Query
This is normal for Neon free tier (auto-suspend). First query after inactivity takes ~1 second.

---

## API Testing with Neon

```bash
# Test API health
curl https://your-app-url.com/api/

# Test plans endpoint
curl https://your-app-url.com/api/plans

# Test admin login
curl -X POST https://your-app-url.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ironandneon.com","password":"admin123"}'
```

---

## Security Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use environment variables** in production hosting
3. **Rotate database password** periodically in Neon dashboard
4. **Enable IP Allow List** in Neon for production
5. **Use read-only credentials** for analytics/reporting

---

## Support Resources

- Neon Documentation: https://neon.tech/docs
- Neon Discord: https://discord.gg/neon
- PostgreSQL Docs: https://www.postgresql.org/docs/
