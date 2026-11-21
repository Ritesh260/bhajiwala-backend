
const emailTransporter = require("../config/emailConfig");

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!to) {
      throw new Error("Recipient email address is required.");
    }

    if (!subject || !html) {
      throw new Error("Email subject and HTML content are required.");
    }

    const info = await emailTransporter.sendMail({
      from: {
        name: process.env.EMAIL_FROM_NAME || "BhajiWala",
        address: process.env.SMTP_EMAIL,
      },
      to,
      subject,
      html,
      text: text || "Thank you for choosing BhajiWala.",
    });

    console.log("Email sent successfully:", {
      messageId: info.messageId,
      recipient: to,
      subject,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Email Sending Failed:", {
      recipient: to,
      message: error.message,
    });

    return {
      success: false,
      message: error.message,
    };
  }
};

module.exports = sendEmail;
