import { Schema } from "zod";

/**
 * A type representing a fetcher function that can be
 * passed to createZodFetcher.
 */
export type AnyFetcher = (...args: any[]) => any;

/**
 * A type utility which represents the function returned
 * from createZodFetcher
 */
export type ZodFetcher<TFetcher extends AnyFetcher> = <TData>(
  data: Schema<TData>,
  ...args: Parameters<TFetcher>
) => Promise<TData>;

/**
 * The default fetcher used by createZodFetcher when no
 * fetcher is provided.
 */
export const defaultFetcher = async (...args: Parameters<typeof fetch>) => {
  const response = await fetch(...args);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
};

export function createZodFetcher(): ZodFetcher<typeof fetch>;
export function createZodFetcher<TFetcher extends AnyFetcher>(
  fetcher: TFetcher,
): ZodFetcher<TFetcher>;
export function createZodFetcher(
  fetcher: AnyFetcher = defaultFetcher,
): ZodFetcher<any> {
  return async (schema, ...args) => {
    const response = await fetcher(...args);
    return schema.parse(response);
  };
}
