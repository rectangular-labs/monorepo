import { arkTypeJsonSchemaTransformer } from "@rectangular-labs/core/schema/arktype-json-schema-transformer";
import { type JSONSchema7, jsonSchema } from "ai";

type ArkTypeWithInfer = {
  infer: unknown;
  toJsonSchema: () => unknown;
};

function addAdditionalPropertiesToJsonSchema(
  jsonSchema: JSONSchema7,
): JSONSchema7 {
  if (jsonSchema.type === "object") {
    jsonSchema.additionalProperties = false;
    const properties = jsonSchema.properties;
    if (properties != null) {
      for (const property in properties) {
        properties[property] = addAdditionalPropertiesToJsonSchema(
          properties[property] as JSONSchema7,
        );
      }
    }
  }
  if (jsonSchema.type === "array" && jsonSchema.items != null) {
    if (Array.isArray(jsonSchema.items)) {
      jsonSchema.items = jsonSchema.items.map((item) =>
        addAdditionalPropertiesToJsonSchema(item as JSONSchema7),
      );
    } else {
      jsonSchema.items = addAdditionalPropertiesToJsonSchema(
        jsonSchema.items as JSONSchema7,
      );
    }
  }
  if (jsonSchema.anyOf != null) {
    jsonSchema.anyOf = jsonSchema.anyOf.map((schema) =>
      addAdditionalPropertiesToJsonSchema(schema as JSONSchema7),
    );
  }
  if (jsonSchema.allOf != null) {
    jsonSchema.allOf = jsonSchema.allOf.map((schema) =>
      addAdditionalPropertiesToJsonSchema(schema as JSONSchema7),
    );
  }
  if (jsonSchema.oneOf != null) {
    jsonSchema.oneOf = jsonSchema.oneOf.map((schema) =>
      addAdditionalPropertiesToJsonSchema(schema as JSONSchema7),
    );
  }
  return jsonSchema;
}

export function arktypeToAiJsonSchema<TSchema extends ArkTypeWithInfer>(
  schema: TSchema,
) {
  const intermediate = arkTypeJsonSchemaTransformer(schema) as JSONSchema7;
  const result = jsonSchema<TSchema["infer"]>(
    addAdditionalPropertiesToJsonSchema(intermediate),
  );
  return result;
}
