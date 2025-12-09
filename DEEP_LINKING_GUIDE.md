# Deep Linking Guide for Mazeed App

This guide explains how to use deep links to open the Mazeed mobile app from external sources like browsers, WhatsApp, emails, SMS, etc.

## 📱 What is Deep Linking?

Deep linking allows you to open your mobile app directly from a URL. When a user clicks on a special link, instead of opening in a browser, it launches your installed app and navigates to a specific page.

## 🔗 URL Scheme

The Mazeed app uses the custom URL scheme: **`mazeedapp://`**

### App ID
- **Package Name**: `com.mazeedapp.app`
- **App Name**: Mazzed

## 📝 URL Format

### Basic Format
```
mazeedapp://open?page=<route>
```

### Alternative Format
```
mazeedapp://open/<route>
```

### With Query Parameters
```
mazeedapp://open?page=<route>&param1=value1&param2=value2
```

## 🎯 Example Deep Links

### 1. Open Home Page
```
mazeedapp://open
mazeedapp://open?page=/
```

### 2. Open Product Detail
```
mazeedapp://open?page=/product/123
mazeedapp://open/product/123
```

### 3. Open Cart
```
mazeedapp://open?page=/cart
mazeedapp://open/cart
```

### 4. Open Categories
```
mazeedapp://open?page=/categories
mazeedapp://open/categories
```

### 5. Open Offers
```
mazeedapp://open?page=/offers
mazeedapp://open/offers
```

### 6. Open Search
```
mazeedapp://open?page=/search
mazeedapp://open/search
```

### 7. Open Profile (requires login)
```
mazeedapp://open?page=/profile
mazeedapp://open/profile
```

### 8. Open Wishlist (requires login)
```
mazeedapp://open?page=/wishlist
mazeedapp://open/wishlist
```

### 9. Open Orders (requires login)
```
mazeedapp://open?page=/my-orders
mazeedapp://open/my-orders
```

### 10. Open Product with Tracking Parameter
```
mazeedapp://open?page=/product/123&ref=whatsapp
mazeedapp://open?page=/product/456&source=email&campaign=summer2024
```

## 🌐 Using Deep Links

### In WhatsApp
Simply send the deep link as a message:
```
Check out this product! mazeedapp://open/product/123
```

### In Email (HTML)
```html
<a href="mazeedapp://open/product/123">View Product in App</a>
```

### In SMS
```
Get 50% off! Open the app: mazeedapp://open/offers
```

### In Web Browser
Create a clickable link:
```html
<a href="mazeedapp://open/cart">Open Cart in App</a>
```

### With Fallback (if app not installed)
```html
<a href="mazeedapp://open/product/123" 
   onclick="setTimeout(function() { 
     window.location = 'https://yourwebsite.com/product/123'; 
   }, 500);">
   View Product
</a>
```

## 🔧 Technical Implementation

### Android Manifest Configuration
The app is configured in `AndroidManifest.xml` with:
```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="mazeedapp" android:host="open" />
</intent-filter>
```

### Handling Deep Links in Code
The app uses:
1. **CapacitorUtils.setupDeepLinkListener()** - Listens for deep links when app is running
2. **CapacitorUtils.getInitialUrl()** - Gets the URL that launched the app
3. **useDeepLinking()** - React hook that sets up navigation

### Route Parsing
Deep links are parsed by `parseDeepLink()` function which:
- Extracts the route path
- Parses query parameters
- Returns a route object for navigation

## 📊 Available Routes

All routes from the app are available:

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Home page | No |
| `/product/:id` | Product detail | No |
| `/cart` | Shopping cart | Yes |
| `/search` | Search page | No |
| `/profile` | User profile | Yes |
| `/edit-profile` | Edit profile | Yes |
| `/shipping-address` | Shipping address | Yes |
| `/payment-methods` | Payment methods | Yes |
| `/my-orders` | Order history | Yes |
| `/wishlist` | Wishlist | Yes |
| `/notifications` | Notifications | Yes |
| `/settings` | Settings | Yes |
| `/checkout` | Checkout | Yes |
| `/payment-selection` | Payment selection | Yes |
| `/order-success` | Order success | Yes |
| `/categories` | Categories | No |
| `/offers` | Offers | No |
| `/product/:id/reviews` | Product reviews | No |

