/**
 * Drop keys whose value is `undefined`. Search params are optional keys, and
 * with `exactOptionalPropertyTypes` "absent" and "undefined" are different
 * things, so clearing a filter means removing its key.
 */
export const compact = <T extends Record<string, unknown>>(
  record: T,
): { [K in keyof T]?: Exclude<T[K], undefined> } =>
  Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)) as {
    [K in keyof T]?: Exclude<T[K], undefined>;
  };
