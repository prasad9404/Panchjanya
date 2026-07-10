/**
 * Production-grade Firebase Storage upload utility.
 *
 * Pipeline:
 *   1. Rate-limit check (client-side defence-in-depth)
 *   2. File validation (size + type)
 *   3. Image compression + WebP conversion
 *   4. Collision-proof path generation
 *   5. Resumable upload with CDN cache headers
 *   6. Firestore media record creation (status: 'processing')
 *   7. Cloud Function picks up onObjectFinalized → generates variants → sets status: 'ready'
 */
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    UploadTaskSnapshot,
} from 'firebase/storage';
import {
    collection,
    addDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { storage, db, auth } from '@/auth/firebase';
import { compressImage } from './compress';
import { buildStoragePath } from './naming';
import { assertUploadRateLimit } from './rateLimit';
import type { MediaDocument } from './types';

// ─── Validation constants ─────────────────────────────────────────────────────

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;   // 5 MB
const MAX_DOC_BYTES = 20 * 1024 * 1024;  // 20 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
const ALLOWED_DOC_TYPES = ['application/pdf'];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadOptions {
    /** The file chosen by the user */
    file: File;
    /**
     * Bucket-relative folder path.
     * Must match a Security Rules path — e.g. 'users/{uid}/profile', 'posts/{postId}/images'.
     */
    folder: string;
    /** Mirrors MediaDocument.type for Firestore metadata */
    type: MediaDocument['type'];
    /** Progress callback — receives 0–100 */
    onProgress?: (percent: number) => void;
}

export interface UploadResult {
    /** Firestore /media document ID */
    mediaId: string;
    /** HTTPS CDN download URL — store this, never regenerate at render time */
    downloadUrl: string;
    /** Bucket-relative path — keep for future migration or manual re-generation */
    storagePath: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateFile(file: File): void {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isPdf) {
        throw new Error(`Unsupported file type: ${file.type}. Only images and PDFs are accepted.`);
    }
    if (isImage && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new Error(`Unsupported image format: ${file.type}.`);
    }
    if (isImage && file.size > MAX_IMAGE_BYTES) {
        throw new Error(`Image exceeds 5 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`);
    }
    if (isPdf && file.size > MAX_DOC_BYTES) {
        throw new Error(`PDF exceeds 20 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`);
    }
}

// ─── Core upload function ─────────────────────────────────────────────────────

export async function uploadFile(opts: UploadOptions): Promise<UploadResult> {
    const user = auth.currentUser;
    if (!user) throw new Error('Authentication required. Please sign in to upload files.');

    const { file, folder, type, onProgress } = opts;

    // 1. Rate limit (soft guard — Security Rules are the hard enforcement)
    await assertUploadRateLimit(user.uid);

    // 2. Validate file type and size BEFORE touching the network
    validateFile(file);

    // 3. Compress images + convert to WebP
    const processedFile = file.type.startsWith('image/')
        ? await compressImage(file)
        : file;

    // 4. Build collision-proof path
    const storagePath = buildStoragePath(folder, processedFile);
    const storageRef = ref(storage, storagePath);

    // 5. Upload with CDN cache headers + ownership metadata
    const uploadTask = uploadBytesResumable(storageRef, processedFile, {
        contentType: processedFile.type,
        cacheControl: 'public, max-age=31536000, immutable',
        customMetadata: {
            // Stored in Storage object metadata only — NOT used for auth in Security Rules
            uploadedBy: user.uid,
            originalName: file.name,
        },
    });

    // Track progress and await completion
    await new Promise<void>((resolve, reject) => {
        uploadTask.on(
            'state_changed',
            (snap: UploadTaskSnapshot) => {
                onProgress?.((snap.bytesTransferred / snap.totalBytes) * 100);
            },
            (err) => reject(err),
            () => resolve(),
        );
    });

    // 6. Get immutable CDN download URL (do this once, store in Firestore)
    const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

    // 7. Write Firestore media record — status 'processing' until Cloud Function updates it
    const mediaRef = await addDoc(collection(db, 'media'), {
        storagePath,
        downloadUrl,
        variants: {},
        uploadedBy: user.uid,   // must match firestore.rules: request.resource.data.uploadedBy == request.auth.uid
        type,
        contentType: processedFile.type,
        sizeBytes: processedFile.size,
        createdAt: serverTimestamp(),
        status: 'processing',
    } as Omit<MediaDocument, 'id'>);

    return {
        mediaId: mediaRef.id,
        downloadUrl,
        storagePath,
    };
}
