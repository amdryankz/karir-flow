import { GoogleGenerativeAI } from "@google/generative-ai";
import { NotFoundError } from "@/utils/customError";
import { CvModel } from "@/models/cv";
import axios from "axios";

interface LinkedInJob {
  id: string;
  title: string;
  company: string;
  location: string;
  postedAt?: string;
  isRemote?: boolean;
  jobUrl: string;
  applyUrl: string;
  description?: string;
  companyLogo?: string;
}

interface JobRecommendationResult {
  jobs: LinkedInJob[];
  totalJobs: number;
  analysis: {
    rolesIdentified: string[];
    skills: string[];
    experience: string;
  };
}

export class JobRecommendationJSearchService {
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

  private static async searchJobsWithJSearch(
    query: string,
    location: string = "Indonesia"
  ): Promise<LinkedInJob[]> {
    try {
      console.log("🔍 Searching jobs with query:", query, "in", location);
      console.log("📝 API Key exists:", !!process.env.RAPIDAPI_KEY);

      const options = {
        method: "GET",
        url: "https://linkedin-job-search-api.p.rapidapi.com/active-jb-7d",
        params: {
          limit: '10',
          offset: '0',
          title_filter: '"Fullstack Developer"',
          location_filter: '"Indonesia"'
        },
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
          "x-rapidapi-host": "linkedin-job-search-api.p.rapidapi.com",
        },
      };

      console.log("📤 Request params:", options.params);

      const response = await axios.request(options);
      const data = response.data;

      console.log("📥 Response status:", response.status);
      console.log("📊 Response structure:", {
        hasData: !!data,
        isArray: Array.isArray(data),
        dataLength: Array.isArray(data) ? data.length : 0,
        dataKeys: data ? Object.keys(data) : [],
      });

      // Handle if response is array directly
      const jobsData = Array.isArray(data) ? data : data.data || [];

      if (!Array.isArray(jobsData) || jobsData.length === 0) {
        console.warn("⚠️ No jobs found in response");
        return [];
      }

      console.log("📊 Total jobs received:", jobsData.length);

      // Map LinkedIn jobs to our LinkedInJob format
      const jobs: LinkedInJob[] = jobsData.slice(0, 10).map((job: any) => {
        return {
          id: job.jobId || job.id || String(Math.random()),
          title: job.title || job.jobTitle || "No title",
          company: job.company || job.companyName || "Unknown Company",
          location: job.location || job.jobLocation || "Remote",
          postedAt: job.postedAt || job.postedDate || job.listedAt,
          isRemote: job.isRemote || false,
          jobUrl: job.url || job.jobUrl || job.link || "",
          applyUrl: job.applyUrl || job.url || job.jobUrl || job.link || "",
          description: job.description || job.jobDescription || "",
          companyLogo: job.companyLogo || job.logo || "",
        };
      });

      console.log("✅ Successfully mapped", jobs.length, "jobs");
      return jobs;
    } catch (error: any) {
      console.error("❌ LinkedIn Job Search API Error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(
        `Failed to fetch jobs from LinkedIn API: ${error.message}`
      );
    }
  }

  static async getJobRecommendations(
    userId: string
  ): Promise<JobRecommendationResult> {
    console.log("🚀 Starting job recommendations for user:", userId);

    const cvDoc = await CvModel.getCvUser(userId);

    if (!cvDoc || !cvDoc.extractedText) {
      throw new NotFoundError(
        "CV document not found. Please upload your CV first."
      );
    }

    console.log("📄 CV found, analyzing with AI...");
    const analysis = await this.analyzeCvWithAI(cvDoc.extractedText.content);
    console.log("🤖 AI Analysis result:", {
      roles: analysis.rolesIdentified,
      skills: analysis.skills,
      experience: analysis.experienceLevel,
      keywords: analysis.keywords,
    });

    const keywords = analysis.keywords || analysis.rolesIdentified[0] || "";

    if (!keywords) {
      console.warn("⚠️ No keywords found from CV analysis, using fallback");
    }

    console.log("🔎 Searching jobs with keywords:", keywords);
    const jobs = await this.searchJobsWithJSearch(keywords, "Indonesia");

    console.log("✅ Returning", jobs.length, "jobs");

    return {
      jobs: jobs,
      totalJobs: jobs.length,
      analysis: {
        rolesIdentified: analysis.rolesIdentified,
        skills: analysis.skills,
        experience: analysis.experienceLevel,
      },
    };
  }
}
