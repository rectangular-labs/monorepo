import { createRequire } from "node:module";
import type { AnySchema } from "@orama/orama";
import { create, insertMultiple } from "@orama/orama";
import { Dataset, type PlaywrightCrawler } from "crawlee";
import { createStorage } from "unstorage";

type OramaPrimitive = "string" | "number" | "boolean";
type OramaArray = "string[]" | "number[]" | "boolean[]";
type OramaVector = `vector[${number}]`;

type ArkTypeLike = {
  toJsonSchema: (options?: unknown) => unknown;
};

interface JsonSchemaObject {
  type?: string | string[];
  properties?: Record<string, JsonSchemaObject>;
  items?: JsonSchemaObject;
  enum?: unknown[];
}

interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  bucket: string;
  region: string;
}

interface ComputeSearchIndexOptions {
  vectorProperties?: Record<string, number>;
  keyPrefix?: string;
  s3?: Partial<S3Config>;
}

function resolveS3Config(input?: Partial<S3Config>): S3Config {
  const resolved: S3Config = {
    accessKeyId: input?.accessKeyId ?? process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey:
      input?.secretAccessKey ?? process.env.R2_SECRET_ACCESS_KEY ?? "",
    endpoint: input?.endpoint ?? process.env.R2_ENDPOINT ?? "",
    bucket: input?.bucket ?? process.env.R2_BUCKET ?? "",
    region: input?.region ?? process.env.R2_REGION ?? "auto",
  };
  return resolved;
}

function isArkTypeLike(value: unknown): value is ArkTypeLike {
  return (
    typeof value === "function" ||
    (typeof value === "object" && value !== null && "toJsonSchema" in value)
  );
}

function toJsonSchema(input: ArkTypeLike | JsonSchemaObject): JsonSchemaObject {
  if (isArkTypeLike(input)) {
    const out = input.toJsonSchema?.();
    return (out as JsonSchemaObject) ?? { type: "object", properties: {} };
  }
  return input;
}

function mapJsonSchemaToOramaSchema(
  schema: JsonSchemaObject,
  vectorProps?: Record<string, number>,
): AnySchema {
  if (!schema || schema.type !== "object" || !schema.properties) {
    return {};
  }

  const result: AnySchema = {} as AnySchema;
  for (const [key, propSchema] of Object.entries(schema.properties)) {
    if (
      vectorProps &&
      Number.isFinite((vectorProps as Record<string, number>)[key])
    ) {
      const candidate = (vectorProps as Record<string, number>)[key];
      const size =
        typeof candidate === "number" && Number.isFinite(candidate)
          ? candidate
          : 0;
      result[key] = `vector[${size}]` as unknown as AnySchema;
      continue;
    }

    const mapped = mapJsonSchemaProperty(propSchema, vectorProps);
    if (mapped) {
      result[key] = mapped as AnySchema;
    }
  }
  return result;
}

function mapJsonSchemaProperty(
  prop: JsonSchemaObject,
  vectorProps?: Record<string, number>,
): OramaPrimitive | OramaArray | OramaVector | AnySchema | undefined {
  const t = Array.isArray(prop.type) ? prop.type[0] : prop.type;
  if (t === "string") return "string";
  if (t === "number" || t === "integer") return "number";
  if (t === "boolean") return "boolean";
  if (t === "array") {
    const itemType = prop.items?.type;
    const it = Array.isArray(itemType) ? itemType?.[0] : itemType;
    if (it === "string") return "string[]";
    if (it === "number" || it === "integer") return "number[]";
    if (it === "boolean") return "boolean[]";
    // Fallback for unsupported arrays
    return "string[]";
  }
  if (t === "object" && prop.properties) {
    return mapJsonSchemaToOramaSchema(prop, vectorProps) as AnySchema;
  }
  // Fallback for enums or unknowns
  if (prop.enum) return "string";
  return undefined;
}

export async function computeSearchIndex(
  arkOrJsonSchema: ArkTypeLike | JsonSchemaObject,
  _crawler: PlaywrightCrawler,
  options?: ComputeSearchIndexOptions,
) {
  const jsonSchema = toJsonSchema(arkOrJsonSchema);
  const oramaSchema: AnySchema = mapJsonSchemaToOramaSchema(
    jsonSchema,
    options?.vectorProperties,
  ) as unknown as AnySchema;

  const db = create({ schema: oramaSchema });

  const dataset = await Dataset.open();
  const limit = 1000;
  let offset = 0;
  let chunkIndex = 0;
  let totalInserted = 0;

  const s3 = resolveS3Config(options?.s3);
  const shouldPersist = Boolean(
    s3.accessKeyId && s3.secretAccessKey && s3.endpoint && s3.bucket,
  );
  let storage: ReturnType<typeof createStorage> | null = null;
  if (shouldPersist) {
    // Use require to load CJS default export shape for s3 driver
    const require = createRequire(import.meta.url);
    const s3Driver = require("unstorage/drivers/s3");
    const driver = (
      "default" in s3Driver ? s3Driver.default : s3Driver
    ) as (opts: {
      accessKeyId: string;
      secretAccessKey: string;
      endpoint: string;
      bucket: string;
      region: string;
    }) => unknown;
    const drv = driver({
      accessKeyId: s3.accessKeyId,
      secretAccessKey: s3.secretAccessKey,
      endpoint: s3.endpoint,
      bucket: s3.bucket,
      region: s3.region,
    });
    storage = createStorage({ driver: drv as never });
  }

  const prefix = options?.keyPrefix ?? "search-index";

  if (storage) {
    await storage.setItem(
      `${prefix}/orama-schema.json`,
      JSON.stringify(oramaSchema),
    );
    await storage.setItem(
      `${prefix}/source-schema.json`,
      JSON.stringify(jsonSchema),
    );
  }

  for (;;) {
    const { items, count } = await dataset.getData({
      offset,
      limit,
      clean: true,
    });
    if (!items || items.length === 0) break;

    type InsertParams = Parameters<typeof insertMultiple>;
    const docs = items as unknown as InsertParams[1];
    const target = db as InsertParams[0];
    await insertMultiple(target, docs);

    if (storage) {
      const key = `${prefix}/chunks/chunk-${String(chunkIndex).padStart(6, "0")}.json`;
      await storage.setItem(key, JSON.stringify(items));
    }

    totalInserted += items.length;
    offset += count;
    chunkIndex += 1;
    if (count < limit) break;
  }

  if (storage) {
    const manifest = {
      totalInserted,
      chunkCount: chunkIndex,
      createdAt: new Date().toISOString(),
      keyPrefix: prefix,
    };
    await storage.setItem(`${prefix}/manifest.json`, JSON.stringify(manifest));
  }

  return {
    totalInserted,
    chunkCount: chunkIndex,
    schema: oramaSchema,
    keyPrefix: prefix,
  };
}
