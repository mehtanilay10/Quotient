import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { PWARegistration } from '@/components/ui/PWARegistration';
import { ContinuePrompt } from '@/components/ui/ContinuePrompt';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getNavigationCategories } from '@/lib/content';
import { SkipLink } from '@/components/ui/SkipLink';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { PreferencesProvider } from '@/components/user/PreferencesProvider';
import { ErrorBoundaryWrapper } from '@/components/app/ErrorBoundaryWrapper';
import { ProgressProvider } from '@/components/progress/ProgressProvider';
import { BookmarkProvider } from '@/components/bookmarks/BookmarkProvider';
import { KeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { getAppearanceBootstrapScript } from '@/lib/appearance';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'Quotient — Learn Software Engineering',
    template: '%s | Quotient',
  },
  description:
    'Structured courses, coding problems, cheat sheets, and question answers for software engineers — with runnable examples and worked solutions.',
  keywords: ['software engineering', 'programming courses', 'coding problems', 'career'],
  authors: [{ name: 'Quotient' }],
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/logo-light.svg', type: 'image/svg+xml' },
    ],
    apple: '/logo-light.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Quotient',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Quotient',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = getNavigationCategories();

  return (
    <html lang="en" suppressHydrationWarning className={inter.className}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Applies the saved font size/density before first paint so the page
            does not render at the default size and then visibly zoom. */}
        <script
          id="appearance-bootstrap"
          dangerouslySetInnerHTML={{ __html: getAppearanceBootstrapScript() }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-canvas text-fg-default antialiased transition-theme">
        <SkipLink />
        <AuthProvider>
          <ProgressProvider>
            <BookmarkProvider>
              <PreferencesProvider>
                <PWARegistration />
                <ContinuePrompt />
                <ThemeProvider>
                  <Navbar categories={categories} />
                  <KeyboardShortcuts />
                  <main id="main-content" className="flex-1">
                    <ErrorBoundaryWrapper>
                      {children}
                    </ErrorBoundaryWrapper>
                  </main>
                  <Footer />
                  <OfflineIndicator />
                </ThemeProvider>
              </PreferencesProvider>
            </BookmarkProvider>
          </ProgressProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
