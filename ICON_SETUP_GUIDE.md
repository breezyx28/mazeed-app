# Icon Setup Guide for Mazeed Store

## ✅ Setup Complete!

All icons and manifests have been successfully configured for both web and Android platforms.

---

## What Was Configured

### 1. Web (HTML & Manifest) ✅

#### **index.html** - Added:
- ✅ Favicon links (16x16, 32x32, favicon.ico)
- ✅ Apple touch icon for iOS devices (180x180)
- ✅ Web manifest reference
- ✅ Theme color meta tags (#8B5CF6 - purple)
- ✅ Apple-specific meta tags for PWA support
- ✅ Apple mobile web app configuration

#### **site.webmanifest** - Configured with:
- ✅ App name: "Mazzed | مزيد"
- ✅ Short name: "Mazzed"
- ✅ App description in Arabic
- ✅ Theme color: #8B5CF6 (purple)
- ✅ Background color: #FFFFFF
- ✅ Icon references (192x192, 512x512) with "maskable" support
- ✅ RTL support (dir: "rtl", lang: "ar")
- ✅ Display mode: "standalone" (PWA)
- ✅ Categories: shopping, lifestyle

### 2. Android (Capacitor) ✅

#### **Icons Generated**
Using `@capacitor/assets`, all Android icons have been generated in the following sizes:
- ✅ mipmap-mdpi (48x48px)
- ✅ mipmap-hdpi (72x72px)
- ✅ mipmap-xhdpi (96x96px)
- ✅ mipmap-xxhdpi (144x144px)
- ✅ mipmap-xxxhdpi (192x192px)

Each folder contains:
- `ic_launcher.png` (square icon)
- `ic_launcher_round.png` (round icon)
- `ic_launcher_foreground.png` (adaptive icon foreground)

#### **Splash Screens Generated**
Splash screens created for all orientations and densities:
- ✅ Portrait: hdpi, mdpi, xhdpi, xxhdpi, xxxhdpi
- ✅ Landscape: hdpi, mdpi, xhdpi, xxhdpi, xxxhdpi

#### **Android Resources**
- ✅ `colors.xml` - Created with brand purple (#8B5CF6)
- ✅ `strings.xml` - App name "Mazeed" configured
- ✅ `styles.xml` - Already using color references
- ✅ `AndroidManifest.xml` - Properly configured with icon references

#### **Capacitor Sync**
- ✅ Ran `npx cap sync android` successfully
- ✅ Web assets copied to Android app

---

## Source Files

### Icon Sources
Located in: `/public/assets/icons/`
- `android-chrome-192x192.png` (192x192)
- `android-chrome-512x512.png` (512x512) - **Main source for Android**
- `apple-touch-icon.png` (180x180)
- `favicon-16x16.png`
- `favicon-32x32.png`
- `favicon.ico`

### Configuration Files
- `/assets.json` - Capacitor assets configuration
- `/index.html` - HTML with icon links
- `/public/assets/icons/site.webmanifest` - Web app manifest
- `/android/app/src/main/res/values/colors.xml` - Android theme colors

---

## Testing Your Setup

### Web Testing
1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Preview locally:**
   ```bash
   npm run preview
   ```

3. **Check these items:**
   - ✓ Browser tab shows favicon
   - ✓ "Add to Home Screen" shows app icon
   - ✓ PWA install prompt appears (on supported browsers)
   - ✓ Theme color matches purple (#8B5CF6) in mobile browser

### Android Testing
1. **Open in Android Studio:**
   ```bash
   npx cap open android
   ```

2. **Build and run on device/emulator**

3. **Verify these items:**
   - ✓ App icon appears in launcher
   - ✓ Icon looks sharp (not pixelated)
   - ✓ Splash screen shows on app launch
   - ✓ Splash screen has purple background
   - ✓ Adaptive icon works on Android 8+

### PWA Testing
1. **Deploy to HTTPS server** (required for PWA)
2. **Open in Chrome/Edge on mobile**
3. **Check:**
   - ✓ Install prompt appears
   - ✓ Installed app has correct icon
   - ✓ App opens in standalone mode (no browser UI)

---

## Theme Colors

**Current Brand Color:** `#8B5CF6` (Purple)

### Where It's Used:
- Web manifest theme color
- Android status bar color
- Android app primary color
- HTML meta theme-color

### To Change Theme Color:
1. Update `index.html`:
   ```html
   <meta name="theme-color" content="#YOUR_COLOR" />
   ```

2. Update `site.webmanifest`:
   ```json
   "theme_color": "#YOUR_COLOR",
   "background_color": "#YOUR_COLOR"
   ```

3. Update `android/app/src/main/res/values/colors.xml`:
   ```xml
   <color name="colorPrimary">#YOUR_COLOR</color>
   ```

4. Update `assets.json` and regenerate:
   ```json
   "background": "#YOUR_COLOR"
   ```
   Then run: `npx @capacitor/assets generate --android`

---

## Regenerating Icons

If you update your source icon (`android-chrome-512x512.png`), regenerate all Android assets:

```bash
npx @capacitor/assets generate --android
npx cap sync android
```

---

## Troubleshooting

### Icons not showing on web?
- Clear browser cache (Ctrl+Shift+Delete)
- Check browser console for 404 errors
- Verify paths: `/assets/icons/favicon.ico` should be accessible
- Hard reload: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Icons not showing on Android?
1. Clean project in Android Studio: `Build > Clean Project`
2. Rebuild: `Build > Rebuild Project`
3. Re-sync Capacitor: `npx cap sync android`
4. Uninstall app from device and reinstall

### PWA not installable?
- Must be served over HTTPS (localhost is OK for testing)
- Check manifest is valid: Chrome DevTools > Application > Manifest
- Ensure all required manifest fields are present
- Check service worker is registered (if you have one)

### Splash screen not showing?
- Verify splash.png exists in all drawable folders
- Check `styles.xml` has `AppTheme.NoActionBarLaunch` style
- Ensure `AndroidManifest.xml` uses the launch theme

---

## Files Modified

### Created:
1. ✅ `/assets.json` - Capacitor assets configuration
2. ✅ `/android/app/src/main/res/values/colors.xml` - Theme colors
3. ✅ `/ICON_SETUP_GUIDE.md` - This guide

### Modified:
1. ✅ `/index.html` - Added icon and manifest links
2. ✅ `/public/assets/icons/site.webmanifest` - Complete app manifest

### Generated (by @capacitor/assets):
1. ✅ All `/android/app/src/main/res/mipmap-*/` icons
2. ✅ All `/android/app/src/main/res/drawable-*/splash.png` files

---

## Next Steps

1. **Test on real device** - Install and verify icons look good
2. **Test PWA installation** - Try "Add to Home Screen" on mobile
3. **Deploy to production** - Icons will work on live site
4. **Consider iOS** - If you plan to support iOS, run:
   ```bash
   npx @capacitor/assets generate --ios
   ```

---

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all files are in correct locations
3. Ensure Capacitor is up to date: `npm update @capacitor/cli @capacitor/core`
4. Check Capacitor docs: https://capacitorjs.com/docs
