'use strict'
const assert = require('chai').assert
const PluginSettlementAdapter = require('..')

describe('PluginSettlementAdapter', function () {
  beforeEach(function () {
    this.plugin = new PluginSettlementAdapter({
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
    assert.equal(info.precision, 3)
    assert.equal(info.scale, 2)
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
})
