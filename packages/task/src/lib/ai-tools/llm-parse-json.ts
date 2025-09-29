import { google } from "@ai-sdk/google";
import { generateObject, type JSONSchema7, jsonSchema } from "ai";
import { type } from "arktype";

export async function llmParseJson<T extends type>(
  outputData: string,
  schema: T,
): Promise<type.infer<T>> {
  const functionStartTime = Date.now(); // Record start time for the whole function
  const llmParseJsonLabel = `llmParseJson for schema ${schema.description ?? "unknown_schema"}`;
  console.time(llmParseJsonLabel);

  try {
    const object = JSON.parse(outputData);
    const parsedResult = schema(object);
    if (parsedResult instanceof type.errors) {
      throw new Error(parsedResult.summary);
    }
    console.timeEnd(llmParseJsonLabel);
    return parsedResult as type.infer<T>;
  } catch (error) {
    console.warn(
      `Error in llmParseJson during JSON.parse for schema ${schema.description ?? "unknown_schema"}:`,
      error,
      "Falling back to llm json parsing",
    );
  }

  const extractionPrompt = `Convert the following text into a valid JSON in javascript:
${outputData}`;

  const generateObjectLabel = `generateObject in llmParseJson for schema ${schema.description ?? "unknown_schema"}`;
  console.time(generateObjectLabel);
  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      messages: [{ role: "user", content: extractionPrompt }],
      temperature: 0,
      schema: jsonSchema<type.infer<T>>(schema.toJsonSchema() as JSONSchema7),
      experimental_repairText: ({ text }) => {
        let repairedText = text;

        console.log(
          "in experimental_repairText with text starting with ",
          repairedText.substring(0, 100),
        );

        const tripleTildeRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
        const tripleTildeMatch = repairedText.match(tripleTildeRegex);

        const singleTildeRegex = /`\s*({[^`]*?}|\[(?:[^`]*?)\])\s*`/;
        const singleTildeMatch = repairedText.match(singleTildeRegex);

        if (tripleTildeMatch?.[1]) {
          repairedText = tripleTildeMatch[1];
        } else if (singleTildeMatch?.[1]) {
          repairedText = singleTildeMatch[1];
        }

        repairedText = repairedText.trim();
        return Promise.resolve(repairedText);
      },
      maxRetries: 3,
    });
    console.timeEnd(generateObjectLabel);

    const functionEndTime = Date.now();
    const durationMs = functionEndTime - functionStartTime;

    if (durationMs > 20_000) {
      // 20 seconds = 20000 milliseconds
      console.log(
        `llmParseJson took ${durationMs / 1000}s (longer than 20s). Outputting generated object for schema '${schema.description ?? "unknown_schema"}':`,
      );
      try {
        console.log(JSON.stringify(object, null, 2));
      } catch (stringifyError) {
        console.error(
          "Error stringifying the object for detailed logging:",
          stringifyError,
        );
        console.log("Object (raw, direct log):", object);
      }
    }

    console.timeEnd(llmParseJsonLabel);
    return object as type.infer<T>;
  } catch (error) {
    console.error(
      `Error in llmParseJson during generateObject for schema ${schema.description ?? "unknown_schema"}:`,
      error,
    );
    // Ensure timers are ended even if an error occurs before the custom duration check
    console.timeEnd(generateObjectLabel);
    console.timeEnd(llmParseJsonLabel);
    throw error; // Re-throw the error after logging
  }
}
