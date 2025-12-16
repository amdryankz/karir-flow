import axios from "axios";
import * as cheerio from "cheerio";

export interface LinkedInJob {
  title: string;
  company: string;
  location: string;
  description: string;
  employmentType?: string;
  seniority?: string;
  salary?: string;
  postedDate?: Date;
  applyUrl: string;
  companyLogo?: string;
  skills: string[];
  benefits: string[];
  isRemote: boolean;
  linkedinJobId?: string;
  skillMatchCount?: number; // Jumlah skill yang match dengan CV user
}

interface ScraperOptions {
  keywords: string;
  location?: string;
  maxJobs?: number;
  experienceLevel?: string;
  jobType?: string;
  techSkills?: string[];
}

export class LinkedInScraper {
  private headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
  };

  async initialize() {
    console.log("✅ LinkedIn Scraper initialized");
  }

  async scrapeJobs(options: ScraperOptions): Promise<LinkedInJob[]> {
    const {
      keywords,
      location = "Indonesia",
      maxJobs = 100,
      experienceLevel,
      jobType,
      techSkills = [],
    } = options;

    try {
      const allJobs: LinkedInJob[] = [];
      const targetRawJobs = maxJobs + 15; // Scrape lebih banyak untuk antisipasi filter (misal: 40 + 15 = 55)
      const jobsPerPage = 25; // LinkedIn menampilkan 25 jobs per halaman
      const maxPages = Math.ceil(targetRawJobs / jobsPerPage) + 1; // Hitung pages yang dibutuhkan

      console.log(
        `🔍 Target: ${maxJobs} jobs (will scrape ~${targetRawJobs} raw jobs), ${maxPages} halaman`
      );

      // Pisahkan keywords berdasarkan koma (prioritas dari kiri ke kanan)
      const keywordParts = keywords.split(",").map((k) => k.trim()).filter(k => k);
      
      console.log(`🎯 Keywords to search (in order): ${keywordParts.join(", ")}`);

      // Scrape dengan setiap keyword SATU PER SATU sampai cukup
      for (const currentKeyword of keywordParts) {
        if (allJobs.length >= targetRawJobs) break;

        console.log(`\n🔍 Searching with keyword: "${currentKeyword}"`);
        
        // Scrape multiple pages untuk keyword ini
        for (
          let pageNum = 0;
          pageNum < maxPages && allJobs.length < targetRawJobs;
          pageNum++
        ) {
          const searchUrl = this.buildSearchUrl(
            currentKeyword,
            location,
            experienceLevel,
            jobType,
            pageNum
          );

          console.log(`📄 Page ${pageNum + 1} for "${currentKeyword}"`);

          try {
            // Fetch page using axios
            const response = await axios.get(searchUrl, {
              headers: this.headers,
              timeout: 15000,
              validateStatus: (status: number) => status === 200,
            });

            // Parse HTML with cheerio
            const $ = cheerio.load(response.data);

            // Debug: Check what selectors exist
            const baseCardCount = $(".base-card").length;
            const jobCardCount = $(
              ".job-search-card, .jobs-search__results-list li"
            ).length;
            console.log(
              `🔍 Debug: base-card count: ${baseCardCount}, job-card count: ${jobCardCount}`
            );

            if (baseCardCount === 0 && jobCardCount === 0) {
              console.log(
                "⚠️ No job cards found - LinkedIn may have changed HTML structure or blocked request"
              );
            }

            // Extract job cards
            const pageJobs = this.extractJobData(
              $,
              targetRawJobs - allJobs.length,
              techSkills
            );

            if (pageJobs.length === 0) {
              console.log(
                `⚠️ No more jobs found on page ${pageNum + 1} with keyword "${currentKeyword}"`
              );
              break; // Stop paging untuk keyword ini, lanjut keyword berikutnya
            }

            // Filter duplicate jobs by linkedinJobId
            let newJobsAdded = 0;
            for (const job of pageJobs) {
              const isDuplicate = allJobs.some(
                (existingJob) =>
                  existingJob.linkedinJobId === job.linkedinJobId &&
                  job.linkedinJobId !== ""
              );

              if (!isDuplicate && allJobs.length < targetRawJobs) {
                allJobs.push(job);
                newJobsAdded++;
              }
            }

            console.log(
              `✅ Added ${newJobsAdded} new jobs, Total unique: ${allJobs.length}/${targetRawJobs} (target final: ${maxJobs})`
            );

            // Jika sudah cukup, stop scraping
            if (allJobs.length >= targetRawJobs) {
              console.log(`🎯 Target reached! Stopping scrape.`);
              break;
            }

            // Delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (pageError: any) {
            console.error(
              `❌ Error on page ${pageNum + 1}:`,
              pageError.message
            );
            continue;
          }
        }
        
        console.log(`✅ Finished scraping keyword "${currentKeyword}". Total jobs: ${allJobs.length}`);
      }

      // Hitung skill match untuk semua jobs
      allJobs.forEach((job) => {
        const matchCount = this.countSkillMatches(job.skills, techSkills);
        job.skillMatchCount = matchCount;
      });

      // Filter: Hapus job yang mengandung asterisk (*)
      const jobsWithoutAsterisk = allJobs.filter((job) => {
        const hasAsterisk =
          job.title.includes("*") ||
          job.company.includes("*") ||
          job.location.includes("*") ||
          job.description.includes("*");
        return !hasAsterisk;
      });

      // Filter: prioritaskan job dengan skill match, tapi tetap tampilkan yang tidak match
      const jobsWithMatch = jobsWithoutAsterisk.filter(
        (job) => (job.skillMatchCount || 0) > 0
      );
      const jobsWithoutMatch = jobsWithoutAsterisk.filter(
        (job) => (job.skillMatchCount || 0) === 0
      );

      // Sort: job dengan skill match terbanyak di atas, sisanya di bawah
      const sortedJobsWithMatch = jobsWithMatch.sort((a, b) => {
        return (b.skillMatchCount || 0) - (a.skillMatchCount || 0);
      });

      // Gabungkan: jobs dengan match di atas, tanpa match di bawah
      let finalJobs = [...sortedJobsWithMatch, ...jobsWithoutMatch];

      // Apply max limit
      finalJobs = finalJobs.slice(0, maxJobs);

      console.log(`✅ Successfully scraped ${allJobs.length} raw jobs`);
      console.log(
        `🧹 ${
          allJobs.length - jobsWithoutAsterisk.length
        } jobs filtered out (contain asterisk)`
      );
      console.log(
        `🎯 After filter: ${sortedJobsWithMatch.length} jobs with skill matches, ${jobsWithoutMatch.length} without`
      );
      if (sortedJobsWithMatch.length > 0) {
        console.log(
          `📊 Top match: ${sortedJobsWithMatch[0]?.skillMatchCount || 0} skills`
        );
      }
      console.log(
        `📦 Returning top ${finalJobs.length} jobs (limit: ${maxJobs})`
      );

      return finalJobs;
    } catch (error: any) {
      console.error("❌ Error scraping jobs:", error.message);

      if (error.response) {
        console.error(
          `HTTP ${error.response.status}: ${error.response.statusText}`
        );
      }

      throw new Error(`Failed to scrape LinkedIn: ${error.message}`);
    }
  }

  private buildSearchUrl(
    keywords: string,
    location: string,
    experienceLevel?: string,
    jobType?: string,
    pageNum: number = 0
  ): string {
    const baseUrl = "https://www.linkedin.com/jobs/search";
    const start = pageNum * 25; // LinkedIn shows 25 jobs per page

    const params = new URLSearchParams({
      keywords: keywords,
      location: location,
      sortBy: "DD", // Sort by date (most recent first)
      position: "1",
      pageNum: pageNum.toString(),
      start: start.toString(),
    });

    // Add filters
    if (experienceLevel) {
      params.append("f_E", experienceLevel); // 1=Internship, 2=Entry level, 3=Associate, 4=Mid-Senior, 5=Director, 6=Executive
    }

    if (jobType) {
      params.append("f_JT", jobType); // F=Full-time, P=Part-time, C=Contract, T=Temporary, I=Internship
    }

    return `${baseUrl}?${params.toString()}`;
  }

  private extractJobData(
    $: ReturnType<typeof cheerio.load>,
    maxJobs: number,
    techSkills: string[] = []
  ): LinkedInJob[] {
    const enrichedJobs: LinkedInJob[] = [];
    let count = 0;

    // Try multiple selectors - LinkedIn changes these frequently
    const selectors = [
      ".base-card",
      ".job-search-card",
      ".jobs-search__results-list li",
      "li.result-card",
    ];

    let $jobCards = $();
    for (const selector of selectors) {
      $jobCards = $(selector);
      if ($jobCards.length > 0) {
        console.log(
          `✅ Using selector: ${selector} (${$jobCards.length} cards found)`
        );
        break;
      }
    }

    $jobCards.each((index, element) => {
      if (count >= maxJobs) return false;

      try {
        const $card = $(element);

        // Try multiple selectors for each field
        const title = (
          $card.find(".base-search-card__title").text() ||
          $card.find(".job-search-card__title").text() ||
          $card.find("h3, .result-card__title").text()
        ).trim();

        const company = (
          $card.find(".base-search-card__subtitle").text() ||
          $card.find(".job-search-card__company-name").text() ||
          $card.find("h4, .result-card__subtitle").text()
        ).trim();

        const location = (
          $card.find(".job-search-card__location").text() ||
          $card.find(".result-card__location").text()
        ).trim();

        const applyUrl =
          $card.find("a.base-card__full-link").attr("href") ||
          $card.find("a[href*='/jobs/view/']").attr("href") ||
          $card.find("a").first().attr("href") ||
          "";

        const dateAttr = $card.find("time").attr("datetime");
        const dateText = $card
          .find(
            ".job-search-card__listdate, .job-search-card__listdate--new, time"
          )
          .text()
          .trim();
        const snippet = (
          $card.find(".base-search-card__snippet").text() ||
          $card.find(".job-search-card__snippet").text()
        ).trim();

        // Extract job ID from URL
        const jobIdMatch = applyUrl.match(/\/jobs\/view\/(\d+)/);
        const linkedinJobId = jobIdMatch ? jobIdMatch[1] : "";

        // Only add if has required fields
        if (title && company && applyUrl) {
          const enrichedJob: LinkedInJob = {
            title,
            company,
            location: location || "Not specified",
            description:
              snippet ||
              `${title} position at ${company}. Check LinkedIn for full details.`,
            applyUrl: applyUrl.startsWith("http")
              ? applyUrl
              : `https://www.linkedin.com${applyUrl}`,
            linkedinJobId,
            postedDate: dateAttr
              ? new Date(dateAttr)
              : this.parseRelativeDate(dateText),
            skills: this.extractSkills(title, snippet, techSkills),
            benefits: [],
            isRemote: this.isRemoteJob(location, title),
          };

          enrichedJobs.push(enrichedJob);
          count++;
        }
      } catch (error) {
        console.error("Error parsing job card:", error);
      }
    });

    console.log(`📦 Extracted ${enrichedJobs.length} valid jobs`);
    return enrichedJobs;
  }

  private parseRelativeDate(dateText: string): Date | undefined {
    if (!dateText) return undefined;

    const now = new Date();
    const lowerText = dateText.toLowerCase();

    if (lowerText.includes("just now") || lowerText.includes("today")) {
      return now;
    } else if (lowerText.includes("hour")) {
      const hours = parseInt(dateText) || 1;
      return new Date(now.getTime() - hours * 60 * 60 * 1000);
    } else if (lowerText.includes("day")) {
      const days = parseInt(dateText) || 1;
      return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    } else if (lowerText.includes("week")) {
      const weeks = parseInt(dateText) || 1;
      return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
    }

    return undefined;
  }

  private extractSkills(
    title: string,
    description: string,
    userTechSkills: string[] = []
  ): string[] {
    const matchedSkills: string[] = [];
    const combinedText = `${title} ${description}`.toLowerCase();

    // Hanya cek tech skills dari user (dari AI)
    if (!userTechSkills || userTechSkills.length === 0) {
      return []; // Tidak ada tech skills dari user
    }

    // Cek setiap tech skill user apakah ada di job description
    userTechSkills.forEach((userSkill) => {
      const lowerSkill = userSkill.toLowerCase().trim();

      // Cek apakah skill ini ada di job (exact atau partial match)
      if (combinedText.includes(lowerSkill)) {
        matchedSkills.push(userSkill);
      }
    });

    return matchedSkills;
  }

  private countSkillMatches(jobSkills: string[], userSkills: string[]): number {
    // jobSkills sekarang sudah berisi tech stack yang match saja (dari extractSkills)
    // Jadi tinggal return length-nya
    return jobSkills.length;
  }

  private isRemoteJob(location: string, title: string): boolean {
    const remoteKeywords = ["remote", "work from home", "wfh", "anywhere"];
    const combined = `${location} ${title}`.toLowerCase();
    return remoteKeywords.some((keyword) => combined.includes(keyword));
  }

  async close() {
    // No cleanup needed for axios approach
    console.log("✅ Scraper closed");
  }

  // Scrape job details page
  async scrapeJobDetails(jobUrl: string): Promise<Partial<LinkedInJob>> {
    try {
      const response = await axios.get(jobUrl, {
        headers: this.headers,
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);

      // Extract job criteria
      const criteria: { [key: string]: string } = {};
      $(".description__job-criteria-item").each((_, element) => {
        const $el = $(element);
        const key = $el
          .find(".description__job-criteria-subheader")
          .text()
          .trim()
          .toLowerCase();
        const value = $el.find(".description__job-criteria-text").text().trim();
        if (key && value) {
          criteria[key] = value;
        }
      });

      return {
        description: $(".description__text, .show-more-less-html__markup")
          .text()
          .trim(),
        employmentType: criteria["employment type"] || undefined,
        seniority: criteria["seniority level"] || undefined,
      };
    } catch (error) {
      console.error("Error scraping job details:", error);
      return {};
    }
  }
}
