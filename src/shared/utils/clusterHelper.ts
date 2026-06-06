import Supercluster from 'supercluster';
import { YatraLocation } from '@/shared/components/features/YatraMap';

export interface ClusterProperties {
  cluster: boolean;
  cluster_id: number;
  point_count: number;
  point_count_abbreviated: string;
}

export type YatraFeature = GeoJSON.Feature<GeoJSON.Point, YatraLocation | ClusterProperties>;

export const createSupercluster = () => {
  return new Supercluster({
    radius: 40,
    maxZoom: 16,
  });
};

export const locationsToGeoJSON = (locations: YatraLocation[]): GeoJSON.Feature<GeoJSON.Point, YatraLocation>[] => {
  return locations.map(loc => ({
    type: 'Feature',
    properties: loc,
    geometry: {
      type: 'Point',
      coordinates: [loc.longitude, loc.latitude]
    }
  }));
};
