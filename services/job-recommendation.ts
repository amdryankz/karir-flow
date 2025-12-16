import { GoogleGenerativeAI } from "@google/generative-ai";
import { LinkedInScraper, LinkedInJob } from "@/lib/jobScrape";
import { NotFoundError } from "@/utils/customError";
import { CvModel } from "@/models/cv";

interface JobRecommendationResult {
  jobs: LinkedInJob[];
  totalJobs: number;
  analysis: {
    rolesIdentified: string[];
    skills: string[];
    experience: string;
  };
}

export class JobRecommendationService {
  private static async analyzeCvWithAI(cvContent: string) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
    You are an expert career advisor and talent analyst.
    Analyze this CV and extract key information for job recommendations.
    
    CV CONTENT:
    "${cvContent.slice(0, 10000)}"
    
    OUTPUT FORMAT (JSON):
    {
      "roles": ["Primary Role 1", "Primary Role 2"],
      "skills": ["Skill 1", "Skill 2", "Skill 3"],
      "experienceLevel": "entry" | "mid" | "senior",
      "keywords": "keyword1, keyword2, keyword3"
    }
    `;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());

    return {
      rolesIdentified: parsed.roles || [],
      skills: parsed.skills || [],
      experienceLevel: parsed.experienceLevel || "mid",
      keywords: parsed.keywords || "",
    };
  }

  private static mapExperienceLevelToLinkedIn(level: string): string {
    const mapping: Record<string, string> = {
      entry: "2",
      mid: "3",
      senior: "4",
    };
    return mapping[level] || "3";
  }

  static async getJobRecommendations(
    userId: string
  ): Promise<JobRecommendationResult> {
    const cvDoc = await CvModel.getCvUser(userId);

    if (!cvDoc || !cvDoc.extractedText) {
      throw new NotFoundError(
        "CV document not found. Please upload your CV first."
      );
    }

    const analysis = await this.analyzeCvWithAI(cvDoc.extractedText.content);
    const keywords = analysis.keywords || analysis.rolesIdentified[0] || "";
    const experienceLevel = this.mapExperienceLevelToLinkedIn(
      analysis.experienceLevel
    );

    const scraper = new LinkedInScraper();
    await scraper.initialize();

    const jobs = await scraper.scrapeJobs({
      keywords,
      location: "Indonesia",
      maxJobs: 40,
      experienceLevel,
      jobType: "F",
      techSkills: analysis.skills,
    });

    await scraper.close();

    const finalJobs = jobs.slice(0, 25);

    return {
      jobs: finalJobs,
      totalJobs: finalJobs.length,
      analysis: {
        rolesIdentified: analysis.rolesIdentified,
        skills: analysis.skills,
        experience: analysis.experienceLevel,
      },
    };
  }
}
