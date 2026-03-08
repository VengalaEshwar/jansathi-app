# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.



Option 1 — Share via Expo Go (Easiest, for testers)
Users need Expo Go installed. Good for internal testing only.
Step 1 — Publish to Expo
bashnpx expo publish
or with EAS Update:
bashnpx expo install expo-updates
eas update --branch main --message "first release"
```

### Step 2 — Share the link
After publishing, share:
```
exp://exp.host/@eshwar_1617/jansathi-app
Users open this in Expo Go app.
Limitation: Only works if users have Expo Go installed. Not suitable for general public.

Option 2 — Standalone APK via EAS Build (Recommended)
This creates a real .apk or .aab file users can install directly.
Step 1 — Install EAS CLI
bashnpm install -g eas-cli
eas login
Step 2 — Configure EAS
basheas build:configure
This creates eas.json. Make sure it looks like:
json{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
Step 3 — Check app.json
Make sure these are set:
json{
  "expo": {
    "name": "JanSathi",
    "slug": "jansathi-app",
    "version": "1.0.0",
    "scheme": "jansathi",
    "android": {
      "package": "com.eshwar.jansathi",
      "googleServicesFile": "./android/app/google-services.json",
      "versionCode": 1
    }
  }
}
Step 4 — Build APK (for sharing/testing)
basheas build --platform android --profile preview

EAS builds it on their cloud servers
Takes ~10-15 minutes
You get a download link for the .apk
Share that link — users download and install directly

Step 5 — Share the APK
After build completes:
basheas build:list
Copy the download URL and share with testers. They enable "Install from unknown sources" on their Android phone and install it.

Option 3 — Google Play Store (For public release)
Step 1 — Build AAB
basheas build --platform android --profile production
```

### Step 2 — Create Google Play Developer Account
- Go to [play.google.com/console](https://play.google.com/console)
- One-time registration fee: **₹2,000 (~$25)**

### Step 3 — Create new app in Play Console
- Fill in app details, screenshots, description
- Upload the `.aab` file from EAS build

### Step 4 — Submit for review
- Google reviews take 1-3 days for first submission

---

## My Recommendation for JanSathi right now

Since it's still in development:
```
Option 2 (EAS Preview APK) → best for sharing with testers
bash# One-time setup
npm install -g eas-cli
eas login
eas build:configure

# Build shareable APK
eas build --platform android --profile preview
Share the APK download link with your testers. No Play Store account needed yet.

Enable Developer Options on your phone → Settings → About Phone → tap Build Number 7 times
Enable USB Debugging → Settings → Developer Options → USB Debugging → ON
Connect phone via USB → allow the connection prompt on phone

Then run:
bashnpx expo run:android --variant release
```

Use `--variant release` to get the production build (same as EAS preview). Without it you get a debug build.

The APK will also be saved at:
```
android/app/build/outputs/apk/release/app-release.apk