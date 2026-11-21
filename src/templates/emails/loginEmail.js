
const { emailLayout, escapeHtml } = require("./emailLayout");

const loginEmail = (partner = {}) => {
  const name = escapeHtml(partner.fullName || "Delivery Partner");

  const loginTime = escapeHtml(
    partner.loginTime || new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  );

  const device = escapeHtml(partner.device || "Not available");

  const ipAddress = escapeHtml(partner.ipAddress || "Not available");

  const content = `
    <p style="font-size:15px;line-height:1.8;color:#526158;">
      Hello <strong>${name}</strong>,
    </p>

    <p style="font-size:14px;line-height:1.8;color:#526158;">
      This is a confirmation that your BhajiWala delivery partner
      account was successfully accessed.
    </p>

    <div style="
      background:#f0fdf4;
      border:1px solid #bbf7d0;
      padding:20px;
      border-radius:13px;
      margin:25px 0;
    ">
      <div style="text-align:center;margin-bottom:18px;">
        <span style="
          display:inline-block;
          background:#dcfce7;
          color:#15803d;
          padding:9px 16px;
          border-radius:30px;
          font-size:13px;
          font-weight:bold;
        ">
          ✓ Successful Login
        </span>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:10px 0;color:#718078;font-size:13px;">
            Login Date & Time
          </td>
          <td align="right" style="padding:10px 0;color:#26352b;font-size:13px;font-weight:bold;">
            ${loginTime}
          </td>
        </tr>

        <tr>
          <td style="padding:10px 0;color:#718078;font-size:13px;border-top:1px solid #dcfce7;">
            Device / Browser
          </td>
          <td align="right" style="padding:10px 0;color:#26352b;font-size:13px;font-weight:bold;border-top:1px solid #dcfce7;">
            ${device}
          </td>
        </tr>

        <tr>
          <td style="padding:10px 0;color:#718078;font-size:13px;border-top:1px solid #dcfce7;">
            IP Address
          </td>
          <td align="right" style="padding:10px 0;color:#26352b;font-size:13px;font-weight:bold;border-top:1px solid #dcfce7;">
            ${ipAddress}
          </td>
        </tr>
      </table>
    </div>

    <div style="
      background:#fff7ed;
      border:1px solid #fed7aa;
      padding:17px;
      border-radius:10px;
    ">
      <p style="font-size:14px;font-weight:bold;color:#9a3412;margin:0 0 7px;">
        Wasn't this you?
      </p>

      <p style="font-size:13px;line-height:1.7;color:#7c4a2d;margin:0;">
        If you do not recognize this login activity, please
        secure your account and contact the BhajiWala support team
        immediately.
      </p>
    </div>
  `;

  return {
    subject: "BhajiWala Account Login Notification",
    html: emailLayout({
      title: "Login Successful",
      subtitle: "Your account security notification.",
      content,
      footerMessage:
        "Your account security matters to us. Thank you for being a BhajiWala delivery partner.",
    }),
    text: `Hello ${partner.fullName || "Delivery Partner"}, your BhajiWala account was successfully accessed on ${loginTime}. Device: ${device}. IP: ${ipAddress}. If this was not you, please contact support.`,
  };
};

module.exports = loginEmail;
