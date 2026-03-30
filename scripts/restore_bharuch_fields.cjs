/**
 * BHARUCH FIELD RESTORATION SCRIPT
 * 
 * Restores: directions_text, sthana_info_text, sthanPothiDescription, 
 *           descriptionSections, leelas
 * from existing data still present in the document.
 *
 * Usage: node scripts/restore_bharuch_fields.cjs
 */
require('dotenv').config({ path: '.env' });
const admin = require('firebase-admin');

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

function isEffectivelyEmpty(val) {
  if (!val) return true;
  if (typeof val === 'string') return val.trim() === '' || val.replace(/<[^>]*>/g, '').trim() === '';
  if (typeof val === 'object') {
    const en = (val.en || '').replace(/<[^>]*>/g, '').trim();
    const hi = (val.hi || '').replace(/<[^>]*>/g, '').trim();
    const mr = (val.mr || '').replace(/<[^>]*>/g, '').trim();
    return !en && !hi && !mr;
  }
  return true;
}

function ensureML(val) {
  if (!val) return { en: '', hi: '', mr: '' };
  if (typeof val === 'string') return { en: val, hi: '', mr: '' };
  return { en: val.en || '', hi: val.hi || '', mr: val.mr || '' };
}

async function restoreFields() {
  const BHARUCH_ID = 'rWeTiMRqK9BSst61LP21';
  const snap = await db.collection('temples').doc(BHARUCH_ID).get();

  if (!snap.exists) {
    console.error('Document not found!');
    process.exit(1);
  }

  const data = snap.data();
  const details = data.details || [];
  const restore = {};

  // ── 1. STHAN DESCRIPTION (sthana_info_text) ────────────────────────────
  // Field held "Town Description" / city overview. It's <p><br></p> now.
  // Restore from architectureDescription which has the full content in all 3 langs.
  if (isEffectivelyEmpty(data.sthana_info_text)) {
    if (!isEffectivelyEmpty(data.architectureDescription)) {
      restore.sthana_info_text = ensureML(data.architectureDescription);
      console.log('✅ Restoring sthana_info_text from architectureDescription');
    } else {
      console.log('⚠️  sthana_info_text: no source found in architectureDescription');
    }
  } else {
    console.log('ℹ️  sthana_info_text already has content, skipping');
  }

  // ── 2. DETAILED DIRECTIONS (directions_text) ───────────────────────────
  // Build directions from address + general location info since it's completely empty
  if (isEffectivelyEmpty(data.directions_text)) {
    // Compose directions from address since no wayToReach exists
    const addr = ensureML(data.address);
    if (!isEffectivelyEmpty(addr)) {
      restore.directions_text = {
        en: addr.en ? `<p><strong>Address:</strong> ${addr.en}</p><p>The temple site is accessible by rail (Bharuch Railway Station), road (NH-48/NH-64), and water (Narmada riverbank). Located in the old town area of Bharuch, Gujarat.</p>` : '',
        hi: addr.hi ? `<p><strong>पता:</strong> ${addr.hi}</p>` : '',
        mr: addr.mr ? `<p><strong>पत्ता:</strong> ${addr.mr}</p><p>भरूच रेल्वे स्टेशन, राष्ट्रीय महामार्ग NH-48/NH-64 मार्गे व नर्मदा नदी किनाऱ्यावरून हे स्थान सहज उपलब्ध आहे. भरूचच्या जुन्या शहराच्या भागात स्थित आहे, गुजरात.</p>` : '',
      };
      console.log('✅ Restoring directions_text from address');
    }
    console.log('⚠️  No original directions data found. Using address-based directions.');
  } else {
    console.log('ℹ️  directions_text already has content, skipping');
  }

  // ── 3. STHAN POTHI (global sthanPothiDescription) ──────────────────────
  // Global pothi was wiped. Restore by combining all details' sthanPothiDescriptions
  if (isEffectivelyEmpty(data.sthanPothiDescription)) {
    const pothiParts = { en: [], hi: [], mr: [] };
    
    details.forEach((d, i) => {
      const raw = d.sthanPothiDescription;
      if (!raw) return;
      
      // Handle both plain string AND multilingual object
      const ml = (typeof raw === 'string')
        ? { en: '', hi: '', mr: raw }   // Legacy: stored as plain Marathi string
        : ensureML(raw);
      
      if (isEffectivelyEmpty(ml)) return;
      
      const titleText = typeof d.title === 'string' ? d.title : (d.title?.mr || d.title?.en || `Section ${i+1}`);
      const header = `<p><strong>— ${titleText} —</strong></p>`;
      
      if (ml.mr) pothiParts.mr.push(header + ml.mr);
      if (ml.en) pothiParts.en.push(header + ml.en);
      if (ml.hi) pothiParts.hi.push(header + ml.hi);
    });

    if (pothiParts.mr.length > 0 || pothiParts.en.length > 0) {
      restore.sthanPothiDescription = {
        en: pothiParts.en.join('\n'),
        hi: pothiParts.hi.join('\n'),
        mr: pothiParts.mr.join('\n'),
      };
      console.log(`✅ Restoring sthanPothiDescription from ${pothiParts.mr.length} detail section(s)`);
    } else {
      console.log('⚠️  No sthanPothiDescription found in details');
    }
  } else {
    console.log('ℹ️  sthanPothiDescription already has content, skipping');
  }

  // ── 4. DIVINE LEELAS (global leelas) ────────────────────────────────────
  // Global leelas is empty []. Restore by aggregating all leelas from all details.
  if (!data.leelas || data.leelas.length === 0) {
    const collectedLeelas = [];
    const seenIds = new Set();

    details.forEach(d => {
      if (Array.isArray(d.leelas)) {
        d.leelas.forEach(l => {
          if (l.id && !seenIds.has(l.id)) {
            seenIds.add(l.id);
            collectedLeelas.push(l);
          }
        });
      }
    });

    if (collectedLeelas.length > 0) {
      restore.leelas = collectedLeelas;
      console.log(`✅ Restoring ${collectedLeelas.length} leelas from details`);
    } else {
      console.log('⚠️  No leelas found in details to restore');
    }
  } else {
    console.log(`ℹ️  leelas already has ${data.leelas.length} items, skipping`);
  }

  // ── 5. ADDITIONAL INFO (descriptionSections) ────────────────────────────
  // The descriptionSections content is empty <p><br></p>.
  // No source data available to restore this. User will need to re-enter.
  const sections = data.descriptionSections || [];
  const hasContent = sections.some(s => !isEffectivelyEmpty(s.content));
  if (!hasContent) {
    console.log('⚠️  descriptionSections content is empty - no source data to auto-restore. User must re-enter manually.');
  } else {
    console.log('ℹ️  descriptionSections has content, skipping');
  }

  // ── Summary & Execute ───────────────────────────────────────────────────
  const keys = Object.keys(restore);
  if (keys.length === 0) {
    console.log('\n✅ All fields are already intact or could not be auto-restored.');
    process.exit(0);
  }

  console.log(`\n📝 Restoring ${keys.length} field(s): ${keys.join(', ')}`);
  console.log('\n⏳ Proceeding in 5 seconds... Press Ctrl+C to abort.\n');

  await new Promise(r => setTimeout(r, 5000));

  await db.collection('temples').doc(BHARUCH_ID).set(restore, { merge: true });
  console.log('✅ Restoration complete!');
  keys.forEach(k => console.log(`   ✓ ${k}`));
  process.exit(0);
}

restoreFields().catch(e => { console.error('Script failed:', e); process.exit(1); });
