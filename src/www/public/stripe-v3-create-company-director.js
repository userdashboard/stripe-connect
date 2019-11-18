var stripe
window.onload = function () {
  stripe = window.Stripe(window.stripePublishableKey)
  var submit = document.getElementById('submit-button')
  submit.addEventListener('click', convertDirector)
}

function convertDirector (e) {
  e.preventDefault()
  e.target.disabled = true
  setTimeout(function () {
    e.target.disabled = false
  }, 1000)
  var companyDirector = {
    first_name: document.getElementById('relationship_director_first_name').value,
    last_name: document.getElementById('relationship_director_last_name').value
  }
  for (var field in companyDirector) {
    if (!companyDirector[field]) {
      return window.renderError('invalid-relationship_director_' + field)
    }
  }
  var documentFront = document.getElementById('relationship_director_verification_document_front')
  var documentBack = document.getElementById('relationship_director_verification_document_back')
  return window.uploadDocumentFiles(documentFront, documentBack, function (error, front, back) {
    if (error) {
      return window.renderError(error.message)
    }
    if (front && front.id) {
      companyDirector.verification = {
        document: {
          front: front.id
        }
      }
    } else {
      return window.renderError('invalid-relationship_director_verification_document_front')
    }
    if (back && back.id) {
      companyDirector.verification = companyDirector.verification || {}
      companyDirector.verification.document = companyDirector.verification.document || {}
      companyDirector.verification.document.back = back.id
    } else {
      return window.renderError('invalid-relationship_director_verification_document_back')
    }
    return stripe.createToken('person', companyDirector).then(function (result) {
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
