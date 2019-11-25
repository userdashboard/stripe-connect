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
    company: {
      address: { }
    }
  }
  var companyName = document.getElementById('company_name')
  if (!companyName.value) {
    return window.renderError('invalid-company_name')
  }
  accountData.company.name = companyName.value
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
  var addressFields = ['company_address_line1', 'company_address_state', 'company_address_country', 'company_address_postal_code']
  var field
  for (var i = 0, len = addressFields.length; i < len; i++) {
    field = document.getElementById(addressFields[i])
    if (!field) {
      continue
    }
    if (!field.value) {
      return window.renderError('invalid-' + addressFields[i])
    }
    accountData.company.address[addressFields[i].substring('company_address_'.length)] = field.value
  }
  var companyAddressLine2 = document.getElementById('company_address_line2')
  if (companyAddressLine2 && companyAddressLine2.value) {
    accountData.company.address.line2 = companyAddressLine2.value
  }
  if (document.getElementById('kana-company-address-container')) {
    accountData.address_kana = {
      line1: document.getElementById('company_address_kana_line1').value,
      state: document.getElementById('company_address_kana_state').value,
      country: document.getElementById('company_address_kana_country').value,
      postal_code: document.getElementById('company_address_kana_postal_code').value
    }
    for (field in accountData.address_kana) {
      if (!accountData.address_kana[field]) {
        return window.renderError('invalid-company_address_kana_' + field)
      }
    }
    accountData.address_kanji = {
      line1: document.getElementById('company_address_kanji_line1').value,
      state: document.getElementById('company_address_kanji_state').value,
      country: document.getElementById('company_address_kanji_country').value,
      postal_code: document.getElementById('company_address_kanji_postal_code').value
    }
    for (field in accountData.address_kanji) {
      if (!accountData.address_kanji[field]) {
        return window.renderError('invalid-company_address_kanji_' + field)
      }
    }
  }
  var accountOpener = {
    relationship: {
      representative: true
    },
    address: {
      line1: document.getElementById('relationship_representative_address_line1').value,
      state: document.getElementById('relationship_representative_address_state').value,
      country: document.getElementById('relationship_representative_address_country').value,
      postal_code: document.getElementById('relationship_representative_address_postal_code').value
    },
    dob: {
      day: document.getElementById('relationship_representative_dob_day').value,
      month: document.getElementById('relationship_representative_dob_month').value,
      year: document.getElementById('relationship_representative_dob_year').value
    }
  }
  for (field in accountOpener) {
    if (!accountOpener[field]) {
      return window.renderError('invalid-relationship_representative_' + field)
    }
  }
  var idNumberField = document.getElementById('relationship_representative_id_number')
  if (idNumberField) {
    accountOpener.id_number = idNumberField.value
  } else if (idNumberField.getAttribute('data-existing') !== 'true') {
    return window.renderError('invalid-relationship_representative_id_number')
  }
  var genderField = document.getElementById('gender-container')
  if (genderField) {
    accountOpener.gender = document.getElementById('female').checked ? 'female' : 'male'
  }
  for (field in accountOpener.address) {
    if (!accountOpener.address[field]) {
      return window.renderError('invalid-relationship_representative_address_' + field)
    }
  }
  var personalAddressLine2 = document.getElementById('relationship_representative_address_line2')
  if (personalAddressLine2 && personalAddressLine2.value) {
    accountOpener.address.line2 = personalAddressLine2.value
  }
  for (field in accountOpener.dob) {
    if (!accountOpener.dob[field]) {
      return window.renderError('invalid-relationship_representative_dob_' + field)
    }
  }
  var documentFront = document.getElementById('relationship_representative_verification_document_front')
  var documentBack = document.getElementById('relationship_representative_verification_document_back')
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
      return window.renderError('invalid-relationship_representative_verification_document_front')
    }
    if (back && back.id) {
      accountOpener.verification = accountOpener.verification || {}
      accountOpener.verification.document = accountOpener.verification.document || {}
      accountOpener.verification.document.back = back.id
    } else if (documentBack.getAttribute('data-existing') !== 'true') {
      return window.renderError('invalid-relationship_representative_verification_document_back')
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
