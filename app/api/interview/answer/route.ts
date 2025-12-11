import { QuestionService } from "@/services/question";
import errorHandler from "@/utils/errorHandler";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const questionId = formData.get("questionId") as string;
    const interviewSessionId = formData.get("interviewSessionId") as string;

    const data = await QuestionService.createAnswer(
      audioFile,
      questionId,
      interviewSessionId
    );

    return NextResponse.json({
      message: "Successfully created answer",
      data,
    });
  } catch (err) {
    const { message, status } = errorHandler(err);
    return NextResponse.json({ message }, { status });
  }
}
