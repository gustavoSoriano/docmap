export type FavoriteType = 'site' | 'slack' | 'grid' | 'dash' | 'github';

export type Favorite = {
  readonly id: string;
  readonly type: FavoriteType;
  readonly title: string;
  readonly url: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly note: string;
  readonly accessCount: number;
  readonly lastAccessed?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CreateFavoriteInput = {
  readonly type: FavoriteType;
  readonly title: string;
  readonly url: string;
  readonly category: string;
  readonly tags?: readonly string[];
  readonly note?: string;
};

export type UpdateFavoriteInput = {
  readonly type?: FavoriteType;
  readonly title?: string;
  readonly url?: string;
  readonly category?: string;
  readonly tags?: readonly string[];
  readonly note?: string;
};
