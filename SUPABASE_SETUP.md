# Supabase Setup Guide for Mazeed Store

## 1. Create a Supabase Project
1. Go to [Supabase](https://supabase.com/) and sign in.
2. Click "New Project".
3. Enter your project details (Name: Mazeed Store, Database Password "aNCpXydQNlwB005a").
4. Wait for the database to provision.

## 2. Run the Database Schema
1. Once your project is ready, go to the **SQL Editor** (icon on the left sidebar).
2. Click "New Query".
3. Open the file `database/schema.sql` from this project.
4. Copy the entire content of `schema.sql` and paste it into the SQL Editor.
5. Click **Run** (bottom right).
   - This will create all tables (Products, Orders, Users, etc.).
   - It will set up Row Level Security (RLS) policies.
   - It will seed the database with the initial categories and products.

## 3. Connect the App
1. Go to **Project Settings** (gear icon) -> **API**.
2. Copy the **Project URL** and **anon public key**.
3. Create a file named `.env` in the root of your project (copy `.env.example`).
4. Add your keys:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

## 4. Setup Authentication (SSO)
1. Go to **Authentication** -> **Providers**.
2. **Google**:
   - Enable Google.
   - You will need a Google Cloud Project.
   - Add the "Authorized Redirect URI" from Supabase to your Google Cloud Credentials.
   - Copy Client ID and Secret back to Supabase.
3. **Facebook** (Optional):
   - Enable Facebook.
   - Add the Redirect URI to your Facebook App settings.

## 5. Storage (Images)
1. Go to **Storage**.
2. Create a new bucket named `products`.
3. Make it **Public**.
4. Create another bucket named `avatars` (Public).

## 6. Verify
- Restart your app (`npm run dev`).
- Try logging in.
- Check the database tables to see the seeded data.
