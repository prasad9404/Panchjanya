import { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import { adminDb } from '../_lib/firebaseAdmin.js';
import { verifyAdmin } from '../_lib/authMiddleware.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'GET') {
        const decodedToken = await verifyAdmin(req, res);
        if (!decodedToken) return; // Response handled by verifyAdmin

        try {
            // 1. Get User Count (Already implemented, but keeping it here for flow)
            const userSnapshot = await adminDb.collection("users").count().get();
            const userCount = userSnapshot.data().count;

            // 2. Get Recent Activity from Temples
            const templeSnapshot = await adminDb.collection("temples")
                .orderBy("createdAt", "desc")
                .limit(5)
                .get();

            const recentActivity = templeSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    type: "New Sthana",
                    message: `Added '${data.name}' to ${data.district || "Directory"}`,
                    time: data.createdAt ? new Date(data.createdAt._seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
                    color: "bg-emerald-500"
                };
            });

            // 3. Get Media Metrics
            const mediaAggregation = await adminDb.collection("media").aggregate({
                totalBytes: admin.firestore.AggregateField.sum("sizeBytes"),
                totalCount: admin.firestore.AggregateField.count()
            }).get();
            
            const storageBytes = mediaAggregation.data().totalBytes || 0;
            const mediaCount = mediaAggregation.data().totalCount || 0;
            const storageLimit = 10 * 1024 * 1024 * 1024 * 1024; // 10 TB limit placeholder

            // 4. Get Temple Metrics (Total vs Pending)
            const totalTemplesSnapshot = await adminDb.collection("temples").count().get();
            const totalTemples = totalTemplesSnapshot.data().count;

            const pendingTemplesSnapshot = await adminDb.collection("temples")
                .where("status", "!=", "Verified")
                .count().get();
            const pendingCount = pendingTemplesSnapshot.data().count;

            return res.status(200).json({
                userCount,
                recentActivity,
                storageBytes,
                storageLimit,
                mediaCount,
                totalTemples,
                pendingCount
            });
        } catch (error: any) {
            return res.status(500).json({ error: error.message || "Internal Server Error" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
