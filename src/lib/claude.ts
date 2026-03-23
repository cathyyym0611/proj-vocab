import OpenAI from "openai";
import { getEnvAsync } from "@/lib/env";

export async function getClient() {
  return new OpenAI({
    apiKey: await getEnvAsync("OPENAI_API_KEY"),
  });
}
