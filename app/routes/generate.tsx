import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  HelpCircle,
  ImagePlus,
  Loader2,
  Lock,
  ScanLine,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Link, useRevalidator } from "react-router";
import { toast } from "sonner";
import Navbar from "~/components/app/Navbar";
import { orpc } from "~/lib/orpc/orpc";
import { requireAccount } from "~/lib/services/accounts.server";
import type { Route } from "./+types/generate";

// --- Types ---
type SolutionResponse = {
  classification: "question" | "not_a_question";
  answer: {
    type:
      | "boolean"
      | "single"
      | "multi"
      | "numeric"
      | "short_answer"
      | "abstain";
    selected: string[];
    numeric_answer: number | null;
    boolean_answer: boolean | null;
    short_answer: string | null;
    confidence: number;
  };
  justification: string;
};

// --- Utility Functions ---
async function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject("Failed to convert file to base64.");
      }
    };
    reader.onerror = () => {
      reject("Error reading file.");
    };
    reader.readAsDataURL(file);
  });
}

// --- Loader ---
export async function loader({ request }: Route.LoaderArgs) {
  const account = await requireAccount(request);
  return { account };
}

// --- Components ---
export default function Page({
  loaderData: { account },
}: Route.ComponentProps) {
  const [file, setFile] = useState<File | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [response, setResponse] = useState<SolutionResponse | null>(null);

  const isPremium = account.subscriptionStatus === "active";
  const messagesRemaining = account.messagesRemaining;
  const restrictApp = !isPremium && messagesRemaining <= 0;

  const revalidator = useRevalidator();
  const resultsRef = useRef<HTMLDivElement>(null);

  const solutionMutation = useMutation(
    orpc.responses.generateSolution.mutationOptions()
  );

  const isGenerating = solutionMutation.isPending;

  // --- Auto-Scroll Effect ---
  useEffect(() => {
    if (response && resultsRef.current) {
      if (window.innerWidth < 1024) {
        resultsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }, [response]);

  // --- Handlers ---
  const handleGeneration = async (imageSource: string) => {
    if (!imageSource || restrictApp) return;

    try {
      // FIX: Removed unnecessary destructuring.
      // Assuming your backend returns the object directly.
      const result = await solutionMutation.mutateAsync({
        imageUrl: imageSource,
      });

      // Type guard/Safety check before setting state
      if (!result) {
        throw new Error("No result returned from API");
      }

      if (result.classification === "not_a_question") {
        toast.error("This doesn't look like a question. Please try again.");
      }

      setResponse(result as SolutionResponse);
      revalidator.revalidate();
    } catch (err) {
      console.error("Generation failed:", err);
      toast.error("Failed to solve. Please try again.");
    }
  };

  // --- Dropzone Logic ---
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setResponse(null);

      try {
        const base64 = await convertFileToBase64(selectedFile);
        setBase64Image(base64);

        await handleGeneration(base64);
      } catch (error) {
        toast.error("Error processing image");
        console.error(error);
      }
    }
  }, []);

  const onDropRejected = useCallback((fileRejections: any) => {
    const error = fileRejections[0]?.errors[0];
    if (error?.code === "file-invalid-type") {
      toast.error("File type not supported.");
    } else if (error?.code === "file-too-large") {
      toast.error("File is too large.");
    } else {
      toast.error("Could not upload file.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
      "image/heic": [],
    },
    maxFiles: 1,
    multiple: false,
    disabled: isGenerating,
  });

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setBase64Image(null);
    setResponse(null);
  };

  const handleManualRegenerate = () => {
    if (base64Image) handleGeneration(base64Image);
  };

  const handleCopy = () => {
    if (!response) return;
    const text = `${getAnswerText(response.answer)}\n\nJustification:\n${response.justification}`;
    navigator.clipboard.writeText(text);
    toast.success("Solution copied to clipboard");
  };

  return (
    <>
      <title>Solve | TakeMyTest</title>
      <Navbar />
      <div className="pt-16 md:pt-8 min-h-screen bg-[#050505] text-white selection:bg-purple-500/30 overflow-x-hidden font-sans">
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full opacity-40 pointer-events-none -z-10" />

        <div className="mx-auto max-w-5xl px-4 md:px-6 py-6 md:py-12">
          {/* Header */}
          <div className="text-center mb-8 space-y-3">
            <h1 className="text-3xl md:text-6xl font-bold tracking-tight">
              Ace every <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-500 to-blue-600 animate-gradient">
                test question.
              </span>
            </h1>
            <p className="text-gray-400 text-base md:text-xl max-w-2xl mx-auto">
              Upload a screenshot. We'll solve it instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-start">
            <div className="space-y-4">
              {/* --- PREMIUM BOX --- */}
              {!isPremium && (
                <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/30 to-purple-950/30 p-4">
                  <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-indigo-500/20 blur-2xl" />
                  <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-center sm:text-left">
                      <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 shadow-inner shadow-indigo-500/10">
                        <Zap size={20} className="fill-indigo-500/20" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-sm sm:text-base">
                          Unlock Unlimited Solutions
                        </h3>
                        <p className="text-xs sm:text-sm text-indigo-200/60">
                          {messagesRemaining > 0
                            ? `${messagesRemaining} free solutions remaining`
                            : "Daily limit reached"}
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/pricing"
                      className="w-full sm:w-auto whitespace-nowrap rounded-lg bg-white px-4 py-2 text-sm font-bold text-black hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/5"
                    >
                      Upgrade <Zap size={14} className="fill-black" />
                    </Link>
                  </div>
                </div>
              )}

              {/* --- UPLOADER --- */}
              <div className="relative group rounded-3xl overflow-hidden bg-[#0A0A0C] border border-white/10 shadow-2xl">
                {!base64Image ? (
                  <div
                    {...getRootProps()}
                    className={`
                      relative flex flex-col items-center justify-center w-full h-[400px] 
                      border-2 border-dashed rounded-3xl 
                      transition-all cursor-pointer backdrop-blur-sm
                      outline-none focus:ring-2 focus:ring-indigo-500/50
                      ${isDragActive ? "border-indigo-500 bg-indigo-500/10" : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20"}
                    `}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center justify-center text-center px-4 pointer-events-none">
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform duration-300 ${isDragActive ? "bg-indigo-500 text-white scale-110" : "bg-indigo-500/20 text-indigo-400"}`}
                      >
                        <ScanLine className="w-8 h-8" />
                      </div>
                      <p className="mb-2 text-lg font-medium text-gray-200">
                        {isDragActive
                          ? "Drop image here..."
                          : "Upload Question"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Auto-scans upon upload
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-[500px] lg:h-[600px] group/preview">
                    {/* The Image */}
                    <img
                      src={base64Image}
                      alt="Uploaded Question"
                      className="w-full h-full object-contain bg-black/50"
                    />

                    {/* Clear Button - Only show if NOT loading */}
                    {!isGenerating && (
                      <div className="absolute top-4 right-4 z-20">
                        <button
                          onClick={handleClear}
                          className="p-2 rounded-full bg-black/60 hover:bg-red-500/80 hover:text-white text-gray-300 backdrop-blur-md border border-white/10 transition-all"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 pointer-events-none" />

                    {/* LOADING STATE OVERLAY */}
                    {isGenerating && (
                      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="relative">
                          <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse" />
                          <Loader2 className="w-12 h-12 text-indigo-400 animate-spin relative z-10" />
                        </div>
                        <p className="mt-4 text-white font-medium animate-pulse">
                          Analyzing question...
                        </p>
                      </div>
                    )}

                    {/* PAYWALL OVERLAY - No Button underneath here */}
                    {restrictApp && (
                      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 animate-in fade-in zoom-in-95 duration-300">
                        <div className="p-2 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-2 shadow-lg shadow-indigo-500/20">
                          <Lock className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white">
                          Study Limit Reached
                        </h3>
                        <Link
                          to="/pricing"
                          className="mt-3 w-full py-2 px-4 bg-white text-black text-sm font-bold rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                        >
                          <Zap className="w-4 h-4 fill-black" />
                          Unlock
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* --- RESULTS COLUMN --- */}
            <div className="relative" ref={resultsRef}>
              {response ? (
                <div className="sticky top-8 space-y-6 animate-in slide-in-from-right-4 fade-in duration-500">
                  <div className="relative bg-[#0A0A0C] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl"></div>

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-indigo-400" />
                          Solution
                        </h2>
                        {response.classification === "not_a_question" ? (
                          <span className="px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Error
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />{" "}
                            {Math.round(response.answer.confidence * 100)}%
                            Confidence
                          </span>
                        )}
                      </div>

                      {/* --- MAIN ANSWER SECTION --- */}
                      {response.classification === "question" ? (
                        <>
                          {/* Primary Answer Box */}
                          <div className="bg-[#151518] border border-indigo-500/30 rounded-2xl p-6 mb-6 text-center shadow-[0_0_30px_-10px_rgba(99,102,241,0.2)]">
                            <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-3">
                              Final Answer
                            </p>
                            <div className="text-xl md:text-2xl font-bold text-white flex flex-col items-center justify-center gap-2">
                              <SolutionAnswerDisplay answer={response.answer} />
                            </div>
                          </div>

                          {/* Justification Text */}
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-gray-300">
                              Detailed Explanation
                            </h3>
                            <div className="bg-[#151518] border border-white/5 rounded-2xl p-5 font-mono text-sm leading-relaxed text-gray-300 whitespace-pre-wrap">
                              {response.justification}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="bg-red-900/10 border border-red-500/20 rounded-2xl p-6 text-center">
                          <p className="text-red-300 mb-2">
                            We couldn't detect a clear question in this image.
                          </p>
                          <p className="text-sm text-red-400/60">
                            Try uploading a clearer screenshot or cropping
                            closer to the text.
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={handleCopy}
                          className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          Copy Solution
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty State */
                <div className="hidden lg:flex h-full min-h-[500px] border border-white/5 rounded-3xl bg-white/[0.02] items-center justify-center text-center p-8">
                  <div className="max-w-xs space-y-4 opacity-50">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 mx-auto flex items-center justify-center">
                      <ImagePlus className="w-8 h-8 text-white/40" />
                    </div>
                    <p className="text-lg font-medium text-gray-400">
                      Solution awaits
                    </p>
                    <p className="text-sm text-gray-600">
                      Upload a question to automatically generate the answer.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// --- helper to extract plain text for clipboard copy
function getAnswerText(answer: SolutionResponse["answer"]): string {
  switch (answer.type) {
    case "boolean":
      return answer.boolean_answer ? "True" : "False";
    case "numeric":
      return String(answer.numeric_answer);
    case "single":
    case "multi":
      return answer.selected.join(", ");
    case "short_answer":
      return answer.short_answer || "";
    case "abstain":
      return "Unable to answer";
    default:
      return "";
  }
}

// --- component to visually render the answer
function SolutionAnswerDisplay({
  answer,
}: {
  answer: SolutionResponse["answer"];
}) {
  switch (answer.type) {
    case "boolean":
      return (
        <span
          className={`px-4 py-2 rounded-lg border ${answer.boolean_answer ? "bg-green-500/20 border-green-500 text-green-300" : "bg-red-500/20 border-red-500 text-red-300"}`}
        >
          {answer.boolean_answer ? "True" : "False"}
        </span>
      );
    case "numeric":
      return (
        <span className="text-indigo-400 font-mono text-4xl">
          {answer.numeric_answer}
        </span>
      );
    case "single":
    case "multi":
      return (
        <div className="flex flex-wrap justify-center gap-2">
          {answer.selected.length > 0 ? (
            answer.selected.map((opt, i) => (
              <span
                key={i}
                className="px-5 py-3 rounded-xl bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20"
              >
                {opt}
              </span>
            ))
          ) : (
            <span className="text-gray-500 text-lg">No selection made</span>
          )}
        </div>
      );
    case "short_answer":
      return (
        <span className="text-lg text-center w-full block text-white">
          {answer.short_answer}
        </span>
      );
    case "abstain":
      return (
        <span className="flex items-center gap-2 text-yellow-500 text-lg">
          <HelpCircle className="w-5 h-5" /> Could not determine answer
        </span>
      );
    default:
      return null;
  }
}
