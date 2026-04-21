"use client";

import Navbar from "@/components/ui/navbar";
import { Outlet } from "react-router-dom";

export default function MainLayout({
  user,
  navigate,
  onOpenAbout,
  onOpenContact,
  onOpenPrivacy,
  onOpenTerms,
  onOpenProfile,
  onOpenLogout,
}: {
  user?: any;
  navigate?: (path: string) => void;

  onOpenAbout?: () => void;
  onOpenContact?: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onOpenProfile?: () => void;
  onOpenLogout?: () => void;
}) {
  return (
    <div className="toyify-page-shell min-h-screen w-full flex flex-col items-center px-6 sm:px-8 md:px-12 no-scrollbar">

      <Navbar
        user={user}
        navigate={navigate ?? (() => {})}
        onOpenAbout={onOpenAbout ?? (() => {})}
        onOpenContact={onOpenContact ?? (() => {})}
        onOpenPrivacy={onOpenPrivacy ?? (() => {})}
        onOpenTerms={onOpenTerms ?? (() => {})}
        onOpenProfile={onOpenProfile ?? (() => {})}
        onOpenLogout={onOpenLogout ?? (() => {})}
      />

      {/* WHITE CONTAINER */}
      <div
        className="
          w-full max-w-[1500px]
          toyify-surface
          mt-20 
          mb-10
          min-h-[calc(100vh-140px)] 
          max-h-[calc(100vh-140px)] 
          overflow-y-auto 
          no-scrollbar
          px-6 py-6
        "
      >
        <Outlet />   {/* <- IMPORTANT */}
      </div>

    </div>
  );
}
