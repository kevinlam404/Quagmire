import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quagmire",
  description: "The internet is a web. Follow the threads.",
  icons: {
    icon: "/quagmire-symbol.png",
  },
};

export default function RootLayout({children}: {children: React.ReactNode}){
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}