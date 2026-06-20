// export function emailLayout(content: string) {
//     return `
//     <div style="font-family:Arial,sans-serif;line-height:1.6">
//         <div style="max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:10px">
//             ${content}
//         </div>
//     </div>
//     `;
// }

// export function button(url: string, text: string, color = '#4F46E5') {
//     return `
//         <div style="margin-top:20px">
//             <a href="${url}"
//                style="
//                 background:${color};
//                 color:#fff;
//                 padding:12px 18px;
//                 text-decoration:none;
//                 border-radius:6px;
//                 display:inline-block;
//                 font-weight:600;
//                ">
//                ${text}
//             </a>
//         </div>
//     `;
// }



// ================================================================
// 1. HELPER: Parse User-Agent into readable English details
// ================================================================
function parseUserAgent(ua: string): { os: string; browser: string; device: string } {
    let os = 'Unknown OS';
    let browser = 'Unknown Browser';
    let device = 'Unknown Device';

    if (ua.includes('Windows')) os = '🖥️ Windows';
    else if (ua.includes('Mac OS')) os = '🍏 macOS';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = '📱 iOS';
    else if (ua.includes('Android')) os = '📱 Android';
    else if (ua.includes('Linux')) os = '🐧 Linux';

    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = '🌐 Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = '🌐 Safari';
    else if (ua.includes('Firefox')) browser = '🌐 Firefox';
    else if (ua.includes('Edg')) browser = '🌐 Edge';

    if (ua.includes('Mobile')) device = '📱 Mobile Phone';
    else if (ua.includes('Tablet')) device = '📟 Tablet';
    else device = '💻 Desktop Computer';

    return { os, browser, device };
}

// ================================================================
// 2. MAIN BUILDER:
// ================================================================
export function buildLoginAlertEmail(user: { id: number ; name?: string; email: string }, req: any) {
    // Parse data
    const deviceInfo = parseUserAgent(req.headers["user-agent"] || '');
    const loginTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const userName = user.name || user.email.split('@')[0];

    // ---- Build the email content with modern styling ----
    const content = `
    <!-- Greeting -->
    ${heading(`Hello ${userName} 👋`, 1)}
    
    <!-- Introductory message -->
    ${paragraph(`
      <span style="font-size: 18px; font-weight: 500; color: #1e293b;">
        A new login was detected on your account.
      </span>
      <br />
      <span style="color: #475569;">
        If this was you, you can safely ignore this email. If you don't recognize this activity, please secure your account immediately.
      </span>
    `)}

    <!-- Info Card (Modern Glassmorphism-inspired card) -->
    <div style="
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px 24px;
      margin: 24px 0;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    ">
      <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 8px 8px 0; font-weight: 600; color: #475569; width: 100px;">📍 Location</td>
          <td style="padding: 8px 0; color: #0f172a;">${req.ip || 'Unavailable'} <span style="color: #94a3b8; font-size: 14px;">(approx.)</span></td>
        </tr>
        <tr>
          <td style="padding: 8px 8px 8px 0; font-weight: 600; color: #475569;">🕒 Time</td>
          <td style="padding: 8px 0; color: #0f172a;">${loginTime} (UTC)</td>
        </tr>
        <tr>
          <td style="padding: 8px 8px 8px 0; font-weight: 600; color: #475569;">📟 Device</td>
          <td style="padding: 8px 0; color: #0f172a;">${deviceInfo.device}</td>
        </tr>
        <tr>
          <td style="padding: 8px 8px 8px 0; font-weight: 600; color: #475569;">💿 OS</td>
          <td style="padding: 8px 0; color: #0f172a;">${deviceInfo.os}</td>
        </tr>
        <tr>
          <td style="padding: 8px 8px 8px 0; font-weight: 600; color: #475569;">🌐 Browser</td>
          <td style="padding: 8px 0; color: #0f172a;">${deviceInfo.browser}</td>
        </tr>
      </table>
    </div>

    <!-- Security Alert Box -->
    ${paragraph(`
      <div style="
        background: #fef2f2;
        border-right: 4px solid #ef4444;
        padding: 12px 16px;
        border-radius: 6px;
        color: #991b1b;
        font-size: 14px;
      ">
        ⚠️ If you don't recognize this device or location, we strongly recommend changing your password immediately.
      </div>
    `)}

    <!-- Dual Action Buttons (Modern CTA) -->
    <div style="margin-top: 28px; text-align: center;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding: 0 4px;">
            <!-- Secondary Button: "This was me" -->
            <a href="#" 
               style="
                 background: #ffffff;
                 color: #334155;
                 padding: 12px 24px;
                 text-decoration: none;
                 border-radius: 8px;
                 display: inline-block;
                 font-weight: 600;
                 font-size: 15px;
                 border: 1px solid #cbd5e1;
                 margin: 4px;
                 min-width: 140px;
               ">
               Yes, this was me
            </a>
            <!-- Primary Button: "Secure Account" (Red Alert) -->
            <a href="https://example.com/reset-password" 
               style="
                 background: #dc2626;
                 color: #ffffff;
                 padding: 12px 24px;
                 text-decoration: none;
                 border-radius: 8px;
                 display: inline-block;
                 font-weight: 700;
                 font-size: 15px;
                 box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
                 margin: 4px;
                 min-width: 140px;
                 border: 1px solid #dc2626;
               "
               onmouseover="this.style.background='#b91c1c'"
               onmouseout="this.style.background='#dc2626'"
            >
               Secure My Account Now
            </a>
          </td>
        </tr>
      </table>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 12px;">
        You will be redirected to a secure password reset page.
      </p>
    </div>
  `;

    // Return the full layout with a polished header and footer
    return emailLayout(content, {
        headerText: 'Security Alert: New Login Detected',
        footerText: `© 2026 Tadreeby. This is an automated security notification.`,
    });
}


