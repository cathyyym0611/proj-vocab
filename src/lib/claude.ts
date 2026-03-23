import OpenAI from "openai";

export function getClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}
