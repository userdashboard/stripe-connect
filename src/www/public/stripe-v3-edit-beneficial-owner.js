var stripe
window.onload = function () {
  stripe = window.Stripe(window.stripePublishableKey)
  var submit = document.getElementById('submit-button')
  submit.addEventListener('click', convertOwner)
}

function convertOwner (e) {
  e.preventDefault()
  e.target.disabled = true
  setTimeout(function () {
    e.target.disabled = false
  }, 1000)
  var beneficialOwner = {}
  var firstName = document.getElementById('first_name')
  if (firstName.value && firstName.value.length) {
    beneficialOwner.first_name = firstName.value
  } else {
    return window.renderError('invalid-first_name')
  }
  var lastName = document.getElementById('last_name')
  if (lastName.value && lastName.value.length) {
    beneficialOwner.last_name = lastName.value
  } else {
    return window.renderError('invalid-last_name')
  }
  var addressLine1 = document.getElementById('address_line1')
  if (addressLine1 && addressLine1.value) {
    beneficialOwner.address = {
      line1: addressLine1.value
    }
    var city = document.getElementById('address_city')
    if (city && city.value) {
      beneficialOwner.address.city = city.value
    }
    var state = document.getElementById('address_state')
    if (state && state.selectedIndex > 0) {
      beneficialOwner.address.state = state.value
    }
    var addressLine2 = document.getElementById('address_line2')
    if (addressLine2 && addressLine2.value) {
      beneficialOwner.address.line2 = addressLine2.value
    }
    var addressCountry = document.getElementById('address_country')
    if (addressCountry.selectedIndex > 0) {
      beneficialOwner.address.country = addressCountry.value
    }
  }
  var email = document.getElementById('email')
  if (email && email.value) {
    beneficialOwner.email = email.value
  }
  var title = document.getElementById('title')
  if (title && title.value) {
    beneficialOwner.title = title.value
  }
  var percent = document.getElementById('percent_ownership')
  if (percent && percent.value) {
    beneficialOwner.percent_ownership = percent.value
  }
  var idNumber = document.getElementById('id_number')
  if (idNumber && idNumber.value) {
    beneficialOwner.id_number = idNumber.value
  }
  var executive = document.getElementById('executive')
  if (executive.checked) {
    beneficialOwner.executive = true
  }
  var director = document.getElementById('director')
  if (director.checked) {
    beneficialOwner.director = true
  }
  var dobDay = document.getElementById('dob_day')
  if (dobDay) {
    beneficialOwner.dob = {
      day: dobDay.value,
      month: document.getElementById('dob_month').value,
      year: document.getElementById('dob_year').value
    }
    if (!beneficialOwner.dob.day) {
      return window.renderError('invalid-dob_day')
    }
    if (!beneficialOwner.dob.month) {
      return window.renderError('invalid-dob_month')
    }
    if (!beneficialOwner.dob.year) {
      return window.renderError('invalid-dob_year')
    }
    try {
      Date.parse(beneficialOwner.dob.year + '/' + beneficialOwner.dob.month + '/' + beneficialOwner.dob.day)
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
      beneficialOwner.verification = {
        document: {
          front: front.id
        }
      }
    }
    if (back && back.id) {
      beneficialOwner.verification = beneficialOwner.verification || {}
      beneficialOwner.verification.document = beneficialOwner.verification.document || {}
      beneficialOwner.verification.document.back = back.id
    }
    return stripe.createToken('person', beneficialOwner).then(function (result) {
      if (result.error) {
        return window.renderError(result.error)
      }
      var token = document.getElementById('token')
      token.value = result.token.id
      var form = document.getElementById('submit-form')
      return form.submit()
    })
  })
}
