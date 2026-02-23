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
  preheader?: string
  body: string
  ctaText?: string
  ctaUrl?: string
  firstName?: string
  unsubscribeUrl: string
}

/**
 * Add inline styles to WYSIWYG HTML for email client compatibility.
 * Tiptap outputs clean HTML tags; email clients need inline styles.
 */
function addEmailStyles(html: string): string {
  return html
    .replace(/<p>/g, '<p style="margin: 0 0 16px 0;">')
    .replace(/<ul>/g, '<ul style="margin: 0 0 16px 0; padding-left: 20px;">')
    .replace(/<ol>/g, '<ol style="margin: 0 0 16px 0; padding-left: 20px;">')
    .replace(/<li>/g, '<li style="margin: 0 0 4px 0;">')
    .replace(/<li([^>]*)><p[^>]*>/g, '<li$1><p style="margin: 0;">')
    .replace(/<strong>/g, '<strong style="font-weight: 700;">')
    .replace(/<em>/g, '<em style="font-style: italic;">')
    .replace(/<a /g, '<a style="color: #436FA3; text-decoration: none;" ')
    .replace(/<img /g, '<img style="max-width: 100%; height: auto; border-radius: 4px; display: block; margin: 0 0 16px 0;" ')
}

/**
 * Replace {{voornaam}} variable with recipient's first name.
 */
function replaceVariables(html: string, firstName?: string): string {
  const name = firstName || 'lezer'
  return html.replace(/\{\{voornaam\}\}/g, escapeHtml(name))
}

/**
 * Prevent email clients from auto-linking domain-like text.
 * Inserts a zero-width space before the dot in known domains.
 * Industry standard trick (Mailchimp, Litmus, Campaign Monitor).
 */
function breakAutoLinks(text: string): string {
  return text.replace(/Rijksuitgaven\.nl/gi, 'Rijksuitgaven&#8203;.nl')
}

export function renderCampaignEmail(params: CampaignParams): string {
  // Body is HTML from WYSIWYG editor — add inline styles + replace variables
  // breakAutoLinks runs on body text nodes to prevent email client auto-linking
  const bodyHtml = breakAutoLinks(replaceVariables(addEmailStyles(params.body), params.firstName))

  // Preheader: hidden text shown in email client preview (next to subject line)
  const preheaderBlock = params.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(params.preheader)}</div><div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${'&zwnj;&nbsp;'.repeat(40)}</div>`
    : ''

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
  ${preheaderBlock}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #E1EAF2;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

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
                  <td style="font-size: 22px; font-weight: 700; color: #0E3261; text-align: left; padding-bottom: 28px;">
                    ${breakAutoLinks(escapeHtml(params.heading))}
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="font-size: 16px; line-height: 24px; color: #4a4a4a; padding-bottom: 24px;">
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
                    KvK: 96257008<br />
                    <a href="mailto:contact@rijksuitgaven.nl" style="color: #436FA3; text-decoration: none;">contact@rijksuitgaven.nl</a>
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 12px; line-height: 18px; color: #8a8a8a; text-align: center; padding-top: 12px;">
                    <a href="${escapeHtml(params.unsubscribeUrl.replace('/afmelden?token=', '/voorkeuren?token='))}" style="color: #8a8a8a; text-decoration: underline;">Voorkeuren beheren</a>
                    &nbsp;|&nbsp;
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

/**
 * Convert campaign HTML to plain text for multipart emails.
 * Strips tags, preserves links, converts lists to dashes.
 */
export function renderCampaignEmailText(params: CampaignParams): string {
  const name = params.firstName || 'lezer'
  const body = params.body.replace(/\{\{voornaam\}\}/g, name)

  let text = body
    // Convert links: <a href="url">text</a> → text (url)
    .replace(/<a\s+[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    // Convert list items to dashes
    .replace(/<li[^>]*>/gi, '- ')
    // Convert block elements to newlines
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/[uo]l>/gi, '\n')
    // Strip remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&zwnj;/g, '')
    .replace(/&#8203;/g, '')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const parts: string[] = [params.heading, '', text]

  if (params.ctaText && params.ctaUrl) {
    parts.push('', `${params.ctaText}: ${params.ctaUrl}`)
  }

  parts.push(
    '',
    '---',
    'Vragen? Neem contact op met ons team: contact@rijksuitgaven.nl',
    '',
    'Rijksuitgaven.nl | KvK: 96257008',
    `Voorkeuren: ${params.unsubscribeUrl.replace('/afmelden?token=', '/voorkeuren?token=')}`,
    `Afmelden: ${params.unsubscribeUrl}`,
  )

  return parts.join('\n')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
