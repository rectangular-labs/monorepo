import { createSelectSchema } from "drizzle-arktype";
import { index, text, unique, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";

export const seoWaitlistSignup = pgSeoTable(
  "waitlist_signup",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    email: text().notNull(),
    source: text().notNull().default("seo-www"),
    ...timestamps,
  },
  (table) => [
    unique("seo_waitlist_signup_email_idx").on(table.email),
    index("seo_waitlist_signup_created_at_idx").on(table.createdAt),
  ],
);

export const seoWaitlistSignupSelectSchema =
  createSelectSchema(seoWaitlistSignup);
