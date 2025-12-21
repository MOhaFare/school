# 🚀 Deployment Guide

Your School Management System is ready to be deployed to the web.

## Option 1: Deploy to Netlify (Recommended)

1.  **Push your code** to GitHub, GitLab, or Bitbucket.
2.  Log in to [Netlify](https://www.netlify.com/).
3.  Click **"Add new site"** > **"Import an existing project"**.
4.  Select your repository.
5.  **Build Settings:**
    *   **Build command:** `yarn build`
    *   **Publish directory:** `dist`
6.  **Environment Variables:**
    *   Click "Show advanced" or go to "Site settings" > "Environment variables".
    *   Add the variables from your `.env` file:
        *   `VITE_SUPABASE_URL`: Your Supabase Project URL
        *   `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
7.  Click **"Deploy site"**.

## Option 2: Deploy to Vercel

1.  Log in to [Vercel](https://vercel.com/).
2.  Click **"Add New..."** > **"Project"**.
3.  Import your repository.
4.  **Environment Variables:**
    *   Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5.  Click **"Deploy"**.

## 🗄️ Database (Pure PostgreSQL)

Your database is hosted on Supabase, which provides a standard **PostgreSQL** connection.

### How to connect using standard SQL tools:
You can connect to your database using **pgAdmin**, **DBeaver**, or **TablePlus** using the connection string:

1.  Go to your Supabase Dashboard.
2.  Navigate to **Settings** > **Database**.
3.  Under **Connection string**, select **URI**.
4.  It will look like: `postgresql://postgres:[YOUR-PASSWORD]@db.Ref...supabase.co:5432/postgres`

This confirms you are using a standard PostgreSQL database backend.
