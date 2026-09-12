import os
import re
from datetime import date, datetime

from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from pydantic import BaseModel, Field


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
    api_key=gemini_api_key
)


# ============================================================
# GEMINI MODEL FALLBACK
# ============================================================

GEMINI_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
]


# ============================================================
# STRUCTURED GEMINI RESPONSE
# ============================================================

class MedicineAnalysis(BaseModel):
    medicine: str = Field(
        description="Medicine or brand name visible on the package."
    )

    active_ingredient: str = Field(
        description="Active salt or active ingredient visible or identified with high confidence."
    )

    strength: str = Field(
        description="Medicine strength such as 500 mg. If not visible, return Not visible."
    )

    expiry_date: str = Field(
        description="Expiry date exactly as read from the medicine package. If not visible, return Not visible."
    )

    purpose: str = Field(
        description="Simple general explanation of what the medicine is commonly used for."
    )

    how_to_take: str = Field(
        description="Safe instructions based only on visible package information. Do not invent dosage or frequency."
    )

    precautions: str = Field(
        description="Important precautions based on visible information or high-confidence general medicine information."
    )


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
# EXPIRY DATE VALIDATION
# ============================================================

def calculate_expiry_status(expiry_text: str):
    """
    Calculate expiry status using Python.

    Gemini only reads the expiry date.
    Python decides whether the medicine is expired.
    """

    if not expiry_text:
        return {
            "status": "UNKNOWN",
            "message": "Expiry date could not be determined.",
        }

    normalized = expiry_text.upper().strip()

    if "NOT VISIBLE" in normalized:
        return {
            "status": "UNKNOWN",
            "message": "Expiry date is not visible.",
        }

    # --------------------------------------------------------
    # Supported month names
    # --------------------------------------------------------

    months = {
        "JAN": 1,
        "JANUARY": 1,
        "FEB": 2,
        "FEBRUARY": 2,
        "MAR": 3,
        "MARCH": 3,
        "APR": 4,
        "APRIL": 4,
        "MAY": 5,
        "JUN": 6,
        "JUNE": 6,
        "JUL": 7,
        "JULY": 7,
        "AUG": 8,
        "AUGUST": 8,
        "SEP": 9,
        "SEPT": 9,
        "SEPTEMBER": 9,
        "OCT": 10,
        "OCTOBER": 10,
        "NOV": 11,
        "NOVEMBER": 11,
        "DEC": 12,
        "DECEMBER": 12,
    }

    expiry_month = None
    expiry_year = None

    # --------------------------------------------------------
    # Example:
    # EXP.JUL.24
    # JUL.24
    # JUL 24
    # JULY 2024
    # --------------------------------------------------------

    month_pattern = (
        r"(JAN(?:UARY)?|FEB(?:RUARY)?|MAR(?:CH)?|APR(?:IL)?|"
        r"MAY|JUN(?:E)?|JUL(?:Y)?|AUG(?:UST)?|SEP(?:TEMBER)?|"
        r"OCT(?:OBER)?|NOV(?:EMBER)?|DEC(?:EMBER)?)"
        r"[\s./-]*"
        r"(\d{2,4})"
    )

    match = re.search(month_pattern, normalized)

    if match:
        month_text = match.group(1)
        year_text = match.group(2)

        expiry_month = months.get(month_text)

        if len(year_text) == 2:
            expiry_year = 2000 + int(year_text)
        else:
            expiry_year = int(year_text)

    # --------------------------------------------------------
    # Example:
    # 07/2024
    # 07-24
    # 07.2024
    # --------------------------------------------------------

    if not match:
        numeric_match = re.search(
            r"\b(0?[1-9]|1[0-2])[\s./-](\d{2,4})\b",
            normalized
        )

        if numeric_match:
            expiry_month = int(numeric_match.group(1))
            year_text = numeric_match.group(2)

            if len(year_text) == 2:
                expiry_year = 2000 + int(year_text)
            else:
                expiry_year = int(year_text)

    # --------------------------------------------------------
    # Could not understand expiry date
    # --------------------------------------------------------

    if not expiry_month or not expiry_year:
        return {
            "status": "UNKNOWN",
            "message": "Expiry date format could not be understood.",
        }

    # --------------------------------------------------------
    # Determine last day of expiry month
    # --------------------------------------------------------

    if expiry_month == 12:
        next_month = date(expiry_year + 1, 1, 1)
    else:
        next_month = date(expiry_year, expiry_month + 1, 1)

    expiry_end_date = next_month.fromordinal(
        next_month.toordinal() - 1
    )

    today = date.today()

    # --------------------------------------------------------
    # Expired
    # --------------------------------------------------------

    if expiry_end_date < today:
        return {
            "status": "EXPIRED",
            "message": (
                f"Medicine expiry date has passed "
                f"({expiry_end_date.strftime('%B %Y')})."
            ),
        }

    # --------------------------------------------------------
    # Calculate days remaining
    # --------------------------------------------------------

    days_remaining = (expiry_end_date - today).days

    # --------------------------------------------------------
    # Expiring within 90 days
    # --------------------------------------------------------

    if days_remaining <= 90:
        return {
            "status": "EXPIRING_SOON",
            "message": (
                f"Medicine expires soon "
                f"({expiry_end_date.strftime('%B %Y')})."
            ),
        }

    # --------------------------------------------------------
    # Valid
    # --------------------------------------------------------

    return {
        "status": "VALID",
        "message": (
            f"Medicine expiry date is "
            f"{expiry_end_date.strftime('%B %Y')}."
        ),
    }


