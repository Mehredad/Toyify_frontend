import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Loader2,
  Sparkles,
  Edit,
  Download,
  LogIn,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import ProfileDialog from "@/components/ProfileDialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "spline-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          url: string;
        },
        HTMLElement
      >;
    }
  }
}
export interface BuzzyLandingProps {
  user?: User | null;
  conceptId?: string | null;
  onLogout?: () => void; // 👈 optional
}

export const BuzzyLanding: React.FC<BuzzyLandingProps> = ({
  user = null,
  conceptId = null,
  onLogout,
}) => {
  const navigate = useNavigate();
  // const [step, setStep] = useState(1);
  const [isOrderSubmitted, setIsOrderSubmitted] = useState(false);
  // const [isTransitioning, setIsTransitioning] = useState(false);

  console.log("Zain here is user", user);

  // Restore pending order after login (non-PII data only for security)
  // const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [file, setFile] = useState<File | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [size, setSize] = useState([20]);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isSliderActive, setIsSliderActive] = useState(false);
  const [tempDescription, setTempDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedConceptUrl, setGeneratedConceptUrl] = useState<string | null>(
    null,
  );
  const [isGeneratingConcept, setIsGeneratingConcept] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showDescriptionDialog, setShowDescriptionDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [toyName, setToyName] = useState("");
  const [toyStory, setToyStory] = useState("");
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [selectedImageVersion, setSelectedImageVersion] = useState<
    "generated" | "original"
  >("generated");
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  // Normalized scroll constants
  const NORMALIZED_DELTA = 200;
  const ANIMATION_DURATION = 350;
  const FRAMES = 20;

  // Unified animation dispatcher for 3D model
  const dispatchNormalizedAnimation = (
    container: HTMLDivElement,
    direction: 1 | -1,
  ) => {
    const deltaPerFrame = (NORMALIZED_DELTA * direction) / FRAMES;
    let frameCount = 0;
    const animateFrame = () => {
      if (frameCount >= FRAMES) return;
      const wheelEvent = new WheelEvent("wheel", {
        deltaY: deltaPerFrame,
        bubbles: true,
        cancelable: true,
      });
      container.dispatchEvent(wheelEvent);
      frameCount++;
      requestAnimationFrame(() => {
        setTimeout(animateFrame, ANIMATION_DURATION / FRAMES);
      });
    };
    requestAnimationFrame(animateFrame);
  };

  // Validation schema for order form
  const orderFormSchema = z.object({
    customerName: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters")
      .regex(
        /^[a-zA-Z\s'-]+$/,
        "Name can only contain letters, spaces, hyphens, and apostrophes",
      ),
    customerEmail: z
      .string()
      .trim()
      .email("Please enter a valid email address")
      .max(255, "Email must be less than 255 characters"),
    customerPhone: z
      .string()
      .trim()
      .regex(
        /^\+?[1-9]\d{1,14}$/,
        "Please enter a valid phone number (e.g., +44123456789)",
      )
      .optional()
      .or(z.literal("")),
    deliveryAddress: z
      .string()
      .trim()
      .min(10, "Address must be at least 10 characters")
      .max(500, "Address must be less than 500 characters"),
  });
  const calculatePrice = (sizeValue: number, qty: number): number => {
    // Base price calculation: £25 for 15cm, £40 for 30cm
    const minSize = 15;
    const maxSize = 30;
    const minPrice = 25;
    const maxPrice = 40;

    // Linear interpolation for single toy
    const pricePerToy =
      minPrice +
      ((sizeValue - minSize) / (maxSize - minSize)) * (maxPrice - minPrice);

    // Total price before shipping
    return pricePerToy * qty;
  };
  // Inside BuzzyLanding.tsx or wherever handleSubmit is defined
  // Inside BuzzyLanding.tsx or wherever handleSubmit is defined
  const handleSubmit = async () => {
    if (!user) {
      // user must be logged in before submitting
      navigate("/auth?redirect=order"); // or save step in query
      return;
    }

    if (!file || !selectedImageVersion || !size || !quantity) {
      toast({
        title: "Missing info",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          imageVersion: selectedImageVersion,
          size: size[0],
          quantity,
          description: toyStory || "", // optional
          customerEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Order submission failed");

      // ✅ Use backend-generated order ID if needed
      const orderId = data.order._id;

      toast({
        title: "Order submitted!",
        description: "Check your email for confirmation.",
      });

      // Move to confirmation step
      // setStep(7); // assuming step 7 is order confirmation

      // If you want to redirect in future: navigate(`/orders/${orderId}`);
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToHome = () => {
    // Reset all state
    // setStep(1);
    setIsOrderSubmitted(false);
    setFile(null);
    setUploadedImage(null);
    setDescription("");
    setGeneratedConceptUrl(null);
    setIsGeneratingConcept(false);
    setToyName("");
    setToyStory("");
    setSize([20]);
    setQuantity(1);
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setDeliveryAddress("");
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      await analyzeImage(selectedFile);
    }
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      await analyzeImage(selectedFile);
    }
  };
  const analyzeImage = async (selectedFile: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target?.result as string;
      setUploadedImage(imageData);

      // setStep(4);
      setIsGeneratingConcept(true);
      setGenerationError(null);

      try {
        // Call /toy-preview
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/ai/toy-preview`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageData }), // <-- matches backend
          },
        );

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Preview failed");

        setGeneratedConceptUrl(data.previewImage); // <-- matches backend response

        toast({
          title: "Preview ready",
          description: "Toy preview generated!",
        });

        // Call story generation using the caption returned
        generateToyStory(data.generatedCaption || "A cute toy"); // optional fallback
      } catch (err: any) {
        console.error("Toy preview error:", err);
        setGenerationError(err.message);
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setIsGeneratingConcept(false);
      }
    };

    reader.readAsDataURL(selectedFile);
  };

  // Regenerate function
  const handleRegenerateConcept = async () => {
    if (!uploadedImage) return;

    setIsGeneratingConcept(true);
    setGenerationError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ai/toy-preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData: uploadedImage }), // unified key
        },
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Failed to generate toy preview." }));
        throw new Error(errorData.error || "Failed to generate toy preview.");
      }

      const data = await response.json();
      setGeneratedConceptUrl(data.previewImage || null);
      setDescription(data.generatedCaption || "");

      toast({
        title: "Toy Preview Updated!",
        description: "A new toy preview has been generated.",
      });
    } catch (error: any) {
      console.error("Error re-generating toy preview:", error);
      setGenerationError(error.message || "Failed to regenerate preview.");
      toast({
        title: "Generation Failed",
        description: error.message || "Could not generate the toy.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingConcept(false);
    }
  };

  // Toy story function (unchanged)
  const generateToyStory = async (description: string) => {
    try {
      setIsGeneratingStory(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ai/toy-story`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description }),
        },
      );

      if (!response.ok) throw new Error("Failed to generate toy story");

      const data = await response.json();
      setToyName(data.name || "Your Special Toy");
      setToyStory(
        data.story || "This toy is waiting for its adventure to begin.",
      );
    } catch (err) {
      console.error("Error generating toy story:", err);
      setToyName("Your Special Toy");
      setToyStory("This toy is waiting for its adventure to begin.");
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // const handleGetStarted = () => {
  //   setStep(3); // Navigate to Upload step (step 1 of 3)
  // };

  const handleDownloadDigitalToy = () => {
    const imageToDownload = generatedConceptUrl || uploadedImage;
    if (!imageToDownload) {
      toast({
        title: "No image available",
        description: "Please upload a drawing first.",
        variant: "destructive",
      });
      return;
    }

    // Create download link
    const link = document.createElement("a");
    link.href = imageToDownload;
    link.download = `buzzymuzzy-digital-toy-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Download started!",
      description: "Your digital toy has been downloaded.",
    });
  };

  const handleLogout = () => {
    setShowLogoutDialog(false);
    onLogout?.(); // 👈 call logout passed from Index
  };

  const handleClear = () => {
    setFile(null);
    setUploadedImage(null);
    setDescription("");
    setGeneratedConceptUrl(null);
    setIsGeneratingConcept(false);
    setGenerationError(null);
    // setStep(3);
  };
  return (
    <div
      className="h-screen bg-white relative overflow-hidden"
      // ref={containerRef}
    >
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-transparent">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
            >
              <img
                src="./Logo.svg"
                alt="Toyify Logo"
                className="w-15 h-15 object-contain"
              />
            </button>

            {/* Desktop Menu */}
            <div className="hidden md:flex gap-8">
              <button
                onClick={() => setAboutOpen(true)}
                className="text-white/90 hover:text-white text-sm font-medium transition-colors"
              >
                About
              </button>
              <button
                onClick={() => setContactOpen(true)}
                className="text-white/90 hover:text-white text-sm font-medium transition-colors"
              >
                Contact
              </button>
              <button
                onClick={() => setPrivacyOpen(true)}
                className="text-white/90 hover:text-white text-sm font-medium transition-colors"
              >
                Privacy
              </button>
              <button
                onClick={() => setTermsOpen(true)}
                className="text-white/90 hover:text-white text-sm font-medium transition-colors"
              >
                Terms
              </button>
            </div>

            {/* Right Side - Cart & Auth */}
            <div className="hidden md:flex items-center gap-3">
              {/* Cart Icon */}
              <button className="text-white/80 hover:text-white transition-colors p-2">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </button>

              {user ? (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setShowProfileDialog(true)}
                    variant="ghost"
                    className="text-white/90 hover:text-white hover:bg-white/10 gap-2 text-sm"
                  >
                    <UserIcon className="w-4 h-4" />
                    Profile
                  </Button>
                  <Button
                    onClick={() => setShowLogoutDialog(true)}
                    variant="ghost"
                    className="text-white/90 hover:text-white hover:bg-white/10 gap-2 text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => navigate("/auth")}
                  className="bg-white text-purple-600 hover:bg-gray-100 rounded-lg px-5 py-2 text-sm font-medium shadow-sm"
                >
                  Sign in
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-purple-600/95 backdrop-blur-sm border-t border-white/10 px-4 py-4">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  setAboutOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="text-white/90 hover:text-white hover:bg-white/10 text-left py-3 px-3 text-sm font-medium rounded-lg transition-colors"
              >
                About
              </button>
              <button
                onClick={() => {
                  setContactOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="text-white/90 hover:text-white hover:bg-white/10 text-left py-3 px-3 text-sm font-medium rounded-lg transition-colors"
              >
                Contact
              </button>
              <button
                onClick={() => {
                  setPrivacyOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="text-white/90 hover:text-white hover:bg-white/10 text-left py-3 px-3 text-sm font-medium rounded-lg transition-colors"
              >
                Privacy
              </button>
              <button
                onClick={() => {
                  setTermsOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="text-white/90 hover:text-white hover:bg-white/10 text-left py-3 px-3 text-sm font-medium rounded-lg transition-colors"
              >
                Terms
              </button>

              <div className="border-t border-white/20 mt-3 pt-3">
                {user ? (
                  <div className="flex flex-col gap-1">
                    <Button
                      onClick={() => {
                        setShowProfileDialog(true);
                        setMobileMenuOpen(false);
                      }}
                      variant="ghost"
                      className="w-full justify-start text-white/90 hover:text-white hover:bg-white/10 gap-2"
                    >
                      <UserIcon className="w-4 h-4" />
                      Profile
                    </Button>
                    <Button
                      onClick={() => {
                        setShowLogoutDialog(true);
                        setMobileMenuOpen(false);
                      }}
                      variant="ghost"
                      className="w-full justify-start text-white/90 hover:text-white hover:bg-white/10 gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      navigate("/auth");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-white text-purple-600 hover:bg-gray-100 gap-2 mt-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign in
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Profile Dialog */}
      <ProfileDialog
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        user={user}
      />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You'll need to sign in again to
              access your profile and orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer Space - Reserved for copyright */}
      <div className="fixed bottom-2 left-8 right-8 z-[60] h-6 md:h-10 flex items-center justify-center pointer-events-auto">
        <div className="text-center text-xs md:text-sm text-foreground/70">
          <p className="text-xs">© 2025 BuzzyMuzzy. All rights reserved.</p>
        </div>
      </div>

      {/* Edit Description Dialog */}
      <Dialog
        open={isEditingDescription}
        onOpenChange={setIsEditingDescription}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Image Description</DialogTitle>
            <DialogDescription>
              Review and edit the AI-generated description of your drawing
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <Textarea
              value={tempDescription}
              onChange={(e) => setTempDescription(e.target.value)}
              placeholder="My drawing shows a friendly monster with big eyes and a smile..."
              className="min-h-[300px] resize-none text-left"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              onClick={() => setIsEditingDescription(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegenerateConcept}
              variant="secondary"
              disabled={isGeneratingConcept || !uploadedImage}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Regenerate Toy
            </Button>
            <Button
              onClick={() => {
                setDescription(tempDescription);
                setIsEditingDescription(false);
                toast({
                  title: "Description updated",
                  description: "Your changes have been saved.",
                });
              }}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
