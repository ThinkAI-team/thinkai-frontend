import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ThinkAI - Nền tảng Học Tiếng Anh Thông Minh",
  description: "Luyện thi TOEIC/IELTS với AI Tutor 24/7. Học mọi lúc, mọi nơi.",
  keywords: ["TOEIC", "IELTS", "học tiếng Anh", "AI", "gia sư ảo"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
