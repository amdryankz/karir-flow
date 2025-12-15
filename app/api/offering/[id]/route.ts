import { NextRequest, NextResponse } from "next/server";
import { OfferingService } from "@/services/offering";
import errorHandler from "@/utils/errorHandler";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = req.headers.get("x-user-id") as string;
    const { id } = await params;

    const offering = await OfferingService.getOfferLetterById(id, userId);

    return NextResponse.json({
      success: true,
      message: "Get offering by id success",
      data: offering,
    });
  } catch (error) {
    const { message, status } = errorHandler(error);
    return NextResponse.json({ success: false, message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = req.headers.get("x-user-id") as string;
    const { id } = await params;

    const offering = await OfferingService.deleteOfferLetter(id, userId);

    return NextResponse.json({
      success: true,
      message: "Delete offering by id success",
      data: offering,
    });
  } catch (error) {
    const { message, status } = errorHandler(error);
    return NextResponse.json({ success: false, message }, { status });
  }
}
