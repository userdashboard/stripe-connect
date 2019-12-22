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
  if (req.success) {
    if (req.query && req.query['return-url']) {
      return dashboard.Response.redirect(req, res, decodeURI(req.query['return-url']))
    } else {
      return dashboard.Response.redirect(req, res, `/account/connect/stripe-account?stripeid=${req.query.stripeid}`)
    }
  }
  const removeElements = []
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  if (global.stripeJS !== 3) {
    removeElements.push('stripe-v3', 'client-v3', 'connect-v3', 'handler-v3')
  } else {
    res.setHeader('content-security-policy',
      'default-src * \'unsafe-inline\'; ' +
    `style-src https://uploads.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/v3/ https://js.stripe.com/v2/ ${global.dashboardServer}/public/ 'unsafe-inline'; ` +
    `script-src * https://uploads.stripe.com/ https://q.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/v3/ https://js.stripe.com/v2/ ${global.dashboardServer}/public/ 'unsafe-eval' 'unsafe-inline'; ` +
    'frame-src * https://uploads.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/ \'unsafe-inline\'; ' +
    'connect-src https://uploads.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/ \'unsafe-inline\'; ')
  }
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      removeElements.push('submit-form')
      for (const id of removeElements) {
        const element = document.getElementById(id)
        element.parentNode.removeChild(element)
      }
      return dashboard.Response.end(req, res, doc)
    }
  }
  const requiredFields = connect.kycRequirements[req.data.stripeAccount.country].beneficialOwner
  if (requiredFields.indexOf('relationship.owner.id_number') === -1) {
    removeElements.push('relationship_owner_id_number-container')
  }
  if (requiredFields.indexOf('relationship.owner.email') === -1) {
    removeElements.push('relationship_owner_email-container')
  }
  dashboard.HTML.renderList(doc, connect.countryList, 'country-option', 'relationship_owner_address_country')
  if (req.method === 'GET') {
    const states = connect.countryDivisions[req.data.stripeAccount.country]
    dashboard.HTML.renderList(doc, states, 'state-option', 'relationship_owner_address_state')
    dashboard.HTML.setSelectedOptionByValue(doc, 'relationship_owner_address_country', req.data.stripeAccount.country)
  } else if (req.body) {
    const selectedCountry = req.body.relationship_owner_address_country || req.data.stripeAccount.country
    const states = connect.countryDivisions[selectedCountry]
    dashboard.HTML.renderList(doc, states, 'state-option', 'relationship_owner_address_state')
    dashboard.HTML.setSelectedOptionByValue(doc, 'relationship_owner_address_country', selectedCountry)
    for (const fieldName in req.body) {
      const el = doc.getElementById(fieldName)
      if (!el) {
        continue
      }
      switch (el.tag) {
        case 'select':
          dashboard.HTML.setSelectedOptionByValue(doc, fieldName, req.body[fieldName])
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
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body || req.body.refresh === 'true') {
    return renderPage(req, res)
  }
  if (global.stripeJS === 3 && !req.body.token) {
    return renderPage(req, res, 'invalid-token')
  }
  const requiredFields = connect.kycRequirements[req.data.stripeAccount.country].beneficialOwner
  for (const field of requiredFields) {
    const posted = field.split('.').join('_')
    if (!field) {
      if (field === 'relationship.owner.verification.front' ||
          field === 'relationship.owner.verification.back') {
        continue
      }
      return renderPage(req, res, `invalid-${posted}`)
    }
  }
  if (!req.body.relationship_owner_address_country || !connect.countryNameIndex[req.body.relationship_owner_address_country]) {
    delete (req.body.relationship_owner_address_country)
    return renderPage(req, res, 'invalid-relationship_owner_address_country')
  }
  if (!req.body.relationship_owner_address_state) {
    return renderPage(req, res, 'invalid-relationship_owner_address_state')
  }
  const states = connect.countryDivisions[req.body.relationship_owner_address_country]
  let found
  for (const state of states) {
    found = state.value === req.body.relationship_owner_address_state
    if (found) {
      break
    }
  }
  if (!found) {
    return renderPage(req, res, 'invalid-relationship_owner_address_state')
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
