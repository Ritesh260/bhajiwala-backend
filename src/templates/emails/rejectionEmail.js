
const { emailLayout, escapeHtml } = require("./emailLayout");

const rejectionEmail = (partner = {}) => {
  const name = escapeHtml(partner.fullName || "Delivery Partner");

  const reason = escapeHtml(
    partner.rejectionReason || "Your application did not meet the current verification requirements."
  );

  const content = `
    <p style="font-size:15px;line-height:1.8;color:#526158;">
      Hello <strong>${name}</strong>,
    </p>

    <p style="font-size:14px;line-height:1.8;color:#526158;">
      Thank you for your interest in joining BhajiWala.
      After reviewing your application, we are unable to approve
      it at this time.
    </p>

    <div style="
      background:#fff1f2;
      border:1px solid #fecdd3;
      border-radius:13px;
      padding:22px;
      margin:25px 0;
    ">
      <p style="font-size:12px;color:#9f1239;margin:0 0 8px;">
        APPLICATION STATUS
      </p>

      <h2 style="font-size:22px;color:#be123c;margin:0;">
        Not Approved
      </h2>
    </div>

    <h3 style="font-size:16px;color:#23452e;">
      Reason for this decision
    </h3>

    <div style="
      background:#f8faf8;
      border-left:4px solid #e11d48;
      padding:17px;
      border-radius:6px;
      margin:14px 0 23px;
    ">
      <p style="font-size:14px;color:#526158;line-height:1.8;margin:0;">
        ${reason}
      </p>
    </div>

    <p style="font-size:14px;line-height:1.8;color:#526158;">
      Please review the reason mentioned above. If reapplication
      is available, you may correct the required information and
      contact the BhajiWala support team for further guidance.
    </p>
  `;

  return {
    subject: "Update Regarding Your BhajiWala Application",
    html: emailLayout({
      title: "Application Update",
      subtitle: "An update about your delivery partner registration.",
      content,
      footerMessage:
        "Thank you for considering BhajiWala. We appreciate your time and understanding.",
    }),
    text: `Hello ${partner.fullName || "Delivery Partner"}, your BhajiWala application was not approved. Reason: ${partner.rejectionReason || "Please contact support for details."}`,
  };
};

module.exports = rejectionEmail;
