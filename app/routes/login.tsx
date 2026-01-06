import { Link } from "react-router"; // or 'react-router-dom' depending on your setup

export default function Page() {
  // Placeholder handlers - replace with your actual auth logic
  const handleGoogleLogin = () => {
    window.location.href = "/login/google";
  };

  const handleAppleLogin = () => {
    window.location.href = "/login/apple";
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30 flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Background Glow Effects (Same as homepage) */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full opacity-30 pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[400px] bg-pink-600/10 blur-[100px] rounded-full opacity-20 pointer-events-none -z-10" />

      {/* Main Login Card */}
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        {/* Header Section */}
        <div className="text-center mb-8 space-y-4">
          <div className="inline-flex items-center justify-center w-10 h-10 mb-4">
            <div className="w-10 h-10 rounded-md gradient-brand" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Welcome to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 animate-gradient">
              TakeMyTest
            </span>
          </h1>
          <p className="text-gray-400 text-lg">Sign in to ace every test.</p>
        </div>

        {/* Glass Card Container */}
        <div className="bg-[#0F0F12] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle inner gradient */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-purple-500/5 blur-3xl"></div>

          <div className="space-y-4 relative z-10">
            {/* Google Button */}
            <button
              onClick={handleGoogleLogin}
              className="group relative w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3.5 px-4 rounded-xl hover:bg-gray-100 transition-all active:scale-[0.98]"
            >
              <GoogleIcon className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>

            {/* Apple Button */}
            <button
              onClick={handleAppleLogin}
              className="group relative w-full flex items-center justify-center gap-3 bg-white/5 text-white font-semibold py-3.5 px-4 rounded-xl border border-white/10 hover:bg-white/10 transition-all active:scale-[0.98]"
            >
              <AppleIcon className="w-5 h-5 fill-white" />
              <span>Continue with Apple</span>
            </button>
          </div>

          {/* Footer / Terms */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our{" "}
              <Link
                to="/legal/terms"
                className="underline hover:text-gray-300 transition-colors"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/legal/privacy"
                className="underline hover:text-gray-300 transition-colors"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Icons ---

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.127 3.675-.552 9.127 1.519 12.153 1.015 1.454 2.206 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.026-4.61 1.026zM15.535 3.816c.844-1.026 1.402-2.428 1.246-3.805-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.727z" />
    </svg>
  );
}
