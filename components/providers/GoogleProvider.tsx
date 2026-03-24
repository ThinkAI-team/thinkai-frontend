'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';

export default function GoogleProvider({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  if (!clientId) {
    // Nếu chưa cấu hình Client ID, render children bình thường (nút Google sẽ không hiện)
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
