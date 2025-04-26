import { createSubjects } from "@openauthjs/openauth/subject";
import { type } from "arktype";

export const subjects = createSubjects({
  user: type({
    id: "string",
    name: "string",
    email: "string",
    image: "string",
  }),
});
