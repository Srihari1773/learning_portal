import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

const dbPath = path.join(__dirname, 'bookmarks.db')
const jsonPath = path.join(__dirname, 'bookmarks.json')

let db = null
let useSqlite = false

async function initDb() {
  try {
    const mod = await import('better-sqlite3')
    const Database = mod.default || mod
    db = new Database(dbPath)
    db.prepare(
      `CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        videoId TEXT NOT NULL,
        time INTEGER NOT NULL,
        title TEXT,
        createdAt INTEGER NOT NULL
      )`
    ).run()
    useSqlite = true
    console.log('Using better-sqlite3 for storage')
  } catch (e) {
    // fallback to JSON file
    useSqlite = false
    if (!fs.existsSync(jsonPath)) fs.writeFileSync(jsonPath, '[]')
    console.warn('better-sqlite3 not available — falling back to JSON file storage')
  }
}

await initDb()

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.get('/api/bookmarks/:videoId', (req, res) => {
  if (useSqlite) {
    const stmt = db.prepare('SELECT id,videoId,time,title,createdAt FROM bookmarks WHERE videoId = ? ORDER BY time')
    const rows = stmt.all(req.params.videoId)
    res.json(rows)
  } else {
    const all = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    res.json(all.filter((r) => r.videoId === req.params.videoId).sort((a, b) => a.time - b.time))
  }
})

app.post('/api/bookmarks', (req, res) => {
  const { videoId, time, title } = req.body
  if (!videoId || typeof time !== 'number') return res.status(400).json({ error: 'invalid' })
  const createdAt = Date.now()
  if (useSqlite) {
    const stmt = db.prepare('INSERT INTO bookmarks (videoId,time,title,createdAt) VALUES (?,?,?,?)')
    const info = stmt.run(videoId, time, title || null, createdAt)
    const row = db.prepare('SELECT id,videoId,time,title,createdAt FROM bookmarks WHERE id = ?').get(info.lastInsertRowid)
    res.status(201).json(row)
  } else {
    const all = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    const id = Date.now()
    const row = { id, videoId, time, title: title || null, createdAt }
    all.push(row)
    fs.writeFileSync(jsonPath, JSON.stringify(all, null, 2))
    res.status(201).json(row)
  }
})

app.delete('/api/bookmarks/:id', (req, res) => {
  if (useSqlite) {
    const stmt = db.prepare('DELETE FROM bookmarks WHERE id = ?')
    const info = stmt.run(req.params.id)
    res.json({ deleted: info.changes })
  } else {
    const all = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    const before = all.length
    const filtered = all.filter((r) => String(r.id) !== String(req.params.id))
    fs.writeFileSync(jsonPath, JSON.stringify(filtered, null, 2))
    res.json({ deleted: before - filtered.length })
  }
})

app.listen(PORT, () => {
  console.log(`Bookmark API listening on http://localhost:${PORT}`)
})
