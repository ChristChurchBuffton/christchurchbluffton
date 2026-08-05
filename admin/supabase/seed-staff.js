// One-time restore of the real staff directory, pulled directly out of localhost:8098's
// localStorage (ccb_admin_staff / ccb_admin_staff_positions) before staff.html's migration
// left it stranded there with no path back into Supabase.
require('dotenv').config({ path: __dirname + '/../server/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const positions = ['Lead Pastor', 'Board Members', 'Worship Leader', 'Web Designer', 'Administrators'];
const staff = [
  { name: 'Kevin McCartney', email: 'kevin@forgeddigitaldesign.com', phone: '(843) 505-0890', position: 'Web Designer' },
  { name: 'Judy Ferguson', email: 'info@christchurchbluffton.org', phone: '', position: 'Administrators' },
  { name: 'Karen Binder', email: 'admin@christchurchbluffton.org', phone: '', position: 'Administrators' },
  { name: 'Kim Perri', email: 'kimperri@aol.com', phone: '', position: 'Administrators' },
  { name: 'Bradley Chestnut', email: 'bradley@christchurchbluffton.org', phone: '', position: 'Worship Leader' },
  { name: 'Jonathan Riddle', email: 'jonathan@christchurchbluffton.org', phone: '', position: 'Lead Pastor' }
];

async function main() {
  const positionIdByName = {};
  for (let i = 0; i < positions.length; i++) {
    const { data, error } = await supabase.from('staff_positions').insert({ name: positions[i], sort_order: i }).select().single();
    if (error) throw new Error(`position ${positions[i]}: ${error.message}`);
    positionIdByName[positions[i]] = data.id;
  }
  console.log('Restored positions.');

  for (const s of staff) {
    const { error } = await supabase.from('staff').insert({
      name: s.name, email: s.email, phone: s.phone || null,
      position_id: positionIdByName[s.position]
    });
    if (error) throw new Error(`staff ${s.name}: ${error.message}`);
  }
  console.log('Restored staff.');
  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
