import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paygod",
  description: "Institutional Privacy Layer for LatAm Payments",
  icons: {
    icon: "/assets/paygodfav.svg",
    shortcut: "/assets/paygodfav.svg",
    apple: "/assets/paygodfav.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
