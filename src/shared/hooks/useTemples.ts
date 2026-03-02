import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/auth/firebase";
import { Temple } from "@/types";

export const useTemples = () => {
    return useQuery<Temple[]>({
        queryKey: ["temples"],
        queryFn: async () => {
            const querySnapshot = await getDocs(collection(db, "temples"));
            return querySnapshot.docs.map((doc) => {
                const data = doc.data();

                // Robust coordinate extraction
                const rawLat = [data.latitude, data.lat, data.location?.latitude, data.location?.lat].find(v => v !== undefined && v !== null && v !== "");
                const rawLng = [data.longitude, data.lng, data.location?.longitude, data.location?.lng].find(v => v !== undefined && v !== null && v !== "");

                const lat = rawLat !== undefined ? Number(rawLat) : undefined;
                const lng = rawLng !== undefined ? Number(rawLng) : undefined;

                return {
                    images: [],
                    sections: [],
                    ...data,
                    id: doc.id,
                    latitude: lat,
                    longitude: lng,
                } as unknown as Temple;
            });
        },
        staleTime: 1000 * 60 * 10, // 10 minutes cache
        gcTime: 1000 * 60 * 30,    // Keep in garbage collection for 30 minutes
    });
};
