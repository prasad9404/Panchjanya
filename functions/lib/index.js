"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignAdminRole = exports.processUploadedMedia = void 0;
/**
 * Cloud Function: processUploadedMedia
 *
 * Trigger: Firebase Storage onObjectFinalized
 * Purpose: Generate thumbnail (200px) and medium (800px) WebP variants
 *          using Sharp, then store variant download URLs back in Firestore.
 *
 * Security:
 * - Runs with Admin SDK (bypasses Security Rules intentionally — this is a trusted server process)
 * - Will not reprocess files that already have variants (idempotent)
 * - Skips files not in monitored paths (posts/, temples/, users/profile/)
 * - Skips already-generated variant files (prevents infinite loop)
 *
 * Cost:
 * - Only triggers on new object finalization — not on metadata updates
 * - Skips non-image / already-processed paths immediately to minimize compute time
 */
const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
const path = require("path");
const os = require("os");
const fs = require("fs/promises");
const sharp = require("sharp");
const https_1 = require("firebase-functions/v2/https");
admin.initializeApp();
const db = admin.firestore();
const bucket = admin.storage().bucket();
// Variant sizes to generate
const VARIANTS = [
    { name: 'thumb', width: 200 },
    { name: 'medium', width: 800 },
];
// Only process files under these paths
const MONITORED_PREFIXES = ['posts/', 'temples/', 'users/'];
// Skip files that are themselves generated variants (prevents infinite loops)
const VARIANT_SUFFIXES = ['_thumb.webp', '_medium.webp'];
exports.processUploadedMedia = functions.storage.onObjectFinalized({
    bucket: 'panchjanya-4a344.firebasestorage.app',
    region: 'asia-south1', // Change to your region
    memory: '512MiB',
    timeoutSeconds: 120,
}, async (event) => {
    var _a, _b;
    const object = event.data;
    const filePath = object.name;
    const contentType = object.contentType;
    if (!filePath || !contentType)
        return;
    // 1. Skip non-images
    if (!contentType.startsWith('image/')) {
        console.log(`Skipping non-image: ${filePath}`);
        return;
    }
    // 2. Skip paths we don't manage
    const isMonitored = MONITORED_PREFIXES.some((p) => filePath.startsWith(p));
    if (!isMonitored) {
        console.log(`Skipping unmonitored path: ${filePath}`);
        return;
    }
    // 3. Skip variant files (avoid infinite trigger loop)
    const isVariant = VARIANT_SUFFIXES.some((s) => filePath.endsWith(s));
    if (isVariant) {
        console.log(`Skipping variant file: ${filePath}`);
        return;
    }
    // 4. Find the Firestore media document matching this storagePath
    const mediaSnap = await db
        .collection('media')
        .where('storagePath', '==', filePath)
        .limit(1)
        .get();
    if (mediaSnap.empty) {
        console.warn(`No media document found for storagePath: ${filePath}`);
        return;
    }
    const mediaDoc = mediaSnap.docs[0];
    // 5. Check idempotency — skip if variants already exist
    const existing = (_b = (_a = mediaDoc.data()) === null || _a === void 0 ? void 0 : _a.variants) !== null && _b !== void 0 ? _b : {};
    if (existing.thumb && existing.medium) {
        console.log(`Variants already exist for: ${filePath}. Skipping.`);
        return;
    }
    // 6. Download the original file to /tmp
    const fileName = path.basename(filePath);
    const tmpOriginal = path.join(os.tmpdir(), `original-${fileName}`);
    try {
        await bucket.file(filePath).download({ destination: tmpOriginal });
        const variantUrls = {};
        // 7. Generate each variant with Sharp
        for (const variant of VARIANTS) {
            const variantFileName = fileName.replace(/(\.[^.]+)?$/, `_${variant.name}.webp`);
            const variantPath = path.join(path.dirname(filePath), variantFileName);
            const tmpVariant = path.join(os.tmpdir(), variantFileName);
            await sharp(tmpOriginal)
                .resize(variant.width, null, { withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(tmpVariant);
            // Upload variant back to same folder
            await bucket.upload(tmpVariant, {
                destination: variantPath,
                metadata: {
                    contentType: 'image/webp',
                    cacheControl: 'public, max-age=31536000, immutable',
                },
            });
            // We don't need getSignedUrl anymore because we make the file public
            await bucket.file(variantPath).makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${variantPath}`;
            variantUrls[variant.name] = publicUrl;
            // Clean up tmp variant
            await fs.unlink(tmpVariant).catch(() => null);
        }
        // 8. Update Firestore media document with variant URLs and 'ready' status
        await mediaDoc.ref.update({
            variants: variantUrls,
            status: 'ready',
        });
        console.log(`✅ Processed variants for ${filePath}:`, variantUrls);
    }
    catch (err) {
        console.error(`❌ Failed to process ${filePath}:`, err);
        // Mark as failed so the frontend can surface an error state
        await mediaDoc.ref.update({ status: 'failed' }).catch(() => null);
    }
    finally {
        // Always clean up the original tmp file
        await fs.unlink(tmpOriginal).catch(() => null);
    }
});
// Admin Role Assignment
exports.assignAdminRole = (0, https_1.onCall)({ region: 'asia-south1' }, async (request) => {
    // Only allow admins or super admins to call this
    if (!request.auth || (!request.auth.token.admin && !request.auth.token.superAdmin)) {
        throw new https_1.HttpsError('permission-denied', 'Only admins can assign roles.');
    }
    const { targetUid, newRole } = request.data;
    if (!targetUid || !newRole) {
        throw new https_1.HttpsError('invalid-argument', 'Missing targetUid or newRole');
    }
    try {
        // Set custom claim
        const isAdmin = newRole === 'Admin' || newRole === 'Super Admin';
        const isSuperAdmin = newRole === 'Super Admin';
        await admin.auth().setCustomUserClaims(targetUid, {
            admin: isAdmin,
            superAdmin: isSuperAdmin,
            role: newRole.toLowerCase() // Add role string just in case
        });
        // Update firestore document
        await db.collection('users').doc(targetUid).update({
            role: newRole
        });
        // Log the assignment
        await db.collection('adminAuditLog').add({
            action: 'assign_role',
            targetUid,
            newRole,
            assignedBy: request.auth.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    }
    catch (error) {
        console.error("Error assigning role:", error);
        throw new https_1.HttpsError('internal', 'Error assigning role.');
    }
});
//# sourceMappingURL=index.js.map