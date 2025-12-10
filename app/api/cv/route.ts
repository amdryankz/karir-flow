import prisma from "@/lib/prisma";
import { deletePdfFromStorage, uploadPdfBuffer } from "@/lib/storage";
import errorHandler from "@/utils/errorHandler";
import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

export async function GET() {
  try {
    const data = await prisma.pdfDocument.findMany({
      include: {
        user: {
          select: {
            name: true,
          },
        },
        extractedText: {
          select: {
            content: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Successfully fetch data CV",
      data,
    });
  } catch (err) {
    const { message, status } = errorHandler(err);
    return NextResponse.json({ message }, { status });
  }
}

interface DocumentData {
  fileName: string;
  pdfUrl: string;
  pageCount: number;
  extractedContent: string;
  userId: string;
}

export async function saveParsedData(data: DocumentData) {
  const result = await prisma.$transaction(async (tx) => {
    const newDocument = await tx.pdfDocument.create({
      data: {
        fileName: data.fileName,
        pdfUrl: data.pdfUrl,
        pageCount: data.pageCount,
        userId: data.userId,
      },
    });

    await tx.extractedText.create({
      data: {
        documentId: newDocument.id,
        content: data.extractedContent,
      },
    });

    return newDocument;
  });

  return result;
}

export async function POST(req: NextRequest) {
  try {
    const id = req.headers.get("x-user-id") as string;
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parser = new PDFParse({
      data: buffer,
      worker: undefined,
    });
    const data = await parser.getText();
    const info = await parser.getInfo({ parsePageInfo: true });

    const pdfUrl = await uploadPdfBuffer(buffer, file.name);

    const dbData = {
      fileName: file.name,
      pdfUrl: pdfUrl,
      pageCount: info.total,
      extractedContent: data.text,
      userId: id,
    };

    const savedDocument = await saveParsedData(dbData);

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

interface UpdateDocumentData extends DocumentData {
  documentId: string;
}

export async function updateParsedData(data: UpdateDocumentData) {
  const result = await prisma.$transaction(async (tx) => {
    const updatedDocument = await tx.pdfDocument.update({
      where: {
        id: data.documentId,
        userId: data.userId,
      },
      data: {
        fileName: data.fileName,
        pdfUrl: data.pdfUrl,
        pageCount: data.pageCount,
        uploadDate: new Date(),
      },
    });

    await tx.extractedText.updateMany({
      where: {
        documentId: data.documentId,
      },
      data: {
        content: data.extractedContent,
      },
    });

    return updatedDocument;
  });

  return result;
}

export async function PUT(req: NextRequest) {
  try {
    const id = req.headers.get("x-user-id") as string;
    const formData = await req.formData();

    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No new file uploaded" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parser = new PDFParse({
      data: buffer,
      worker: undefined,
    });
    const data = await parser.getText();
    const info = await parser.getInfo({ parsePageInfo: true });

    const document = await prisma.pdfDocument.findFirst({
      where: { userId: id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    await deletePdfFromStorage(document.pdfUrl);

    const pdfUrl = await uploadPdfBuffer(buffer, file.name);

    const dbData: UpdateDocumentData = {
      documentId: document.id,
      fileName: file.name,
      pdfUrl: pdfUrl,
      pageCount: info.total,
      extractedContent: data.text,
      userId: id,
    };

    const updatedDocument = await updateParsedData(dbData);

    return NextResponse.json({
      message: "PDF berhasil diperbarui",
      documentId: updatedDocument.id,
      pdfUrl: updatedDocument.pdfUrl,
    });
  } catch (err) {
    console.log(err);
    const { message, status } = errorHandler(err);
    return NextResponse.json({ message }, { status });
  }
}
