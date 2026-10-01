async function verifyTurnstile(token) {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: token }),
    signal: AbortSignal.timeout(10000)
  });
  const data = await res.json();
  return data.success;
}

function sbHeaders(extra) {
  return Object.assign({ apikey: process.env.SUPABASE_SECRET_KEY, Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}` }, extra || {});
}

async function isFormEnabled() {
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/release_toggles?key=eq.household_intake_form&select=enabled`, {
    headers: sbHeaders(), signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) return false; // fail closed — a database hiccup must never accidentally open a gated form
  const rows = await res.json();
  return !!(rows[0] && rows[0].enabled);
}

// Same rule as the admin's formatPhone(): 10 digits (a leading 1 is dropped) -> (843) 555-0101; anything else is kept as typed.
function formatPhone(raw) {
  const t = String(raw || '').trim();
  if (!t) return '';
  let d = t.replace(/\D/g, '');
  if (d.length === 11 && d[0] === '1') d = d.slice(1);
  return d.length === 10 ? '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6) : t;
}

async function sbWrite(method, table, body, query) {
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${table}${query || ''}`, {
    method,
    headers: sbHeaders({ 'Content-Type': 'application/json', Prefer: 'return=representation' }),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000)
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text, json: res.ok && text ? JSON.parse(text) : null };
}

function splitName(full, fallbackLast) {
  const t = String(full || '').trim();
  const i = t.indexOf(' ');
  return i > 0 ? { first: t.slice(0, i), last: t.slice(i + 1).trim() } : { first: t, last: fallbackLast || '' };
}

// Saves a submitted household straight into Congregants (head, spouse if listed, children).
// Listed children go onto the household only — NEVER into Youth (Kevin 2026-09-30: Youth is
// something a student is added to on the Youth side; Congregants -> Youth never happens).
// Anyone who isn't a spouse or a child (a parent, a friend...) has no place on a household
// record, so they're kept only in the saved copy of the submission. An EXACT match (same email,
// or same phone + last name) attaches to that household and only adds children it doesn't
// already have — it never overwrites the adults' existing info.
async function saveHousehold(payload, matchedFamilyId, submittedIp, similarFamilyId) {
  const members = payload.members || [];
  const spouse = members.find(m => /spouse|husband|wife|partner/i.test(m.relationship || ''));
  const kids = members.filter(m => m !== spouse && /child|son|daughter|kid|step/i.test(m.relationship || ''));

  let familyId = matchedFamilyId;
  if (!familyId) {
    const sp = spouse ? splitName(spouse.name, payload.lastName) : null;
    const created = await sbWrite('POST', 'congregant_families', {
      head_first_name: payload.firstName, head_last_name: payload.lastName,
      head_email: payload.email || null, head_phone: payload.phone || null,
      head_birth_month: payload.birthMonth, head_birth_day: payload.birthDay,
      spouse_first_name: sp ? sp.first : null, spouse_last_name: sp ? sp.last : null,
      address: payload.address || null, city: payload.city || null, state: payload.state || null, zip: payload.zip || null,
      possible_duplicate_family_id: similarFamilyId || null
    });
    if (!created.ok) return created;
    familyId = created.json[0].id;
  }

  const existing = await fetch(`${process.env.SUPABASE_URL}/rest/v1/congregant_children?family_id=eq.${familyId}&select=first_name,last_name,sort_order`, {
    headers: sbHeaders(), signal: AbortSignal.timeout(10000)
  });
  const existingKids = existing.ok ? await existing.json() : [];
  let order = existingKids.reduce((mx, k) => Math.max(mx, (k.sort_order || 0) + 1), 0);
  for (const kid of kids) {
    const n = splitName(kid.name, payload.lastName);
    if (existingKids.some(k => (k.first_name || '').toLowerCase() === n.first.toLowerCase() && (k.last_name || '').toLowerCase() === n.last.toLowerCase())) continue;
    const r = await sbWrite('POST', 'congregant_children', { family_id: familyId, first_name: n.first, last_name: n.last, birthdate: kid.birthdate || null, sort_order: order++ });
    if (!r.ok) return r;
  }

  return sbWrite('POST', 'household_intake_submissions', { status: 'approved', payload, matched_family_id: familyId, submitted_ip: submittedIp });
}

const handleRequest = async (event) => {
  // A no-auth, read-only status check the public form uses so a visitor sees a clear "not
  // available yet" message instead of a form that silently fails on submit. Carries no
  // personal data either direction.
  if (event.httpMethod === 'GET') {
    if (event.queryStringParameters && event.queryStringParameters.check) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: await isFormEnabled() }) };
    }
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { firstName, lastName, email, phone, birthMonth, birthDay, address, city, state, zip, members, website_url_confirm, turnstileToken } = body;

    if (website_url_confirm) return { statusCode: 200, body: JSON.stringify({ success: true }) };

    if (!turnstileToken || !(await verifyTurnstile(turnstileToken))) {
      return { statusCode: 400, body: JSON.stringify({ error: 'CAPTCHA verification failed. Please try again.' }) };
    }

    // Held behind the release toggle (Workflow 6, Step 6) — leadership's own on/off switch in
    // the admin panel. Checked here, not just shown as a message on the page, so a direct POST
    // can't bypass the "not launched yet" state.
    if (!(await isFormEnabled())) {
      return { statusCode: 403, body: JSON.stringify({ error: 'This form is not available yet.' }) };
    }

    const cleanFirst = (firstName || '').trim();
    const cleanLast = (lastName || '').trim();
    if (!cleanFirst && !cleanLast) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Please share at least a first or last name.' }) };
    }
    const cleanEmail = (email || '').trim();
    const cleanPhone = formatPhone(phone);
    const cleanMembers = Array.isArray(members) ? members.filter(m => m && m.name).map(m => ({
      name: String(m.name).trim(), relationship: (m.relationship || '').trim(), birthdate: m.birthdate || null
    })) : [];

    const payload = {
      firstName: cleanFirst, lastName: cleanLast, email: cleanEmail, phone: cleanPhone,
      birthMonth: birthMonth ? parseInt(birthMonth, 10) : null, birthDay: birthDay ? parseInt(birthDay, 10) : null,
      address: (address || '').trim(), city: (city || '').trim(), state: (state || '').trim(), zip: (zip || '').trim(),
      members: cleanMembers
    };

    // Duplicate check — email OR phone + last name (per the brief) — flags a probable match for
    // a staff member to review/merge instead of silently creating a second household.
    let matchedFamilyId = null;
    let similarFamilyId = null; // same last name but nothing else lines up — never merged automatically, but flagged for staff
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) {
      try {
        const orParts = [];
        if (cleanEmail) orParts.push(`head_email.ilike.%22${encodeURIComponent(cleanEmail.replace(/["\\]/g, ''))}%22`, `spouse_email.ilike.%22${encodeURIComponent(cleanEmail.replace(/["\\]/g, ''))}%22`);
        if (cleanPhone && cleanLast) {
          orParts.push(`and(head_phone.eq.%22${encodeURIComponent(cleanPhone.replace(/["\\]/g, ''))}%22,head_last_name.ilike.%22${encodeURIComponent(cleanLast.replace(/["\\]/g, ''))}%22)`);
          orParts.push(`and(spouse_phone.eq.%22${encodeURIComponent(cleanPhone.replace(/["\\]/g, ''))}%22,spouse_last_name.ilike.%22${encodeURIComponent(cleanLast.replace(/["\\]/g, ''))}%22)`);
        }
        if (orParts.length) {
          const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/congregant_families?select=id&or=(${orParts.join(',')})&limit=1`, {
            headers: sbHeaders(), signal: AbortSignal.timeout(10000)
          });
          if (res.ok) {
            const rows = await res.json();
            if (rows.length) matchedFamilyId = rows[0].id;
          }
        }
        if (!matchedFamilyId && cleanLast) {
          const ln = encodeURIComponent(cleanLast.replace(/["\\]/g, ''));
          const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/congregant_families?select=id&or=(head_last_name.ilike.%22${ln}%22,spouse_last_name.ilike.%22${ln}%22)&limit=1`, {
            headers: sbHeaders(), signal: AbortSignal.timeout(10000)
          });
          if (res.ok) {
            const rows = await res.json();
            if (rows.length) similarFamilyId = rows[0].id;
          }
        }
      } catch (dupErr) {
        console.error('[Household Intake] duplicate check error:', dupErr.message);
      }
    }

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) {
      const submittedIp = (event.headers && (event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'])) || null;
      const saveRes = await saveHousehold(payload, matchedFamilyId, submittedIp, similarFamilyId);
      if (!saveRes.ok) {
        console.error('[Household Intake] save failed:', saveRes.status, saveRes.text || '');
        return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong. Please try again.' }) };
      }
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('[Household Intake] Error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong. Please try again.' }) };
  }
};

exports.handler = handleRequest;
