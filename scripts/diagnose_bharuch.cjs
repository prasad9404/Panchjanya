/**
 * BHARUCH DIAGNOSTIC SCRIPT
 * Prints the exact current state of the Bharuch document from Firestore.
 * Usage: node scripts/diagnose_bharuch.cjs
 */
require('dotenv').config({ path: '.env' });
const admin = require('firebase-admin');
const fs = require('fs');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function diagnose() {
  const BHARUCH_ID = 'rWeTiMRqK9BSst61LP21';
  const snap = await db.collection('temples').doc(BHARUCH_ID).get();

  if (!snap.exists) {
    console.error('❌ Document not found!');
    process.exit(1);
  }

  const data = snap.data();

  // Save full raw data to file for inspection
  fs.writeFileSync('bharuch_raw.json', JSON.stringify(data, null, 2));
  console.log('✅ Full document saved to bharuch_raw.json\n');

  // Print key multilingual fields
  const fields = [
    'name', 'todaysName', 'todaysNameTitle', 'address', 'taluka', 'district',
    'directions_text', 'description_title', 'description_text',
    'sthana_info_title', 'sthana_info_text', 'architectureDescription',
    'sthanPothiDescription', 'sthanPothiTitle', 'contactDetails',
  ];

  console.log('=== TOP-LEVEL MULTILINGUAL FIELDS ===\n');
  fields.forEach(f => {
    const val = data[f];
    if (!val) {
      console.log(`  ❌ ${f}: MISSING`);
    } else if (typeof val === 'string') {
      console.log(`  ⚠️  ${f}: legacy string = "${val.substring(0,60)}..."`);
    } else {
      const enEmpty = !val.en;
      const hiEmpty = !val.hi;
      const mrEmpty = !val.mr;
      const status = (enEmpty && hiEmpty && mrEmpty) ? '❌ ALL EMPTY' : 
                     (enEmpty ? '⚠️  en empty' : '✅');
      console.log(`  ${status} ${f}:`);
      if (val.en) console.log(`         en: "${val.en.substring(0,80).replace(/\n/g,' ')}..."`);
      if (val.hi) console.log(`         hi: "${val.hi.substring(0,80).replace(/\n/g,' ')}..."`);
      if (val.mr) console.log(`         mr: "${val.mr.substring(0,80).replace(/\n/g,' ')}..."`);
    }
  });

  console.log('\n=== DETAILS ARRAY ===\n');
  const details = data.details || [];
  console.log(`  Total details: ${details.length}`);
  details.forEach((d, i) => {
    console.log(`  [${i}] title: ${JSON.stringify(d.title)}`);
    const desc = d.description;
    if (desc) {
      const hasEn = typeof desc === 'string' ? !!desc : !!desc.en;
      const hasMr = typeof desc === 'object' ? !!desc.mr : false;
      console.log(`       description: en=${hasEn} mr=${hasMr}`);
    }
    if (d.sthanPothiDescription) {
      console.log(`       sthanPothiDescription: ${JSON.stringify(d.sthanPothiDescription).substring(0,60)}`);
    }
  });

  console.log('\n=== DESCRIPTION SECTIONS ===\n');
  const sections = data.descriptionSections || [];
  console.log(`  Total sections: ${sections.length}`);
  sections.forEach((s, i) => {
    console.log(`  [${i}] title: ${JSON.stringify(s.title)?.substring(0,60)}`);
  });

  process.exit(0);
}

diagnose().catch(e => { console.error(e); process.exit(1); });
