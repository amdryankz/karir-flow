import { InterviewData, InterviewModel } from "@/models/interview";

export class InterviewService {
  static async getAll(userId: string) {
    return await InterviewModel.getAll(userId);
  }

  static async getById(id: string) {
    return await InterviewModel.getById(id);
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

  static async finishInterview(id: string) {
    const interview = await InterviewModel.getById(id);
    if (!interview) throw new Error("Interview not found");

    const answers = interview.answers;
    const totalQuestions = interview.questionSet.questions.length;
    const totalScore = answers.reduce((sum, a) => sum + a.score, 0);
    
    // Score per answer is 1-10. 
    // Calculate score based on total questions in the set, not just answered ones.
    // Formula: (Sum of Scores / Total Questions) * 10
    const avgScore = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 10) : 0;

    return await InterviewModel.updateInterview(id, {
      finishedAt: new Date(),
      totalScore: avgScore,
    });
  }
}
