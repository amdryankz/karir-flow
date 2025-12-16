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
  /**
   * Analyze CV content with AI to extract roles, skills, and experience level
   */
  private static async analyzeCvWithAI(cvContent: string) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
    You are an expert career advisor and talent analyst.
    
    TASK:
    Analyze this CV and extract key information for job recommendations.
    
    CV CONTENT:
    "${cvContent.slice(0, 10000)}"
    
    OUTPUT FORMAT (JSON):
    {
      "roles": ["Primary Role 1", "Primary Role 2"], // Top 2-3 job roles based on experience
      "skills": ["Skill 1", "Skill 2", "Skill 3"], // Top technical skills (max 5)
      "experienceLevel": "entry" | "mid" | "senior", // Based on years and responsibilities
      "keywords": "keyword1, keyword2, keyword3" // Best keywords for job search (comma-separated)
    }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    return {
      rolesIdentified: parsed.roles || [],
      skills: parsed.skills || [],
      experienceLevel: parsed.experienceLevel || "mid",
      keywords: parsed.keywords || "",
    };
  }

  /**
   * Map experience level to LinkedIn format
   */
  private static mapExperienceLevelToLinkedIn(level: string): string {
    const mapping: Record<string, string> = {
      entry: "2", // Entry level
      mid: "3", // Associate
      senior: "4", // Mid-Senior level
    };
    return mapping[level] || "3";
  }

  /**
   * Get job recommendations for a user based on their CV
   */
  static async getJobRecommendations(
    userId: string
  ): Promise<JobRecommendationResult> {
    console.log("📋 Fetching user CV...");

    // Get user's CV from database
    const cvDoc = await CvModel.getCvUser(userId);

    if (!cvDoc || !cvDoc.extractedText) {
      throw new NotFoundError(
        "CV document not found. Please upload your CV first."
      );
    }

    const cvContent = cvDoc.extractedText.content;
    console.log("✅ CV found, analyzing with AI...");

    // Analyze CV with AI
    const analysis = await this.analyzeCvWithAI(cvContent);
    console.log("🤖 AI Analysis complete:", analysis);

    // Prepare scraper options
    const keywords = analysis.keywords || analysis.rolesIdentified[0] || "";
    const experienceLevel = this.mapExperienceLevelToLinkedIn(
      analysis.experienceLevel
    );

    console.log(`🔍 Searching jobs with keywords: "${keywords}"`);
    console.log(
      `📊 Experience level: ${analysis.experienceLevel} (${experienceLevel})`
    );

    // Scrape LinkedIn jobs
    const scraper = new LinkedInScraper();
    await scraper.initialize();

    const jobs = await scraper.scrapeJobs({
      keywords,
      location: "Indonesia",
      maxJobs: 40, // Scrape 40 jobs dulu, nanti difilter jadi 25
      experienceLevel,
      jobType: "F", // Full-time
      techSkills: analysis.skills,
    });

    await scraper.close();

    // Return hanya 25 jobs terbaik (sudah sorted by skill match di scraper)
    const finalJobs = jobs.slice(0, 25);
    console.log(
      `✅ Found ${jobs.length} relevant jobs, returning top ${finalJobs.length}`
    );

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
