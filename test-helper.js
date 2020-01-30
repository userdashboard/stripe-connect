/* eslint-env mocha */
global.applicationPath = global.applicationPath || __dirname
global.stripeAPIVersion = '2019-08-14'
global.maximumStripeRetries = 0
global.connectWebhookEndPointSecret = true

const connect = require('./index.js')
if (process.env.GENERATE_COUNTRY) {
  connect.countrySpecs = [
    connect.countrySpecIndex[process.env.GENERATE_COUNTRY]
  ]
}
const fs = require('fs')
let ngrok
if (process.env.NGROK) {
  ngrok = require('ngrok')
}
const packageJSON = require('./package.json')
const stripe = require('stripe')()
stripe.setApiVersion(global.stripeAPIVersion)
if (global.maxmimumStripeRetries) {
  stripe.setMaxNetworkRetries(global.maximumStripeRetries)
}
stripe.setTelemetryEnabled(false)
stripe.setAppInfo({
  version: packageJSON.version,
  name: '@userdashboard/stripe-connect (test suite)',
  url: 'https://github.com/userdashboard/stripe-connect'
})

const util = require('util')
const stripeKey = {
  api_key: process.env.STRIPE_KEY
}

const wait = util.promisify((callback) => {
  return setTimeout(callback, 100)
})

const events = fs.readdirSync(`${__dirname}/src/www/webhooks/connect/stripe-webhooks`)
const eventList = []
for (const event of events) {
  eventList.push(event.substring(0, event.indexOf('.js')))
}

const waitForWebhook = util.promisify(async (webhookType, matching, callback) => {
  async function wait () {
    if (global.testEnded) {
      return
    }
    if (!global.webhooks || !global.webhooks.length) {
      return setTimeout(wait, 20)
    }
    for (const received of global.webhooks) {
      if (received.type !== webhookType) {
        continue
      }
      if (matching(received)) {
        return setTimeout(() => {
          callback(null, received)
        }, 20)
      }
    }
    return setTimeout(wait, 20)
  }
  return setTimeout(wait, 20)
})

module.exports = {
  createBeneficialOwner,
  createCompanyDirector,
  createExternalAccount,
  createMultiPart,
  createPayout,
  createStripeAccount,
  createStripeRegistration,
  createCompanyRepresentative,
  submitBeneficialOwners,
  submitCompanyDirectors,
  submitStripeAccount,
  triggerVerification,
  updateBeneficialOwner,
  updateStripeRegistration,
  updateCompanyRepresentative,
  waitForAccountRequirement: util.promisify(waitForAccountRequirement),
  waitForPersonRequirement: util.promisify(waitForPersonRequirement),
  waitForWebhook,
  waitForPendingFieldsToLeave: util.promisify(waitForPendingFieldsToLeave),
  waitForVerification: util.promisify(waitForVerification),
  waitForPayoutsEnabled: util.promisify(waitForPayoutsEnabled),
  waitForVerificationFieldsToLeave: util.promisify(waitForVerificationFieldsToLeave),
  waitForVerificationFieldsToReturn: util.promisify(waitForVerificationFieldsToReturn),
  waitForVerificationFailure: util.promisify(waitForVerificationFailure),
  waitForVerificationStart: util.promisify(waitForVerificationStart),
  waitForPayout: util.promisify(waitForPayout),
  'success_id_scan_front.png': {
    filename: 'id_scan_front.png',
    name: 'id_scan_front.png',
    path: `${__dirname}/test-documentid-success.png`
  },
  'fail_id_scan_front.png': {
    filename: 'id_scan_front.png',
    name: 'id_scan_front.png',
    path: `${__dirname}/test-documentid-failed.png`
  },
  'success_id_scan_back.png': {
    filename: 'id_scan_back.png',
    name: 'id_scan_back.png',
    path: `${__dirname}/test-documentid-success.png`
  },
  'fail_id_scan_back.png': {
    filename: 'id_scan_back.png',
    name: 'id_scan_back.png',
    path: `${__dirname}/test-documentid-failed.png`
  }
}

