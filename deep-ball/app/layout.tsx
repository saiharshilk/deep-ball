import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Press_Start_2P, VT323, Silkscreen } from 'next/font/google'
import './globals.css'

const pressStart = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-vt323',
  display: 'swap',
})

const silkscreen = Silkscreen({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-silkscreen',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'DEEP BALL — Tennis Edition | Rarer Answers Hit Deeper',
  description:
    'Daily 8-bit tennis rarity trivia game. 7 prompts, 25 seconds each. Rarer answers hit deeper down the stadium court.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0B1220',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${pressStart.variable} ${vt323.variable} ${silkscreen.variable} dark`}
    >
      <body className="bg-[var(--night)] text-[var(--chalk)] font-mono antialiased selection:bg-[var(--ball)] selection:text-[var(--night)] overflow-x-hidden">
        {children}
        {/* Vercel Analytics only works when hosted on Vercel */}
        {process.env.VERCEL && <Analytics />}
      </body>
    </html>
  )
}
