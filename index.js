const co = require('co')
const EventEmitter = require('events')
const Client = require('ilp-core').Client

module.exports = class PluginMeta extends EventEmitter {
  constructor (opts) {
    super()

    const that = this
    this.client = new Client(opts)
    this.client.plugin.sendMessage = function (msg) {
      // when the plugin calls send message, this will forward to the connector
      this.emit('outgoing_message', msg)
      that.emit('incoming_message', msg)
    }

    this.connect = co.wrap(this._connect).bind(this)
    this.disconnect = this.client.disconnect
    this.getAccount = this.client.plugin.getAccount
    this.getBalance = this.client.plugin.getBalance
    this.getInfo = this.client.plugin.getInfo
    this.getPrefix = this.client.plugin.getPrefix
    this.isConnected = this.client.plugin.isConnected
  }

  sendMessage (msg) {
    // when the connector calls send message, it will be forwarded to the client
    this.client.plugin.emit('incoming_message', msg)
    this.emit('outgoing_message', msg)
    return Promise.resolve(null)
  }

  * _getQuote (amount, address) {
    const quote = yield this.client.quote({
      sourceAmount: amount,
      destinationAddress: address
    })

    return quote.destinationAmount
  }

  * _connect () {
    yield this.client.connect()

    this.client.on('incoming_transfer', (transfer) => {
      const address = transfer.data.memo
      const amount = transfer.amount

      this.emit('incoming_transfer', Object.assign({}, transfer, {
        data: { ilp_header: {
          account: address,
          amount: (yield this._getQuote(amount, address)),
          data: {}
        } }
      })
    })
  }

  sendTransfer () {
    return Promise.reject(new Error('you can\'t send on this plugin'))
  }
}
