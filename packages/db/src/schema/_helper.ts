import { timestamp } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

export const timestamps = {
  createdAt: timestamp({ mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp({ mode: "date", withTimezone: true })
    .notNull()
    .$onUpdateFn(() => new Date()),
};

export const uuidv7 = v7;
