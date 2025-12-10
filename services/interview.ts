import { InterviewData, InterviewModel } from "@/models/interview";

export class InterviewService {
  static async getAll(userId: string) {
    return await InterviewModel.getAll(userId);
  }

  static async createInterview(
    title: string,
    questionSetId: string,
    userId: string
  ) {
    const dbData: InterviewData = {
      title,
      questionSetId,
      userId,
    };

    return await InterviewModel.createInterview(dbData);
  }
}
