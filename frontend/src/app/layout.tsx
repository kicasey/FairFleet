import type { Metadata } from "next";
import { Unbounded, Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FairFleet — See Every Flight's True Cost",
  description:
    "Unbiased. Transparent. Yours. See every flight's true cost — bags, seats, all of it. We link you straight to the airline.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${unbounded.variable} ${plusJakarta.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col font-body bg-off text-ink">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
