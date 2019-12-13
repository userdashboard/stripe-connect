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
  var director = {}
  var firstName = document.getElementById('relationship_director_first_name')
  if (firstName.value && firstName.value.length) {
    director.first_name = firstName.value
  } else {
    return window.renderError('invalid-relationship_director_first_name')
  }
  var lastName = document.getElementById('relationship_director_last_name')
  if (lastName.value && lastName.value.length) {
    director.last_name = lastName.value
  } else {
    return window.renderError('invalid-relationship_director_last_name')
  }
  var email = document.getElementById('relationship_director_email')
  if (email && email.value) {
    director.email = email.value
  }
  var relationshipTitle = document.getElementById('relationship_director_relationship_title')
  if (relationshipTitle && relationshipTitle.value) {
    director.relationship_title = relationshipTitle.value
  }
  var dobDay = document.getElementById('relationship_director_dob_day')
  if (dobDay) {
    director.dob = {
      day: dobDay.value,
      month: document.getElementById('relationship_director_dob_month').value,
      year: document.getElementById('relationship_director_dob_year').value
    }
    if (!director.dob.day) {
      return window.renderError('invalid-relationship_director_dob_day')
    }
    if (!director.dob.month) {
      return window.renderError('invalid-relationship_director_dob_month')
    }
    if (!director.dob.year) {
      return window.renderError('invalid-relationship_director_dob_year')
    }
    try {
      Date.parse(director.dob.year + '/' + director.dob.month + '/' + director.dob.day)
    } catch (eror) {
      return window.renderError('invalid-relationship_director_dob_day')
    }
  }
  var documentFront = document.getElementById('relationship_director_verification_document_front')
  var documentBack = document.getElementById('relationship_director_verification_document_back')
  return window.uploadDocumentFiles(documentFront, documentBack, function (error, front, back) {
    if (error) {
      return window.renderError(error.message)
    }
    if (front && front.id) {
      director.verification = {
        document: {
          front: front.id
        }
      }
    }
    if (back && back.id) {
      director.verification = director.verification || {}
      director.verification.document = director.verification.document || {}
      director.verification.document.back = back.id
    }
    return stripe.createToken('person', director).then(function (result) {
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
