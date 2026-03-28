/**
 * Simple delay utility to wait for a specified number of milliseconds.
 * Useful for rate-limiting and retries.
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
