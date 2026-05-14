// src/hooks/useFirestore.js
// Safe Firestore subscription hooks with loading, error, and empty states

import { useState, useEffect, useRef } from 'react'

/**
 * useCollection — subscribe to a Firestore real-time listener.
 * Automatically cleans up on unmount.
 *
 * @param {Function} subscribeFn  — function that takes a callback and returns an unsubscribe fn
 * @param {Array}    deps         — dependency array (changes cause resubscription)
 * @returns {{ data, loading, error }}
 */
export function useCollection(subscribeFn, deps = []) {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const unsubRef  = useRef(null)

  useEffect(() => {
    if (!subscribeFn) { setLoading(false); return }

    setLoading(true)
    setError(null)

    try {
      unsubRef.current = subscribeFn((result) => {
        setData(result)
        setLoading(false)
      })
    } catch (err) {
      console.error('[useCollection]', err)
      setError(err)
      setLoading(false)
    }

    return () => {
      if (typeof unsubRef.current === 'function') unsubRef.current()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}

/**
 * useDocument — fetch a single Firestore document (one-time, not real-time).
 *
 * @param {Function} fetchFn  — async function returning the document
 * @param {Array}    deps
 */
export function useDocument(fetchFn, deps = []) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!fetchFn) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchFn()
      .then(result => { if (!cancelled) { setData(result); setLoading(false) } })
      .catch(err   => { if (!cancelled) { console.error('[useDocument]', err); setError(err); setLoading(false) } })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}
