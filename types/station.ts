// Station types
export interface Station {
  id: string;
  name: string;
  modes: string[];
  lines?: string[];
  lat?: number;
  lon?: number;
}

export interface FavoriteStation extends Station {
  isFavorite: true;
  isMain: boolean;
  addedAt: Date;
}
