/**
 * Optional transactional email when verification is rejected (Resend).
 * Set RESEND_API_KEY and RESEND_FROM_EMAIL to enable.
 */
export async function sendVerificationRejectionEmail(params: {
  toEmail: string;
  reason: string;
}): Promise<{ sent: boolean; skippedReason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return { sent: false, skippedReason: 'RESEND_API_KEY or RESEND_FROM_EMAIL not configured' };
  }

  const body = {
    from,
    to: params.toEmail,
    subject: 'Domio — aktualizacja weryfikacji konta',
    html: `<p>Dzień dobry,</p><p>Twoja prośba o weryfikację została rozpatrzona negatywnie.</p><p><strong>Powód:</strong></p><p>${escapeHtml(params.reason)}</p><p>Po poprawkach możesz ponownie przesłać dokumenty w panelu konta.</p>`,
  };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Resend error:', res.status, text);
    return { sent: false, skippedReason: `Resend HTTP ${res.status}` };
  }

  return { sent: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
