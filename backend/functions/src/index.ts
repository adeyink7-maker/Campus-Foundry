import * as functions from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// Required UNILORIN Student Email Domain
const ALLOWED_DOMAIN = 'students.unilorin.edu.ng';

// Matriculation username regex (e.g., 25-31qq023 or 20-55ec042)
const STUDENT_USERNAME_REGEX = /^[a-z0-9-]+$/i;

// Rate limit parameters
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 seconds
const MAX_REQUESTS_PER_24H = 5;
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Computes deterministic SHA-256 hash of normalized email for document keying
 */
function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email).digest('hex');
}

/**
 * Computes salted scrypt hash of the OTP for secure zero-knowledge storage
 */
function hashOtp(otp: string, salt: string): string {
  return crypto.scryptSync(otp, salt, 64).toString('hex');
}

/**
 * Timing-safe comparison to prevent side-channel timing attacks
 */
function verifyTimingSafe(expectedHash: string, providedOtp: string, salt: string): boolean {
  const computedHash = hashOtp(providedOtp, salt);
  const a = Buffer.from(expectedHash, 'hex');
  const b = Buffer.from(computedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * 1. sendEmailOTP Cloud Function (v2 Callable)
 */
export const sendEmailOTP = functions.onCall({ cors: true }, async (request) => {
  const data = request.data || {};
  const rawEmail = typeof data.email === 'string' ? data.email : '';
  const normalizedEmail = rawEmail.trim().toLowerCase();

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new functions.HttpsError(
      'invalid-argument',
      'Please provide a valid University of Ilorin student email address.'
    );
  }

  // Strict domain splitting & match check
  const parts = normalizedEmail.split('@');
  if (parts.length !== 2) {
    throw new functions.HttpsError('invalid-argument', 'Malformed email address provided.');
  }

  const [username, domain] = parts;

  // Strict Match Check: Require domain === 'students.unilorin.edu.ng'
  if (domain !== ALLOWED_DOMAIN) {
    throw new functions.HttpsError(
      'permission-denied',
      `Access restricted exclusively to UNILORIN students (@${ALLOWED_DOMAIN}). Non-student domains like '${domain}' are rejected.`
    );
  }

  // Validate student username/matriculation format
  if (!STUDENT_USERNAME_REGEX.test(username)) {
    throw new functions.HttpsError(
      'invalid-argument',
      'Invalid student email prefix. Student email must contain valid matriculation format (e.g. 25-31qq023@students.unilorin.edu.ng).'
    );
  }

  const emailHash = hashEmail(normalizedEmail);
  const otpDocRef = db.collection('otp_verifications').doc(emailHash);
  const now = Date.now();

  // Run transaction to enforce rate limits and store cryptographically hashed OTP
  const result = await db.runTransaction(async (transaction) => {
    const docSnapshot = await transaction.get(otpDocRef);
    let dailyCount = 0;
    let windowStart = now;

    if (docSnapshot.exists) {
      const existing = docSnapshot.data() || {};
      const lastRequested = existing.lastRequestedAt?.toMillis?.() || existing.lastRequestedAtMs || 0;
      
      // Cooldown check: 1 request per 60 seconds
      if (now - lastRequested < RATE_LIMIT_WINDOW_MS) {
        const remainingSeconds = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - lastRequested)) / 1000);
        throw new functions.HttpsError(
          'resource-exhausted',
          `Please wait ${remainingSeconds} seconds before requesting a new verification code.`
        );
      }

      // 24-hour rate limit check
      windowStart = existing.dailyWindowStartMs || now;
      if (now - windowStart < 24 * 60 * 60 * 1000) {
        dailyCount = existing.dailyCount || 0;
        if (dailyCount >= MAX_REQUESTS_PER_24H) {
          throw new functions.HttpsError(
            'resource-exhausted',
            'Daily verification limit exceeded (5 requests per 24 hours). Please contact student affairs or try again tomorrow.'
          );
        }
      } else {
        dailyCount = 0;
        windowStart = now;
      }
    }

    // Generate secure 6-digit numeric OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedOtp = hashOtp(rawOtp, salt);

    transaction.set(otpDocRef, {
      emailHash,
      hashedOtp,
      salt,
      attemptsLeft: 5,
      createdAt: admin.firestore.Timestamp.fromMillis(now),
      expiresAt: admin.firestore.Timestamp.fromMillis(now + OTP_EXPIRY_MS),
      lastRequestedAt: admin.firestore.Timestamp.fromMillis(now),
      lastRequestedAtMs: now,
      dailyCount: dailyCount + 1,
      dailyWindowStartMs: windowStart,
    });

    // Queue email via Firebase Extension "Trigger Email with Firestore"
    const mailDocRef = db.collection('mail').doc();
    const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Student Email</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; color: #2d3748; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; background-color: #f4f6f8; padding: 30px 0; }
        .main-card { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background-color: #0f172a; padding: 32px 40px; text-align: center; border-bottom: 4px solid #002b49; }
        .app-badge { display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 700; font-size: 13px; padding: 6px 16px; border-radius: 20px; letter-spacing: 0.5px; margin-bottom: 10px; }
        .header-title { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: 0.5px; }
        .header-subtitle { color: #94a3b8; font-size: 13px; margin: 6px 0 0 0; }
        .content { padding: 36px 40px; }
        .greeting { font-size: 16px; font-weight: 600; color: #1a202c; margin-bottom: 12px; }
        .message-text { font-size: 14px; line-height: 1.6; color: #4a5568; margin: 0 0 20px 0; }
        .email-highlight { background-color: #f1f5f9; border: 1px solid #cbd5e1; color: #0f172a; padding: 10px 14px; border-radius: 8px; font-family: monospace; font-size: 13px; font-weight: 600; display: inline-block; margin-bottom: 20px; word-break: break-all; }
        .otp-container { background-color: #f8fafc; border: 2px dashed #0284c7; border-radius: 12px; padding: 24px 20px; text-align: center; margin: 25px 0; }
        .otp-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 700; margin-bottom: 8px; }
        .otp-code { font-family: monospace; font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #0284c7; margin: 8px 0; }
        .otp-expiry { font-size: 13px; color: #94a3b8; margin-top: 6px; }
        .warning-box { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; }
        .warning-text { font-size: 13px; color: #92400e; line-height: 1.5; margin: 0; }
        .footer { background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center; }
        .footer-text { font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="main-card">
            <div class="header">
                <div class="app-badge">UNIVERSITY OF ILORIN</div>
                <h1 class="header-title">Student Identity Verification</h1>
                <p class="header-subtitle">Secure Multi-Factor Campus Authentication</p>
            </div>
            <div class="content">
                <div class="greeting">Hello UNILORIN Student,</div>
                <p class="message-text">We received a request to authenticate your official University of Ilorin student portal account for:</p>
                <div class="email-highlight">${normalizedEmail}</div>
                <p class="message-text">Enter the 6-digit One-Time Passcode (OTP) below to complete your registration:</p>
                <div class="otp-container">
                    <div class="otp-label">Your Verification Code</div>
                    <div class="otp-code">${rawOtp}</div>
                    <div class="otp-expiry">&#9201; Expires in 10 minutes (Single use only)</div>
                </div>
                <div class="warning-box">
                    <p class="warning-text"><strong>Security Reminder:</strong> Never share this code with anyone. University administrators will never ask for your verification passcode.</p>
                </div>
            </div>
            <div class="footer">
                <p class="footer-text">&copy; UNILORIN Campus Foundry &bull; Secured by Google Cloud Platform & Firebase Authentication</p>
            </div>
        </div>
    </div>
</body>
</html>`;

    transaction.set(mailDocRef, {
      to: normalizedEmail,
      message: {
        subject: 'UNILORIN Student Portal - One-Time Verification Code (OTP)',
        text: `Your UNILORIN authentication code is: ${rawOtp}. Valid for 10 minutes. Do not share this code with anyone.`,
        html: emailHtml,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, email: normalizedEmail, expiresInSeconds: 600 };
  });

  return result;
});

/**
 * 2. verifyOTPAndRegister Cloud Function (v2 Callable)
 */
export const verifyOTPAndRegister = functions.onCall({ cors: true }, async (request) => {
  const data = request.data || {};
  const rawEmail = typeof data.email === 'string' ? data.email : '';
  const otp = typeof data.otp === 'string' ? data.otp.trim() : '';
  const fullName = typeof data.fullName === 'string' ? data.fullName.trim() : 'UNILORIN Student';
  const role = data.role === 'trader' ? 'trader' : 'student';
  const hostelLocation = typeof data.hostelLocation === 'string' ? data.hostelLocation : 'Lagos Hostel';
  const faculty = typeof data.faculty === 'string' ? data.faculty : 'Faculty of Communication & Information Sciences';
  const department = typeof data.department === 'string' ? data.department : 'Computer Science';
  const whatsapp = typeof data.whatsapp === 'string' ? data.whatsapp : '';

  const normalizedEmail = rawEmail.trim().toLowerCase();
  const domain = normalizedEmail.split('@')[1];

  if (domain !== ALLOWED_DOMAIN) {
    throw new functions.HttpsError('permission-denied', `Email must belong to @${ALLOWED_DOMAIN}`);
  }

  if (!/^\d{6}$/.test(otp)) {
    throw new functions.HttpsError('invalid-argument', 'OTP must be a 6-digit numeric code.');
  }

  const emailHash = hashEmail(normalizedEmail);
  const otpDocRef = db.collection('otp_verifications').doc(emailHash);
  const now = Date.now();

  let uid = '';

  await db.runTransaction(async (transaction) => {
    const docSnapshot = await transaction.get(otpDocRef);

    if (!docSnapshot.exists) {
      throw new functions.HttpsError(
        'not-found',
        'No active OTP request found for this email. Please request a new verification code.'
      );
    }

    const verification = docSnapshot.data() || {};
    const expiresAtMs = verification.expiresAt?.toMillis?.() || 0;
    const attemptsLeft = verification.attemptsLeft ?? 0;

    // Check expiration
    if (now > expiresAtMs) {
      transaction.delete(otpDocRef);
      throw new functions.HttpsError('deadline-exceeded', 'This verification code has expired. Please request a new one.');
    }

    // Check attempts
    if (attemptsLeft <= 0) {
      transaction.delete(otpDocRef);
      throw new functions.HttpsError(
        'permission-denied',
        'Maximum verification attempts exceeded. For security, please request a new code.'
      );
    }

    // Verify OTP using timing-safe comparison
    const isMatch = verifyTimingSafe(verification.hashedOtp, otp, verification.salt);

    if (!isMatch) {
      const remaining = attemptsLeft - 1;
      if (remaining <= 0) {
        transaction.delete(otpDocRef);
        throw new functions.HttpsError('permission-denied', 'Incorrect OTP. Verification limit reached. Please request a new code.');
      } else {
        transaction.update(otpDocRef, { attemptsLeft: remaining });
        throw new functions.HttpsError('invalid-argument', `Incorrect OTP code. ${remaining} attempts remaining.`);
      }
    }

    // OTP Verified! Invalidate immediately to prevent replay attacks
    transaction.delete(otpDocRef);
  });

  // Create or retrieve Firebase Auth Student User
  try {
    const existingUser = await admin.auth().getUserByEmail(normalizedEmail);
    uid = existingUser.uid;
    await admin.auth().updateUser(uid, {
      displayName: fullName,
      emailVerified: true,
    });
  } catch (err: any) {
    if (err?.code === 'auth/user-not-found') {
      const newUser = await admin.auth().createUser({
        email: normalizedEmail,
        displayName: fullName,
        emailVerified: true,
      });
      uid = newUser.uid;
    } else {
      throw err;
    }
  }

  // Set UNILORIN custom claims
  await admin.auth().setCustomUserClaims(uid, {
    studentVerified: true,
    matricNumber: normalizedEmail.split('@')[0],
    domain: ALLOWED_DOMAIN,
    role,
  });

  // Persist Profile in Firestore `users/{uid}`
  const userProfileRef = db.collection('users').doc(uid);
  const userProfileData = {
    uid,
    email: normalizedEmail,
    fullName,
    role,
    matricNumber: normalizedEmail.split('@')[0],
    faculty,
    department,
    hostelLocation,
    whatsapp,
    isVerified: true,
    institution: 'University of Ilorin',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await userProfileRef.set(userProfileData, { merge: true });

  // Create Custom Token for immediate client SDK authentication
  const customToken = await admin.auth().createCustomToken(uid, {
    studentVerified: true,
    role,
  });

  return {
    success: true,
    uid,
    customToken,
    userProfile: {
      ...userProfileData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
});
