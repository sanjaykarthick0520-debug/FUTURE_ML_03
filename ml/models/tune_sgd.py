import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import accuracy_score, f1_score


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
# 4. HYPERPARAMETER CONFIGURATIONS
# ============================================================

configs = [

    {
        "name": "hinge_a1e-5",
        "loss": "hinge",
        "alpha": 1e-5
    },

    {
        "name": "hinge_a5e-5",
        "loss": "hinge",
        "alpha": 5e-5
    },

    {
        "name": "hinge_a1e-4",
        "loss": "hinge",
        "alpha": 1e-4
    },

    {
        "name": "hinge_a5e-4",
        "loss": "hinge",
        "alpha": 5e-4
    },

    {
        "name": "hinge_a1e-3",
        "loss": "hinge",
        "alpha": 1e-3
    },

    {
        "name": "modified_huber_a1e-5",
        "loss": "modified_huber",
        "alpha": 1e-5
    },

    {
        "name": "modified_huber_a5e-5",
        "loss": "modified_huber",
        "alpha": 5e-5
    },

    {
        "name": "modified_huber_a1e-4",
        "loss": "modified_huber",
        "alpha": 1e-4
    },

    {
        "name": "modified_huber_a5e-4",
        "loss": "modified_huber",
        "alpha": 5e-4
    },

    {
        "name": "log_loss_a1e-5",
        "loss": "log_loss",
        "alpha": 1e-5
    },

    {
        "name": "log_loss_a5e-5",
        "loss": "log_loss",
        "alpha": 5e-5
    },

    {
        "name": "log_loss_a1e-4",
        "loss": "log_loss",
        "alpha": 1e-4
    },

    {
        "name": "log_loss_a5e-4",
        "loss": "log_loss",
        "alpha": 5e-4
    }
]


# ============================================================
# 5. TRAIN AND EVALUATE
# ============================================================

results = []

print("\n")
print("=" * 75)
print("HIRESENSE — SGD HYPERPARAMETER TUNING")
print("=" * 75)


for number, config in enumerate(configs, start=1):

    print(
        f"\n[{number}/{len(configs)}] "
        f"Training {config['name']}..."
    )

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
                loss=config["loss"],
                alpha=config["alpha"],
                max_iter=2000,
                tol=1e-3,
                class_weight="balanced",
                random_state=42
            )
        )
    ])

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

    results.append({
        "name": config["name"],
        "loss": config["loss"],
        "alpha": config["alpha"],
        "accuracy": accuracy,
        "macro_f1": macro_f1,
        "weighted_f1": weighted_f1
    })

    print(
        f"Accuracy: {accuracy * 100:.2f}% | "
        f"Macro F1: {macro_f1:.4f} | "
        f"Weighted F1: {weighted_f1:.4f}"
    )


# ============================================================
# 6. SORT RESULTS
# ============================================================

results = sorted(
    results,
    key=lambda x: (
        x["macro_f1"],
        x["accuracy"]
    ),
    reverse=True
)


# ============================================================
# 7. DISPLAY LEADERBOARD
# ============================================================

print("\n")
print("=" * 90)
print("HIRESENSE — SGD TUNING LEADERBOARD")
print("=" * 90)

print(
    f"{'Configuration':<28}"
    f"{'Accuracy':>12}"
    f"{'Macro F1':>12}"
    f"{'Weighted F1':>15}"
)

print("-" * 90)

for result in results:

    print(
        f"{result['name']:<28}"
        f"{result['accuracy'] * 100:>11.2f}%"
        f"{result['macro_f1']:>12.4f}"
        f"{result['weighted_f1']:>15.4f}"
    )

print("=" * 90)


# ============================================================
# 8. BEST MODEL
# ============================================================

best = results[0]

print("\n🏆 BEST CONFIGURATION")
print("=" * 50)

print(f"Configuration : {best['name']}")
print(f"Loss          : {best['loss']}")
print(f"Alpha         : {best['alpha']}")
print(f"Accuracy      : {best['accuracy'] * 100:.2f}%")
print(f"Macro F1      : {best['macro_f1']:.4f}")
print(f"Weighted F1   : {best['weighted_f1']:.4f}")

print("=" * 50)


# ============================================================
# 9. COMPARE WITH CURRENT CHAMPION
# ============================================================

current_accuracy = 0.7042
current_macro_f1 = 0.6613

print("\n")
print("=" * 60)
print("COMPARISON WITH CURRENT CHAMPION")
print("=" * 60)

print(
    f"Current champion accuracy : "
    f"{current_accuracy * 100:.2f}%"
)

print(
    f"Tuned model accuracy      : "
    f"{best['accuracy'] * 100:.2f}%"
)

print(
    f"Accuracy difference       : "
    f"{(best['accuracy'] - current_accuracy) * 100:+.2f} points"
)

print()

print(
    f"Current champion Macro F1 : "
    f"{current_macro_f1:.4f}"
)

print(
    f"Tuned model Macro F1      : "
    f"{best['macro_f1']:.4f}"
)

print(
    f"Macro F1 difference       : "
    f"{best['macro_f1'] - current_macro_f1:+.4f}"
)

print("=" * 60)