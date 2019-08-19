const allCountries = require('../../../../countries.json')
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
  let country
  const countries = []
  for (const countryItem of allCountries) {
    if (countryItem.code === stripeAccount.country) {
      country = countryItem
    }
    countries.push({ value: countryItem.code, text: countryItem.name, object: 'option' })
  }
  const states = []
  for (const code in country.divisions) {
    const name = country.divisions[code]
    states.push({ value: code, text: name, object: 'option' })
  }
  const owners = connect.MetaData.parse(stripeAccount.metadata, 'owners')
  req.data = { stripeAccount, owners, countries, country, states }
}

async function renderPage (req, res, messageTemplate) {
  if (req.success) {
    if (req.query && req.query.returnURL && req.query.returnURL.indexOf('/') === 0) {
      return dashboard.Response.redirect(req, res, decodeURI(req.query.returnURL))
    }
  }
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  if (!messageTemplate && req.method === 'GET' && req.query && req.query.returnURL) {
    const submitForm = doc.getElementById('submit-form')
    const divider = submitForm.attr.action.indexOf('?') > -1 ? '&' : '?'
    submitForm.attr.action += `${divider}returnURL=${encodeURI(req.query.returnURL).split('?').join('%3F')}`
  }
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  if (req.data.states && req.data.states.length) {
    dashboard.HTML.renderList(doc, req.data.states, 'state-option', 'state')
  } else {
    const stateContainer = doc.getElementById('state-container')
    stateContainer.parentNode.removeChild(stateContainer)
    const stateContainerBridge = doc.getElementById('state-container-bridge')
    stateContainerBridge.parentNode.removeChild(stateContainerBridge)
  }
  dashboard.HTML.renderList(doc, req.data.countries, 'country-option', 'relationship_owner_address_country')
  if (!req.body) {
    return dashboard.Response.end(req, res, doc)
  }
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
  if (req.data.country && !req.body.relationship_owner_address_country) {
    dashboard.HTML.setSelectedOptionByValue(doc, 'relationship_owner_address_country', req.data.country.code)
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
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
