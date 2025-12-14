# API Documentation - Karir Flow

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints require authentication via header:

```
x-user-id: <user_id>
```

---

## Offer Letter APIs

### 1. Upload & Analyze Offer Letter

**Endpoint:** `POST /api/offering`

**Description:** Upload an offer letter PDF, store it in Cloudinary, and automatically analyze it using N8N webhook.

**Headers:**

```
x-user-id: <user_id>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | PDF file of the offer letter |
| title | String | Yes | Title/name for the offer letter |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Offer letter uploaded and analyzed",
  "data": {
    "id": "uuid",
    "title": "PT. Contoh Sukses Sejahtera",
    "fileUrl": "https://res.cloudinary.com/...",
    "status": "uploaded",
    "createdAt": "2025-12-13T10:30:00.000Z",
    "analysis": {
      "id": "uuid",
      "offerLetterId": "uuid",
      "baseSalaryAmount": "Rp 15.000.000",
      "bonusPolicy": "Performance bonus up to 20%",
      "equityValue": null,
      "allowances": "Transport, meal allowance",
      "totalCompensation": "Rp 18.000.000",
      "jobTitle": "Senior Software Engineer",
      "employmentType": "Full-time permanent",
      "workingHours": "Monday-Friday, 9AM-6PM",
      "workLocation": "Jakarta Office",
      "startDate": "2025-01-15",
      "probationTerms": "3 months probation period",
      "leavePolicy": "12 days annual leave",
      "competitivenessScore": 85,
      "clarityScore": 90,
      "legalComplexity": "Standard employment contract",
      "employerFavorability": "Balanced terms",
      "negotiationItems": "Base salary, signing bonus",
      "negotiationPhrases": "Suggested negotiation approaches",
      "missingItems": "Remote work policy not specified",
      "analyzedAt": "2025-12-13T10:30:00.000Z"
    },
    "redFlags": [
      {
        "type": "Compensation",
        "description": "No equity mentioned",
        "severity": "low"
      }
    ]
  }
}
```

**Error Responses:**

```json
// 401 - Unauthorized
{
  "error": "User ID not found. Please login first."
}

// 400 - Bad Request (No file)
{
  "error": "File not found"
}

// 400 - Bad Request (Invalid file type)
{
  "error": "Please input pdf file"
}

// 500 - Server Error
{
  "success": false,
  "error": "failed to upload offer letter"
}
```

---

### 2. Get All Offer Letters

**Endpoint:** `GET /api/offering`

**Description:** Retrieve all offer letters uploaded by the authenticated user.

**Headers:**

```
x-user-id: <user_id>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "get all offering letter success",
  "data": [
    {
      "id": "uuid",
      "userId": "user_id",
      "title": "PT. Contoh Sukses Sejahtera",
      "fileUrl": "https://res.cloudinary.com/...",
      "status": "uploaded",
      "createdAt": "2025-12-13T10:30:00.000Z"
    },
    {
      "id": "uuid",
      "userId": "user_id",
      "title": "Tech Company Offer",
      "fileUrl": "https://res.cloudinary.com/...",
      "status": "uploaded",
      "createdAt": "2025-12-12T15:20:00.000Z"
    }
  ]
}
```

**Error Responses:**

```json
// 500 - Not Found
{
  "success": false,
  "error": "Offering letters not found"
}

// 500 - Server Error
{
  "success": false,
  "error": "failed to get all offer letter"
}
```

---

### 3. Get Offer Letter by ID

**Endpoint:** `GET /api/offering/[id]`

**Description:** Get detailed information about a specific offer letter including analysis and red flags.

**Headers:**

```
x-user-id: <user_id>
```

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Offer letter UUID |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Get offering by id success",
  "data": {
    "id": "uuid",
    "userId": "user_id",
    "title": "PT. Contoh Sukses Sejahtera",
    "fileUrl": "https://res.cloudinary.com/...",
    "status": "uploaded",
    "createdAt": "2025-12-13T10:30:00.000Z",
    "analysis": {
      "id": "uuid",
      "offerLetterId": "uuid",
      "baseSalaryAmount": "Rp 15.000.000",
      "bonusPolicy": "Performance bonus up to 20%",
      ...
    },
    "redFlags": [
      {
        "id": "uuid",
        "offerLetterId": "uuid",
        "type": "Compensation",
        "description": "No equity mentioned",
        "severity": "low"
      }
    ]
  }
}
```

**Error Responses:**

```json
// 500 - Not Found
{
  "success": false,
  "error": "Offering letters not found"
}
```

---

### 4. Delete Offer Letter

**Endpoint:** `DELETE /api/offering/[id]`

**Description:** Delete an offer letter and its associated analysis and red flags.

**Headers:**

```
x-user-id: <user_id>
```

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Offer letter UUID |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Delete offering by id success",
  "data": {
    "id": "uuid",
    "userId": "user_id",
    "title": "PT. Contoh Sukses Sejahtera",
    "fileUrl": "https://res.cloudinary.com/...",
    "status": "uploaded",
    "createdAt": "2025-12-13T10:30:00.000Z"
  }
}
```

