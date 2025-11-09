import { dataforseoLabsStatus } from "../sdk.gen";

/**
 * Update schedule https://dataforseo.com/help-center/dataforseo-labs-api-update-time
 * @returns The next earliest update date for the DataForSEO Labs API
 */
export async function getNextEarliestUpdate() {
  const status = await dataforseoLabsStatus();
  const THIRTY_DAYS_IN_MILLISECONDS = 30 * 24 * 60 * 60 * 1000;

  const result = status.data?.tasks?.[0]?.result?.[0]?.google?.date_update;
  const updatedDate = new Date(result ?? Date.now());
  const nextUpdate = updatedDate.getTime() + THIRTY_DAYS_IN_MILLISECONDS;

  if (nextUpdate < Date.now()) {
    // if the next update is in the past, return 30 days from now
    return new Date(Date.now() + THIRTY_DAYS_IN_MILLISECONDS);
  }

  return new Date(nextUpdate);
}
