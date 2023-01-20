import * as fs from 'fs'
import { validate as uuidValidate, version as uuidVersion } from 'uuid'
import validator from 'validator'

const standardHeaders = fs.readFileSync('./data/standard-headers.txt', 'utf8')
  .trim()
  .split('\n')

function filterHeaders (headers) {
  const result = {}
  const keys = Object.keys(headers).filter(it => !standardHeaders.includes(it))

  for (const key of keys) {
    result[key] = headers[key]
  }

  return result
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
  }

  const requestData = await redis.get(reqId)
  const [requestsCount, timeFrame] = requestData.split('/')
  const { url = '', ...requestQuery } = req.query

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
    return
  } else if (!validator.isURL(url, urlValidationOptions)) {
    res.json({ success: false, message: 'invalid url' })
    return
  }

  const requestHeaders = filterHeaders(req.headers)
  const requestBody = typeof req.body === 'string' ? req.body : ''

  console.log('query', requestQuery)
  console.log('headers', requestHeaders)
  console.log('body', requestBody)
  console.log(requestsCount, timeFrame)

  // todo axios request
  // todo give response
  // todo rate limit

  res.end('OK')
}
