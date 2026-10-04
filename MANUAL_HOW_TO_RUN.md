# 🗳️ E-Voting Web & Mobile Application Manual
### Beginner's Step-by-Step Guide to Run on Localhost

Welcome to the **National E-Voting System**! This guide provides easy, step-by-step instructions for beginners to run the entire project on a local machine (`localhost`).

---

## 📋 System Prerequisites

Before starting, ensure you have the following installed on your computer:
1. **Node.js** (v18 or higher): Download from [https://nodejs.org](https://nodejs.org)
2. **Web Browser**: Chrome, Edge, Firefox, or Brave
3. **Command Prompt / Terminal / VS Code Terminal**

---

## 📂 Project Structure Overview

```text
App_demo/
├── backend/            👉 Node.js backend server (Port 5000)
├── admin/              👉 E-Voting Web Application (Voter Portal & Officer Dashboard - Port 3000)
└── mobile/             👉 Expo React Native mobile application
```

---

## 🚀 Step-by-Step Setup Instructions

### STEP 1: Start the Backend Server (Port 5000)

1. Open a terminal or command prompt window.
2. Navigate to the `backend` folder:
   ```bash
   cd e:\Workspace_KhanTechStudio\App_demo\backend
   ```
3. Install dependencies (if running for the first time):
   ```bash
   npm install
   ```
4. Start the backend server:
   ```bash
   node server.js
   ```
5. You will see:
   ```text
   ==================================================
   🚀 E-Voting Server with Demographics Engine is RUNNING!
   📡 URL: http://0.0.0.0:5000
   ==================================================
   ```
   *Keep this terminal window open.*

---

### STEP 2: Start the E-Voting Web Application (Port 3000)

1. Open a **new separate terminal** window.
2. Navigate to the `admin` folder:
   ```bash
   cd e:\Workspace_KhanTechStudio\App_demo\admin
   ```
3. Install frontend dependencies:
   ```bash
   npm install
   ```
4. Launch the web application:
   ```bash
   npm run dev
   ```
5. Open your web browser and navigate to:
   ```text
   http://localhost:3000
   ```

---

### STEP 3: (Optional) Run Mobile Expo App

1. Open a **new separate terminal** window.
2. Navigate to the `mobile` folder:
   ```bash
   cd e:\Workspace_KhanTechStudio\App_demo\mobile
   ```
3. Start Expo:
   ```bash
   npx expo start
   ```
4. Scan the QR code using **Expo Go** on Android/iOS or press `w` to open in web.

---

## 🔐 Credentials & Flow Demonstration Guide

### 1. Voter Portal Flow (Citizen View)
- Go to `http://localhost:3000`.
- Select **VOTER PORTAL** tab.
- **Auto-Fill Demo Credentials**:
  - **Name**: `Rahul Sharma`
  - **Voter ID**: `ABC01`
  - **Date of Birth**: `01012005` (Format: `DDMMYYYY`)
- Click **LOGIN & VERIFY CITIZEN** or **CREATE ACCOUNT**.
- **Select Your Party**:
  - 🦁 **Party A** (*National Progressive Party*)
  - 🦅 **Party B** (*United Democratic Front*)
  - 🌟 **Party C** (*People's Alliance*)
  - 🛡️ **Party D** (*Civic Reform Movement*)
- Click **CAST VOTE**.
- Confirmation will display: `✅ Vote successfully cast! Thank you for voting.`
- **Duplicate Vote Test**: If you try to log in again with `ABC01`, the system will block re-voting and display:
  `⚠️ Already Voted: Your vote has already been recorded. You cannot vote again.`

### 2. Authorized Officer Dashboard (Government Official View)
- Click the **OFFICER DASHBOARD** tab in the top navbar.
- **Officer Login Credentials**:
  - **Username**: `admin`
  - **Password**: `admin123`
- Click **LOGIN TO OFFICER DASHBOARD**.
- **Dashboard Features**:
  - **Real-Time Vote Count & %**: Live tally for Party A, B, C, and D.
  - **Age Group Demographics Analytics**:
    - 🎓 **Youth / Gen Z** (Age 18 - 25)
    - 💼 **Millennials** (Age 26 - 40)
    - 🏢 **Gen X / Adults** (Age 41 - 59)
    - 👴 **Senior Citizens** (Age 60+)
  - **Registered Voters Status Monitor**: Detailed list showing voter IDs, names, age categories, and voting status (**VOTED** / **NOT VOTED**).
  - **Reset Election Button**: Option for officers to clear tallies for new election cycles.

---

## 🛠️ Common Troubleshooting

| Issue / Error | Solution |
| :--- | :--- |
| **`Error: listen EADDRINUSE: address already in use 0.0.0.0:5000`** | Another node process is running on port 5000. Close all command prompts and run `npx kill-port 5000` or restart terminal. |
| **`Endpoint not found`** | Ensure `backend/server.js` is running on port 5000 before attempting to log in on the website. |
| **`Backend Sync: Connecting...`** | Verify that `http://localhost:5000` is active and accessible. |

---
*Manual prepared for E-Voting Web Application deployment and sharing.*
