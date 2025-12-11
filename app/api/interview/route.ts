import { InterviewService } from "@/services/interview";
import { QuestionService } from "@/services/question";
import { NotFoundError } from "@/utils/customError";
import errorHandler from "@/utils/errorHandler";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const id = req.headers.get("x-user-id") as string;
    const data = await InterviewService.getAll(id);

    return NextResponse.json({
      message: "Successfully fetch data interview",
      data,
    });
  } catch (err) {
    console.log(err);

    const { message, status } = errorHandler(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { jobDesc, title, questionSetId, parentId } = body;
    const id = req.headers.get("x-user-id") as string;
    let questionSet;

    if (!questionSetId) {
      questionSet = await QuestionService.createQuestionSet(id, jobDesc);
    } else {
      questionSet = await QuestionService.getQuestionSetById(questionSetId);
    }

    if (!questionSet) throw new NotFoundError();

    const data = await InterviewService.createInterview(
      title,
      questionSet.id,
      id,
      parentId
    );

    return NextResponse.json({
      message: "Successfully create session interview",
      data,
    });
  } catch (err) {
    console.log(err);
    const { message, status } = errorHandler(err);
    return NextResponse.json({ message }, { status });
  }
}
