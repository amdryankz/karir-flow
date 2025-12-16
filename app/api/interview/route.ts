import { InterviewService } from "@/services/interview";
import { QuestionService } from "@/services/question";
import { NotFoundError } from "@/utils/customError";
import errorHandler from "@/utils/errorHandler";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateInterviewSchema = z.object({
  jobDesc: z.string().min(1, "Description is required"),
  title: z.string().min(1, "Title is required"),
  questionSetId: z.string().optional(),
  parentId: z.string().optional(),
  language: z
    .enum(["english", "indonesian"], {
      message: "Language must be 'english' or 'indonesian'",
    })
    .default("english"),
  questionCount: z
    .number()
    .int()
    .min(1, "Question count must be at least 1")
    .max(10, "Question count cannot exceed 10")
    .default(5),
});

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

    const validatedData = CreateInterviewSchema.parse(body);
    const { jobDesc, title, questionSetId, parentId, language, questionCount } =
      validatedData;
    const id = req.headers.get("x-user-id") as string;
    let questionSet;

    if (!questionSetId) {
      questionSet = await QuestionService.createQuestionSet(
        id,
        jobDesc || "",
        language,
        questionCount
      );
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
