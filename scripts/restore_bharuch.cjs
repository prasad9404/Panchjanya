/**
 * BHARUCH DATA RESTORATION SCRIPT
 * 
 * This script reads the existing Firestore document for the Bharuch temple
 * (id: rWeTiMRqK9BSst61LP21) and restores empty top-level fields from data
 * that still exists in nested structures like details[], architectureDescription, etc.
 *
 * It uses `{ merge: true }` and only writes fields that are currently empty.
 * It will NEVER overwrite a non-empty field.
 *
 * Usage: node scripts/restore_bharuch.cjs
 */

require('dotenv').config({ path: '.env' });
const admin = require('firebase-admin');

// ── Initialize Firebase Admin ─────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────

function isEmpty(val) {
  if (!val) return true;
  if (typeof val === 'string') return val.trim() === '';
  if (typeof val === 'object') {
    return !val.en && !val.hi && !val.mr;
  }
  return false;
}

function firstNonEmpty(...values) {
  return values.find(v => !isEmpty(v)) ?? { en: '', hi: '', mr: '' };
}

function ensureMultilingual(val) {
  if (!val) return { en: '', hi: '', mr: '' };
  if (typeof val === 'string') return { en: val, hi: '', mr: '' };
  return { en: val.en || '', hi: val.hi || '', mr: val.mr || '' };
}

// ── Main Restoration Logic ────────────────────────────────────────────────

async function restoreBharuch() {
  const BHARUCH_ID = 'rWeTiMRqK9BSst61LP21';

  const docRef = db.collection('temples').doc(BHARUCH_ID);
  const snap = await docRef.get();

  if (!snap.exists) {
    console.error('❌ Bharuch document not found in Firestore!');
    process.exit(1);
  }

  const data = snap.data();
  console.log('\n📄 Current Bharuch document fields:\n');
  console.log('  name:', JSON.stringify(data.name));
  console.log('  address:', JSON.stringify(data.address));
  console.log('  taluka:', JSON.stringify(data.taluka));
  console.log('  district:', JSON.stringify(data.district));
  console.log('  description_text:', JSON.stringify(data.description_text));
  console.log('  sthana_info_text:', JSON.stringify(data.sthana_info_text));
  console.log('  architectureDescription:', JSON.stringify(data.architectureDescription));
  console.log('  details count:', (data.details || []).length);
  console.log('  descriptionSections count:', (data.descriptionSections || []).length);
  console.log('\n');

  // ── Build Restoration Payload (only fills empty fields) ─────────────────
  const restore = {};

  // 1. name - try todaysName as fallback then details[0].title
  if (isEmpty(data.name)) {
    const fallback = firstNonEmpty(
      data.todaysName,
      data.details?.[0]?.title,
      { en: 'Bharuch', hi: 'भरूच', mr: 'भरूच' }
    );
    restore.name = ensureMultilingual(fallback);
    console.log('🔄 Restoring name from fallback:', restore.name);
  }

  // 2. address - try from legacy field
  if (isEmpty(data.address)) {
    const fallback = firstNonEmpty(data.wayToReach, data.location_address);
    if (!isEmpty(fallback)) {
      restore.address = ensureMultilingual(fallback);
      console.log('🔄 Restoring address:', restore.address);
    }
  }

  // 3. taluka
  if (isEmpty(data.taluka) && data.taluka_mr) {
    restore.taluka = ensureMultilingual(data.taluka_mr);
    console.log('🔄 Restoring taluka:', restore.taluka);
  }

  // 4. district - from dump: name 'भरवस 1' has district 'भरूच, गुजरात'
  if (isEmpty(data.district)) {
    const fallback = firstNonEmpty(data.district_mr, { en: '', hi: 'भरूच, गुजरात', mr: 'भरूच, गुजरात' });
    if (!isEmpty(fallback)) {
      restore.district = ensureMultilingual(fallback);
      console.log('🔄 Restoring district:', restore.district);
    }
  }

  // 5. description_text - try from architectureDescription or details[0].description
  if (isEmpty(data.description_text)) {
    const fallback = firstNonEmpty(
      data.description,
      data.architectureDescription,
      data.details?.[0]?.description
    );
    if (!isEmpty(fallback)) {
      restore.description_text = ensureMultilingual(fallback);
      console.log('🔄 Restoring description_text from nested source');
    }
  }

  // 6. sthana_info_text - try from sthana or sthanPothiDescription
  if (isEmpty(data.sthana_info_text)) {
    const fallback = firstNonEmpty(
      data.sthana,
      data.sthanPothiDescription,
      data.details?.[0]?.sthanPothiDescription
    );
    if (!isEmpty(fallback)) {
      restore.sthana_info_text = ensureMultilingual(fallback);
      console.log('🔄 Restoring sthana_info_text from nested source');
    }
  }

  // 7. architectureDescription - if empty and a non-empty one is in details
  if (isEmpty(data.architectureDescription)) {
    const fromDetails = data.details?.find(d => !isEmpty(d.description));
    if (fromDetails) {
      restore.architectureDescription = ensureMultilingual(fromDetails.description);
      console.log('🔄 Restoring architectureDescription from details');
    }
  }

  // 8. directions_text
  if (isEmpty(data.directions_text)) {
    const fallback = firstNonEmpty(data.wayToReach, data.directions);
    if (!isEmpty(fallback)) {
      restore.directions_text = ensureMultilingual(fallback);
      console.log('🔄 Restoring directions_text:', restore.directions_text);
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  const keys = Object.keys(restore);
  if (keys.length === 0) {
    console.log('✅ No empty fields found that require restoration.');
    console.log('   The data looks intact. Check the admin UI - it may be a UI display issue.');
    process.exit(0);
  }

  console.log(`\n📝 About to restore ${keys.length} field(s): ${keys.join(', ')}`);
  console.log('\n⚠️  Review the above and press Ctrl+C to abort, or wait 5 seconds to proceed...\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  await docRef.set(restore, { merge: true });

  console.log('✅ Restoration complete! The following fields were updated:');
  keys.forEach(k => console.log(`   - ${k}:`, JSON.stringify(restore[k])));
  console.log('\n🔁 Please refresh the admin panel to confirm the data is visible.');
  process.exit(0);
}

restoreBharuch().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
