export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS';

export const HTTP_METHODS: readonly HttpMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
];

export type MockCollection = {
  readonly id: string;
  readonly name: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type Mock = {
  readonly id: string;
  readonly collectionId: string;
  readonly method: HttpMethod;
  readonly path: string;
  readonly name: string;
  readonly group: string; // visual grouper within a collection (empty = ungrouped)
  readonly script: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type MockContext = {
  readonly method: string;
  readonly path: string;
  readonly params: Record<string, string>;
  readonly query: Record<string, string>;
  readonly headers: Record<string, string>;
  readonly body: unknown;
};

export type MockResult = {
  readonly status?: number;
  readonly headers?: Record<string, string>;
  readonly body?: unknown;
};

export type CreateCollectionInput = {
  readonly name: string;
  readonly tags?: readonly string[];
};

export type CreateMockInput = {
  readonly collectionId: string;
  readonly method: HttpMethod;
  readonly path: string;
  readonly name?: string;
  readonly group?: string;
  readonly script: string;
  readonly tags?: readonly string[];
};

export type UpdateMockInput = {
  readonly collectionId?: string;
  readonly method?: HttpMethod;
  readonly path?: string;
  readonly name?: string;
  readonly group?: string;
  readonly script?: string;
  readonly tags?: readonly string[];
};
