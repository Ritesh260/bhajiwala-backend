
const { emailLayout, escapeHtml } = require("./emailLayout");

const registrationEmail = (partner = {}) => {
  const name = escapeHtml(partner.fullName || "Delivery Partner");
  const applicationId = escapeHtml(
    partner.applicationId || "Not Available"
  );

  const content = `
    <!-- Greeting -->
    <p style="
      margin:0 0 12px;
      font-size:16px;
      line-height:1.7;
      color:#26352b;
    ">
      Hello <strong>${name}</strong>,
    </p>

    <p style="
      margin:0 0 18px;
      font-size:14px;
      line-height:1.8;
      color:#59665d;
    ">
      Thank you for choosing <strong style="color:#15803d;">BhajiWala</strong>
      and taking the first step towards becoming our delivery partner.
      We're happy to let you know that your registration application
      has been successfully received.
    </p>

    <!-- Application Status Card -->
    <div style="
      margin:24px 0;
      padding:24px 18px;
      background:#f0fdf4;
      border:1px solid #bbf7d0;
      border-radius:14px;
      text-align:center;
    ">
      <p style="
        margin:0 0 10px;
        font-size:11px;
        font-weight:700;
        letter-spacing:1.5px;
        color:#647568;
      ">
        REGISTRATION STATUS
      </p>

      <h2 style="
        margin:0;
        font-size:23px;
        line-height:1.4;
        font-weight:700;
        color:#15803d;
      ">
        Application Received!
      </h2>

      <p style="
        margin:8px 0 0;
        font-size:13px;
        color:#647568;
      ">
        Your application is currently under review.
      </p>

      <div style="
        margin-top:20px;
        padding:13px 10px;
        background:#ffffff;
        border:1px dashed #86b99a;
        border-radius:9px;
      ">
        <p style="
          margin:0 0 5px;
          font-size:10px;
          font-weight:700;
          letter-spacing:1px;
          color:#647568;
        ">
          YOUR APPLICATION ID
        </p>

        <p style="
          margin:0;
          font-size:15px;
          font-weight:700;
          color:#166534;
          word-break:break-all;
        ">
          ${applicationId}
        </p>
      </div>
    </div>

    <!-- Next Steps -->
    <h3 style="
      margin:28px 0 15px;
      font-size:17px;
      color:#26352b;
    ">
      What happens next?
    </h3>

    <table width="100%" cellpadding="0" cellspacing="0"
      role="presentation"
      style="border-collapse:collapse;">

      <tr>
        <td width="42" valign="top" style="padding:10px 0;">
          <div style="
            width:30px;
            height:30px;
            line-height:30px;
            text-align:center;
            border-radius:50%;
            background:#dcfce7;
            color:#15803d;
            font-size:14px;
            font-weight:700;
          ">1</div>
        </td>

        <td valign="top" style="padding:10px 0;">
          <p style="
            margin:0 0 4px;
            font-size:14px;
            font-weight:700;
            color:#26352b;
          ">
            Application Submitted
          </p>
          <p style="
            margin:0;
            font-size:13px;
            line-height:1.7;
            color:#647568;
          ">
            Your registration details and documents have been
            successfully submitted to BhajiWala.
          </p>
        </td>
      </tr>

      <tr>
        <td width="42" valign="top" style="padding:10px 0;">
          <div style="
            width:30px;
            height:30px;
            line-height:30px;
            text-align:center;
            border-radius:50%;
            background:#dcfce7;
            color:#15803d;
            font-size:14px;
            font-weight:700;
          ">2</div>
        </td>

        <td valign="top" style="padding:10px 0;">
          <p style="
            margin:0 0 4px;
            font-size:14px;
            font-weight:700;
            color:#26352b;
          ">
            Document Verification
          </p>
          <p style="
            margin:0;
            font-size:13px;
            line-height:1.7;
            color:#647568;
          ">
            Our team will carefully review your information
            and submitted documents.
          </p>
        </td>
      </tr>

      <tr>
        <td width="42" valign="top" style="padding:10px 0;">
          <div style="
            width:30px;
            height:30px;
            line-height:30px;
            text-align:center;
            border-radius:50%;
            background:#dcfce7;
            color:#15803d;
            font-size:14px;
            font-weight:700;
          ">3</div>
        </td>

        <td valign="top" style="padding:10px 0;">
          <p style="
            margin:0 0 4px;
            font-size:14px;
            font-weight:700;
            color:#26352b;
          ">
            Application Decision
          </p>
          <p style="
            margin:0;
            font-size:13px;
            line-height:1.7;
            color:#647568;
          ">
            We'll notify you by email once your application
            has been reviewed and a decision has been made.
          </p>
        </td>
      </tr>
    </table>

    <!-- Important Information -->
    <div style="
      margin:24px 0 0;
      padding:16px;
      background:#fffbeb;
      border:1px solid #fde68a;
      border-radius:11px;
    ">
      <p style="
        margin:0 0 6px;
        font-size:13px;
        font-weight:700;
        color:#92400e;
      ">
        Important Information
      </p>

      <p style="
        margin:0;
        font-size:13px;
        line-height:1.7;
        color:#78350f;
      ">
        Your application is currently pending verification.
        You will be able to start your delivery partner activities
        only after your application has been approved.
        Please keep your registered email address and mobile number
        accessible for updates.
      </p>
    </div>

    <!-- Closing -->
    <p style="
      margin:25px 0 0;
      font-size:14px;
      line-height:1.8;
      color:#59665d;
    ">
      Thank you for your interest in joining the BhajiWala family.
      We look forward to having you on board!
    </p>

    <p style="
      margin:16px 0 0;
      font-size:14px;
      line-height:1.7;
      color:#26352b;
    ">
      Warm regards,<br />
      <strong style="color:#15803d;">Team BhajiWala</strong>
    </p>
  `;

  const text = `
Hello ${partner.fullName || "Delivery Partner"},

Welcome to BhajiWala!

Your delivery partner registration application has been successfully received.

APPLICATION DETAILS
Application ID: ${partner.applicationId || "Not Available"}
Status: Pending Verification

WHAT HAPPENS NEXT?
1. Your registration details have been received.
2. Our team will review your submitted documents.
3. You will receive an email once your application has been reviewed.

IMPORTANT:
Your account will become eligible for delivery partner activities only after your application is approved.

Please keep your registered email address and mobile number accessible for updates.

Thank you for choosing BhajiWala.

Warm regards,
Team BhajiWala
  `.trim();

  return {
    subject: "BhajiWala | Your Delivery Partner Registration is Received",
    html: emailLayout({
      title: "Welcome to BhajiWala!",
      subtitle: "Your journey with us starts here.",
      content,
      footerMessage:
        "This is an automated confirmation email regarding your BhajiWala delivery partner registration. Please do not reply to this email.",
    }),
    text,
  };
};

module.exports = registrationEmail;
