import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    classification_report
)


# ============================================================
# 1. LOAD DATA
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
# 3. SAME STRATIFIED SPLIT FOR ALL MODELS
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
# 4. COMMON TF-IDF SETTINGS
# ============================================================

def create_tfidf():
    return TfidfVectorizer(
        lowercase=True,
        stop_words="english",
        ngram_range=(1, 2),
        max_features=50000,
        sublinear_tf=True
    )


# ============================================================
# 5. MODELS
# ============================================================

models = {

    "Logistic Regression": Pipeline([
        ("tfidf", create_tfidf()),
        (
            "classifier",
            LogisticRegression(
                max_iter=2000,
                class_weight="balanced"
            )
        )
    ]),

    "Linear SVM": Pipeline([
        ("tfidf", create_tfidf()),
        (
            "classifier",
            LinearSVC(
                class_weight="balanced",
                C=1.0
            )
        )
    ]),

    "Multinomial Naive Bayes": Pipeline([
        ("tfidf", create_tfidf()),
        (
            "classifier",
            MultinomialNB(alpha=0.1)
        )
    ])
}


# ============================================================
# 6. TRAIN + EVALUATE
# ============================================================

results = {}

for name, model in models.items():

    print("\n" + "=" * 50)
    print(f"Training {name}...")
    print("=" * 50)

    model.fit(X_train, y_train)

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

    results[name] = {
        "accuracy": accuracy,
        "macro_f1": macro_f1,
        "weighted_f1": weighted_f1
    }

    print(
        f"Accuracy: {accuracy * 100:.2f}%"
    )

    print(
        f"Macro F1: {macro_f1:.4f}"
    )

    print(
        f"Weighted F1: {weighted_f1:.4f}"
    )

    if name == "Multinomial Naive Bayes":

        print("\nNaive Bayes Classification Report:")
        print(
            classification_report(
                y_test,
                predictions,
                zero_division=0
            )
        )


# ============================================================
# 7. FINAL COMPARISON
# ============================================================

print("\n")
print("=" * 70)
print("HIRESENSE — THREE MODEL COMPARISON")
print("=" * 70)

print(
    f"{'Model':<28}"
    f"{'Accuracy':>12}"
    f"{'Macro F1':>12}"
    f"{'Weighted F1':>15}"
)

print("-" * 70)

for name, metrics in results.items():

    print(
        f"{name:<28}"
        f"{metrics['accuracy'] * 100:>11.2f}%"
        f"{metrics['macro_f1']:>12.4f}"
        f"{metrics['weighted_f1']:>15.4f}"
    )

print("=" * 70)


# ============================================================
# 8. SELECT BEST MODEL BY MACRO F1
# ============================================================

best_model = max(
    results,
    key=lambda name: results[name]["macro_f1"]
)

print(
    f"\n🏆 Best model by Macro F1: {best_model}"
)

print(
    f"Accuracy: "
    f"{results[best_model]['accuracy'] * 100:.2f}%"
)

print(
    f"Macro F1: "
    f"{results[best_model]['macro_f1']:.4f}"
)