"use client";

import { useRef, useState, type ChangeEvent } from "react";

type Language = "english" | "hindi";

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
  const [result, setResult] = useState<string | null>(null);

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

    try {
      const formData = new FormData();

      formData.append("file", selectedFile);
      formData.append("language", selectedLanguage);

      console.log("Sending medicine image to backend...");

      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      console.log("Backend response:", data);

      if (!response.ok || data.status === "error") {
        throw new Error(data.message || "Failed to analyze medicine");
      }

      // Display Gemini's actual response
      setResult(data.gemini_response);
    } catch (error) {
      console.error("Analysis error:", error);

      setResult(
        selectedLanguage === "english"
          ? "Unable to analyze medicine image. Please try again."
          : "दवा की तस्वीर का विश्लेषण नहीं हो सका। कृपया फिर से प्रयास करें।",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const chooseAnotherImage = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setResult(null);

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

            {/* Backend Result */}
            {result && (
              <div className="mt-5 rounded-2xl bg-emerald-50 p-5 text-center text-emerald-800">
                <p className="font-semibold">{result}</p>
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
