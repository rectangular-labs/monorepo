import { parseServerEnv } from "@rectangular-labs/env";

export const env = () => {
  return parseServerEnv(process.env);
};
