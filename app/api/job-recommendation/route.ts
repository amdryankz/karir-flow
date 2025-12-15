import { NextRequest, NextResponse } from "next/server";
import { JobRecommendationService } from "@/services/job-recommendation";
import errorHandler from "@/utils/errorHandler";

export async function GET(req: NextRequest) {
  try {
    const id = req.headers.get("x-user-id") as string;

    const result = await JobRecommendationService.getJobRecommendations(id);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error:", error);
    const { message, status } = errorHandler(error);
    return NextResponse.json({ success: false, message }, { status });
  }
}
