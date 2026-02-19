/**
 * Campaign Email Template
 *
 * Server-side HTML renderer for broadcast emails.
 * Matches the branded transactional email design:
 * light blue #E1EAF2 background, white card, pink CTA #D4286B.
 *
 * Each email is personalized with recipient name + unsubscribe token.
 */

export interface CampaignParams {
  subject: string
  heading: string
  body: string
  ctaText?: string
  ctaUrl?: string
  firstName?: string
  unsubscribeUrl: string
}

/**
 * Convert plain text body to HTML paragraphs.
 * Double newlines → paragraph breaks, single newlines → <br />.
 */
function bodyToHtml(text: string): string {
  return text
    .split(/\n\n+/)
    .map(para => para.replace(/\n/g, '<br />'))
    .map(para => `<p style="margin: 0 0 16px 0;">${para}</p>`)
    .join('')
}

export function renderCampaignEmail(params: CampaignParams): string {
  const greeting = params.firstName
    ? `Beste ${params.firstName},`
    : 'Beste lezer,'

  const bodyHtml = bodyToHtml(params.body)

  const ctaBlock = params.ctaText && params.ctaUrl
    ? `<tr>
        <td align="center" style="padding-bottom: 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background-color: #D4286B; border-radius: 6px;">
                <a href="${escapeHtml(params.ctaUrl)}" target="_blank" style="display: inline-block; padding: 14px 48px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
                  ${escapeHtml(params.ctaText)}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : ''

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(params.subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #E1EAF2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #E1EAF2;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width: 480px; width: 100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img src="https://beta.rijksuitgaven.nl/logo.png" alt="Rijksuitgaven" width="220" style="display: block; width: 220px; height: auto;" />
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color: #ffffff; border-radius: 8px; padding: 40px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

                <!-- Heading -->
                <tr>
                  <td style="font-size: 22px; font-weight: 700; color: #0E3261; text-align: center; padding-bottom: 16px;">
                    ${escapeHtml(params.heading)}
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="font-size: 15px; line-height: 24px; color: #4a4a4a; padding-bottom: 24px;">
                    ${escapeHtml(greeting)}<br /><br />
                    ${bodyHtml}
                  </td>
                </tr>

                <!-- CTA Button -->
                ${ctaBlock}

                <!-- Divider -->
                <tr>
                  <td style="padding-bottom: 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="border-top: 1px solid #eeeeee;"></td></tr>
                    </table>
                  </td>
                </tr>

                <!-- Help text -->
                <tr>
                  <td style="font-size: 13px; line-height: 20px; color: #8a8a8a; text-align: center;">
                    Vragen? Neem contact op met <a href="mailto:contact@rijksuitgaven.nl" style="color: #436FA3; text-decoration: none;">ons team</a>.
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 13px; line-height: 20px; color: #8a8a8a; text-align: center;">
                    <a href="https://beta.rijksuitgaven.nl" style="color: #436FA3; text-decoration: none; font-weight: 600;">Rijksuitgaven.nl</a>
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 12px; line-height: 18px; color: #8a8a8a; text-align: center; padding-top: 8px;">
                    Het Maven Collectief<br />
                    KvK: 96257008<br />
                    <a href="mailto:contact@rijksuitgaven.nl" style="color: #436FA3; text-decoration: none;">contact@rijksuitgaven.nl</a>
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 12px; line-height: 18px; color: #8a8a8a; text-align: center; padding-top: 12px;">
                    <a href="${escapeHtml(params.unsubscribeUrl)}" style="color: #8a8a8a; text-decoration: underline;">Afmelden</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
