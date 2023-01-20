import * as dotenv from 'dotenv'
dotenv.config()

if (typeof process.env.REDIS_URL === 'undefined') {
  throw new Error('Environment variable Redis URL is not set')
}
