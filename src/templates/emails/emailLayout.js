
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
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(title)}</title>
  </head>

  <body style="
    margin:0;
    padding:0;
    background-color:#f3f6f1;
    font-family:Arial,Helvetica,sans-serif;
    color:#26352b;
    -webkit-text-size-adjust:100%;
  ">

    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      role="presentation"
      style="
        width:100%;
        background-color:#f3f6f1;
        padding:30px 12px;
      "
    >
      <tr>
        <td align="center">

          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            role="presentation"
            style="
              width:100%;
              max-width:620px;
              background-color:#ffffff;
              border:1px solid #e7ece5;
              border-radius:16px;
              overflow:hidden;
            "
          >

            <!-- BRAND HEADER -->
            <tr>
              <td
                align="left"
                style="
                  padding:22px 24px;
                  background-color:#f8faf6;
                  border-bottom:1px solid #edf1eb;
                "
              >

                <table
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  role="presentation"
                >
                  <tr>

                    <!-- LOGO ICON -->
                    <td
                      width="50"
                      height="50"
                      align="center"
                      valign="middle"
                      style="
                        width:50px;
                        height:50px;
                        background-color:#00a63e;
                        border-radius:14px;
                        color:#ffffff;
                        font-size:29px;
                        font-weight:400;
                        line-height:50px;
                        text-align:center;
                      "
                    >
                      &#10087;
                    </td>

                    <!-- BRAND NAME -->
                    <td
                      valign="middle"
                      style="padding-left:12px;"
                    >
                      <span style="
                        font-size:29px;
                        line-height:36px;
                        font-weight:800;
                        letter-spacing:-1px;
                        color:#101c32;
                        white-space:nowrap;
                      ">
                        Bhaji<span style="color:#00a63e;">Wala</span>
                      </span>
                    </td>

                  </tr>
                </table>

              </td>
            </tr>

            <!-- EMAIL CONTENT -->
            <tr>
              <td style="
                padding:36px 30px 30px;
                background-color:#ffffff;
              ">

                <!-- TITLE -->
                <h1 style="
                  margin:0 0 10px;
                  font-size:25px;
                  line-height:1.35;
                  font-weight:700;
                  color:#173d26;
                  text-align:center;
                ">
                  ${escapeHtml(title)}
                </h1>

                <!-- SUBTITLE -->
                <p style="
                  margin:0 0 28px;
                  font-size:14px;
                  line-height:1.7;
                  color:#718078;
                  text-align:center;
                ">
                  ${escapeHtml(subtitle)}
                </p>

                <!-- DYNAMIC EMAIL BODY -->
                ${content}

                <!-- FOOTER MESSAGE -->
                <div style="
                  margin-top:30px;
                  padding-top:20px;
                  border-top:1px solid #edf1ed;
                ">
                  <p style="
                    margin:0;
                    font-size:13px;
                    line-height:1.8;
                    color:#647568;
                  ">
                    ${escapeHtml(footerMessage)}
                  </p>
                </div>

              </td>
            </tr>

            <!-- BOTTOM FOOTER -->
            <tr>
              <td
                align="center"
                style="
                  padding:25px 20px;
                  background-color:#f8faf6;
                  border-top:1px solid #edf1eb;
                "
              >

                <!-- BRAND NAME -->
                <p style="
                  margin:0 0 7px;
                  font-size:17px;
                  line-height:1.5;
                  font-weight:800;
                  letter-spacing:-0.4px;
                ">
                  <span style="color:#101c32;">Bhaji</span><span style="color:#00a63e;">Wala</span>
                </p>

                <!-- TAGLINE -->
                <p style="
                  margin:0 0 17px;
                  font-size:12px;
                  line-height:1.6;
                  color:#647568;
                ">
                  Freshness delivered with care.
                </p>

                <!-- DIVIDER -->
                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  role="presentation"
                >
                  <tr>
                    <td style="
                      border-top:1px solid #e5ebe3;
                      font-size:1px;
                      line-height:1px;
                    ">
                      &nbsp;
                    </td>
                  </tr>
                </table>

                <!-- COPYRIGHT -->
                <p style="
                  margin:16px 0 5px;
                  font-size:11px;
                  line-height:1.7;
                  color:#849087;
                ">
                  &copy; ${year} BhajiWala. All rights reserved.
                </p>

                <!-- AUTOMATED EMAIL NOTICE -->
                <p style="
                  margin:0;
                  font-size:11px;
                  line-height:1.7;
                  color:#9aa69e;
                ">
                  This is an automated email. Please do not reply.
                </p>

              </td>
            </tr>

          </table>

          <!-- OUTSIDE CARD TEXT -->
          <p style="
            margin:18px 0 0;
            font-size:11px;
            line-height:1.6;
            color:#98a39a;
            text-align:center;
          ">
            Made with care by Team BhajiWala
          </p>

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
