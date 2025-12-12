import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { jsonb, text, unique, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { seoProject } from "./project-schema";

export const seoProjectAuthor = pgSeoTable(
  "project_author",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    projectId: uuid()
      .notNull()
      .references(() => seoProject.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    name: text().notNull(),
    title: text(),
    bio: text(),
    avatarUri: text(),
    socialLinks:
      jsonb().$type<
        {
          platform:
            | "x"
            | "linkedin"
            | "facebook"
            | "instagram"
            | "youtube"
            | "tiktok"
            | (string & {});
          url: string;
        }[]
      >(),
    ...timestamps,
  },
  (table) => [
    unique("seo_project_author_project_id_name_unique").on(
      table.projectId,
      table.name,
    ),
  ],
);

export const seoProjectAuthorRelations = relations(
  seoProjectAuthor,
  ({ one }) => ({
    project: one(seoProject, {
      fields: [seoProjectAuthor.projectId],
      references: [seoProject.id],
    }),
  }),
);

export const seoProjectAuthorInsertSchema = createInsertSchema(
  seoProjectAuthor,
).omit("id", "createdAt", "updatedAt", "projectId");
export const seoProjectAuthorSelectSchema =
  createSelectSchema(seoProjectAuthor);
export const seoProjectAuthorUpdateSchema = createUpdateSchema(seoProjectAuthor)
  .omit("createdAt", "updatedAt")
  .merge(type({ id: "string.uuid" }));
