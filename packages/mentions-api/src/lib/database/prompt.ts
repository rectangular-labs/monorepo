import { safe } from "@rectangular-labs/result";
import { getContext } from "../../context";

export async function getPromptById(id: string) {
  const context = await getContext();
  const prompt = await safe(() =>
    context.db.query.smPrompt.findFirst({
      where: (table, { eq }) => eq(table.id, id),
    }),
  );
  return prompt;
}
