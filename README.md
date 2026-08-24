HireSense — AI-Powered Resume Analysis & Career Intelligence

HireSense is an AI-powered resume analysis platform that combines Machine Learning and Generative AI to evaluate resumes, predict career categories, and provide actionable insights based on a user's target job role.

The system analyzes an uploaded resume, extracts its content, predicts the most relevant career category using a trained ML model, and generates an ATS-style analysis using Gemini.

🚀 Key Features

📄 Resume Upload & Analysis

Upload resumes in PDF format

Automatically extract resume text

Store uploaded resumes and analysis results in PostgreSQL

Track resume analysis status

🤖 Machine Learning Career Prediction

HireSense uses a supervised Machine Learning pipeline to classify resumes into career categories.

ML Pipeline:

Resume Text → TF-IDF → SGD Classifier → Career Category

The final model achieved:

Metric

Score

Accuracy

71.63%

Macro F1

0.6708

Weighted F1

0.7062

The model supports 24 career categories:

ACCOUNTANT

ADVOCATE

AGRICULTURE

APPAREL

ARTS

AUTOMOBILE

AVIATION

BANKING

BPO

BUSINESS-DEVELOPMENT

CHEF

CONSTRUCTION

CONSULTANT

DESIGNER

DIGITAL-MEDIA

ENGINEERING

FINANCE

FITNESS

HEALTHCARE

HR

INFORMATION-TECHNOLOGY

PUBLIC-RELATIONS

SALES

TEACHER

🎯 Career Alignment

HireSense compares the ML-predicted career category with the user's selected target role and provides a career alignment indicator:

Strong Match

Moderate Match

Low Match

🧠 AI-Powered Resume Analysis

Gemini analyzes the resume against the selected target role and provides:

Overall ATS Score

Job Match Score

Keyword Match

Technical Skills

Experience Relevance

Project Relevance

Resume Structure

Strengths

Weaknesses

Missing Keywords

Improvement Suggestions

📊 Dashboard

The dashboard provides an overview of analyzed resumes, including:

Resume name

Target role

ATS score

ML predicted category

Analysis status

Uploaded date

📑 Detailed Analysis

Each analyzed resume has a dedicated analysis page containing:

ATS score

Job match score

Detailed score breakdown

ML career prediction

Career alignment

Strengths

Weaknesses

Missing keywords

Improvement suggestions

🔄 Resume Comparison

HireSense also supports comparing selected resumes to help evaluate candidates based on their analysis results.

🏗️ System Architecture

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

🧩 Project Structure

HireSense/
│
├── client/                         # React frontend
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   └── utils/
│   └── package.json
│
├── server/                         # Node.js + Express backend
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
│   └── package.json
│
└── ml/                             # Machine Learning service
    ├── api/
    ├── models/
    ├── dataset/
    └── requirements.txt

🛠️ Technology Stack

Frontend

React

Vite

JavaScript / JSX

CSS

Framer Motion

Lucide React

Backend

Node.js

Express.js

REST API

Multer

PDF.js

CORS

dotenv

Machine Learning

Python

Scikit-learn

Pandas

NumPy

TF-IDF Vectorization

SGDClassifier

Joblib

FastAPI

Uvicorn

Generative AI

Google Gemini API

Database

PostgreSQL

Prisma ORM

Development Environment

VS Code

PowerShell

Miniconda

🧠 Machine Learning Model

The HireSense ML model was developed specifically for resume career-category classification.

Dataset

Total resumes: 2,483

Career categories: 24

Training samples: 1,986

Testing samples: 497

Final Model Configuration

TF-IDF Vectorizer
N-grams: (1, 2)
Maximum Features: 75,000
Sublinear TF: False

SGD Classifier
Loss: hinge
Alpha: 1e-5

Final Performance

Accuracy:     71.63%
Macro F1:     0.6708
Weighted F1:  0.7062

The final model was selected after experimenting with different TF-IDF configurations and SGD hyperparameters.

🔬 Model Development Process

Dataset
   │
   ▼
Data Preparation
   │
   ▼
Baseline ML Models
   │
   ├── Ridge Classifier
   └── SGD Classifier
   │
   ▼
Feature Experimentation
   │
   └── Word + Character TF-IDF
   │
   ▼
