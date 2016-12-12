# ILP Plugin Meta

> Wrapper around settlement plugins

## Why does this exist?

Settlement is an important part of any trust-based ledger. Debts are
meaningless if there is no way to pay them off.

There are already existing "optimistic plugins" that can listen for real-money
settlements, and then emit this as an event. A settlement has two parts,
though. The first part is receipt of real funds, and the second part is
crediting a trustline/trust-based account.

`ilp-plugin-meta` handles this second step by intercepting incoming transfers
on a settlement plugin, attaching an ILP header to make sure that the funds are
routed to credit the right account, and then emitting the transfer.

Because the ILP header needs to contain the destination amount, and because
settlements aren't necessarily done over a system where ILP quoting is
possible, `ilp-plugin-meta` uses `ilp-core` to quote incoming payments by
source amount.

## How do I use this?

`ilp-plugin-meta` looks a lot like a normal plugin, in the configuration.
Say you had an optimistic plugin configured like so:

```js
CONNECTOR_LEDGERS={
  // ...
  "example.red.": {
    "currency": "USD",
    "plugin": "ilp-plugin-example",
    "options": {
      "username": "alice",
      "password": "password123"
    }
  }
}
```

To make this use `ilp-plugin-meta`, you simply change it to:

```js
CONNECTOR_LEDGERS={
  // ...
  "example.red.": {
    "currency": "USD",
    "plugin": "ilp-plugin-meta", // change this
    "options": {
      "_plugin": "ilp-plugin-example", // and this becomes the wrapped plugin
      "username": "alice",
      "password": "password123"
    }
  }
}
```
