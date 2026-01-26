import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cyber Threat Radar | Intelligence Briefings',
  description: 'Personal cyber threat intelligence briefings, trends, and learning platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased bg-paper-50 text-ink-900 min-h-screen">
        {children}
      </body>
    </html>
  )
}
