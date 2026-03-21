import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "ThinkAI - Nền tảng Học Tiếng Anh Thông Minh",
  description: "Luyện thi TOEIC/IELTS với AI Tutor 24/7. Học mọi lúc, mọi nơi.",
  keywords: ["TOEIC", "IELTS", "học tiếng Anh", "AI", "gia sư ảo"],
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        {children}
        <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
