import { type } from "arktype";

export const contentCampaignStatusSchema = type(
  "'draft'|'review'|'accepted'|'denied'",
);

export const CAMPAIGN_DEFAULT_TITLE = "Untitled Campaign";
export const CAMPAIGN_DEFAULT_STATUS = "draft";
