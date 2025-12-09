# Supabase Storage Setup for Profile Avatars

## Step 1: Create Storage Bucket

1. Go to your **Supabase Dashboard**
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Enter bucket name: `profiles`
5. Set **Public bucket**: ✅ **YES** (checked)
6. Click **"Create bucket"**

## Step 2: Add Storage Policies

Go to **Storage** → **Policies** → Click on `profiles` bucket → **New Policy**

### Policy 1: Allow Authenticated Users to Upload

```sql
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = 'avatars'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
```

### Policy 2: Allow Public Read Access

```sql
CREATE POLICY "Public avatar access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profiles');
```

### Policy 3: Allow Users to Update Their Own Avatars

```sql
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = 'avatars'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
```

### Policy 4: Allow Users to Delete Their Own Avatars

```sql
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = 'avatars'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
```

## Step 3: Configure Session Duration (90 Days)

1. Go to **Authentication** → **Settings**
2. Find **"JWT Expiry"** setting
3. Set to: `7776000` seconds (90 days)
4. Enable **"Refresh Token Rotation"** for better security
5. Click **"Save"**

## Verification

After setup, test by:
1. Login with Google
2. Go to Profile page
3. Click camera icon to upload avatar
4. Image should upload successfully
5. Check Supabase Storage → profiles bucket → avatars folder
6. You should see your uploaded image

## File Structure in Storage

```
profiles/
└── avatars/
    └── {user-id}-{timestamp}.{ext}
```

Example: `profiles/avatars/524204f2-e67d-4cb9-8108-b971a8367768-1702123456789.jpg`

## Troubleshooting

**Upload fails with "Permission denied":**
- Check that all 4 policies are created correctly
- Verify bucket is set to Public
- Ensure user is authenticated

**Image doesn't display:**
- Check that Policy 2 (Public read access) is enabled
- Verify the URL in the database is correct
- Check browser console for CORS errors

**Session expires too quickly:**
- Verify JWT Expiry is set to 7776000 seconds
- Check that Refresh Token Rotation is enabled
- Clear browser cache and login again
