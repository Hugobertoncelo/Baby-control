"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { TimezoneProvider } from "../context/timezone";
import { ThemeProvider } from "@/src/context/theme";
import { DeploymentProvider } from "../context/deployment";
import { ToastProvider } from "@/src/components/ui/toast";
import Image from "next/image";
import "../globals.css";
import "./layout.css";
import SettingsForm from "@/src/components/forms/SettingsForm";
import { DebugSessionTimer } from "@/src/components/debugSessionTimer";
import { TimezoneDebug } from "@/src/components/debugTimezone";
import ThemeToggle from "@/src/components/ui/theme-toggle";
import { LogOut } from "lucide-react";
import { Inter as FontSans } from "next/font/google";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

function AppContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      const authToken = localStorage.getItem("authToken");

      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken ? `Bearer ${authToken}` : "",
        },
      });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      localStorage.removeItem("authToken");
      localStorage.removeItem("unlockTime");
      localStorage.removeItem("caretakerId");

      router.push("/family-manager/login");
    }
  }, [router]);

  useEffect(() => {
    if (!mounted) return;

    if (pathname === "/family-manager/login") {
      setAuthChecked(true);
      return;
    }

    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      router.push("/family-manager/login");
      return;
    }

    try {
      const tokenPayload = JSON.parse(atob(authToken.split(".")[1]));

      const now = Date.now() / 1000;
      if (tokenPayload.exp < now) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("unlockTime");
        router.push("/family-manager/login");
        return;
      }

      if (tokenPayload.isSysAdmin) {
        setIsAuthenticated(true);
      } else {
        router.push("/family-manager/login");
        return;
      }
    } catch (error) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("unlockTime");
      router.push("/family-manager/login");
      return;
    }

    setAuthChecked(true);
  }, [mounted, pathname, router]);

  if (!mounted || !authChecked) return null;

  if (pathname === "/family-manager/login") {
    return children;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="family-manager-layout">
        <header className="family-manager-header w-full bg-gradient-to-r from-teal-600 to-teal-700">
          <div className="mx-auto py-2">
            <div className="flex justify-between items-center h-16">
              {" "}
              <div className="flex items-center ml-4 sm:ml-6 lg:ml-8">
                <Image
                  src="/sprout-128.png"
                  alt="Sprout Logo"
                  width={64}
                  height={64}
                  className="object-contain mr-4"
                  priority
                />
                <div className="flex flex-col">
                  <h1 className="text-white text-lg font-bold">
                    Gestão Familiar
                  </h1>
                  <p className="text-white/80 text-xs">
                    Visualize e gerencie todas as famílias no Baby Control.
                  </p>
                </div>
              </div>
              <div className="flex items-center mr-4 sm:mr-6 lg:mr-8">
                <ThemeToggle variant="light" />
              </div>
            </div>
          </div>
        </header>

        <main className="family-manager-main bg-gray-200">{children}</main>

        <footer className="family-manager-footer">
          <button
            onClick={handleLogout}
            className="family-manager-logout-button"
            aria-label="Logout from family manager"
          >
            <LogOut className="family-manager-logout-icon" />
            Sair
          </button>
        </footer>
      </div>

      <SettingsForm
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onBabyStatusChange={() => {}}
      />

      <DebugSessionTimer />
      <TimezoneDebug />
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DeploymentProvider>
      <TimezoneProvider>
        <ThemeProvider>
          <ToastProvider>
            <AppContent>{children}</AppContent>
          </ToastProvider>
        </ThemeProvider>
      </TimezoneProvider>
    </DeploymentProvider>
  );
}
