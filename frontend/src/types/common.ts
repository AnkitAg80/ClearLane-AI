export type Option<T> = T | null | undefined;

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface FilterState {
  station: string | null;
  minSupport: number;
  query: string;
  selectedH3: string | null;
}

export interface MapFilter {
  station?: string;
  min_support?: number;
  query?: string;
  h3?: string;
  limit?: number;
}

export type HotspotFilter = MapFilter;
export type IntelFilter = MapFilter;
