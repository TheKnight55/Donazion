'use client'                     // NEED THIS to be able to embed HTML in TSX file
import React from 'react'
import Link from 'next/link'

export default function Home() {
  return (
    <div>
      <nav>
        <Link href="/donation_center">Calculator</Link>
        {' | '}
        <Link href="/login">Login</Link>
        {' | '}
        <Link href="/organization">Constants</Link>
      </nav>

      <h1>Welcome to Donazion</h1>
    </div>
  )
}