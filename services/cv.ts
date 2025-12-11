import { BadRequestError } from "@/utils/customError";
import { PDFParse } from "pdf-parse";
import { uploadPdfBuffer, deletePdfFromStorage } from "@/lib/storage";
import { CvModel, DocumentData, UpdateDocumentData } from "@/models/cv";

export class CvService {
  static async getFirstDocument(userId?: string) {
    return await CvModel.getFirstDocument(userId);
  }

  static async parsePdfFile(file: File) {
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

  static async createDocument(file: File, userId: string) {
    const parsedData = await this.parsePdfFile(file);
    const pdfUrl = await uploadPdfBuffer(parsedData.buffer, file.name);

    const dbData: DocumentData = {
      fileName: file.name,
      pdfUrl: pdfUrl,
      pageCount: parsedData.pageCount,
      extractedContent: parsedData.text,
      userId: userId,
    };

    return await CvModel.createDocument(dbData);
  }

  static async updateDocument(file: File, userId: string) {
    const existingDocument = await CvModel.getFirstDocument(userId);

    if (!existingDocument) {
      throw new BadRequestError("No existing document found");
    }

    const parsedData = await this.parsePdfFile(file);

    await deletePdfFromStorage(existingDocument.pdfUrl);

    const pdfUrl = await uploadPdfBuffer(parsedData.buffer, file.name);

    const dbData: UpdateDocumentData = {
      documentId: existingDocument.id,
      fileName: file.name,
      pdfUrl: pdfUrl,
      pageCount: parsedData.pageCount,
      extractedContent: parsedData.text,
      userId: userId,
    };

    return await CvModel.updateDocument(dbData);
  }
}
