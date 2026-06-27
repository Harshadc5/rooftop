import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Solar Installation Portal",
  description: "Secure data entry and document generation for solar installations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={outfit.className}>
        <Providers>
          <div className="app-container">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
