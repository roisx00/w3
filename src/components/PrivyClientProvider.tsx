'use client';

import { PrivyProvider } from '@privy-io/react-auth';

export default function PrivyClientProvider({ children }: { children: React.ReactNode }) {
    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
            config={{
                loginMethods: ['twitter', 'email'],
                appearance: {
                    theme: 'dark',
                    accentColor: '#7C3AED',
                    logo: 'https://w3hub.space/icon.png',
                    loginMessage: 'Sign in to Web3 Hub with your X account',
                    showWalletLoginFirst: false,
                },
                embeddedWallets: {
                    ethereum: { createOnLogin: 'users-without-wallets' },
                },
            }}
        >
            {children}
        </PrivyProvider>
    );
}
