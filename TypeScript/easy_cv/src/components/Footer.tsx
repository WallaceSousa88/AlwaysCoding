'use client'

import { HeartIcon } from '@heroicons/react/24/solid'

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-4 text-center shadow-sm">
      <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
        Desenvolvido com
        <HeartIcon className="h-4 w-4 text-red-500 inline-block drop-shadow-sm" />
        por FastJobbing @2025
      </p>
    </footer>
  )
}