import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "C2C Tracker — AWS SBG", template: "%s | AWS SBG C2C" },
  description:
    "AWS Student Builder Group Class-to-Class Event Tracker — promote SBG events to your classmates.",
  keywords:  ["AWS", "SBG", "SRM", "C2C", "event", "tracker"],
  robots:    "noindex, nofollow", // internal app
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
