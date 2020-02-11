const connect = require('./index.js')
const TestHelper = require('./test-helper.js')

function createPostData (data, identity) {
  identity = identity || TestHelper.nextIdentity()
  const body = {}
  for (const field in data) {
    body[field] = data[field]
  }
  if (body.business_profile_mcc) {
    const codes = connect.getMerchantCategoryCodes()
    body.business_profile_mcc = codes[Math.floor(Math.random() * codes.length)].code
  }
  if (body.business_profile_url) {
    body.business_profile_url = 'https://' + (identity.email || identity.contactEmail).split('@')[1]
  }
  if (body.first_name) {
    body.first_name = identity.firstName
  }
  if (body.last_name) {
    body.last_name = identity.lastName
  }
  if (body.email) {
    body.email = identity.email || identity.contactEmail
  }
  if (body.account_holder_name) {
    body.account_holder_name = `${identity.firstName} ${identity.lastName}`
  }
  return body
}

module.exports = {
  createPostData,
  createSubmittedIndividual: async (country) => {
    country = country || 'US'
    global.webhooks = []
    const user = await module.exports.createIndividualReadyForSubmission(country)
    await TestHelper.submitStripeAccount(user)
    await TestHelper.waitForVerificationStart(user)
    await TestHelper.waitForPayoutsEnabled(user)
    await TestHelper.waitForPendingFieldsToLeave(user)
    await TestHelper.waitForVerification(user)
    await TestHelper.waitForPayoutsEnabled(user)
    return user
  },
  createSubmittedCompany: async (country) => {
    country = country || 'US'
    const user = await module.exports.createCompanyReadyForSubmission(country)
    await TestHelper.submitStripeAccount(user)
    await TestHelper.waitForVerificationStart(user)
    await TestHelper.waitForPayoutsEnabled(user)
    await TestHelper.waitForPendingFieldsToLeave(user)
    await TestHelper.waitForVerification(user)
    await TestHelper.waitForPayoutsEnabled(user)
    return user
  },
  createIndividualReadyForSubmission: async (country) => {
    country = country || 'US'
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      type: 'individual'
    })
    await TestHelper.createStripeRegistration(user, createPostData(individualData[country], user.profile))
    if (paymentData[country].length) {
      await TestHelper.createExternalAccount(user, createPostData(paymentData[country][0], user.profile))
    } else {
      await TestHelper.createExternalAccount(user, createPostData(paymentData[country], user.profile))
    }
    await TestHelper.waitForVerificationFieldsToLeave(user, 'external_account')
    // TODO: US individual requires submitting document front/back
    // but the Stripe test API is erroneously marking the document
    // as pending review instead of required, note that the other
    // countries legitimately do not require documentation
    if (country !== 'HK' && country !== 'MY' && country !== 'SG' && country !== 'US') {
      await TestHelper.waitForAccountRequirement(user, 'individual.verification.document')
      await TestHelper.updateStripeRegistration(user, {}, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.waitForVerificationFieldsToLeave(user, 'individual.verification.document')
      await TestHelper.waitForPendingFieldsToLeave(user)
      if (country !== 'CA' && country !== 'HK' && country !== 'JP' && country !== 'MY' && country !== 'SG' && country !== 'US') {
        await TestHelper.waitForAccountRequirement(user, 'individual.verification.additional_document')
        await TestHelper.updateStripeRegistration(user, {}, {
          verification_additional_document_back: TestHelper['success_id_scan_back.png'],
          verification_additional_document_front: TestHelper['success_id_scan_front.png']
        })
        await TestHelper.waitForVerificationFieldsToLeave(user, 'individual.verification.additional_document')
      }
    }
    await TestHelper.waitForPendingFieldsToLeave(user)
    return user
  },
  createCompanyReadyForSubmission: async (country) => {
    country = country || 'US'
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      type: 'company'
    })
    await TestHelper.createStripeRegistration(user, createPostData(companyData[country], user.profile), {
      verification_document_back: TestHelper['success_id_scan_back.png'],
      verification_document_front: TestHelper['success_id_scan_front.png']
    })
    await TestHelper.createPerson(user, {
      relationship_representative: true,
      relationship_executive: true,
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: '0'
    })
    await TestHelper.waitForAccountRequirement(user, `${user.representative.id}.dob.day`)
    await TestHelper.waitForPersonRequirement(user, user.representative.id, 'dob.day')
    const representativePostData = createPostData(representativeData[country], user.profile)
    await TestHelper.updatePerson(user, user.representative, representativePostData)
    if (country === 'HK' || country === 'SG') {
      await TestHelper.waitForCurrentlyDueFieldsToLeave(user, user.representative.id)
    }
    // TODO: US representative requires submitting document front/back
    // but the Stripe test API is erroneously marking the document
    // as pending review instead of required, note that the other
    // countries legitimately do not require documentation
    if (country !== 'HK' && country !== 'MY' && country !== 'SG' && country !== 'US') {
      await TestHelper.waitForAccountRequirement(user, `${user.representative.id}.verification.document`)
      await TestHelper.waitForPersonRequirement(user, user.representative.id, 'verification.document')
      await TestHelper.updatePerson(user, user.representative, {}, {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      })
      if (country !== 'CA' && country !== 'JP' && country !== 'US') {
        await TestHelper.waitForAccountRequirement(user, `${user.representative.id}.verification.additional_document`)
        await TestHelper.waitForPersonRequirement(user, user.representative.id, 'verification.additional_document')
        await TestHelper.updatePerson(user, user.representative, {}, {
          verification_additional_document_back: TestHelper['success_id_scan_back.png'],
          verification_additional_document_front: TestHelper['success_id_scan_front.png']
        })
        await TestHelper.waitForVerificationFieldsToLeave(user, `${user.representative.id}.verification.additional_document`)
      }
    } else if (country === 'HK') {
      // TODO: these fields are required 'eventually' which is
      // not consistent with all the other countries' reps so
      // if that changes this 'special update' can be removed
      await TestHelper.updatePerson(user, user.representative, {
        address_city: 'Hong Kong',
        address_line1: '123 Sesame St',
        id_number: '000000000'
      })
      await TestHelper.waitForVerificationFieldsToLeave(user, `${user.representative.id}.id_number`)
      await TestHelper.waitForVerificationFieldsToLeave(user, `${user.representative.id}.address.city`)
      await TestHelper.waitForVerificationFieldsToLeave(user, `${user.representative.id}.address.line1`)
    }
    await TestHelper.waitForVerificationFieldsToLeave(user, user.representative.id)
    if (beneficialOwnerData[country] !== false) {
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.waitForVerificationFieldsToLeave(user, 'relationship.owner')
    }
    if (companyDirectorData[country] !== false) {
      await TestHelper.submitCompanyDirectors(user)
      await TestHelper.waitForVerificationFieldsToLeave(user, 'relationship.director')
    }
    if (paymentData[country].length) {
      await TestHelper.createExternalAccount(user, createPostData(paymentData[country][0], user.profile))
    } else {
      await TestHelper.createExternalAccount(user, createPostData(paymentData[country], user.profile))
    }
    // TODO: fix this when Stripe fixes company.verification.document
    // the 'company.verification.document' erroneously shows up in the
    // 'requirements.pending_validation' signifying it is under review, then
    // it is removed from that, but really it needs to show up in currently_due
    // and then submit the documents and then it should be pending_validation
    await TestHelper.updateStripeRegistration(user, {}, {
      verification_document_back: TestHelper['success_id_scan_back.png'],
      verification_document_front: TestHelper['success_id_scan_front.png']
    })
    await TestHelper.waitForVerificationFieldsToLeave(user, 'company.verification.document')
    await TestHelper.waitForPendingFieldsToLeave(user)
    return user
  },
  createCompanyWithOwners: async (country, numOwners) => {
    country = country || 'US'
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      type: 'company'
    })
    if (numOwners && beneficialOwnerData[country] !== false) {
      for (let i = 0, len = numOwners; i < len; i++) {
        await TestHelper.createPerson(user, {
          relationship_owner: true,
          relationship_title: 'Shareholder',
          relationship_percent_ownership: (i + 1)
        })
      }
    }
    return user
  },
  createCompanyWithDirectors: async (country, numDirectors) => {
    country = country || 'US'
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      type: 'company'
    })
    if (numDirectors && companyDirectorData[country] !== false) {
      for (let i = 0, len = numDirectors; i < len; i++) {
        await TestHelper.createPerson(user, {
          relationship_director: true,
          relationship_title: 'Director',
          relationship_percent_ownership: '0'
        })
      }
    }
    return user
  },
  createCompanyWithRepresentative: async (country) => {
    country = country || 'US'
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      type: 'company'
    })
    await TestHelper.createPerson(user, {
      relationship_representative: true,
      relationship_executive: true,
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: 0
    })
    await TestHelper.waitForAccountRequirement(user, `${user.representative.id}.dob.day`)
    await TestHelper.waitForPersonRequirement(user, user.representative.id, 'dob.day')
    const person = TestHelper.nextIdentity()
    const requireDocument = user.representative.requirements.currently_due.indexOf('verification.document') > -1 ||
                            user.representative.requirements.eventually_due.indexOf('verification.document') > -1
    let documents
    if (requireDocument) {
      documents = {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      }
    }
    await TestHelper.updatePerson(user, user.representative, createPostData(representativeData[country], person), documents)
    return user
  },
  createCompanyMissingRepresentative: async (country) => {
    country = country || 'US'
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      type: 'company'
    })
    await TestHelper.createStripeRegistration(user, createPostData(companyData[country], user.profile), {
      verification_document_back: TestHelper['success_id_scan_back.png'],
      verification_document_front: TestHelper['success_id_scan_front.png']
    })
    if (beneficialOwnerData[country] !== false) {
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.waitForVerificationFieldsToLeave(user, 'relationship.owner')
    }
    if (companyDirectorData[country] !== false) {
      await TestHelper.submitCompanyDirectors(user)
      await TestHelper.waitForVerificationFieldsToLeave(user, 'relationship.director')
    }
    if (paymentData[country].length) {
      await TestHelper.createExternalAccount(user, createPostData(paymentData[country][0], user.profile))
    } else {
      await TestHelper.createExternalAccount(user, createPostData(paymentData[country], user.profile))
    }
    // TODO: fix this when Stripe fixes company.verification.document
    // the 'company.verification.document' erroneously shows up in the
    // 'requirements.pending_validation' signifying it is under review, then
    // it is removed from that, but really it needs to show up in currently_due
    // and then submit the documents and then it should be pending_validation
    await TestHelper.updateStripeRegistration(user, {}, {
      verification_document_back: TestHelper['success_id_scan_back.png'],
      verification_document_front: TestHelper['success_id_scan_front.png']
    })
    return user
  },
  createCompanyMissingPaymentDetails: async (country) => {
    country = country || 'US'
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      type: 'company'
    })
    await TestHelper.createStripeRegistration(user, createPostData(companyData[country], user.profile), {
      verification_document_back: TestHelper['success_id_scan_back.png'],
      verification_document_front: TestHelper['success_id_scan_front.png']
    })
    const representativePostData = createPostData(representativeData[country], user.profile)
    const representativeUploadData = {
      verification_document_back: TestHelper['success_id_scan_back.png'],
      verification_document_front: TestHelper['success_id_scan_front.png']
    }
    if (country !== 'CA' && country !== 'HK' && country !== 'JP' && country !== 'MY' && country !== 'SG' && country !== 'US') {
      representativeUploadData.verification_additional_document_back = TestHelper['success_id_scan_back.png']
      representativeUploadData.verification_additional_document_front = TestHelper['success_id_scan_front.png']
    }
    await TestHelper.createPerson(user, {
      relationship_representative: true,
      relationship_executive: true,
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: 0
    })
    await TestHelper.waitForAccountRequirement(user, `${user.representative.id}.dob.day`)
    await TestHelper.waitForPersonRequirement(user, user.representative.id, 'dob.day')
    await TestHelper.updatePerson(user, user.representative, representativePostData, representativeUploadData)
    if (beneficialOwnerData[country] !== false) {
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.waitForVerificationFieldsToLeave(user, 'relationship.owner')
    }
    if (companyDirectorData[country] !== false) {
      await TestHelper.submitCompanyDirectors(user)
      await TestHelper.waitForVerificationFieldsToLeave(user, 'relationship.director')
    }
    // TODO: fix this when Stripe fixes company.verification.document
    // the 'company.verification.document' erroneously shows up in the
    // 'requirements.pending_validation' signifying it is under review, then
    // it is removed from that, but really it needs to show up in currently_due
    // and then submit the documents and then it should be pending_validation
    await TestHelper.updateStripeRegistration(user, {}, {
      verification_document_back: TestHelper['success_id_scan_back.png'],
      verification_document_front: TestHelper['success_id_scan_front.png']
    })
    return user
  },
  createCompanyMissingOwners: async (country) => {
    country = country || 'US'
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      type: 'company'
    })
    if (paymentData[country].length) {
      await TestHelper.createExternalAccount(user, createPostData(paymentData[country][0], user.profile))
    } else {
      await TestHelper.createExternalAccount(user, createPostData(paymentData[country], user.profile))
    }
    await TestHelper.createStripeRegistration(user, createPostData(companyData[country], user.profile), {
      verification_document_back: TestHelper['success_id_scan_back.png'],
      verification_document_front: TestHelper['success_id_scan_front.png']
    })
    const representativePostData = createPostData(representativeData[country], user.profile)
    const representativeUploadData = {
      verification_document_back: TestHelper['success_id_scan_back.png'],
      verification_document_front: TestHelper['success_id_scan_front.png']
    }
    if (country !== 'CA' && country !== 'HK' && country !== 'JP' && country !== 'MY' && country !== 'SG' && country !== 'US') {
      representativeUploadData.verification_additional_document_back = TestHelper['success_id_scan_back.png']
      representativeUploadData.verification_additional_document_front = TestHelper['success_id_scan_front.png']
    }
    await TestHelper.createPerson(user, {
      relationship_representative: true,
      relationship_executive: true,
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: 0
    })
    await TestHelper.waitForAccountRequirement(user, `${user.representative.id}.dob.day`)
    await TestHelper.waitForPersonRequirement(user, user.representative.id, 'dob.day')
    await TestHelper.updatePerson(user, user.representative, representativePostData, representativeUploadData)
    if (companyDirectorData[country] !== false) {
      await TestHelper.submitCompanyDirectors(user)
      await TestHelper.waitForVerificationFieldsToLeave(user, 'relatioship.director')
    }
    // TODO: fix this when Stripe fixes company.verification.document
    // the 'company.verification.document' erroneously shows up in the
    // 'requirements.pending_validation' signifying it is under review, then
    // it is removed from that, but really it needs to show up in currently_due
    // and then submit the documents and then it should be pending_validation
    await TestHelper.updateStripeRegistration(user, {}, {
      verification_document_back: TestHelper['success_id_scan_back.png'],
      verification_document_front: TestHelper['success_id_scan_front.png']
    })
    return user
  },
  createCompanyMissingDirectors: async (country) => {
    country = country || 'US'
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      type: 'company'
    })
    if (paymentData[country].length) {
      await TestHelper.createExternalAccount(user, createPostData(paymentData[country][0], user.profile))
    } else {
      await TestHelper.createExternalAccount(user, createPostData(paymentData[country], user.profile))
    }
    await TestHelper.createStripeRegistration(user, createPostData(companyData[country], user.profile), {
      verification_document_back: TestHelper['success_id_scan_back.png'],
      verification_document_front: TestHelper['success_id_scan_front.png']
    })
    const representativePostData = createPostData(representativeData[country], user.profile)
    const representativeUploadData = {
      verification_document_back: TestHelper['success_id_scan_back.png'],
      verification_document_front: TestHelper['success_id_scan_front.png']
    }
    if (country !== 'CA' && country !== 'HK' && country !== 'JP' && country !== 'MY' && country !== 'SG' && country !== 'US') {
      representativeUploadData.verification_additional_document_back = TestHelper['success_id_scan_back.png']
      representativeUploadData.verification_additional_document_front = TestHelper['success_id_scan_front.png']
    }
    await TestHelper.createPerson(user, {
      relationship_representative: true,
      relationship_executive: true,
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: 0
    })
    await TestHelper.updatePerson(user, user.representative, representativePostData, representativeUploadData)
    if (beneficialOwnerData[country] !== false) {
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.waitForVerificationFieldsToLeave(user, 'relationship.owner')
    }
    // TODO: fix this when Stripe fixes company.verification.document
    // the 'company.verification.document' erroneously shows up in the
    // 'requirements.pending_validation' signifying it is under review, then
    // it is removed from that, but really it needs to show up in currently_due
    // and then submit the documents and then it should be pending_validation
    await TestHelper.updateStripeRegistration(user, {}, {
      verification_document_back: TestHelper['success_id_scan_back.png'],
      verification_document_front: TestHelper['success_id_scan_front.png']
    })
    return user
  },
  createIndividualMissingPaymentDetails: async (country) => {
    country = country || 'US'
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      type: 'individual'
    })
    const individualUploadData = {
      verification_document_back: TestHelper['success_id_scan_back.png'],
      verification_document_front: TestHelper['success_id_scan_front.png']
    }
    if (country !== 'CA' && country !== 'HK' && country !== 'JP' && country !== 'MY' && country !== 'SG' && country !== 'US') {
      individualUploadData.verification_additional_document_back = TestHelper['success_id_scan_back.png']
      individualUploadData.verification_additional_document_front = TestHelper['success_id_scan_front.png']
    }
    await TestHelper.createStripeRegistration(user, createPostData(individualData[country], user.profile), individualUploadData)
    return user
  },
  createIndividualMissingIndividualDetails: async (country) => {
    country = country || 'US'
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      type: 'individual'
    })
    if (paymentData[country].length) {
      await TestHelper.createExternalAccount(user, createPostData(paymentData[country][0], user.profile))
    } else {
      await TestHelper.createExternalAccount(user, createPostData(paymentData[country], user.profile))
    }
    await TestHelper.waitForVerificationFieldsToLeave(user, 'external_account')
    return user
  },
  createIndividualWithFailedField: async (country, field) => {
    country = country || 'US'
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      type: 'individual'
    })
    const individualPostData = createPostData(individualData[country], user.profile)
    switch (field) {
      case 'address':
        individualPostData.address_line1 = 'address_no_match'
        break
      case 'dob':
        individualPostData.dob_day = '01'
        individualPostData.dob_month = '01'
        individualPostData.dob_year = '1900'
        break
      case 'id_number':
        individualPostData.id_number = '111111111'
        break
      case 'ssn_last_4':
        individualPostData.ssn_last_4 = '1111'
        break
      case 'document':
        individualPostData.verification_document_back = 'file_identity_document_failure'
        individualPostData.verification_document_front = 'file_identity_document_failure'
        break
      case 'additional_document':
        individualPostData.verification_document_back = 'file_identity_document_failure'
        individualPostData.verification_document_front = 'file_identity_document_failure'
        break
    }
    await TestHelper.createStripeRegistration(user, individualPostData)
    let paymentPostData
    if (paymentData[country].length) {
      paymentPostData = createPostData(paymentData[country][0], user.profile)
    } else {
      paymentPostData = createPostData(paymentData[country], user.profile)
    }
    if (field === 'payment') {
      if (!paymentPostData.account_number || !paymentPostData.routing_number) {
        throw new Error('can only use countries with account_number / routing_number to test payment info errors')
      }
      paymentPostData.routing_number = '110000000'
      paymentPostData.account_number = '000111111116'
    }
    await TestHelper.createExternalAccount(user, paymentPostData)
    await TestHelper.waitForVerificationFieldsToLeave(user, 'external_account')
    const req = TestHelper.createRequest(`/api/user/connect/stripe-account?stripeid=${user.stripeAccount.id}`)
    req.session = user.session
    req.account = user.account
    req.stripeKey = {
      api_key: process.env.STRIPE_KEY
    }
    await TestHelper.waitForAccountRequirement(user, 'individual.verification.document')
    await TestHelper.updateStripeRegistration(user, {}, {
      verification_document_back: TestHelper['success_id_scan_back.png'],
      verification_document_front: TestHelper['success_id_scan_front.png']
    })
    await TestHelper.waitForVerificationFieldsToLeave(user, 'individual.verification.document')
    await TestHelper.waitForPendingFieldsToLeave(user)
    if (country !== 'CA' && country !== 'HK' && country !== 'JP' && country !== 'MY' && country !== 'SG' && country !== 'US') {
      await TestHelper.waitForAccountRequirement(user, 'individual.verification.additional_document')
      await TestHelper.updateStripeRegistration(user, {}, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.waitForVerificationFieldsToLeave(user, 'individual.verification.additional_document')
    }
    await TestHelper.waitForPayoutsEnabled(user)
    await TestHelper.waitForPendingFieldsToLeave(user)
    return user
  },
  createCompanyWithFailedField: async (country, field) => {
    country = country || 'US'
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      type: 'company'
    })
    const companyPostData = createPostData(companyData[country], user.profile)
    switch (field) {
      case 'company.address':
        companyPostData.address_line1 = 'address_no_match'
        break
      case 'tax_id':
        companyPostData.tax_id = '111111111'
        break
      case 'document':
        companyPostData.verification_document_back = 'file_identity_document_failure'
        companyPostData.verification_document_front = 'file_identity_document_failure'
        break
    }
    await TestHelper.createStripeRegistration(user, companyPostData)
    const representativePostData = createPostData(representativeData[country], user.profile)
    switch (field) {
      case 'representative.address':
        representativePostData.address_line1 = 'address_no_match'
        break
      case 'representative.dob':
        representativePostData.dob_day = '01'
        representativePostData.dob_month = '01'
        representativePostData.dob_year = '1900'
        break
      case 'representative.id_number':
        representativePostData.id_number = '111111111'
        break
      case 'representative.ssn_last_4':
        representativePostData.ssn_last_4 = '1111'
        break
      case 'representative.document':
        representativePostData.verification_document_back = 'file_identity_document_failure'
        representativePostData.verification_document_front = 'file_identity_document_failure'
        break
      case 'representative.additional_document':
        representativePostData.verification_document_back = 'file_identity_document_failure'
        representativePostData.verification_document_front = 'file_identity_document_failure'
        break
    }
    await TestHelper.createPerson(user, {
      relationship_representative: true,
      relationship_executive: true,
      relationship_title: 'SVP Testing',
      relationship_percent_ownership: 0
    })
    await TestHelper.updatePerson(user, user.representative, representativePostData)
    await TestHelper.waitForAccountRequirement(user, `${user.representative.id}.verification.document`)
    await TestHelper.waitForPersonRequirement(user, user.representative.id, 'verification.document')
    await TestHelper.updatePerson(user, user.representative, {}, {
      verification_document_back: TestHelper['success_id_scan_back.png'],
      verification_document_front: TestHelper['success_id_scan_front.png']
    })
    await TestHelper.waitForVerificationFieldsToLeave(user, `${user.representative.id}.verification.document`)
    for (const posted in representativePostData) {
      const field = posted.replace('address_', 'address.').replace('relationship_', 'relationship.').replace('dob_', 'dob.').replace('verification_', 'verification.')
      await TestHelper.waitForVerificationFieldsToLeave(user, `${user.representative.id}.${field}`)
    }
    if (country !== 'CA' && country !== 'HK' && country !== 'JP' && country !== 'MY' && country !== 'SG' && country !== 'US') {
      await TestHelper.waitForAccountRequirement(user, `${user.representative.id}.verification.additional_document`)
      await TestHelper.updatePerson(user, user.representative, {}, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.waitForVerificationFieldsToLeave(user, `${user.representative.id}.verification.additional_document`)
    }
    if (beneficialOwnerData[country] !== false) {
      await TestHelper.createPerson(user, {
        relationship_owner: true,
        relationship_title: 'Shareholder',
        relationship_percent_ownership: 10
      })
      const beneficialOwnerPostData = createPostData(beneficialOwnerData[country], user.profile)
      switch (field) {
        case 'owner.address':
          beneficialOwnerPostData.address_line1 = 'address_no_match'
          break
        case 'owner.dob':
          beneficialOwnerPostData.dob_day = '01'
          beneficialOwnerPostData.dob_month = '01'
          beneficialOwnerPostData.dob_year = '1900'
          break
        case 'owner.id_number':
          beneficialOwnerPostData.id_number = '111111111'
          break
        case 'owner.ssn_last_4':
          beneficialOwnerPostData.ssn_last_4 = '1111'
          break
        case 'owner.document':
          beneficialOwnerPostData.verification_document_back = 'file_identity_document_failure'
          beneficialOwnerPostData.verification_document_front = 'file_identity_document_failure'
          break
        case 'owner.additional_document':
          beneficialOwnerPostData.verification_document_back = 'file_identity_document_failure'
          beneficialOwnerPostData.verification_document_front = 'file_identity_document_failure'
          break
      }
      await TestHelper.updatePerson(user, user.owner, beneficialOwnerPostData)
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.waitForVerificationFieldsToLeave(user, 'relationship.owner')
    }
    if (companyDirectorData[country] !== false) {
      await TestHelper.createPerson(user, {
        relationship_director: true,
        relationship_title: 'Shareholder',
        relationship_percent_ownership: '10'
      })
      const companyDirectorPostData = createPostData(companyDirectorData[country], user.profile)
      switch (field) {
        case 'director.address':
          companyDirectorPostData.address_line1 = 'address_no_match'
          break
        case 'director.dob':
          companyDirectorPostData.dob_day = '01'
          companyDirectorPostData.dob_month = '01'
          companyDirectorPostData.dob_year = '1900'
          break
        case 'director.id_number':
          companyDirectorPostData.id_number = '111111111'
          break
        case 'director.ssn_last_4':
          companyDirectorPostData.ssn_last_4 = '1111'
          break
        case 'director.document':
          companyDirectorPostData.verification_document_back = 'file_identity_document_failure'
          companyDirectorPostData.verification_document_front = 'file_identity_document_failure'
          break
        case 'director.additional_document':
          companyDirectorPostData.verification_document_back = 'file_identity_document_failure'
          companyDirectorPostData.verification_document_front = 'file_identity_document_failure'
          break
      }
      await TestHelper.updatePerson(user, user.director, companyDirectorPostData)
      await TestHelper.submitCompanyDirectors(user)
      await TestHelper.waitForVerificationFieldsToLeave(user, 'relationship.director')
    }
    let paymentPostData
    if (paymentData[country].length) {
      paymentPostData = createPostData(paymentData[country][0], user.profile)
    } else {
      paymentPostData = createPostData(paymentData[country], user.profile)
    }
    if (field === 'payment') {
      if (!paymentPostData.account_number || !paymentPostData.routing_number) {
        throw new Error('can only use countries with account_number / routing_number to test payment info errors')
      }
      paymentPostData.routing_number = '110000000'
      paymentPostData.account_number = '000111111116'
    }
    await TestHelper.createExternalAccount(user, createPostData(paymentPostData, user.profile))
    // TODO: fix this when Stripe fixes company.verification.document
    // the 'company.verification.document' erroneously shows up in the
    // 'requirements.pending_validation' signifying it is under review, then
    // it is removed from that, but really it needs to show up in currently_due
    // and then submit the documents and then it should be pending_validation
    await TestHelper.updateStripeRegistration(user, {}, {
      verification_document_back: TestHelper['success_id_scan_back.png'],
      verification_document_front: TestHelper['success_id_scan_front.png']
    })
    await TestHelper.waitForVerificationFieldsToLeave(user, 'company.verification.document')
    await TestHelper.waitForPendingFieldsToLeave(user)
    return user
  }
}

