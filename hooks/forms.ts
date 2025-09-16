import queryString from "query-string";

export function serializeToQueryString<T extends object>(payload: T): string {
  const query = queryString.stringify(payload, {
    skipEmptyString: true,
  });
  return query;
}

export function deserializeFromQueryString<T extends object>(
  payload: string
): T {
  return queryString.parse(payload) as T;
}
