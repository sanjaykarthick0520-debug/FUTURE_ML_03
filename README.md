# HireSense — AI-Powered Resume Analysis & Career Intelligence

HireSense is an AI-powered resume analysis platform that combines **Machine Learning** and **Generative AI** to evaluate resumes, predict career categories, and provide actionable insights based on a user's target job role.

The system analyzes an uploaded resume, extracts its content, predicts the most relevant career category using a trained ML model, and generates an ATS-style analysis using Gemini.

---

## 🚀 Key Features

### 📄 Resume Upload & Analysis

- Upload resumes in PDF format
- Automatically extract resume text
- Store uploaded resumes and analysis results in PostgreSQL
- Track resume analysis status

### 🤖 Machine Learning Career Prediction

HireSense uses a supervised Machine Learning pipeline to classify resumes into career categories.

**ML Pipeline:**

```text
Resume Text → TF-IDF → SGD Classifier → Career Category
