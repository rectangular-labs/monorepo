export type ArkTypeSchema = {
  toJsonSchema: () => unknown;
};

function replaceStringEnumWithAnyOf(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => replaceStringEnumWithAnyOf(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;
  const normalized: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(record)) {
    normalized[key] = replaceStringEnumWithAnyOf(item);
  }

  if (
    Array.isArray(record.enum) &&
    record.enum.every((item) => typeof item === "string")
  ) {
    normalized.anyOf = [...record.enum];
    normalized.type = "string";
    delete normalized.enum;
  }
  if (Array.isArray(record.anyOf)) {
    normalized.type = "string";
  }

  return normalized;
}

export function arkTypeJsonSchemaTransformer(schema: ArkTypeSchema) {
  return replaceStringEnumWithAnyOf(schema.toJsonSchema());
}
