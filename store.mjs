import EventEmitter from 'events'

/*
 * Using object properties shorthand for performance.
 *
 * q - queue
 * crc - config requests count
 * ctf - config time frame
 * arc - actual requests count
 * atf - actual time frame
 */
class Store extends EventEmitter {
  #data
  #redis

  constructor (redis) {
    super()

    this.#data = []
    this.#redis = redis
  }

  async ack (request, id) {
    console.info('await queueRemove')
    const data = await this.#queueRemove(request, id)
    if (data.q.length > 0) {
      console.info('emit', data.q[0])
    }
    data.q.length > 0 && this.emit(request + '-' + data.q[0])
  }

  async poll (request, id) {
    console.info('await queuePush')
    const dataExists = await this.#queuePush(request, id)

    if (dataExists.q.length !== 1) {
      console.info('await once start', dataExists.q.length)
      await new Promise((resolve) => {
        this.once(request + '-' + id, resolve)
      })
      console.info('await once end')
    }

    const data = await this.#queueGet(request)
    console.info('await queueGet', dataExists.q.length)

    if (data.atf + data.ctf > Date.now()) {
      data.arc++
    } else {
      data.arc = 1
      data.atf = Date.now()
    }

    if (data.arc > data.crc) {
      const drc = data.atf + data.ctf - Date.now()

      console.info('await time window start', drc)
      await new Promise((resolve) => {
        setTimeout(resolve, drc)
      })
      console.info('await time window end')

      data.arc = 1
      data.atf = Date.now()
    }

    console.info('await queueSet')
    await this.#queueSet(request, data)
  }

  async #queueGet (request) {
    if (this.#data.includes(request)) {
      const data = await this.#redis.get(request + '-data')
      return JSON.parse(data)
    }

    this.#data.push(request)

    const info = await this.#redis.get(request)
    const [requestsCount, timeFrame] = info.split('/')

    return await this.#queueSet(request, {
      id: request,
      q: [],
      crc: parseInt(requestsCount),
      ctf: parseInt(timeFrame),
      arc: 0,
      atf: 0
    })
  }

  async #queuePush (request, id) {
    const data = await this.#queueGet(request)
    data.q.push(id)
    return await this.#queueSet(request, data)
  }

  async #queueRemove (request, id) {
    const data = await this.#queueGet(request)
    data.q[0] === id && data.q.shift()
    return await this.#queueSet(request, data)
  }

  async #queueSet (request, data) {
    await this.#redis.set(request + '-data', JSON.stringify(data))
    return data
  }
}

export default Store
