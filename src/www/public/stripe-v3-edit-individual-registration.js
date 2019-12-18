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
    individual: {}
  }
  var firstName = document.getElementById('individual_first_name')
  if (firstName.value && firstName.value.length) {
    accountData.individual.first_name = firstName.value
  } else {
    return window.renderError('invalid-individual_first_name')
  }
  var lastName = document.getElementById('individual_last_name')
  if (lastName.value && lastName.value.length) {
    accountData.individual.last_name = lastName.value
  } else {
    return window.renderError('invalid-individual_last_name')
  }
  var firstNameKanji = document.getElementById('individual_first_name_kanji')
  if (firstNameKanji) {
    if (!firstNameKanji.value || !firstNameKanji.value.length) {
      return window.renderError('invalid-individual_first_name_kanji')
    }
    accountData.individual.first_name_kanji = firstNameKanji.value
    var lastNameKanji = document.getElementById('individual_last_name_kanji')
    if (!lastNameKanji.value || !lastNameKanji.value.length) {
      return window.renderError('invalid-individual_last_name_kanji')
    }
    accountData.individual.last_name_kanji = lastNameKanji.value
    var firstNameKana = document.getElementById('individual_first_name_kana')
    if (!firstNameKana.value || !firstNameKana.value.length) {
      return window.renderError('invalid-individual_first_name_kana')
    }
    accountData.individual.first_name_kana = firstNameKana.value
    var lastNameKana = document.getElementById('individual_last_name_kana')
    if (!lastNameKana.value || !lastNameKana.value.length) {
      return window.renderError('invalid-individual_last_name_kana')
    }
    accountData.individual.last_name_kana = lastNameKana.value
  }
  var email = document.getElementById('individual_email')
  if (email) {
    if (email.value && email.value.length) {
      accountData.individual.email = email.value
    } else {
      return window.renderError('invalid-individual_email')
    }
  }
  var phone = document.getElementById('individual_phone')
  if (phone) {
    if (phone.value && phone.value.length) {
      accountData.individual.phone = phone.value
    } else {
      return window.renderError('invalid-individual_phone')
    }
  }
  var ssnLast4 = document.getElementById('individual_ssn_last_4')
  if (ssnLast4) {
    if (ssnLast4.value && ssnLast4.value.length) {
      accountData.individual.ssn_last_4 = ssnLast4.value
    } else {
      return window.renderError('invalid-individual_phone')
    }
  }
  var gender = document.getElementById('gender-container')
  if (gender) {
    accountData.gender = document.getElementById('female').checked ? 'female' : 'male'
  }
  var idNumber = document.getElementById('individual_id_number')
  if (idNumber) {
    if (idNumber.value && idNumber.value.length) {
      accountData.id_number = idNumber.value
    } else if (idNumber.getAttribute('data-existing') !== 'true') {
      return window.renderError('invalid-individual_id_number')
    }
  }
  var dobDay = document.getElementById('individual_dob_day')
  if (dobDay) {
    accountData.individual.dob = {
      day: dobDay.value,
      month: document.getElementById('individual_dob_month').value,
      year: document.getElementById('individual_dob_year').value
    }
    if (!accountData.individual.dob.day) {
      return window.renderError('invalid-individual_dob_day')
    }
    if (!accountData.individual.dob.month) {
      return window.renderError('invalid-individual_dob_month')
    }
    if (!accountData.individual.dob.year) {
      return window.renderError('invalid-individual_dob_year')
    }
    try {
      Date.parse(accountData.individual.dob.year + '/' + accountData.individual.dob.month + '/' + accountData.individual.dob.day)
    } catch (eror) {
      return window.renderError('invalid-individual_dob_day')
    }
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
  var addressLine1 = document.getElementById('individual_address_line1')
  if (addressLine1 && addressLine1.value) {
    accountData.individual.address = {
      line1: addressLine1.value
    }
    var city = document.getElementById('individual_address_city')
    if (city && city.value) {
      accountData.individual.address.city = city.value
    }
    var state = document.getElementById('individual_address_state')
    if (state && state.selectedIndex > 0) {
      accountData.individual.address.state = state.value
    }
    var addressLine2 = document.getElementById('individual_address_line2')
    if (addressLine2 && addressLine2.value) {
      accountData.individual.address.line2 = addressLine2.value
    }
    var postalCode = document.getElementById('individual_address_postal_code')
    if (postalCode && postalCode.value) {
      accountData.individual.address.postal_code = postalCode.value
    }
  }
  var line1Kana = document.getElementById('individual_address_kana_line1')
  if (line1Kana) {
    if (!line1Kana.value || !line1Kana.value.length) {
      return window.renderError('invalid-individual_address_kana_line1')
    }
    accountData.individual.address_kana = {
      line1: line1Kana.value
    }
    var cityKana = document.getElementById('individual_address_kana_city')
    if (cityKana.value && cityKana.value.length) {
      accountData.individual.address_kana.city = cityKana.value
    } else {
      return window.renderError('invalid-individual_address_kana_city')
    }
    var stateKana = document.getElementById('individual_address_kana_state')
    if (stateKana.value && stateKana.value.length) {
      accountData.individual.address_kana.stateKana = stateKana.value
    } else {
      return window.renderError('invalid-individual_address_kana_state')
    }
    var townKana = document.getElementById('individual_address_kana_town')
    if (townKana.value && townKana.value.length) {
      accountData.individual.address_kana.town = townKana.value
    } else {
      return window.renderError('invalid-individual_address_kana_town')
    }
    var postalCodeKana = document.getElementById('individual_address_kana_postal_code')
    if (postalCodeKana.value && postalCodeKana.value.length) {
      accountData.individual.address_kana.postal_code = postalCodeKana.value
    } else {
      return window.renderError('invalid-individual_address_kana_postal_code')
    }
    var line1Kanji = document.getElementById('individual_address_kanji_line1')
    if (!line1Kanji.value || !line1Kanji.value.length) {
      return window.renderError('invalid-individual_address_kanji_line1')
    }
    accountData.individual.address_kanji = {
      line1: line1Kanji.value
    }
    var cityKanji = document.getElementById('individual_address_kanji_city')
    if (cityKanji.value && cityKanji.value.length) {
      accountData.individual.address_kanji.city = cityKanji.value
    } else {
      return window.renderError('invalid-individual_address_kanji_city')
    }
    var stateKanji = document.getElementById('individual_address_kanji_state')
    if (stateKanji.value && stateKanji.value.length) {
      accountData.individual.address_kanji.stateKanji = stateKanji.value
    } else {
      return window.renderError('invalid-individual_address_kanji_state')
    }
    var townKanji = document.getElementById('individual_address_kanji_town')
    if (townKanji.value && townKanji.value.length) {
      accountData.individual.address_kanji.town = townKanji.value
    } else {
      return window.renderError('invalid-individual_address_kanji_town')
    }
    var postalCodeKanji = document.getElementById('individual_address_kanji_postal_code')
    if (postalCodeKanji.value && postalCodeKanji.value.length) {
      accountData.individual.address_kanji.postal_code = postalCodeKanji.value
    } else {
      return window.renderError('invalid-individual_address_kanji_postal_code')
    }
  }
  var documentFront = document.getElementById('individual_verification_document_front')
  var documentBack = document.getElementById('individual_verification_document_back')
  return window.uploadDocumentFiles(documentFront, documentBack, function (error, front, back) {
    if (error) {
      return window.renderError(error.message)
    }
    if (front && front.id) {
      accountData.individual.verification = {
        document: {
          front: front.id
        }
      }
    } else if (documentFront.getAttribute('data-existing') !== 'true') {
      return window.renderError('invalid-individual_verification_document_front')
    }
    if (back && back.id) {
      accountData.individual.verification = accountData.individual.verification || {}
      accountData.individual.verification.document = accountData.individual.verification.document || {}
      accountData.individual.verification.document.back = back.id
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
