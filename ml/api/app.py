from pathlib import Path

import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "models" / "resume_category_model.joblib"


# ============================================================
# LOAD MODEL
# ============================================================

print("Loading HireSense ML model...")

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Model not found at: {MODEL_PATH}"
    )

model = joblib.load(MODEL_PATH)

print("HireSense ML model loaded successfully!")


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="HireSense ML API",
    description="Resume category prediction service for HireSense",
    version="1.0.0"
)


# ============================================================
# REQUEST MODEL
# ============================================================

class ResumeRequest(BaseModel):
    resume_text: str


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "HireSense ML API",
        "model": "TF-IDF + SGDClassifier"
    }


# ============================================================
# PREDICTION ENDPOINT
# ============================================================

@app.post("/predict")
def predict_resume(request: ResumeRequest):

    resume_text = request.resume_text.strip()

    if not resume_text:
        raise HTTPException(
            status_code=400,
            detail="Resume text cannot be empty."
        )

    prediction = model.predict(
        [resume_text]
    )[0]

    return {
        "success": True,
        "predicted_category": prediction
    }