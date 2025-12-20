# 📦 Video Strategy & Architecture Guide

This document defines the **best, scalable, and legally safe strategy** for handling product videos and images in your **ReactJS + Capacitor Android E‑Shop app**, using **Supabase** and **Cloudflare Stream**, while avoiding storage and bandwidth limitations.

---

## 🎯 Goals

- Support **reels-style product videos** (scroll & autoplay)
- Minimize **storage & bandwidth costs**
- Stay **Google Play compliant**
- Avoid **copyright & platform policy risks**
- Keep architecture **simple & scalable**

---

## 🧱 Recommended Architecture (High-Level)

```
ReactJS + Capacitor (Android App)
        ↓
Supabase (Auth, DB, Images, Metadata)
        ↓
Cloudflare Stream (Video Storage & Streaming)
```

### Why this works

- Supabase excels at **auth + database + images**
- Cloudflare Stream is optimized for **short videos & reels**
- No bandwidth charges for video streaming
- Clean separation of responsibilities

---

## 🗂️ Responsibility Breakdown

### Supabase (Free / Low Cost)

Use Supabase for:

- Authentication (users, sellers, admins)
- Product database
- Orders & cart data
- **Images only** (products, thumbnails, profiles)
- Video metadata (Cloudflare video IDs)

🚫 Do NOT use Supabase for:

- Reels videos
- Auto-play video feeds
- High-traffic media

---

### Cloudflare Stream (Video Layer)

Use Cloudflare Stream for:

- Product short videos (reels)
- Encoding & adaptive streaming (HLS)
- Public playback (no auth required)
- High-performance mobile playback

Benefits:

- No bandwidth billing
- Pay only for storage (minutes)
- Works perfectly inside Android WebView

---

## 🎥 Video Rules (VERY IMPORTANT)

To control costs and performance, enforce **hard limits**:

### Video Upload Constraints

- ⏱ Max duration: **10–30 seconds**
- 📐 Resolution: **720p max**
- 📦 Max file size: **10 MB** (recommended)
- 🎞 Format: MP4 (H.264)

### Seller Limits

- Max videos per product: **1–3**
- Max videos per seller: configurable (e.g. 20)

These rules keep Cloudflare costs **near zero** at small scale.

---

## 🔐 Secure Upload Flow (Best Practice)

### ❌ Never upload directly from the app to Cloudflare with API keys

### ✅ Correct upload flow

```
Mobile App
   ↓ request upload
Supabase Edge Function
   ↓ create upload URL
Cloudflare Stream API
   ↓ signed upload URL
Mobile App uploads video
```

Why:

- Protects your Cloudflare account
- Prevents abuse
- Allows validation (size, duration, user role)

---

## ▶️ Video Playback Strategy

- Use Cloudflare **public playback URLs**
- No authentication required
- No cookies or login walls

### Playback rules

- Auto-play only when visible
- Mute by default
- Pause when off-screen
- Use `playsinline` for mobile

This avoids bandwidth waste and improves UX.

---

## 🖼 Image Strategy (Supabase)

### Image Optimization Rules

- Use WebP format
- Max width: 1080px
- Average size target: **< 250 KB**

### Storage Structure

```
buckets/
 ├─ products/
 │   ├─ product_id/
 │   │   ├─ cover.webp
 │   │   └─ thumb.webp
 ├─ profiles/
 └─ categories/
```

This allows thousands of images within Supabase Free tier.

---

## 📊 Data Model (Simplified)

### Products Table

```sql
id
name
description
price
image_url
video_id (Cloudflare)
created_at
```

### Videos Table (Optional)

```sql
id
product_id
cloudflare_video_id
duration
status
```

---

## 💰 Cost Control Strategy

### Cloudflare Stream

- Pay per **minute stored / month**
- Pay once for encoding
- Delete unused videos to stop billing

### Supabase

- Avoid videos completely
- Monitor storage dashboard
- Clean unused images periodically

---

## 🧹 Cleanup & Maintenance (CRITICAL)

Implement automatic cleanup:

- Delete videos when product is deleted
- Remove rejected seller uploads
- Expire unused draft uploads

This prevents silent cost growth.

---

## ⚖️ Legal & Policy Safety

✔ Sellers upload **their own videos only**
✔ Seller confirms ownership rights
✔ No TikTok / Instagram embeds
✔ No third-party copyrighted content

Add a checkbox:

> "I confirm this video belongs to me or my business"

---

## 🚫 What NOT to Do

❌ Embed Instagram / TikTok / Facebook reels
❌ Build feeds from social media URLs
❌ Auto-play long videos
❌ Store videos in Supabase
❌ Remove attribution from third-party content

---

## 🚀 Future Scaling (Optional)

When the app grows:

- Add moderation queue for videos
- Add analytics (views per product)
- Move to Cloudflare paid tier if needed
- Introduce video compression presets

Architecture remains unchanged.

---

## ✅ Final Recommendation

This strategy:

- Keeps costs predictable
- Avoids storage & bandwidth limits
- Passes Google Play review
- Scales smoothly
- Is legally safe

**This is the correct long-term foundation for your E‑Shop app.**

---

If needed next:

- API code examples (Supabase → Cloudflare)
- Seller upload UI UX
- Cost estimation calculator
- Video moderation flow