Hyperparameter Tuning
   │
   ├── SGD tuning
   └── TF-IDF tuning
   │
   ▼
Final Model
   │
   ▼
71.63% Accuracy

🔌 API Services

HireSense consists of two main backend services.

Node.js API

http://localhost:5000

The Node.js backend handles:

Resume uploads

PDF processing

Gemini analysis

Database operations

Resume retrieval

Resume comparison

Resume deletion

ML API

http://127.0.0.1:8000

The FastAPI service handles:

Resume category prediction

ML model loading

ML inference

🔄 Resume Analysis Workflow

When a user uploads a resume:

1. User uploads PDF
        ↓
2. Express backend receives file
        ↓
3. PDF text is extracted
        ↓
4. Resume text is sent to ML API
        ↓
5. ML model predicts career category
        ↓
6. Resume + target role are sent to Gemini
        ↓
7. Gemini generates ATS analysis
        ↓
8. Results are stored in PostgreSQL
        ↓
9. Frontend receives complete analysis
        ↓
10. Dashboard + Analysis page display results

⚙️ Local Setup

Prerequisites

Make sure the following are installed:

Node.js

npm

Python

Miniconda

PostgreSQL database

Git

1. Clone the Repository

git clone <YOUR_REPOSITORY_URL>
cd HireSense

2. Setup Machine Learning Service

Navigate to the ML directory:

cd ml

Activate the Conda environment:

conda activate hiresense-ml

Install dependencies if required:

pip install -r requirements.txt

Start the ML API:

uvicorn api.app:app --host 127.0.0.1 --port 8000

The ML service will run at:

http://127.0.0.1:8000

3. Setup Backend

Open another terminal:

cd server

Install dependencies:

npm install

Create a .env file:

PORT=5000

DATABASE_URL="YOUR_POSTGRESQL_DATABASE_URL"

GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

JWT_SECRET="YOUR_SECRET_KEY"

Generate Prisma Client:

npx prisma generate

Start the backend:

npm start

The backend will run at:

http://localhost:5000

4. Setup Frontend

Open another terminal:

cd client

Install dependencies:

npm install

Start the development server:

npm run dev

Vite will display the local development URL, usually:

http://localhost:5173

🔐 Environment Variables

Never commit .env files or API keys to GitHub.

The project uses environment variables for:

PostgreSQL credentials

Gemini API key

JWT secret

Backend configuration

Example:

DATABASE_URL="YOUR_DATABASE_URL"
GEMINI_API_KEY="YOUR_API_KEY"
JWT_SECRET="YOUR_SECRET_KEY"

Add the following to .gitignore:

.env
.env.*
!.env.example

node_modules/
__pycache__/
*.pyc

.venv/
venv/

dist/
build/

*.log

uploads/

🧪 Testing

The ML service can be tested independently before running the complete application.

ML Health Check

curl http://127.0.0.1:8000/

ML Prediction

Send resume text to:

POST /predict

Example request:

{
  "resume_text": "Professional chef with experience in food preparation, kitchen operations and restaurant management."
}

Example response:

{
  "success": true,
  "predicted_category": "CHEF"
}

📈 Example Prediction

Input

Software engineer with experience in Python, Java,
React, Node.js, machine learning, SQL, REST APIs,
Git and cloud computing.

Output

Predicted Category: INFORMATION-TECHNOLOGY

The predicted category is stored with the resume and displayed throughout the HireSense application.

🎯 Project Goals

HireSense is designed to make resume evaluation more intelligent and useful by combining:

Machine Learning based career classification

Generative AI based resume analysis

ATS-style scoring

Career alignment

Resume comparison

Centralized resume management

The goal is to help candidates understand where their resume fits, how well it matches a target role, and what can be improved.

🚀 Future Enhancements

Potential future improvements include:

Resume skill extraction

Job description matching

Personalized career recommendations

Improved ML classification performance

Resume ranking

Candidate-job matching

More advanced analytics

User-specific resume management

Cloud deployment

👨‍💻 Project

HireSense — AI-Powered Resume Analysis & Career Intelligence

Built using:

React + Vite + Node.js + Express + Python + Scikit-learn + FastAPI + Gemini + PostgreSQL + Prisma

⭐ Support

If you find this project useful, consider giving the repository a ⭐.
