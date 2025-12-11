import { InterviewData, InterviewModel } from "@/models/interview";

export class InterviewService {
  static async getAll(userId: string) {
    return await InterviewModel.getAll(userId);
  }

  static async createInterview(
    title: string,
    questionSetId: string,
    userId: string,
    parentId?: string
  ) {
    const dbData: InterviewData = {
      title,
      questionSetId,
      userId,
      parentId,
    };

    return await InterviewModel.createInterview(dbData);
  }
}
