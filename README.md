# Santi Management V2

Project management system for sustainable development.

## 🚀 Quick Start

### Step 1: Install & Run Locally
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

**Demo Logins (password: `demo123` for all):**

| Name | Email | Role |
|------|-------|------|
| Patrick | patrick@santi.com | Admin + Manager |
| David | david@santi.com | Manager |
| Jean | jean@santi.com | Worker |
| Ball | ball@santi.com | Procurement |

### Step 2: Deploy to Vercel
1. Push to GitHub
2. Connect repo to Vercel
3. Deploy (works with mock data immediately!)

---

## 📋 Phase 2: Add Real Authentication (Clerk)

### Setup Clerk
1. Go to [clerk.com](https://clerk.com) and create account
2. Create new application
3. Copy keys to `.env.local`:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

### Create Users in Clerk Dashboard
1. Go to Users → Add User
2. Set email and password manually
3. No email verification needed

---

## 📋 Phase 3: Add Database (Supabase)

### Setup Supabase (DATA only, not auth)
1. Go to [supabase.com](https://supabase.com) and create project
2. Run the schema SQL (see `supabase-schema.sql`)
3. Copy keys to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

Note: We use Clerk for authentication, Supabase only for data storage.

---

## 📁 Project Structure

```
santi-management-v2/
├── app/
│   ├── page.js      # Main application
│   ├── layout.js    # Root layout
│   └── globals.css  # Global styles
├── lib/             # Utilities (Clerk, Supabase)
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
