import prisma from "@/lib/prisma";

export interface DocumentData {
  fileName: string;
  pdfUrl: string;
  pageCount: number;
  extractedContent: string;
  userId: string;
}

export interface UpdateDocumentData extends DocumentData {
  documentId: string;
}

export class CvModel {
  static async getFirstDocument(userId?: string) {
    return await prisma.pdfDocument.findFirst({
      where: userId ? { userId } : undefined,
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
  }

  static async createDocument(data: DocumentData) {
    return await prisma.$transaction(async (tx) => {
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
  }

  static async updateDocument(data: UpdateDocumentData) {
    return await prisma.$transaction(async (tx) => {
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

      await tx.extractedText.update({
        where: {
          documentId: data.documentId,
        },
        data: {
          content: data.extractedContent,
        },
      });

      return updatedDocument;
    });
  }
}
