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
    const data = await this.#queueRemove(request, id)
    data.q.length > 0 && this.emit(request + '-' + data.q[0])
  }

  async poll (request, id) {
    const dataExists = await this.#queuePush(request, id)

    if (dataExists.q.length !== 1) {
      await new Promise((resolve) => {
        this.on(request + '-' + id, resolve)
      })
    }

    const data = await this.#queueGet(request)

    if (data.atf + data.ctf > Date.now()) {
      data.arc++
    } else {
      data.arc = 1
      data.atf = Date.now()
    }

    if (data.arc > data.crc) {
      const drc = data.atf + data.ctf - Date.now()

      await new Promise((resolve) => {
        setTimeout(resolve, drc)
      })

      data.arc = 1
      data.atf = Date.now()
    }
  }

  async #queueGet (request) {
    let idx = this.#data.findIndex(it => it.id === request)

    if (idx === -1) {
      const requestData = await this.#redis.get(request)
      const [requestsCount, timeFrame] = requestData.split('/')

      this.#data.push({
        id: request,
        q: [],
        crc: parseInt(requestsCount),
        ctf: parseInt(timeFrame),
        arc: 0,
        atf: 0
      })

      idx = this.#data.length - 1
    }

    return this.#data[idx]
  }

  async #queuePush (request, id) {
    const data = await this.#queueGet(request)
    data.q.push(id)
    return data
  }

  async #queueRemove (request, id) {
    const data = await this.#queueGet(request)
    data.q[0] === id && data.q.shift()
    return data
  }
}

export default Store
