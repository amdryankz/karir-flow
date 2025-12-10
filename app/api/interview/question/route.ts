import errorHandler from "@/utils/errorHandler";
import { NextRequest, NextResponse } from "next/server";
import { QuestionService } from "@/services/question";

export async function GET(req: NextRequest) {
  try {
    const id = req.headers.get("x-user-id") as string;
    const data = await QuestionService.getQuestionSetsByUserId(id);

    return NextResponse.json({
      message: "Successfully fetch data question",
      data,
    });
  } catch (err) {
    const { message, status } = errorHandler(err);
    return NextResponse.json({ message }, { status });
  }
}
