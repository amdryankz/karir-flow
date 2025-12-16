
import { NextRequest, NextResponse } from "next/server";
import { InterviewModel } from "@/models/interview";
import { OfferingModel } from "@/models/offering";
import errorHandler from "@/utils/errorHandler";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const [interviewStats, offeringStats] = await Promise.all([
      InterviewModel.getDashboardStats(userId),
      OfferingModel.getDashboardStats(userId),
    ]);

    // Calculate processed stats
    const totalInterviews = interviewStats.length;
    
    // Average score calculation
    const scores = interviewStats
      .map(i => i.totalScore || 0)
      .filter(s => s > 0);
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    // Recent activity (merge interviews and offers)
    const recentActivity = [
      ...interviewStats.map(i => ({
        type: 'interview',
        id: i.id,
        title: i.title || 'Practice Session', 
        date: i.finishedAt || i.startedAt,
        score: i.totalScore,
      })),
      ...offeringStats.offers.map(o => ({
        type: 'offer',
        id: o.id,
        title: o.title,
        date: o.createdAt,
        status: o.status
      }))
    ].sort((a, b) => new Date(b.date as Date).getTime() - new Date(a.date as Date).getTime())
    .slice(0, 5);

    // Score trend (reverse to show chronological)
    const scoreTrend = interviewStats
      .slice(0, 5) // Recent 5
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()) // Oldest first
      .map(i => ({
         date: new Date(i.startedAt).toLocaleDateString(),
         score: i.totalScore || 0
      }));

    return NextResponse.json({
      data: {
        kpi: {
          totalInterviews,
          avgScore,
          totalApplications: offeringStats.totalCount
        },
        charts: {
          scoreTrend
        },
        recentActivity
      }
    });

  } catch (err) {
    console.error(err);
    const { message, status } = errorHandler(err);
    return NextResponse.json({ message }, { status });
  }
}
