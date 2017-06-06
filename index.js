'use strict'

const ILP = require('ilp')
const IlpPacket = require('ilp-packet')
const EventEmitter = require('eventemitter2')
const Client = require('ilp-core').Client
const debug = require('debug')('ilp-plugin-settlement-adapter')
const utils = require('./src/utils')
const uuid = require('uuid4')

module.exports = class PluginSettlementAdapter extends EventEmitter {
  constructor (opts) {
    super()

    const self = this

    utils.checkAmount(opts.amount)
    utils.checkCurrency(opts.currency)
    utils.checkDestination(opts.destination)

    this._prefix = opts.prefix
    this._amount = opts.amount
    this._currency = opts.currency
    this._destination = opts.destination
    this._scale = utils.scale(this._amount)

    this._info = {
      prefix: this._prefix,
      currencyScale: this._scale,
      currencyCode: this._currency,
      currencySymbol: this._currency,
      connectors: opts.connectors
    }

    const that = this
    this._plugin = new EventEmitter()
    this._plugin.connect = () => Promise.resolve()
    this._plugin.getAccount = () => this._prefix + 'settler' 
    this._plugin.sendMessage = function (msg) {
      // when this plugin calls send message, this will forward to the connector
      debug('settlement adapter is sending message:', msg)

      this.emit('outgoing_message', msg)
      self.emit('incoming_message', msg)
      return Promise.resolve(null)
    }

    this._plugin.getInfo = () => {
      return this.getInfo()
    }

    this._connected = false
  }

  sendMessage (msg) {
    // when the connector calls send message, it will be forwarded to the client
    debug('connector is sending message:', msg)

    this._plugin.emit('incoming_message', msg)
    this.emit('outgoing_message', msg)
    return Promise.resolve(null)
  }

  async receive () {
    debug(`settle ${this._amount} ${this._currency} to ${this._destination}`)
    debug('quoting with amount "' + this._amount + '" and address "' + this._destination + '"')

    const quote = await ILP.ILQP.quote(this._plugin, {
      sourceAmount: utils.scaleAmount(this._amount, this._scale),
      destinationAddress: this._destination,
      connectors: [ this.getAccount() ]
    })
    debug('got quote', quote)

    const packet = IlpPacket.serializeIlpPayment({
      account: this._destination,
      amount: quote.destinationAmount,
      data: ''
    })

    await this.emitAsync('incoming_transfer', {
      id: uuid(),
      from: this._info.prefix + 'settler',
      to: this.getAccount(),
      ledger: this._info.prefix,
      amount: utils.scaleAmount(this._amount, this._scale),
      ilp: utils.base64url(packet)
    })

    debug('emitted settlement')
  }

  async sendTransfer () {
    throw new Error('you can\'t send on this plugin')
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
