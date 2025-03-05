import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { CallManagerProvider } from "@/components/providers/CallManagerProvider";
import { CallProvider } from "@/components/providers/CallProvider";
import { DockableModalProvider } from "@/components/providers/dockable-modal-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth/auth-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Proof Concierge",
  description: "Donor query management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <CallProvider>
            <DockableModalProvider>
              <CallManagerProvider>
                <Header />
                {children}
                <Toaster position="top-right" />
              </CallManagerProvider>
            </DockableModalProvider>
          </CallProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
