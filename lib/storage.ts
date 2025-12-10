import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.B2_REGION,
  endpoint: process.env.B2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APP_KEY!,
  },
});

export async function uploadPdfBuffer(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const sanitizedFileName = fileName
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.\-_]/g, "");
  const uniqueKey = `${Date.now()}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.B2_BUCKET_NAME,
    Key: uniqueKey,
    Body: buffer,
    ContentType: "application/pdf",
  });

  try {
    await s3Client.send(command);

    // const bucketName = process.env.B2_BUCKET_NAME;
    // const region = process.env.B2_REGION;

    // const pdfUrl = `https://${bucketName}.s3.${region}.backblazeb2.com/${uniqueKey}`;

    const getCommand = new GetObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: uniqueKey,
    });

    const pdfUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: 604800,
    });

    return pdfUrl;
  } catch (error) {
    console.error("❌ Gagal upload ke Backblaze:", error);
    throw new Error("Gagal mengunggah file ke storage");
  }
}

export async function deletePdfFromStorage(pdfUrl: string): Promise<void> {
  try {
    let fileKey: string;

    if (pdfUrl.includes("X-Amz-Signature")) {
      const url = new URL(pdfUrl);
      fileKey = url.pathname.substring(1);
    } else {
      fileKey = pdfUrl;
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: fileKey,
    });

    await s3Client.send(command);
  } catch (err) {
    console.error("❌ Gagal menghapus file dari Backblaze:", err);
    throw new Error("Gagal menghapus file dari storage");
  }
}
