import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline, FeatureUnion
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
# 2. FEATURES / TARGET
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
# 4. WORD + CHARACTER TF-IDF
# ============================================================

features = FeatureUnion([
    (
        "word_tfidf",
        TfidfVectorizer(
            lowercase=True,
            stop_words="english",
            ngram_range=(1, 2),
            max_features=50000,
            sublinear_tf=True
        )
    ),

    (
        "char_tfidf",
        TfidfVectorizer(
            analyzer="char_wb",
            ngram_range=(3, 5),
            max_features=30000,
            sublinear_tf=True
        )
    )
])


# ============================================================
# 5. COMPLETE MODEL PIPELINE
# ============================================================

model = Pipeline([
    ("features", features),

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
# 6. TRAIN
# ============================================================

print("\nTraining Word + Character TF-IDF + SGD...")

model.fit(X_train, y_train)

print("Training completed!")


# ============================================================
# 7. PREDICTION
# ============================================================

predictions = model.predict(X_test)


# ============================================================
# 8. EVALUATION
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
print("=" * 70)
print("HIRESENSE — WORD + CHARACTER TF-IDF + SGD")
print("=" * 70)

print(f"Accuracy:     {accuracy * 100:.2f}%")
print(f"Macro F1:     {macro_f1:.4f}")
print(f"Weighted F1:  {weighted_f1:.4f}")

print("=" * 70)


# ============================================================
# 9. CLASSIFICATION REPORT
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
# 10. COMPARISON WITH CURRENT CHAMPION
# ============================================================

baseline_accuracy = 0.7042
baseline_macro_f1 = 0.6613

print("\n")
print("=" * 70)
print("COMPARISON WITH CURRENT CHAMPION")
print("=" * 70)

print(
    f"Current SGD Accuracy: "
    f"{baseline_accuracy * 100:.2f}%"
)

print(
    f"Word + Character Accuracy: "
    f"{accuracy * 100:.2f}%"
)

print(
    f"Accuracy Difference: "
    f"{(accuracy - baseline_accuracy) * 100:+.2f} percentage points"
)

print()

print(
    f"Current SGD Macro F1: "
    f"{baseline_macro_f1:.4f}"
)

print(
    f"Word + Character Macro F1: "
    f"{macro_f1:.4f}"
)

print(
    f"Macro F1 Difference: "
    f"{macro_f1 - baseline_macro_f1:+.4f}"
)

print("=" * 70)


if macro_f1 > baseline_macro_f1:

    print("\n🏆 NEW BEST MODEL: Word + Character TF-IDF + SGD")

elif macro_f1 < baseline_macro_f1:

    print("\n🏆 CURRENT CHAMPION REMAINS: Word-level TF-IDF + SGD")

else:

    print("\n🤝 Both models have the same Macro F1.")