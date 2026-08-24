import os
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import accuracy_score, f1_score, classification_report


# ============================================================
# HIRESENSE FINAL ML MODEL
# TF-IDF + SGD CLASSIFIER
# ============================================================

DATA_PATH = "data/Resume.csv"
MODEL_PATH = "models/resume_category_model.joblib"


# ============================================================
# 1. LOAD DATASET
# ============================================================

print("Loading HireSense resume dataset...")

df = pd.read_csv(DATA_PATH)

df = df[["Resume_str", "Category"]].copy()

df["Resume_str"] = df["Resume_str"].astype(str).str.strip()
df["Category"] = df["Category"].astype(str).str.strip()

df = df[
    (df["Resume_str"] != "") &
    (df["Category"] != "")
]

print(f"Total resumes: {len(df)}")
print(f"Total categories: {df['Category'].nunique()}")


# ============================================================
# 2. FEATURES AND TARGET
# ============================================================

X = df["Resume_str"]
y = df["Category"]


# ============================================================
# 3. HOLD-OUT TEST SET
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print(f"Training samples: {len(X_train)}")
print(f"Testing samples: {len(X_test)}")


# ============================================================
# 4. FINAL MODEL PIPELINE
# ============================================================

model = Pipeline([
    (
        "tfidf",
        TfidfVectorizer(
            lowercase=True,
            stop_words="english",
            ngram_range=(1, 2),
            max_features=75000,
            sublinear_tf=False
        )
    ),
    (
        "classifier",
        SGDClassifier(
            loss="hinge",
            alpha=1e-5,
            max_iter=2000,
            tol=1e-3,
            class_weight="balanced",
            random_state=42
        )
    )
])


# ============================================================
# 5. TRAIN
# ============================================================

print("\nTraining final HireSense ML model...")

model.fit(X_train, y_train)

print("Training completed!")


# ============================================================
# 6. EVALUATE
# ============================================================

print("\nEvaluating final model...")

predictions = model.predict(X_test)

accuracy = accuracy_score(
    y_test,
    predictions
)

macro_f1 = f1_score(
    y_test,
    predictions,
    average="macro"
)

weighted_f1 = f1_score(
    y_test,
    predictions,
    average="weighted"
)


print("\n")
print("=" * 70)
print("HIRESENSE FINAL ML MODEL RESULTS")
print("=" * 70)

print(f"Accuracy:     {accuracy * 100:.2f}%")
print(f"Macro F1:     {macro_f1:.4f}")
print(f"Weighted F1:  {weighted_f1:.4f}")

print("=" * 70)


# ============================================================
# 7. CLASSIFICATION REPORT
# ============================================================

print("\nClassification Report:")

print(
    classification_report(
        y_test,
        predictions,
        zero_division=0
    )
)


# ============================================================
# 8. SAVE COMPLETE PIPELINE
# ============================================================

os.makedirs("models", exist_ok=True)

joblib.dump(
    model,
    MODEL_PATH
)

print("\nFinal model saved successfully!")
print(f"Model: {MODEL_PATH}")


# ============================================================
# 9. VERIFY SAVED MODEL
# ============================================================

loaded_model = joblib.load(MODEL_PATH)

print("Saved model loaded successfully!")


# ============================================================
# 10. SAMPLE PREDICTION
# ============================================================

sample_resume = """
Software developer with experience in Python,
machine learning, data analysis, SQL, REST APIs,
scikit-learn, pandas and artificial intelligence.
"""

prediction = loaded_model.predict(
    [sample_resume]
)[0]

print("\n")
print("=" * 70)
print("FINAL MODEL SAMPLE PREDICTION")
print("=" * 70)

print(f"Predicted Category: {prediction}")

print("=" * 70)