# ============================================================
# MEDICINE ANALYSIS
# ============================================================

@app.post("/analyze")
async def analyze_medicine(
    file: UploadFile = File(...),
    language: str = Form("english"),
):

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

    # --------------------------------------------------------
    # 2. Read image
    # --------------------------------------------------------

    image_bytes = await file.read()

    if not image_bytes:
        return {
            "status": "error",
            "message": "The uploaded image is empty.",
        }

    # --------------------------------------------------------
    # 3. Language
    # --------------------------------------------------------

    if language.lower() == "hindi":
        response_language = "Hindi"
    else:
        response_language = "English"

    # --------------------------------------------------------
    # 4. Gemini prompt
    # --------------------------------------------------------

    prompt = f"""
You are NextGoli, an AI medicine reading assistant.

Analyze the medicine package, tablet strip, blister pack,
or medicine box shown in the image.

The user may be elderly or from a rural area, so explanations
must be simple and easy to understand.

The selected response language is {response_language}.

Extract only information that is visible in the image or can
be identified with high confidence.

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

LANGUAGE RULES:

- Write purpose, how_to_take, and precautions in {response_language}.
- Medicine name, active ingredient, strength and expiry date
  can remain in their original form when appropriate.
- Keep explanations simple for elderly and rural users.

EXPIRY RULE:

- Read the expiry date exactly as printed on the package.
- Do NOT decide whether the medicine is expired.
- Python will calculate the expiry status separately.
- If the expiry date cannot be read, return "Not visible".

HOW TO TAKE:

- Never invent dosage or frequency.
- If dosage information is not clearly visible, tell the user
  to follow their doctor, pharmacist, or package instructions.

Return only the requested structured fields.
"""


    # --------------------------------------------------------
    # 5. Prepare image
    # --------------------------------------------------------

    image_part = types.Part.from_bytes(
        data=image_bytes,
        mime_type=file.content_type,
    )

    # --------------------------------------------------------
    # 6. Try Gemini models
    # --------------------------------------------------------

    last_error = None

    for model_name in GEMINI_MODELS:

        try:

            print()
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
                    response_mime_type="application/json",
                    response_schema=MedicineAnalysis,
                ),
            )

            # ------------------------------------------------
            # Validate structured response
            # ------------------------------------------------

            if not response.text:
                return {
                    "status": "error",
                    "message": "Gemini returned an empty response.",
                    "model": model_name,
                }

            medicine_data = MedicineAnalysis.model_validate_json(
                response.text
            )

            # ------------------------------------------------
            # Python expiry validation
            # ------------------------------------------------

            expiry_result = calculate_expiry_status(
                medicine_data.expiry_date
            )

            print()
            print("=" * 60)
            print(f"Gemini success: {model_name}")
            print("=" * 60)

            print("Medicine:", medicine_data.medicine)
            print("Ingredient:", medicine_data.active_ingredient)
            print("Strength:", medicine_data.strength)
            print("Expiry:", medicine_data.expiry_date)
            print("Expiry Status:", expiry_result["status"])
            print("=" * 60)

            # ------------------------------------------------
            # Final API response
            # ------------------------------------------------

            return {
                "status": "success",
                "filename": file.filename,
                "language": language,
                "model": model_name,

                "medicine": medicine_data.model_dump(),

                "expiry_validation": expiry_result,
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
            # Try next model for temporary availability errors
            # ------------------------------------------------

            if (
                "503" in last_error
                or "UNAVAILABLE" in last_error
                or "high demand" in last_error.lower()
            ):
                print(
                    f"Model {model_name} unavailable. "
                    "Trying next Gemini model..."
                )

                continue

            # ------------------------------------------------
            # Other errors
            # ------------------------------------------------

            return {
                "status": "error",
                "message": "Gemini API request failed.",
                "model": model_name,
                "error": last_error,
            }

    # --------------------------------------------------------
    # 7. All models failed
    # --------------------------------------------------------

    return {
        "status": "error",
        "message": "All Gemini models are temporarily unavailable.",
        "error": last_error,
    }