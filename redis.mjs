import { createClient } from 'redis'

const client = createClient({
  url: process.env.REDIS_URL
})

client.on('error', (err) => {
  console.error(err)
})

await client.connect()
export default client
