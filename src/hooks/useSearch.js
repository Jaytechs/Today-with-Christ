// src/hooks/useSearch.js
// Client-side keyword search + category filtering

import { useMemo, useState } from 'react'

/**
 * useSearch — filter an array of items by keyword and/or category.
 *
 * @param {Array}    items         — full list (already loaded from Firestore)
 * @param {Object}   options
 * @param {string[]} options.textFields   — fields to search in (default: ['title','description'])
 * @param {string}   options.categoryField — field name for category filter (default: 'category')
 *
 * @returns {{ query, setQuery, category, setCategory, results, hasResults }}
 */
export function useSearch(items = [], { textFields = ['title', 'description'], categoryField = 'category' } = {}) {
  const [query,    setQuery]    = useState('')
  const [category, setCategory] = useState('All')

  const results = useMemo(() => {
    let filtered = items

    // Category filter
    if (category && category !== 'All') {
      filtered = filtered.filter(item => item[categoryField] === category)
    }

    // Keyword filter
    const q = query.trim().toLowerCase()
    if (q.length >= 2) {
      filtered = filtered.filter(item =>
        textFields.some(field => {
          const val = item[field]
          return typeof val === 'string' && val.toLowerCase().includes(q)
        })
      )
    }

    return filtered
  }, [items, query, category, textFields, categoryField])

  return {
    query,    setQuery,
    category, setCategory,
    results,
    hasResults: results.length > 0,
    isEmpty:    items.length === 0,
  }
}

// ── SearchBar component ───────────────────────────────────────────────────────
import { Search, X } from 'lucide-react'

export function SearchBar({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2"
        style={{ color: 'var(--text-m)' }}
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-9 pr-9 text-sm py-2"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-m)' }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

// ── CategoryTabs component ────────────────────────────────────────────────────
export function CategoryTabs({ categories, active, onChange }) {
  const all = ['All', ...categories]
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {all.map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
          style={{
            background: active === cat
              ? 'var(--accent)'
              : 'color-mix(in srgb, var(--accent) 10%, transparent)',
            color: active === cat ? '#fff' : 'var(--text-b)',
            border: `1px solid ${active === cat ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 20%, transparent)'}`,
          }}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
