import './dotenv.mjs'

import axios from 'axios'
import express from 'express'
import redis from './redis.mjs'
import routes from './routes/index.mjs'
import Store from './store.mjs'

const app = express()
const port = process.env.PORT || 8080
const serverIp = await axios.get('https://ci.thelang.io/echo?ip')
const store = new Store(redis)

app.disable('x-powered-by')
app.set('redis', redis)
app.set('serverIp', serverIp.data)
app.set('store', store)
app.set('trust proxy', true)

app.use(express.static('public'))
app.use(routes)

const server = app.listen(port, () => {
  console.info(`Listening on port ${port}`)
})

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received: closing HTTP server')

  server.close(() => {
    console.info('HTTP server closed')
  })
})
