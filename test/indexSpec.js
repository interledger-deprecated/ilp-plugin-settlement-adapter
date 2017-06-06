'use strict'
const IlpPacket = require('ilp-packet')
const assert = require('chai').assert
const PluginSettlementAdapter = require('..')

describe('PluginSettlementAdapter', function () {
  beforeEach(function () {
    this.plugin = new PluginSettlementAdapter({
      prefix: 'test.settlement.',
      amount: '3.00',
      currency: 'EUR',
      destination: 'example.red.bob'
    })
  })

  it('should be a class', function () {
    assert.isFunction(PluginSettlementAdapter)
  })

  it('should instantiate a plugin', function () {
    assert.isObject(this.plugin)
  })

  it('should connect', function () {
    return this.plugin.connect()
  })

  it('should be connected', function () {
    return this.plugin.connect()
      .then(() => {
        assert.isTrue(this.plugin.isConnected())
      })
  })

  it('should disconnect', function () {
    return this.plugin.disconnect()
      .then(() => {
        assert.isFalse(this.plugin.isConnected())
      })
  })

  it('should getInfo', function () {
    const info = this.plugin.getInfo()

    assert.equal(info.currencyCode, 'EUR')
    assert.equal(info.currencySymbol, 'EUR')
    assert.equal(info.currencyScale, 2)
    assert.isOk(info.prefix)
  })

  it('should getAccount', function () {
    assert.equal(this.plugin.getAccount(), this.plugin._info.prefix + 'connector')
  })

  it('should getBalance', function () {
    return this.plugin.getBalance()
      .then((balance) => {
        assert.equal(balance, '0')
      })
  })

  it('should quote and emit an incoming transfer', async function () {
    const quoteResponse = {
      to: 'test.settlement.settler',
      data: {
        method: 'quote_response',
        data: {
          source_connector_account: 'test.settlement.connector',
          destination_amount: '200'
        }
      }
    }

    this.plugin.on('incoming_message', (m) => {
      assert.equal(m.to, this.plugin.getAccount())
      assert.equal(m.data.data.destination_address, 'example.red.bob')
      quoteResponse.data.id = m.data.id

      setImmediate(() => {
        this.plugin.sendMessage(quoteResponse)
      })
    })

    this.plugin._plugin.on('incoming_message', (m) => {
      assert.deepEqual(m, quoteResponse)
    })

    this.plugin.on('incoming_transfer', (t) => {
      assert.equal(t.amount, '300')
      assert.equal(t.ledger, 'test.settlement.')
      assert.equal(t.to, 'test.settlement.connector')

      const parsed = IlpPacket.deserializeIlpPayment(
        Buffer.from(t.ilp, 'base64'))

      assert.equal(parsed.amount, '200')
      assert.equal(parsed.account, 'example.red.bob')
      assert.equal(parsed.data, '')
    })

    await this.plugin.receive()
  })
})
