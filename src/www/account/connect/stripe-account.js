const connect = require('../../../../index.js')
const dashboard = require('@userappstore/dashboard')
const navbar = require('./navbar-stripe-account.js')

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
    stripeAccount.statusMessage = 'status-verified'
  } else if (stripeAccount.verification.disabled_reason) {
    stripeAccount.statusMessage = `status-${stripeAccount.verification.disabled_reason}`
  } else if (stripeAccount.verification.details_code) {
    stripeAccount.statusMessage = `status-${stripeAccount.verification.details_code}`
  } else if (stripeAccount.metadata.submitted) {
    stripeAccount.statusMessage = 'status-under-review'
  } else {
    stripeAccount.statusMessage = 'status-not-submitted'
  }
  req.query.country = stripeAccount.country
  const countrySpec = await global.api.user.connect.CountrySpec.get(req)
  let verificationFields
  if (stripeAccount.legal_entity.type === 'individual') {
    verificationFields = countrySpec.verification_fields.individual.minimum.concat(countrySpec.verification_fields.individual.additional)
  } else {
    verificationFields = countrySpec.verification_fields.company.minimum.concat(countrySpec.verification_fields.additional)
  }
  let registrationComplete = true
  const registration = connect.MetaData.parse(stripeAccount.metadata, 'registration') || {}
  if (verificationFields) {
    for (const pathAndField of verificationFields) {
      const field = pathAndField.split('.').pop()
      if (field === 'external_account' ||
          field === 'type' ||
          field === 'ip' ||
          field === 'date') {
        continue
      }
      if (field === 'document') {
        if (!registration.documentid) {
          registrationComplete = false
          break
        }
        continue
      }
      if (!registration[field]) {
        registrationComplete = false
        break
      }
    }
  }
  req.data = { stripeAccount, countrySpec, verificationFields, registration, registrationComplete }
}

async function renderPage (req, res, messageTemplate) {
  const doc = dashboard.HTML.parse(req.route.html, req.data.stripeAccount, 'stripeAccount')
  navbar.setup(doc, req.data.stripeAccount, req.data.countrySpec)
  if (req.data.stripeAccount.statusMessage) {
    dashboard.HTML.renderTemplate(doc, null, req.data.stripeAccount.statusMessage, `registration-status-${req.data.stripeAccount.id}`)
  }
  // registration can be submitted, ready to submit, or not started
  if (req.data.stripeAccount.metadata.submitted) {
    const registrationContainer = doc.getElementById('registration-container')
    registrationContainer.parentNode.removeChild(registrationContainer)
  } else if (req.data.registrationComplete) {
    dashboard.HTML.renderTemplate(doc, null, 'completed-registration', 'registration-status')
    const startIndividualLink = doc.getElementById('start-individual-registration-link')
    startIndividualLink.parentNode.removeChild(startIndividualLink)
    const startCompanyLink = doc.getElementById('start-company-registration-link')
    startCompanyLink.parentNode.removeChild(startCompanyLink)
    if (req.data.stripeAccount.legal_entity.type !== 'individual') {
      const updateIndividualLink = doc.getElementById('update-individual-registration-link')
      updateIndividualLink.parentNode.removeChild(updateIndividualLink)
    } else {
      const updateCompanyLink = doc.getElementById('update-company-registration-link')
      updateCompanyLink.parentNode.removeChild(updateCompanyLink)
    }
  } else {
    dashboard.HTML.renderTemplate(doc, null, 'unstarted-registration', 'registration-status')
    const updateIndividualLink = doc.getElementById('update-individual-registration-link')
    updateIndividualLink.parentNode.removeChild(updateIndividualLink)
    const updateCompanyLink = doc.getElementById('update-company-registration-link')
    updateCompanyLink.parentNode.removeChild(updateCompanyLink)
    if (req.data.stripeAccount.legal_entity.type === 'individual') {
      const startCompanyLink = doc.getElementById('start-company-registration-link')
      startCompanyLink.parentNode.removeChild(startCompanyLink)
    } else {
      const startIndividualLink = doc.getElementById('start-individual-registration-link')
      startIndividualLink.parentNode.removeChild(startIndividualLink)
    }
  }
  // payment details
  const completedPaymentInformation = req.data.stripeAccount.external_accounts.data.length
  if (completedPaymentInformation) {
    const setupPayment = doc.getElementById('setup-payment')
    setupPayment.parentNode.removeChild(setupPayment)
    dashboard.HTML.renderTemplate(doc, req.data.stripeAccount.external_accounts.data[0], 'payment-information', 'payment-information-status')
  } else {
    const updatePayment = doc.getElementById('update-payment')
    updatePayment.parentNode.removeChild(updatePayment)
    dashboard.HTML.renderTemplate(doc, null, 'no-payment-information', 'payment-information-status')
  }
  // additional owners
  if (req.data.verificationFields && req.data.verificationFields.indexOf('legal_entity.additional_owners') > -1) {
    if (req.data.stripeAccount.metadata.submitted) {
      const ownersContainer = doc.getElementById('owners-container')
      ownersContainer.parentNode.removeChild(ownersContainer)
    } else {
      if (req.data.stripeAccount.metadata.submittedOwners) {
        dashboard.HTML.renderTemplate(doc, null, 'owners-submitted', 'owners-status')
      } else {
        dashboard.HTML.renderTemplate(doc, null, 'owners-not-submitted', 'owners-status')
      }
    }
  } else {
    req.data.stripeAccount.metadata.submittedOwners = true
    const ownersContainer = doc.getElementById('owners-container')
    ownersContainer.parentNode.removeChild(ownersContainer)
  }
  // submission status
  let registrationLink
  if (req.data.stripeAccount.legal_entity.type === 'individual') {
    const submitCompanyLink = doc.getElementById('submit-company-registration-link')
    submitCompanyLink.parentNode.removeChild(submitCompanyLink)
    registrationLink = doc.getElementById('submit-individual-registration-link')
  } else {
    const submitIndividualLink = doc.getElementById('submit-individual-registration-link')
    submitIndividualLink.parentNode.removeChild(submitIndividualLink)
    registrationLink = doc.getElementById('submit-company-registration-link')
  }
  if (req.data.stripeAccount.metadata.submitted) {
    dashboard.HTML.renderTemplate(doc, req.data.stripeAccount, 'submitted-information', 'submission-status')
  } else {
    dashboard.HTML.renderTemplate(doc, req.data.stripeAccount, 'not-submitted-information', 'submission-status')
    if (!req.data.registrationComplete || !req.data.stripeAccount.metadata.submittedOwners || !completedPaymentInformation) {
      registrationLink.setAttribute('disabled', 'disabled')
    }
  }
  return dashboard.Response.end(req, res, doc)
}
