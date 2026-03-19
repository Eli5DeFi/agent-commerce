// Vercel serverless function — proxies form submissions to Google Sheets
// via a Google Apps Script web app URL.
// Requires env var: GOOGLE_SHEET_URL  (the deployed Apps Script web app URL)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const sheetUrl = process.env.GOOGLE_SHEET_URL;
  if (!sheetUrl) return res.status(500).json({ error: 'Server misconfigured: GOOGLE_SHEET_URL missing' });

  const { name, type, layer, website, logoDomain, twitterHandle, description, funding, contactEmail, submitterName } = req.body || {};

  if (!name || !type || !layer || !website || !description || !contactEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const sheetRes = await fetch(sheetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        name: String(name).slice(0, 200),
        type: String(type),
        layer: String(layer),
        website: String(website),
        logoDomain: String(logoDomain || ''),
        twitterHandle: String(twitterHandle || '').replace(/^@/, ''),
        description: String(description).slice(0, 2000),
        funding: String(funding || ''),
        contactEmail: String(contactEmail),
        submitterName: String(submitterName || ''),
      }),
    });

    // Apps Script returns 302 on success — treat any 2xx/3xx as success
    if (sheetRes.ok || sheetRes.status === 302 || sheetRes.redirected) {
      return res.status(200).json({ success: true });
    }
    return res.status(502).json({ error: 'Sheet write failed', status: sheetRes.status });
  } catch (err) {
    console.error('Submission error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
