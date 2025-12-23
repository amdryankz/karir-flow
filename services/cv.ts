import { BadRequestError } from "@/utils/customError";
import pdf from "pdf-parse";
import { uploadPdfBuffer, deletePdfFromStorage } from "@/lib/storage";
import { CvModel, DocumentData, updateCvData } from "@/models/cv";

export class CvService {
  static async getCvUser(userId?: string) {
    return await CvModel.getCvUser(userId);
  }

  static async parsePdfFile(file: File) {
    if (!file.size) {
      throw new BadRequestError("No file uploaded");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const data = await pdf(buffer);

    return {
      buffer,
      text: data.text,
      pageCount: data.numpages,
    };
  }

  static async createCv(file: File, userId: string) {
    const parsedData = await this.parsePdfFile(file);
    const pdfUrl = await uploadPdfBuffer(parsedData.buffer, file.name);

    const dbData: DocumentData = {
      fileName: file.name,
      pdfUrl: pdfUrl,
      pageCount: parsedData.pageCount,
      extractedContent: parsedData.text,
      userId: userId,
    };

    return await CvModel.createCv(dbData);
  }

  static async updateCv(file: File, userId: string) {
    const existingDocument = await CvModel.getCvUser(userId);

    if (!existingDocument) {
      throw new BadRequestError("No existing document found");
    }

    const parsedData = await this.parsePdfFile(file);

    await deletePdfFromStorage(existingDocument.pdfUrl);

    const pdfUrl = await uploadPdfBuffer(parsedData.buffer, file.name);

    const dbData: updateCvData = {
      documentId: existingDocument.id,
      fileName: file.name,
      pdfUrl: pdfUrl,
      pageCount: parsedData.pageCount,
      extractedContent: parsedData.text,
      userId: userId,
    };

    return await CvModel.updateCv(dbData);
  }
}
