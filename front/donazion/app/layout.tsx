import type { ReactNode } from 'react'
import Link from 'next/link'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <nav>
          <Link href="/">Home</Link>
          {' | '}
          <Link href="/login">Login</Link>
          {' | '}
          <Link href="/constants">Constants</Link>
        </nav>

        {children}
      </body>
    </html>
  )
}