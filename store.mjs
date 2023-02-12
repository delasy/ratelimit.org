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
  #available
  #data
  #redis

  constructor (redis) {
    super()

    this.#available = []
    this.#data = []
    this.#redis = redis
  }

  ack (requestId, executionId) {
    console.info('queueRemove', executionId)
    const dataIdx = this.#queueGetIdx(requestId)

    if (this.#data[dataIdx].q[0] === executionId) {
      this.#data[dataIdx].q.shift()
      this.#available[dataIdx] = true
    }
  }

  async poll (requestId, executionId) {
    console.info('queuePush', executionId)
    const dataIdx = this.#queueGetIdx(requestId)
    this.#data[dataIdx].q.push(executionId)

    if (this.#data[dataIdx].q.length > 1) {
      console.info('once start', executionId, this.#data[dataIdx].q.length)

      while (!this.#available[requestId] || this.#data[dataIdx].q[0] !== executionId) {
        await new Promise((resolve) => setImmediate(resolve))
      }

      this.#available[requestId] = false
      console.info('once end', executionId)
    }

    console.info('queueGet', executionId, this.#data[dataIdx].q.length)

    if (this.#data[dataIdx].atf + this.#data[dataIdx].ctf > Date.now()) {
      this.#data[dataIdx].arc++
    } else {
      this.#data[dataIdx].arc = 1
      this.#data[dataIdx].atf = Date.now()
    }

    if (this.#data[dataIdx].arc > this.#data[dataIdx].crc) {
      const drc = this.#data[dataIdx].atf + this.#data[dataIdx].ctf - Date.now()

      console.info('time window start', executionId, drc)
      await new Promise((resolve) => {
        setTimeout(resolve, drc)
      })

      this.#data[dataIdx].arc = 1
      this.#data[dataIdx].atf = Date.now()
    }
  }

  #queueGetIdx (requestId) {
    let idx = this.#data.findIndex(it => it.id === requestId)

    if (idx === -1) {
      this.#data.push({
        id: requestId,
        q: [],
        crc: 1,
        ctf: 1e3,
        arc: 0,
        atf: 0
      })

      this.#available.push(true)
      idx = this.#data.length - 1

      this.#redis.get(requestId).then((info) => {
        const [requestsCount, timeFrame] = info.split('/')
        this.#data[idx].crc = parseInt(requestsCount)
        this.#data[idx].ctf = parseInt(timeFrame)
      })
    }

    return idx
  }
}

export default Store
