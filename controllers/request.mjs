import axios from 'axios'
import * as fs from 'fs'
import { validate as uuidValidate, version as uuidVersion, v4 as uuidv4 } from 'uuid'
import validator from 'validator'

const packageJSON = JSON.parse(fs.readFileSync('./package.json', 'utf8'))

function validRequest (req, res) {
  const { url = '' } = req.query

  const urlValidationOptions = {
    protocols: ['http', 'https'],
    require_tld: true,
    require_protocol: true,
    require_host: true,
    require_valid_protocol: true,
    validate_length: true
  }

  if (url === '') {
    res.json({ success: false, message: 'empty url' })
    return false
  } else if (!validator.isURL(url, urlValidationOptions)) {
    res.json({ success: false, message: 'invalid url' })
    return false
  }

  return true
}

function prepareRequest (req) {
  const { url, ...restQueryParams } = req.query
  const requestUrl = new URL(url)

  const requestParams = new URLSearchParams([
    ...Array.from(requestUrl.searchParams.entries()),
    ...Object.entries(restQueryParams)
  ])

  const requestBody = typeof req.body === 'string' ? req.body : ''
  const requestHeaders = {}

  for (const key of Object.keys(req.headers)) {
    if (!['cdn-loop', 'connection', 'host'].includes(key) && !key.startsWith('cf-') && !key.startsWith('x-')) {
      requestHeaders[key] = req.headers[key]
    }
  }

  if (!Object.prototype.hasOwnProperty.call(req.headers, 'user-agent')) {
    requestHeaders['user-agent'] = packageJSON.name + '/' + packageJSON.version
  }

  return {
    method: req.method,
    url: requestUrl.origin + requestUrl.pathname,
    headers: requestHeaders,
    params: requestParams,
    data: requestBody
  }
}

export default async (req, res, next) => {
  const requestId = req.path.slice(1)

  if (!uuidValidate(requestId) || uuidVersion(requestId) !== 4) {
    return next()
  }

  const redis = req.app.get('redis')
  const requestExists = await redis.exists(requestId)

  if (!requestExists) {
    return next()
  } else if (!validRequest(req)) {
    return
  }

  const executionId = uuidv4()
  const options = prepareRequest(req)
  const store = req.app.get('store')
  let response = null
  let retry = 0

  await store.poll(requestId, executionId)

  while (true) {
    try {
      response = await axios({
        ...options,
        timeout: 1e4,
        responseType: 'text',
        validateStatus: () => true
      })
    } catch (err) {
      if (err.response) {
        response = err.response
      }
    }

    if (retry === 5 || (response !== null && response.status !== 429)) {
      break
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 1e3)
    })

    retry++
  }

  await store.ack(requestId, executionId)

  if (response === null) {
    res.status(500).end('Internal Server Error')
    return
  }

  const data = response.data.replaceAll(req.app.get('serverIp'), packageJSON.name)

  for (const key of Object.keys(response.headers)) {
    res.set(key, response.headers[key])
  }

  res.status(response.status).end(data)
}
