import { LinkedInScraper } from "@/lib/jobScrape";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/job-recommendation
 * Scrape lowongan pekerjaan dari LinkedIn berdasarkan analisis CV
 */
export async function GET(req: NextRequest) {
  console.log("📍 Starting job recommendation API...");

  try {
    const id = req.headers.get("x-user-id") as string;
    console.log("👤 User ID:", id);

    if (!id) {
      console.log("❌ No user ID provided");
      return NextResponse.json(
        {
          success: false,
          error: "User ID tidak ditemukan. Silakan login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    console.log("🔍 Fetching PDF from database...");
    // Ambil PDF CV dari database
    const pdf = await prisma.pdfDocument.findFirst({
      where: {
        userId: id,
      },
      include: {
        extractedText: true,
      },
    });

    if (!pdf || !pdf.extractedText) {
      console.log("❌ PDF not found for user:", id);
      return NextResponse.json(
        {
          success: false,
          error: "CV tidak ditemukan. Silakan upload CV terlebih dahulu.",
        },
        { status: 404 }
      );
    }

    console.log("✅ PDF found:", pdf.id);
    const cvText = pdf.extractedText.content;

    if (!cvText) {
      console.log("❌ CV content is empty");
      return NextResponse.json(
        {
          success: false,
          error: "Konten CV kosong. Silakan upload CV yang valid.",
        },
        { status: 400 }
      );
    }

    console.log("📄 CV text length:", cvText.length);

    // Check GEMINI_API_KEY
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY not found in environment variables");
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_API_KEY tidak ditemukan",
        },
        { status: 500 }
      );
    }

    console.log("🤖 Initializing Gemini AI...");
    // Inisialisasi Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `Analisis CV berikut dan ekstrak informasi untuk pencarian lowongan pekerjaan.

CV Text:
${cvText}

Berikan output dalam format JSON dengan struktur berikut:
{
  "keywords": "job title atau role yang paling sesuai dengan CV ini (contoh: Software Engineer, Data Analyst, Frontend Developer). JANGAN sertakan tipe pekerjaan seperti Intern, Contract, Full-time dll. Fokus hanya pada role/posisi.",
  "techSkills": ["daftar", "teknologi", "dan", "programming language", "yang", "dikuasai"]
}

Pastikan:
- keywords adalah job title/role yang relevan (contoh: "Backend Developer", "UI/UX Designer", "Data Scientist")
- JANGAN tambahkan tipe kontrak seperti Intern, Contract, Remote, WFO, Full-time, Part-time
- techSkills adalah array berisi teknologi spesifik (bahasa pemrograman, framework, tools, dll)`;

    console.log("🤖 Menganalisis CV dengan AI...");
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    console.log("📝 AI Response:", responseText);

    const { keywords, techSkills } = JSON.parse(responseText);

    const location = "Indonesia";
    const maxJobs = 150;

    console.log("✅ AI Analysis:", { keywords, techSkills });
    console.log(
      `🔍 Searching jobs: keyword="${keywords}", location="${location}", techSkills=[${techSkills.join(
        ", "
      )}], limit=${maxJobs}`
    );

    const scraper = new LinkedInScraper();
    await scraper.initialize();

    console.log("🕷️ Starting scraping...");
    const jobs = await scraper.scrapeJobs({
      keywords,
      location,
      maxJobs,
      techSkills,
    });

    console.log(`✅ Scraping complete, found ${jobs.length} jobs`);
    await scraper.close();

    return NextResponse.json({
      success: true,
      searchParams: {
        keywords,
        location,
        techSkills,
        maxJobs,
      },
      totalResults: jobs.length,
      jobs: jobs.map((job) => ({
        title: job.title,
        company: job.company,
        location: job.location,
        date: job.postedDate,
        jobUrl: job.applyUrl,
        description: job.description,
        skills: job.skills,
        isRemote: job.isRemote,
        skillMatchCount: job.skillMatchCount,
      })),
    });
  } catch (error: any) {
    console.error("❌ FATAL ERROR in job-recommendation:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error object:", JSON.stringify(error, null, 2));

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
        errorName: error.name,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