## ⚠️ Important Notes

1. **App Must Be Installed**: Deep links only work if the app is installed on the device. If not installed, the link will either:
   - Do nothing
   - Open in browser (if you provide a fallback)

2. **Protected Routes**: Routes marked as "Auth Required" will redirect to login if user is not authenticated.

3. **Case Sensitive**: Routes are case-sensitive. Use lowercase.

4. **Testing**: You can test deep links using:
   - ADB command: `adb shell am start -a android.intent.action.VIEW -d "mazeedapp://open/product/123"`
   - Send link via WhatsApp to yourself
   - Create a test HTML page with links

## 🧪 Testing Deep Links

### Using ADB (Android Debug Bridge)
```bash
# Test opening home
adb shell am start -a android.intent.action.VIEW -d "mazeedapp://open"

# Test opening product
adb shell am start -a android.intent.action.VIEW -d "mazeedapp://open/product/123"

# Test with parameters
adb shell am start -a android.intent.action.VIEW -d "mazeedapp://open?page=/product/123&ref=test"
```

### Create a Test HTML Page
```html
<!DOCTYPE html>
<html>
<head>
    <title>Mazeed Deep Link Tester</title>
</head>
<body>
    <h1>Mazeed App Deep Links</h1>
    <ul>
        <li><a href="mazeedapp://open">Home</a></li>
        <li><a href="mazeedapp://open/product/1">Product 1</a></li>
        <li><a href="mazeedapp://open/cart">Cart</a></li>
        <li><a href="mazeedapp://open/categories">Categories</a></li>
        <li><a href="mazeedapp://open/offers">Offers</a></li>
    </ul>
</body>
</html>
```

## 🚀 Marketing Use Cases

### 1. Push Notifications
When sending push notifications, include deep links to take users directly to relevant content:
```
"Your order has shipped! Track it here: mazeedapp://open/my-orders"
```

### 2. Email Campaigns
```html
<a href="mazeedapp://open/offers">View Exclusive Offers in App</a>
```

### 3. Social Media
Share product links that open directly in the app:
```
"Check out our new arrivals! mazeedapp://open/categories"
```

### 4. QR Codes
Generate QR codes with deep links for:
- Product packaging
- Print advertisements
- In-store displays

### 5. SMS Marketing
```
"Flash Sale! 50% off today only. Shop now: mazeedapp://open/offers"
```

## 📈 Tracking & Analytics

You can add tracking parameters to deep links:
```
mazeedapp://open/product/123?source=email&campaign=summer2024&medium=newsletter
```

These parameters will be available in your app's navigation state and can be logged for analytics.

## 🔐 Security Considerations

1. **Validate Input**: The app validates all deep link URLs before navigation
2. **Auth Protection**: Protected routes require authentication
3. **Sanitization**: All parameters are sanitized before use

## 🆘 Troubleshooting

### Deep Link Not Working?

1. **Check if app is installed**: Deep links only work with installed apps
2. **Verify URL format**: Ensure you're using `mazeedapp://open`
3. **Check Android version**: Deep links work on Android 6.0+
4. **Rebuild app**: After changing AndroidManifest.xml, rebuild the APK
5. **Check logs**: Use `adb logcat` to see deep link events

### App Opens But Doesn't Navigate?

1. Check console logs for parsing errors
2. Verify the route exists in your app
3. Ensure the route format is correct (starts with `/`)

## 📞 Support

For issues or questions about deep linking, check:
- Console logs in the app
- Android logcat output
- Deep link parsing in `deep-link-router.ts`
