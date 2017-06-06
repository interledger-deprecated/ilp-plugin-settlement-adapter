'use strict'

const precision = (num) => {
  const significant = num.replace(/\./, '')
    .match(/^0*([0-9]+)$/)

  if (!significant) {
    throw new Error('Invalid amount: "' + num + '"')
  }

  return significant[1].length
}

const scale = (num) => {
  return num.split('.')[1].length
}

const scaleAmount = (num, scale) => {
  return ((+num * Math.pow(10, scale)) | 0) + ''
}

const checkAmount = (amount) => {
  if (typeof amount !== 'string' || !amount.match(/^[0-9]+(\.[0-9]+)?$/)) {
    throw new Error('Invalid amount: "' + amount + '"')
  }
}

const checkCurrency = (currency) => {
  if (typeof currency !== 'string' || !currency.match(/^[A-Z]{3}$/)) {
    throw new Error('Invalid currency: "' + currency + '"')
  }
}

const checkDestination = (destination) => {
  if (typeof destination !== 'string' || !destination.match(/^[a-zA-Z0-9._~-]+$/)) {
    throw new Error('Invalid destination: "' + destination + '"')
  }
}

const base64url = (buf) => {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

module.exports = {
  checkAmount,
  checkCurrency,
  checkDestination,
  precision,
  scale,
  scaleAmount,
  base64url
}
