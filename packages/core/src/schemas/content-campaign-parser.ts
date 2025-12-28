import { type } from "arktype";

export const contentCampaignStatusSchema = type(
  "'draft'|'review-requested'|'review-approved'|'review-denied'|'review-change-requested'",
);

export const CAMPAIGN_DEFAULT_TITLE = "Untitled Campaign";
export const CAMPAIGN_DEFAULT_STATUS = "draft";
