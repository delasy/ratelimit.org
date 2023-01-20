import { v4 as uuidv4 } from 'uuid'

export default async (req, res) => {
  const redis = req.app.get('redis')
  const requestsCount = parseInt(req.query.requests_count) || 1
  const timeFrame = parseInt(req.query.time_frame) || 1000

  if (requestsCount < 0 || requestsCount > 9999) {
    res.json({
      success: false,
      message: 'invalid requests count'
    })

    return
  } else if (timeFrame < 0 || timeFrame > 9999) {
    res.json({
      success: false,
      message: 'invalid time frame'
    })

    return
  }

  const id = uuidv4()
  await redis.set(id, `${requestsCount}/${timeFrame}`)

  res.end(id)
}
