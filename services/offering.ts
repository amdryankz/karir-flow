import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import { OfferingModel, RedFlagData } from "@/models/offering";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

interface UploadOfferLetterParams {
  file: File;
  title: string;
  userId: string;
}

export class OfferingService {
  /**
   * Upload and analyze offer letter
   */
  static async uploadAndAnalyzeOfferLetter(params: UploadOfferLetterParams) {
    const { file, title, userId } = params;

    // Validate file type (PDF only)
    if (file.type !== "application/pdf") {
      throw new Error("Please input pdf file");
    }

    // Convert file to base64 for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64File = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Generate public ID for Cloudinary
    const timestamp = Date.now();
    const sanitizedFileName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-]/g, "_");
    const publicId = `offer-letters/${userId}/${timestamp}-${sanitizedFileName}`;

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64File, {
      resource_type: "auto",
      public_id: publicId,
      folder: "offer-letters",
    });

    const fileUrl = uploadResult.secure_url;

    // Create offer letter record in database
    const offerLetter = await OfferingModel.createOfferLetter({
      userId,
      title,
      fileUrl,
      status: "uploaded",
    });

    // Analyze offer letter using n8n webhook
    const analyzedOffer = await axios.post(
      "https://marsyandha-nayoan.app.n8n.cloud/webhook/analyze-offer",
      {
        offerLetterId: `${offerLetter.id}`,
        fileUrl: `${offerLetter.fileUrl}`,
      }
    );

    const { data } = analyzedOffer.data;
    const { offerAnalysis, redFlags } = data;

    // Create offer analysis record
    const offering = await OfferingModel.createOfferAnalysis({
      offerLetterId: offerLetter.id,
      baseSalaryAmount: offerAnalysis.baseSalaryAmount,
      bonusPolicy: offerAnalysis.bonusPolicy,
      equityValue: offerAnalysis.equityValue,
      allowances: offerAnalysis.allowances,
      totalCompensation: offerAnalysis.totalCompensation,
      jobTitle: offerAnalysis.jobTitle,
      employmentType: offerAnalysis.employmentType,
      workingHours: offerAnalysis.workingHours,
      workLocation: offerAnalysis.workLocation,
      startDate: offerAnalysis.startDate,
      probationTerms: offerAnalysis.probationTerms,
      leavePolicy: offerAnalysis.leavePolicy,
      competitivenessScore: offerAnalysis.competitivenessScore,
      clarityScore: offerAnalysis.clarityScore,
      legalComplexity: offerAnalysis.legalComplexity,
      employerFavorability: offerAnalysis.employerFavorability,
      negotiationItems: offerAnalysis.negotiationItems,
      negotiationPhrases: offerAnalysis.negotiationPhrases,
      missingItems: offerAnalysis.missingItems,
    });

    // Create red flags if any
    if (redFlags && redFlags.length > 0) {
      const redFlagsData: RedFlagData[] = redFlags.map(
        (flag: { type: string; description: string; severity: string }) => ({
          offerLetterId: offerLetter.id,
          type: flag.type,
          description: flag.description,
          severity: flag.severity,
        })
      );

      await OfferingModel.createRedFlags(redFlagsData);
    }

    // Return complete data
    return {
      id: offerLetter.id,
      title: offerLetter.title,
      fileUrl: offerLetter.fileUrl,
      status: offerLetter.status,
      createdAt: offerLetter.createdAt,
      analysis: offering,
      redFlags: redFlags,
    };
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
      throw new Error("Offer letter not found");
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
