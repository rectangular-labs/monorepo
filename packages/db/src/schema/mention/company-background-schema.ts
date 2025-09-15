import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { jsonb, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgMentionTable } from "../_table";

export const smCompanyBackground = pgMentionTable(
  "company_background",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    websiteUrl: text().notNull(),
    status: text({
      enum: ["queued", "running", "completed", "failed"],
    })
      .notNull()
      .default("queued"),
    lastIndexedAt: timestamp({ mode: "date", withTimezone: true }),
    data: jsonb().$type<{
      description?: string;
      idealCustomer?: string;
      responseTone?: string;
    }>(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("sm_company_background_website_url_unique").on(
      table.websiteUrl,
    ),
  ],
);
export const smCompanyBackgroundRelations = relations(
  smCompanyBackground,
  () => ({}),
);
export const companyInsertSchema = createInsertSchema(smCompanyBackground).omit(
  "createdAt",
  "updatedAt",
  "id",
);
export const companyUpdateSchema = createUpdateSchema(
  smCompanyBackground,
  {},
).omit("createdAt", "updatedAt", "id");
export const companySelectSchema = createSelectSchema(smCompanyBackground);
