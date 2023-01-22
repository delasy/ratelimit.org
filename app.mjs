import './dotenv.mjs'
import './hljs-the.mjs'

import axios from 'axios'
import express from 'express'
import { engine } from 'express-handlebars'
import path from 'path'
import { fileURLToPath } from 'url'
import redis from './redis.mjs'
import routes from './routes/index.mjs'
import Store from './store.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dev = process.env.NODE_ENV === 'development'
const app = express()
const bsStylesDirectory = path.join(__dirname, 'node_modules/bootstrap/dist/css')
const hljsStylesDirectory = path.join(__dirname, 'node_modules/highlight.js/styles')
const port = process.env.PORT || 8080
const serverIp = dev ? '127.0.0.1' : (await axios.get('https://ci.thelang.io/echo?ip')).data
const store = new Store(redis)

app.disable('x-powered-by')
app.engine('hbs', engine({ extname: '.hbs' }))
app.set('redis', redis)
app.set('serverIp', serverIp)
app.set('store', store)
app.set('trust proxy', true)
app.set('view engine', 'hbs')

app.use(express.static('public'))
app.use('/css/bootstrap/', express.static(bsStylesDirectory))
app.use('/css/highlight.js/', express.static(hljsStylesDirectory))
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