**Error Responses:**

```json
// 500 - Not Found
{
  "success": false,
  "error": "Offering letters not found"
}
```

---

## CV Management APIs

### 1. Get User CV

**Endpoint:** `GET /api/cv`

**Description:** Retrieve the first/latest CV document for the authenticated user.

**Headers:**

```
x-user-id: <user_id>
```

**Success Response (200):**

```json
{
  "message": "Successfully fetch data CV",
  "data": {
    "id": "uuid",
    "userId": "user_id",
    "fileName": "john_doe_cv.pdf",
    "pdfUrl": "https://res.cloudinary.com/...",
    "pageCount": 2,
    "uploadDate": "2025-12-13T10:30:00.000Z",
    "extractedText": {
      "id": "uuid",
      "documentId": "uuid",
      "content": "Full extracted text from PDF..."
    }
  }
}
```

**Error Responses:**

```json
{
  "message": "Error message"
}
```

---

### 2. Upload CV

**Endpoint:** `POST /api/cv`

**Description:** Upload a new CV PDF file, extract text, and store in database.

**Headers:**

```
x-user-id: <user_id>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | PDF file of the CV |

**Success Response (200):**

```json
{
  "message": "PDF berhasil di-parse dan disimpan",
  "documentId": "uuid",
  "pdfUrl": "https://res.cloudinary.com/..."
}
```

**Error Responses:**

```json
{
  "message": "Error message"
}
```

---

### 3. Update CV

**Endpoint:** `PUT /api/cv`

**Description:** Replace existing CV with a new PDF file.

**Headers:**

```
x-user-id: <user_id>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | New PDF file of the CV |

**Success Response (200):**

```json
{
  "message": "Successfully updated CV",
  "documentId": "uuid",
  "pdfUrl": "https://res.cloudinary.com/..."
}
```

**Error Responses:**

```json
{
  "message": "Error message"
}
```

---

## Job Recommendation API

### 1. Get Job Recommendations

**Endpoint:** `GET /api/job-recommendation`

**Description:** Analyze user's CV using Gemini AI and scrape relevant job listings from LinkedIn.

**Headers:**

```
x-user-id: <user_id>
```

