
const { emailLayout, escapeHtml } = require("./emailLayout");

const approvalEmail = (partner = {}) => {
  const name = escapeHtml(partner.fullName || "Delivery Partner");

  const loginUrl = escapeHtml(
    partner.loginUrl ||
    process.env.DELIVERY_PARTNER_LOGIN_URL ||
    "http://localhost:3000/login"
  );

  const approvedDate = escapeHtml(
    partner.approvedDate ||
    new Date().toLocaleDateString("en-IN")
  );

  const content = `
    <div style="text-align:center;margin-bottom:22px;">
      <div style="
        display:inline-block;
        width:70px;
        height:70px;
        line-height:70px;
        background:#dcfce7;
        border-radius:50%;
        font-size:34px;
        color:#15803d;
      ">
        ✓
      </div>
    </div>

    <p style="font-size:15px;line-height:1.8;color:#526158;">
      Hello <strong>${name}</strong>,
    </p>

    <p style="font-size:14px;line-height:1.8;color:#526158;">
      Great news! Your BhajiWala delivery partner application
      has been successfully reviewed and approved.
    </p>

    <div style="
      background:#f0fdf4;
      border:1px solid #bbf7d0;
      padding:23px;
      border-radius:13px;
      margin:25px 0;
      text-align:center;
    ">
      <p style="font-size:12px;color:#647568;margin:0 0 8px;">
        APPLICATION STATUS
      </p>

      <h2 style="font-size:25px;color:#15803d;margin:0;">
        APPROVED
      </h2>

      <p style="font-size:12px;color:#647568;margin:12px 0 0;">
        Approved on ${approvedDate}
      </p>
    </div>

    <h3 style="font-size:16px;color:#23452e;">
      You're ready for the next step!
    </h3>

    <p style="font-size:14px;line-height:1.8;color:#526158;">
      You can now log in to your delivery partner account using
      your registered email/mobile number and password.
    </p>

    <div style="text-align:center;margin:28px 0;">
      <a href="${loginUrl}"
        style="
          display:inline-block;
          background:#15803d;
          color:#ffffff;
          text-decoration:none;
          padding:15px 32px;
          border-radius:9px;
          font-size:14px;
          font-weight:bold;
        ">
        Login to Your Account →
      </a>
    </div>

    <div style="
      background:#f8faf8;
      padding:16px;
      border-radius:10px;
    ">
      <p style="font-size:13px;color:#526158;line-height:1.7;margin:0;">
        <strong>Security reminder:</strong> Never share your account
        password or login credentials with anyone.
      </p>
    </div>
  `;

  return {
    subject: "Congratulations! Your BhajiWala Application is Approved",
    html: emailLayout({
      title: "You're Approved!",
      subtitle: "Welcome aboard the BhajiWala delivery partner network.",
      content,
      footerMessage:
        "We are delighted to welcome you. Let's deliver freshness together!",
    }),
    text: `Hello ${partner.fullName || "Delivery Partner"}, your BhajiWala application has been approved. You can now log in at ${partner.loginUrl || process.env.DELIVERY_PARTNER_LOGIN_URL || "your delivery partner login page"}.`,
  };
};

module.exports = approvalEmail;
