'use client'
import Link from 'next/link'
import { BoltIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid'
import { useState } from 'react'

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="relative z-50 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center space-x-2">
        <BoltIcon
          className="h-6 w-6 drop-shadow-sm"
          style={{
            fill: '#F4B400',
            stroke: '#0F9D58',
            strokeWidth: 1.5,
          }}
        />
        <div className="text-xl font-bold italic tracking-tight flex space-x-1">
          <span style={{ color: '#4285F4' }}>Fast</span>
          <span style={{ color: '#DB4437' }}>Jobbing</span>
        </div>
      </div>

      <nav className="hidden md:flex space-x-6">
        <Link
          href="/"
          className="text-sm font-medium text-gray-700 hover:text-[#4285F4] transition-colors"
        >
          EasyCV
        </Link>
      </nav>

      <div className="md:hidden z-50">
        <button
          className="text-gray-700"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {menuOpen ? (
            <XMarkIcon className="h-6 w-6 transition-transform duration-200 rotate-90" />
          ) : (
            <Bars3Icon className="h-6 w-6 transition-transform duration-200" />
          )}
        </button>
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-white/10 transition-opacity duration-300 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div
        className={`absolute top-16 left-0 w-full bg-white shadow-lg rounded-b-lg transition-all duration-300 md:hidden ${
          menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <nav className="flex flex-col p-4 space-y-4">
          <Link
            href="/"
            className="text-sm font-medium text-gray-700 hover:text-[#4285F4] transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            EasyCV
          </Link>
        </nav>
      </div>
    </header>
  )
}
