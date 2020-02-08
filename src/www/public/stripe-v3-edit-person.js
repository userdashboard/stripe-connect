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
  var person = {
    relationship: {}
  }
  var firstName = document.getElementById('first_name')
  if (firstName.value && firstName.value.length) {
    person.first_name = firstName.value
  } else {
    return window.renderError('invalid-first_name')
  }
  var lastName = document.getElementById('last_name')
  if (lastName.value && lastName.value.length) {
    person.last_name = lastName.value
  } else {
    return window.renderError('invalid-last_name')
  }
  var addressLine1 = document.getElementById('address_line1')
  if (addressLine1 && addressLine1.value) {
    person.address = {
      line1: addressLine1.value
    }
    var city = document.getElementById('address_city')
    if (city && city.value) {
      person.address.city = city.value
    }
    var state = document.getElementById('address_state')
    if (state && state.selectedIndex > 0) {
      person.address.state = state.value
    }
    var addressLine2 = document.getElementById('address_line2')
    if (addressLine2 && addressLine2.value) {
      person.address.line2 = addressLine2.value
    }
    var addressPostalCode = document.getElementById('address_postal_code')
    if (addressPostalCode && addressPostalCode.value) {
      person.address.postal_code = addressPostalCode.value
    }
    var addressCountry = document.getElementById('address_country')
    if (addressCountry.selectedIndex > 0) {
      person.address.country = addressCountry.value
    }
  }
  var addressKanaLine1 = document.getElementById('address_kana_line1')
  if (addressKanaLine1 && addressKanaLine1.value) {
    person.address_kana = {
      line1: addressKanaLine1.value
    }
    var city = document.getElementById('address_kana_city')
    if (city && city.value) {
      person.address_kana.city = city.value
    }
    var state = document.getElementById('address_kana_state')
    if (state && state.selectedIndex > 0) {
      person.address_kana.state = state.value
    }
    var addressLine2 = document.getElementById('address_kana_line2')
    if (addressLine2 && addressLine2.value) {
      person.address_kana.line2 = addressLine2.value
    }
    var addressPostalCode = document.getElementById('address_kana_postal_code')
    if (addressPostalCode && addressPostalCode.value) {
      person.address_kana.postal_code = addressPostalCode.value
    }
    var addressCountry = document.getElementById('address_kana_country')
    if (addressCountry.selectedIndex > 0) {
      person.address_kana.country = addressCountry.value
    }
  }
  var addressKanjiLine1 = document.getElementById('address_kanji_line1')
  if (addressKanjiLine1 && addressKanjiLine1.value) {
    person.address_kanji = {
      line1: addressKanjiLine1.value
    }
    var city = document.getElementById('address_kanji_city')
    if (city && city.value) {
      person.address_kanji.city = city.value
    }
    var state = document.getElementById('address_kanji_state')
    if (state && state.selectedIndex > 0) {
      person.address_kanji.state = state.value
    }
    var addressLine2 = document.getElementById('address_kanji_line2')
    if (addressLine2 && addressLine2.value) {
      person.address_kanji.line2 = addressLine2.value
    }
    var addressPostalCode = document.getElementById('address_kanji_postal_code')
    if (addressPostalCode && addressPostalCode.value) {
      person.address_kanji.postal_code = addressPostalCode.value
    }
    var addressCountry = document.getElementById('address_kanji_country')
    if (addressCountry.selectedIndex > 0) {
      person.address_kanji.country = addressCountry.value
    }
  }
  var email = document.getElementById('email')
  if (email && email.value) {
    person.email = email.value
  }
  var title = document.getElementById('relationship_title')
  if (title && title.value) {
    person.relationship.title = title.value
  }
  var phone = document.getElementById('phone')
  if (phone && phone.value) {
    person.phone = phone.value
  }
  var ssnLast4 = document.getElementById('ssn_last_4')
  if (ssnLast4 && ssnLast4.value) {
    person.ssn_last_4 = ssnLast4.value
  }
  var percent = document.getElementById('relationship_percent_ownership')
  if (percent && percent.value) {
    person.percent_ownership = percent.value
  }
  var idNumber = document.getElementById('id_number')
  if (idNumber && idNumber.value) {
    person.id_number = idNumber.value
  }
  var director = document.getElementById('relationship_director')
  person.relationship.director = !!director.checked
  var executive = document.getElementById('relationship_executive')
  person.relationship.executive = !!executive.checked
  var owner = document.getElementById('relationship_owner')
  person.relationship.owner = !!owner.checked
  if (owner.checked) {
    var percentOwned = document.getElementById('relationship_percent_ownership')
    person.relationship.percent_ownership = percentOwned.value || '0'
  }
  var dobDay = document.getElementById('dob_day')
  if (dobDay) {
    person.dob = {
      day: dobDay.value,
      month: document.getElementById('dob_month').value,
      year: document.getElementById('dob_year').value
    }
    if (!person.dob.day) {
      return window.renderError('invalid-dob_day')
    }
    if (!person.dob.month) {
      return window.renderError('invalid-dob_month')
    }
    if (!person.dob.year) {
      return window.renderError('invalid-dob_year')
    }
    try {
      Date.parse(person.dob.year + '/' + person.dob.month + '/' + person.dob.day)
    } catch (error) {
      return window.renderError('invalid-dob_day')
    }
  }
  var documentFront = document.getElementById('verification_document_front')
  var documentBack = document.getElementById('verification_document_back')
  return window.uploadDocumentFiles(documentFront, documentBack, function (error, front, back) {
    if (error) {
      return window.renderError(error.message)
    }
    if (front && front.id) {
      person.verification = {
        document: {
          front: front.id
        }
      }
    } else if (documentFront.getAttribute('data-existing') !== true) {
      return window.renderError('invalid-verification_document_front')
    }
    if (back && back.id) {
      person.verification = person.verification || {}
      person.verification.document = person.verification.document || {}
      person.verification.document.back = back.id
    } else if (documentBack.getAttribute('data-existing') !== true) {
      return window.renderError('invalid-verification_document_back')
    }
    return stripe.createToken('person', person).then(function (result) {
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
