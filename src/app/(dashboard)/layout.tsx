"use client";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TopBar from "@/components/layout/TopBar";
import BottomTabs from "@/components/layout/BottomTabs";
import NavPill from "@/components/layout/NavPill";
import Footer from "@/components/layout/Footer";
import LoadingVeil from "@/components/ui/LoadingVeil";
import WelcomeSwoosh from "@/components/ui/WelcomeSwoosh";
import RecoveryScreen from "@/components/ui/RecoveryScreen";
import MasterGate from "@/components/ui/MasterGate";

function Shell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [showWelcome, setShowWelcome] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recover, setRecover] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    const hr = () => setRecover(true);
    const hs = () => setResetOpen(true);
    window.addEventListener("sappy-repair", hr);
    window.addEventListener("sappy-reset", hs);
    return () => {
      window.removeEventListener("sappy-repair", hr);
      window.removeEventListener("sappy-reset", hs);
    };
  }, []);

  useEffect(() => {
    const seen = sessionStorage.getItem("welcomeSeen");
    if (session?.user && !seen) {
      setShowWelcome(true);
      sessionStorage.setItem("welcomeSeen", "1");
    } else if (session?.user) {
      setLoading(false);
    }
  }, [session]);

  async function doReset() {
    const r = await fetch("/api/repair?reset=1", { method: "POST" });
    const j = await r.json();
    setResetOpen(false);
    if (j.ok) {
      alert("All data cleared. Fresh start!");
      window.location.href = "/dashboard";
    } else {
      alert("Reset failed. Try again.");
    }
  }

  if (status === "loading" || !session) {
    return <LoadingVeil progress={60} status="Loading workspace…" />;
  }

  if (recover) {
    return <RecoveryScreen onDone={() => setRecover(false)} />;
  }

  return (
    <>
      {resetOpen && (
        <MasterGate
          title="Reset ALL data?"
          onOk={doReset}
          onCancel={() => setResetOpen(false)}
        />
      )}

      <AnimatePresence>
        {showWelcome && (
          <WelcomeSwoosh
            name={(session.user as any)?.name || "Friend"}
            onDone={() => { setShowWelcome(false); setLoading(false); }}
          />
        )}
      </AnimatePresence>

      {loading ? (
        <LoadingVeil progress={95} status="Almost there…" />
      ) : (
        <div className="min-h-screen flex flex-col">
          <TopBar onRepair={() => setRecover(true)} />
          <NavPill current={pathname} />
          <div className="flex-1 px-4 md:px-8 pt-32 md:pt-36 pb-28 md:pb-10 max-w-7xl mx-auto w-full min-w-0">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
          <Footer />
          <BottomTabs current={pathname} />
        </div>
      )}
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Shell>{children}</Shell>
    </SessionProvider>
  );
}