const companyData = module.exports.companyData = {
  AT: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Vienna',
    address_line1: '123 Park Lane',
    address_postal_code: '1020',
    address_state: '1',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  AU: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Brisbane',
    address_line1: '123 Park Lane',
    address_postal_code: '4000',
    address_state: 'QLD',
    name: 'Company',
    // TODO: for consistency include country code
    // as Stripe may add it anyway when submitting,
    // except AU's country code +61 isn't recognized
    phone: '4567890123',
    tax_id: '00000000000'
  },
  BE: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Brussels',
    address_line1: '123 Park Lane',
    address_postal_code: '1020',
    address_state: 'BRU',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  CA: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Vancouver',
    address_line1: '123 Park Lane',
    address_postal_code: 'V5K 0A1',
    address_state: 'BC',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  CH: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Bern',
    address_line1: '123 Park Lane',
    address_postal_code: '1020',
    address_state: 'BE',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  DE: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Berlin',
    address_line1: '123 Park Lane',
    address_postal_code: '01067',
    address_state: 'BE',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  DK: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Copenhagen',
    address_line1: '123 Park Lane',
    address_postal_code: '1000',
    address_state: '147',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  EE: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Talin',
    address_line1: '123 Park Lane',
    address_postal_code: '10128',
    address_state: '37',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  ES: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Madrid',
    address_line1: '123 Park Lane',
    address_postal_code: '03179',
    address_state: 'AN',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  FI: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Helsinki',
    address_line1: '123 Park Lane',
    address_postal_code: '00990',
    address_state: 'AL',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  FR: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Paris',
    address_line1: '123 Park Lane',
    address_postal_code: '75001',
    address_state: 'A',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  GB: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'London',
    address_line1: '123 Park Lane',
    address_postal_code: 'EC1A 1AA',
    address_state: 'LND',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  GR: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Athens',
    address_line1: '123 Park Lane',
    address_postal_code: '104',
    address_state: 'I',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  HK: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Hong Kong',
    address_line1: '123 Park Lane',
    address_postal_code: '00000',
    address_state: 'HK',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  IE: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Dublin',
    address_line1: '123 Park Lane',
    address_postal_code: 'Dublin 1',
    address_state: 'D',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  IT: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Rome',
    address_line1: '123 Park Lane',
    address_postal_code: '00010',
    address_state: '65',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  JP: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_kana_city: 'ｼﾌﾞﾔ',
    address_kana_line1: '27-15',
    address_kana_postal_code: '1500001',
    address_kana_state: 'ﾄｳｷﾖｳﾄ',
    address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
    address_kanji_city: '渋谷区',
    address_kanji_line1: '２７－１５',
    address_kanji_postal_code: '1500001',
    address_kanji_state: '東京都',
    address_kanji_town: '神宮前　３丁目',
    name: 'Company',
    name_kana: 'ﾄｳｷﾖｳﾄ',
    name_kanji: '東京都',
    phone: '+810112716677',
    tax_id: '00000000000'
  },
  LT: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Vilnius',
    address_line1: '123 Sesame St',
    address_postal_code: 'LT-00000',
    address_state: 'AL',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  LU: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Luxemburg',
    address_line1: '123 Park Lane',
    address_postal_code: '1623',
    address_state: 'L',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  LV: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Riga',
    address_line1: '123 Sesame St',
    address_postal_code: 'LV–1073',
    address_state: 'AI',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  MY: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Kuala Lumpur',
    address_line1: '123 Sesame St',
    address_postal_code: '50450',
    address_state: 'C',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  NL: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Amsterdam',
    address_line1: '123 Park Lane',
    address_postal_code: '1071 JA',
    address_state: 'DR',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  NO: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Oslo',
    address_line1: '123 Park Lane',
    address_postal_code: '0001',
    address_state: '02',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  NZ: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Auckland',
    address_line1: '123 Park Lane',
    address_postal_code: '6011',
    address_state: 'N',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  PL: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Krakow',
    address_line1: '123 Park Lane',
    address_postal_code: '32-400',
    address_state: 'KR',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  PT: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Lisbon',
    address_line1: '123 Park Lane',
    address_postal_code: '4520',
    address_state: '01',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  SE: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Stockholm',
    address_line1: '123 Park Lane',
    address_postal_code: '00150',
    address_state: 'K',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  SG: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Singapore',
    address_line1: '123 Park Lane',
    address_postal_code: '339696',
    address_state: 'SG',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  SI: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Ljubljana',
    address_line1: '123 Sesame St',
    address_postal_code: '1210',
    address_state: '07',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  SK: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'Slovakia',
    address_line1: '123 Sesame St',
    address_postal_code: '00102',
    address_state: 'BC',
    name: 'Company',
    phone: '4567890123',
    tax_id: '00000000000'
  },
  US: {
    business_profile_mcc: true,
    business_profile_url: true,
    address_city: 'New York',
    address_line1: '285 Fulton St',
    address_postal_code: '10007',
    address_state: 'NY',
    name: 'Company',
    phone: '+14567890123',
    tax_id: '00000000000'
  }
}

