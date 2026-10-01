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
const SUPABASE_URL = () => process.env.SUPABASE_URL;

async function sb(method, path, body) {
  const res = await fetch(`${SUPABASE_URL()}/rest/v1/${path}`, {
    method,
    headers: sbHeaders({ 'Content-Type': 'application/json', Prefer: method === 'POST' ? 'return=representation' : 'return=representation' }),
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10000)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${method} ${path.split('?')[0]} failed: ${res.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : [];
}

// Same rule as the admin's formatPhone(): 10 digits (a leading 1 is dropped) -> (843) 555-0101; anything else is kept as typed.
function formatPhone(raw) {
  const t = String(raw || '').trim();
  if (!t) return '';
  let d = t.replace(/\D/g, '');
  if (d.length === 11 && d[0] === '1') d = d.slice(1);
  return d.length === 10 ? '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6) : t;
}

// Strip quotes/backslashes so a value can sit safely inside a quoted PostgREST filter.
function q(v) { return String(v || '').replace(/["\\]/g, ''); }

async function isSystemEnabled() {
  try {
    const rows = await sb('GET', 'release_toggles?key=eq.youth_system&select=enabled');
    return !!(rows[0] && rows[0].enabled);
  } catch (e) { return false; } // fail closed
}

// Finds or creates the parent's household, and makes sure the student appears on that
// household's own member list too (not just linked from the youth side) — the brief's "attach
// the student to their household" / "create a household with the parent as head and the
// student as a member."
//
// Three-tier match (Kevin, 2026-09-30): an EXACT match (email, or phone+last name) links
// automatically, same as always. Nobody's live on this public form to ask about anything
// murkier, so a SIMILAR match (last name only, nothing else lining up) is never auto-merged —
// it creates a new household (the safe default) but records the possible match so staff can
// review and merge it later from the roster if it really is the same family. No match at all
// also just creates a new household.
async function findOrCreateHousehold(parent, student) {
  let family = null;
  const orParts = [];
  if (parent.email) orParts.push(`head_email.ilike.%22${encodeURIComponent(q(parent.email))}%22`, `spouse_email.ilike.%22${encodeURIComponent(q(parent.email))}%22`);
  if (parent.phone && parent.lastName) {
    orParts.push(`and(head_phone.eq.%22${encodeURIComponent(q(parent.phone))}%22,head_last_name.ilike.%22${encodeURIComponent(q(parent.lastName))}%22)`);
    orParts.push(`and(spouse_phone.eq.%22${encodeURIComponent(q(parent.phone))}%22,spouse_last_name.ilike.%22${encodeURIComponent(q(parent.lastName))}%22)`);
  }
  // The parent's own first + last name matching the head OR the spouse is as certain as an email (a spouse listed under the other adult's household).
  if (parent.firstName && parent.lastName) {
    const fn = encodeURIComponent(String(parent.firstName).replace(/["\\]/g, '')), ln = encodeURIComponent(String(parent.lastName).replace(/["\\]/g, ''));
    orParts.push(`and(head_first_name.ilike.%22${fn}%22,head_last_name.ilike.%22${ln}%22)`);
    orParts.push(`and(spouse_first_name.ilike.%22${fn}%22,spouse_last_name.ilike.%22${ln}%22)`);
  }
  if (orParts.length) {
    const rows = await sb('GET', `congregant_families?select=id&or=(${orParts.join(',')})&limit=1`);
    if (rows.length) family = rows[0];
  }
  let possibleDuplicateFamilyId = null;
  // Re-submission of a student already on file in the matched household: nothing is added to or changed in that household.
  // The submission is saved as its OWN household (flagged against the match) with the new, flagged student in it, so an admin reviews both.
  // A new sibling for a known family (no student of that name yet) still just links to the household.
  if (family) {
    const dupKid = await sb('GET', `youth_students?family_id=eq.${family.id}&first_name=ilike.${encodeURIComponent(q(student.firstName))}&last_name=ilike.${encodeURIComponent(q(student.lastName))}&select=id&limit=1`);
    if (dupKid.length) { possibleDuplicateFamilyId = family.id; family = null; }
  }
  if (!family && !possibleDuplicateFamilyId && parent.lastName) {
    const similar = await sb('GET', `congregant_families?select=id&or=(head_last_name.ilike.%22${encodeURIComponent(q(parent.lastName))}%22,spouse_last_name.ilike.%22${encodeURIComponent(q(parent.lastName))}%22)&limit=1`);
    if (similar.length) possibleDuplicateFamilyId = similar[0].id;
  }
  if (!family) {
    const created = await sb('POST', 'congregant_families', {
      head_first_name: parent.firstName, head_last_name: parent.lastName,
      head_email: parent.email || null, head_phone: parent.phone || null,
      address: parent.address || null, city: parent.city || null, state: parent.state || null, zip: parent.zip || null,
      possible_duplicate_family_id: possibleDuplicateFamilyId
    });
    family = created[0];
  }
  // Student on the household's own roster too — matched by name within that family so a
  // resubmission never adds a second entry (and never changes the existing one).
  const existingKids = await sb('GET', `congregant_children?family_id=eq.${family.id}&first_name=ilike.${encodeURIComponent(q(student.firstName))}&last_name=ilike.${encodeURIComponent(q(student.lastName))}&select=id`);
  const kidPayload = { family_id: family.id, first_name: student.firstName, last_name: student.lastName, birthdate: student.birthdate || null };
  if (!existingKids.length) {
    const maxOrder = await sb('GET', `congregant_children?family_id=eq.${family.id}&select=sort_order&order=sort_order.desc&limit=1`);
    await sb('POST', 'congregant_children', Object.assign({ sort_order: maxOrder.length ? maxOrder[0].sort_order + 1 : 0 }, kidPayload));
  }
  return { familyId: family.id, possibleDuplicateFamilyId };
}

// A youth_night from within roughly the current gathering window — used to auto check the
// student in if this form is being filled out live during check-in (the brief gives no explicit
// open/closed flag for a session, so "started recently" is the practical stand-in for "live").
const LIVE_SESSION_WINDOW_HOURS = 4;
async function findLiveNight() {
  const rows = await sb('GET', 'youth_nights?select=id,occurred_at&order=occurred_at.desc&limit=1');
  if (!rows.length) return null;
  const ageHours = (Date.now() - new Date(rows[0].occurred_at).getTime()) / 36e5;
  return ageHours <= LIVE_SESSION_WINDOW_HOURS ? rows[0].id : null;
}

const handleRequest = async (event) => {
  if (event.httpMethod === 'GET') {
    if (event.queryStringParameters && event.queryStringParameters.check) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: await isSystemEnabled() }) };
    }
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const b = JSON.parse(event.body || '{}');
    if (b.website_url_confirm) return { statusCode: 200, body: JSON.stringify({ success: true }) };
    if (!b.turnstileToken || !(await verifyTurnstile(b.turnstileToken))) {
      return { statusCode: 400, body: JSON.stringify({ error: 'CAPTCHA verification failed. Please try again.' }) };
    }
    if (!(await isSystemEnabled())) {
      return { statusCode: 403, body: JSON.stringify({ error: 'This form is not available yet.' }) };
    }

    const student = {
      firstName: (b.studentFirstName || '').trim(), lastName: (b.studentLastName || '').trim(),
      phone: formatPhone(b.phone), email: (b.email || '').trim(),
      birthdate: b.birthdate || null, grade: (b.grade || '').trim(), school: (b.school || '').trim(), notes: (b.notes || '').trim()
    };
    const parent = {
      firstName: (b.parentFirstName || '').trim(), lastName: (b.parentLastName || '').trim(),
      phone: formatPhone(b.parentPhone), phone2: formatPhone(b.parentPhone2), email: (b.parentEmail || '').trim(), address: (b.parentAddress || '').trim(),
      city: (b.parentCity || '').trim(), state: (b.parentState || '').trim(), zip: (b.parentZip || '').trim()
    };
    const signatureName = (b.signatureName || '').trim();
    // Same requirements the form itself now enforces (Kevin, 2026-09-30) — checked again here so
    // a request made straight to this endpoint, bypassing the browser form, can't skip them.
    // typeof-checked (not just truthy) for the photo/video choices specifically, since an
    // explicit "No" is a real, required answer and must not be treated the same as "left blank".
    if (!student.firstName || !student.lastName || !parent.firstName || !parent.lastName || !signatureName
        || !parent.phone || !parent.email || !parent.address
        || typeof b.identifiablePhotos !== 'boolean' || typeof b.identifiableVideo !== 'boolean') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Please fill in all required fields.' }) };
    }

    // This form always saves for real, on every site (it sends no email and only writes to the
    // youth + Congregants records), so it deliberately does NOT use the form test-mode switch.
    const writeResult = await (async () => {
      let familyId = null;
      let possibleDuplicateFamilyId = null;
      try {
        const householdResult = await findOrCreateHousehold(parent, student);
        familyId = householdResult.familyId;
        possibleDuplicateFamilyId = householdResult.possibleDuplicateFamilyId;
      } catch (famErr) {
        console.error('[New Student Signup] household link error:', famErr.message);
      }

      // The public form NEVER changes a student already on file (Kevin 10/1: people may mess it up). If the same name
      // is already on file — in this household or any other — the submission is saved as its own new card, flagged
      // "Possible duplicate", hidden from check-in, and an admin decides in the Youth tab.
      let studentId, studentCode;
      let existing = [];
      if (familyId) existing = await sb('GET', `youth_students?family_id=eq.${familyId}&first_name=ilike.${encodeURIComponent(q(student.firstName))}&last_name=ilike.${encodeURIComponent(q(student.lastName))}&select=id,student_code`);
      let possibleDuplicateStudentId = existing.length ? existing[0].id : null;
      if (!existing.length) {
        const sameName = await sb('GET', `youth_students?first_name=ilike.${encodeURIComponent(q(student.firstName))}&last_name=ilike.${encodeURIComponent(q(student.lastName))}&select=id&limit=1`);
        if (sameName.length) possibleDuplicateStudentId = sameName[0].id;
      }
      const corePayload = {
        first_name: student.firstName, last_name: student.lastName,
        phone: student.phone || null, email: student.email || null, birthdate: student.birthdate, school: student.school || null,
        family_id: familyId, possible_duplicate_family_id: possibleDuplicateFamilyId, possible_duplicate_student_id: possibleDuplicateStudentId,
        parent_first_name: parent.firstName, parent_last_name: parent.lastName, parent_email: parent.email || null,
        parent_phone: parent.phone || null, parent_phone_2: parent.phone2 || null,
        parent_address: parent.address || null, parent_city: parent.city || null, parent_state: parent.state || null, parent_zip: parent.zip || null
      };
      const created = await sb('POST', 'youth_students', corePayload);
      studentId = created[0].id; studentCode = created[0].student_code;

      // grade_year = the school year (starts Aug 6, named by the calendar year it starts in) the grade was entered for, so the admin side can move it up each August 6.
      const gradeYear = (d => (d.getMonth() > 7 || (d.getMonth() === 7 && d.getDate() >= 6)) ? d.getFullYear() : d.getFullYear() - 1)(new Date());
      const detailsPayload = { grade: student.grade || null, grade_year: student.grade ? gradeYear : null, notes: student.notes || null };
      await sb('POST', 'youth_student_details', Object.assign({ student_id: studentId }, detailsPayload));

      await sb('POST', 'youth_consents', {
        student_id: studentId, identifiable_photos: !!b.identifiablePhotos, identifiable_video: !!b.identifiableVideo,
        signature_name: signatureName, terms_version: b.termsVersion || 'v1'
      });

      let checkedInToNight = null;
      try {
        const liveNightId = possibleDuplicateStudentId ? null : await findLiveNight();
        if (liveNightId) {
          await sb('POST', 'youth_attendance', { night_id: liveNightId, student_id: studentId });
          checkedInToNight = liveNightId;
        }
      } catch (attErr) {
        // A duplicate-attendance conflict (already checked in) or any other hiccup here must
        // never fail the whole signup — the student record and consent are already saved.
        console.error('[New Student Signup] live check-in error:', attErr.message);
      }

      return { studentCode, checkedInToNight };
    })();
    const studentCode = writeResult.studentCode;

    return { statusCode: 200, body: JSON.stringify({ success: true, studentCode }) };
  } catch (err) {
    console.error('[New Student Signup] Error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong. Please try again.' }) };
  }
};

exports.handler = handleRequest;
