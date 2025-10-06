import { type } from "arktype";

export const seoGscPermissionLevelSchema = type(
  "'write'|'read-only'|'needs-verification'",
);
export const seoGscPropertyTypeSchema = type("'URL_PREFIX'|'DOMAIN'");