export function emailLayout(content: string, options?: {
    headerText?: string;
    footerText?: string;
    logoUrl?: string;
    backgroundColor?: string;
}) {
    const {
        headerText = 'Welcome',
        footerText = '© 2026 All rights reserved.',
        // Use CID by default so local file can be attached inline when sending emails
        // logoUrl = 'cid:tadreebylogo@tadreeby',
        backgroundColor = '#f9fafb',
    } = options || {};

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email</title>
      <style>
        /* Responsive tweaks for mobile clients */
        @media only screen and (max-width: 600px) {
          .container { padding: 15px !important; }
          .button { display: block !important; width: 100% !important; text-align: center !important; }
        }
      </style>
    </head>
    <body style="margin:0;padding:0;background-color:${backgroundColor};font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${backgroundColor};padding:20px 0;">
        <tr>
          <td align="center">
            <!-- Main Card -->
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.05);overflow:hidden;">
              
              <!-- HEADER -->
              <tr>
                <td style="padding:24px 30px 10px 30px;border-bottom:1px solid #e5e7eb;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>

                    </tr>
                    <tr>
                      <td align="center" style="padding-top:6px;font-size:20px;font-weight:700;color:#1f2937;">
                        ${headerText}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- BODY (Your dynamic content goes here) -->
              <tr>
                <td style="padding:30px 30px 20px 30px;background-color:#ffffff;color:#1f2937;font-size:16px;">
                  ${content}
                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td style="padding:16px 30px;background-color:#f8fafc;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280;text-align:center;">
                  ${footerText}
                  <br />
                
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}




export function button(url: string, text: string, color = '#4F46E5', hoverColor = '#4338CA') {
    return `
    <div style="margin-top:24px;text-align:center;">
      <a href="${url}"
         style="
           background:${color};
           color:#ffffff;
           padding:14px 28px;
           text-decoration:none;
           border-radius:8px;
           display:inline-block;
           font-weight:600;
           font-size:16px;
           box-shadow:0 2px 8px rgba(79,70,229,0.25);
           transition:background 0.2s ease;
           border:1px solid ${color};
         "
         onmouseover="this.style.background='${hoverColor}'"
         onmouseout="this.style.background='${color}'"
      >
        ${text}
      </a>
    </div>
  `;
}





// Generates a styled heading (h1, h2, or h3)
export function heading(text: string, level: 1 | 2 | 3 = 2) {
    const sizes = { 1: '24px', 2: '20px', 3: '18px' };
    return `<h${level} style="margin:0 0 16px 0;font-size:${sizes[level]};color:#111827;font-weight:700;">${text}</h${level}>`;
}

// Generates a styled paragraph
export function paragraph(text: string) {
    return `<p style="margin:0 0 16px 0;color:#374151;">${text}</p>`;
}

// Wraps content in a section with bottom margin
export function section(content: string, extraStyle = '') {
    return `<div style="margin-bottom:24px;${extraStyle}">${content}</div>`;
}





export function buildWelcomeEmail(userName: string, confirmationLink: string) {
    const content = `
    ${heading(`Hello ${userName} 👋`, 1)}
    ${paragraph('Thank you for signing up. To activate your account, please click the button below.')}
    ${button(confirmationLink, 'Confirm Account', '#0B63E5')}
    ${paragraph('If you did not create this account, please ignore this email.')}
  `;

    return emailLayout(content, {
        headerText: 'Email Confirmation',
        footerText: '© 2026 Tadreeby. All rights reserved.',
    });
}



