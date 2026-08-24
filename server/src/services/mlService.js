const ML_API_URL =
  process.env.ML_API_URL || "http://127.0.0.1:8000";

export const predictResumeCategory = async (resumeText) => {
  if (!resumeText || !resumeText.trim()) {
    throw new Error("Resume text is empty.");
  }

  const response = await fetch(
    `${ML_API_URL}/predict`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resume_text: resumeText,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `ML service error (${response.status}): ${errorText}`
    );
  }

  const result = await response.json();

  if (
    !result.success ||
    !result.predicted_category
  ) {
    throw new Error(
      "ML service returned an invalid prediction."
    );
  }

  return result.predicted_category;
};