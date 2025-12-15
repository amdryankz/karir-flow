import { NextRequest, NextResponse } from "next/server";
import { OfferingService } from "@/services/offering";
import errorHandler from "@/utils/errorHandler";

export async function POST(req: NextRequest) {
  try {
    const id = req.headers.get("x-user-id") as string;

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;

    const result = await OfferingService.uploadAndAnalyzeOfferLetter({
      file,
      title,
      userId: id,
    });

    return NextResponse.json({
      success: true,
      message: "Offer letter uploaded and analyzed",
      data: result,
    });
  } catch (error) {
    const { message, status } = errorHandler(error);
    return NextResponse.json({ success: false, message }, { status });
  }
}

export async function GET(req: NextRequest) {
  try {
    const id = req.headers.get("x-user-id") as string;

    const offering = await OfferingService.getAllOfferLetters(id);

    return NextResponse.json({
      success: true,
      message: "get all offering letter success",
      data: offering,
    });
  } catch (error) {
    const { message, status } = errorHandler(error);
    return NextResponse.json({ success: false, message }, { status });
  }
}