const representativeData = module.exports.representativeData = {
  AT: {
    address_city: 'Vienna',
    address_line1: '123 Sesame St',
    address_postal_code: '1020',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  AU: {
    address_city: 'Brisbane',
    address_line1: '845 Oxford St',
    address_postal_code: '4000',
    address_state: 'QLD',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  BE: {
    address_city: 'Brussels',
    address_line1: '123 Sesame St',
    address_postal_code: '1020',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  CA: {
    address_city: 'Vancouver',
    address_line1: '123 Sesame St',
    address_postal_code: 'V5K 0A1',
    address_state: 'BC',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true
  },
  CH: {
    address_city: 'Bern',
    address_line1: '123 Sesame St',
    address_postal_code: '1020',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  DE: {
    address_city: 'Berlin',
    address_line1: '123 Sesame St',
    address_postal_code: '01067',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  DK: {
    address_city: 'Copenhagen',
    address_line1: '123 Sesame St',
    address_postal_code: '1000',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  EE: {
    address_city: 'Tallinn',
    address_line1: '123 Sesame St',
    address_postal_code: '10128',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  ES: {
    address_city: 'Madrid',
    address_line1: '123 Park Lane',
    address_postal_code: '03179',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  FI: {
    address_city: 'Helsinki',
    address_line1: '123 Sesame St',
    address_postal_code: '00990',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  FR: {
    address_city: 'Paris',
    address_line1: '123 Sesame St',
    address_postal_code: '75001',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  GB: {
    address_city: 'London',
    address_line1: '123 Sesame St',
    address_postal_code: 'EC1A 1AA',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  GR: {
    address_city: 'Athens',
    address_line1: '123 Park Lane',
    address_postal_code: '104',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  HK: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true
  },
  IE: {
    address_city: 'Dublin',
    address_line1: '123 Sesame St',
    address_state: 'D',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  IT: {
    address_city: 'Rome',
    address_line1: '123 Sesame St',
    address_postal_code: '00010',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  JP: {
    address_kana_city: 'ｼﾌﾞﾔ',
    address_kana_line1: '27-15',
    address_kana_postal_code: '1500001',
    address_kana_state: 'ﾄｳｷﾖｳﾄ',
    address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
    address_kanji_city: '渋谷区',
    address_kanji_line1: '２７－１５',
    address_kanji_postal_code: '12345',
    address_kanji_state: '東京都',
    address_kanji_town: '神宮前 ３丁目',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name_kana: 'ﾄｳｷﾖｳﾄ',
    first_name_kanji: '東京都',
    gender: 'female',
    last_name_kana: 'ﾄｳｷﾖｳﾄ',
    last_name_kanji: '東京都',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests'
  },
  LT: {
    address_city: 'Vilnius',
    address_line1: '123 Sesame St',
    address_postal_code: 'LT-00000',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  LU: {
    address_city: 'Luxemburg',
    address_line1: '123 Sesame St',
    address_postal_code: '1623',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  LV: {
    address_city: 'Riga',
    address_line1: '123 Sesame St',
    address_postal_code: 'LV–1073',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  MY: {
    address_city: 'Kuala Lumpur',
    address_line1: '123 Sesame St',
    address_postal_code: '50450',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    id_number: '000000000',
    first_name: true,
    last_name: true
  },
  NL: {
    address_city: 'Amsterdam',
    address_line1: '123 Sesame St',
    address_postal_code: '1071 JA',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  NO: {
    address_city: 'Oslo',
    address_line1: '123 Sesame St',
    address_postal_code: '0001',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  NZ: {
    address_city: 'Auckland',
    address_line1: '844 Fleet Street',
    address_postal_code: '6011',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  PL: {
    address_city: 'Krakow',
    address_line1: '123 Park Lane',
    address_postal_code: '32-400',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  PT: {
    address_city: 'Lisbon',
    address_line1: '123 Sesame St',
    address_postal_code: '4520',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  SE: {
    address_city: 'Stockholm',
    address_line1: '123 Sesame St',
    address_postal_code: '00150',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  SG: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests'
  },
  SI: {
    address_city: 'Ljubljana',
    address_line1: '123 Sesame St',
    address_postal_code: '1210',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  SK: {
    address_city: 'Slovakia',
    address_line1: '123 Sesame St',
    address_postal_code: '00102',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    first_name: true,
    last_name: true,
    email: true
  },
  US: {
    address_city: 'New York',
    address_line1: '285 Fulton St',
    address_postal_code: '10007',
    address_state: 'NY',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '+14567890123',
    relationship_representative: true,
    relationship_executive: 'true',
    relationship_title: 'VP Tests',
    ssn_last_4: '0000',
    first_name: true,
    last_name: true,
    email: true
  }
}

const paymentData = module.exports.paymentData = {
  AT: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'AT',
    currency: 'eur',
    iban: 'AT89370400440532013000'
  },
  AU: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'AU',
    account_number: '000123456',
    bsb_number: '110000',
    currency: 'aud'
  },
  BE: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'BE',
    currency: 'eur',
    iban: 'BE89370400440532013000'
  },
  CA: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'CA',
    account_number: '000123456789',
    currency: 'cad',
    institution_number: '000',
    transit_number: '11000'
  },
  CH: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'CH',
    currency: 'eur',
    iban: 'CH89370400440532013000'
  },
  DE: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'DE',
    currency: 'eur',
    iban: 'DE89370400440532013000'
  },
  DK: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'DK',
    currency: 'eur',
    iban: 'DK89370400440532013000'
  },
  EE: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'EE',
    currency: 'eur',
    iban: 'EE89370400440532013000'
  },
  ES: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'ES',
    currency: 'eur',
    iban: 'ES89370400440532013000'
  },
  FI: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'FI',
    currency: 'eur',
    iban: 'FI89370400440532013000'
  },
  FR: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'FR',
    currency: 'eur',
    iban: 'FR89370400440532013000'
  },
  GB: [{
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'GB',
    account_number: '00012345',
    currency: 'gbp',
    sort_code: '108800'
  }, {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'GB',
    currency: 'eur',
    iban: 'GB89370400440532013000'
  }],
  GR: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'GR',
    currency: 'eur',
    iban: 'GR89370400440532013000'
  },
  HK: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'HK',
    account_number: '000123456',
    branch_code: '000',
    clearing_code: '110',
    currency: 'hkd'
  },
  IE: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'IE',
    currency: 'eur',
    iban: 'IE89370400440532013000'
  },
  IT: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'IT',
    currency: 'eur',
    iban: 'IT89370400440532013000'
  },
  JP: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'JP',
    account_number: '0001234',
    bank_code: '1100',
    branch_code: '000',
    currency: 'jpy'
  },
  LT: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'LT',
    currency: 'eur',
    iban: 'LT89370400440532013000'
  },
  LU: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'LU',
    currency: 'eur',
    iban: 'LU89370400440532013000'
  },
  LV: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'LV',
    currency: 'eur',
    iban: 'LV89370400440532013000'
  },
  MY: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'MY',
    currency: 'myr',
    routing_number: 'TESTMYKL',
    account_number: '000123456000'
  },
  NL: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'NL',
    currency: 'eur',
    iban: 'NL89370400440532013000'
  },
  NO: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'NO',
    currency: 'eur',
    iban: 'NO89370400440532013000'
  },
  NZ: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'NZ',
    account_number: '0000000010',
    currency: 'nzd',
    routing_number: '110000'
  },
  PL: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'PL',
    currency: 'eur',
    iban: 'PL89370400440532013000'
  },
  PT: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'PT',
    currency: 'eur',
    iban: 'PT89370400440532013000'
  },
  SE: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'SE',
    currency: 'eur',
    iban: 'SE89370400440532013000'
  },
  SG: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'SG',
    account_number: '000123456',
    bank_code: '1100',
    branch_code: '000',
    currency: 'sgd'
  },
  SI: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'SI',
    currency: 'eur',
    iban: 'SI89370400440532013000'
  },
  SK: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'SK',
    currency: 'eur',
    iban: 'SK89370400440532013000'
  },
  US: {
    account_holder_name: true,
    account_holder_type: 'individual',
    country: 'US',
    account_number: '000123456789',
    currency: 'usd',
    routing_number: '110000000'
  }
}

