import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/lib/prisma";
import errorHandler from "@/utils/errorHandler";
import z from "zod";

const JobDescSchema = z.object({
  jobDesc: z.string().min(1, "Job description is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    JobDescSchema.parse(body);

    const { jobDesc } = body;
    const id = req.headers.get("x-user-id") as string;

    const pdf = await prisma.pdfDocument.findFirst({
      where: {
        userId: id,
      },
      include: {
        extractedText: true,
      },
    });

    const content = pdf?.extractedText?.content;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
    You are an expert HR Interviewer.
    
    CONTEXT:
    Candidate CV: "${content!.slice(0, 10000)}" 
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

    const questions: string[] = JSON.parse(responseText);

    const description = `Questions for ${jobDesc.slice(0, 50)}... based on CV.`;

    const questionsToCreate = questions.map((q: string, index: number) => ({
      text: q,
      order: index + 1,
    }));

    const savedQuestionSet = await prisma.questionSet.create({
      data: {
        userId: id,
        description,
        questions: {
          createMany: {
            data: questionsToCreate,
          },
        },
      },
      include: {
        questions: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return NextResponse.json({
      message: "Successfully generate data questions",
      questionSet: savedQuestionSet,
    });
  } catch (err) {
    const { message, status } = errorHandler(err);
    return NextResponse.json({ message }, { status });
  }
}
