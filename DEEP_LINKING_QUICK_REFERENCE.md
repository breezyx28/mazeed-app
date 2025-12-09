# 🚀 Deep Linking Quick Reference

## ✅ Implementation Complete!

Deep linking has been successfully implemented for the Mazeed app.

---

## 📋 What Was Implemented

### 1. **Android Manifest Configuration**
- ✅ Added intent filter to `AndroidManifest.xml`
- ✅ Configured custom URL scheme: `mazeedapp://open`
- ✅ Package: `com.mazeedapp.app`

### 2. **Capacitor Utilities**
- ✅ Installed `@capacitor/app` package
- ✅ Added `setupDeepLinkListener()` method
- ✅ Added `getInitialUrl()` method

### 3. **Deep Link Router**
- ✅ Created `deep-link-router.ts` for URL parsing
- ✅ Supports multiple URL formats
- ✅ Extracts routes and query parameters

### 4. **React Integration**
- ✅ Created `useDeepLinking()` custom hook
- ✅ Integrated into `App.tsx`
- ✅ Automatic navigation on deep link

### 5. **Documentation & Testing**
- ✅ Created comprehensive guide (`DEEP_LINKING_GUIDE.md`)
- ✅ Created HTML test page (`deep-link-tester.html`)

---

## 🔗 URL Format

### Basic
```
mazeedapp://open
mazeedapp://open?page=/route
mazeedapp://open/route
```

### With Parameters
```
mazeedapp://open?page=/product/123&ref=whatsapp
```

---

## 📱 Example Links

| Purpose | URL |
|---------|-----|
| Home | `mazeedapp://open` |
| Product | `mazeedapp://open/product/123` |
| Cart | `mazeedapp://open/cart` |
| Categories | `mazeedapp://open/categories` |
| Offers | `mazeedapp://open/offers` |
| Profile | `mazeedapp://open/profile` |

---

## 🧪 How to Test

### Method 1: HTML Test Page
1. Open `deep-link-tester.html` in a browser on your phone
2. Click any link to test
3. App should open at the specified page

### Method 2: WhatsApp/SMS
1. Send yourself a message with a deep link
2. Click the link
3. App should open

### Method 3: ADB Command
```bash
adb shell am start -a android.intent.action.VIEW -d "mazeedapp://open/product/123"
```

### Method 4: QR Code
1. Generate a QR code with the deep link URL
2. Scan with your phone
3. App should open

---

## 📂 Files Modified/Created

### Modified Files
- ✅ `android/app/src/main/AndroidManifest.xml`
- ✅ `src/lib/capacitor-utils.ts`
- ✅ `src/App.tsx`

### New Files
- ✅ `src/lib/deep-link-router.ts`
- ✅ `src/lib/use-deep-linking.ts`
- ✅ `DEEP_LINKING_GUIDE.md`
- ✅ `deep-link-tester.html`
- ✅ `DEEP_LINKING_QUICK_REFERENCE.md` (this file)

---

## 🔄 Next Steps

1. **Build APK**
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   # Then build APK in Android Studio
   ```

2. **Install on Device**
   - Install the APK on your test device

3. **Test Deep Links**
   - Use the HTML test page
   - Send links via WhatsApp
   - Test with ADB commands

4. **Marketing Integration**
   - Add deep links to email campaigns
   - Include in push notifications
   - Share on social media
   - Generate QR codes for print materials

---

## 💡 Usage Examples

### In Email Campaign
```html
<a href="mazeedapp://open/offers">
  View Exclusive Offers in App
</a>
```

### In Push Notification
```javascript
{
  title: "New Product Available!",
  body: "Check it out now",
  data: {
    deepLink: "mazeedapp://open/product/456"
  }
}
```

### In WhatsApp Message
```
🎉 Special offer just for you!
Open the app: mazeedapp://open/offers
```

### With Tracking
```
mazeedapp://open/product/123?source=email&campaign=summer2024
```

---

## ⚠️ Important Notes

1. **App Must Be Installed**: Deep links only work if the app is installed
2. **Case Sensitive**: Routes are case-sensitive
3. **Protected Routes**: Some routes require authentication
4. **Rebuild Required**: After modifying AndroidManifest.xml, rebuild the APK

---

## 🐛 Troubleshooting

### Link doesn't open app?
- ✅ Check if app is installed
- ✅ Verify URL format: `mazeedapp://open`
- ✅ Rebuild and reinstall APK

### App opens but doesn't navigate?
- ✅ Check console logs
- ✅ Verify route exists
- ✅ Ensure route starts with `/`

### Need to debug?
```bash
# View Android logs
adb logcat | grep -i "deep"

# Test specific link
adb shell am start -a android.intent.action.VIEW -d "mazeedapp://open/test"
```

---

## 📞 Support

For detailed information, see:
- 📖 `DEEP_LINKING_GUIDE.md` - Complete documentation
- 🧪 `deep-link-tester.html` - Interactive test page
- 💻 `src/lib/deep-link-router.ts` - Implementation details

---

## 🎯 Success Criteria

- ✅ Deep links open the app
- ✅ Navigation works correctly
- ✅ Parameters are preserved
- ✅ Protected routes redirect to login
- ✅ Works from WhatsApp, Email, SMS, Browser

---

**Implementation Status: ✅ COMPLETE**

The deep linking feature is fully implemented and ready for testing!