const individualData = module.exports.individualData = {
  AT: {
    address_city: 'Vienna',
    address_line1: '123 Sesame St',
    address_postal_code: '1020',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  AU: {
    address_city: 'Brisbane',
    address_line1: '845 Oxford St',
    address_postal_code: '4000',
    address_state: 'QLD',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    // TODO: for consistency include country code
    // as Stripe may add it anyway when submitting,
    // except AU's country code +61 isn't recognized
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  BE: {
    address_city: 'Brussels',
    address_line1: '123 Sesame St',
    address_postal_code: '1020',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  CA: {
    address_city: 'Vancouver',
    address_line1: '123 Sesame St',
    address_postal_code: 'V5K 0A1',
    address_state: 'BC',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true
  },
  CH: {
    address_city: 'Bern',
    address_line1: '123 Sesame St',
    address_postal_code: '1020',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  DE: {
    address_city: 'Berlin',
    address_line1: '123 Sesame St',
    address_postal_code: '01067',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  DK: {
    address_city: 'Copenhagen',
    address_line1: '123 Sesame St',
    address_postal_code: '1000',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  EE: {
    address_city: 'Tallinn',
    address_line1: '123 Sesame St',
    address_postal_code: '10128',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  ES: {
    address_city: 'Madrid',
    address_line1: '123 Park Lane',
    address_postal_code: '03179',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  FI: {
    address_city: 'Helsinki',
    address_line1: '123 Sesame St',
    address_postal_code: '00990',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  FR: {
    address_city: 'Paris',
    address_line1: '123 Sesame St',
    address_postal_code: '75001',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  GB: {
    address_city: 'London',
    address_line1: '123 Sesame St',
    address_postal_code: 'EC1A 1AA',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  GR: {
    address_city: 'Athens',
    address_line1: '123 Park Lane',
    address_postal_code: '104',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  HK: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true
  },
  IE: {
    address_city: 'Dublin',
    address_line1: '123 Sesame St',
    address_state: 'D',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  IT: {
    address_city: 'Rome',
    address_line1: '123 Sesame St',
    address_postal_code: '00010',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  JP: {
    address_kana_city: 'ｼﾌﾞﾔ',
    address_kana_line1: '27-15',
    address_kana_postal_code: '1500001',
    address_kana_state: 'ﾄｳｷﾖｳﾄ',
    address_kana_town: 'ｼﾞﾝｸﾞｳﾏｴ 3-',
    address_kanji_city: '渋谷区',
    address_kanji_line1: '２７－１５',
    address_kanji_postal_code: '1500001',
    address_kanji_state: '東京都',
    address_kanji_town: '神宮前 ３丁目',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name_kana: 'ﾄｳｷﾖｳﾄ',
    first_name_kanji: '東京都',
    gender: 'female',
    last_name_kana: 'ﾄｳｷﾖｳﾄ',
    last_name_kanji: '東京都'
  },
  LT: {
    address_city: 'Vilnius',
    address_line1: '123 Sesame St',
    address_postal_code: 'LT-00000',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  LU: {
    address_city: 'Luxemburg',
    address_line1: '123 Sesame St',
    address_postal_code: '1623',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  LV: {
    address_city: 'Riga',
    address_line1: '123 Sesame St',
    address_postal_code: 'LV–1073',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  MY: {
    address_city: 'Kuala Lumpur',
    address_line1: '123 Sesame St',
    address_postal_code: '50450',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    id_number: '000000000',
    first_name: true,
    last_name: true,
    business_profile_url: true
  },
  NL: {
    address_city: 'Amsterdam',
    address_line1: '123 Sesame St',
    address_postal_code: '1071 JA',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  NO: {
    address_city: 'Oslo',
    address_line1: '123 Sesame St',
    address_postal_code: '0001',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  NZ: {
    address_city: 'Auckland',
    address_line1: '844 Fleet Street',
    address_postal_code: '6011',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  PL: {
    address_city: 'Krakow',
    address_line1: '123 Park Lane',
    address_postal_code: '32-400',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  PT: {
    address_city: 'Lisbon',
    address_line1: '123 Sesame St',
    address_postal_code: '4520',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  SE: {
    address_city: 'Stockholm',
    address_line1: '123 Sesame St',
    address_postal_code: '00150',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  SG: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true
  },
  SI: {
    address_city: 'Ljubljana',
    address_line1: '123 Sesame St',
    address_postal_code: '1210',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  SK: {
    address_city: 'Slovakia',
    address_line1: '123 Sesame St',
    address_postal_code: '00102',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '4567890123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  US: {
    address_city: 'New York',
    address_line1: '285 Fulton St',
    address_postal_code: '10007',
    address_state: 'NY',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '+14567890123',
    ssn_last_4: '0000',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  }
}

const beneficialOwnerData = module.exports.beneficialOwnerData = {
  AT: {
    address_city: 'Vienna',
    address_line1: '123 Park Lane',
    address_postal_code: '1020',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  AU: {
    address_city: 'Brisbane',
    address_line1: '123 Park Lane',
    address_postal_code: '4000',
    address_state: 'QLD',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  BE: {
    address_city: 'Brussels',
    address_line1: 'First Street',
    address_postal_code: '1020',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  CA: false,
  CH: {
    address_city: 'Bern',
    address_line1: '123 Sesame St',
    address_postal_code: '1020',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  DE: {
    address_city: 'Berlin',
    address_line1: 'First Street',
    address_postal_code: '01067',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  DK: {
    address_city: 'Copenhagen',
    address_line1: '123 Park Lane',
    address_postal_code: '1000',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  EE: {
    address_city: 'Talin',
    address_line1: '123 Park Lane',
    address_postal_code: '10128',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  ES: {
    address_city: 'Madrid',
    address_line1: '123 Park Lane',
    address_postal_code: '03179',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  FI: {
    address_city: 'Helsinki',
    address_line1: '123 Park Lane',
    address_postal_code: '00990',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  FR: {
    address_city: 'Paris',
    address_line1: '123 Sesame St',
    address_postal_code: '75001',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  GB: {
    address_city: 'London',
    address_line1: '123 Sesame St',
    address_postal_code: 'EC1A 1AA',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  GR: {
    address_city: 'Athens',
    address_line1: '123 Park Lane',
    address_postal_code: '104',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  HK: false,
  IE: {
    address_city: 'Dublin',
    address_line1: '123 Sesame St',
    address_state: 'D',
    address_postal_code: 'Dublin 1',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  IT: {
    address_city: 'Rome',
    address_line1: '123 Sesame St',
    address_postal_code: '00010',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  JP: false,
  LT: {
    address_city: 'Vilnius',
    address_line1: '123 Sesame St',
    address_postal_code: 'LT-00000',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  LU: {
    address_city: 'Luxemburg',
    address_line1: '123 Sesame St',
    address_postal_code: '1623',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  LV: {
    address_city: 'Riga',
    address_line1: '123 Sesame St',
    address_postal_code: 'LV–1073',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  MY: {
    address_city: 'Kuala Lumpur',
    address_line1: '123 Sesame St',
    address_postal_code: '50450',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    id_number: '000000000',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  NL: {
    address_city: 'Amsterdam',
    address_line1: '123 Sesame St',
    address_postal_code: '1071 JA',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  NO: {
    address_city: 'Oslo',
    address_line1: '123 Sesame St',
    address_postal_code: '0001',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  NZ: {
    address_city: 'Auckland',
    address_line1: '844 Fleet Street',
    address_postal_code: '6011',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  PL: {
    address_city: 'Krakow',
    address_line1: '123 Park Lane',
    address_postal_code: '32-400',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  PT: {
    address_city: 'Lisbon',
    address_line1: '123 Park Lane',
    address_postal_code: '4520',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  SE: {
    address_city: 'Stockholm',
    address_line1: '123 Sesame St',
    address_postal_code: '00150',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  SG: {
    address_city: 'Singapore',
    address_line1: '123 Sesame St',
    address_postal_code: '339696',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  SI: {
    address_city: 'Ljubljana',
    address_line1: '123 Sesame St',
    address_postal_code: '1210',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  SK: {
    address_city: 'Slovakia',
    address_line1: '123 Sesame St',
    address_postal_code: '00102',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  },
  US: {
    address_city: 'New York',
    address_line1: '285 Fulton St',
    address_postal_code: '10007',
    address_state: 'NY',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_owner: true
  }
}

const companyDirectorData = module.exports.companyDirectorData = {
  AT: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  AU: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  BE: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  CA: false,
  CH: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  DE: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  DK: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  EE: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  ES: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  FI: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  FR: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  GB: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  GR: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  HK: false,
  IE: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  IT: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  JP: false,
  LT: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  LU: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  LV: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  MY: false,
  NL: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  NO: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  NZ: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  PL: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  PT: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  SE: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  SI: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  SG: false,
  SK: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    first_name: true,
    last_name: true,
    email: true,
    relationship_director: true,
    relationship_title: 'Director of Stuff'
  },
  US: false
}
