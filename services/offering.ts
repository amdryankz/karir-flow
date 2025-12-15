import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFParse } from "pdf-parse";
import { uploadPdfBuffer } from "@/lib/storage";
import {
  OfferingModel,
  OfferAnalysisData,
  RedFlagData,
} from "@/models/offering";
import { BadRequestError } from "@/utils/customError";

interface UploadOfferLetterParams {
  file: File;
  title: string;
  userId: string;
}

interface AIAnalysisResult {
  compensation: {
    baseSalary: string;
    bonus: string;
    equity: string;
    allowances: string;
    total: string;
  };
  jobDetails: {
    title: string;
    employmentType: string;
    workingHours: string;
    location: string;
    startDate: string;
  };
  terms: {
    probation: string;
    leavePolicy: string;
  };
  competitiveness: {
    score: number;
    analysis: string;
  };
  legalReview: {
    clarityScore: number;
    complexity: string;
    favorability: string;
  };
  negotiation: {
    items: string[];
    phrases: string[];
  };
  missing: string[];
  redFlags: Array<{
    type: string;
    description: string;
    severity: "low" | "medium" | "high";
  }>;
}

export class OfferingService {
  /**
   * Parse PDF file and extract text
   */
  private static async parsePdfFile(file: File): Promise<{
    buffer: Buffer;
    text: string;
    pageCount: number;
  }> {
    if (!file.size) {
      throw new BadRequestError("No file uploaded");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parser = new PDFParse({
      data: buffer,
      worker: undefined,
    });

    const data = await parser.getText();
    const info = await parser.getInfo({ parsePageInfo: true });

    return {
      buffer,
      text: data.text,
      pageCount: info.total,
    };
  }

  /**
   * Analyze offer letter with AI
   */
  private static async analyzeOfferLetterWithAI(
    offerText: string
  ): Promise<AIAnalysisResult> {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
    You are an expert HR consultant and legal advisor specializing in employment offer analysis.
    
    TASK:
    Analyze this job offer letter comprehensively and provide detailed insights.
    
    OFFER LETTER CONTENT:
    "${offerText.slice(0, 20000)}"
    
    OUTPUT FORMAT (JSON):
    {
      "compensation": {
        "baseSalary": "Extract base salary with currency, e.g., 'IDR 15,000,000/month'",
        "bonus": "Annual bonus policy if mentioned",
        "equity": "Stock options or equity if mentioned",
        "allowances": "List allowances: transport, meal, etc",
        "total": "Total estimated compensation per year"
      },
      "jobDetails": {
        "title": "Job title",
        "employmentType": "Full-time / Contract / Part-time",
        "workingHours": "e.g., 9 AM - 6 PM, Monday to Friday",
        "location": "Office location or Remote",
        "startDate": "Expected start date"
      },
      "terms": {
        "probation": "Probation period details",
        "leavePolicy": "Annual leave, sick leave policy"
      },
      "competitiveness": {
        "score": 7, // 1-10 score vs market standards
        "analysis": "Brief explanation of competitiveness"
      },
      "legalReview": {
        "clarityScore": 8, // 1-10, how clear the terms are
        "complexity": "Simple / Moderate / Complex",
        "favorability": "Favorable / Neutral / Unfavorable to employee"
      },
      "negotiation": {
        "items": ["Salary", "Remote work days"], // List negotiable items
        "phrases": ["Suggested negotiation phrases"]
      },
      "missing": ["List any important missing clauses"],
      "redFlags": [
        {
          "type": "Compensation / Legal / Work-Life",
          "description": "Detailed explanation",
          "severity": "low" | "medium" | "high"
        }
      ]
    }
    
    Be thorough but concise. If information is not available, use "Not specified".
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);
  }

  /**
   * Upload and analyze offer letter
   */
  static async uploadAndAnalyzeOfferLetter(params: UploadOfferLetterParams) {
    const { file, title, userId } = params;

    // Parse PDF
    const parsedData = await this.parsePdfFile(file);

    // Upload to storage
    const fileUrl = await uploadPdfBuffer(parsedData.buffer, file.name);

    // Create offer letter record with status "uploaded"
    const offerLetter = await OfferingModel.createOfferLetter({
      userId,
      title,
      fileUrl,
      status: "uploaded",
    });

    try {
      // Analyze with AI
      const aiAnalysis = await this.analyzeOfferLetterWithAI(parsedData.text);

      // Prepare analysis data
      const analysisData: OfferAnalysisData = {
        offerLetterId: offerLetter.id,
        baseSalaryAmount: aiAnalysis.compensation.baseSalary,
        bonusPolicy: aiAnalysis.compensation.bonus,
        equityValue: aiAnalysis.compensation.equity,
        allowances: aiAnalysis.compensation.allowances,
        totalCompensation: aiAnalysis.compensation.total,
        jobTitle: aiAnalysis.jobDetails.title,
        employmentType: aiAnalysis.jobDetails.employmentType,
        workingHours: aiAnalysis.jobDetails.workingHours,
        workLocation: aiAnalysis.jobDetails.location,
        startDate: aiAnalysis.jobDetails.startDate,
        probationTerms: aiAnalysis.terms.probation,
        leavePolicy: aiAnalysis.terms.leavePolicy,
        competitivenessScore: aiAnalysis.competitiveness.score,
        competitivenessText: aiAnalysis.competitiveness.analysis,
        clarityScore: aiAnalysis.legalReview.clarityScore,
        legalComplexity: aiAnalysis.legalReview.complexity,
        employerFavorability: aiAnalysis.legalReview.favorability,
        negotiationItems: aiAnalysis.negotiation.items.join(", "),
        negotiationPhrases: aiAnalysis.negotiation.phrases.join(" | "),
        missingItems: aiAnalysis.missing.join(", "),
      };

      // Prepare red flags data
      const redFlagsData: RedFlagData[] = aiAnalysis.redFlags.map((flag) => ({
        offerLetterId: offerLetter.id,
        type: flag.type,
        description: flag.description,
        severity: flag.severity,
      }));

      // Save analysis and red flags
      await OfferingModel.createOfferAnalysisWithRedFlags(
        analysisData,
        redFlagsData
      );

      // Update status to analyzed
      await OfferingModel.updateOfferLetterStatus(offerLetter.id, "analyzed");

      // Return complete data
      return await OfferingModel.getOfferLetterById(offerLetter.id, userId);
    } catch (error) {
      // Update status to failed
      console.error("❌ Analysis failed:", error);
      await OfferingModel.updateOfferLetterStatus(offerLetter.id, "failed");
      throw error;
    }
  }

  /**
   * Get all offer letters for a user
   */
  static async getAllOfferLetters(userId: string) {
    return await OfferingModel.getAllOfferLetters(userId);
  }

  /**
   * Get offer letter by ID
   */
  static async getOfferLetterById(id: string, userId: string) {
    const offerLetter = await OfferingModel.getOfferLetterById(id, userId);

    if (!offerLetter) {
      throw new BadRequestError("Offer letter not found");
    }

    return offerLetter;
  }

  /**
   * Delete offer letter by ID
   */
  static async deleteOfferLetter(id: string, userId: string) {
    return await OfferingModel.deleteOfferLetter(id, userId);
  }
}
