/* eslint-env mocha */
global.applicationPath = __dirname

const dashboard = require('@userappstore/dashboard')
const fs = require('fs')
const stripe = require('stripe')(  )
const testData = require('@userappstore/dashboard/test-data.json')
const util = require('util')

const stripeKey = {
  api_key: process.env.STRIPE_KEY
}

const TestHelper = module.exports = dashboard.loadTestHelper()

const createRequestWas = module.exports.createRequest
module.exports.createRequest = (rawURL, method) => {
  const req = createRequestWas(rawURL, method)
  req.stripeKey = stripeKey
  req.userAgent = 'A web browser user agent'
  req.ip = '8.8.8.8'
  req.country = {
    country: {
      iso_code: 'US'
    }
  }
  return req
}

module.exports.createAdditionalOwner = createAdditionalOwner
module.exports.createExternalAccount = createExternalAccount
module.exports.createMultiPart = createMultiPart
module.exports.createPayout = createPayout
module.exports.createStripeAccount = createStripeAccount
module.exports.createStripeRegistration = createStripeRegistration
module.exports.submitAdditionalOwners = submitAdditionalOwners
module.exports.submitStripeAccount = submitStripeAccount
module.exports.triggerVerification = triggerVerification
module.exports.waitForPayout = util.promisify(waitForPayout)

async function createStripeAccount(user, properties) {
  const req = TestHelper.createRequest(`/api/user/connect/create-stripe-account?accountid=${user.account.accountid}`)
  req.session = user.session
  req.account = user.account
  req.body = {
    type: properties.type,
    country: properties.country
  }
  user.stripeAccount = await req.post(req)
  return user.stripeAccount
}

async function createStripeRegistration (user, properties) {
  const req = TestHelper.createRequest(`/api/user/connect/update-${user.stripeAccount.legal_entity.type}-registration?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  req.body = {
    first_name: user.profile.firstName,
    last_name: user.profile.lastName,
    email: user.profile.email
  }
  for (const property in properties) {
    if (property === 'type' || property === 'country') {
      continue
    }
    req.body[property] = properties[property]
  }
  createMultiPart(req, req.body)
  user.stripeAccount = await req.patch(req)
  return user.stripeAccount
}

  // via https://github.com/coolaj86/node-examples-js/blob/master/http-and-html5/http-upload.js
  // creating a stripe account requires posting an id image in a multipart payload
async function createMultiPart (req, body) {
  const boundary = '-----------------' + dashboard.Timestamp.now
  const delimiter = `\r\n--${boundary}`
  const closeDelimiter = delimiter + "--"
  const headers = [
    'Content-Disposition: form-data; name="id_scan"; filename="id_scan.png"\r\n',
    'Content-Type: image/png\r\n'
  ]
  const filename = body.file || 'test-documentid-success.png'
  delete (body.file)
  const buffers = [
    new Buffer(delimiter + '\r\n' + headers.join('') + '\r\n'),
    fs.readFileSync(`${__dirname}/${filename}`)
  ]
  for (const field in body) {
    buffers.push(new Buffer(`${delimiter}\r\nContent-Disposition: form-data; name="${field}"\r\n\r\n${body[field]}`))
  }
  buffers.push(new Buffer(closeDelimiter))
  const multipartBody = Buffer.concat(buffers)
  req.headers = {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': multipartBody.length
  }
  req.body = multipartBody
}

async function createExternalAccount(user, details) {
  const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  req.body = details
  user.stripeAccount = await req.patch(req)
  return user.stripeAccount.external_accounts.data[0]
}

let testDataIndex = 0
async function createAdditionalOwner(user, properties) {
  testDataIndex++
  const req = TestHelper.createRequest(`/api/user/connect/create-additional-owner?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  req.body = {
    first_name: testData[testDataIndex].firstName,
    last_name: testData[testDataIndex].lastName,
    email: testData[testDataIndex].email
  }
  if (properties) {
    for (const field in properties) {
      req.body[field] = properties[field]
    }
  }
  createMultiPart(req, req.body)
  const owner = await req.post(req)
  user.owner = owner
  return owner
}

let payoutAmount = 0
async function createPayout(user) {
  payoutAmount += 100
  // the Stripe API has to be used here directly because this module
  // assumes payouts will be handled automatically so there aren't
  // any API endpoints to create payouts
  const accountKey = {
    api_key: stripeKey.api_key,
    stripe_account: user.stripeAccount.id
  }
  const chargeInfo = {
    amount: payoutAmount * 2,
    currency: 'usd',
    source: 'tok_bypassPending',
    description: 'Test charge'
  }
  await stripe.charges.create(chargeInfo, accountKey)
  const payoutInfo = {
    amount: payoutAmount,
    currency: 'usd',
    metadata: {
      testNumber: global.testNumber
    }
  }
  const payout = await stripe.payouts.create(payoutInfo, accountKey)
  user.payout = payout
  return payout
}

async function submitAdditionalOwners(user) {
  const req = TestHelper.createRequest(`/api/user/connect/set-additional-owners-submitted?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  const stripeAccount = await req.patch(req)
  user.stripeAccount = stripeAccount
  return stripeAccount
}

async function submitStripeAccount(user) {
  const req = TestHelper.createRequest(`/api/user/connect/set-${user.stripeAccount.legal_entity.type}-registration-submitted?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  const stripeAccount = await req.patch(req)
  user.stripeAccount = stripeAccount
  return stripeAccount
}

async function triggerVerification(user) {
  const accountKey = {
    api_key: stripeKey.api_key,
    stripe_account: user.stripeAccount.id
  }
  const chargeInfo = {
    amount: 2000,
    currency: 'usd',
    source: 'tok_visa_triggerVerification',
    description: 'Test charge'
  }
  const charge = await stripe.charges.create(chargeInfo, accountKey)
  user.charge = charge
  return charge
}

async function waitForPayout(stripeid, previousid, callback) {
  callback = callback || previousid
  if (callback === previousid) {
    previousid = null
  }
  async function wait() {
    if (global.testEnded) {
      return
    }
    const itemids = await dashboard.StorageList.list(`${global.appid}/stripeAccount/payouts/${stripeid}`, 0, 1)
    if (!itemids || !itemids.length) {
      return setTimeout(wait, 10)
    }
    if (previousid && previousid === itemids[0]) {
      return setTimeout(wait, 10)
    }
    return callback(null, itemids[0])
  }
  return setTimeout(wait, 10)
}
