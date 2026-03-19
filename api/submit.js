// Vercel serverless function — proxies form submissions to Notion API
// Notion database ID: 1bda477e20ca4ed19da00f0c9a06750a
// Requires env var: NOTION_TOKEN

const NOTION_DB_ID = '1bda477e20ca4ed19da00f0c9a06750a';
const NOTION_API = 'https://api.notion.com/v1/pages';
const NOTION_VERSION = '2022-06-28';

const ALLOWED_ORIGINS = [
  'https://agentic-commerce.vercel.app',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];

function cors(req, res) {
  const origin = req.headers.origin || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

export default async function handler(req, res) {
  cors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.NOTION_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Server misconfigured: NOTION_TOKEN missing' });
  }

  const {
    name,
    type,
    layer,
    website,
    logoDomain,
    twitterHandle,
    description,
    funding,
    contactEmail,
    submitterName,
  } = req.body || {};

  // Basic validation
  if (!name || !type || !layer || !website || !description || !contactEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Build Notion page properties
  const properties = {
    'Protocol Name': {
      title: [{ text: { content: String(name).slice(0, 200) } }],
    },
    'Type': {
      select: { name: String(type) },
    },
    'Layer': {
      select: { name: String(layer) },
    },
    'Website': {
      url: String(website),
    },
    'Description': {
      rich_text: [{ text: { content: String(description).slice(0, 2000) } }],
    },
    'Contact Email': {
      email: String(contactEmail),
    },
  };

  if (logoDomain) {
    properties['Logo Domain'] = {
      rich_text: [{ text: { content: String(logoDomain).slice(0, 200) } }],
    };
  }

  if (twitterHandle) {
    properties['Twitter Handle'] = {
      rich_text: [{ text: { content: String(twitterHandle).replace(/^@/, '').slice(0, 100) } }],
    };
  }

  if (funding) {
    properties['Funding'] = {
      rich_text: [{ text: { content: String(funding).slice(0, 200) } }],
    };
  }

  if (submitterName) {
    properties['Submitter Name'] = {
      rich_text: [{ text: { content: String(submitterName).slice(0, 200) } }],
    };
  }

  try {
    const notionRes = await fetch(NOTION_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': NOTION_VERSION,
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DB_ID },
        properties,
      }),
    });

    const data = await notionRes.json();

    if (!notionRes.ok) {
      console.error('Notion API error:', data);
      return res.status(502).json({ error: 'Failed to create Notion entry', details: data.message });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('Submission error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
