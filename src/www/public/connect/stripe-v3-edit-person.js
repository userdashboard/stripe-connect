var stripe
window.onload = function () {
  stripe = window.Stripe(window.stripePublishableKey)
  var submit = document.getElementById('submit-form')
  submit.addEventListener('submit', updatePerson)
}

function updatePerson (e) {
  e.preventDefault()
  e.target.disabled = true
  setTimeout(function () {
    e.target.disabled = false
  }, 1000)
  var personData = {}
  var firstName = document.getElementById('first_name')
  if (firstName) {
    if (!firstName.value) { 
      return window.renderError('invalid-first_name')
    }
    personData.first_name = firstName.value
  }
  var lastName = document.getElementById('last_name')
  if (lastName) {
    if (!lastName.value) {
      return window.renderError('invalid-last_name')
    }
    personData.last_name = lastName.value
  }
  var kanaFirstName = document.getElementById('first_name_kana')
  if (kanaFirstName) {
    if (!kanaFirstName.value) { 
      return window.renderError('invalid-first_name_kana')
    }
    personData.first_name_kana = firstNameKana.value
  }
  var kanaLastName = document.getElementById('last_name_kana')
  if (kanaLastName) {
    if (!kanaLastName.value) {
      return window.renderError('invalid-last_name_kana')
    }
    personData.last_name_kana = kanaLastName.value
  }
  var kanjiFirstName = document.getElementById('first_name_kanji')
  if (kanjiFirstName) {
    if (!kanjiFirstName.value) { 
      return window.renderError('invalid-first_name_kanji')
    }
    personData.first_name_kanji = kanaFirstName.value
  }
  var kanjiLastName = document.getElementById('last_name_kanji')
  if (kanjiLastName) {
    if (!kanjiLastName.value) {
      return window.renderError('invalid-last_name_kanji')
    }
    personData.last_name_kanji = lastNameKanji.value
  }
  var fields = ['address_line1', 'address_city','address_state', 'address_country', 'address_postal_code']
  for (var i = 0, len = fields.length; i < len; i++) {
    var element = document.getElementById(fields[i])
    if (element) {
      if (!element.value) {
        return window.renderError('invalid-' + fields[i])
      }
      var property = fields[i].substring('address_'.length)
      personData.address = personData.address || {}
      personData.address[property] = element.value
    }
  }
  var addressLine2 = document.getElementById('address_line2')
  if (addressLine2 && addressLine2.value) {
    personData.address = personData.address || {}
    personData.address.line2 = addressLine2.value
  }
  if (document.getElementById('kana-address-container')) {
    var fields = ['address_kana_line1', 'address_kana_city','address_kana_town', 'address_kana_state', 'address_kana_postal_code' ]
    for (var i = 0, len = fields.length; i < len; i++) {
      var element = document.getElementById(fields[i])
      if (element) {
        if (!element.value) {
          return window.renderError('invalid-' + fields[i])
        }
        var property = fields[i].substring('address_kana'.length)
        personData.address_kana = personData.address_kana || {}
        personData.address_kana[property] = element.value
      }
    }
  }
  if (document.getElementById('kanji-address-container')) {
    var fields = ['address_kanji_line1', 'address_kanji_city','address_kanji_town', 'address_kanji_state', 'address_kanji_postal_code' ]
    for (var i = 0, len = fields.length; i < len; i++) {
      var element = document.getElementById(fields[i])
      if (element) {
        if (!element.value) {
          return window.renderError('invalid-' + fields[i])
        }
        var property = fields[i].substring('address_kanji'.length)
        personData.address_kanji = personData.address_kanji || {}
        personData.address_kanji[property] = element.value
      }
    }
  }
  var email = document.getElementById('email')
  if (email) {
    if (!email.value) {
      return window.renderError('invalid-email')
    }
    personData.email = email.value
  }
  var title = document.getElementById('relationship_title')
  if (title) {
    if (!title.value) {
      return window.renderError('invalid-relationship_title')
    }
    personData.relationship = personData.relationship || {}
    personData.relationship.title = title.value
  }
  var phone = document.getElementById('phone')
  if (phone) {
    if (!phone.value) {
      return window.renderError('invalid-phone')
    }
    personData.phone = phone.value
  }
  var ssnLast4 = document.getElementById('ssn_last_4')
  if (ssnLast4) {
    if (!ssnLast4.value) {
      return window.renderError('invalid-ssn_last_4')
    }
    personData.ssn_last_4 = ssnLast4.value
  }
  var percent = document.getElementById('relationship_percent_ownership')
  if (percent && percent.value) {
    personData.percent_ownership = percent.value
  }
  var idNumber = document.getElementById('id_number')
  if (idNumber) {
    if (!idNumber.value) {
      return window.renderError('invalid-id_number')
    }
    personData.id_number = idNumber.value
  }
  var director = document.getElementById('relationship_director')
  personData.relationship = personData.relationship || {}
  personData.relationship.director = !!director.checked
  var executive = document.getElementById('relationship_executive')
  personData.relationship.executive = !!executive.checked
  var owner = document.getElementById('relationship_owner')
  personData.relationship.owner = !!owner.checked
  if (owner.checked) {
    var percentOwned = document.getElementById('relationship_percent_ownership')
    personData.relationship.percent_ownership = percentOwned.value || '0'
  }
  var dobDay = document.getElementById('dob_day')
  if (dobDay) {
    personData.dob = {
      day: dobDay.value,
      month: document.getElementById('dob_month').value,
      year: document.getElementById('dob_year').value
    }
    if (!personData.dob.day) {
      return window.renderError('invalid-dob_day')
    }
    if (!personData.dob.month) {
      return window.renderError('invalid-dob_month')
    }
    if (!personData.dob.year) {
      return window.renderError('invalid-dob_year')
    }
    try {
      Date.parse(personData.dob.year + '/' + personData.dob.month + '/' + personData.dob.day)
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
      personData.verification = {
        document: {
          front: front.id
        }
      }
    } else if (documentFront) {
      return window.renderError('invalid-verification_document_front')
    }
    if (back && back.id) {
      personData.verification = personData.verification || {}
      personData.verification.document = personData.verification.document || {}
      personData.verification.document.back = back.id
    } else if (documentBack) {
      return window.renderError('invalid-verification_document_back')
    }
    var additionalDocumentFront = document.getElementById('verification_document_front')
    var additionalDocumentBack = document.getElementById('verification_document_back')
    return window.uploadDocumentFiles(additionalDocumentFront, additionalDocumentBack, function (error, front, back) {
      if (error) {
        return window.renderError(error.message)
      }
      if (front && front.id) {
        personData.verification = personData.verification || {}
        personData.verification.additional_document = {
          front: front.id
        }
      } else if (additionalDocumentFront) {
        return window.renderError('invalid-verification_additional_document_front')
      }
      if (back && back.id) {
        personData.verification = personData.verification || {}
        personData.verification.additional_document = personData.verification.additional_document || {}
        personData.verification.additional_document.back = back.id
      } else if (additionalDocumentBack) {
        return window.renderError('invalid-verification_additional_document_back')
      }
      return stripe.createToken('person', personData).then(function (result) {
        if (!result || result.error) {
          return window.renderError(result.error)
        }
        var token = document.getElementById('token')
        token.value = result.token.id
        var form = document.getElementById('submit-form')
        return form.submit()
      })
    })
  })
}
