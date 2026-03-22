const admin = require('firebase-admin');

// 1. Download your service account key from Firebase Console: 
//    Project Settings -> Service accounts -> Generate new private key
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 2. Add the email of the user you want to make an admin
const email = 'mmanoorkar9@gmail.com'; 

async function setAdminClaim(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`✅ Success! Custom claim "admin: true" set for user: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting custom claim:', error);
    process.exit(1);
  }
}

setAdminClaim(email);
