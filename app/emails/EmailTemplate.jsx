export function buildEmailBase({
  title,
  badge,
  heading,
  subheading,
  bodyHtml,
  ctaText,
  ctaUrl,
  footerNote,
}) {
  const year = new Date().getFullYear();

  const badgeHtml = badge
    ? `<p style="text-align:center;margin:0 0 24px;">
        <span style="display:inline-block;background:#f5f5f5;border:1px solid #fcb913;
          color:#fcb913;font-size:11px;letter-spacing:3px;text-transform:uppercase;
          padding:6px 18px;">
          ${badge}
        </span>
      </p>`
    : "";

  const subheadingHtml = subheading
    ? `<p style="color:#fcb913;font-size:15px;text-align:center;margin:0 0 28px;
        text-transform:uppercase;letter-spacing:2px;">
        ${subheading}
      </p>`
    : "";

  const ctaHtml =
    ctaText && ctaUrl
      ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
          <tr>
            <td align="center">
              <a href="${ctaUrl}"
                style="display:inline-block;padding:14px 44px;background-color:#fcb913;
                color:#000000;text-decoration:none;font-weight:bold;font-size:14px;
                letter-spacing:1px;text-transform:uppercase;">
                ${ctaText}
              </a>
            </td>
          </tr>
        </table>`
      : "";

  const footerNoteHtml = footerNote
    ? `<p style="color:#6b7280;font-size:11px;text-align:center;margin:0 0 16px;line-height:1.6;">
        ${footerNote}
      </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f7f7f7;color:#111111;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f7f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background-color:#ffffff;max-width:600px;border:1px solid #e5e7eb;">

          <!-- Header -->
          <tr>
            <td style="background-color:#ffffff;padding:28px 32px;text-align:center;">
              <h1 style="color:#fcb913;margin:0;font-size:26px;letter-spacing:2px;text-transform:uppercase;">
                SoundFolio
              </h1>
            </td>
          </tr>

          <!-- Gold accent bar -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,#fcb913,#e09d00);"></td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 32px;">
              ${badgeHtml}

              <h2 style="color:#111111;font-size:22px;margin:0 0 8px;text-align:center;
                text-transform:uppercase;letter-spacing:1px;">
                ${heading}
              </h2>

              ${subheadingHtml}

              ${bodyHtml}

              ${ctaHtml}

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;" />

              ${footerNoteHtml}

              <p style="color:#6b7280;font-size:11px;text-align:center;margin:0;line-height:1.6;">
                SoundFolio &mdash; The music community platform.<br/>
                &copy; ${year} SoundFolio. All rights reserved.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f5f5f5;padding:16px 32px;text-align:center;">
              <p style="color:#6b7280;font-size:11px;margin:0;letter-spacing:1px;text-transform:uppercase;">
                Discover DJs, Artists &amp; Book Amazing Talents
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
