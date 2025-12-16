# OPTIMA

**Optima** is an AI-powered career assistant platform designed to help job seekers navigate their career journey with confidence. From CV analysis and job recommendations to interview practice and offer letter evaluation, Optima provides comprehensive tools to enhance your job search experience.

## 🎯 What is Optima?

Optima is a modern web application built with Next.js that leverages artificial intelligence to provide:

- **CV Analysis**: Upload and analyze your CV to extract key information and insights
- **Job Recommendations**: Get personalized job recommendations based on your CV and skills
- **AI Interview Practice**: Practice interviews with AI-generated questions and receive real-time feedback on your responses, including speech pace, confidence level, and content quality
- **Offer Letter Analysis**: Upload and analyze job offer letters to identify red flags, compensation details, and negotiation opportunities
- **Career Dashboard**: Track your career progress and manage all your career-related documents in one place

## 🤔 Why Optima?

Job hunting can be overwhelming. Optima exists to:

1. **Democratize Career Preparation**: Provide professional-grade career tools accessible to everyone
2. **Build Confidence**: Help candidates prepare for interviews with AI-powered practice sessions
3. **Make Informed Decisions**: Analyze offer letters to identify potential issues and negotiation points
4. **Personalize Job Search**: Match candidates with relevant opportunities based on their unique skills and experience
5. **Save Time**: Streamline the job search process with intelligent automation

## ✨ Key Features

### 🎤 AI Interview Practice

- Practice with AI-generated interview questions
- Voice-based responses with real-time transcription
- Detailed feedback on content, tone, speech pace, and confidence
- Historical interview session tracking
- Voice synthesis for questions using ElevenLabs

### 📄 CV Management

- Upload and parse PDF CVs
- Extract structured information from CVs
- CV-based job matching
- Secure cloud storage

### 💼 Job Recommendations

- AI-powered job matching based on your CV
- Web scraping from major job platforms
- Personalized job suggestions
- Job details and application tracking

### 📋 Offer Letter Analysis

- Upload and analyze offer letters
- Identify potential red flags
- Compensation breakdown analysis
- Legal compliance checking
- Negotiation tips and recommendations

### 🎨 Modern UI/UX

- Dark/Light theme support
- Responsive design
- Smooth animations with Framer Motion
- Shadcn/UI components

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Better Auth](https://www.better-auth.com/) (Google & Facebook OAuth)
- **AI**: Google Gemini API
- **Voice**: ElevenLabs API
- **Storage**: Cloudinary & AWS S3
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + [Shadcn/UI](https://ui.shadcn.com/)
- **Styling**: Tailwind CSS 4
- **Forms**: React Hook Form + Zod
- **Runtime**: Bun

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- [Bun](https://bun.sh/) >= 1.0.0
- [Node.js](https://nodejs.org/) >= 18.0.0 (for compatibility)
- [PostgreSQL](https://www.postgresql.org/) >= 14.0
- Git

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/karir-flow.git
cd karir-flow
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Configure the following environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/karir_flow"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"

# AI Services
GEMINI_API_KEY="your-gemini-api-key"
ELEVENLABS_API_KEY="your-elevenlabs-api-key"
ELEVENLABS_VOICE_ID="your-voice-id"

# Storage (Optional)
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="your-region"
AWS_BUCKET_NAME="your-bucket"

CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 4. Database Setup

Run Prisma migrations to set up your database:

```bash
bun run postinstall  # Generates Prisma Client
bunx prisma migrate dev
```

### 5. Run the Development Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 How to Use

### For Job Seekers

1. **Sign Up/Login**: Create an account using Google or Facebook
2. **Upload Your CV**: Navigate to the Upload CV section and upload your resume
3. **Explore Job Recommendations**: View AI-generated job recommendations based on your CV
4. **Practice Interviews**:
   - Go to Practice Interview
   - Generate AI questions based on your profile
   - Answer using your microphone
   - Receive detailed feedback and tips
5. **Analyze Offer Letters**: Upload offer letters to get comprehensive analysis and negotiation tips
6. **Track Progress**: Use the dashboard to monitor your career journey

### API Usage

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API documentation.

## 📁 Project Structure

```
karir-flow/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (main)/            # Main application pages
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   └── ...               # Feature components
├── lib/                   # Utility libraries
├── services/              # Business logic services
├── models/                # Data models
├── prisma/               # Database schema and migrations
├── hooks/                # Custom React hooks
└── public/               # Static assets
```

## 🔧 Available Scripts

```bash
# Development
bun run dev              # Start development server

# Build
bun run build           # Build for production
bun run start           # Start production server

# Database
bunx prisma migrate dev  # Run migrations
bunx prisma studio       # Open Prisma Studio
bunx prisma generate     # Generate Prisma Client

# Linting
bun run lint            # Run ESLint
```

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [Vercel](https://vercel.com/) for hosting and deployment
- [Shadcn](https://ui.shadcn.com/) for the beautiful UI components
- [Google Gemini](https://ai.google.dev/) for AI capabilities
- [ElevenLabs](https://elevenlabs.io/) for voice synthesis
- All open-source contributors

---

**Made with ❤️ by the Optima Team**
