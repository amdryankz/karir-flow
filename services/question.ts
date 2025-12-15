import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnswerData, QuestionModel, QuestionSetData } from "@/models/question";
import { InterviewService } from "@/services/interview";
import { InterviewModel } from "@/models/interview";
import { NotFoundError } from "@/utils/customError";
import z from "zod";
import { uploadAudioBuffer } from "@/lib/storage";
import { synthesizeVoice } from "@/services/voice";

const JobDescSchema = z.object({
  jobDesc: z
    .string("Job description is required")
    .min(1, "Job description is required"),
});

export class QuestionService {
  static async getQuestionSetsByUserId(userId: string) {
    return await QuestionModel.getQuestionSetsByUserId(userId);
  }

  static async getQuestionSetById(id: string) {
    return await QuestionModel.getQuestionSetById(id);
  }

  static async generateQuestionsFromAI(
    cvContent: string,
    jobDesc: string
  ): Promise<string[]> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
    You are an expert HR Interviewer.
    
    CONTEXT:
    Candidate CV: "${cvContent.slice(0, 10000)}" 
    Job Description: "${jobDesc.slice(0, 5000)}"

    TASK:
    Generate 2 interview questions specifically tailored to the candidate's experience and the job requirements.
    Mix technical questions and behavioral questions.

    OUTPUT FORMAT:
    Return ONLY a JSON array of strings. Example:
    ["Question 1", "Question 2", "Question 3"]
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return JSON.parse(responseText);
  }

  static async createQuestionSet(userId: string, jobDesc: string) {
    JobDescSchema.parse({ jobDesc });

    const pdf = await QuestionModel.getPdfDocumentWithText(userId);

    if (!pdf || !pdf.extractedText) {
      throw new NotFoundError("CV document not found");
    }

    const content = pdf.extractedText.content;
    const questions = await this.generateQuestionsFromAI(content, jobDesc);

    const description = `Questions for ${jobDesc.slice(0, 50)}... based on CV.`;

    const questionsData = await Promise.all(
      questions.map(async (q: string, index: number) => {
        const audioBuffer = await synthesizeVoice(q);
        const voiceUrl = await uploadAudioBuffer(
          audioBuffer,
          `question-${index + 1}.mp3`,
          "audio/mpeg"
        );
        return { text: q, order: index + 1, voiceUrl };
      })
    );

    const questionSetData: QuestionSetData = {
      userId,
      description,
      questions: questionsData,
    };

    return await QuestionModel.createQuestionSet(questionSetData);
  }

  static async generateFeedbackAnswerFromAI(audioFile: File, question: string) {
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
    You are an expert HR Interviewer & Voice Coach. 
    The user is answering this interview question: "${question}".

    TASK:
    1. Listen to the audio carefully.
    2. Transcribe the answer exactly (verbatim).
    3. ANALYZE SPEECH PATTERNS (Crucial):
      - Pace: Is it too fast (rushed), too slow, or natural?
      - Fillers: Count usage of "umm", "uh", "like", "anu" (Indonesian context).
      - Tone: Does the speaker sound confident, nervous, robotic, or enthusiastic?
      - Pauses: Are there awkward silences?
    4. Provide constructive feedback.

    OUTPUT JSON FORMAT:
    {
      "transcription": "...",
      "feedback_content": "Feedback on the actual answer content (STAR method)...",
      "feedback_tone": "You spoke a bit too fast and sounded nervous. You used 'umm' 4 times.",
      "score": 8, // Score 1-10
      "speech_pace": "TOO_FAST" | "NORMAL" | "TOO_SLOW",
      "confidence_level": "HIGH" | "MEDIUM" | "LOW"
      "tips": "One specific actionable tip to improve"
    }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: audioFile.type || "audio/webm",
          data: base64Audio,
        },
      },
    ]);

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    return parsed;
  }

  static async createAnswer(
    audioFile: File,
    questionId: string,
    interviewSessionId: string
  ) {
    const question = await QuestionModel.getQuestionById(questionId);

    if (!question) {
      throw new NotFoundError("Question not found");
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioUrl = await uploadAudioBuffer(
      buffer,
      audioFile.name,
      audioFile.type || "audio/webm"
    );

    const answer = await this.generateFeedbackAnswerFromAI(
      audioFile,
      question.text
    );

    const dbData: AnswerData = {
      transcription: answer.transcription,
      audioUrl: audioUrl,
      feedbackContent: answer.feedback_content || answer.feedbackContent,
      feedbackTone: answer.feedback_tone || answer.feedbackTone,
      score:
        typeof answer.score === "number"
          ? answer.score
          : parseInt(answer.score) || 5,
      speechPace: answer.speech_pace || answer.speechPace,
      confidentLevel: answer.confidence_level || answer.confidentLevel,
      tips: answer.tips,
      interviewSessionId: interviewSessionId,
      questionId: questionId,
    };

    const createdAnswer = await QuestionModel.createAnswer(dbData);

    const interview = await InterviewModel.getById(interviewSessionId);
    if (interview) {
      const questionCount = interview.questionSet.questions.length;
      const answerCount = interview.answers.length;

      if (answerCount >= questionCount) {
        await InterviewService.finishInterview(interviewSessionId);
      }
    }

    return createdAnswer;
  }
}
