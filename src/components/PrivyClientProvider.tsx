'use client';

// Privy has been replaced with custom X OAuth 2.0 PKCE auth.
// This component is kept as a passthrough wrapper for compatibility.
export default function PrivyClientProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
