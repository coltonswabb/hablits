# Hablits - App Store Submission Guide

## ✅ Required Files (Already Complete)

- [x] App icons in `assets/` folder (1024x1024 PNG)
- [x] Privacy policy ([PRIVACY_POLICY.md](PRIVACY_POLICY.md))
- [x] App.json configured with bundle IDs and permissions
- [x] Screenshots (see recommendations below)

---

## 📱 App Store Connect (iOS)

### Basic Information
- **App Name:** Hablits
- **Subtitle:** Build better habits
- **Bundle ID:** com.hablits.app
- **Primary Category:** Health & Fitness
- **Secondary Category:** Productivity

### App Description
```
Transform your daily routine into an adventure with Hablits - the habit tracker that makes building better habits fun and rewarding.

GROW WITH YOUR PET COMPANION
Watch your adorable pet companion grow and change as you complete your habits. The more consistent you are, the happier your pet becomes! Choose from multiple pet designs that match your vibe.

BEAUTIFUL THEMES FOR EVERY MOOD
Express yourself with stunning themes including Light, Dark, Super Dark, Vapor Wave, Forest, Ocean, Sunset, and more. Create your own custom accent colors to make the app truly yours.

POWERFUL HABIT TRACKING
• Quick-add habits to your daily routine
• Set specific times and create morning/evening routines
• Track fasting periods with built-in timer
• Calendar view shows your consistency at a glance
• Week view displays your current streak
• Add notes and reflections to any habit completion

FASTING TIMER BUILT-IN
Track intermittent fasting with dedicated timer cards. Set your fasting duration (12h, 16h, 18h, or custom) and get notified when complete. View all your fasting history in the calendar.

STAY ON TRACK
• Daily habit reminders at your chosen time
• Completion notifications for fasting timers
• Motivational pet reactions to keep you going

PRIVACY FIRST
All your data stays on your device. Export your progress anytime. No accounts, no tracking, no ads.

DESIGNED FOR SIMPLICITY
Clean, intuitive interface that gets out of your way. Focus on what matters - building the habits that will change your life.

Whether you're starting your first habit or maintaining dozens, Hablits makes every day count. Your pet is waiting for you!
```

### Keywords (100 characters max)
```
habit,tracker,routine,fasting,timer,pet,productivity,goals,streaks,journal
```

### Support URL
Use your GitHub repository or create a simple page:
```
https://github.com/yourusername/hablits
```

### Privacy Policy URL
You'll need to host the privacy policy online. Options:
1. Create a GitHub Pages site
2. Upload to your personal website
3. Use a free hosting service

For now, upload `PRIVACY_POLICY.md` to:
```
https://yourusername.github.io/hablits/privacy-policy
```

### What's New (Version 1.0.0)
```
Welcome to Hablits! 🎉

• Track daily habits with a cute pet companion
• 17 beautiful themes to choose from
• Create morning and evening routines
• Built-in intermittent fasting timer
• Daily reminder notifications
• Calendar and stats views
• Export your data anytime
• Complete privacy - all data stored locally
```

---

## 🤖 Google Play Console

### Basic Information
- **App Name:** Hablits
- **Short Description (80 characters):**
```
Build better habits with your virtual pet. Track routines, fasting & more!
```

### Full Description (4000 characters max)
Use the same description as iOS above.

### Category
- **Primary:** Health & Fitness
- **Tags:** Productivity, Self Improvement, Lifestyle

### Contact Information
- **Email:** your@email.com
- **Website:** https://github.com/yourusername/hablits
- **Privacy Policy:** (same URL as iOS)

### Content Rating
- **Target Age:** Everyone
- **Content Descriptors:** None (no violence, mature content, etc.)

---

## 📸 Screenshot Requirements

### iOS App Store
**Required sizes:**
- iPhone 6.7" (1290 x 2796) - iPhone 14/15 Pro Max
- iPhone 6.5" (1242 x 2688) - iPhone XS Max, 11 Pro Max
- iPhone 5.5" (1242 x 2208) - iPhone 8 Plus

**Optional:**
- iPad Pro 12.9" (2048 x 2732)

### Google Play Store
**Required sizes:**
- Phone: 1080 x 1920 minimum
- 7" Tablet: 1920 x 1200 minimum (optional)
- 10" Tablet: 2560 x 1600 minimum (optional)

### Recommended Screenshots (in order)

1. **Today Screen** - Show pet, habit cards, and progress
   - Caption: "Track habits with your companion"

2. **Fasting Timer** - Active fasting card with countdown
   - Caption: "Built-in fasting timer"

3. **Calendar View** - Month view with colored completion dots
   - Caption: "Visualize your consistency"

4. **Week View** - Current week with streaks
   - Caption: "Build streaks that matter"

5. **Theme Picker** - Grid of available themes
   - Caption: "Beautiful themes for every mood"

6. **Day Plan** - Habits organized by time of day
   - Caption: "Plan your perfect day"

7. **Settings** - Show notification settings
   - Caption: "Smart reminders keep you on track"

**Screenshot Tips:**
- Use realistic habit names users relate to
- Show good consistency (filled calendars)
- Use vibrant themes (Vapor Wave, Forest, Ocean)
- Make sure pet is visible and happy
- Include some completed habits with notes

---

## 🏗️ Building for Submission

### Step 1: Login to EAS
```bash
npx eas login
```

### Step 2: Configure Build Profile
First, create `eas.json` if it doesn't exist:
```bash
npx eas build:configure
```

### Step 3: Build for iOS
```bash
npx eas build --platform ios --profile production
```

### Step 4: Build for Android
```bash
npx eas build --platform android --profile production
```

### Step 5: Submit to Stores
```bash
# iOS (requires Apple Developer account)
npx eas submit --platform ios

# Android (requires Google Play Developer account)
npx eas submit --platform android
```

**Note:** Builds take 10-20 minutes. You'll get a download link when complete.

---

## ✅ Pre-Submission Checklist

### Required
- [ ] Test app thoroughly on real devices
- [ ] Verify notifications work (both daily reminders and fasting timers)
- [ ] Test habit reset at midnight in your timezone
- [ ] Take all required screenshots
- [ ] Host privacy policy online and add URL to app.json
- [ ] Set up App Store Connect and Google Play Console accounts
- [ ] Add payment information (if needed for developer accounts)

### Recommended
- [ ] Test on multiple iOS versions
- [ ] Test on multiple Android versions
- [ ] Test with different timezones
- [ ] Export/import data to verify it works
- [ ] Test all themes
- [ ] Test with many habits (stress test)

---

## 💰 Costs

- **Apple Developer Account:** $99/year
- **Google Play Developer Account:** $25 one-time

---

## ⏱️ Review Timeline

- **Apple App Store:** Typically 24-48 hours
- **Google Play Store:** Typically a few hours to 7 days

---

## 🐛 Known Issues to Test

1. **Timezone handling** - Fixed in latest version, verify habits reset at local midnight
2. **Notifications** - Test on both iOS and Android
3. **Data persistence** - Verify data survives app updates

---

## 📞 Support

If you encounter issues during submission:
1. Check Expo documentation: https://docs.expo.dev/submit/introduction/
2. Review store-specific guidelines
3. Contact support if rejection occurs

Good luck with your submission! 🚀
