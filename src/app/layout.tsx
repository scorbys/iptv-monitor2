import type { Metadata } from "next";
import "./globals.css";
import "@radix-ui/themes/styles.css";
import "@mantine/core/styles.css";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/AuthContext";
import { MantineProvider } from "@mantine/core";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IPTV Monitoring",
  description: "Dashboard to monitor IPTV services",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <MantineProvider>{children}</MantineProvider>
        </AuthProvider>
      </body>
    </html>
  );
}