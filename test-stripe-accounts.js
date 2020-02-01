const connect = require('./index.js')
const dashboard = require('@userdashboard/dashboard')
const TestHelper = require('./test-helper.js')

function createPostData (data, identity) {
  identity = identity || TestHelper.nextIdentity()
  const body = JSON.parse(JSON.stringify(data))
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
    const representativePostData = createPostData(representativeData[country], user.profile)
    await TestHelper.createCompanyRepresentative(user, representativePostData)
    await TestHelper.waitForAccountRequirement(user, `${user.representative.id}.verification.document`)
    await TestHelper.waitForPersonRequirement(user, user.representative.id, 'verification.document')
    await TestHelper.updateCompanyRepresentative(user, {}, {
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
      await TestHelper.updateCompanyRepresentative(user, {}, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png']
      })
      await TestHelper.waitForVerificationFieldsToLeave(user, `${user.representative.id}.verification.additional_document`)
    }
    if (beneficialOwnerData[country] !== false) {
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.waitForVerificationFieldsToLeave(user, 'company.owner')
    }
    if (companyDirectorData[country] !== false) {
      await TestHelper.submitCompanyDirectors(user)
      await TestHelper.waitForVerificationFieldsToLeave(user, 'company.director')
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
      const requirementsRaw = await dashboard.Storage.read(`stripeid:requirements:owner:${user.stripeAccount.id}`)
      const requirements = JSON.parse(requirementsRaw)
      const requireDocument = requirements.currently_due.indexOf('verification.document') > -1 ||
                              requirements.eventually_due.indexOf('verification.document') > -1
      let documents
      if (requireDocument) {
        documents = {
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
        }
      }
      for (let i = 0, len = numOwners; i < len; i++) {
        const person = TestHelper.nextIdentity()
        await TestHelper.createBeneficialOwner(user, createPostData(beneficialOwnerData[country], person), documents)
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
      const requirementsRaw = await dashboard.Storage.read(`stripeid:requirements:director:${user.stripeAccount.id}`)
      const requirements = JSON.parse(requirementsRaw)
      const requireDocument = requirements.currently_due.indexOf('verification.document') > -1 ||
                              requirements.eventually_due.indexOf('verification.document') > -1
      let documents
      if (requireDocument) {
        documents = {
          verification_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png']
        }
      }
      for (let i = 0, len = numDirectors; i < len; i++) {
        const person = TestHelper.nextIdentity()
        await TestHelper.createCompanyDirector(user, createPostData(companyDirectorData[country], person), documents)
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
    await TestHelper.createCompanyRepresentative(user, createPostData(representativeData[country], person), documents)
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
      await TestHelper.waitForVerificationFieldsToLeave(user, 'company.owner')
    }
    if (companyDirectorData[country] !== false) {
      await TestHelper.submitCompanyDirectors(user)
      await TestHelper.waitForVerificationFieldsToLeave(user, 'company.director')
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
    await TestHelper.createCompanyRepresentative(user, representativePostData, representativeUploadData)
    if (beneficialOwnerData[country] !== false) {
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.waitForVerificationFieldsToLeave(user, 'company.owner')
    }
    if (companyDirectorData[country] !== false) {
      await TestHelper.submitCompanyDirectors(user)
      await TestHelper.waitForVerificationFieldsToLeave(user, 'company.director')
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
    await TestHelper.createCompanyRepresentative(user, representativePostData, representativeUploadData)
    if (companyDirectorData[country] !== false) {
      await TestHelper.submitCompanyDirectors(user)
      await TestHelper.waitForVerificationFieldsToLeave(user, 'company.director')
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
    await TestHelper.createCompanyRepresentative(user, representativePostData, representativeUploadData)
    if (beneficialOwnerData[country] !== false) {
      await TestHelper.submitBeneficialOwners(user)
      await TestHelper.waitForVerificationFieldsToLeave(user, 'company.owner')
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0234',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '011-271-6677',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
    first_name: true,
    last_name: true,
    email: true
  },
  HK: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    last_name_kanji: '東京都',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything'
  },
  LT: {
    address_city: 'Vilnius',
    address_line1: '123 Sesame St',
    address_postal_code: 'LT-00000',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
    first_name: true,
    last_name: true,
    email: true
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    phone: '456-789-0123',
    relationship_executive: 'true',
    relationship_title: 'SVP of Anything',
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
    address_state: '1',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    address_state: 'BRU',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
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
    id_number: '000000000',
    phone: '456-789-0123',
    first_name: true,
    last_name: true
  },
  CH: {
    address_city: 'Bern',
    address_line1: '123 Sesame St',
    address_postal_code: '1020',
    address_state: 'BE',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
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
    address_state: 'BE',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
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
    address_state: '147',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
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
    address_state: '37',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
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
    address_state: 'AN',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
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
    address_state: 'AL',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
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
    address_state: 'A',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
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
    address_state: 'LND',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
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
    address_state: 'I',
    phone: '456-789-0123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  HK: {
    address_city: 'Hong Kong',
    address_line1: '123 Sesame St',
    address_postal_code: '999077',
    address_state: 'HK',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    id_number: '000000000',
    phone: '456-789-0123',
    first_name: true,
    last_name: true
  },
  IE: {
    address_city: 'Dublin',
    address_line1: '123 Sesame St',
    address_postal_code: 'Dublin 1',
    address_state: 'D',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
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
    address_state: '65',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
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
    last_name_kanji: '東京都',
    phone: '+81112345678'
  },
  LT: {
    address_city: 'Vilnius',
    address_line1: '123 Sesame St',
    address_postal_code: 'LT-00000',
    address_state: 'AL',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
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
    address_state: 'L',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
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
    address_state: 'AI',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
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
    address_state: 'C',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
    id_number: '000000000',
    first_name: true,
    last_name: true
  },
  NL: {
    address_city: 'Amsterdam',
    address_line1: '123 Sesame St',
    address_postal_code: '1071 JA',
    address_state: 'DR',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
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
    address_state: '02',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
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
    address_state: 'N',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
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
    address_state: 'KR',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
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
    address_state: '01',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
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
    address_state: 'K',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
    first_name: true,
    last_name: true,
    email: true,
    business_profile_mcc: true,
    business_profile_url: true
  },
  SG: {
    address_city: 'Singapore',
    address_line1: '123 Sesame St',
    address_postal_code: '339696',
    address_state: 'SG',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    id_number: '000000000',
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    phone: '456-789-0123',
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
    address_state: '1',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  AU: {
    address_city: 'Brisbane',
    address_line1: '123 Park Lane',
    address_postal_code: '4000',
    address_state: 'QLD',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  BE: {
    address_city: 'Brussels',
    address_country: 'BE',
    address_line1: 'First Street',
    address_postal_code: '1020',
    address_state: 'BRU',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  CA: false,
  CH: {
    address_city: 'Bern',
    address_country: 'CH',
    address_line1: '123 Sesame St',
    address_postal_code: '1020',
    address_state: 'BE',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  DE: {
    address_city: 'Berlin',
    address_country: 'DE',
    address_line1: 'First Street',
    address_postal_code: '01067',
    address_state: 'BW',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  DK: {
    address_city: 'Copenhagen',
    address_country: 'DK',
    address_line1: '123 Park Lane',
    address_postal_code: '1000',
    address_state: '147',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  EE: {
    address_city: 'Talin',
    address_country: 'EE',
    address_line1: '123 Park Lane',
    address_postal_code: '10128',
    address_state: '37',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  ES: {
    address_city: 'Madrid',
    address_country: 'ES',
    address_line1: '123 Park Lane',
    address_postal_code: '03179',
    address_state: 'AN',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  FI: {
    address_city: 'Helsinki',
    address_country: 'FI',
    address_line1: '123 Park Lane',
    address_postal_code: '00990',
    address_state: 'AL',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  FR: {
    address_city: 'Paris',
    address_country: 'FR',
    address_line1: '123 Sesame St',
    address_postal_code: '75001',
    address_state: 'A',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  GB: {
    address_city: 'London',
    address_country: 'GB',
    address_line1: '123 Sesame St',
    address_postal_code: 'EC1A 1AA',
    address_state: 'LND',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  GR: {
    address_city: 'Athens',
    address_country: 'GR',
    address_line1: '123 Park Lane',
    address_postal_code: '104',
    address_state: 'I',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  HK: false,
  IE: {
    address_city: 'Dublin',
    address_country: 'IE',
    address_line1: '123 Sesame St',
    address_postal_code: 'Dublin 1',
    address_state: 'D',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  IT: {
    address_city: 'Rome',
    address_country: 'IT',
    address_line1: '123 Sesame St',
    address_postal_code: '00010',
    address_state: '65',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  JP: false,
  LT: {
    address_city: 'Vilnius',
    address_country: 'LT',
    address_line1: '123 Sesame St',
    address_postal_code: 'LT-00000',
    address_state: 'AL',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  LU: {
    address_city: 'Luxemburg',
    address_country: 'LU',
    address_line1: '123 Sesame St',
    address_postal_code: '1623',
    address_state: 'L',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  LV: {
    address_city: 'Riga',
    address_country: 'LV',
    address_line1: '123 Sesame St',
    address_postal_code: 'LV–1073',
    address_state: 'AI',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  MY: {
    address_city: 'Kuala Lumpur',
    address_country: 'MY',
    address_line1: '123 Sesame St',
    address_postal_code: '50450',
    address_state: 'C',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    id_number: '000000000'
  },
  NL: {
    address_city: 'Amsterdam',
    address_country: 'NL',
    address_line1: '123 Sesame St',
    address_postal_code: '1071 JA',
    address_state: 'DR',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  NO: {
    address_city: 'Oslo',
    address_country: 'NO',
    address_line1: '123 Sesame St',
    address_postal_code: '0001',
    address_state: '02',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  NZ: {
    address_city: 'Auckland',
    address_country: 'NZ',
    address_line1: '844 Fleet Street',
    address_postal_code: '6011',
    address_state: 'N',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  PL: {
    address_city: 'Krakow',
    address_country: 'PL',
    address_line1: '123 Park Lane',
    address_postal_code: '32-400',
    address_state: 'KR',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  PT: {
    address_city: 'Lisbon',
    address_country: 'PT',
    address_line1: '123 Park Lane',
    address_postal_code: '4520',
    address_state: '01',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  SE: {
    address_city: 'Stockholm',
    address_country: 'SE',
    address_line1: '123 Sesame St',
    address_postal_code: '00150',
    address_state: 'K',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  SG: {
    address_city: 'Singapore',
    address_country: 'SG',
    address_line1: '123 Sesame St',
    address_postal_code: '339696',
    address_state: 'SG',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  SI: {
    address_city: 'Ljubljana',
    address_country: 'SI',
    address_line1: '123 Sesame St',
    address_postal_code: '1210',
    address_state: '07',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  SK: {
    address_city: 'Slovakia',
    address_country: 'SK',
    address_line1: '123 Sesame St',
    address_postal_code: '00102',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  US: {
    address_city: 'New York',
    address_country: 'US',
    address_line1: '285 Fulton St',
    address_postal_code: '10007',
    address_state: 'NY',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '+14567890123',
    ssn_last_4: '0000'
  }
}

const companyDirectorData = module.exports.companyDirectorData = {
  AT: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  AU: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  BE: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  CA: false,
  CH: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  DE: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  DK: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  EE: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  ES: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  FI: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  FR: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  GB: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  GR: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  HK: false,
  IE: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  IT: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  JP: false,
  LT: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  LU: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  LV: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  MY: false,
  NL: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  NO: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  NZ: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  PL: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  PT: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  SE: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  SI: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  SG: false,
  SK: {
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  US: false
}
