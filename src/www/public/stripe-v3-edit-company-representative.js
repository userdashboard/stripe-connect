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
  var companyRepresentative = {}
  var firstName = document.getElementById('relationship_representative_first_name')
  if (firstName.value && firstName.value.length) {
    companyRepresentative.first_name = firstName.value
  } else {
    return window.renderError('invalid-relationship_representative_first_name')
  }
  var lastName = document.getElementById('relationship_representative_last_name')
  if (lastName.value && lastName.value.length) {
    companyRepresentative.last_name = lastName.value
  } else {
    return window.renderError('invalid-relationship_representative_last_name')
  }
  var addressLine1 = document.getElementById('relationship_representative_address_line1')
  if (addressLine1 && addressLine1.value) {
    companyRepresentative.address = {
      line1: addressLine1.value
    }
    var city = document.getElementById('relationship_representative_address_city')
    if (city && city.value) {
      companyRepresentative.address.city = city.value
    }
    var state = document.getElementById('relationship_representative_address_state')
    if (state && state.selectedIndex > 0) {
      companyRepresentative.address.state = state.value
    }
    var addressLine2 = document.getElementById('relationship_representative_address_line2')
    if (addressLine2 && addressLine2.value) {
      companyRepresentative.address.line2 = addressLine2.value
    }
    var addressCountry = document.getElementById('relationship_representative_address_country')
    if (addressCountry.selectedIndex > 0) {
      companyRepresentative.address.country = addressCountry.value
    }
  }
  var email = document.getElementById('relationship_representative_email')
  if (email && email.value) {
    companyRepresentative.email = email.value
  }
  var title = document.getElementById('relationship_representative_title')
  if (title && title.value) {
    companyRepresentative.title = title.value
  }
  var percent = document.getElementById('relationship_representative_percent_ownership')
  if (percent && percent.value) {
    companyRepresentative.percent_ownership = percent.value
  }
  var idNumber = document.getElementById('relationship_representative_id_number')
  if (idNumber && idNumber.value) {
    companyRepresentative.id_number = idNumber.value
  }
  var director = document.getElementById('relationship_representative_director')
  if (director.checked) {
    companyRepresentative.director = true
  }
  var dobDay = document.getElementById('relationship_representative_dob_day')
  if (dobDay) {
    companyRepresentative.dob = {
      day: dobDay.value,
      month: document.getElementById('relationship_representative_dob_month').value,
      year: document.getElementById('relationship_representative_dob_year').value
    }
    if (!companyRepresentative.dob.day) {
      return window.renderError('invalid-relationship_representative_dob_day')
    }
    if (!companyRepresentative.dob.month) {
      return window.renderError('invalid-relationship_representative_dob_month')
    }
    if (!companyRepresentative.dob.year) {
      return window.renderError('invalid-relationship_representative_dob_year')
    }
    try {
      Date.parse(companyRepresentative.dob.year + '/' + companyRepresentative.dob.month + '/' + companyRepresentative.dob.day)
    } catch (error) {
      return window.renderError('invalid-relationship_representative_dob_day')
    }
  }
  var documentFront = document.getElementById('relationship_representative_verification_document_front')
  var documentBack = document.getElementById('relationship_representative_verification_document_back')
  return window.uploadDocumentFiles(documentFront, documentBack, function (error, front, back) {
    if (error) {
      return window.renderError(error.message)
    }
    if (front && front.id) {
      companyRepresentative.verification = {
        document: {
          front: front.id
        }
      }
    } else if (documentFront.getAttribute('data-existing') !== 'true') {
      return window.renderError('invalid-relationship_representative_verification_document_front')
    }
    if (back && back.id) {
      companyRepresentative.verification = companyRepresentative.verification || {}
      companyRepresentative.verification.document = companyRepresentative.verification.document || {}
      companyRepresentative.verification.document.back = back.id
    } else if (documentBack.getAttribute('data-existing') !== 'true') {
      return window.renderError('invalid-relationship_representative_verification_document_back')
    }
    return stripe.createToken('person', companyRepresentative).then(function (result) {
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
