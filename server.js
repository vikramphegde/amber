import 'dotenv/config'
import { createServer } from 'node:http'
import chatHandler from './api/chat.js'

const port = Number(process.env.API_PORT || 3001)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('API_PORT must be a valid TCP port.')
}

const server = createServer((req, res) => {
  if (req.url !== '/chat') {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ error: 'Not found.' }))
    return
  }
  void chatHandler(req, res)
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Ember API listening on http://127.0.0.1:${port}`)
})
