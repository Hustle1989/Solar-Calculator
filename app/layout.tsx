import type { Metadata } from "next";
import { Geist, Montserrat } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { brand } from "@/lib/brand";
import { BrandSvgDefs } from "@/components/brand/logo";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: { default: `${brand.name}: size and price your solar system`, template: `%s · ${brand.name}` },
  description: brand.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(geist.variable, montserrat.variable)}>
      <body>
        <BrandSvgDefs />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
