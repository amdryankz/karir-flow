import errorHandler from "@/utils/errorHandler";
import { NextRequest, NextResponse } from "next/server";
import { CvService } from "@/services/cv";

export async function GET(req: NextRequest) {
  try {
    const id = req.headers.get("x-user-id") as string;
    const data = await CvService.getCvUser(id);

    return NextResponse.json({
      message: "Successfully fetch data CV",
      data,
    });
  } catch (err) {
    const { message, status } = errorHandler(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const id = req.headers.get("x-user-id") as string;
    const formData = await req.formData();
    const file = formData.get("file") as File;

    const savedDocument = await CvService.createCv(file, id);

    return NextResponse.json({
      message: "PDF berhasil di-parse dan disimpan",
      documentId: savedDocument.id,
      pdfUrl: savedDocument.pdfUrl,
    });
  } catch (err) {
    const { message, status } = errorHandler(err);
    return NextResponse.json({ message }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const id = req.headers.get("x-user-id") as string;
    const formData = await req.formData();
    const file = formData.get("file") as File;

    const updatedDocument = await CvService.updateCv(file, id);

    return NextResponse.json({
      message: "Successfully updated CV",
      documentId: updatedDocument.id,
      pdfUrl: updatedDocument.pdfUrl,
    });
  } catch (err) {
    const { message, status } = errorHandler(err);
    return NextResponse.json({ message }, { status });
  }
}
