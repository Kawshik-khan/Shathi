import { Inter, Geist, Geist_Mono } from "next/font/google";

// Inter for body text
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Geist for headings
export const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

// Geist Mono for code
export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

// SF Pro - using system font stack as fallback since not available in next/font
export const sfPro = {
  className: "font-sf-pro",
  style: {
    fontFamily: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif`,
  },
};
