import prisma from "@/lib/prisma";

export interface InterviewData {
  userId: string;
  questionSetId: string;
  title: string;
  parentId?: string;
}

export class InterviewModel {
  static async getAll(userId: string) {
    return await prisma.interviewSession.findMany({
      where: {
        userId,
      },
      include: {
        questionSet: {
          include: {
            questions: {
              orderBy: {
                order: "asc",
              },
            },
          },
        },
        answers: true,
      },
      orderBy: {
        startedAt: "desc",
      },
    });
  }

  static async getById(id: string) {
    return await prisma.interviewSession.findFirst({
      where: {
        id,
      },
      include: {
        questionSet: {
          include: {
            questions: {
              orderBy: {
                order: "asc",
              },
            },
          },
        },
        answers: true,
      },
    });
  }

  static async createInterview(data: InterviewData) {
    return await prisma.interviewSession.create({
      data: {
        title: data.title,
        questionSetId: data.questionSetId,
        userId: data.userId,
        parentId: data.parentId,
      },
      include: {
        questionSet: {
          include: {
            questions: {
              orderBy: {
                order: "asc",
              },
            },
          },
        },
        answers: false,
      },
    });
  }

  static async updateInterview(id: string, data: any) {
    return await prisma.interviewSession.update({
      where: { id },
      data,
    });
  }
}
