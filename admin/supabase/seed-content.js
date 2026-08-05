// One-time seed: extracts the real `pageContent` literal directly out of the live
// content.html source (so there's zero risk of a hand-transcription mistake) and
// pushes it into site_content_sections/fields/images/repeats. Uses the secret key
// (server/.env) since this is a local, one-time admin script, never shipped.
require('dotenv').config({ path: __dirname + '/../server/.env' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Reads from the pristine pre-migration backup, not the live content.html — the live
// file no longer contains the hardcoded literal (it now loads from Supabase), and this
// backup is also guaranteed untouched by any in-app edits made since the cutover.
const html = fs.readFileSync(path.join(__dirname, '..', 'content-previous.html'), 'utf8');
const startMarker = 'const in_ = (label, value)';
const endMarker = 'const CURRENT_PAGE_KEY';
const startIdx = html.indexOf(startMarker);
const endIdx = html.indexOf(endMarker);
if (startIdx === -1 || endIdx === -1) throw new Error('Could not locate pageContent block in content.html');
const snippet = html.slice(startIdx, endIdx);

const extractPageContent = new Function(snippet + '\nreturn pageContent;');
const pageContent = extractPageContent();

async function clearExisting() {
  const tables = ['site_content_sections', 'site_content_fields', 'site_content_images', 'site_content_repeats', 'content_change_log'];
  for (const t of tables) {
    const { error } = await supabase.from(t).delete().not('id', 'is', null);
    if (error) throw new Error(`clearing ${t}: ${error.message}`);
  }
  console.log('Cleared existing content-editor rows.');
}

async function main() {
  await clearExisting();
  for (const page of Object.keys(pageContent)) {
    const sections = pageContent[page];
    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const section = sections[sIdx];
      const { error: secErr } = await supabase.from('site_content_sections').insert({
        page, section_name: section.name, sort_order: sIdx
      });
      if (secErr) throw new Error(`section ${page}/${section.name}: ${secErr.message}`);

      const fields = section.fields || [];
      for (let fIdx = 0; fIdx < fields.length; fIdx++) {
        const f = fields[fIdx];
        const { error } = await supabase.from('site_content_fields').insert({
          page, section_name: section.name, field_label: f.label, field_type: f.type,
          field_value: f.value, original_value: f.value, sort_order: fIdx
        });
        if (error) throw new Error(`field ${page}/${section.name}/${f.label}: ${error.message}`);
      }

      const images = section.images || [];
      for (const img of images) {
        const { error } = await supabase.from('site_content_images').insert({
          page, section_name: section.name, file: img.file, label: img.label, size: img.size
        });
        if (error) throw new Error(`image ${page}/${section.name}/${img.file}: ${error.message}`);
      }

      const repeats = section.repeats || [];
      for (let rIdx = 0; rIdx < repeats.length; rIdx++) {
        const block = repeats[rIdx];
        const repeatFields = (block.fields || []).map(f => ({ label: f.label, type: f.type, value: f.value, original: f.value }));
        const { error } = await supabase.from('site_content_repeats').insert({
          page, section_name: section.name, repeat_title: block.title, sort_order: rIdx,
          fields: repeatFields, image: block.image || null
        });
        if (error) throw new Error(`repeat ${page}/${section.name}/${block.title}: ${error.message}`);
      }
    }
    console.log(`Seeded page: ${page} (${sections.length} sections)`);
  }

  const { error: logErr } = await supabase.from('content_change_log').insert({
    actor_name: 'Kevin', actor_email: 'kevin@forgeddigitaldesign.com',
    page: 'All Pages', section: 'Initial Content', field: 'Baseline',
    old_value: '—', new_value: 'Site content loaded from christchurchbluffton.org'
  });
  if (logErr) throw new Error(`baseline log entry: ${logErr.message}`);

  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
