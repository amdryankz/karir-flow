export interface TTSOptions {
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
}

export async function synthesizeVoice(
  text: string,
  options: TTSOptions = {}
): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY env is missing");

  const voiceId =
    options.voiceId ||
    process.env.ELEVENLABS_VOICE_ID ||
    "21m00Tcm4TlvDq8ikWAM"; // default voice
  const modelId = options.modelId || "eleven_multilingual_v2";

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const body = {
    model_id: modelId,
    text,
    voice_settings: {
      stability: options.stability ?? 0.5,
      similarity_boost: options.similarityBoost ?? 0.75,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ElevenLabs TTS failed: ${res.status} ${errText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
