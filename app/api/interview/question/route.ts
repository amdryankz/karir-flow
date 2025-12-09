import prisma from "@/lib/prisma";
import errorHandler from "@/utils/errorHandler";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const id = req.headers.get("x-user-id") as string;
    const data = await prisma.questionSet.findMany({
      where: {
        userId: id,
      },
      include: {
        questions: {
          orderBy: {
            order: "asc",
          },
          select: {
            text: true,
            order: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Successfully fetch data question",
      data,
    });
  } catch (err) {
    const { message, status } = errorHandler(err);
    return NextResponse.json({ message }, { status });
  }
}
