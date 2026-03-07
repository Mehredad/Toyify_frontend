import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F5FF] via-white to-white flex items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-[#E9D7FE] p-8 md:p-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#F4EBFF] text-[#7F56D9] text-3xl font-bold mb-6">
            404
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-[#42307D] mb-4">
            Oops! This page wandered off
          </h1>

          <p className="text-sm md:text-base text-[#667085] max-w-lg mx-auto mb-2">
            We couldn’t find the page you were looking for.
          </p>

          <p className="text-sm text-[#98A2B3] break-words mb-8">
            Requested path: <span className="font-medium">{location.pathname}</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#7F56D9] text-white font-medium hover:bg-[#6941C6] transition-colors w-full sm:w-auto"
            >
              <Home className="w-4 h-4" />
              Return Home
            </a>

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-[#D0D5DD] text-[#344054] font-medium hover:bg-gray-50 transition-colors w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;