let stripe
window.onload = function () {
  const stripePublishableKey = document.getElementById('stripe-publishable-key')
  stripe = window.Stripe(stripePublishableKey.value)
  const submit = document.getElementById('submit-form')
  submit.addEventListener('submit', updatePerson)
  window.loaded = true
}

function updatePerson (e) {
  e.preventDefault()
  e.target.disabled = true
  setTimeout(function () {
    e.target.disabled = false
  }, 1000)
  const personData = {}
  const firstName = document.getElementById('first_name')
  if (firstName) {
    if (!firstName.value) {
      return window.renderError('invalid-first_name')
    }
    personData.first_name = firstName.value
  }
  const lastName = document.getElementById('last_name')
  if (lastName) {
    if (!lastName.value) {
      return window.renderError('invalid-last_name')
    }
    personData.last_name = lastName.value
  }
  const kanaFirstName = document.getElementById('first_name_kana')
  if (kanaFirstName) {
    if (!kanaFirstName.value) {
      return window.renderError('invalid-first_name_kana')
    }
    personData.first_name_kana = kanaFirstName.value
  }
  const kanaLastName = document.getElementById('last_name_kana')
  if (kanaLastName) {
    if (!kanaLastName.value) {
      return window.renderError('invalid-last_name_kana')
    }
    personData.last_name_kana = kanaLastName.value
  }
  const kanjiFirstName = document.getElementById('first_name_kanji')
  if (kanjiFirstName) {
    if (!kanjiFirstName.value) {
      return window.renderError('invalid-first_name_kanji')
    }
    personData.first_name_kanji = kanjiFirstName.value
  }
  const kanjiLastName = document.getElementById('last_name_kanji')
  if (kanjiLastName) {
    if (!kanjiLastName.value) {
      return window.renderError('invalid-last_name_kanji')
    }
    personData.last_name_kanji = kanjiLastName.value
  }
  const gender = document.getElementById('gender-container')
  if (gender) {
    const female = document.getElementById('female')
    const male = document.getElementById('male')
    if (!female.checked && !male.checked) {
      return window.renderError('invalid-gender')
    }
    personData.gender = female.checked ? 'female' : 'male'
  }
  let fields, i, len, element, property
  fields = ['address_line1', 'address_city', 'address_state', 'address_country', 'address_postal_code']
  for (i = 0, len = fields.length; i < len; i++) {
    element = document.getElementById(fields[i])
    if (element) {
      if (!element.value) {
        return window.renderError('invalid-' + fields[i])
      }
      property = fields[i].substring('address_'.length)
      personData.address = personData.address || {}
      personData.address[property] = element.value
    }
  }
  const addressLine2 = document.getElementById('address_line2')
  if (addressLine2 && addressLine2.value) {
    personData.address = personData.address || {}
    personData.address.line2 = addressLine2.value
  }
  if (document.getElementById('kana-address-container')) {
    fields = ['address_kana_line1', 'address_kana_city', 'address_kana_town', 'address_kana_state', 'address_kana_postal_code']
    for (i = 0, len = fields.length; i < len; i++) {
      element = document.getElementById(fields[i])
      if (element) {
        if (!element.value) {
          return window.renderError('invalid-' + fields[i])
        }
        property = fields[i].substring('address_kana'.length)
        personData.address_kana = personData.address_kana || {}
        personData.address_kana[property] = element.value
      }
    }
  }
  if (document.getElementById('kanji-address-container')) {
    fields = ['address_kanji_line1', 'address_kanji_city', 'address_kanji_town', 'address_kanji_state', 'address_kanji_postal_code']
    for (i = 0, len = fields.length; i < len; i++) {
      element = document.getElementById(fields[i])
      if (element) {
        if (!element.value) {
          return window.renderError('invalid-' + fields[i])
        }
        property = fields[i].substring('address_kanji'.length)
        personData.address_kanji = personData.address_kanji || {}
        personData.address_kanji[property] = element.value
      }
    }
  }
  const email = document.getElementById('email')
  if (email) {
    if (!email.value) {
      return window.renderError('invalid-email')
    }
    personData.email = email.value
  }
  const title = document.getElementById('relationship_title')
  if (title) {
    if (!title.value) {
      return window.renderError('invalid-relationship_title')
    }
    personData.relationship = personData.relationship || {}
    personData.relationship.title = title.value
  }
  const phone = document.getElementById('phone')
  if (phone) {
    if (!phone.value) {
      return window.renderError('invalid-phone')
    }
    personData.phone = phone.value
  }
  const ssnLast4 = document.getElementById('ssn_last_4')
  if (ssnLast4) {
    if (!ssnLast4.value) {
      return window.renderError('invalid-ssn_last_4')
    }
    personData.ssn_last_4 = ssnLast4.value
  }
  const percent = document.getElementById('relationship_percent_ownership')
  if (percent && percent.value) {
    personData.percent_ownership = percent.value
  }
  const idNumber = document.getElementById('id_number')
  if (idNumber) {
    if (!idNumber.value) {
      return window.renderError('invalid-id_number')
    }
    personData.id_number = idNumber.value
  }
  const director = document.getElementById('relationship_director')
  personData.relationship = personData.relationship || {}
  personData.relationship.director = !!director.checked
  const executive = document.getElementById('relationship_executive')
  personData.relationship.executive = !!executive.checked
  const owner = document.getElementById('relationship_owner')
  personData.relationship.owner = !!owner.checked
  if (owner.checked) {
    const percentOwned = document.getElementById('relationship_percent_ownership')
    personData.relationship.percent_ownership = percentOwned.value || '0'
  }
  const dobDay = document.getElementById('dob_day')
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
  const documentFront = document.getElementById('verification_document_front')
  const documentBack = document.getElementById('verification_document_back')
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
    const additionalDocumentFront = document.getElementById('verification_additional_document_front')
    const additionalDocumentBack = document.getElementById('verification_additional_document_back')
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
        const token = document.getElementById('token')
        token.value = result.token.id
        const form = document.getElementById('submit-form')
        return form.submit()
      })
    })
  })
}
