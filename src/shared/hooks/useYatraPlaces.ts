import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/auth/firebase";
import { YatraPlace } from "@/types";

export const useYatraPlaces = () => {
    return useQuery<YatraPlace[]>({
        queryKey: ["yatraPlaces"],
        queryFn: async () => {
            const q = query(collection(db, "yatraPlaces"), orderBy("sequence", "asc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            } as YatraPlace));
        },
        staleTime: 1000 * 60 * 10, // 10 minutes cache
    });
};
