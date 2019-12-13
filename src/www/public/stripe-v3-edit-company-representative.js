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
  var companyRepresentative = {
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
  var idNumberField = document.getElementById('relationship_representative_id_number')
  if (idNumberField) {
    companyRepresentative.id_number = idNumberField.value
  } else if (idNumberField.getAttribute('data-existing') !== 'true') {
    return window.renderError('invalid-relationship_representative_id_number')
  }
  var genderField = document.getElementById('gender-container')
  if (genderField) {
    companyRepresentative.gender = document.getElementById('female').checked ? 'female' : 'male'
  }
  var personalAddressLine2 = document.getElementById('relationship_representative_address_line2')
  if (personalAddressLine2 && personalAddressLine2.value) {
    companyRepresentative.address.line2 = personalAddressLine2.value
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
