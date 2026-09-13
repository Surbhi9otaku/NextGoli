"use client";

import { useRef, useState, type ChangeEvent } from "react";

type Language = "english" | "hindi";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const translations = {
  english: {
    tagline: "Understand your medicine. Simply.",

    heroTitle: "Understand your medicine",
    heroHighlight: "without reading tiny labels.",

    description:
      "Take a photo of your medicine strip and NextGoli will explain the medicine, its purpose, expiry and precautions in simple language.",

    languageInfo: "Information will be shown in English",

    scanTitle: "Scan your medicine",
    scanDescription:
      "Take a clear photo of the front or back of the medicine strip.",
    scanButton: "📷 Scan Medicine",

    supportedLanguages: "🇬🇧 English • 🇮🇳 हिंदी • 🔊 Voice",

    read: "Read",
    readDescription: "Identify medicine details from the package.",

    understand: "Understand",
    understandDescription: "Get simple explanations in everyday language.",

    listen: "Listen",
    listenDescription: "Listen to medicine information in your language.",

    capturedTitle: "Medicine captured",
    capturedDescription: "NextGoli is ready to analyze this medicine image.",

    chooseAnother: "Choose another image",
    analyze: "🤖 Analyze Medicine",
    analyzing: "🔄 Analyzing...",

    backendSuccess: "Medicine image received successfully",
    backendError: "Unable to connect to NextGoli backend.",

    aiReader: "AI Medicine Reader",
  },

  hindi: {
    tagline: "अपनी दवा को आसानी से समझें।",

    heroTitle: "अपनी दवा को समझें",
    heroHighlight: "बिना छोटे लेबल पढ़े।",

    description:
      "अपनी दवा की स्ट्रिप की फोटो लें और NextGoli आपको दवा, उसके उपयोग, समाप्ति तिथि और सावधानियों के बारे में आसान भाषा में बताएगा।",

    languageInfo: "जानकारी हिंदी में दिखाई जाएगी",

    scanTitle: "अपनी दवा स्कैन करें",
    scanDescription: "दवा की स्ट्रिप के आगे या पीछे की साफ़ फोटो लें।",
    scanButton: "📷 दवा स्कैन करें",

    supportedLanguages: "🇬🇧 English • 🇮🇳 हिंदी • 🔊 आवाज़",

    read: "पढ़ें",
    readDescription: "दवा के पैकेट से महत्वपूर्ण जानकारी पहचानें।",

    understand: "समझें",
    understandDescription: "दवा की जानकारी आसान भाषा में समझें।",

    listen: "सुनें",
    listenDescription: "दवा की जानकारी अपनी भाषा में सुनें।",

    capturedTitle: "दवा की फोटो तैयार है",
    capturedDescription:
      "NextGoli इस दवा की फोटो का विश्लेषण करने के लिए तैयार है।",

    chooseAnother: "दूसरी फोटो चुनें",
    analyze: "🤖 दवा का विश्लेषण करें",
    analyzing: "🔄 विश्लेषण हो रहा है...",

    backendSuccess: "दवा की फोटो सफलतापूर्वक प्राप्त हुई",
    backendError: "NextGoli बैकएंड से कनेक्ट नहीं हो पाया।",

    aiReader: "AI दवा रीडर",
  },
};

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [selectedLanguage, setSelectedLanguage] = useState<Language>("english");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  type MedicineResult = {
    medicine: string;
    active_ingredient: string;
    strength: string;
    expiry_date: string;
    purpose: string;
    how_to_take: string;
    precautions: string;
  };

  type ExpiryValidation = {
    status: string;
    message: string;
    expiry_date?: string;
  };

  const [result, setResult] = useState<{
    medicine: MedicineResult;
    expiry_validation: ExpiryValidation;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const t = translations[selectedLanguage];

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setSelectedImage(imageUrl);
    setSelectedFile(file);
    setResult(null);
  };

  const openCamera = () => {
    fileInputRef.current?.click();
  };

  const analyzeMedicine = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setResult(null);
    setErrorMessage(null);

    try {
      const formData = new FormData();

      formData.append("file", selectedFile);
      formData.append("language", selectedLanguage);

      console.log("Sending medicine image to backend...");

      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      console.log("Backend response:", data);

      if (!response.ok || data.status === "error") {
        throw new Error(data.message || "Failed to analyze medicine");
      }

      // Display Gemini's actual response
      setResult({
        medicine: data.medicine,
        expiry_validation: data.expiry_validation,
      });
    } catch (error) {
      console.error("Analysis error:", error);

      setErrorMessage(
        selectedLanguage === "english"
          ? "Unable to analyze medicine image. Please try again."
          : "दवा की तस्वीर का विश्लेषण नहीं हो सका। कृपया फिर से प्रयास करें।",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const base64ToWavBlob = (base64: string) => {
    const binaryString = window.atob(base64);
    const pcmData = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      pcmData[i] = binaryString.charCodeAt(i);
    }

    const sampleRate = 24000;
    const channels = 1;
    const bitsPerSample = 16;
    const blockAlign = channels * (bitsPerSample / 8);
    const byteRate = sampleRate * blockAlign;

    const wavBuffer = new ArrayBuffer(44 + pcmData.length);
    const view = new DataView(wavBuffer);

    const writeString = (offset: number, value: string) => {
      for (let i = 0; i < value.length; i++) {
        view.setUint8(offset + i, value.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + pcmData.length, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, "data");
    view.setUint32(40, pcmData.length, true);

    new Uint8Array(wavBuffer, 44).set(pcmData);

    return new Blob([wavBuffer], { type: "audio/wav" });
  };

  const speakMedicine = async () => {
    if (!result || isSpeaking) return;

    setIsSpeaking(true);
    setErrorMessage(null);

    try {
      const medicine = result.medicine;

      const spokenText =
        selectedLanguage === "hindi"
          ? `दवा का नाम ${medicine.medicine} है।
सक्रिय घटक ${medicine.active_ingredient} है।
शक्ति ${medicine.strength} है।
समाप्ति तिथि ${medicine.expiry_date} है।
${result.expiry_validation.message}
इस दवा का उपयोग: ${medicine.purpose}
कैसे लें: ${medicine.how_to_take}
सावधानियां: ${medicine.precautions}`
          : `The medicine name is ${medicine.medicine}.
The active ingredient is ${medicine.active_ingredient}.
The strength is ${medicine.strength}.
The expiry date is ${medicine.expiry_date}.
${result.expiry_validation.message}
This medicine is commonly used for: ${medicine.purpose}
How to take: ${medicine.how_to_take}
Precautions: ${medicine.precautions}`;

      const formData = new FormData();
      formData.append("text", spokenText);
      formData.append("language", selectedLanguage);

      console.log("Sending medicine information to Gemini TTS...");

      const response = await fetch(`${API_URL}/speak`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      console.log("TTS response:", data);

      if (!response.ok || data.status === "error") {
        throw new Error(data.message || "Failed to generate speech");
      }

      const audioBlob = base64ToWavBlob(data.audio);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setIsSpeaking(false);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setIsSpeaking(false);
        setErrorMessage(
          selectedLanguage === "english"
            ? "Unable to play the medicine audio."
            : "दवा की आवाज़ चलाने में समस्या हुई।",
        );
      };

      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);

      setIsSpeaking(false);
      setErrorMessage(
        selectedLanguage === "english"
          ? "Unable to generate medicine voice. Please try again."
          : "दवा की आवाज़ तैयार नहीं हो सकी। कृपया फिर से प्रयास करें।",
      );
    }
  };

  const chooseAnotherImage = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setResult(null);
    setErrorMessage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* ================= HEADER ================= */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          {/* Logo */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-emerald-700">
              NextGoli
            </h1>

            <p className="text-sm text-slate-500">{t.tagline}</p>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
            <button
              onClick={() => setSelectedLanguage("english")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedLanguage === "english"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              🇬🇧 English
            </button>

            <button
              onClick={() => setSelectedLanguage("hindi")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedLanguage === "hindi"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              🇮🇳 हिंदी
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <section className="mx-auto flex min-h-[calc(100vh-100px)] max-w-5xl flex-col items-center px-6 py-12">
        {!selectedImage ? (
          <>
            {/* ================= HERO ================= */}
            <div className="max-w-3xl text-center">
              <div className="mb-6 text-6xl">💊</div>

              <h2 className="text-4xl font-bold leading-tight sm:text-5xl">
                {t.heroTitle}

                <span className="block text-emerald-700">
                  {t.heroHighlight}
                </span>
              </h2>

              <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                {t.description}
              </p>

              {/* Language Indicator */}
              <div className="mt-5 inline-flex items-center rounded-full bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700">
                {selectedLanguage === "english"
                  ? "🇬🇧 Information will be shown in English"
                  : "🇮🇳 जानकारी हिंदी में दिखाई जाएगी"}
              </div>
            </div>

            {/* ================= SCAN CARD ================= */}
            <div className="mt-10 w-full max-w-xl rounded-3xl border bg-white p-8 shadow-sm">
              <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-10 text-center">
                <div className="text-5xl">📷</div>

                <h3 className="mt-5 text-2xl font-semibold">{t.scanTitle}</h3>

                <p className="mt-3 text-slate-600">{t.scanDescription}</p>

                <button
                  onClick={openCamera}
                  className="mt-7 w-full rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.99]"
                >
                  {t.scanButton}
                </button>

                {/* Camera / File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                <p className="mt-4 text-sm text-slate-500">
                  {t.supportedLanguages}
                </p>
              </div>
            </div>

            {/* ================= FEATURES ================= */}
            <div className="mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
              <Feature
                icon="🔍"
                title={t.read}
                description={t.readDescription}
              />

              <Feature
                icon="🧠"
                title={t.understand}
                description={t.understandDescription}
              />

              <Feature
                icon="🔊"
                title={t.listen}
                description={t.listenDescription}
              />
            </div>
          </>
        ) : (
          /* ================= IMAGE PREVIEW ================= */

          <div className="w-full max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">{t.capturedTitle}</h2>

                <p className="mt-2 text-slate-600">{t.capturedDescription}</p>
              </div>

              {/* Current Language */}
              <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                {selectedLanguage === "english" ? "🇬🇧 English" : "🇮🇳 हिंदी"}
              </div>
            </div>

            {/* Image */}
            <div className="mt-6 overflow-hidden rounded-3xl border bg-white shadow-sm">
              <img
                src={selectedImage}
                alt={
                  selectedLanguage === "english"
                    ? "Selected medicine"
                    : "चयनित दवा"
                }
                className="max-h-[500px] w-full object-contain"
              />
            </div>

            {/* Choose Another Image */}
            <button
              onClick={chooseAnotherImage}
              disabled={isAnalyzing}
              className="mt-6 w-full rounded-2xl border border-slate-300 bg-white px-6 py-4 text-lg font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.chooseAnother}
            </button>

            {/* Analyze */}
            <button
              onClick={analyzeMedicine}
              disabled={isAnalyzing}
              className="mt-3 w-full rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAnalyzing ? t.analyzing : t.analyze}
            </button>

            {/* ======== Error Message ======== */}
            {errorMessage && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-red-700">
                <p className="font-semibold">{errorMessage}</p>
              </div>
            )}

            {/* ================= MEDICINE RESULT ================= */}
            {result && (
              <div className="mt-8 space-y-4">
                {/* Medicine Header */}
                <div className="rounded-3xl border bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
                      💊
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {selectedLanguage === "english" ? "Medicine" : "दवा"}
                      </p>

                      <h3 className="text-2xl font-bold text-slate-900">
                        {result.medicine.medicine}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Medicine Details */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Active Ingredient */}
                  <div className="rounded-2xl border bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                      {selectedLanguage === "english"
                        ? "Active Ingredient"
                        : "सक्रिय घटक"}
                    </p>

                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {result.medicine.active_ingredient}
                    </p>
                  </div>

                  {/* Strength */}
                  <div className="rounded-2xl border bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                      {selectedLanguage === "english" ? "Strength" : "शक्ति"}
                    </p>

                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {result.medicine.strength}
                    </p>
                  </div>
                </div>

                {/* Expiry */}
                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {selectedLanguage === "english"
                          ? "Expiry Date"
                          : "समाप्ति तिथि"}
                      </p>

                      <p className="mt-2 text-lg font-bold text-slate-900">
                        {result.medicine.expiry_date}
                      </p>
                    </div>

                    <div
                      className={`rounded-full px-4 py-2 text-sm font-bold ${
                        result.expiry_validation.status === "VALID"
                          ? "bg-emerald-100 text-emerald-700"
                          : result.expiry_validation.status === "EXPIRING_SOON"
                            ? "bg-yellow-100 text-yellow-700"
                            : result.expiry_validation.status === "EXPIRED"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {result.expiry_validation.status === "VALID"
                        ? selectedLanguage === "english"
                          ? "✓ VALID"
                          : "✓ मान्य"
                        : result.expiry_validation.status === "EXPIRING_SOON"
                          ? selectedLanguage === "english"
                            ? "⚠ EXPIRING SOON"
                            : "⚠ जल्द समाप्त"
                          : result.expiry_validation.status === "EXPIRED"
                            ? selectedLanguage === "english"
                              ? "✕ EXPIRED"
                              : "✕ समाप्त हो चुकी है"
                            : selectedLanguage === "english"
                              ? "UNKNOWN"
                              : "अज्ञात"}
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    {result.expiry_validation.message}
                  </p>
                </div>

                {/* Purpose */}
                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💡</span>

                    <div>
                      <h4 className="font-bold text-slate-900">
                        {selectedLanguage === "english"
                          ? "What is it used for?"
                          : "इसका उपयोग किस लिए होता है?"}
                      </h4>

                      <p className="mt-2 leading-7 text-slate-600">
                        {result.medicine.purpose}
                      </p>
                    </div>
                  </div>
                </div>

                {/* How to Take */}
                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💊</span>

                    <div>
                      <h4 className="font-bold text-slate-900">
                        {selectedLanguage === "english"
                          ? "How to take"
                          : "कैसे लें"}
                      </h4>

                      <p className="mt-2 leading-7 text-slate-600">
                        {result.medicine.how_to_take}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Listen */}
                <button
                  onClick={speakMedicine}
                  disabled={isSpeaking}
                  className="w-full rounded-2xl bg-emerald-600 px-6 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSpeaking
                    ? selectedLanguage === "english"
                      ? "🔊 Speaking..."
                      : "🔊 आवाज़ चल रही है..."
                    : selectedLanguage === "english"
                      ? "🔊 Listen to Medicine Information"
                      : "🔊 दवा की जानकारी सुनें"}
                </button>

                {/* Precautions */}
                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>

                    <div>
                      <h4 className="font-bold text-slate-900">
                        {selectedLanguage === "english"
                          ? "Precautions"
                          : "सावधानियां"}
                      </h4>

                      <p className="mt-2 leading-7 text-slate-600">
                        {result.medicine.precautions}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

/* ================= FEATURE COMPONENT ================= */

function Feature({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 text-center shadow-sm">
      <div className="text-3xl">{icon}</div>

      <h3 className="mt-3 font-semibold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
