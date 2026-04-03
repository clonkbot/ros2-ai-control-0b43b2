import { useConvexAuth } from "convex/react";
import { LandingPage } from "./components/LandingPage";
import { MissionControl } from "./components/MissionControl";
import { AuthModal } from "./components/AuthModal";
import { useState } from "react";

export default function App() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [launchControl, setLaunchControl] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full animate-ping" />
            <div className="absolute inset-2 border-2 border-cyan-400/50 rounded-full animate-spin" />
            <div className="absolute inset-4 bg-cyan-500 rounded-full animate-pulse" />
          </div>
          <p className="text-cyan-400 font-mono text-sm tracking-widest">INITIALIZING SYSTEM...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && launchControl) {
    return <MissionControl />;
  }

  return (
    <>
      <LandingPage
        onLaunch={() => {
          if (isAuthenticated) {
            setLaunchControl(true);
          } else {
            setShowAuth(true);
          }
        }}
        isAuthenticated={isAuthenticated}
      />
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => {
            setShowAuth(false);
            setLaunchControl(true);
          }}
        />
      )}
    </>
  );
}
