import os
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report


# ============================================================
# 1. LOAD DATASET
# ============================================================

DATA_PATH = "data/Resume.csv"
MODEL_DIR = "models"

os.makedirs(MODEL_DIR, exist_ok=True)

print("Loading dataset...")

df = pd.read_csv(DATA_PATH)

# Keep only the columns required for ML
df = df[["Resume_str", "Category"]].copy()

# Remove accidental whitespace
df["Resume_str"] = df["Resume_str"].astype(str).str.strip()
df["Category"] = df["Category"].astype(str).str.strip()

# Remove empty rows
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
# 3. TRAIN / TEST SPLIT
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
# 4. BUILD ML PIPELINE
# ============================================================

model = Pipeline([
    (
        "tfidf",
        TfidfVectorizer(
            lowercase=True,
            stop_words="english",
            ngram_range=(1, 2),
            max_features=50000,
            sublinear_tf=True
        )
    ),
    (
        "classifier",
        LogisticRegression(
            max_iter=2000,
            class_weight="balanced"
        )
    )
])


# ============================================================
# 5. TRAIN MODEL
# ============================================================

print("\nTraining HireSense ML model...")

model.fit(X_train, y_train)

print("Training completed!")


# ============================================================
# 6. EVALUATE MODEL
# ============================================================

print("\nEvaluating model...")

y_pred = model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)

print("\n========================================")
print("HIRESENSE ML MODEL RESULTS")
print("========================================")
print(f"Accuracy: {accuracy:.4f}")
print(f"Accuracy: {accuracy * 100:.2f}%")
print("========================================")

print("\nClassification Report:")
print(classification_report(y_test, y_pred, zero_division=0))


# ============================================================
# 7. SAVE MODEL
# ============================================================

model_path = os.path.join(
    MODEL_DIR,
    "resume_category_model.joblib"
)

joblib.dump(model, model_path)

print("\nModel saved successfully!")
print(f"Location: {model_path}")


# ============================================================
# 8. TEST WITH SAMPLE RESUME
# ============================================================

sample_resume = """
Python developer with experience in machine learning,
data analysis, pandas, numpy, scikit-learn,
TensorFlow and artificial intelligence.
"""

prediction = model.predict([sample_resume])[0]

print("\n========================================")
print("SAMPLE PREDICTION")
print("========================================")
print(f"Predicted Category: {prediction}")

# Show prediction probabilities
probabilities = model.predict_proba([sample_resume])[0]

classes = model.named_steps["classifier"].classes_

top_indices = probabilities.argsort()[-5:][::-1]

print("\nTop 5 Predictions:")

for index in top_indices:
    print(
        f"{classes[index]}: "
        f"{probabilities[index] * 100:.2f}%"
    )

print("========================================")