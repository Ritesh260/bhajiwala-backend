
const escapeHtml = (value = "") => {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
};

const emailLayout = ({
  title,
  subtitle,
  content,
  footerMessage = "Thank you for being a part of BhajiWala.",
}) => {
  const year = new Date().getFullYear();

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <title>${escapeHtml(title)}</title>
  </head>

  <body style="
    margin:0;
    padding:0;
    background:#f3f7f3;
    font-family:Arial,Helvetica,sans-serif;
    color:#26352b;
  ">

    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#f3f7f3;padding:35px 12px;">

      <tr>
        <td align="center">

          <table width="100%" cellpadding="0" cellspacing="0" border="0"
            style="
              max-width:620px;
              background:#ffffff;
              border-radius:18px;
              overflow:hidden;
              border:1px solid #e6eee6;
            ">

            <!-- HEADER -->
            <tr>
              <td align="center"
                style="
                  background:#16803c;
                  padding:32px 20px;
                ">

                <div style="
                  color:#ffffff;
                  font-size:30px;
                  font-weight:800;
                  letter-spacing:-1px;
                ">
                  🥬 BhajiWala
                </div>

                <div style="
                  color:#dcfce7;
                  font-size:11px;
                  letter-spacing:2px;
                  margin-top:8px;
                ">
                  FRESH • FAST • AT YOUR DOORSTEP
                </div>

              </td>
            </tr>

            <!-- MAIN CONTENT -->
            <tr>
              <td style="padding:38px 30px 30px;">

                <h1 style="
                  font-size:25px;
                  line-height:1.35;
                  color:#173d26;
                  margin:0 0 10px;
                  text-align:center;
                ">
                  ${escapeHtml(title)}
                </h1>

                <p style="
                  font-size:14px;
                  line-height:1.7;
                  color:#718078;
                  text-align:center;
                  margin:0 0 28px;
                ">
                  ${escapeHtml(subtitle)}
                </p>

                ${content}

                <div style="
                  border-top:1px solid #edf1ed;
                  margin-top:32px;
                  padding-top:22px;
                ">
                  <p style="
                    font-size:14px;
                    color:#526158;
                    line-height:1.7;
                    margin:0;
                  ">
                    ${escapeHtml(footerMessage)}
                  </p>

                  <p style="
                    font-size:14px;
                    color:#26352b;
                    font-weight:700;
                    margin:18px 0 0;
                  ">
                    Warm regards,<br />
                    Team BhajiWala
                  </p>
                </div>

              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td align="center"
                style="
                  background:#f8fbf8;
                  padding:24px 20px;
                  border-top:1px solid #edf1ed;
                ">

                <p style="
                  font-size:12px;
                  color:#718078;
                  margin:0 0 8px;
                ">
                  Freshness delivered with care.
                </p>

                <p style="
                  font-size:11px;
                  color:#9aa69e;
                  line-height:1.6;
                  margin:0;
                ">
                  © ${year} BhajiWala. All rights reserved.<br />
                  This is an automated email. Please do not reply.
                </p>

              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
  </html>
  `;
};

module.exports = {
  emailLayout,
  escapeHtml,
};
