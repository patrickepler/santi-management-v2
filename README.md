# Santi Management V2 (with Clerk Auth)

Project management system for sustainable development.

## 🔐 Authentication

This version uses **Clerk** for authentication.

### Demo Users (create in Clerk Dashboard → Users → Create User)

| Name | Email | Password | Role |
|------|-------|----------|------|
| Patrick | patrick@santi.com | demo123 | Admin + Manager |
| David | david@santi.com | demo123 | Manager |
| Jean | jean@santi.com | demo123 | Worker |
| Ball | ball@santi.com | demo123 | Procurement |

## 🚀 Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Add Environment Variables
Create `.env.local` with your Clerk keys:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

### 3. Create Users in Clerk
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Click **Users** → **Create User**
3. Add each demo user with their email/password

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
santi-management-v2/
├── app/
│   ├── page.js        # Main application
│   ├── layout.js      # ClerkProvider wrapper
│   └── globals.css    # Global styles
├── middleware.ts      # Clerk middleware
├── package.json
└── README.md
```

## 🔑 User Roles

| Role | Permissions |
|------|-------------|
| Admin | Full access, manage all users and settings |
| Manager | Full access, see all users' tasks |
| Worker | View own tasks, update status |
| Procurement | Manage supply chain tasks |

## 📋 Phase 3: Add Database (Supabase)

After Clerk is working, add Supabase for data persistence:

1. Create project at [supabase.com](https://supabase.com)
2. Run `supabase-schema.sql` in SQL Editor
3. Add keys to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

Note: We use **Clerk for auth**, **Supabase for data only**.
