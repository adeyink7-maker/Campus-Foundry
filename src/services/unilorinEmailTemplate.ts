export function generateUnilorinOtpEmailHtml(otp: string, email: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Student Email</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f6f8;
            margin: 0;
            padding: 0;
            color: #2d3748;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            background-color: #f4f6f8;
            padding: 30px 0;
        }
        .main-card {
            max-width: 580px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .header {
            background-color: #0f172a;
            padding: 32px 40px;
            text-align: center;
            border-bottom: 4px solid #002b49;
        }
        .app-badge {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff;
            font-weight: 700;
            font-size: 13px;
            padding: 6px 16px;
            border-radius: 20px;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
        }
        .header-title {
            color: #ffffff;
            font-size: 22px;
            font-weight: 700;
            margin: 0;
            letter-spacing: 0.5px;
        }
        .header-subtitle {
            color: #94a3b8;
            font-size: 13px;
            margin: 6px 0 0 0;
        }
        .content {
            padding: 36px 40px;
        }
        .greeting {
            font-size: 16px;
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 12px;
        }
        .message-text {
            font-size: 14px;
            line-height: 1.6;
            color: #4a5568;
            margin: 0 0 20px 0;
        }
        .email-highlight {
            background-color: #f1f5f9;
            border: 1px solid #cbd5e1;
            color: #0f172a;
            padding: 10px 14px;
            border-radius: 8px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 20px;
            word-break: break-all;
        }
        .otp-container {
            background-color: #f8fafc;
            border: 2px dashed #0284c7;
            border-radius: 12px;
            padding: 24px 20px;
            text-align: center;
            margin: 25px 0;
        }
        .otp-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #64748b;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .otp-code {
            font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
            font-size: 40px;
            font-weight: 800;
            letter-spacing: 10px;
            color: #0284c7;
            margin: 8px 0;
        }
        .otp-expiry {
            font-size: 13px;
            color: #94a3b8;
            margin-top: 6px;
        }
        .warning-box {
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 14px 18px;
            border-radius: 6px;
            margin-bottom: 24px;
        }
        .warning-text {
            font-size: 13px;
            color: #92400e;
            line-height: 1.5;
            margin: 0;
        }
        .footer {
            background-color: #f8fafc;
            padding: 24px 40px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
        }
        .footer-text {
            font-size: 12px;
            color: #94a3b8;
            line-height: 1.5;
            margin: 0;
        }
        .footer-brand {
            font-weight: 600;
            color: #64748b;
        }
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
                <p class="message-text">
                    We received a request to authenticate your official University of Ilorin student portal account for:
                </p>
                <div class="email-highlight">${email}</div>
                <p class="message-text">
                    To complete your registration and unlock access to campus hostel marketplace, direct peer communications, and verified student services, enter the 6-digit One-Time Passcode (OTP) below:
                </p>

                <div class="otp-container">
                    <div class="otp-label">Your Verification Code</div>
                    <div class="otp-code">${otp}</div>
                    <div class="otp-expiry">&#9201; Expires in 10 minutes (Single use only)</div>
                </div>

                <div class="warning-box">
                    <p class="warning-text">
                        <strong>Security Reminder:</strong> Never share this code with anyone, including university staff or campus marketplace traders. UNILORIN security administrators will never ask for your verification passcode.
                    </p>
                </div>

                <p class="message-text" style="font-size: 13px; color: #64748b;">
                    If you did not request this verification, your student credentials may have been entered mistakenly by another student. No changes will take effect without this passcode.
                </p>
            </div>
            <div class="footer">
                <p class="footer-text">
                    &copy; ${new Date().getFullYear()} <span class="footer-brand">University of Ilorin &bull; Campus Foundry</span>.<br/>
                    Secured by Google Cloud Platform & Firebase Authentication Infrastructure.
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;
}
