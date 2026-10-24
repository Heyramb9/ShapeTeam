import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const inter = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-inter',
  display: 'swap',
});

const manrope = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ShapeTeam | Hybrid AI Workforce Optimization Platform',
  description: 'Form optimal project teams using a hybrid pipeline of Machine Learning, Prolog Rules, and A* Search.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const content = (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔮</text></svg>" />
      </head>
      <body className="antialiased selection:bg-blue-200 selection:text-blue-950">
        {children}
      </body>
    </html>
  );

  if (publishableKey) {
    return (
      <ClerkProvider publishableKey={publishableKey}>
        {content}
      </ClerkProvider>
    );
  }

  return content;
}
