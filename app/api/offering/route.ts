import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

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

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 400 }
      );
    }

    // Validate file type (PDF only)
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Please input pdf file" },
        { status: 400 }
      );
    }

    // Convert file to base64 for Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64File = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Generate unique public_id
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-]/g, "_");
    const publicId = `offer-letters/${id}/${timestamp}-${sanitizedFileName}`;

    // Upload to Cloudinary
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
        fileUrl: fileUrl,
        status: "uploaded",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Offer letter uploaded",
      data: {
        id: offerLetter.id,
        fileUrl: offerLetter.fileUrl,
        status: offerLetter.status,
        createdAt: offerLetter.createdAt,
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