export function buildApplicationApprovedEmail(
    user: { firstName: string; email: string },
    approverText: string, // e.g., " by John Doe" or empty string ""
    loginUrl: string
) {
    // Clean up the approver text (if it starts with " by ", we format it nicely)
    const approverDisplay = approverText
        ? `by <strong>${approverText.replace(/^ by /, '')}</strong>`
        : '';

    const content = `
    <!-- Greeting -->
    ${heading(`Congratulations, ${user.firstName}!`, 1)}
    
    <!-- Main Message -->
    ${paragraph(`
      <span style="font-size: 18px; font-weight: 500; color: #1e293b;">
        Your application has been <strong style="color: #16a34a;">approved</strong> ${approverDisplay}.
      </span>
      <br />
      <span style="color: #475569;">
        You now have full access to your account. Click the button below to log in and get started.
      </span>
    `)}

    <!-- Info Card (Optional but adds a modern touch) -->
    <div style="
      background: #f0fdf4;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
      border: 1px solid #bbf7d0;
      border-right: 4px solid #22c55e;
    ">
      <span style="color: #166534; font-size: 15px; display: flex; align-items: center;">
        Your account is now active. You can start using all features immediately.
      </span>
    </div>

    <!-- Single Call-to-Action Button (Big and Clear) -->
    <div style="margin-top: 28px; text-align: center;">
      <a href="${loginUrl}" 
         style="
           background: #16a34a;
           color: #ffffff;
           padding: 14px 40px;
           text-decoration: none;
           border-radius: 8px;
           display: inline-block;
           font-weight: 700;
           font-size: 17px;
           box-shadow: 0 4px 12px rgba(22, 163, 74, 0.35);
           border: 1px solid #16a34a;
           min-width: 160px;
         "
         onmouseover="this.style.background='#15803d'"
         onmouseout="this.style.background='#16a34a'"
      >
        Login to Your Account
      </a>
      <p style="font-size: 13px; color: #94a3b8; margin-top: 12px;">
        You will be redirected to the secure login page.
      </p>
    </div>

    <!-- Small extra line for security/help -->
    ${paragraph(`
      <div style="font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 8px;">
        If you have any issues logging in, please contact our support team.
      </div>
    `)}
  `;

    // Wrap it with the main email layout (header + footer)
    return emailLayout(content, {
        headerText: 'Application Approved',
        footerText: `© 2026 Tadreeby. This is an automated approval notification.`,
    });
}






export function buildApplicationReceivedEmail(
    user: { firstName: string; email: string },
    profileUrl: string
) {
    const content = `
    <!--Greeting -->
    ${heading(`Thank you, ${user.firstName}! `, 1)}
    
    <!-- Main Message -->
    ${paragraph(`
      <span style="font-size: 18px; font-weight: 500; color: #1e293b;">Your application has been received successfully.
      </span>
      <br />
      <span style="color: #475569;">
        It is now <strong style="color : #f59e0b">pending review</strong>.Our team will carefully evaluate your submission, 
        and we'll notify you immediately once a decision is made.
      </span>
    `)}

    <!-- Status Card (Amber/Yellow theme for "Pending") -->
    <div style="
      background: #fffbeb;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
      border: 1px solid #fde68a;
      border-right: 4px solid #f59e0b;
    ">
      <span style="color: #92400e; font-size: 15px; display: flex; align-items: center;">
        Status: <strong style="margin-left: 4px;">Pending Review</strong> 
        &nbsp;—&nbsp; We typically respond within 24–48 hours.
      </span>
    </div>

    <!-- Call-to-Action Button (Trustworthy Blue) -->
    <div style="margin-top: 28px; text-align: center;">
      <a href="${profileUrl}" 
         style="
           background: #2563eb;
           color: #ffffff;
           padding: 14px 40px;
           text-decoration: none;
           border-radius: 8px;
           display: inline-block;
           font-weight: 700;
           font-size: 17px;
           box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
           border: 1px solid #2563eb;
           min-width: 160px;
         "
         onmouseover="this.style.background='#1d4ed8'"
         onmouseout="this.style.background='#2563eb'"
      >
        View My Profile
      </a>
      <p style="font-size: 13px; color: #94a3b8; margin-top: 12px;">
        Track your application status directly from your profile dashboard.
      </p>
    </div>

    <!-- Helpful Extra -->
    ${paragraph(`
      <div style="font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 8px;">
        If you have any questions in the meantime, feel free to reply to this email.
      </div>
    `)}
  `;

    return emailLayout(content, {
        headerText: 'Application Received',
        footerText: `© 2026 Tadreeby. This is an automated confirmation of your submission.`,
    });
}





