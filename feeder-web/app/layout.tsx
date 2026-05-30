import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Feed my gochi",
  description:
    "A real ESP32 desk-pet you can feed from anywhere. The relay runs inside a hardware-attested TEE on EigenCloud — provably tamper-proof.",
  openGraph: {
    title: "Feed my gochi",
    description:
      "A real ESP32 pet on a desk somewhere. Sign a treat — it'll see you in seconds. Relay runs in a verifiable hardware enclave.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