let TestHelper, tunnel
before(async () => {
  let webhooks = await stripe.webhookEndpoints.list(stripeKey)
  while (webhooks.data && webhooks.data.length) {
    for (const webhook of webhooks.data) {
      if (webhook === 0) {
        continue
      }
      try {
        await stripe.webhookEndpoints.del(webhook.id, stripeKey)
      } catch (error) {
      }
    }
    try {
      webhooks = await stripe.webhookEndpoints.list(stripeKey)
    } catch (error) {
      webhooks = { data: [0] }
    }
  }
  let accounts = await stripe.accounts.list(stripeKey)
  while (accounts.data && accounts.data.length) {
    for (const account of accounts.data) {
      try {
        await stripe.accounts.del(account.id, stripeKey)
      } catch (error) {
      }
    }
    try {
      accounts = await stripe.accounts.list(stripeKey)
    } catch (error) {
    }
  }
  TestHelper = require('@userdashboard/dashboard/test-helper.js')
  for (const x in TestHelper) {
    module.exports[x] = TestHelper[x]
  }
  module.exports.createRequest = (rawURL, method) => {
    const req = TestHelper.createRequest(rawURL, method)
    req.stripeKey = stripeKey
    return req
  }
  if (!process.env.NGROK) {
    const webhook = await stripe.webhookEndpoints.create({
      connect: true,
      url: `${process.env.DASHBOARD_SERVER}/webhooks/connect/index-connect-data`,
      enabled_events: eventList
    }, stripeKey)
    global.connectWebhookEndPointSecret = webhook.secret
  }
})

afterEach(async () => {
  let accounts = await stripe.accounts.list(stripeKey)
  while (accounts.data && accounts.data.length) {
    for (const account of accounts.data) {
      try {
        await stripe.accounts.del(account.id, stripeKey)
      } catch (error) {
      }
    }
    accounts = await stripe.accounts.list(stripeKey)
  }
})

after(async () => {
  if (process.env.NGROK) {
    ngrok.kill()
  }
  let webhooks = await stripe.webhookEndpoints.list(stripeKey)
  while (webhooks.data && webhooks.data.length) {
    for (const webhook of webhooks.data) {
      await stripe.webhookEndpoints.del(webhook.id, stripeKey)
    }
    webhooks = await stripe.webhookEndpoints.list(stripeKey)
  }
})

const helperRoutes = require('./test-helper-routes.js')

beforeEach(async () => {
  global.sitemap['/api/fake-payout'] = helperRoutes.fakePayout
  global.sitemap['/api/substitute-failed-document-front'] = helperRoutes.substituteFailedDocumentFront
  global.sitemap['/api/substitute-failed-document-back'] = helperRoutes.substituteFailedDocumentBack
  global.stripeJS = false
  global.maximumStripeRetries = 0
  global.webhooks = []
  if (process.env.NGROK) {
    let webhooks = await stripe.webhookEndpoints.list(stripeKey)
    while (webhooks.data && webhooks.data.length) {
      for (const webhook of webhooks.data) {
        if (webhook === 0) {
          continue
        }
        try {
          await stripe.webhookEndpoints.del(webhook.id, stripeKey)
        } catch (error) {
        }
      }
      try {
        webhooks = await stripe.webhookEndpoints.list(stripeKey)
      } catch (error) {
        webhooks = { data: [0] }
      }
    }
    ngrok.kill()
    tunnel = null
    while (!tunnel) {
      try {
        tunnel = await ngrok.connect({
          port: process.env.PORT
        })
        if (!tunnel) {
          continue
        }
        break
      } catch (error) {
        continue
      }
    }
    const webhook = await stripe.webhookEndpoints.create({
      connect: true,
      url: `${tunnel}/webhooks/connect/index-connect-data`,
      enabled_events: eventList
    }, stripeKey)
    console.log(webhook)
    global.connectWebhookEndPointSecret = webhook.secret
    return
  }
})

