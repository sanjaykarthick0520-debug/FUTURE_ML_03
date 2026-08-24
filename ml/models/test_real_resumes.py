import pandas as pd
import joblib

MODEL_PATH = "models/resume_category_model.joblib"
DATA_PATH = "data/Resume.csv"

print("Loading model and dataset...")

model = joblib.load(MODEL_PATH)
df = pd.read_csv(DATA_PATH)

# Pick one actual IT resume
sample = df[
    df["Category"] == "INFORMATION-TECHNOLOGY"
].iloc[0]

resume_text = str(sample["Resume_str"])
actual_category = sample["Category"]

prediction = model.predict([resume_text])[0]

print()
print("=" * 70)
print("REAL RESUME TEST")
print("=" * 70)

print(f"Actual Category    : {actual_category}")
print(f"Predicted Category : {prediction}")

print("=" * 70)

if prediction == actual_category:
    print("✅ Correct prediction")
else:
    print("❌ Incorrect prediction")