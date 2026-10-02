# 🗳️ Android Voting App & Admin Dashboard Demo

A modern, lightweight, real-time voting application demonstration consisting of:
1. **Android Mobile App (React Native + Expo)**: A simple, user-friendly interface for voting between **Senior Citizen** and **Government Servant**.
2. **Admin Dashboard (React + Vite + Tailwind CSS)**: A real-time monitoring dashboard displaying live vote tallies, percentages, visual progress comparisons, and a vote reset feature.
3. **Firebase Realtime Database**: Free-tier cloud database storing real-time vote counts with zero personal data collection.

---

## 📁 Project Structure

```text
App_demo/
├── mobile/                  # React Native (Expo) Mobile Voting App
│   ├── App.js               # Main Voting & Confirmation UI
│   ├── firebaseConfig.js    # Firebase Realtime Database Client
│   ├── app.json             # Expo App Configuration
│   ├── package.json         # Mobile Dependencies
│   └── .env.example         # Mobile Environment Variable Template
│
├── admin/                   # React + Vite + Tailwind CSS Admin Dashboard
│   ├── index.html           # Dashboard Entry Point
│   ├── src/
│   │   ├── App.jsx          # Admin Results, Live Sync & Reset Modal
│   │   ├── firebase/
│   │   │   └── config.js    # Admin Firebase Database Client
│   │   ├── main.jsx         # React Entry Point
│   │   └── index.css        # Tailwind CSS Directives & Styles
│   ├── tailwind.config.js   # Tailwind Configuration
│   ├── vite.config.js       # Vite Server & Build Setup
│   ├── package.json         # Admin Dependencies
│   └── .env.example         # Admin Environment Variable Template
│
├── .env.example             # Root Environment Variable Template
├── .gitignore               # Ignored Files & Build Artifacts
└── README.md                # Setup & Deployment Instructions
```

---

## 🚀 Step 1: Firebase Project Setup

### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Name your project (e.g., `voting-demo-app`) and click **Continue**.
4. Disable Google Analytics (optional for demo) and click **Create project**.

### 2. Enable Realtime Database
1. In the left navigation menu, go to **Build** -> **Realtime Database**.
2. Click **Create Database**.
3. Select your Database location (e.g., `United States (us-central1)` or closest region) and click **Next**.
4. Start in **Test Mode** (or select **Locked Mode** and set security rules below) and click **Enable**.

### 3. Configure Database Security Rules
In the Firebase Console, navigate to **Realtime Database** -> **Rules** tab and paste the following rules:

```json
{
  "rules": {
    "votes": {
      ".read": true,
      ".write": true
    }
  }
}
```
*Click **Publish**.*

### 4. Initialize Database Data (Optional)
In **Realtime Database** -> **Data** tab, you can set the initial structure (if not set, the app creates it automatically upon first vote):

```json
{
  "votes": {
    "seniorCitizen": 0,
    "governmentServant": 0
  }
}
```

### 5. Obtain Firebase Web Credentials
1. In your Firebase project settings (gear icon ⚙️ -> **Project settings**), scroll to **Your apps**.
2. Click the **Web icon (`</>`)** to add a Web App.
3. Register app name (e.g., `VotingApp`).
4. Copy the `firebaseConfig` keys (API Key, Auth Domain, Database URL, Project ID, Storage Bucket, Messaging Sender ID, App ID).

---

## 🔐 Step 2: Environment Variables Setup

### Mobile App Setup (`mobile/`)
Create a `.env` file in the `mobile/` folder:

```bash
cd mobile
cp .env.example .env
```

Edit `mobile/.env` with your Firebase values:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Admin Dashboard Setup (`admin/`)
Create a `.env` file in the `admin/` folder:

```bash
cd ../admin
cp .env.example .env
```

Edit `admin/.env` with your Firebase values:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 📱 Step 3: Running the Mobile App (Expo)

1. Open terminal and navigate to `mobile/`:
   ```bash
   cd mobile
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npm start
   ```

4. **Testing Options**:
   - **Expo Go App**: Install *Expo Go* on your Android phone from Google Play Store. Scan the QR code displayed in terminal to launch the app.
   - **Android Emulator**: Press `a` in terminal to launch on connected Android emulator.
   - **Web Browser**: Press `w` in terminal to run in web mode.

---

## 💻 Step 4: Running the Admin Dashboard (React + Vite)

1. Open terminal and navigate to `admin/`:
   ```bash
   cd admin
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser.

---

## 📦 Step 5: Building the Android APK

To build a standalone APK for Android phones using Expo EAS:

1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```

2. Log in to your Expo account:
   ```bash
   eas login
   ```

3. Configure EAS build in `mobile/`:
   ```bash
   cd mobile
   eas build:configure
   ```

4. Add `eas.json` profile for APK generation:
   ```json
   {
     "build": {
       "preview": {
         "android": {
           "buildType": "apk"
         }
       }
     }
   }
   ```

5. Run the APK build command:
   ```bash
   eas build -p android --profile preview
   ```

6. Once completed, Expo will provide a download link for the `.apk` file. Transfer it to any Android device to install and test!

---

## 🌐 Step 6: Deploying Admin Dashboard to Vercel

1. Push your repository code to GitHub.
2. Sign in to [Vercel](https://vercel.com/) with your GitHub account.
3. Click **Add New Project** -> **Import Git Repository**.
4. Select the `admin` folder as your **Root Directory**.
5. Configure Build Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Under **Environment Variables**, add the `VITE_FIREBASE_*` variables from your `admin/.env`.
7. Click **Deploy**. Vercel will host your Admin Dashboard live on a free `.vercel.app` URL!

---

## 🔄 Step 7: Testing the Complete Voting Flow

1. Open the **Mobile App** on your phone / emulator.
2. Select **Senior Citizen** 👴 card -> Tap **[ VOTE ]**.
3. Observe **Submitting...** loading state -> See **✓ Vote Submitted** screen.
4. Switch to the **Admin Dashboard** in your browser.
5. Notice the **Senior Citizen** tally immediately increments in real-time!
6. Open the Mobile App again -> Click **BACK TO HOME** -> Select **Government Servant** 🧑‍💼 -> Tap **[ VOTE ]**.
7. Confirm live tally and horizontal comparison progress bars update dynamically on the Admin Dashboard.
8. On the Admin Dashboard, click **RESET ALL VOTES** -> Confirm in modal -> Observe all tallies return to `0`.

---

## 🛡️ Privacy & Security Note

This demo app stores **ONLY** numeric vote counters (`seniorCitizen` and `governmentServant`).
No names, emails, phone numbers, IP addresses, device identifiers, or personal voter data are recorded.
