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
  var companyRepresentative = {
    relationship: {}
  }
  companyRepresentative.relationship.account_opener = !!window.isAccountOpener
  var firstName = document.getElementById('first_name')
  if (firstName.value && firstName.value.length) {
    companyRepresentative.first_name = firstName.value
  } else {
    return window.renderError('invalid-first_name')
  }
  var lastName = document.getElementById('last_name')
  if (lastName.value && lastName.value.length) {
    companyRepresentative.last_name = lastName.value
  } else {
    return window.renderError('invalid-last_name')
  }
  var addressLine1 = document.getElementById('address_line1')
  if (addressLine1 && addressLine1.value) {
    companyRepresentative.address = {
      line1: addressLine1.value
    }
    var city = document.getElementById('address_city')
    if (city && city.value) {
      companyRepresentative.address.city = city.value
    }
    var state = document.getElementById('address_state')
    if (state && state.selectedIndex > 0) {
      companyRepresentative.address.state = state.value
    }
    var addressLine2 = document.getElementById('address_line2')
    if (addressLine2 && addressLine2.value) {
      companyRepresentative.address.line2 = addressLine2.value
    }
    var addressPostalCode = document.getElementById('address_postal_code')
    if (addressPostalCode && addressPostalCode.value) {
      companyRepresentative.address.postal_code = addressPostalCode.value
    }
    var addressCountry = document.getElementById('address_country')
    if (addressCountry.selectedIndex > 0) {
      companyRepresentative.address.country = addressCountry.value
    }
  }
  var email = document.getElementById('email')
  if (email && email.value) {
    companyRepresentative.email = email.value
  }
  var title = document.getElementById('relationship_title')
  if (title && title.value) {
    companyRepresentative.relationship.title = title.value
  }
  var phone = document.getElementById('phone')
  if (phone && phone.value) {
    companyRepresentative.phone = phone.value
  }
  var ssnLast4 = document.getElementById('ssn_last_4')
  if (ssnLast4 && ssnLast4.value) {
    companyRepresentative.ssn_last_4 = ssnLast4.value
  }
  var percent = document.getElementById('percent_ownership')
  if (percent && percent.value) {
    companyRepresentative.percent_ownership = percent.value
  }
  var idNumber = document.getElementById('id_number')
  if (idNumber && idNumber.value) {
    companyRepresentative.id_number = idNumber.value
  }
  var director = document.getElementById('relationship_director')
  companyRepresentative.relationship.director = !!director.checked
  var executive = document.getElementById('relationship_executive')
  companyRepresentative.relationship.executive = !!executive.checked
  var owner = document.getElementById('relationship_owner')
  companyRepresentative.relationship.owner = !!owner.checked
  if (owner.checked) {
    var percentOwned = document.getElementById('percent_ownership')
    companyRepresentative.relationship.percent_ownership = percentOwned.value || '0'
  }
  var dobDay = document.getElementById('dob_day')
  if (dobDay) {
    companyRepresentative.dob = {
      day: dobDay.value,
      month: document.getElementById('dob_month').value,
      year: document.getElementById('dob_year').value
    }
    if (!companyRepresentative.dob.day) {
      return window.renderError('invalid-dob_day')
    }
    if (!companyRepresentative.dob.month) {
      return window.renderError('invalid-dob_month')
    }
    if (!companyRepresentative.dob.year) {
      return window.renderError('invalid-dob_year')
    }
    try {
      Date.parse(companyRepresentative.dob.year + '/' + companyRepresentative.dob.month + '/' + companyRepresentative.dob.day)
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
      companyRepresentative.verification = {
        document: {
          front: front.id
        }
      }
    } else if (documentFront.getAttribute('data-existing') !== true) {
      return window.renderError('invalid-verification_document_front')
    }
    if (back && back.id) {
      companyRepresentative.verification = companyRepresentative.verification || {}
      companyRepresentative.verification.document = companyRepresentative.verification.document || {}
      companyRepresentative.verification.document.back = back.id
    } else if (documentBack.getAttribute('data-existing') !== true) {
      return window.renderError('invalid-verification_document_back')
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
