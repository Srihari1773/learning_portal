import { useEffect, useRef, useState } from 'react'
import './VideoPlayer.css'

function formatTime(sec) {
  if (!isFinite(sec)) return '00:00'
  const s = Math.floor(sec % 60).toString().padStart(2, '0')
  const m = Math.floor((sec / 60) % 60).toString().padStart(2, '0')
  const h = Math.floor(sec / 3600).toString()
  return h === '0' ? `${m}:${s}` : `${h.padStart(2, '0')}:${m}:${s}`
}

export default function VideoPlayer({ src, poster, id = 'default-video' }) {
  const videoRef = useRef(null)
  const [bookmarks, setBookmarks] = useState([])
  const [title, setTitle] = useState('')
  const [overlay, setOverlay] = useState(false)
  const [apiAvailable, setApiAvailable] = useState(false)

  const storageKey = `bookmarks:${id}`

  useEffect(() => {
    let cancelled = false

    async function load() {
      // try API first
      try {
        const res = await fetch(`/api/health`)
        if (res.ok) {
          setApiAvailable(true)
          const r = await fetch(`/api/bookmarks/${encodeURIComponent(id)}`)
          if (r.ok) {
            const items = await r.json()
            if (!cancelled) setBookmarks(items)
            return
          }
        }
      } catch (e) {
        // ignore, fallback to localStorage
      }

      try {
        const raw = localStorage.getItem(storageKey)
        if (raw && !cancelled) setBookmarks(JSON.parse(raw))
      } catch (e) {
        console.error('failed loading bookmarks', e)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [storageKey])

  useEffect(() => {
    // persist locally always; if API is available we also sync there
    localStorage.setItem(storageKey, JSON.stringify(bookmarks))
  }, [bookmarks, storageKey])

  useEffect(() => {
    function onKey(e) {
      // Best-effort deterrent: detect PrintScreen key
      if (e.key === 'PrintScreen') {
        setOverlay(true)
        setTimeout(() => setOverlay(false), 2000)
      }
      // discourage opening devtools
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault()
        setOverlay(true)
        setTimeout(() => setOverlay(false), 1500)
      }
    }

    function onPaste(e) {
      const items = e.clipboardData && e.clipboardData.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          // someone tried to paste an image (likely screenshot)
          setOverlay(true)
          setTimeout(() => setOverlay(false), 2000)
        }
      }
    }

    function onContext(e) {
      e.preventDefault()
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('paste', onPaste)
    document.addEventListener('contextmenu', onContext)

    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('paste', onPaste)
      document.removeEventListener('contextmenu', onContext)
    }
  }, [])

  function addBookmark() {
    const v = videoRef.current
    if (!v) return
    const time = Math.floor(v.currentTime)
    const bm = { time, title: title || `Bookmark ${formatTime(time)}` }

    if (apiAvailable) {
      fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: id, time: Math.floor(time), title: bm.title }),
      })
        .then((r) => r.json())
        .then((saved) => setBookmarks((s) => [...s, saved]))
        .catch(() => setBookmarks((s) => [...s, { id: Date.now(), ...bm }]))
    } else {
      setBookmarks((s) => [...s, { id: Date.now(), ...bm }])
    }
    setTitle('')
  }

  function seek(time) {
    const v = videoRef.current
    if (!v) return
    v.currentTime = time
    v.play()
  }

  function removeBookmark(id) {
    setBookmarks((s) => s.filter((b) => b.id !== id))
    if (apiAvailable) {
      fetch(`/api/bookmarks/${id}`, { method: 'DELETE' }).catch(() => {})
    }
  }

  return (
    <div className="vp-root">
      <div className={`vp-overlay ${overlay ? 'visible' : ''}`} />
      <div className="vp-player-wrap">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          controls
          className="vp-video"
        />
      </div>

      <div className="vp-controls">
        <input
          placeholder="Optional bookmark title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button onClick={addBookmark}>Add Bookmark</button>
      </div>

      <div className="vp-bookmarks">
        <h3>Bookmarks</h3>
        {bookmarks.length === 0 && <p>No bookmarks yet.</p>}
        <ul>
          {bookmarks.map((b) => (
            <li key={b.id} className="vp-bm">
              <button className="vp-bm-time" onClick={() => seek(b.time)}>
                {formatTime(b.time)}
              </button>
              <span className="vp-bm-title">{b.title}</span>
              <button className="vp-bm-del" onClick={() => removeBookmark(b.id)} aria-label="Delete">✕</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
