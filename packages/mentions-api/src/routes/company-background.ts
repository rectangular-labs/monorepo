"use server";
import { ORPCError } from "@orpc/client";
import { schema } from "@rectangular-labs/db";
import { type } from "arktype";
import { protectedBase } from "../context";

const crawlInfo = protectedBase
  .route({ method: "POST", path: "/company-background" })
  .input(schema.companyInsertSchema.pick("websiteUrl"))
  .output(
    type({
      id: "string.uuid",
    }),
  )
  .handler(async ({ context, input }) => {
    const [bgData] = await context.db
      .insert(schema.smCompanyBackground)
      .values(input)
      .returning();
    if (!bgData) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Error creating company background data",
      });
    }
    // TODO: Enqueue on a queue somewhere + process the job.
    // For processing, use the gpt scrapper from builder io to create the core.
    return { id: bgData.id };
  });

const getCrawlStatus = protectedBase
  .route({
    method: "GET",
    path: "/company-background/{id}",
  })
  .input(type({ id: "string" }))
  .output(schema.companySelectSchema.or(type("undefined")))
  .handler(async ({ context, input }) => {
    const crawlData = await context.db.query.smCompanyBackground.findFirst({
      where: (table, { eq }) => eq(table.id, input.id),
    });
    return crawlData;
  });

export default protectedBase.router({ crawlInfo, getCrawlStatus });
