import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import MainLayout from "./layouts/MainLayout";
import LandingLayout from "./layouts/LandingLayout";
import DevTest from "./pages/DevTest";
import Home from "./pages/Home";
import Artist from "./pages/Artist";
import Generating from "./pages/Generating";
import Result from "./pages/Result";
import Preview from "./pages/Preview";
import Customize from "./pages/Customize";
import Checkout from "./pages/Checkout";
import Success from "./pages/Success";
import Terms from "./pages/Terms";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Cart from "./pages/Cart";
import Signup from "./pages/Signup";
import FAQ from "./pages/FAQ";
import Help from "./pages/Help";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60 * 1000 } },
});

const AppRoutes = () => {
  return (
    <Routes>
      {/* Landing page — full-bleed, own layout (no white card) */}
      <Route element={<LandingLayout />}>
        <Route path="/" element={<Home />} />
      </Route>

      {/* App pages — shared navbar + white card layout */}
      <Route element={<MainLayout />}>
        <Route path="/artist" element={<Artist />} />
        <Route path="/generating" element={<Generating />} />
        <Route path="/result" element={<Result />} />
        <Route path="/preview" element={<Preview />} />
        <Route path="/customize" element={<Customize />} />

        {/* Protected routes */}
        <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
        <Route path="/success" element={<PrivateRoute><Success /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />

        {/* Public info pages */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Terms />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/help" element={<Help />} />
      </Route>

      {/* Full-page auth (no navbar) */}
      <Route path="/auth" element={<Auth />} />
      <Route path="/signup" element={<Signup />} />

      {/* Dev-only test page — remove before production */}
      {import.meta.env.DEV && (
        <Route path="/dev-test" element={<DevTest />} />
      )}

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter basename={window.location.hostname.includes("github.io") ? "/Toyify_frontend" : ""} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
