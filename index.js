'use strict'

const co = require('co')
const EventEmitter = require('eventemitter2')
const Client = require('ilp-core').Client
const debug = require('debug')('ilp-plugin-settlement-adapter')
const utils = require('./src/utils')
const uuid = require('uuid4')

module.exports = class PluginSettlementAdapter extends EventEmitter {
  constructor (opts) {
    super()

    utils.checkAmount(opts.amount)
    utils.checkCurrency(opts.currency)
    utils.checkDestination(opts.destination)

    this._amount = opts.amount
    this._currency = opts.currency
    this._destination = opts.destination

    this._info = {
      prefix: 'local.settle.' + uuid() + '.',
      precision: utils.precision(this._amount),
      scale: utils.scale(this._amount),
      currencyCode: this._currency,
      currencySymbol: this._currency
    }

    this._plugin = new EventEmitter()
    this._plugin.sendMessage = function (msg) {
      // when this plugin calls send message, this will forward to the connector
      debug('settlement adapter is sending message:', msg)

      this.emit('outgoing_message', msg)
      that.emit('incoming_message', msg)
      return Promise.resolve(null)
    }

    this._plugin.getInfo = () => {
      return this.getInfo()
    }

    this._client = new Client(this._plugin)
    this._connected = false
  }

  sendMessage (msg) {
    // when the connector calls send message, it will be forwarded to the client
    debug('connector is sending message:', msg)

    this._plugin.emit('incoming_message', msg)
    this.emit('outgoing_message', msg)
    return Promise.resolve(null)
  }

  * _receive () {
    debug(`settle ${this._amount} ${this._currency} to ${this._destination}`)
    debug('quoting with amount "' + amount + '" and address "' + address + '"')

    const quote = yield this._client.quote({
      sourceAmount: amount,
      destinationAddress: address
    })

    yield this.emitAsync('incoming_transfer', {
      id: uuid(),
      account: this.getAccount(),
      ledger: this._info.prefix,
      amount: this._amount,
      data: {
        ilp_header: {
          account: this._destination,
          amount: quote.destinationAmount,
          data: {}
        }
      }
    })

    debug('emitted settlement')
  }

  receive () {
    return co.wrap(this._receive).call(this)
  }

  sendTransfer () {
    return Promise.reject(new Error('you can\'t send on this plugin'))
  }

  getBalance () {
    return Promise.resolve('0')
  }

  connect () {
    this._connected = true
    return Promise.resolve(null)
  }

  disconnect () {
    this._connected = false
    return Promise.resolve(null)
  }

  isConnected () {
    return this._connected
  }

  getInfo () {
    return this._info
  }

  getAccount () {
    return this._info.prefix + 'connector'
  }
}
