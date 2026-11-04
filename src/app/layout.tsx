import type { Metadata } from "next";
import "./globals.css";
import { RefineProvider } from "@/providers/refine-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "RuoYi Next",
  description: "Schema-driven admin backend built with Next.js, Prisma and RuoYi tables",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <RefineProvider>{children}</RefineProvider>
        <Toaster />
      </body>
    </html>
  );
}
