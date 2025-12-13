import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = req.headers.get("x-user-id") as string;
    const { id } = await params;
    const offering = await prisma.offerLetter.findFirst({
      where: {
        userId,
        id,
      },
      include: {
        analysis: true,
        redFlags: true,
      },
    });

    if (!offering) {
      throw new Error("Offering letters not found");
    }
    return NextResponse.json({
      success: true,
      message: "Get offering by id success",
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
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = req.headers.get("x-user-id") as string;
    const { id } = await params;
    if (!id) {
      throw new Error("Offering letters not found");
    }
    const offering = await prisma.offerLetter.delete({
      where: {
        userId,
        id,
      },
      include: {
        analysis: true,
        redFlags: true,
      },
    });

    if (!offering) {
      throw new Error("Offering letters not found");
    }
    return NextResponse.json({
      success: true,
      message: "Delete offering by id success",
      data: offering,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "failed to get the offer letter",
      },
      { status: 500 }
    );
  }
}
