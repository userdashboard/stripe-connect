const connect = require('../../../../index.js')
const dashboard = require('@userdashboard/dashboard')
const navbar = require('./navbar-stripe-account.js')
const euCountries = ['AT', 'BE', 'DE', 'ES', 'FI', 'FR', 'GB', 'IE', 'IT', 'LU', 'NL', 'NO', 'PT', 'SE']

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.stripeid) {
    throw new Error('invalid-stripeid')
  }
  const stripeAccount = await global.api.user.connect.StripeAccount.get(req)
  if (stripeAccount.metadata.accountid !== req.account.accountid) {
    throw new Error('invalid-stripe-account')
  }
  if (stripeAccount.payouts_enabled) {
    stripeAccount.statusMessage = 'verified'
  } else if (stripeAccount.verification && stripeAccount.requirements.disabled_reason) {
    stripeAccount.statusMessage = stripeAccount.requirements.disabled_reason
  } else if (stripeAccount.verification && stripeAccount.requirements.details_code) {
    stripeAccount.statusMessage = stripeAccount.requirements.details_code
  } else if (stripeAccount.metadata.submitted) {
    stripeAccount.statusMessage = 'under-review'
  } else {
    stripeAccount.statusMessage = 'not-submitted'
  }
  if (stripeAccount.metadata && stripeAccount.metadata.submitted) {
    stripeAccount.metadata.submittedFormatted = dashboard.Format.date(stripeAccount.metadata.submitted)
  }
  req.query.country = stripeAccount.country
  const countrySpec = await global.api.user.connect.CountrySpec.get(req)
  let verificationFields
  if (stripeAccount.business_type === 'individual') {
    verificationFields = countrySpec.verification_fields.individual.minimum.concat(countrySpec.verification_fields.individual.additional)
  } else {
    verificationFields = countrySpec.verification_fields.company.minimum.concat(countrySpec.verification_fields.company.additional)
  }
  let registrationComplete = true
  const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration') || {}
  if (verificationFields) {
    for (const field of verificationFields) {
      if (field === 'external_account' ||
          field === 'business_type' ||
          field === 'tos_acceptance.ip' ||
          field === 'individual.verification.document' ||
          field === 'tos_acceptance.date') {
        continue
      }
      const posted = field.split('.').join('_')
      if (!registrataion[posted]) {
        registrationComplete = false
        break
      }
    }
  }
  stripeAccount.company = stripeAccount.company || {}
  stripeAccount.individual = stripeAccount.individual || {}
  const owners = connect.MetaData.parse(stripeAccount.metadata, 'owners')
  const directors = connect.MetaData.parse(stripeAccount.metadata, 'directors')
  req.data = { owners, directors, stripeAccount, countrySpec, verificationFields, registration, registrationComplete }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  navbar.setup(doc, req.data.stripeAccount, req.data.countrySpec)
  const removeElements = []
  if (req.data.stripeAccount.statusMessage) {
    dashboard.HTML.renderTemplate(doc, null, req.data.stripeAccount.statusMessage, `account-status-${req.data.stripeAccount.id}`)
  }
  if (req.data.stripeAccount.metadata.submitted) {
    removeElements.push('not-submitted2')
  } else {
    removeElements.push('submitted')
  }
  if (req.data.stripeAccount.business_type === 'individual') {
    removeElements.push(`business-name`)
    if (req.data.stripeAccount.individual.first_name) {
      removeElements.push(`blank-name`)
    } else {
      removeElements.push(`individual-name`)
    }
  } else {
    removeElements.push(`individual-name`)
    if (req.data.stripeAccount.company.name) {
      removeElements.push(`blank-name`)
    } else {
      removeElements.push(`business-name`)
    }
  }
  // registration can be submitted, ready to submit, or not started
  if (req.data.stripeAccount.metadata.submitted) {
    removeElements.push('registration-container')
  } else if (req.data.registrationComplete) {
    dashboard.HTML.renderTemplate(doc, null, 'completed-registration', 'account-status')
    removeElements.push('start-individual-registration-link', 'start-company-registration-link')
    if (req.data.stripeAccount.business_type !== 'individual') {
      removeElements.push('update-individual-registration-link')
    } else {
      removeElements.push('update-company-registration-link')
    }
  } else {
    dashboard.HTML.renderTemplate(doc, null, 'unstarted-registration', 'account-status')
    removeElements.push('update-individual-registration-link', 'update-company-registration-link')
    if (req.data.stripeAccount.business_type === 'individual') {
      removeElements.push('start-company-registration-link')
    } else {
      removeElements.push('start-individual-registration-link')
    }
  }
  // payment details
  const completedPaymentInformation = req.data.stripeAccount.external_accounts.data.length
  if (completedPaymentInformation) {
    removeElements.push('setup-payment')
    dashboard.HTML.renderTemplate(doc, req.data.stripeAccount.external_accounts.data[0], 'payment-information', 'payment-information-status')
  } else {
    removeElements.push('update-payment')
    dashboard.HTML.renderTemplate(doc, null, 'no-payment-information', 'payment-information-status')
  }
  if (req.data.owners && req.data.owners.length) {
    dashboard.HTML.renderTable(doc, req.data.owners, 'owner-row', 'owners-table')
  } else {
    if (req.data.stripeAccount.business_type === 'individual') {
      removeElements.push('owners-container')
    } else {
      removeElements.push('owners-table')
    }    
  }
  if (req.data.directors && req.data.directors.length) {
    dashboard.HTML.renderTable(doc, req.data.directors, 'director-row', 'directors-table')
  } else {
    if (req.data.stripeAccount.business_type === 'individual' || euCountries.indexOf(req.data.stripeAccount.country) === -1) {
      removeElements.push('directors-container')
    } else {
      removeElements.push('directors-table')
    }
  }
  // submission status
  if (req.data.stripeAccount.metadata.submitted) {
    dashboard.HTML.renderTemplate(doc, req.data.stripeAccount, 'submitted-information', 'submission-status')
    removeElements.push('submit-registration-link-container')
  } else {
    dashboard.HTML.renderTemplate(doc, req.data.stripeAccount, 'not-submitted-information', 'submission-status')
    let registrationLink
    if (req.data.stripeAccount.business_type === 'individual') {
      removeElements.push('submit-company-registration-link')
      registrationLink = doc.getElementById('submit-individual-registration-link')
    } else {
      removeElements.push('submit-individual-registration-link')
      registrationLink = doc.getElementById('submit-company-registration-link')
    }
    if (!req.data.registrationComplete || !completedPaymentInformation) {
      registrationLink.setAttribute('disabled', 'disabled')
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
