import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'X Vizier - Trending Topics',
  description: 'Top 10 Trending Topics on X',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}

