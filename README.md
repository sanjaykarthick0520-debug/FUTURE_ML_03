# HireSense — AI-Powered Resume Analysis & Career Intelligence

HireSense is an AI-powered resume analysis platform that combines **Machine Learning** and **Generative AI** to evaluate resumes, predict career categories, and provide actionable insights based on a user's target job role.

The system analyzes an uploaded resume, extracts its content, predicts the most relevant career category using a trained ML model, and generates an ATS-style analysis using Gemini.

---

## 🚀 Key Features

### 📄 Resume Upload & Analysis
- Upload resumes in PDF format.
- Automatically extract resume text.
- Store uploaded resumes and analysis results in PostgreSQL.
- Track resume analysis status.

### 🤖 Machine Learning Career Prediction
HireSense uses a supervised Machine Learning pipeline to classify resumes into career categories.

**ML Pipeline:**

`Resume Text → TF-IDF → SGD Classifier → Career Category`

The final model achieved:

| Metric | Score |
|---|---:|
| Accuracy | **71.63%** |
| Macro F1 | **0.6708** |
| Weighted F1 | **0.7062** |

The model supports **24 career categories**, including:

- ACCOUNTANT
- ADVOCATE
- AGRICULTURE
- APPAREL
- ARTS
- AUTOMOBILE
- AVIATION
- BANKING
- BPO
- BUSINESS-DEVELOPMENT
- CHEF
- CONSTRUCTION
- CONSULTANT
- DESIGNER
- DIGITAL-MEDIA
- ENGINEERING
- FINANCE
- FITNESS
- HEALTHCARE
- HR
- INFORMATION-TECHNOLOGY
- PUBLIC-RELATIONS
- SALES
- TEACHER

### 🎯 Career Alignment
HireSense compares the ML-predicted career category with the user's selected target role and provides a career alignment indicator:

- **Strong Match**
- **Moderate Match**
- **Low Match**

### 🧠 AI-Powered Resume Analysis

Gemini analyzes the resume against the selected target role and provides:

- Overall ATS Score
- Job Match Score
- Keyword Match
- Technical Skills
- Experience Relevance
- Project Relevance
- Resume Structure
- Strengths
- Weaknesses
- Missing Keywords
- Improvement Suggestions

### 📊 Dashboard

The dashboard provides an overview of analyzed resumes, including:

- Resume name
- Target role
- ATS score
- ML predicted category
- Analysis status
- Uploaded date

### 📑 Detailed Analysis

Each analyzed resume has a dedicated analysis page containing:

- ATS score
- Job match score
- Detailed score breakdown
- ML career prediction
- Career alignment
- Strengths
- Weaknesses
- Missing keywords
- Improvement suggestions

### 🔄 Resume Comparison

HireSense also supports comparing selected resumes to help evaluate candidates based on their analysis results.

---
# 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │      HireSense       │
                         │     Web Frontend     │
                         │      React + Vite    │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Node.js Backend    │
                         │   Express REST API   │
                         └───────┬────────┬─────┘
                                 │        │
                    ┌────────────┘        └─────────────┐
                    ▼                                   ▼
          ┌──────────────────┐                ┌──────────────────┐
          │  FastAPI ML API  │                │  Gemini AI API   │
          │  Python + ML     │                │ Generative AI    │
          └────────┬─────────┘                └────────┬─────────┘
                   │                                   │
                   ▼                                   │
          ┌──────────────────┐                         │
          │ TF-IDF + SGD     │                         │
          │ Resume Classifier│                         │
          └──────────────────┘                         │
                                                       │
                                                       ▼
                                            ┌──────────────────┐
                                            │ PostgreSQL /     │
                                            │ Prisma Database  │
                                            └──────────────────┘
