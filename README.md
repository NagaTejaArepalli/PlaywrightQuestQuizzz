# 🎭 Playwright Quest: Daily SDET Dojo

> Master Modern Playwright & TypeScript across 14 Major Topics through an Interactive Comic Arcade Experience!

[![Live Demo](https://img.shields.io/badge/Live%20Demo-playwrightquestquizz.web.app-38E4FF?style=for-the-badge&logo=firebase&logoColor=black)](https://playwrightquestquizz.web.app)
[![Powered by Gemini](https://img.shields.io/badge/AI%20Engine-Google%20Gemini-845EC2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://aistudio.google.com/)
[![Built with Tailwind](https://img.shields.io/badge/UI-Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Backend-Firebase%20%26%20Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

---

## 🌟 Overview

**Playwright Quest** is a gamified, cartoon comic-styled web app designed to take automation engineers from Playwright fundamentals to Senior SDET / Principal Test Automation Architect level. 

Complete progressive daily missions, test your real-world Playwright knowledge with instant AI-generated challenges powered by Google Gemini, review curated study cards in your **Saved Q&A Vault**, and track your streak across devices in real time.

🔗 **Play the Live Dojo**: [https://playwrightquestquizz.web.app](https://playwrightquestquizz.web.app)

---

## ✨ Key Features

### 🥋 1. 14 Major SDET Architectural Topics
A comprehensive curriculum covering end-to-end browser automation and test architecture:
1. **Architecture & WebSockets**: Persistent CDP/protocol connection, Browser vs Context vs Page isolation.
2. **Locators & Strict Mode**: User-facing locators (`getByRole`, `getByLabel`), strict mode traps, locator chaining.
3. **Auto-Waiting & Web-First Assertions**: Actionability checks, `expect(locator).toBeVisible()`, poll assertions.
4. **Fixtures & Worker Scope**: Custom fixture dependency injection, worker vs test scope isolation.
5. **Page Object Model & TypeScript Generics**: Modular POM design, type-safe locators, DRY patterns.
6. **Auth & storageState**: Global setup, session token caching, multi-role authentication skipping.
7. **Network Interception & Mocking**: `page.route()`, HAR recording, aborting ads/third parties.
8. **API Testing & RequestContext**: Direct API calls via `request`, combining API seeding with UI validation.
9. **Frames, Shadow DOM & Multi-Tab**: Cross-origin iframes, open/closed shadow roots, popup tab tracking.
10. **Visual & Aria Snapshots**: Pixel comparison (`toHaveScreenshot`), accessibility trees.
11. **Trace Viewer & Debugging**: Step-by-step DOM snapshots, action logs, console recordings.
12. **Parallelism, Sharding & CI/CD**: Sharded GitHub Actions matrix builds, multi-worker concurrency.
13. **Flakiness Elimination & Retries**: Identifying race conditions, stable polling, deterministic assertions.
14. **Senior SDET Mock Interview & Playwright MCP**: Architecture scenarios, Model Context Protocol integration.

---

### 🤖 2. Dynamic AI Question Generation (Google Gemini)
- **Sensei Script AI**: Generate endless fresh, non-repeating SDET questions on any curriculum topic.
- **Configurable Models**: Defaults to **`gemini-3.8-flash`** for instant question generation. Leaving the input empty defaults to `gemini-3.8-flash`, while still allowing custom model overrides (e.g., `gemini-2.0-flash`, `gemini-1.5-pro`).
- **Graceful Failure Handling**: If the AI model is unable to generate questions (e.g. quota limits, invalid key, or network issue), the app alerts you with a dedicated dialog: *"Not able to generate questions. Try this Instant Quiz!"* rather than silently launching offline questions. You can choose to proceed with pre-loaded instant questions, check API settings, or cancel.
- **Client-Side & Private**: Your Google AI Studio API key is stored securely in browser `localStorage` and is never sent to external logging servers.

---

### 🌐 3. Clean Address Bar Navigation (No Hash Clutter)
- **Seamless History API**: Internal routing uses clean HTML5 History API (`pushState` / `popstate`) without exposing hash fragments like `/#dojo/day-1/q-1`, `/#dojo/day-1/summary`, or `/#dojo/day-1/exit`.
- **Clean URLs**: The address bar stays clean (`https://playwrightquestquizz.web.app/`) across all questions and curriculum sections while preserving browser Back/Forward navigation.

---

### 📚 4. Saved Q&A Study Vault
- **Complete Review**: Review every completed quiz with in-depth technical explanations detailing *why* the correct choice works and *why* key distractors fail.
- **Copy Clean Code**: One-click copy for concise TypeScript best-practice snippets.
- **Topic Filtering & Search**: Instant custom dropdown filter for all 14 curriculum topics, fast text search for keywords (`storageState`, `fixture`, `strict mode`), and filters for *Incorrect* and *Bookmarked* questions.

---

### ⚙️ 5. Responsive Scrollable Settings Modal
- **Adaptive Viewport**: Redesigned settings modal with fixed viewport bounds (`max-h-[92vh]`), sticky header, and sticky action buttons.
- **Scrollable Body**: An independently scrollable inner container ensures all configuration settings (API key, model selector, connection test status, and notification toggle) fit cleanly on mobile and desktop screens.

---

### ☁️ 6. Firebase Authentication & Real-Time Cloud Sync
- **Google Sign-In**: Authenticate securely with Google across mobile and desktop.
- **Cloud Firestore Mirroring**: Profile stats (XP, daily streak, completed days) and quiz results synchronize bidirectionally in real time via Firestore. Play on your laptop and pick up right where you left off on your phone!
- **Strict Security Rules**: Hardened `firestore.rules` protect user data so each learner can only access their own records.

---

### 📬 7. Automated Daily Quest Reminders (9:30 AM IST)
- **Everyday at 9:30 AM IST (04:00 UTC)**: Registered users receive an engaging, comic-styled daily mission briefing sent directly from the Firebase project owner (`webpagestechie@gmail.com`).
- **Hook & Daily Challenge**: Highlights essential automation topics (e.g. *Day 3: Auto-Waiting & Web-First Assertions*), poses a brain-teaser to banish `waitForTimeout`, and includes a direct comic button to enter the Dojo.
- **One-Click Unsubscribe**: Every email includes an RFC 8058 compliant one-click unsubscribe link. When clicked, it pauses daily notifications in Firestore and displays a friendly comic confirmation modal.
- **Instant In-App Resubscribe**: Users can toggle daily notifications back ON anytime in **⚙️ Settings**. Doing so removes their unsubscribe record from Firestore and resumes daily reminders immediately.
- **Scheduled Delivery via GitHub Actions**: `.github/workflows/daily-reminder.yml` runs on a daily cron schedule and supports instant manual testing via `workflow_dispatch`. Includes a Firestore REST API fallback query to bypass IAM constraints reliably.

---

### 🎨 8. Comic Arcade Design & Audio
- Bold 3px ink borders, cartoon drop shadows, Fredoka + Nunito typography, and cheerful sound effects.
- 100% responsive layout tailored for mobile devices (iPhone, Samsung Galaxy, Pixel) and desktop browsers with zero text clipping.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES Modules), Tailwind CSS
- **Design Tokens**: Custom Comic UI, SVG Mascots & Dynamic Avatars
- **Authentication**: Firebase Auth (Google Sign-In with popup & redirect fallback)
- **Database**: Cloud Firestore (Real-time snapshots with offline fallback)
- **AI Engine**: Google Gemini REST API (`v1beta`)
- **Email Dispatcher**: Node.js, Nodemailer, Firebase Admin SDK & Firestore REST API
- **Automation / CI/CD**: GitHub Actions (`cron` & `workflow_dispatch`)
- **Hosting**: Firebase Hosting

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/NagaTejaArepalli/PlaywrightQuestQuizzz.git
cd PlaywrightQuestQuizzz
```

### 2. Local Preview
Because Playwright Quest uses ES Modules, serve the folder with any static HTTP server:

```bash
# Using Python
python -m http.server 8000

# OR using Node.js / npx
npx serve .
```

Open `http://localhost:8000` in your browser.

---

### 3. Deploying to Firebase Hosting

Ensure you have the Firebase CLI installed and are logged in:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy Hosting and Security Rules
firebase deploy
```

---

### 4. Setting Up Daily 9:30 AM IST Reminder Emails

The automated daily email dispatcher runs on GitHub Actions every day at **04:00 UTC (9:30 AM IST)**.

To enable live email delivery:
1. Generate an **App Password** for `webpagestechie@gmail.com`:
   - Go to [Google Account Security](https://myaccount.google.com/security).
   - Under *2-Step Verification*, select **App passwords**.
   - Create a new password named `Playwright Quest Reminders` and copy the 16-character code.
2. In your GitHub repository:
   - Navigate to **Settings** > **Secrets and variables** > **Actions**.
   - Verify `FIREBASE_SERVICE_ACCOUNT_PLAYWRIGHTQUESTQUIZZ` is present (automatically added by Firebase).
   - Add a New Repository Secret:
     - Name: `GMAIL_APP_PASSWORD`
     - Value: `<your-16-character-app-password>`
3. **Test Delivery**:
   - Go to the **Actions** tab in GitHub > select **Daily 9:30 AM IST Quest Reminder** > click **Run workflow** (supports dry-run testing or instant live delivery).

---

## 🔒 Security & Privacy

- **API Keys**: Stored locally in `window.localStorage` under `playwright_quest_gemini_api_key`. Never transmitted to third-party endpoints.
- **Database Rules**: Strict per-user isolation in `firestore.rules`:
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId}/{allSubcollections=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /unsubscribes/{recordId} {
        allow read, write: if true;
      }
    }
  }
  ```

---

## 👨‍💻 Author

Created with ❤️ by **[Naga Teja Arepalli](https://github.com/NagaTejaArepalli)**.
