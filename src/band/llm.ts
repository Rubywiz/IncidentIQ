import OpenAI from 'openai';

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.FEATHERLESS_API_KEY,
      baseURL: process.env.FEATHERLESS_BASE_URL ?? 'https://api.featherless.ai/v1',
    });
  }
  return _client;
}

const MODEL = process.env.FEATHERLESS_MODEL ?? 'meta-llama/Meta-Llama-3.1-70B-Instruct';

export async function chat(
  systemPrompt: string,
  userContent: string,
  maxTokens = 1024,
): Promise<string> {
  const res = await getClient().chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
  });
  return res.choices[0]?.message?.content ?? '';
}
