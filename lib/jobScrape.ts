import axios from 'axios';
import * as cheerio from 'cheerio';

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
  private baseUrl = 'https://www.linkedin.com';
  private headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  };

  async initialize() {
    console.log('✅ LinkedIn Scraper initialized');
  }

  async scrapeJobs(options: ScraperOptions): Promise<LinkedInJob[]> {
    const {
      keywords,
      location = 'Indonesia',
      maxJobs = 100,
      experienceLevel,
      jobType,
      techSkills = []
    } = options;

    try {
      const allJobs: LinkedInJob[] = [];
      const jobsPerPage = 25;
      const maxPages = Math.ceil(maxJobs / jobsPerPage); // Hitung berapa halaman yang dibutuhkan
      
      console.log(`🔍 Target: ${maxJobs} jobs, akan scrape ${maxPages} halaman`);

      // Buat beberapa variasi keyword untuk memperluas scope
      const keywordVariations = [
        keywords, // Keyword utama
        techSkills.length > 0 ? `${keywords} ${techSkills[0]}` : keywords, // Keyword + tech skill utama
      ];

      // Scrape multiple pages dengan berbagai keyword variations
      for (let pageNum = 0; pageNum < maxPages && allJobs.length < maxJobs; pageNum++) {
        for (const keywordVariation of keywordVariations) {
          if (allJobs.length >= maxJobs) break;

          const searchUrl = this.buildSearchUrl(keywordVariation, location, experienceLevel, jobType, pageNum);
          
          console.log(`🔍 Page ${pageNum + 1}, Keyword: "${keywordVariation}"`);
          
          try {
            // Fetch page using axios
            const response = await axios.get(searchUrl, {
              headers: this.headers,
              timeout: 15000,
              validateStatus: (status: number) => status === 200
            });

            // Parse HTML with cheerio
            const $ = cheerio.load(response.data);
            
            // Extract job cards
            const pageJobs = this.extractJobData($, maxJobs - allJobs.length, techSkills);
            
            if (pageJobs.length === 0) {
              console.log(`⚠️ No more jobs found on page ${pageNum + 1} with keyword "${keywordVariation}"`);
              continue;
            }

            // Filter duplicate jobs by linkedinJobId
            for (const job of pageJobs) {
              const isDuplicate = allJobs.some(existingJob => 
                existingJob.linkedinJobId === job.linkedinJobId && job.linkedinJobId !== ''
              );
              
              if (!isDuplicate && allJobs.length < maxJobs) {
                allJobs.push(job);
              }
            }

            console.log(`✅ Found ${pageJobs.length} jobs, Total unique: ${allJobs.length}/${maxJobs}`);

            // Delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (pageError: any) {
            console.error(`❌ Error on page ${pageNum + 1}:`, pageError.message);
            continue;
          }
        }
      }

      // Hitung skill match untuk semua jobs
      allJobs.forEach(job => {
        const matchCount = this.countSkillMatches(job.skills, techSkills);
        job.skillMatchCount = matchCount;
      });

      // Filter: prioritaskan job dengan skill match, tapi tetap tampilkan yang tidak match
      const jobsWithMatch = allJobs.filter(job => (job.skillMatchCount || 0) > 0);
      const jobsWithoutMatch = allJobs.filter(job => (job.skillMatchCount || 0) === 0);

      // Sort: job dengan skill match terbanyak di atas, sisanya di bawah
      const sortedJobsWithMatch = jobsWithMatch.sort((a, b) => {
        return (b.skillMatchCount || 0) - (a.skillMatchCount || 0);
      });

      // Gabungkan: jobs dengan match di atas, tanpa match di bawah
      const finalJobs = [...sortedJobsWithMatch, ...jobsWithoutMatch];

      console.log(`✅ Successfully scraped ${allJobs.length} total jobs`);
      console.log(`🎯 ${sortedJobsWithMatch.length} jobs with skill matches, ${jobsWithoutMatch.length} without`);
      if (sortedJobsWithMatch.length > 0) {
        console.log(`📊 Top match: ${sortedJobsWithMatch[0]?.skillMatchCount || 0} skills`);
      }
      
      return finalJobs;
    } catch (error: any) {
      console.error('❌ Error scraping jobs:', error.message);
      
      if (error.response) {
        console.error(`HTTP ${error.response.status}: ${error.response.statusText}`);
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
    const baseUrl = 'https://www.linkedin.com/jobs/search';
    const start = pageNum * 25; // LinkedIn shows 25 jobs per page
    
    const params = new URLSearchParams({
      keywords: keywords,
      location: location,
      sortBy: 'DD', // Sort by date (most recent first)
      position: '1',
      pageNum: pageNum.toString(),
      start: start.toString()
    });

    // Add filters
    if (experienceLevel) {
      params.append('f_E', experienceLevel); // 1=Internship, 2=Entry level, 3=Associate, 4=Mid-Senior, 5=Director, 6=Executive
    }

    if (jobType) {
      params.append('f_JT', jobType); // F=Full-time, P=Part-time, C=Contract, T=Temporary, I=Internship
    }

    return `${baseUrl}?${params.toString()}`;
  }

  private extractJobData($: ReturnType<typeof cheerio.load>, maxJobs: number, techSkills: string[] = []): LinkedInJob[] {
    const enrichedJobs: LinkedInJob[] = [];
    let count = 0;

    $('.base-card').each((index, element) => {
      if (count >= maxJobs) return false;

      try {
        const $card = $(element);
        
        const title = $card.find('.base-search-card__title').text().trim();
        const company = $card.find('.base-search-card__subtitle').text().trim();
        const location = $card.find('.job-search-card__location').text().trim();
        const applyUrl = $card.find('a.base-card__full-link').attr('href') || '';
        const dateAttr = $card.find('time').attr('datetime');
        const dateText = $card.find('.job-search-card__listdate, .job-search-card__listdate--new').text().trim();
        const snippet = $card.find('.base-search-card__snippet').text().trim();

        // Extract job ID from URL
        const jobIdMatch = applyUrl.match(/\/jobs\/view\/(\d+)/);
        const linkedinJobId = jobIdMatch ? jobIdMatch[1] : '';

        // Only add if has required fields
        if (title && company && applyUrl) {
          const enrichedJob: LinkedInJob = {
            title,
            company,
            location: location || 'Not specified',
            description: snippet || `${title} position at ${company}. Check LinkedIn for full details.`,
            applyUrl: applyUrl.startsWith('http') ? applyUrl : `https://www.linkedin.com${applyUrl}`,
            linkedinJobId,
            postedDate: dateAttr ? new Date(dateAttr) : this.parseRelativeDate(dateText),
            skills: this.extractSkills(title, snippet, techSkills),
            benefits: [],
            isRemote: this.isRemoteJob(location, title),
          };

          enrichedJobs.push(enrichedJob);
          count++;
        }
      } catch (error) {
        console.error('Error parsing job card:', error);
      }
    });

    console.log(`📦 Extracted ${enrichedJobs.length} valid jobs`);
    return enrichedJobs;
  }

  private parseRelativeDate(dateText: string): Date | undefined {
    if (!dateText) return undefined;
    
    const now = new Date();
    const lowerText = dateText.toLowerCase();
    
    if (lowerText.includes('just now') || lowerText.includes('today')) {
      return now;
    } else if (lowerText.includes('hour')) {
      const hours = parseInt(dateText) || 1;
      return new Date(now.getTime() - hours * 60 * 60 * 1000);
    } else if (lowerText.includes('day')) {
      const days = parseInt(dateText) || 1;
      return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    } else if (lowerText.includes('week')) {
      const weeks = parseInt(dateText) || 1;
      return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
    }
    
    return undefined;
  }

  private extractSkills(title: string, description: string, userTechSkills: string[] = []): string[] {
    const matchedSkills: string[] = [];
    const combinedText = `${title} ${description}`.toLowerCase();

    // Hanya cek tech skills dari user (dari AI)
    if (!userTechSkills || userTechSkills.length === 0) {
      return []; // Tidak ada tech skills dari user
    }

    // Cek setiap tech skill user apakah ada di job description
    userTechSkills.forEach(userSkill => {
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
    const remoteKeywords = ['remote', 'work from home', 'wfh', 'anywhere'];
    const combined = `${location} ${title}`.toLowerCase();
    return remoteKeywords.some(keyword => combined.includes(keyword));
  }

  async close() {
    // No cleanup needed for axios approach
    console.log('✅ Scraper closed');
  }

  // Scrape job details page
  async scrapeJobDetails(jobUrl: string): Promise<Partial<LinkedInJob>> {
    try {
      const response = await axios.get(jobUrl, {
        headers: this.headers,
        timeout: 10000
      });

      const $ = cheerio.load(response.data);

      // Extract job criteria
      const criteria: { [key: string]: string } = {};
      $('.description__job-criteria-item').each((_, element) => {
        const $el = $(element);
        const key = $el.find('.description__job-criteria-subheader').text().trim().toLowerCase();
        const value = $el.find('.description__job-criteria-text').text().trim();
        if (key && value) {
          criteria[key] = value;
        }
      });

      return {
        description: $('.description__text, .show-more-less-html__markup').text().trim(),
        employmentType: criteria['employment type'] || undefined,
        seniority: criteria['seniority level'] || undefined,
      };
    } catch (error) {
      console.error('Error scraping job details:', error);
      return {};
    }
  }
}
