import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Filehasher — password-protected files",
  description:
    "Encrypt text to a downloadable file, or decrypt with your password (AES-256-GCM).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
