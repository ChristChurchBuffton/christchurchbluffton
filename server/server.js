require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3002;

// Middleware
app.use(express.json());

// Serve static files from src/
const staticRoot = path.join(__dirname, '..', 'src');
app.use(express.static(staticRoot));

// --- Breeze API helper ---
async function breezeRequest(endpoint, params) {
  const url = new URL(endpoint, process.env.BREEZE_URL + '/');
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', 'Api-Key': process.env.BREEZE_API_KEY },
    signal: AbortSignal.timeout(10000)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Breeze API ${res.status}: ${text}`);
  }

  const text = await res.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

async function addPerson(first, last, email, phone) {
  const fields = [
    ...(email ? [{ field_id: process.env.BREEZE_EMAIL_FIELD_ID, field_type: 'email', response: true, details: { address: email } }] : []),
    ...(phone ? [{ field_id: process.env.BREEZE_PHONE_FIELD_ID, field_type: 'phone', response: true, details: { phone_mobile: phone } }] : [])
  ];

  const params = { first, last };
  if (fields.length) params.fields_json = JSON.stringify(fields);
  return breezeRequest('people/add', params);
}

async function assignTag(personId, tagId) {
  return breezeRequest('tags/assign', { person_id: personId, tag_id: tagId });
}

// --- API Routes ---

// POST /api/contact
app.post('/api/contact', async (req, res) => {
  try {
    const { fullName, email, phone, interest, message } = req.body;

    if (!fullName || !email || !interest) {
      return res.status(400).json({ error: 'Full name, email, and interest are required.' });
    }

    // Split name at first space
    const spaceIdx = fullName.trim().indexOf(' ');
    const first = spaceIdx > 0 ? fullName.trim().substring(0, spaceIdx) : fullName.trim();
    const last = spaceIdx > 0 ? fullName.trim().substring(spaceIdx + 1) : '';

    // Add person to Breeze
    const person = await addPerson(first, last, email, phone || null);
    console.log('[Contact] Added person:', person.id, '-', first, last);

    // Assign "Contact Form" tag
    await assignTag(person.id, process.env.BREEZE_TAG_CONTACT);
    console.log('[Contact] Assigned tag Contact Form to', person.id);

    // Log email notification (Resend added later)
    console.log(`[Notify] Would email ${process.env.NOTIFY_EMAIL}:`);
    console.log(`  Subject: New Contact Form — ${fullName}`);
    console.log(`  Interest: ${interest}`);
    console.log(`  Message: ${message || '(none)'}`);
    console.log(`  Email: ${email} | Phone: ${phone || '(none)'}`);

    res.json({ success: true });
  } catch (err) {
    console.error('[Contact] Error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// POST /api/prayer
app.post('/api/prayer', async (req, res) => {
  try {
    const { name, prayer } = req.body;

    if (!prayer) {
      return res.status(400).json({ error: 'Prayer text is required.' });
    }

    // Log notification
    console.log(`[Notify] Would email ${process.env.NOTIFY_EMAIL}:`);
    console.log(`  Subject: New Prayer Request — ${name || 'Anonymous'}`);
    console.log(`  Prayer: ${prayer}`);

    // Always succeed (pastoral UX)
    res.json({ success: true });
  } catch (err) {
    console.error('[Prayer] Error:', err.message);
    // Still return success — pastoral UX, never show error to user
    res.json({ success: true });
  }
});

// POST /api/stay-updated
app.post('/api/stay-updated', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    // Use email prefix as first name
    const prefix = email.split('@')[0];
    const first = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    const last = '(Stay Updated)';

    const person = await addPerson(first, last, email, null);
    console.log('[Stay Updated] Added person:', person.id, '-', email);

    await assignTag(person.id, process.env.BREEZE_TAG_STAYUPDATED);
    console.log('[Stay Updated] Assigned tag Stay Updated to', person.id);

    // Log notification
    console.log(`[Notify] Would email ${process.env.NOTIFY_EMAIL}:`);
    console.log(`  Subject: New Newsletter Signup — ${email}`);

    res.json({ success: true });
  } catch (err) {
    console.error('[Stay Updated] Error:', err.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// --- Clean URL fallback ---
// Serve .html files without extension (e.g., /contact → contact.html)
app.get('*', (req, res) => {
  const filePath = path.join(staticRoot, req.path + '.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).sendFile(path.join(staticRoot, '404.html'));
    }
  });
});

app.listen(PORT, () => {
  console.log(`CCB dev server running at http://localhost:${PORT}`);
  console.log(`Serving static files from: ${staticRoot}`);
});
