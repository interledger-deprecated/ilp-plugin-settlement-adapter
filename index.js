const co = require('co')
const EventEmitter = require('eventemitter2')
const Client = require('ilp-core').Client
const debug = require('debug')('ilp-plugin-meta')

module.exports = class PluginMeta extends EventEmitter {
  constructor (opts) {
    super()

    this.info = null

    const that = this
    debug('creating client of type', opts.__plugin)
    this.client = new Client(Object.assign({},
      opts,
      { _plugin: require(opts.__plugin) }
    ))

    this.client.plugin.sendMessage = function (msg) {
      debug('inner plugin is sending message:', msg)
      // when the plugin calls send message, this will forward to the connector
      this.emit('outgoing_message', msg)
      that.emit('incoming_message', msg)
      return Promise.resolve(null)
    }

    // make sure that our fake connector gets into the metadata
    this.client.plugin.getInfo = () => {
      return this.getInfo()
    }

    const plugin = this.client.plugin

    this.connect = co.wrap(this._connect).bind(this)
    this.getInfo = co.wrap(this._getInfo).bind(this)

    this.disconnect = this.client.disconnect.bind(plugin)
    this.getAccount = this.client.plugin.getAccount.bind(plugin)
    this.getBalance = this.client.plugin.getBalance.bind(plugin)
    this.getPrefix = this.client.plugin.getPrefix.bind(plugin)
    this.isConnected = this.client.plugin.isConnected.bind(plugin)
  }

  * _getInfo () {
    return this.info
  }

  sendMessage (msg) {
    // when the connector calls send message, it will be forwarded to the client
    debug('meta is sending message:', msg)
    this.client.plugin.emit('incoming_message', msg)
    this.emit('outgoing_message', msg)
    return Promise.resolve(null)
  }

  * _getQuote (amount, address) {
    debug('quoting with amount "' + amount + '" and address "' + address + '"')
    const quote = yield this.client.quote({
      sourceAmount: amount,
      destinationAddress: address
    })

    return quote.destinationAmount
  }

  * _connect () {
    debug('connecting client...')
    yield this.client.connect()
    debug('client connected; listening for events.')

    // get our metadata
    this.info = Object.assign({},
      yield this.client.plugin.getInfo(),
      { connectors: [{ name: 'other' }] }
    )

    const that = this
    this.client.plugin.on('incoming_transfer', co.wrap(function * (transfer) {
      debug('incoming_transfer has been triggered:', transfer)

      const address = transfer.data.memo
      const amount = transfer.amount

      debug(`got address "${address}" and amount "${amount}"`)

      try {
        yield that.emitAsync('incoming_transfer', Object.assign({}, transfer, {
          data: { ilp_header: {
            account: address,
            amount: (yield that._getQuote(amount, address)),
            data: {}
          } }
        }))
      } catch (e) {
        console.error(e)
      }
      debug('emitted notification')
    }))
  }

  sendTransfer () {
    return Promise.reject(new Error('you can\'t send on this plugin'))
  }
}
