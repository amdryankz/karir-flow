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
      const targetRawJobs = maxJobs + 15;
      const jobsPerPage = 25;
      const maxPages = Math.ceil(targetRawJobs / jobsPerPage) + 1;

      console.log(
        `🔍 Target: ${maxJobs} jobs (will scrape ~${targetRawJobs} raw jobs)`
      );

      const keywordParts = keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k);

      console.log(`🎯 Keywords: ${keywordParts.join(", ")}`);

      for (const currentKeyword of keywordParts) {
        if (allJobs.length >= targetRawJobs) break;

        console.log(`\n🔍 Searching: "${currentKeyword}"`);

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

            const $ = cheerio.load(response.data);

            const pageJobs = this.extractJobData(
              $,
              targetRawJobs - allJobs.length,
              techSkills
            );

            if (pageJobs.length === 0) {
              console.log(`⚠️ No jobs found on page ${pageNum + 1}`);
              break;
            }

            let newJobsAdded = 0;
            for (const job of pageJobs) {
              const isDuplicate = allJobs.some((existingJob) => {
                if (
                  job.linkedinJobId &&
                  existingJob.linkedinJobId === job.linkedinJobId
                ) {
                  return true;
                }
                const sameTitle =
                  existingJob.title.toLowerCase().trim() ===
                  job.title.toLowerCase().trim();
                const sameCompany =
                  existingJob.company.toLowerCase().trim() ===
                  job.company.toLowerCase().trim();
                return sameTitle && sameCompany;
              });

              if (!isDuplicate && allJobs.length < targetRawJobs) {
                allJobs.push(job);
                newJobsAdded++;
              }
            }

            console.log(
              `✅ Added ${newJobsAdded} jobs, Total: ${allJobs.length}/${targetRawJobs}`
            );

            if (allJobs.length >= targetRawJobs) break;

            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (pageError: any) {
            console.error(
              `❌ Error on page ${pageNum + 1}:`,
              pageError.message
            );
            continue;
          }
        }
      }

      const uniqueJobs: LinkedInJob[] = [];
      const seenKeys = new Set<string>();

      for (const job of allJobs) {
        const uniqueKey = job.linkedinJobId
          ? `id_${job.linkedinJobId}`
          : `tc_${job.title.toLowerCase().trim()}_${job.company
              .toLowerCase()
              .trim()}`;

        if (!seenKeys.has(uniqueKey)) {
          seenKeys.add(uniqueKey);
          uniqueJobs.push(job);
        }
      }

      console.log(`🔍 Deduplicated: ${allJobs.length} → ${uniqueJobs.length}`);

      uniqueJobs.forEach((job) => {
        job.skillMatchCount = this.countSkillMatches(job.skills, techSkills);
      });

      const jobsWithoutAsterisk = uniqueJobs.filter(
        (job) =>
          !job.title.includes("*") &&
          !job.company.includes("*") &&
          !job.location.includes("*") &&
          !job.description.includes("*")
      );

      const jobsWithMatch = jobsWithoutAsterisk.filter(
        (job) => (job.skillMatchCount || 0) > 0
      );
      const jobsWithoutMatch = jobsWithoutAsterisk.filter(
        (job) => (job.skillMatchCount || 0) === 0
      );

      const sortedJobsWithMatch = jobsWithMatch.sort(
        (a, b) => (b.skillMatchCount || 0) - (a.skillMatchCount || 0)
      );

      const finalJobs = [...sortedJobsWithMatch, ...jobsWithoutMatch].slice(
        0,
        maxJobs
      );

      console.log(
        `✅ Scraped ${uniqueJobs.length} jobs, filtered ${
          uniqueJobs.length - jobsWithoutAsterisk.length
        }, returning ${finalJobs.length}`
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
    const params = new URLSearchParams({
      keywords,
      location,
      sortBy: "DD",
      position: "1",
      pageNum: pageNum.toString(),
      start: (pageNum * 25).toString(),
    });

    if (experienceLevel) params.append("f_E", experienceLevel);
    if (jobType) params.append("f_JT", jobType);

    return `https://www.linkedin.com/jobs/search?${params.toString()}`;
  }

  private extractJobData(
    $: ReturnType<typeof cheerio.load>,
    maxJobs: number,
    techSkills: string[] = []
  ): LinkedInJob[] {
    const enrichedJobs: LinkedInJob[] = [];
    let count = 0;

    const selectors = [
      ".base-card",
      ".job-search-card",
      ".jobs-search__results-list li",
      "li.result-card",
    ];

    let $jobCards = $();
    for (const selector of selectors) {
      $jobCards = $(selector);
      if ($jobCards.length > 0) break;
    }

    $jobCards.each((index, element) => {
      if (count >= maxJobs) return false;

      try {
        const $card = $(element);

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

        const jobIdMatch = applyUrl.match(/\/jobs\/view\/(\d+)/);
        const linkedinJobId = jobIdMatch ? jobIdMatch[1] : "";

        if (title && company && applyUrl) {
          enrichedJobs.push({
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
          });
          count++;
        }
      } catch (error) {
        console.error("Error parsing job card:", error);
      }
    });

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
    if (!userTechSkills.length) return [];

    const combinedText = `${title} ${description}`.toLowerCase();
    return userTechSkills.filter((skill) =>
      combinedText.includes(skill.toLowerCase().trim())
    );
  }

  private countSkillMatches(jobSkills: string[], userSkills: string[]): number {
    return jobSkills.length;
  }

  private isRemoteJob(location: string, title: string): boolean {
    const remoteKeywords = ["remote", "work from home", "wfh", "anywhere"];
    const combined = `${location} ${title}`.toLowerCase();
    return remoteKeywords.some((keyword) => combined.includes(keyword));
  }

  async close() {
    console.log("✅ Scraper closed");
  }
}