export function buildApplicationRejectedEmail(
    user: { firstName: string; email: string },
    approverText: string,      // e.g., " by John Doe" or empty string ""
    reason: string | null,     // Rejection reason, or null
    profileUrl: string
) {
    // Clean up the approver text
    const approverDisplay = approverText
        ? `by <strong>${approverText.replace(/^ by /, '')}</strong>`
        : '';

    // Use a default reason if none is provided
    const rejectionReason = reason?.trim() || 'Not specified';

    const content = `
    <!-- Greeting -->
    ${heading(`Hello ${user.firstName}`, 1)}
    
    <!-- Main Message -->
    ${paragraph(`
      <span style="font-size: 18px; font-weight: 500; color: #1e293b;">
        We regret to inform you that your application was <strong style="color : #dc2626">rejected</strong> ${approverDisplay}.
      </span>
      <br />
      <span style="color: #475569;">
        While this isn't the outcome we hoped for, we encourage you to review the feedback below 
        and consider resubmitting with the necessary updates.
      </span>
    `)}

    <!-- Rejection Reason Card (Red Alert Box) -->
    <div style="
      background: #fef2f2;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
      border: 1px solid #fecaca;
      border-right: 4px solid #dc2626;
    ">
      <div style="display: flex; align-items: flex-start; gap: 8px;">
        <span style="font-weight: 700; color: #991b1b; font-size: 15px;">Reason for rejection:</span>
        <span style="color: #7f1d1d; font-size: 15px;">${rejectionReason}</span>
      </div>
    </div>

    <!-- Action Button (Red Primary - to Update/Resubmit) -->
    <div style="margin-top: 28px; text-align: center;">
      <a href="${profileUrl}" 
         style="
           background: #dc2626;
           color: #ffffff;
           padding: 14px 40px;
           text-decoration: none;
           border-radius: 8px;
           display: inline-block;
           font-weight: 700;
           font-size: 17px;
           box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);
           border: 1px solid #dc2626;
           min-width: 160px;
         "
         onmouseover="this.style.background='#b91c1c'"
         onmouseout="this.style.background='#dc2626'"
      >
        Update & Re-upload Documents
      </a>
      <p style="font-size: 13px; color: #94a3b8; margin-top: 12px;">
        Make the necessary changes and submit a new application.
      </p>
    </div>

    <!-- Encouraging / Support Note -->
    ${paragraph(`
      <div style="
        font-size: 14px; 
        color: #64748b; 
        border-top: 1px solid #e2e8f0; 
        padding-top: 16px; 
        margin-top: 8px;
        background: #f8fafc;
        border-radius: 8px;
        padding: 12px 16px;
      ">
        💡 <strong>Need help?</strong> If you have questions about the decision or need guidance on 
        what to update, please don't hesitate to reply to this email. Our team is here to support you.
      </div>
    `)}
  `;

    return emailLayout(content, {
        headerText: 'Application Rejected',
        footerText: `© 2026 Tadreeby. This is an automated notification regarding your application.`,
    });
}






export function buildPasswordResetEmail(
    user: { firstName?: string; email: string },
    code: string
) {
    const userName = user.firstName || user.email.split('@')[0];

    const content = `
    <!-- Greeting -->
    ${heading(`Hello ${userName}`, 1)}
    
    <!-- Main Message -->
    ${paragraph(`
      <span style="font-size: 18px; font-weight: 500; color: #1e293b;">
        We received a request to reset your password.
      </span>
      <br />
      <span style="color: #475569;">
        Use the verification code below to proceed. This code is valid for the next <strong style="color: #1d4ed8;"><br>15 minutes</strong>.
      </span>
    `)}

    <!-- Security Code Card (The Star of the Email) -->
    <div style="
      background: #EFF6FF;
      border-radius: 12px;
      padding: 24px 20px;
      margin: 24px 0;
      border: 2px dashed #1d4ed8;
      text-align: center;
    ">
      <span style="
        display: block;
        font-size: 42px;
        font-weight: 800;
        letter-spacing: 8px;
        color: #0f172a;
        font-family: 'Courier New', monospace;
        background: #ffffff;
        padding: 12px 20px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      ">
        ${code}
      </span>
      <p style="
        margin: 12px 0 0 0;
        font-size: 13px;
        color: #1d4ed8;
      ">
        Enter this code on the code verification page.
      </p>
    </div>

    <!-- Security Warning -->
    ${paragraph(`
      <div style="
        background: #fef2f2;
        padding: 12px 16px;
        border-radius: 6px;
        color: #991b1b;
        font-size: 14px;
        border: 1px solid #fecaca;
        border-right: 4px solid #dc2626;
      ">
        <strong>Security Tip:</strong> Never share this code with anyone. 
        Our team will never ask you for this code over the phone, email, or chat.
      </div>
    `)}

    <!-- Extra Instruction -->
    ${paragraph(`
      <div style="font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 8px;">
        If you didn't request this password reset, you can safely ignore this email. 
        Your account remains secure.
      </div>
    `)}
  `;

    return emailLayout(content, {
        headerText: 'Password Reset Request',
        footerText: `© 2026 Tadreeby. This is an automated security notification.`,
    });
}



