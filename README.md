# ILP Plugin Settlement Adapter

> Wrapper around settlement plugins

## Why does this exist?

Settlement is an important part of any trust-based ledger. Debts are
meaningless if there is no way to pay them off.

This plugin facilitates settlement by getting added to a connector, emitting an incoming
transfer with an interledger packet, and then getting removed. The connector will see the
incoming transfer and route it to the proper destination.

Say `example.bob` settled for $3.00. You might use the plugin like so:

```
const prefix = 'settlement.' + uuid()
const currency = 'USD'

// add plugin to connector ...
connector.addPlugin(prefix, {
  plugin: 'ilp-plugin-settlement-adapter',
  currency: currency,
  options: {
    prefix: prefix,
    currency: currency,
    amount: '3.00',
    destination: 'example.bob'
  }
})

// emits an payment for 3.00 USD that gets routed to 'example.bob'
yield connector.getPlugin(prefix).receive()

// remove plugin from connector ...
yield connector.removePlugin(prefix)
```
