import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { CallManagerProvider } from "@/components/providers/CallManagerProvider";
import { CallProvider } from "@/components/providers/CallProvider";
import { DockableModalProvider } from "@/components/providers/dockable-modal-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth/auth-context";
import { NotificationProvider } from "@/lib/notifications/notification-context";
import { QueryRefreshProvider } from "@/lib/contexts/query-refresh-context";
import { Provider as JotaiProvider } from "jotai";

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
        <JotaiProvider>
          <AuthProvider>
            <NotificationProvider>
              <QueryRefreshProvider>
                <CallProvider>
                  <DockableModalProvider>
                    <CallManagerProvider>
                      <Header />
                      {children}
                      <Toaster position="top-right" />
                    </CallManagerProvider>
                  </DockableModalProvider>
                </CallProvider>
              </QueryRefreshProvider>
            </NotificationProvider>
          </AuthProvider>
        </JotaiProvider>
      </body>
    </html>
  );
}
