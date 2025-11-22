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
      case 'location':
        return (
          <svg {...common} className={className}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
            <circle cx="12" cy="10" r="2" />
          </svg>
        )
      case 'phone':
        return (
          <svg {...common} className={className}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.86 19.86 0 0 1-3.07-8.63A2 2 0 0 1 4.09 2h3a2 2 0 0 1 2 1.72c.12 1.21.45 2.4.97 3.5a2 2 0 0 1-.45 2.11L8.91 11.09a16 16 0 0 0 6 6l1.76-1.76a2 2 0 0 1 2.11-.45c1.11.52 2.29.86 3.5.97A2 2 0 0 1 22 16.92z" />
          </svg>
        )
      case 'email':
        return (
          <svg {...common} className={className}>
            <path d="M3 8l9 6 9-6" />
            <path d="M21 8v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
          </svg>
        )
      case 'close':
        return (
          <svg {...common} className={className}>
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        )
      case 'lock':
        return (
          <svg {...common} className={className}>
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V8a5 5 0 0 1 10 0v3" />
          </svg>
        )
      case 'trash':
        return (
          <svg {...common} className={className}>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        )
      case 'check':
        return (
          <svg {...common} className={className}>
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )
      case 'cash':
        return (
          <svg {...common} className={className}>
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )
      case 'card':
        return (
          <svg {...common} className={className}>
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
          </svg>
        )
      case 'spark':
        return (
          <svg {...common} className={className}>
            <path d="M12 2l1.8 4.6L19 8l-4.6 1.8L12 14 10.6 9.8 6 8l4.6-1.4L12 2z" />
          </svg>
        )
    default:
      return null
  }
}