async function createStripeAccount (user, properties) {
  const req = TestHelper.createRequest(`/api/user/connect/create-stripe-account?accountid=${user.account.accountid}`)
  req.session = user.session
  req.account = user.account
  req.body = properties
  user.stripeAccount = await req.post()
  global.monitorStripeAccount = user.stripeAccount.id
  if (req.body.type === 'company') {
    const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account-company-representative?stripeid=${user.stripeAccount.id}`)
    req2.stripeKey = stripeKey
    req2.session = user.session
    req2.account = user.account
    while (!user.representative) {
      try {
        user.representative = await global.api.user.connect.CompanyRepresentative.get(req2)
      } catch (error) {
      }
    }
  }
  return user.stripeAccount
}

async function createStripeRegistration (user, properties, uploads) {
  const req = TestHelper.createRequest(`/api/user/connect/update-${user.stripeAccount.business_type}-registration?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  req.uploads = uploads || {}
  req.body = createMultiPart(req, properties)
  user.stripeAccount = await req.patch()
  return user.stripeAccount
}

async function updateStripeRegistration (user, properties, uploads) {
  const req = TestHelper.createRequest(`/api/user/connect/update-${user.stripeAccount.business_type}-registration?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  req.uploads = uploads || []
  req.body = createMultiPart(req, properties)
  user.stripeAccount = await req.patch()
  return user.stripeAccount
}

async function createCompanyRepresentative (user, properties, uploads) {
  const req = TestHelper.createRequest(`/api/user/connect/create-company-representative?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  req.uploads = uploads || {}
  req.body = createMultiPart(req, properties)
  user.representative = await req.post()
  return user.stripeAccount
}

async function updateCompanyRepresentative (user, properties, uploads) {
  const req = TestHelper.createRequest(`/api/user/connect/update-company-representative?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  req.uploads = uploads || {}
  req.body = createMultiPart(req, properties)
  const representative = await req.patch()
  // await waitForWebhook('person.updated', (stripeEvent) => {
  //   return stripeEvent.data.object.id === representative.id
  // })
  user.representative = representative
  return user.stripeAccount
}

function createMultiPart (req, body) {
  const boundary = '-----------------test' + global.testNumber
  const delimiter = `\r\n--${boundary}`
  const closeDelimiter = delimiter + '--'
  const buffers = []
  if (req.uploads) {
    for (const field in req.uploads) {
      const filename = req.uploads[field].filename
      const type = filename.endsWith('.png') ? 'image/png' : 'image/jpeg'
      const segment = [
        delimiter,
        `Content-Disposition: form-data; name="${field}"; filename="${filename}"`,
        `Content-Type: ${type}`,
        '\r\n'
      ]
      buffers.push(Buffer.from(segment.join('\r\n')), fs.readFileSync(req.uploads[field].path), Buffer.from('\r\n'))
    }
  }
  for (const field in body) {
    buffers.push(Buffer.from(`${delimiter}\r\nContent-Disposition: form-data; name="${field}"\r\n\r\n${body[field]}`))
  }
  buffers.push(Buffer.from(closeDelimiter))
  const multipartBody = Buffer.concat(buffers)
  req.headers = req.headers || {}
  req.headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`
  req.headers['Content-Length'] = multipartBody.length
  return multipartBody
}

async function createExternalAccount (user, body) {
  const req = TestHelper.createRequest(`/api/user/connect/update-payment-information?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  req.body = body
  user.stripeAccount = await req.patch()
  const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
  req2.session = user.session
  req2.account = user.account
  req2.stripeKey = stripeKey
  while (true) {
    try {
      user.stripeAccount = await global.api.user.connect.StripeAccount.get(req2)
      if (user.stripeAccount.external_accounts.total_count === 1) {
        return user.stripeAccount
      }
    } catch (error) {
    }
    await wait()
  }
}

async function createBeneficialOwner (user, body, uploads) {
  const req = TestHelper.createRequest(`/api/user/connect/create-beneficial-owner?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  req.uploads = uploads
  req.body = createMultiPart(req, body)
  user.owner = await req.post()
  const req2 = TestHelper.createRequest(`/api/user/connect/beneficial-owner?personid=${user.owner.id}`)
  req2.session = user.session
  req2.account = user.account
  req2.stripeKey = stripeKey
  while (true) {
    try {
      user.owner = await global.api.user.connect.BeneficialOwner.get(req2)
      return user.owner
    } catch (error) {
    }
    await wait()
  }
}

async function updateBeneficialOwner (user, body, uploads) {
  const req = TestHelper.createRequest(`/api/user/connect/update-beneficial-owner?personid=${user.owner.id}`)
  req.session = user.session
  req.account = user.account
  req.uploads = uploads
  req.body = createMultiPart(req, body)
  user.owner = await req.patch()
  // await waitForWebhook('person.updated', (stripeEvent) => {
  //   return stripeEvent.data.object.id === user.owner.id
  // })
  return user.owner
}

async function createCompanyDirector (user, body, uploads) {
  const req = TestHelper.createRequest(`/api/user/connect/create-company-director?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  req.uploads = uploads
  req.body = createMultiPart(req, body)
  user.director = await req.post()
  const req2 = TestHelper.createRequest(`/api/user/connect/company-director?personid=${user.director.id}`)
  req2.session = user.session
  req2.account = user.account
  req2.stripeKey = stripeKey
  while (true) {
    try {
      user.director = await global.api.user.connect.CompanyDirector.get(req2)
      return user.director
    } catch (error) {
    }
    await wait()
  }
}

async function createPayout (user) {
  const req = TestHelper.createRequest(`/api/fake-payout?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  await req.get()
  const req2 = TestHelper.createRequest(`/api/user/connect/payouts?accountid=${user.account.accountid}&limit=1`)
  req2.session = user.session
  req2.account = user.account
  req2.stripeKey = stripeKey
  while (true) {
    const payouts = await global.api.user.connect.Payouts.get(req2)
    if (!payouts || !payouts.length) {
      await wait()
      continue
    }
    if (user.payout && user.payout.id === payouts[0].id) {
      await wait()
      continue
    }
    user.payout = payouts[0]
    break
  }
  return user.payout
}

async function submitBeneficialOwners (user) {
  const req = TestHelper.createRequest(`/api/user/connect/set-beneficial-owners-submitted?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  user.stripeAccount = await req.patch()
  const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
  req2.session = user.session
  req2.account = user.account
  req2.stripeKey = stripeKey
  while (true) {
    try {
      user.stripeAccount = await global.api.user.connect.StripeAccount.get(req2)
      if (user.stripeAccount.company.owners_provided) {
        return user.stripeAccount
      }
    } catch (error) {
    }
    await wait()
  }
}

async function submitCompanyDirectors (user) {
  const req = TestHelper.createRequest(`/api/user/connect/set-company-directors-submitted?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  user.stripeAccount = await req.patch()
  const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
  req2.session = user.session
  req2.account = user.account
  req2.stripeKey = stripeKey
  while (true) {
    try {
      user.stripeAccount = await global.api.user.connect.StripeAccount.get(req2)
      if (user.stripeAccount.company.directors_provided) {
        return user.stripeAccount
      }
    } catch (error) {
    }
    await wait()
  }
}

async function submitStripeAccount (user) {
  const req = TestHelper.createRequest(`/api/user/connect/set-${user.stripeAccount.business_type}-registration-submitted?stripeid=${user.stripeAccount.id}`)
  req.session = user.session
  req.account = user.account
  user.stripeAccount = await req.patch()
  const req2 = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
  req2.session = user.session
  req2.account = user.account
  req2.stripeKey = stripeKey
  while (true) {
    try {
      user.stripeAccount = await global.api.user.connect.StripeAccount.get(req2)
      if (user.stripeAccount.requirements.pending_verification.length) {
        return wait()
      }
    } catch (error) {
    }
    return user.account
  }
}

async function waitForPayout (administrator, stripeid, previousid, callback) {
  callback = callback || previousid
  if (callback === previousid) {
    previousid = null
  }
  async function wait () {
    if (global.testEnded) {
      return
    }
    const req = module.exports.createRequest(`/api/administrator/connect/stripe-account-payouts?stripeid=${stripeid}&limit=1`)
    req.account = administrator.account
    req.session = administrator.session
    req.stripeKey = stripeKey
    const itemids = await global.api.administrator.connect.StripeAccountPayouts.get(req)
    if (!itemids || !itemids.length) {
      return setTimeout(wait, 100)
    }
    if (previousid && previousid === itemids[0].id) {
      return setTimeout(wait, 100)
    }
    return setTimeout(() => {
      callback(null, itemids[0])
    }, 100)
  }
  return setTimeout(wait, 100)
}

async function waitForPayoutsEnabled (user, callback) {
  const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}&from=waitForPayoutsEnabled`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      if (!stripeAccount.payouts_enabled) {
        return setTimeout(wait, 100)
      }
      return setTimeout(() => {
        return callback(null, stripeAccount)
      }, 10)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForVerification (user, callback) {
  const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}&from=waitForVerification`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      if (stripeAccount.business_type === 'individual') {
        if (!stripeAccount.individual || stripeAccount.individual.verification.status !== 'verified') {
          return setTimeout(wait, 100)
        }
      } else {
        if (!stripeAccount.company || stripeAccount.company.verification.status !== 'verified') {
          return setTimeout(wait, 100)
        }
      }
      if (!stripeAccount.payouts_enabled || stripeAccount.requirements.currently_due.length) {
        return setTimeout(wait, 100)
      }
      return setTimeout(() => {
        return callback(null, stripeAccount)
      }, 10)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForVerificationFailure (user, callback) {
  const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}&from=waitForVerificationFailure`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      if (stripeAccount.business_type === 'individual') {
        if ((stripeAccount.requirements && stripeAccount.requirements.pending_verification.length) ||
            (stripeAccount.individual && stripeAccount.individual.verification.status !== 'unverified')) {
          return setTimeout(wait, 100)
        }
      } else {
        if ((stripeAccount.requirements && stripeAccount.requirements.pending_verification.length) ||
          (stripeAccount.company && stripeAccount.company.verification.status !== 'unverified')) {
          return setTimeout(wait, 100)
        }
      }
      return setTimeout(callback, 10)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForPendingFieldsToLeave (user, callback) {
  const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  let lastVersion = JSON.stringify(user.stripeAccount, null, '  ')
  let lastMessage
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      const newVersion = JSON.stringify(user.stripeAccount, null, '  ')
      if (newVersion !== lastVersion) {
        lastVersion = newVersion
        lastMessage = 1
        // console.log('waiting on pending fields to leave', 'account has changed', newVersion)
      }
      if (stripeAccount.requirements.pending_verification.length) {
        if (lastMessage !== 2) {
          // console.log('waiting on pending fields to leave', stripeAccount.requirements.pending_verification.join(', '))
          lastMessage = 2
        }
        return setTimeout(wait, 100)
      }
      return setTimeout(callback, 10)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForVerificationFieldsToLeave (user, contains, callback) {
  const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  let lastMessage
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      for (const field of stripeAccount.requirements.eventually_due) {
        if (field.indexOf(contains) > -1) {
          if (lastMessage !== 1) {
            // console.log('eventually due still contains field', field, stripeAccount.requirements.eventually_due.join(', '))
            lastMessage = 1
          }
          return setTimeout(wait, 100)
        }
      }
      for (const field of stripeAccount.requirements.past_due) {
        if (field.indexOf(contains) > -1) {
          if (lastMessage !== 2) {
            // console.log('past due still contains field', field, stripeAccount.requirements.past_due.join(', '))
            lastMessage = 2
          }
          return setTimeout(wait, 100)
        }
      }
      for (const field of stripeAccount.requirements.currently_due) {
        if (field.indexOf(contains) > -1) {
          if (lastMessage !== 3) {
            // console.log('currently due still contains field', field, stripeAccount.requirements.currently_due.join(', '))
            lastMessage = 3
          }
          return setTimeout(wait, 100)
        }
      }
      return setTimeout(callback, 10)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForVerificationFieldsToReturn (user, contains, callback) {
  const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      for (const field of stripeAccount.requirements.eventually_due) {
        if (field.indexOf(contains) > -1) {
          return setTimeout(callback, 10)
        }
      }
      for (const field of stripeAccount.requirements.past_due) {
        if (field.indexOf(contains) > -1) {
          return setTimeout(callback, 10)
        }
      }
      for (const field of stripeAccount.requirements.currently_due) {
        if (field.indexOf(contains) > -1) {
          return setTimeout(callback, 10)
        }
      }
      return setTimeout(wait, 10)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForVerificationStart (user, callback) {
  const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      if (stripeAccount.requirements.eventually_due.length ||
        stripeAccount.requirements.past_due.length ||
        stripeAccount.requirements.currently_due.length) {
        return setTimeout(wait, 100)
      }
      return setTimeout(callback, 10)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForAccountRequirement (user, requirement, callback) {
  const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      if (!stripeAccount.requirements) {
        return setTimeout(wait, 100)
      }
      if (stripeAccount.requirements.currently_due.indexOf(requirement) > -1) {
        return setTimeout(callback, 10)
      }
      if (stripeAccount.requirements.eventually_due.indexOf(requirement) > -1) {
        return setTimeout(callback, 10)
      }
      return setTimeout(wait, 100)
    } catch (error) {
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 100)
}

async function waitForPersonRequirement (user, personid, requirement, callback) {
  const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
  req.account = user.account
  req.session = user.session
  req.stripeKey = stripeKey
  const req2 = TestHelper.createRequest(`/api/user/connect/beneficial-owner?personid=${personid}`)
  req2.account = user.account
  req2.session = user.session
  req2.stripeKey = stripeKey
  const req3 = TestHelper.createRequest(`/api/user/connect/company-director?personid=${personid}`)
  req3.account = user.account
  req3.session = user.session
  req3.stripeKey = stripeKey
  const req4 = TestHelper.createRequest(`/api/user/connect/company-representative?personid=${personid}`)
  req4.account = user.account
  req4.session = user.session
  req4.stripeKey = stripeKey
  async function wait () {
    if (global.testEnded) {
      return
    }
    try {
      const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
      if (!stripeAccount.requirements) {
        return setTimeout(wait, 100)
      }
      for (const field of stripeAccount.requirements.currently_due) {
        if (field === `${personid}.${requirement}`) {
          return setTimeout(callback, 10)
        }
      }
      for (const field of stripeAccount.requirements.eventually_due) {
        if (field === `${personid}.${requirement}`) {
          return setTimeout(callback, 10)
        }
      }
    } catch (error) {
      return setTimeout(wait, 10)
    }
    try {
      const person = await global.api.user.connect.BeneficialOwner.get(req2)
      if (person && person.requirements) {
        for (const field of person.requirements.currently_due) {
          if (field === requirement) {
            return setTimeout(callback, 10)
          }
        }
        for (const field of person.requirements.eventually_due) {
          if (field === requirement) {
            return setTimeout(callback, 10)
          }
        }
      }
    } catch (error) {
    }
    try {
      const person = await global.api.user.connect.CompanyDirector.get(req3)
      if (person && person.requirements) {
        for (const field of person.requirements.currently_due) {
          if (field === requirement) {
            return setTimeout(callback, 10)
          }
        }
        for (const field of person.requirements.eventually_due) {
          if (field === requirement) {
            return setTimeout(callback, 10)
          }
        }
      }
    } catch (error) {
    }
    try {
      const person = await global.api.user.connect.CompanyRepresentative.get(req4)
      if (person && person.requirements) {
        for (const field of person.requirements.currently_due) {
          if (field === requirement) {
            return setTimeout(callback, 10)
          }
        }
        for (const field of person.requirements.eventually_due) {
          if (field === requirement) {
            return setTimeout(callback, 10)
          }
        }
      }
    } catch (error) {
    }
    return setTimeout(wait, 100)
  }
  return setTimeout(wait, 100)
}

async function triggerVerification (user) {
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
  let charge
  try {
    charge = await stripe.charges.create(chargeInfo, accountKey)
  } catch (error) {
  }
  user.charge = charge
  return charge
}