**Query Parameters:** None (automatically uses user's CV)

**Success Response (200):**

```json
{
  "success": true,
  "searchParams": {
    "keywords": "Software Engineer",
    "location": "Indonesia",
    "techSkills": ["JavaScript", "React", "Node.js", "Python"],
    "maxJobs": 50
  },
  "totalResults": 45,
  "jobs": [
    {
      "title": "Senior Software Engineer",
      "company": "Tech Company Indonesia",
      "location": "Jakarta, Indonesia",
      "date": "2 days ago",
      "jobUrl": "https://www.linkedin.com/jobs/...",
      "description": "Job description text...",
      "skills": ["JavaScript", "React", "Node.js"],
      "isRemote": false,
      "skillMatchCount": 3
    }
  ]
}
```

**Error Responses:**

```json
// 401 - Unauthorized
{
  "success": false,
  "error": "User ID tidak ditemukan. Silakan login terlebih dahulu."
}

// 404 - CV Not Found
{
  "success": false,
  "error": "CV tidak ditemukan. Silakan upload CV terlebih dahulu."
}

// 400 - Empty CV
{
  "success": false,
  "error": "Konten CV kosong. Silakan upload CV yang valid."
}

// 500 - Server Error
{
  "success": false,
  "error": "Error message",
  "errorName": "ErrorName",
  "stack": "Stack trace (dev only)"
}
```

**Notes:**

- Maximum 50 jobs returned
- Jobs are sorted by skill match count (highest first)
- AI analyzes CV to extract job title and tech skills
- Scraping duration: ~30-60 seconds

---

## Interview Practice APIs

### 1. Get All Interviews

**Endpoint:** `GET /api/interview`

**Description:** Get all interview sessions for the authenticated user.

**Headers:**

```
x-user-id: <user_id>
```

**Success Response (200):**

```json
{
  "message": "Successfully fetch data interview",
  "data": [
    {
      "id": "uuid",
      "title": "Software Engineer Interview",
      "startedAt": "2025-12-13T10:30:00.000Z",
      "finishedAt": "2025-12-13T11:00:00.000Z",
      "totalScore": 85,
      "userId": "user_id",
      "questionSetId": "uuid",
      "parentId": null
    }
  ]
}
```

**Error Responses:**

```json
{
  "message": "Error message"
}
```

---

### 2. Create Interview Session

**Endpoint:** `POST /api/interview`

**Description:** Create a new interview practice session with generated questions or use existing question set.

**Headers:**

```
x-user-id: <user_id>
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "Software Engineer Interview Practice",
  "jobDesc": "Full stack developer position requiring React, Node.js...",
  "questionSetId": "uuid", // Optional: use existing question set
  "parentId": "uuid" // Optional: link to parent interview for retry
}
```

**Success Response (200):**

```json
{
  "message": "Successfully create session interview",
  "data": {
    "id": "uuid",
    "title": "Software Engineer Interview Practice",
    "startedAt": "2025-12-13T10:30:00.000Z",
    "finishedAt": null,
    "totalScore": null,
    "userId": "user_id",
    "questionSetId": "uuid",
    "parentId": null
  }
}
```

**Error Responses:**

```json
{
  "message": "Error message"
}
```

---

### 3. Get Interview by ID

**Endpoint:** `GET /api/interview/[id]`

**Description:** Get detailed information about a specific interview session including questions and answers.

**Headers:**

```
x-user-id: <user_id>
```

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Interview session UUID |

**Success Response (200):**

```json
{
  "message": "Successfully fetch interview data",
  "data": {
    "id": "uuid",
    "title": "Software Engineer Interview",
    "startedAt": "2025-12-13T10:30:00.000Z",
    "finishedAt": "2025-12-13T11:00:00.000Z",
    "totalScore": 85,
    "userId": "user_id",
    "questionSetId": "uuid",
    "questionSet": {
      "id": "uuid",
      "description": "Job description...",
      "questions": [
        {
          "id": "uuid",
          "text": "Tell me about yourself",
          "order": 1
        }
      ]
    },
    "answers": [
      {
        "id": "uuid",
        "transcription": "Answer transcription...",
        "audioUrl": "https://res.cloudinary.com/...",
        "feedbackContent": "Good answer structure...",
        "feedbackTone": "Confident and clear",
        "score": 85,
        "speechPace": "NORMAL",
        "confidentLevel": "HIGH",
        "tips": "Try to add more specific examples",
        "answeredAt": "2025-12-13T10:35:00.000Z",
        "questionId": "uuid"
      }
    ]
  }
}
```

**Error Responses:**

```json
// 404 - Not Found
{
  "message": "Interview not found"
}
```

**Notes:**

- Auto-finishes interview if all questions are answered
- Only returns interviews belonging to authenticated user

---

### 4. Generate Questions

**Endpoint:** `POST /api/interview/generate-question`

**Description:** Generate interview questions based on job description using AI.

**Headers:**

```
x-user-id: <user_id>
Content-Type: application/json
```

**Request Body:**

```json
{
  "jobDesc": "Full stack developer position requiring React, Node.js, PostgreSQL..."
}
```

**Success Response (200):**

```json
{
  "message": "Successfully generate data questions",
  "data": {
    "id": "uuid",
    "userId": "user_id",
    "description": "Full stack developer position...",
    "createdAt": "2025-12-13T10:30:00.000Z",
    "questions": [
      {
        "id": "uuid",
        "questionSetId": "uuid",
        "text": "Explain your experience with React hooks",
        "order": 1
      },
      {
        "id": "uuid",
        "questionSetId": "uuid",
        "text": "How do you handle state management in large applications?",
        "order": 2
      }
    ]
  }
}
```

**Error Responses:**

```json
{
  "message": "Error message"
}
```

---

### 5. Submit Answer

**Endpoint:** `POST /api/interview/answer`

**Description:** Submit audio answer for an interview question with automatic transcription and AI feedback.

**Headers:**

```
x-user-id: <user_id>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| audio | File | Yes | Audio file (WAV, MP3, etc.) |
| questionId | string | Yes | Question UUID |
| interviewSessionId | string | Yes | Interview session UUID |

**Success Response (200):**

```json
{
  "message": "Successfully created answer",
  "data": {
    "id": "uuid",
    "transcription": "I have 5 years of experience with React...",
    "audioUrl": "https://res.cloudinary.com/...",
    "feedbackContent": "Strong answer demonstrating practical experience...",
    "feedbackTone": "Confident and professional",
    "score": 85,
    "speechPace": "NORMAL",
    "confidentLevel": "HIGH",
    "tips": "Consider adding specific project examples",
    "answeredAt": "2025-12-13T10:35:00.000Z",
    "interviewSessionId": "uuid",
    "questionId": "uuid"
  }
}
```

**Error Responses:**

```json
{
  "message": "Error message"
}
```

---

### 6. Get All Question Sets

**Endpoint:** `GET /api/interview/question`

**Description:** Get all question sets created by the authenticated user.

**Headers:**

```
x-user-id: <user_id>
```

**Success Response (200):**

```json
{
  "message": "Successfully fetch data question",
  "data": [
    {
      "id": "uuid",
      "userId": "user_id",
      "description": "Full stack developer position...",
      "createdAt": "2025-12-13T10:30:00.000Z",
      "questions": [
        {
          "id": "uuid",
          "text": "Tell me about yourself",
          "order": 1
        }
      ]
    }
  ]
}
```

**Error Responses:**

```json
{
  "message": "Error message"
}
```

---

## Data Models

### OfferLetter

```typescript
{
  id: string; // UUID
  userId: string; // User ID
  title: string; // Offer letter title
  fileUrl: string; // Cloudinary URL
  status: string; // "uploaded" | "analyzed" | "failed"
  createdAt: Date; // Creation timestamp
}
```

### OfferAnalysis

```typescript
{
  id: string;
  offerLetterId: string;
  baseSalaryAmount?: string;
  bonusPolicy?: string;
  equityValue?: string;
  allowances?: string;
  totalCompensation?: string;
  jobTitle?: string;
  employmentType?: string;
  workingHours?: string;
  workLocation?: string;
  startDate?: string;
  probationTerms?: string;
  leavePolicy?: string;
  competitivenessScore?: number;
  competitivenessText?: string;
  clarityScore?: number;
  legalComplexity?: string;
  employerFavorability?: string;
  negotiationItems?: string;
  negotiationPhrases?: string;
  missingItems?: string;
  analyzedAt: Date;
}
```

### RedFlag

```typescript
{
  id: string;
  offerLetterId: string;
  type: string; // Category of red flag
  description: string; // Detailed description
  severity: string; // "low" | "medium" | "high"
}
```

### PdfDocument (CV)

```typescript
{
  id: string;
  userId: string;
  fileName: string;
  pdfUrl: string;
  pageCount: number;
  uploadDate: Date;
  extractedText?: {
    id: string;
    documentId: string;
    content: string;
  }
}
```

### QuestionSet

```typescript
{
  id: string;
  userId: string;
  description: string;    // Job description
  createdAt: Date;
  questions: Question[];
}
```

### Question

```typescript
{
  id: string;
  questionSetId: string;
  text: string; // Question text
  order: number; // Display order
}
```

### InterviewSession

```typescript
{
  id: string;
  title: string;
  startedAt: Date;
  finishedAt?: Date;
  totalScore?: number;
  userId: string;
  questionSetId: string;
  parentId?: string;      // For retry functionality
  questionSet?: QuestionSet;
  answers?: Answer[];
}
```

### Answer

```typescript
{
  id: string;
  transcription: string;
  audioUrl?: string;
  feedbackContent?: string;
  feedbackTone?: string;
  score: number;
  speechPace: "TOO_FAST" | "NORMAL" | "TOO_SLOW";
  confidentLevel: "HIGH" | "MEDIUM" | "LOW";
  tips?: string;
  answeredAt: Date;
  interviewSessionId: string;
  questionId: string;
}
```

### JobListing (Job Recommendation)

```typescript
{
  title: string;
  company: string;
  location: string;
  date: string;           // Posted date
  jobUrl: string;         // LinkedIn job URL
  description: string;
  skills: string[];
  isRemote: boolean;
  skillMatchCount: number;
}
```

---

## General Notes

### Authentication

- All endpoints require `x-user-id` header
- User ID is obtained from Better Auth session

### File Uploads

- **CV**: Only PDF files accepted
- **Offer Letters**: Only PDF files accepted
- **Audio Answers**: Various audio formats (WAV, MP3, etc.)
- Files stored in Cloudinary with organized folder structure

### AI Features

1. **Offer Letter Analysis**: Uses N8N webhook for PDF analysis
2. **Job Recommendations**: Uses Gemini AI to analyze CV and LinkedIn scraping
3. **Interview Questions**: AI-generated based on job description
4. **Answer Feedback**: AI evaluation of interview responses

### Error Handling

- All endpoints return consistent error format
- HTTP status codes: 200 (success), 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error)
- Error messages are descriptive and user-friendly

### Performance

- Job recommendation: 30-60 seconds (includes scraping)
- CV upload: ~5-10 seconds (includes text extraction)
- Offer letter analysis: ~10-20 seconds (includes N8N webhook)
- Interview answer: ~5-15 seconds (includes transcription and AI feedback)

### Limitations

- Maximum 50 jobs per job recommendation request
- CV: One per user (updates replace existing)
- Audio files: Depends on Cloudinary limits
