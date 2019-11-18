var stripe
window.onload = function () {
  stripe = window.Stripe(window.stripePublishableKey)
  var submit = document.getElementById('submit-form')
  submit.addEventListener('submit', updateAccount)
}

function updateAccount (e) {
  e.preventDefault()
  e.target.disabled = true
  setTimeout(function () {
    e.target.disabled = false
  }, 1000)
  var accountData = {
  }
  var businessProfileURL = document.getElementById('business_profile_url')
  if (businessProfileURL) {
    if (!businessProfileURL.value) {
      return window.renderError('invalid-business_profile_url')
    }
    accountData.business_profile = {
      url: businessProfileURL.value
    }
  }
  var businessProfileMCC = document.getElementById('business_profile_mcc')
  if (businessProfileMCC) {
    if (businessProfileMCC.selectedIndex === -1) {
      return window.renderError('invalid-business_profile_mcc')
    }
    accountData.business_profile = accountData.business_profile || {}
    accountData.business_profile.mcc = businessProfileMCC.value
  }
  var accountOpener = {
    relationship: {
      account_opener: true
    },
    address: {
      line1: document.getElementById('individual_address_line1').value,
      line2: document.getElementById('individual_address_line2').value,
      state: document.getElementById('individual_address_state').value,
      country: document.getElementById('individual_address_country').value,
      postal_code: document.getElementById('individual_address_postal_code').value
    },
    dob: {
      day: document.getElementById('individual_dob_day').value,
      month: document.getElementById('individual_dob_month').value,
      year: document.getElementById('individual_dob_year').value
    }
  }
  var genderField = document.getElementById('gender-container')
  if (genderField) {
    accountOpener.gender = document.getElementById('female').checked ? 'female' : 'male'
  }
  var field
  for (field in accountOpener) {
    if (!accountOpener[field]) {
      return window.renderError('invalid-individual_' + field)
    }
  }
  var idNumberField = document.getElementById('relationship_account_opener_id_number')
  if (idNumberField) {
    accountOpener.id_number = idNumberField.value
  } else if (idNumberField.getAttribute('data-existing') !== 'true') {
    return window.renderError('invalid-relationship_account_opener_id_number')
  }
  for (field in accountOpener.address) {
    if (!accountOpener.address[field]) {
      return window.renderError('invalid-individual_address_' + field)
    }
  }
  for (field in accountOpener.dob) {
    if (!accountOpener.dob[field]) {
      return window.renderError('invalid-individual_dob_' + field)
    }
  }
  var documentFront = document.getElementById('individual_verification_document_front')
  var documentBack = document.getElementById('individual_verification_document_back')
  return window.uploadDocumentFiles(documentFront, documentBack, function (error, front, back) {
    if (error) {
      return window.renderError(error.message)
    }
    if (front && front.id) {
      accountOpener.verification = {
        document: {
          front: front.id
        }
      }
    } else if (documentFront.getAttribute('data-existing') !== 'true') {
      return window.renderError('invalid-individual_verification_document_front')
    }
    if (back && back.id) {
      accountOpener.verification = accountOpener.verification || {}
      accountOpener.verification.document = accountOpener.verification.document || {}
      accountOpener.verification.document.back = back.id
    } else if (documentBack.getAttribute('data-existing') !== 'true') {
      return window.renderError('invalid-individual_verification_document_back')
    }
    return stripe.createToken('account', accountData).then(function (result) {
      if (!result || result.error) {
        return window.renderError(result.error)
      }
      var token = document.getElementById('token')
      token.value = result.token.id
      var form = document.getElementById('submit-form')
      return form.submit()
    })
  })
}
