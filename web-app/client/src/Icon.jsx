import React from 'react'

// Small inline SVG icon component. Add icons here and reference by name.
export default function Icon({ name, size = 18, className = '', stroke = 'currentColor', fill = 'none' }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: fill, stroke: stroke, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }

  switch (name) {
    case 'dashboard':
      return (
        <svg {...common} className={className}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="4" rx="1" />
          <rect x="14" y="11" width="7" height="10" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    case 'pos':
      return (
        <svg {...common} className={className}>
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M7 8h10" />
          <path d="M7 12h6" />
        </svg>
      )
    case 'products':
      return (
        <svg {...common} className={className}>
          <path d="M12 2l8 4-8 4-8-4 8-4z" />
          <path d="M2 10l10 5 10-5" />
          <path d="M2 17l10 5 10-5" />
        </svg>
      )
    case 'customers':
      return (
        <svg {...common} className={className}>
          <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    case 'invoices':
      return (
        <svg {...common} className={className}>
          <path d="M7 3h10v18H7z" />
          <path d="M7 9h10" />
          <path d="M11 13h2" />
        </svg>
      )
    case 'analytics':
      return (
        <svg {...common} className={className}>
          <path d="M3 3v18h18" />
          <path d="M7 15V8" />
          <path d="M12 15V5" />
          <path d="M17 15v-6" />
        </svg>
      )
    case 'reports':
      return (
        <svg {...common} className={className}>
          <path d="M3 3v18h18" />
          <path d="M8 7h8" />
          <path d="M8 12h8" />
          <path d="M8 17h5" />
        </svg>
      )
    case 'users':
      return (
        <svg {...common} className={className}>
          <path d="M16 11c1.657 0 3 1.343 3 3v4H5v-4c0-1.657 1.343-3 3-3" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      )
    case 'audit':
      return (
        <svg {...common} className={className}>
          <path d="M3 7h18" />
          <path d="M6 7v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
          <path d="M10 11h4" />
        </svg>
      )
    case 'add':
      return (
        <svg {...common} className={className}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      )
    case 'download':
      return (
        <svg {...common} className={className}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M7 10l5 5 5-5" />
          <path d="M12 15V3" />
        </svg>
      )
    case 'print':
      return (
        <svg {...common} className={className}>
          <path d="M6 9V2h12v7" />
          <rect x="6" y="13" width="12" height="8" rx="2" />
        </svg>
      )
    case 'whatsapp':
      return (
        <svg {...common} className={className}>
          <path d="M21 15a4 4 0 0 1-3 3c-1 0-2 0-3-.5L9 21l1.5-5c-.3-1-.5-2-.5-3a4 4 0 0 1 4-4h3" />
          <path d="M17 9.5a0.5 0.5 0 1 1-1 0 0.5 0.5 0 0 1 1 0z" />
        </svg>
      )
    default:
      return null
  }
}
