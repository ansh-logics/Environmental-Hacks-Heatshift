/** Success envelope used by list/detail endpoints. */
export type ApiSuccess<T> = {
  data: T;
};

/** Maps a thrown Zod issue path onto a readable field name for the UI. */
export function fieldLabel(path: string): string {
  return path.replace(/_/g, ' ') || 'request';
}
