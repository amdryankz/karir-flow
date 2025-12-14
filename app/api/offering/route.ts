import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const id = req.headers.get("x-user-id") as string;

    if (!id) {
      return NextResponse.json(
        { error: "User ID not found. Please login first." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 400 });
    }

    // Validate file type (PDF only)
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Please input pdf file" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64File = `data:${file.type};base64,${buffer.toString("base64")}`;

    const timestamp = Date.now();
    const sanitizedFileName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-]/g, "_");
    const publicId = `offer-letters/${id}/${timestamp}-${sanitizedFileName}`;

    const uploadResult = await cloudinary.uploader.upload(base64File, {
      resource_type: "auto",
      public_id: publicId,
      folder: "offer-letters",
    });

    console.log(uploadResult);

    const fileUrl = uploadResult.secure_url;

    const offerLetter = await prisma.offerLetter.create({
      data: {
        userId: id,
        title: title,
        fileUrl: fileUrl,
        status: "uploaded",
      },
    });

    const analyzedOffer = await axios.post(
      "https://marsyandha-nayoan.app.n8n.cloud/webhook/analyze-offer",
      {
        offerLetterId: `${offerLetter.id}`,
        fileUrl: `${offerLetter.fileUrl}`,
      }
    );

    console.log(analyzedOffer, "<<<<<<<<<<<<<<<oferring");
    const { data } = analyzedOffer.data;
    const { offerAnalysis, redFlags } = data;

    const offering = await prisma.offerAnalysis.create({
      data: {
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
        analyzedAt: offerAnalysis.analyzedAt,
      },
    });

    // Create red flags if any
    if (redFlags && redFlags.length > 0) {
      await prisma.redFlag.createMany({
        data: redFlags.map((flag: any) => ({
          offerLetterId: offerLetter.id,
          type: flag.type,
          description: flag.description,
          severity: flag.severity,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Offer letter uploaded and analyzed",
      data: {
        id: offerLetter.id,
        title: offerLetter.title,
        fileUrl: offerLetter.fileUrl,
        status: offerLetter.status,
        createdAt: offerLetter.createdAt,
        analysis: offering,
        redFlags: redFlags,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "failed to upload offer letter",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const id = req.headers.get("x-user-id") as string;

    const offering = await prisma.offerLetter.findMany({
      where: {
        userId: id,
      },
    });

    if (!offering || offering.length === 0) {
      throw new Error("Offering letters not found");
    }
    return NextResponse.json({
      success: true,
      message: "get all offering letter success",
      data: offering,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "failed to get all offer letter",
      },
      { status: 500 }
    );
  }
}
