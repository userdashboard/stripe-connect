const connect = require('../../../../index.js')
const dashboard = require('@userdashboard/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.stripeid) {
    throw new Error('invalid-stripeid')
  }
  const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
  if (stripeAccount.metadata.submitted ||
    stripeAccount.business_type === 'individual' ||
    stripeAccount.metadata.accountid !== req.account.accountid) {
    throw new Error('invalid-stripe-account')
  }
  stripeAccount.stripePublishableKey = global.stripePublishableKey
  const owners = connect.MetaData.parse(stripeAccount.metadata, 'owners')
  req.data = { stripeAccount, owners }
}

async function renderPage (req, res, messageTemplate) {
  console.log('render', messageTemplate)
  if (req.success) {
    if (req.query && req.query.returnURL && req.query.returnURL.indexOf('/') === 0) {
      return dashboard.Response.redirect(req, res, decodeURI(req.query.returnURL))
    } else {
      return dashboard.Response.redirect(req, res, `/account/connect/stripe-account?stripeid=${req.query.stripeid}`)
    }
  }
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  if (global.stripeJS !== 3) {
    const stripeJS = doc.getElementById('stripe-v3')
    stripeJS.parentNode.removeChild(stripeJS)
    const clientJS = doc.getElementById('client-v3')
    clientJS.parentNode.removeChild(clientJS)
    const connectJS = doc.getElementById('connect-v3')
    connectJS.parentNode.removeChild(connectJS)
  } else {
    res.setHeader('content-security-policy',
      'default-src * \'unsafe-inline\'; ' +
    `style-src https://uploads.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/v3/ https://js.stripe.com/v2/ ${global.dashboardServer}/public/ 'unsafe-inline'; ` +
    `script-src * https://uploads.stripe.com/ https://q.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/v3/ https://js.stripe.com/v2/ ${global.dashboardServer}/public/stripe-helper.js 'unsafe-inline' 'unsafe-eval'; ` +
    'frame-src * https://uploads.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/ \'unsafe-inline\'; ' +
    'connect-src https://uploads.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/ \'unsafe-inline\'; ')
  }
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  dashboard.HTML.renderList(doc, connect.countryList, 'country-option', 'relationship_owner_address_country')
  if (req.method === 'GET') {
    const selectedCountry = req.data.stripeAccount.country
    const states = connect.countryDivisions[selectedCountry]
    dashboard.HTML.renderList(doc, states, 'state-option', 'relationship_owner_address_state')
    dashboard.HTML.setSelectedOptionByValue(doc, 'relationship_owner_address_country', selectedCountry)
    return dashboard.Response.end(req, res, doc)
  } else if (req.body) {
    const selectedCountry = req.body.relationship_owner_address_country || req.data.stripeAccount.country
    const states = connect.countryDivisions[selectedCountry]
    dashboard.HTML.renderList(doc, states, 'state-option', 'relationship_owner_address_state')
    if (req.body.relationship_owner_address_state) {
      dashboard.HTML.setSelectedOptionByValue(doc, 'relationship_owner_address_state', req.body.relationship_owner_address_state)
    }
    dashboard.HTML.setSelectedOptionByValue(doc, 'relationship_owner_address_country', selectedCountry)
    for (const fieldName in req.body) {
      const el = doc.getElementById(fieldName)
      if (!el) {
        continue
      }
      switch (el.tag) {
        case 'select':
          dashboard.HTML.setSelectedOptionByValue(doc, el.attr.id, req.body[fieldName])
          continue
        case 'input':
          if (el.attr.type === 'radio') {
            el.attr.checked = 'checked'
          } else {
            el.attr.value = req.body[fieldName]
          }
          continue
      }
    }
    if (req.body.relationship_owner_address_country) {
      dashboard.HTML.setSelectedOptionByValue(doc, 'relationship_owner_address_country', req.body.relationship_owner_address_country)
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  console.log('submit', req.body)
  if (!req.body || req.body.refresh === 'true') {
    return renderPage(req, res)
  }
  if (!req.body.relationship_owner_address_city) {
    return renderPage(req, res, 'invalid-relationship_owner_address_city')
  }
  if (!req.body.relationship_owner_address_country) {
    return renderPage(req, res, 'invalid-relationship_owner_address_country')
  }
  if (!req.body.relationship_owner_address_line1) {
    return renderPage(req, res, 'invalid-relationship_owner_address_line1')
  }
  if (!req.body.relationship_owner_address_postal_code) {
    return renderPage(req, res, 'invalid-relationship_owner_address_postal_code')
  }
  if (!req.body.relationship_owner_dob_day) {
    return renderPage(req, res, 'invalid-relationship_owner_dob_day')
  }
  if (!req.body.relationship_owner_dob_month) {
    return renderPage(req, res, 'invalid-relationship_owner_dob_month')
  }
  if (!req.body.relationship_owner_dob_year) {
    return renderPage(req, res, 'invalid-relationship_owner_dob_year')
  }
  if (!req.body.relationship_owner_first_name) {
    return renderPage(req, res, 'invalid-relationship_owner_first_name')
  }
  if (!req.body.relationship_owner_last_name) {
    return renderPage(req, res, 'invalid-relationship_owner_last_name')
  }
  if (req.data && req.data.owners && req.data.owners.length) {
    for (const owner of req.data.owners) {
      if (owner.relationship_owner_first_name === req.body.relationship_owner_first_name &&
          owner.relationship_owner_last_name === req.body.relationship_owner_last_name) {
        return renderPage(req, res, 'duplicate-name')
      }
    }
  }
  try {
    const owner = await global.api.user.connect.CreateBeneficialOwner.post(req)
    if (req.success) {
      req.data = { owner }
      return renderPage(req, res, 'success')
    }
    return renderPage(req, res, 'unknown-error')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
