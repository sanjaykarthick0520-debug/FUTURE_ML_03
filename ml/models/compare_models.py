import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.metrics import accuracy_score, classification_report


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
# 4. LOGISTIC REGRESSION BASELINE
# ============================================================

logistic_model = Pipeline([
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
# 5. LINEAR SVM MODEL
# ============================================================

svm_model = Pipeline([
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
        LinearSVC(
            class_weight="balanced",
            C=1.0
        )
    )
])


# ============================================================
# 6. TRAIN LOGISTIC REGRESSION
# ============================================================

print("\nTraining Logistic Regression...")

logistic_model.fit(X_train, y_train)

logistic_predictions = logistic_model.predict(X_test)

logistic_accuracy = accuracy_score(
    y_test,
    logistic_predictions
)


# ============================================================
# 7. TRAIN LINEAR SVM
# ============================================================

print("\nTraining Linear SVM...")

svm_model.fit(X_train, y_train)

svm_predictions = svm_model.predict(X_test)

svm_accuracy = accuracy_score(
    y_test,
    svm_predictions
)


# ============================================================
# 8. RESULTS
# ============================================================

print("\n")
print("========================================")
print("HIRESENSE MODEL COMPARISON")
print("========================================")

print(
    f"Logistic Regression Accuracy: "
    f"{logistic_accuracy * 100:.2f}%"
)

print(
    f"Linear SVM Accuracy: "
    f"{svm_accuracy * 100:.2f}%"
)

print("========================================")


# ============================================================
# 9. CLASSIFICATION REPORT — SVM
# ============================================================

print("\nLinear SVM Classification Report:")
print(
    classification_report(
        y_test,
        svm_predictions,
        zero_division=0
    )
)


# ============================================================
# 10. SELECT BEST MODEL
# ============================================================

if svm_accuracy > logistic_accuracy:

    print("\n🏆 BEST MODEL: Linear SVM")
    print(
        f"Improvement: "
        f"{(svm_accuracy - logistic_accuracy) * 100:.2f} percentage points"
    )

else:

    print("\n🏆 BEST MODEL: Logistic Regression")
    print(
        f"Improvement: "
        f"{(logistic_accuracy - svm_accuracy) * 100:.2f} percentage points"
    )