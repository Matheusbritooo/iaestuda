import type { Metadata } from "next";
import { Inter, Poppins, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { TooltipProvider } from "@/components/ui/tooltip";
import FloatingAiChat from "@/components/FloatingAiChat";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["600", "700", "800", "900"], variable: "--font-poppins", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "IAestuda — A Plataforma #1 para Concursos Públicos",
  description: "IA, gamificação, simulados e ranking. Transforme seu estudo em aprovação.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="pt-BR" className={`${inter.variable} ${poppins.variable} ${geistMono.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <TooltipProvider delay={200}>
            {children}
            <FloatingAiChat />
          </TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
