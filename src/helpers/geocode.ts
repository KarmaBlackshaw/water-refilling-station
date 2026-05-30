import { useMemoize } from '@vueuse/core';
import mbxClient from '@mapbox/mapbox-sdk';
import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';

type GeocodeQueryType = 'country' | 'region' | 'postcode' | 'district' | 'place' | 'locality' | 'neighborhood' | 'address' | 'poi' | 'poi.landmark';

export type GeoFeature = {
  id: string;
  name: string;
  place_name: string;
  lat: number;
  lng: number;
  bbox?: [number, number, number, number];
};

type SearchArgs = {
  query: string;
  types: GeocodeQueryType[];
  bbox?: [number, number, number, number];
};

const baseClient = mbxClient({ accessToken: import.meta.env.VITE_MAPBOX_TOKEN });
const geocoder = mbxGeocoding(baseClient);

function toBbox(raw: number[] | undefined): GeoFeature['bbox'] {
  if (raw && raw.length >= 4 && raw[0] !== undefined && raw[1] !== undefined && raw[2] !== undefined && raw[3] !== undefined) {
    return [raw[0], raw[1], raw[2], raw[3]];
  }

  return undefined;
}

function toGeoFeature(f: { id: string; text: string; place_name: string; center: number[]; bbox?: number[] }): GeoFeature | null {
  const lng = f.center[0];
  const lat = f.center[1];

  if (lng === undefined || lat === undefined) {
    return null;
  }

  return { id: f.id, name: f.text, place_name: f.place_name, lng, lat, bbox: toBbox(f.bbox) };
}

const baseSearch = useMemoize(
  async ({ query, types, bbox }: SearchArgs): Promise<GeoFeature[]> => {
    const res = await geocoder.forwardGeocode({ query, countries: ['ph'], types, bbox, limit: 8 }).send();

    return res.body.features.flatMap((f) => {
      const feature = toGeoFeature(f);

      return feature ? [feature] : [];
    });
  },
  { getKey: ({ query, types, bbox }) => `${types.join(',')}|${bbox?.join(',') ?? ''}|${query}` },
);

export function searchCities(q: string): Promise<GeoFeature[]> {
  if (!q.trim()) {
    return Promise.resolve([]);
  }

  return baseSearch({ query: q, types: ['place', 'locality'] });
}

export function searchBarangays(q: string, cityBbox?: GeoFeature['bbox']): Promise<GeoFeature[]> {
  if (!q.trim()) {
    return Promise.resolve([]);
  }

  return baseSearch({ query: q, types: ['neighborhood', 'locality'], bbox: cityBbox });
}

export function searchStreets(q: string, brgyBbox?: GeoFeature['bbox']): Promise<GeoFeature[]> {
  if (!q.trim()) {
    return Promise.resolve([]);
  }

  return baseSearch({ query: q, types: ['address'], bbox: brgyBbox });
}

export async function geocodeBarangay(barangay: string, city: string): Promise<{ lat: number; lng: number } | null> {
  const query = `${barangay}, ${city}, Philippines`;
  const results = await baseSearch({ query, types: ['neighborhood', 'locality', 'place'] });
  const first = results[0];

  return first ? { lat: first.lat, lng: first.lng } : null;
}
