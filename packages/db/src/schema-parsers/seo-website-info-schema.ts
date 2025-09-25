import { type } from "arktype";

export const seoWebsiteInfoSchema = type({
  version: "'v1'",
  businessOverview: type("string")
    .atLeastLength(1)
    .configure({
      message: () => "Business Overview is required",
    }),
  idealCustomer: type("string")
    .atLeastLength(1)
    .configure({
      message: () => "Ideal Customer is required",
    }),
  serviceRegion: type("string")
    .atLeastLength(1)
    .configure({
      message: () => "Service Region is required",
    }),
  industry: type("string")
    .atLeastLength(1)
    .configure({
      message: () => "Industry is required",
    }),
});
