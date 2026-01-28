import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ThreatPulse | Intelligence Command Center',
  description: 'Personal threat intelligence platform for security professionals. Daily briefings, trend analysis, attack patterns, and defensive knowledge.',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased bg-void-950 text-steel-100 min-h-screen overflow-hidden">
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}
