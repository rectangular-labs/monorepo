import type { SQSEvent } from "aws-lambda";

export const handler = async (event: SQSEvent) => {
  console.log(JSON.stringify(event, null, 2));
  for (const record of event.Records) {
    console.log();
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return "ok";
};
