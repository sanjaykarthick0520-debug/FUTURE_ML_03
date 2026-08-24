import joblib

MODEL_PATH = "models/resume_category_model.joblib"

print("Loading HireSense ML model...")

model = joblib.load(MODEL_PATH)

print("Model loaded successfully!")
print()
print("=" * 60)
print("HIRESENSE RESUME CATEGORY PREDICTOR")
print("=" * 60)

print("\nPaste the complete resume text.")
print("When finished, press ENTER on an empty line.\n")

lines = []

while True:
    line = input()

    if line.strip() == "":
        break

    lines.append(line)

resume_text = "\n".join(lines)

if not resume_text.strip():
    print("\nNo resume text entered.")
    exit()

# ============================================================
# PREDICTION
# ============================================================

prediction = model.predict([resume_text])[0]

print()
print("=" * 60)
print("PREDICTION RESULT")
print("=" * 60)

print(f"Predicted Resume Category: {prediction}")

# ============================================================
# TOP CATEGORY SCORES
# ============================================================

classifier = model.named_steps["classifier"]

scores = classifier.decision_function(
    model.named_steps["tfidf"].transform([resume_text])
)

classes = classifier.classes_

# Handle multiclass decision scores
if scores.ndim == 1:
    scores = scores.reshape(1, -1)

scores = scores[0]

top_indices = scores.argsort()[::-1][:5]

print()
print("Top 5 Model Predictions:")
print("-" * 60)

for rank, index in enumerate(top_indices, start=1):
    print(
        f"{rank}. {classes[index]:<25} "
        f"Score: {scores[index]:.4f}"
    )

print("=" * 60)