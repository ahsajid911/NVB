# Healthcare Navigator Bangladesh - Deployment Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- A [Supabase](https://supabase.com) account (free tier works)
- A [Vercel](https://vercel.com) account (free tier works)
- Optional: [Google AI Studio](https://aistudio.google.com/) API key for Gemini

## Step 1: Supabase Setup

### 1.1 Create a Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose a project name (e.g., `healthnav-bd`)
4. Set a database password
5. Choose the region closest to Bangladesh (e.g., Singapore)
6. Click "Create Project"

### 1.2 Run Database Migrations
1. In your Supabase dashboard, go to SQL Editor
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run the query
4. Copy the contents of `supabase/seed/001_seed_data.sql`
5. Paste and run the query

### 1.3 Get API Keys
1. Go to Project Settings > API
2. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Anon Public Key** (starts with `eyJ...`)
   - **Service Role Key** (starts with `eyJ...`) - keep this secret!

## Step 2: Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Gemini API (optional)
GEMINI_API_KEY=your_gemini_api_key

# Site URL
NEXT_PUBLIC_SITE_URL=https://healthnav-bd.vercel.app
```

## Step 3: Install & Build

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Step 4: Deploy to Vercel

### 4.1 Connect Repository
1. Push your code to GitHub/GitLab/Bitbucket
2. Go to https://vercel.com/dashboard
3. Click "New Project"
4. Import your repository
5. Vercel will auto-detect Next.js

### 4.2 Configure Environment Variables
1. In Vercel project settings, go to "Environment Variables"
2. Add all variables from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_SITE_URL`

### 4.3 Deploy
1. Click "Deploy"
2. Wait for the build to complete
3. Your app is live at `https://healthnav-bd.vercel.app`

## Step 5: Post-Deployment

### 5.1 Import Seed Data
1. Go to `/admin` on your deployed site
2. Use the CSV Export feature to download seed data
3. The app is pre-populated with 50 doctors, 20 hospitals, 15 specialties, and 100 symptom mappings

### 5.2 Import Real Data
When real data is available:
1. Prepare CSV files matching the format in the Admin Dashboard
2. Go to `/admin`
3. Select the data type
4. Upload the CSV file
5. Review the import report

## CSV Format Reference

### Doctors CSV
```
name,qualifications,experience_years,consultation_fee,gender,contact_phone,chamber_address,available_days,bio
```

### Hospitals CSV
```
name,district_id,type,address,contact_phone,contact_email,website,departments
```

### Specialties CSV
```
name,slug,description,icon
```

## Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Homepage
│   ├── doctors/           # Doctor search & profiles
│   ├── specialties/       # Specialty directory
│   ├── hospitals/         # Hospital directory
│   ├── symptom-assistant/ # AI symptom checker
│   ├── admin/             # Admin dashboard
│   └── api/               # API routes
├── components/            # React components
│   ├── layout/            # Header, Footer
│   └── features/          # Feature components
├── data/                  # Seed data (in-memory)
├── services/              # Data service layer
├── types/                 # TypeScript types
└── lib/                   # Utilities
```

## Features

- **Doctor Search**: Search by name, specialty, hospital, district with filters
- **Specialty Directory**: Browse 15 medical specialties
- **Symptom Assistant**: AI-powered specialist recommendation (Gemini API + fallback)
- **Doctor Profiles**: Full profiles with similar doctors
- **Hospital Directory**: Browse 20 hospitals with departments
- **Admin Panel**: CSV import/export with validation
- **SEO**: Sitemap, robots.txt, OpenGraph, structured data
- **Mobile-First**: Responsive design for all devices
- **Accessibility**: WCAG-friendly, high contrast, large text

## Cost

This is a **free** social impact project:
- **Vercel**: Free tier (100GB bandwidth/month)
- **Supabase**: Free tier (500MB database, 50K monthly active users)
- **Gemini API**: Free tier available
- Total hosting cost: **$0/month**

## Support

For issues or questions, refer to the project documentation or create an issue in the repository.
