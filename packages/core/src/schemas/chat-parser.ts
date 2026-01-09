import { type } from "arktype";

export const chatStatusSchema = type("'idle'|'working'");

export const CHAT_DEFAULT_TITLE = "Untitled Chat";
export const CHAT_DEFAULT_STATUS = "idle";
