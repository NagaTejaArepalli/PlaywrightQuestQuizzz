/**
 * Playwright Quest Quizz - Daily 9:30 AM IST Reminder Dispatcher
 * -------------------------------------------------------------
 * Triggered automatically everyday at 9:30 AM IST (04:00 UTC) via GitHub Actions cron
 * or on-demand via workflow_dispatch.
 *
 * Sender: webpagestechie@gmail.com (Firebase Project Owner)
 * Recipients: All registered Playwright Quest users who have not unsubscribed.
 */

const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const APP_URL = (process.env.APP_URL || 'https://playwrightquestquizz.web.app').replace(/\/$/, '');
const GMAIL_USER = process.env.GMAIL_USER || 'webpagestechie@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || process.env.MAIL_PASS || '';
const IS_DRY_RUN = process.argv.includes('--dry-run') || !GMAIL_APP_PASSWORD;

// Playwright Curriculum Data for daily rotation
const CURRICULUM_DAYS = [
  {
    day: 1,
    title: "Architecture & WebSockets",
    emoji: "🏗️",
    hook: "Cadet, do you know how Playwright multiplexes CDP over a single persistent WebSocket instead of HTTP polling like legacy tools?",
    teaser: "Answer 5 quick architecture questions and claim your 100 XP!"
  },
  {
    day: 2,
    title: "Locators & Strict Mode",
    emoji: "🎯",
    hook: "Are your locators resilient to UI refactors? Test your mastery of getByRole, getByTestId, and Strict Mode!",
    teaser: "Banish flaky CSS selectors forever in under 3 minutes."
  },
  {
    day: 3,
    title: "Auto-Waiting & Web-First Assertions",
    emoji: "⏱️",
    hook: "⚠️ Warning: Are you still writing page.waitForTimeout()? The Flakiness Monster is waiting! Playwright automatically checks actionability (visible, stable, enabled) before every action.",
    teaser: "Master web-first expect(locator).toBeVisible() vs isVisible() in today's auto-waiting challenge!"
  },
  {
    day: 4,
    title: "Fixtures & Test Runner",
    emoji: "🧩",
    hook: "Ready to harness custom page fixtures, automatic worker teardown, and parallel worker test runners?",
    teaser: "Level up your automation architecture in today's 5-minute quest."
  },
  {
    day: 5,
    title: "Network Mocking & HAR Replay",
    emoji: "🌐",
    hook: "Mock backend APIs with route.fulfill() and record zero-flakiness HAR network replays like a pro.",
    teaser: "Prove your API intercept skills today!"
  },
  {
    day: 6,
    title: "Storage State & Auth Reuse",
    emoji: "🔑",
    hook: "Stop logging into test accounts on every test! Master storageState and skip redundant UI auth flows.",
    teaser: "Cut your suite execution time in half today."
  },
  {
    day: 7,
    title: "Page Object Models & Components",
    emoji: "📐",
    hook: "Scale maintainable enterprise test frameworks with modular Page Objects and reusable locator components.",
    teaser: "Keep your code DRY and bulletproof."
  }
];

/**
 * Initialize Firebase Admin SDK
 */
function initFirebaseAdmin() {
  if (admin.apps.length > 0) return admin.app();

  let serviceAccount = null;

  // 1. Secret / Env Variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
      const decoded = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
      serviceAccount = JSON.parse(decoded);
    } catch (e) {
      console.warn('⚠️ Could not parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', e.message);
    }
  }

  // 2. Local File
  const localKeyPath = path.join(__dirname, '..', 'service-account.json');
  if (!serviceAccount && fs.existsSync(localKeyPath)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
    } catch (e) {
      console.warn('⚠️ Could not read local service-account.json:', e.message);
    }
  }

  if (serviceAccount) {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id || 'playwrightquestquizz'
    });
  }

  if (IS_DRY_RUN) {
    console.log('ℹ️ Local/dry-run mode: Service account not detected, bypassing cloud metadata lookup.');
    return null;
  }

  // 3. Fallback default credentials or project ID
  return admin.initializeApp({
    projectId: 'playwrightquestquizz'
  });
}

/**
 * Fetch all registered users and filter out those who unsubscribed
 */
