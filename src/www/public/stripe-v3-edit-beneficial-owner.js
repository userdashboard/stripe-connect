console.log(0)
var stripe
window.onload = function () {
  stripe = window.Stripe(window.stripePublishableKey)
  var submit = document.getElementById('submit-button')
  submit.addEventListener('click', function (e) {
    console.log('submitting form')
    try {
      convertOwner(e)
    } catch (error) {
      console.log('got an error', error)
    }
  })
}

function convertOwner (e) {
  e.preventDefault()
  e.target.disabled = true
  setTimeout(function () {
    e.target.disabled = false
  }, 1000)
  console.log(1)
  var beneficialOwner = {}
  var firstName = document.getElementById('relationship_owner_first_name')
  if (firstName.value && firstName.value.length) {
    beneficialOwner.first_name = firstName.value
  } else {
    return window.renderError('invalid-relationship_owner_first_name')
  }
  var lastName = document.getElementById('relationship_owner_last_name')
  if (lastName.value && lastName.value.length) {
    beneficialOwner.last_name = lastName.value
  } else {
    return window.renderError('invalid-relationship_owner_last_name')
  }
  console.log(2)
  var addressLine1 = document.getElementById('relationship_owner_address_line1')
  if (addressLine1 && addressLine1.value) {
    beneficialOwner.address = {
      line1: addressLine1.value
    }
    var city = document.getElementById('relationship_owner_address_city')
    if (city && city.value) {
      beneficialOwner.address.city = city.value
    }
    var state = document.getElementById('relationship_owner_address_state')
    if (state && state.selectedIndex > 0) {
      beneficialOwner.address.state = state.value
    }
    var addressLine2 = document.getElementById('relationship_owner_address_line2')
    if (addressLine2 && addressLine2.value) {
      beneficialOwner.address.line2 = addressLine2.value
    }
    var addressCountry = document.getElementById('relationship_owner_address_country')
    if (addressCountry.selectedIndex > 0) {
      beneficialOwner.address.country = addressCountry.value
    }
  }
  console.log(3)
  var email = document.getElementById('relationship_owner_email')
  if (email && email.value) {
    beneficialOwner.email = email.value
  }
  var title = document.getElementById('relationship_owner_title')
  if (title && title.value) {
    beneficialOwner.title = title.value
  }
  var percent = document.getElementById('relationship_owner_percent_ownership')
  if (percent && percent.value) {
    beneficialOwner.percent_ownership = percent.value
  }
  var idNumber = document.getElementById('relationship_owner_id_number')
  if (idNumber && idNumber.value) {
    beneficialOwner.id_number = idNumber.value
  }
  console.log(4)
  var executive = document.getElementById('relationship_owner_executive')
  if (executive.checked) {
    beneficialOwner.executive = true
  }
  var director = document.getElementById('relationship_owner_director')
  if (director.checked) {
    beneficialOwner.director = true
  }
  var dobDay = document.getElementById('relationship_owner_dob_day')
  if (dobDay) {
    beneficialOwner.dob = {
      day: dobDay.value,
      month: document.getElementById('relationship_owner_dob_month').value,
      year: document.getElementById('relationship_owner_dob_year').value
    }
    if (!beneficialOwner.dob.day) {
      return window.renderError('invalid-relationship_owner_dob_day')
    }
    if (!beneficialOwner.dob.month) {
      return window.renderError('invalid-relationship_owner_dob_month')
    }
    if (!beneficialOwner.dob.year) {
      return window.renderError('invalid-relationship_owner_dob_year')
    }
    try {
      Date.parse(beneficialOwner.dob.year + '/' + beneficialOwner.dob.month + '/' + beneficialOwner.dob.day)
    } catch (error) {
      return window.renderError('invalid-relationship_owner_dob_day')
    }
  }
  console.log(5)
  var documentFront = document.getElementById('relationship_owner_verification_document_front')
  var documentBack = document.getElementById('relationship_owner_verification_document_back')
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
    console.log('okay')
    return stripe.createToken('person', beneficialOwner).then(function (result) {
      console.log('result', result)
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
