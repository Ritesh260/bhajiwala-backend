
const { emailLayout, escapeHtml } = require("./emailLayout");

const registrationEmail = (partner = {}) => {
  const name = escapeHtml(partner.fullName || "Delivery Partner");
  const applicationId = escapeHtml(partner.applicationId || "Submitted");

  const content = `
    <p style="font-size:15px;line-height:1.8;color:#526158;">
      Hello <strong>${name}</strong>,
    </p>

    <p style="font-size:14px;line-height:1.8;color:#526158;">
      Welcome to BhajiWala! Your delivery partner registration
      has been successfully submitted. We are excited to have
      you take the next step with us.
    </p>

    <div style="
      background:#f0fdf4;
      border:1px solid #bbf7d0;
      border-radius:13px;
      padding:22px;
      margin:25px 0;
      text-align:center;
    ">
      <p style="font-size:12px;color:#647568;margin:0 0 8px;">
        APPLICATION STATUS
      </p>

      <h2 style="font-size:22px;color:#ca8a04;margin:0;">
        Pending Verification
      </h2>

      <p style="font-size:12px;color:#647568;margin:12px 0 0;">
        Application ID: ${applicationId}
      </p>
    </div>

    <h3 style="font-size:16px;color:#23452e;">
      What happens next?
    </h3>

    <table width="100%" cellpadding="0" cellspacing="0"
      style="margin:15px 0;">
      <tr>
        <td width="32" valign="top"
          style="color:#16a34a;font-size:18px;">✓</td>
        <td style="font-size:13px;color:#526158;line-height:1.7;">
          Your registration details have been received.
        </td>
      </tr>
      <tr>
        <td width="32" valign="top"
          style="color:#16a34a;font-size:18px;">✓</td>
        <td style="font-size:13px;color:#526158;line-height:1.7;">
          Our team will review your submitted documents.
        </td>
      </tr>
      <tr>
        <td width="32" valign="top"
          style="color:#16a34a;font-size:18px;">✓</td>
        <td style="font-size:13px;color:#526158;line-height:1.7;">
          You will receive an email once your application is reviewed.
        </td>
      </tr>
    </table>

    <div style="
      background:#f8faf8;
      padding:15px;
      border-radius:10px;
      margin-top:22px;
    ">
      <p style="font-size:13px;color:#526158;line-height:1.7;margin:0;">
        Please keep your registered email address and mobile number
        accessible for future updates.
      </p>
    </div>
  `;

  return {
    subject: "Welcome to BhajiWala - Registration Received!",
    html: emailLayout({
      title: "Welcome to BhajiWala!",
      subtitle: "Your journey with us starts here.",
      content,
      footerMessage:
        "Thank you for registering with BhajiWala. We appreciate your interest in joining our delivery partner network.",
    }),
    text: `Hello ${partner.fullName || "Delivery Partner"}, your BhajiWala registration has been received. Your application is pending verification. Application ID: ${partner.applicationId || "Submitted"}.`,
  };
};

module.exports = registrationEmail;
