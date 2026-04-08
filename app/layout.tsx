import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { cookies } from "next/headers";
import AiTutorFloatingLauncher from "@/components/ai-tutor/AiTutorFloatingLauncher";
import RouteAccessGuard from "@/components/auth/RouteAccessGuard";
import DevtoolGuard from "@/components/security/DevtoolGuard";

export const metadata: Metadata = {
  title: "ThinkAI - Nền tảng Học Tiếng Anh Thông Minh",
  description: "Luyện thi TOEIC/IELTS với BiliBily 24/7. Học mọi lúc, mọi nơi.",
  keywords: ["TOEIC", "IELTS", "học tiếng Anh", "AI", "gia sư ảo"],
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme")?.value;
  const initialTheme = themeCookie === "light" || themeCookie === "dark" ? themeCookie : "dark";

  return (
    <html lang="vi" data-theme={initialTheme}>
      <body>
        <DevtoolGuard />
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (() => {
              try {
                const theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
                localStorage.setItem('theme', theme);
                document.cookie = 'theme=' + theme + '; path=/; max-age=31536000; SameSite=Lax';
              } catch {}
            })();
          `}
        </Script>
        <RouteAccessGuard>{children}</RouteAccessGuard>
        <AiTutorFloatingLauncher />
        <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
