
# Global Translator • Explorer Edition 🌍✨

A premium, AI-powered travel companion.

## 🚀 Choose Your Path (How to get the app on your phone)

### Path A: The "Pro" Way (Real APK)
*Best if you want to share the file with friends or put it on the Play Store.*
1. `npm install`
2. `npm run prepare-android`
3. `npx cap open android`
4. In Android Studio: **Build > Build APK**.

### Path B: The "Easy" Way (PWA - No Android Studio)
*Best for beginners. No big software installs needed.*
1. Upload your project to [Netlify](https://www.netlify.com/) (Drag and drop the `dist` folder).
2. Open the URL on your phone's Chrome browser.
3. Tap **Menu (⋮)** -> **"Install App"**.
4. The app icon appears on your home screen instantly!

### Path C: The "Cloud" Way (Appflow)
*Best if your computer is slow or you don't want to install Android Studio.*
1. Push your code to a **GitHub** repository.
2. Link it to [Ionic Appflow](https://ionicframework.com/appflow).
3. Click "Build" and download the resulting APK.

## 🔑 How to Add Your API Key (For Web/Netlify)
1. **Get your Key**: Go to [AI Studio](https://aistudio.google.com/).
2. **Set Variable**: In your hosting settings (Netlify/Vercel), add an environment variable:
   - Key: `VITE_API_KEY`
   - Value: `(Your API Key)`

## 🚀 Key Features
- **AI Vision**: Identify and translate via camera.
- **Neural Voice**: High-quality speech.
- **Flash Engine**: Instant Gemini 3 Flash translations.

## 📜 License
Created by **Stuart Corp**. All rights reserved.
