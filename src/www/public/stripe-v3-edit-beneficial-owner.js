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
  var beneficialOwner = {
    first_name: document.getElementById('relationship_owner_first_name').value,
    last_name: document.getElementById('relationship_owner_last_name').value,
    title: document.getElementById('relationship_owner_title').value,
    percent: document.getElementById('relationship_owner_percent').value,
    address: {
      line1: document.getElementById('relationship_owner_address_line1').value,
      line2: document.getElementById('relationship_owner_address_line2').value,
      city: document.getElementById('relationship_owner_address_city').value,
      state: document.getElementById('relationship_owner_address_state').value,
      country: document.getElementById('relationship_owner_address_country').value,
      postal_code: document.getElementById('relationship_owner_address_postal_code').value
    }
  }
  var executive = document.getElementById('relationship_owner_executive')
  if (executive.checked) {
    beneficialOwner.executive = true
  }
  var director = document.getElementById('relationship_owner_director')
  if (director.checked) {
    beneficialOwner.director = true
  }
  var field
  for (field in beneficialOwner) {
    if (!beneficialOwner[field]) {
      return window.renderError('invalid-relationship_owner_' + field)
    }
  }
  var idNumber = document.getElementById('relationship_owner_personal_id_number')
  if (idNumber.value) {
    beneficialOwner.id_nmber = idNumber.value
  }
  for (field in beneficialOwner.address) {
    if (!beneficialOwner.address[field]) {
      return window.renderError('invalid-relationship_owner_address_' + field)
    }
  }
  for (field in beneficialOwner.dob) {
    if (!beneficialOwner.dob[field]) {
      return window.renderError('invalid-relationship_owner_dob_' + field)
    }
  }
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
