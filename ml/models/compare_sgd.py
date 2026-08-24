import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    classification_report
)


# ============================================================
# 1. LOAD DATASET
# ============================================================

DATA_PATH = "data/Resume.csv"

print("Loading dataset...")

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
# 3. SAME TRAIN / TEST SPLIT
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
# 4. TF-IDF + SGD CLASSIFIER
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
        SGDClassifier(
            loss="hinge",
            alpha=1e-4,
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

print("\nTraining SGD Classifier...")

model.fit(X_train, y_train)

print("Training completed!")


# ============================================================
# 6. PREDICT
# ============================================================

predictions = model.predict(X_test)


# ============================================================
# 7. EVALUATE
# ============================================================

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
print("=" * 60)
print("HIRESENSE — SGD CLASSIFIER")
print("=" * 60)

print(f"Accuracy:     {accuracy * 100:.2f}%")
print(f"Macro F1:     {macro_f1:.4f}")
print(f"Weighted F1:  {weighted_f1:.4f}")

print("=" * 60)


# ============================================================
# 8. CLASSIFICATION REPORT
# ============================================================

print("\nClassification Report:")

print(
    classification_report(
        y_test,
        predictions,
        zero_division=0
    )
)