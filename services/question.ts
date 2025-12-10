import { GoogleGenerativeAI } from "@google/generative-ai";
import { QuestionModel, QuestionSetData } from "@/models/question";
import { NotFoundError } from "@/utils/customError";
import z from "zod";

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
    Generate 5 interview questions specifically tailored to the candidate's experience and the job requirements.
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

    const questionsData = questions.map((q: string, index: number) => ({
      text: q,
      order: index + 1,
    }));

    const questionSetData: QuestionSetData = {
      userId,
      description,
      questions: questionsData,
    };

    return await QuestionModel.createQuestionSet(questionSetData);
  }
}
