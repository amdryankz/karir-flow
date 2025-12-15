import { InterviewService } from "@/services/interview";
import { NotFoundError } from "@/utils/customError";
import errorHandler from "@/utils/errorHandler";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = req.headers.get("x-user-id") as string;
    const { id: interviewId } = await params;

    const interview = await InterviewService.getById(interviewId);

    if (!interview || interview.userId !== userId) {
      throw new NotFoundError("Interview not found");
    }

    if (
      !interview.finishedAt &&
      interview.answers.length >= interview.questionSet.questions.length &&
      interview.answers.length > 0
    ) {
      const updated = await InterviewService.finishInterview(interviewId);
      return NextResponse.json({
        message: "Successfully fetch interview data",
        data: updated,
      });
    }

    return NextResponse.json({
      message: "Successfully fetch interview data",
      data: interview,
    });
  } catch (err) {
    console.log(err);
    const { message, status } = errorHandler(err);
    return NextResponse.json({ message }, { status });
  }
}
