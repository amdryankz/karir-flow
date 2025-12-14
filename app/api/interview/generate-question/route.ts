import { NextRequest, NextResponse } from "next/server";
import errorHandler from "@/utils/errorHandler";
import { QuestionService } from "@/services/question";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { jobDesc } = body;
    const id = req.headers.get("x-user-id") as string;

    if (!id) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 });
    }

    const savedQuestionSet = await QuestionService.createQuestionSet(
      id,
      jobDesc
    );

    return NextResponse.json({
      message: "Successfully generate data questions",
      data: savedQuestionSet,
    });
  } catch (err) {
    console.error("Error in generate-question API:", err);
    const { message, status } = errorHandler(err);
    return NextResponse.json({ message }, { status });
  }
}
