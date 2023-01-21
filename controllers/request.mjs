import axios from 'axios'
import * as fs from 'fs'
import { validate as uuidValidate, version as uuidVersion } from 'uuid'
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

async function makeRequest (req, options) {
  const response = await axios({
    ...options,
    timeout: 1e4,
    responseType: 'text'
  })

  return response.data.replaceAll(req.app.get('serverIp'), packageJSON.name)
}

export default async (req, res, next) => {
  const reqId = req.path.slice(1)

  if (!uuidValidate(reqId) || uuidVersion(reqId) !== 4) {
    return next()
  }

  const redis = req.app.get('redis')
  const reqIdExists = await redis.exists(reqId)

  if (!reqIdExists) {
    return next()
  } else if (!validRequest(req)) {
    return
  }

  // todo rate limit
  // const requestData = await redis.get(reqId)
  // const [requestsCount, timeFrame] = requestData.split('/')

  const options = prepareRequest(req)

  try {
    const data = await makeRequest(req, options)
    res.end(data)
  } catch (err) {
    console.error(err)
    res.end('BAD')
  }
}
