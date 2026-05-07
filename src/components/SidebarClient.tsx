"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

export function SidebarToggleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-xl gradient-neon text-black shadow-lg hover:opacity-90 transition-opacity"
      aria-label="Abrir menu"
    >
      <Menu className="h-4 w-4" />
    </button>
  );
}

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-xl gradient-neon text-black shadow-lg hover:opacity-90 transition-opacity"
        aria-label="Abrir menu"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Dark overlay (mobile only) */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar fixed lg:sticky top-0 left-0 z-50 h-dvh transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:relative lg:z-auto`}
      >
        {/* Close button (mobile only) */}
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {children}
      </aside>
    </>
  );
}