async function getSubscribedUsers(auth, db) {
  if (!auth || !db) {
    if (IS_DRY_RUN) {
      console.log('ℹ️ Dry-run preview: Simulating candidate user nagateja2704@gmail.com for email output validation.');
      return [
        {
          uid: 'tJEgjPhqoqWMZrcwdEhcpptFBkc2',
          email: 'nagateja2704@gmail.com',
          displayName: 'Naga Teja'
        }
      ];
    }
    return [];
  }

  const users = [];
  const unsubscribedEmails = new Set();
  const unsubscribedUids = new Set();

  // 1. Fetch unsubscribed registry from Firestore REST API & Admin SDK
  try {
    const restUrl = 'https://firestore.googleapis.com/v1/projects/playwrightquestquizz/databases/(default)/documents/unsubscribes';
    const response = await fetch(restUrl);
    if (response.ok) {
      const result = await response.json();
      if (Array.isArray(result.documents)) {
        result.documents.forEach(docItem => {
          const nameParts = (docItem.name || '').split('/');
          const docId = (nameParts[nameParts.length - 1] || '').toLowerCase().trim();
          const fields = docItem.fields || {};
          const isUnsubscribed = fields.unsubscribed ? fields.unsubscribed.booleanValue : true;

          if (isUnsubscribed !== false) {
            if (fields.email && fields.email.stringValue) {
              const em = fields.email.stringValue.toLowerCase().trim();
              unsubscribedEmails.add(em);
              unsubscribedEmails.add(em.replace(/[^a-zA-Z0-9]/g, '_'));
            }
            if (fields.uid && fields.uid.stringValue) {
              unsubscribedUids.add(fields.uid.stringValue.trim());
            }
            if (docId) {
              unsubscribedEmails.add(docId);
            }
          }
        });
      }
      console.log(`📋 [Firestore REST] Retrieved ${unsubscribedEmails.size} recorded unsubscribed identifiers.`);
    }
  } catch (err) {
    console.warn('⚠️ Firestore REST query notice:', err.message);
  }

  // Also query Admin SDK if permissions are granted
  if (db) {
    try {
      const unsubsSnap = await db.collection('unsubscribes').get();
      unsubsSnap.forEach(docSnap => {
        const d = docSnap.data();
        const docId = docSnap.id.toLowerCase().trim();
        if (d.unsubscribed !== false) {
          if (d.email) {
            const em = d.email.toLowerCase().trim();
            unsubscribedEmails.add(em);
            unsubscribedEmails.add(em.replace(/[^a-zA-Z0-9]/g, '_'));
          }
          if (d.uid) unsubscribedUids.add(d.uid.trim());
          unsubscribedEmails.add(docId);
        }
      });
      console.log(`📋 [Admin SDK] Total unsubscribed identifiers now: ${unsubscribedEmails.size}`);
    } catch (err) {
      console.warn('⚠️ Note: Admin SDK query for unsubscribes skipped (using REST API result):', err.message);
    }
  }

  // 2. List all users from Firebase Auth
  try {
    let nextPageToken = undefined;
    do {
      const listUsersResult = await auth.listUsers(1000, nextPageToken);
      listUsersResult.users.forEach(userRecord => {
        if (!userRecord.email) return;

        const email = userRecord.email.toLowerCase().trim();
        const emailSanitized = email.replace(/[^a-zA-Z0-9]/g, '_');
        const uid = userRecord.uid.trim();

        if (unsubscribedEmails.has(email) || unsubscribedEmails.has(emailSanitized) || unsubscribedUids.has(uid)) {
          console.log(`🚫 Skipping unsubscribed user from Auth: ${email}`);
          return; // Skip unsubscribed
        }

        users.push({
          uid: uid,
          email: userRecord.email,
          displayName: userRecord.displayName || userRecord.email.split('@')[0]
        });
      });
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log(`👥 Retrieved ${users.length} active registered candidate users from Firebase Auth.`);
  } catch (err) {
    console.warn('⚠️ Could not list users via Auth API (falling back to Firestore profiles):', err.message);

    // Fallback: Check Firestore `users` collection
    try {
      const usersSnap = await db.collection('users').get();
      usersSnap.forEach(doc => {
        const d = doc.data();
        const profile = d.profile || d;
        const email = (profile.email || d.email || '').toLowerCase().trim();
        const emailSanitized = email.replace(/[^a-zA-Z0-9]/g, '_');
        if (email && !unsubscribedEmails.has(email) && !unsubscribedEmails.has(emailSanitized) && profile.emailNotifications !== false) {
          users.push({
            uid: doc.id,
            email: email,
            displayName: profile.displayName || email.split('@')[0]
          });
        }
      });
    } catch (e2) {
      console.error('❌ Failed to retrieve users from Firestore fallback:', e2.message);
    }
  }

  // 3. Double-check individual profile documents in Firestore
  const activeUsers = [];
  for (const u of users) {
    const emailNorm = (u.email || '').toLowerCase().trim();
    const emailSanitized = emailNorm.replace(/[^a-zA-Z0-9]/g, '_');

    if (unsubscribedEmails.has(emailNorm) || unsubscribedEmails.has(emailSanitized) || unsubscribedUids.has(u.uid)) {
      console.log(`🚫 Skipping unsubscribed user: ${u.email} (found in unsubscribes registry)`);
      continue;
    }

    // Direct check in unsubscribes collection for document with emailSanitized ID via REST API
    let isDirectlyUnsubscribed = false;
    try {
      const singleDocUrl = `https://firestore.googleapis.com/v1/projects/playwrightquestquizz/databases/(default)/documents/unsubscribes/${encodeURIComponent(emailSanitized)}`;
      const res = await fetch(singleDocUrl);
      if (res.ok) {
        const docData = await res.json();
        const fields = docData.fields || {};
        if (fields.unsubscribed ? fields.unsubscribed.booleanValue !== false : true) {
          isDirectlyUnsubscribed = true;
        }
      }
    } catch (_) {}

    // Also check via Admin SDK if available
    if (!isDirectlyUnsubscribed && db) {
      try {
        const docRef1 = await db.collection('unsubscribes').doc(emailSanitized).get();
        if (docRef1.exists && docRef1.data().unsubscribed !== false) {
          isDirectlyUnsubscribed = true;
        }
      } catch (_) {}
    }

    if (!isDirectlyUnsubscribed && u.uid) {
      try {
        const docRef2 = await db.collection('unsubscribes').doc(u.uid).get();
        if (docRef2.exists && docRef2.data().unsubscribed !== false) {
          isDirectlyUnsubscribed = true;
        }
      } catch (_) {}
    }

    if (isDirectlyUnsubscribed) {
      console.log(`🚫 Skipping user: ${u.email} (found direct unsubscribes document)`);
      continue;
    }

    // Check users/{uid}/profile/stats
    let isOptedOutInProfile = false;
    try {
      const profileSnap = await db.collection('users').doc(u.uid).collection('profile').doc('stats').get();
      if (profileSnap.exists) {
        const stats = profileSnap.data();
        if (stats.emailNotifications === false) {
          isOptedOutInProfile = true;
        }
      }
    } catch (_) { }

    if (!isOptedOutInProfile) {
      try {
        const altProfileSnap = await db.collection('artifacts').doc('playwright-quest').collection('users').doc(u.uid).collection('profile').doc('stats').get();
        if (altProfileSnap.exists && altProfileSnap.data().emailNotifications === false) {
          isOptedOutInProfile = true;
        }
      } catch (_) { }
    }

    if (!isOptedOutInProfile) {
      try {
        const rootUserDoc = await db.collection('users').doc(u.uid).get();
        if (rootUserDoc.exists && rootUserDoc.data().emailNotifications === false) {
          isOptedOutInProfile = true;
        }
      } catch (_) { }
    }

    if (isOptedOutInProfile) {
      console.log(`🚫 Skipping user: ${u.email} (disabled emails in profile)`);
      continue;
    }

    activeUsers.push(u);
  }

  if (activeUsers.length === 0 && IS_DRY_RUN) {
    if (unsubscribedEmails.has('nagateja2704@gmail.com') || unsubscribedEmails.has('nagateja2704_gmail_com')) {
      console.log('ℹ️ Dry-run test: nagateja2704@gmail.com is recorded as UNSUBSCRIBED. Zero candidates remaining.');
      return [];
    }
    console.log('ℹ️ Dry-run preview: Simulating candidate user nagateja2704@gmail.com for email output validation.');
    return [
      {
        uid: 'tJEgjPhqoqWMZrcwdEhcpptFBkc2',
        email: 'nagateja2704@gmail.com',
        displayName: 'Naga Teja'
      }
    ];
  }

  return activeUsers;
}

/**
 * Generate a responsive, high-converting comic HTML email
 */
function generateEmailContent(user, topic) {
  const unsubscribeUrl = `${APP_URL}?action=unsubscribe&email=${encodeURIComponent(user.email)}&uid=${user.uid}`;
  const questUrl = `${APP_URL}?utm_source=daily_reminder&utm_medium=email&utm_campaign=day_${topic.day}&day=${topic.day}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${topic.emoji} Playwright Quest: ${topic.title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #FEF6E4;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1E1B4B;
      line-height: 1.5;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #FEF6E4;
      padding: 30px 10px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 3px solid #1E1B4B;
      border-radius: 20px;
      box-shadow: 6px 6px 0px #1E1B4B;
      overflow: hidden;
    }
    .header {
      background-color: #FFD93D;
      padding: 24px 20px;
      text-align: center;
      border-bottom: 3px solid #1E1B4B;
    }
    .badge {
      display: inline-block;
      background: #1E1B4B;
      color: #FFD93D;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      padding: 4px 14px;
      border-radius: 9999px;
      margin-bottom: 10px;
    }
    .header-title {
      font-size: 26px;
      font-weight: 900;
      margin: 0;
      color: #1E1B4B;
      text-shadow: 1px 1px 0px rgba(0,0,0,0.1);
    }
    .content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 800;
      color: #1E1B4B;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .mission-card {
      background: #F3F0FF;
      border: 2px solid #1E1B4B;
      border-radius: 14px;
      padding: 18px;
      margin: 20px 0;
      box-shadow: 3px 3px 0px #1E1B4B;
    }
    .mission-header {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 16px;
      font-weight: 900;
      color: #845EC2;
      margin-bottom: 8px;
    }
    .hook-text {
      font-size: 14px;
      font-weight: 700;
      color: #1E1B4B;
      margin: 0 0 10px 0;
      line-height: 1.5;
    }
    .teaser-text {
      font-size: 13px;
      font-weight: 600;
      color: #4B4870;
      margin: 0;
    }
    .stats-row {
      display: table;
      width: 100%;
      margin: 20px 0;
      background: #E6FCF5;
      border: 2px dashed #1E1B4B;
      border-radius: 12px;
      padding: 12px 16px;
      box-sizing: border-box;
    }
    .stat-item {
      display: table-cell;
      text-align: center;
      vertical-align: middle;
      font-size: 12px;
      font-weight: 800;
      color: #00897B;
    }
    .cta-container {
      text-align: center;
      margin: 30px 0 20px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #FF6B6B;
      color: #FFFFFF !important;
      text-decoration: none;
      font-size: 16px;
      font-weight: 900;
      padding: 16px 36px;
      border: 3px solid #1E1B4B;
      border-radius: 14px;
      box-shadow: 4px 4px 0px #1E1B4B;
      letter-spacing: 0.5px;
      transition: all 0.2s ease;
    }
    .app-link {
      display: block;
      margin-top: 10px;
      font-size: 12px;
      font-weight: 700;
      color: #845EC2;
      text-decoration: underline;
    }
    .footer {
      background-color: #FAFAFA;
      border-top: 2px solid #E5E7EB;
      padding: 20px 24px;
      text-align: center;
      font-size: 11px;
      color: #6B7280;
      line-height: 1.6;
    }
    .footer a {
      color: #845EC2;
      text-decoration: underline;
      font-weight: bold;
    }
    .unsub-btn {
      display: inline-block;
      margin-top: 12px;
      padding: 6px 14px;
      background: #FFF;
      border: 1px solid #D1D5DB;
      border-radius: 6px;
      color: #4B5563 !important;
      text-decoration: none !important;
      font-size: 11px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Comic Header -->
      <div class="header">
        <span class="badge">🥋 DAILY MISSION BRIEFING • 9:30 AM IST</span>
        <h1 class="header-title">Playwright Quest ⚡</h1>
      </div>

      <!-- Main Content -->
      <div class="content">
        <h2 class="greeting">Greetings, Cadet ${escapeHtml(user.displayName)}! 🥋</h2>
        <p style="font-size: 14px; color: #374151; margin-top: 0;">
          Sensei Script is waiting in the Dojo. Your daily automation training has refreshed!
        </p>

        <!-- Topic Card -->
        <div class="mission-card">
          <div class="mission-header">
            <span>${topic.emoji}</span>
            <span>DAY ${topic.day}: ${topic.title.toUpperCase()}</span>
          </div>
          <p class="hook-text">${topic.hook}</p>
          <p class="teaser-text">💡 ${topic.teaser}</p>
        </div>

        <!-- Quick Stats / Encouragement -->
        <div class="stats-row">
          <div class="stat-item">🔥 Keep Your Streak</div>
          <div class="stat-item">⏱️ 3 Minutes</div>
          <div class="stat-item">⭐ +100 XP</div>
        </div>

        <!-- Call to Action -->
        <div class="cta-container">
          <a href="${questUrl}" class="cta-button">
            🥋 ENTER THE DOJO &amp; SOLVE QUEST →
          </a>
          <a href="${questUrl}" class="app-link">
            Or open: ${APP_URL}
          </a>
        </div>
      </div>

      <!-- Footer & Unsubscribe -->
      <div class="footer">
        <p style="margin: 0 0 6px 0;">
          Sent with ❤️ by Firebase Project Owner (<code>${GMAIL_USER}</code>).<br>
          You are receiving this because you signed up on <a href="${APP_URL}">Playwright Quest Quizz</a>.
        </p>
        <p style="margin: 0;">
          Don't want daily quest reminders?
          <br>
          <a href="${unsubscribeUrl}" class="unsub-btn">
            🔕 Unsubscribe from daily emails
          </a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
🥋 PLAYWRIGHT QUEST - DAILY 9:30 AM IST BRIEFING
==================================================

Greetings, Cadet ${user.displayName}!

Sensei Script is waiting in the Dojo with today's quest:
${topic.emoji} DAY ${topic.day}: ${topic.title}

${topic.hook}

${topic.teaser}

Solve Today's Quest Now:
${questUrl}

(Keep your streak alive and claim +100 XP!)

--------------------------------------------------
To unsubscribe from daily quest reminders, visit:
${unsubscribeUrl}
  `.trim();

  return { html, text, unsubscribeUrl };
}

function escapeHtml(str) {
  if (!str) return 'Coder';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Main Dispatcher
 */
async function main() {
  console.log('🚀 Starting Playwright Quest Daily Reminder Dispatcher...');
  console.log(`⏰ Scheduled Target: 9:30 AM IST (04:00 UTC)`);
  console.log(`✉️ Sender Account: ${GMAIL_USER}`);
  console.log(`🌐 Web App Target: ${APP_URL}`);

  if (IS_DRY_RUN) {
    console.log('🔍 RUNNING IN DRY-RUN / TEST MODE (No actual emails will be dispatched).');
  }

  // 1. Initialize Firebase
  const app = initFirebaseAdmin();
  const auth = app ? admin.auth(app) : null;
  const db = app ? admin.firestore(app) : null;

  // 2. Determine Today's Quest (Highlighting Day 3 Auto-Waiting or rotating)
  // Day 3: Auto-Waiting is the primary curriculum anchor requested by the user
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  // Today's curriculum index: Default to Day 3 if requested, or rotating
  const topic = CURRICULUM_DAYS[2]; // Day 3: Auto-Waiting & Web-First Assertions
  console.log(`🎯 Today's Featured Quest: Day ${topic.day} - ${topic.title} (${topic.emoji})`);

  // 3. Fetch Registered Subscribed Users
  const activeUsers = await getSubscribedUsers(auth, db);
  console.log(`📬 Qualified recipient count: ${activeUsers.length}`);

  if (activeUsers.length === 0) {
    console.log('ℹ️ No subscribed recipients found. Exiting cleanly.');
    return;
  }

  // 4. Create Nodemailer Transporter
  let transporter = null;
  if (!IS_DRY_RUN) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD.replace(/\s+/g, '') // strip spaces if formatted
      }
    });

    try {
      await transporter.verify();
      console.log('✅ Gmail SMTP connection verified successfully.');
    } catch (err) {
      console.error('❌ Failed to authenticate with Gmail SMTP:', err.message);
      console.error('👉 Make sure GMAIL_APP_PASSWORD is set in GitHub Secrets using a Google Account App Password.');
      process.exit(1);
    }
  }

  // 5. Dispatch to each active user
  let successCount = 0;
  let failCount = 0;

  for (const user of activeUsers) {
    const { html, text, unsubscribeUrl } = generateEmailContent(user, topic);

    const mailOptions = {
      from: `"Playwright Quest Dojo" <${GMAIL_USER}>`,
      to: user.email,
      replyTo: GMAIL_USER,
      subject: `🥋 [Playwright Quest] Day ${topic.day}: Auto-Waiting & Assertions Challenge! ⚡`,
      text: text,
      html: html,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      }
    };

    if (IS_DRY_RUN) {
      console.log(`[DRY-RUN] Would send to: ${user.email} (${user.displayName}) | Subject: ${mailOptions.subject}`);
      console.log(`[DRY-RUN] Unsubscribe link: ${unsubscribeUrl}`);
      successCount++;
    } else {
      try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Sent email to ${user.email}: messageId=${info.messageId}`);
        successCount++;
      } catch (err) {
        console.error(`❌ Failed to send email to ${user.email}:`, err.message);
        failCount++;
      }
    }
  }

  console.log('==================================================');
  console.log(`🎉 Daily reminder execution finished.`);
  console.log(`📊 Sent: ${successCount} | Failed: ${failCount} | Total Candidates: ${activeUsers.length}`);
  console.log('==================================================');
}

main().catch(err => {
  console.error('💥 Fatal error in reminder dispatcher:', err);
  process.exit(1);
});
