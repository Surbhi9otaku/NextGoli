import os

from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv(dotenv_path=".env")


# ============================================================
# GEMINI API KEY
# ============================================================

gemini_api_key = os.getenv("GEMINI_API_KEY")

if not gemini_api_key:
    raise RuntimeError("GEMINI_API_KEY is missing from .env")


# ============================================================
# GEMINI CLIENT
# ============================================================

client = genai.Client(
    api_key=gemini_api_key,
    http_options=types.HttpOptions(
        timeout=60000
    ),
)


# ============================================================
# GEMINI MODEL FALLBACK
# ============================================================

GEMINI_MODELS = [
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
]


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="NextGoli API",
    description="AI-powered medicine reader backend",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROOT API
# ============================================================

@app.get("/")
def root():
    return {
        "message": "NextGoli API is running",
        "status": "success",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "NextGoli Backend",
    }


# ============================================================
# MEDICINE ANALYSIS
# ============================================================

@app.post("/analyze")
async def analyze_medicine(
    file: UploadFile = File(...),
    language: str = Form("english"),
):

    print()
    print("=" * 60)
    print("NEXTGOLI MEDICINE ANALYSIS STARTED")
    print("=" * 60)

    # --------------------------------------------------------
    # 1. Validate uploaded file
    # --------------------------------------------------------

    if not file.content_type:
        return {
            "status": "error",
            "message": "File type could not be detected.",
        }

    if not file.content_type.startswith("image/"):
        return {
            "status": "error",
            "message": "Please upload a valid medicine image.",
        }

    print(f"File: {file.filename}")
    print(f"Content type: {file.content_type}")

    # --------------------------------------------------------
    # 2. Read image
    # --------------------------------------------------------

    image_bytes = await file.read()

    if not image_bytes:
        return {
            "status": "error",
            "message": "The uploaded image is empty.",
        }

    print(f"Image size: {len(image_bytes)} bytes")

    # --------------------------------------------------------
    # 3. Language
    # --------------------------------------------------------

    if language.lower() == "hindi":
        response_language = "Hindi"
    else:
        response_language = "English"

    print(f"Response language: {response_language}")

    # --------------------------------------------------------
    # 4. Gemini prompt
    # --------------------------------------------------------

    prompt = f"""
You are NextGoli, an AI medicine reading assistant.

Analyze the medicine package, tablet strip, blister pack,
or medicine box shown in the image.

The user may be elderly or from a rural area, so explanations
must be simple and easy to understand.

Extract only information that is visible in the image or can
be identified with high confidence.

Identify:

1. Medicine or brand name
2. Active salt / active ingredient
3. Strength
4. Expiry date
5. General purpose / use
6. How to take it
7. Important precautions

IMPORTANT SAFETY RULES:

- Do NOT invent information.
- Do NOT guess information that cannot be read.
- If information is not visible, write "Not visible".
- Do NOT invent dosage.
- Do NOT invent frequency such as once, twice, or three times daily.
- Do NOT prescribe the medicine.
- Do NOT diagnose any disease.
- Do NOT tell the user to change their prescribed dosage.
- If dosage instructions are not visible, say:

  "Follow your doctor's prescription, pharmacist's advice,
  or the instructions on the medicine package."

- Do not assume that the medicine is safe for this particular user.
- The purpose/use should be a general explanation, not a diagnosis.
- If image quality is poor or the medicine cannot be identified
  confidently, clearly say so.

LANGUAGE:

The user selected {response_language}.

Write the explanatory information in {response_language}.

Medicine name, active ingredient, strength and expiry date
can remain in their original form when appropriate.

Return the response using exactly these sections:

Medicine:
Active Ingredient:
Strength:
Expiry Date:
Purpose:
How to Take:
Precautions:

Do not add unnecessary information outside these sections.
"""

    # --------------------------------------------------------
    # 5. Prepare image
    # --------------------------------------------------------

    image_part = types.Part.from_bytes(
        data=image_bytes,
        mime_type=file.content_type,
    )

    print("Image prepared for Gemini.")
    print()

    # --------------------------------------------------------
    # 6. Try Gemini models
    # --------------------------------------------------------

    last_error = None

    for model_name in GEMINI_MODELS:

        try:

            print("=" * 60)
            print(f"Trying Gemini model: {model_name}")
            print("=" * 60)

            response = client.models.generate_content(
                model=model_name,
                contents=[
                    prompt,
                    image_part,
                ],
                config=types.GenerateContentConfig(
                    automatic_function_calling=types.AutomaticFunctionCallingConfig(
                        disable=True
                    ),
                ),
            )

            # ------------------------------------------------
            # Successful response
            # ------------------------------------------------

            gemini_text = response.text

            if not gemini_text:

                print(f"Gemini returned empty response: {model_name}")

                return {
                    "status": "error",
                    "message": "Gemini returned an empty response.",
                    "model": model_name,
                }

            print()
            print("=" * 60)
            print(f"Gemini SUCCESS: {model_name}")
            print("=" * 60)

            print()
            print("Gemini response:")
            print(gemini_text)
            print()

            return {
                "status": "success",
                "filename": file.filename,
                "language": language,
                "model": model_name,
                "gemini_response": gemini_text,
            }

        except Exception as error:

            last_error = str(error)

            print()
            print("=" * 60)
            print(f"GEMINI ERROR - {model_name}")
            print("=" * 60)

            print(last_error)

            print("=" * 60)

            # ------------------------------------------------
            # 503 / high demand
            # ------------------------------------------------

            if "503" in last_error or "UNAVAILABLE" in last_error:

                print(
                    f"Model {model_name} is unavailable."
                )

                print(
                    "Trying the next Gemini model..."
                )

                continue

            # ------------------------------------------------
            # Timeout
            # ------------------------------------------------

            if (
                "timeout" in last_error.lower()
                or "timed out" in last_error.lower()
            ):

                print(
                    f"Model {model_name} timed out."
                )

                print(
                    "Trying the next Gemini model..."
                )

                continue

            # ------------------------------------------------
            # Other errors
            # ------------------------------------------------

            print(
                "This is not a temporary model availability error."
            )

            return {
                "status": "error",
                "message": "Gemini API request failed.",
                "model": model_name,
                "error": last_error,
            }

    # --------------------------------------------------------
    # 7. All models failed
    # --------------------------------------------------------

    print()
    print("=" * 60)
    print("ALL GEMINI MODELS FAILED")
    print("=" * 60)

    return {
        "status": "error",
        "message": "All Gemini models are temporarily unavailable.",
        "error": last_error,
    }