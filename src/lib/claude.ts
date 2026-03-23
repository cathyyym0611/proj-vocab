import OpenAI from "openai";
import { getEnv } from "@/lib/env";

export function getClient() {
  return new OpenAI({
    apiKey: getEnv("OPENAI_API_KEY"),
  });
}
