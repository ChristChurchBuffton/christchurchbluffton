// One-time restore of real prayer_requests + events data that was lost when
// localStorage got cleared on localhost:8098 before it had been migrated to
// Supabase. Reconstructed from exact details already in this conversation.
require('dotenv').config({ path: __dirname + '/../server/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const { error: prayerErr } = await supabase.from('prayer_requests').insert({
    is_anonymous: false,
    requester_name: 'Kevin & Stephanie McCartney',
    request_text: "Prayers for Stephanie's father, who continues to battle Parkinson's each and every day. He continues to show strength as he battles it.",
    status: 'active'
  });
  if (prayerErr) throw new Error('prayer: ' + prayerErr.message);
  console.log('Restored real prayer request.');

  const events = [
    {
      title: 'Saturday Evening Church Service',
      start_date: '2026-09-05',
      event_time: '17:30',
      location: 'Lord of Life Lutheran Church, 351 Buckwalter Pkwy, Bluffton, SC 29910',
      repeat: 'weekly',
      repeat_until: '2027-05-29'
    },
    {
      title: 'Christmas Eve Service',
      start_date: '2026-12-24',
      location: 'New Riverside Barn Park, 30 Red Barn Dr, Bluffton, SC',
      description: 'Time TBD.',
      repeat: 'none'
    },
    {
      title: 'TEST - 90 Days Out',
      start_date: '2026-11-02',
      repeat: 'none'
    },
    {
      title: 'Passion Camp',
      start_date: '2027-07-15',
      end_date: '2027-07-19',
      repeat: 'none'
    }
  ];
  for (const ev of events) {
    const { error } = await supabase.from('events').insert(ev);
    if (error) throw new Error(`event ${ev.title}: ${error.message}`);
    console.log(`Restored event: ${ev.title}`);
  }

  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
