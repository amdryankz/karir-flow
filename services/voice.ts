export type SupportedLanguage = "indonesian" | "english";

export interface TTSOptions {
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speed?: number
}

const DEFAULT_VOICES: Record<SupportedLanguage, string> = {
  indonesian: "fUesUKVrbYRcEnWoLXet",
  english: "s3TPKV1kjDlVtZbl4Ksh",
};

export async function synthesizeVoice(
  text: string,
  language: SupportedLanguage,
  options: TTSOptions = {}
): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is missing");

  const voiceId = options.voiceId || DEFAULT_VOICES[language] || DEFAULT_VOICES["english"];

  const modelId = options.modelId || "eleven_turbo_v2_5";

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        model_id: modelId,
        text: text.trim(),
        voice_settings: {
          stability: options.stability ?? 0.75,
          similarity_boost: options.similarityBoost ?? 0.75,
          style: options.style ?? 0.0,
          speed: options.speed ?? 1.1
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`ElevenLabs TTS failed [${res.status}]: ${errText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`Error synthesizing voice for language: ${language}`, error);
    throw error;
  }
}