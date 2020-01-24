const TestHelper = require('./test-helper.js')

module.exports = {
  createSubmittedIndividual: async (country) => {
    country = country || 'US'
    const user = await module.exports.createIndividualReadyForSubmission(country)
    await TestHelper.submitStripeAccount(user)
    await TestHelper.waitForPayoutsEnabled(user)
    return user
  },
  createSubmittedCompany: async (country) => {
    country = country || 'US'
    const user = await module.exports.createCompanyReadyForSubmission(country)
    await TestHelper.submitStripeAccount(user)
    // await TestHelper.waitForAccountRequirement(user, 'company.verification.document')
    // await TestHelper.updateStripeRegistration(user, {}, {
    //   verification_document_back: TestHelper['success_id_scan_back.png'],
    //   verification_document_front: TestHelper['success_id_scan_front.png']
    // })
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
    const identity = TestHelper.nextIdentity()
    const individual = {
      first_name: identity.firstName,
      last_name: identity.lastName,
      email: identity.email
    }
    for (const field in individualData[country]) {
      individual[field] = individualData[country][field]
    }
    console.log('waiting for document account requirement', JSON.stringify(user.stripeAccount, null, '  '))
    await TestHelper.waitForAccountRequirement(user, 'individual.verification.document')
    await TestHelper.createStripeRegistration(user, individual, {
      verification_document_back: TestHelper['success_id_scan_back.png'],
      verification_document_front: TestHelper['success_id_scan_front.png']
    })
    const payment = {
      country,
      account_holder_name: identity.firstName + ' ' + identity.lastName,
      account_holder_type: 'individual'
    }
    if (paymentData[country].length) {
      for (const field in paymentData[country][0]) {
        payment[field] = paymentData[country][0][field]
      }
    } else {
      for (const field in paymentData[country]) {
        payment[field] = paymentData[country][field]
      }
    }
    await TestHelper.createExternalAccount(user, payment)
    if (country !== 'CA' && country !== 'HK' && country !== 'JP' && country !== 'MY' && country !== 'SG' && country !== 'US') {
      console.log('waiting for additional_document account requirement', JSON.stringify(user.stripeAccount, null, '  '))
      await TestHelper.waitForAccountRequirement(user, 'individual.verification.additional_document')
      await TestHelper.updateStripeRegistration(user, {}, {
        verification_additional_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_front.png']
      })
    }
    await TestHelper.waitForWebhook('account.updated', stripeEvent => {
      if (stripeEvent.data.object &&
        stripeEvent.data.object.id === user.stripeAccount.id &&
        stripeEvent.data.object.individual &&
        stripeEvent.data.object.individual.verification &&
        stripeEvent.data.object.individual.verification.status === 'verified') {
        user.stripeAccount = stripeEvent.data.object
        return true
      }
    })
    return user
  },
  createCompanyReadyForSubmission: async (country) => {
    country = country || 'US'
    const user = await TestHelper.createUser()
    await TestHelper.createStripeAccount(user, {
      country: country,
      type: 'company'
    })
    const company = {}
    for (const field in companyData[country]) {
      company[field] = companyData[country][field]
    }
    await TestHelper.createStripeRegistration(user, company)
    const identity = TestHelper.nextIdentity()
    const representative = {
      first_name: identity.firstName,
      last_name: identity.lastName,
      email: identity.email,
      relationship_title: 'Owner',
      relationship_executive: true,
      relationship_percent_owned: 0
    }
    for (const field in representativeData[country]) {
      representative[field] = representativeData[country][field]
    }
    await TestHelper.createCompanyRepresentative(user, representative, {
      verification_document_back: TestHelper['success_id_scan_back.png'],
      verification_document_front: TestHelper['success_id_scan_front.png']
    })
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
    }
    if (companyDirectorData[country] !== false) {
      await TestHelper.submitCompanyDirectors(user)
    }
    const payment = {
      country,
      account_holder_name: identity.firstName + ' ' + identity.lastName,
      account_holder_type: 'company'
    }
    if (paymentData[country].length) {
      for (const field in paymentData[country][0]) {
        payment[field] = paymentData[country][0][field]
      }
    } else {
      for (const field in paymentData[country]) {
        payment[field] = paymentData[country][field]
      }
    }
    await TestHelper.createExternalAccount(user, payment)
    // TODO: fix this when Stripe fixes company.verification.document
    // the 'company.verification.document' erroneously shows up in the
    // 'requirements.pending_validation' signifying it is under review, then
    // it is removed from that, but really it needs to show up in currently_due
    // and then submit the documents and then it should be pending_validation
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
      const requirements = JSON.parse(user.stripeAccount.metadata.beneficialOwnerTemplate)
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
        const body = JSON.parse(JSON.stringify(beneficialOwnerData[country]))
        body.email = person.email
        body.first_name = person.firstName
        body.last_name = person.lastName
        await TestHelper.createBeneficialOwner(user, body, documents)
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
      const requirements = JSON.parse(user.stripeAccount.metadata.companyDirectorTemplate)
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
        const body = JSON.parse(JSON.stringify(beneficialOwnerData[country]))
        body.email = person.email
        body.first_name = person.firstName
        body.last_name = person.lastName
        await TestHelper.createCompanyDirector(user, body, documents)
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
    const body = JSON.parse(JSON.stringify(representativeData[country]))
    body.email = person.email
    body.first_name = person.firstName
    body.last_name = person.lastName
    const requireDocument = user.representative.requirements.currently_due.indexOf('verification.document') > -1 ||
                            user.representative.requirements.eventually_due.indexOf('verification.document') > -1
    let documents
    if (requireDocument) {
      documents = {
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_document_front: TestHelper['success_id_scan_front.png']
      }
    }
    await TestHelper.createCompanyRepresentative(user, body, documents)
    return user
  }
}

const companyData = module.exports.companyData = {
  AT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Vienna',
    address_line1: '123 Park Lane',
    address_postal_code: '1020',
    address_state: '1',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  AU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Brisbane',
    address_line1: '123 Park Lane',
    address_postal_code: '4000',
    address_state: 'QLD',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  BE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Brussels',
    address_line1: '123 Park Lane',
    address_postal_code: '1020',
    address_state: 'BRU',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  CA: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Vancouver',
    address_line1: '123 Park Lane',
    address_postal_code: 'V5K 0A1',
    address_state: 'BC',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  CH: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Bern',
    address_line1: '123 Park Lane',
    address_postal_code: '1020',
    address_state: 'BE',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  DE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Berlin',
    address_line1: '123 Park Lane',
    address_postal_code: '01067',
    address_state: 'BE',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  DK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Copenhagen',
    address_line1: '123 Park Lane',
    address_postal_code: '1000',
    address_state: '147',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  EE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Talin',
    address_line1: '123 Park Lane',
    address_postal_code: '10128',
    address_state: '37',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  ES: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Madrid',
    address_line1: '123 Park Lane',
    address_postal_code: '03179',
    address_state: 'AN',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  FI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Helsinki',
    address_line1: '123 Park Lane',
    address_postal_code: '00990',
    address_state: 'AL',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  FR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Paris',
    address_line1: '123 Park Lane',
    address_postal_code: '75001',
    address_state: 'A',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  GB: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'London',
    address_line1: '123 Park Lane',
    address_postal_code: 'EC1A 1AA',
    address_state: 'LND',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  GR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Athens',
    address_line1: '123 Park Lane',
    address_postal_code: '104',
    address_state: 'I',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  HK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Hong Kong',
    address_line1: '123 Park Lane',
    address_postal_code: '00000',
    address_state: 'HK',
    name: 'Company',
    phone: '456-789-0234',
    tax_id: '00000000000'
  },
  IE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Dublin',
    address_line1: '123 Park Lane',
    address_postal_code: 'Dublin 1',
    address_state: 'D',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  IT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Rome',
    address_line1: '123 Park Lane',
    address_postal_code: '00010',
    address_state: '65',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  JP: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
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
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Vilnius',
    address_line1: '123 Sesame St',
    address_postal_code: 'LT-00000',
    address_state: 'AL',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  LU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Luxemburg',
    address_line1: '123 Park Lane',
    address_postal_code: '1623',
    address_state: 'L',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  LV: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Riga',
    address_line1: '123 Sesame St',
    address_postal_code: 'LV–1073',
    address_state: 'AI',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  MY: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Kuala Lumpur',
    address_line1: '123 Sesame St',
    address_postal_code: '50450',
    address_state: 'C',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  NL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Amsterdam',
    address_line1: '123 Park Lane',
    address_postal_code: '1071 JA',
    address_state: 'DR',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  NO: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Oslo',
    address_line1: '123 Park Lane',
    address_postal_code: '0001',
    address_state: '02',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  NZ: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Auckland',
    address_line1: '123 Park Lane',
    address_postal_code: '6011',
    address_state: 'N',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  PL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Krakow',
    address_line1: '123 Park Lane',
    address_postal_code: '32-400',
    address_state: 'KR',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  PT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Lisbon',
    address_line1: '123 Park Lane',
    address_postal_code: '4520',
    address_state: '01',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  SE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Stockholm',
    address_line1: '123 Park Lane',
    address_postal_code: '00150',
    address_state: 'K',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  SG: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Singapore',
    address_line1: '123 Park Lane',
    address_postal_code: '339696',
    address_state: 'SG',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  SI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Ljubljana',
    address_line1: '123 Sesame St',
    address_postal_code: '1210',
    address_state: '07',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  SK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Slovakia',
    address_line1: '123 Sesame St',
    address_postal_code: '00102',
    address_state: 'BC',
    name: 'Company',
    phone: '456-789-0123',
    tax_id: '00000000000'
  },
  US: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
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
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Vienna',
    address_line1: '123 Sesame St',
    address_postal_code: '1020',
    address_state: '1',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  AU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Brisbane',
    address_line1: '845 Oxford St',
    address_postal_code: '4000',
    address_state: 'QLD',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  BE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Brussels',
    address_line1: '123 Sesame St',
    address_postal_code: '1020',
    address_state: 'BRU',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  CA: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Vancouver',
    address_line1: '123 Sesame St',
    address_postal_code: 'V5K 0A1',
    address_state: 'BC',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    id_number: '000000000',
    phone: '456-789-0123'
  },
  CH: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Bern',
    address_line1: '123 Sesame St',
    address_postal_code: '1020',
    address_state: 'BE',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  DE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Berlin',
    address_line1: '123 Sesame St',
    address_postal_code: '01067',
    address_state: 'BE',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  DK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Copenhagen',
    address_line1: '123 Sesame St',
    address_postal_code: '1000',
    address_state: '147',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  EE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Tallinn',
    address_line1: '123 Sesame St',
    address_postal_code: '10128',
    address_state: '37',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  ES: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Madrid',
    address_line1: '123 Park Lane',
    address_postal_code: '03179',
    address_state: 'AN',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  FI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Helsinki',
    address_line1: '123 Sesame St',
    address_postal_code: '00990',
    address_state: 'AL',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  FR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Paris',
    address_line1: '123 Sesame St',
    address_postal_code: '75001',
    address_state: 'A',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  GB: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'London',
    address_line1: '123 Sesame St',
    address_postal_code: 'EC1A 1AA',
    address_state: 'LND',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  GR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Athens',
    address_line1: '123 Park Lane',
    address_postal_code: '104',
    address_state: 'I',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  HK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Hong Kong',
    address_line1: '123 Sesame St',
    address_postal_code: '999077',
    address_state: 'HK',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    id_number: '000000000',
    phone: '456-789-0123'
  },
  IE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Dublin',
    address_line1: '123 Sesame St',
    address_postal_code: 'Dublin 1',
    address_state: 'D',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  IT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Rome',
    address_line1: '123 Sesame St',
    address_postal_code: '00010',
    address_state: '65',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  JP: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
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
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Vilnius',
    address_line1: '123 Sesame St',
    address_postal_code: 'LT-00000',
    address_state: 'AL',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  LU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Luxemburg',
    address_line1: '123 Sesame St',
    address_postal_code: '1623',
    address_state: 'L',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  LV: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Riga',
    address_line1: '123 Sesame St',
    address_postal_code: 'LV–1073',
    address_state: 'AI',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  MY: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Kuala Lumpur',
    address_line1: '123 Sesame St',
    address_postal_code: '50450',
    address_state: 'C',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    id_number: '000000000',
    phone: '456-789-0123'
  },
  NL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Amsterdam',
    address_line1: '123 Sesame St',
    address_postal_code: '1071 JA',
    address_state: 'DR',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  NO: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Oslo',
    address_line1: '123 Sesame St',
    address_postal_code: '0001',
    address_state: '02',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  NZ: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Auckland',
    address_line1: '844 Fleet Street',
    address_postal_code: '6011',
    address_state: 'N',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  PL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Krakow',
    address_line1: '123 Park Lane',
    address_postal_code: '32-400',
    address_state: 'KR',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  PT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Lisbon',
    address_line1: '123 Sesame St',
    address_postal_code: '4520',
    address_state: '01',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  SE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Stockholm',
    address_line1: '123 Sesame St',
    address_postal_code: '00150',
    address_state: 'K',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  SG: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Singapore',
    address_line1: '123 Sesame St',
    address_postal_code: '339696',
    address_state: 'SG',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    id_number: '000000000',
    phone: '456-789-0123'
  },
  SI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Ljubljana',
    address_line1: '123 Sesame St',
    address_postal_code: '1210',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  SK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Slovakia',
    address_line1: '123 Sesame St',
    address_postal_code: '00102',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  US: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'New York',
    address_line1: '285 Fulton St',
    address_postal_code: '10007',
    address_state: 'NY',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
    ssn_last_4: '0000'
  }
}

const paymentData = module.exports.paymentData = {
  AT: {
    currency: 'eur',
    iban: 'AT89370400440532013000'
  },
  AU: {
    account_number: '000123456',
    bsb_number: '110000',
    currency: 'aud'
  },
  BE: {
    currency: 'eur',
    iban: 'BE89370400440532013000'
  },
  CA: {
    account_number: '000123456789',
    currency: 'cad',
    institution_number: '000',
    transit_number: '11000'
  },
  CH: {
    currency: 'eur',
    iban: 'CH89370400440532013000'
  },
  DE: {
    currency: 'eur',
    iban: 'DE89370400440532013000'
  },
  DK: {
    currency: 'eur',
    iban: 'DK89370400440532013000'
  },
  EE: {
    currency: 'eur',
    iban: 'EE89370400440532013000'
  },
  ES: {
    currency: 'eur',
    iban: 'ES89370400440532013000'
  },
  FI: {
    currency: 'eur',
    iban: 'FI89370400440532013000'
  },
  FR: {
    currency: 'eur',
    iban: 'FR89370400440532013000'
  },
  GB: [{
    account_number: '00012345',
    currency: 'gbp',
    sort_code: '108800'
  }, {
    currency: 'eur',
    iban: 'GB89370400440532013000'
  }],
  GR: {
    currency: 'eur',
    iban: 'GR89370400440532013000'
  },
  HK: {
    account_number: '000123456',
    branch_code: '000',
    clearing_code: '110',
    currency: 'hkd'
  },
  IE: {
    currency: 'eur',
    iban: 'IE89370400440532013000'
  },
  IT: {
    currency: 'eur',
    iban: 'IT89370400440532013000'
  },
  JP: {
    account_number: '0001234',
    bank_code: '1100',
    branch_code: '000',
    currency: 'jpy'
  },
  LT: {
    currency: 'eur',
    iban: 'LT89370400440532013000'
  },
  LU: {
    currency: 'eur',
    iban: 'LU89370400440532013000'
  },
  LV: {
    currency: 'eur',
    iban: 'LV89370400440532013000'
  },
  MY: {
    currency: 'myr',
    routing_number: 'TESTMYKL',
    account_number: '000123456000'
  },
  NL: {
    currency: 'eur',
    iban: 'NL89370400440532013000'
  },
  NO: {
    currency: 'eur',
    iban: 'NO89370400440532013000'
  },
  NZ: {
    account_number: '0000000010',
    currency: 'nzd',
    routing_number: '110000'
  },
  PL: {
    currency: 'eur',
    iban: 'PL89370400440532013000'
  },
  PT: {
    currency: 'eur',
    iban: 'PT89370400440532013000'
  },
  SE: {
    currency: 'eur',
    iban: 'SE89370400440532013000'
  },
  SG: {
    account_number: '000123456',
    bank_code: '1100',
    branch_code: '000',
    currency: 'sgd'
  },
  SI: {
    currency: 'eur',
    iban: 'SI89370400440532013000'
  },
  SK: {
    currency: 'eur',
    iban: 'SK89370400440532013000'
  },
  US: {
    account_number: '000123456789',
    currency: 'usd',
    routing_number: '110000000'
  }
}

const individualData = module.exports.individualData = {
  AT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Vienna',
    address_line1: '123 Sesame St',
    address_postal_code: '1020',
    address_state: '1',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  AU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Brisbane',
    address_line1: '845 Oxford St',
    address_postal_code: '4000',
    address_state: 'QLD',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  BE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Brussels',
    address_line1: '123 Sesame St',
    address_postal_code: '1020',
    address_state: 'BRU',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  CA: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Vancouver',
    address_line1: '123 Sesame St',
    address_postal_code: 'V5K 0A1',
    address_state: 'BC',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    id_number: '000000000',
    phone: '456-789-0123'
  },
  CH: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Bern',
    address_line1: '123 Sesame St',
    address_postal_code: '1020',
    address_state: 'BE',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  DE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Berlin',
    address_line1: '123 Sesame St',
    address_postal_code: '01067',
    address_state: 'BE',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  DK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Copenhagen',
    address_line1: '123 Sesame St',
    address_postal_code: '1000',
    address_state: '147',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  EE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Tallinn',
    address_line1: '123 Sesame St',
    address_postal_code: '10128',
    address_state: '37',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  ES: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Madrid',
    address_line1: '123 Park Lane',
    address_postal_code: '03179',
    address_state: 'AN',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  FI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Helsinki',
    address_line1: '123 Sesame St',
    address_postal_code: '00990',
    address_state: 'AL',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  FR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Paris',
    address_line1: '123 Sesame St',
    address_postal_code: '75001',
    address_state: 'A',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  GB: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'London',
    address_line1: '123 Sesame St',
    address_postal_code: 'EC1A 1AA',
    address_state: 'LND',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  GR: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Athens',
    address_line1: '123 Park Lane',
    address_postal_code: '104',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    address_state: 'I',
    phone: '456-789-0123'
  },
  HK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Hong Kong',
    address_line1: '123 Sesame St',
    address_postal_code: '999077',
    address_state: 'HK',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    id_number: '000000000',
    phone: '456-789-0123'
  },
  IE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Dublin',
    address_line1: '123 Sesame St',
    address_postal_code: 'Dublin 1',
    address_state: 'D',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  IT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Rome',
    address_line1: '123 Sesame St',
    address_postal_code: '00010',
    address_state: '65',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  JP: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
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
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Vilnius',
    address_line1: '123 Sesame St',
    address_postal_code: 'LT-00000',
    address_state: 'AL',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  LU: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Luxemburg',
    address_line1: '123 Sesame St',
    address_postal_code: '1623',
    address_state: 'L',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  LV: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Riga',
    address_line1: '123 Sesame St',
    address_postal_code: 'LV–1073',
    address_state: 'AI',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  MY: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Kuala Lumpur',
    address_line1: '123 Sesame St',
    address_postal_code: '50450',
    address_state: 'C',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
    id_number: '000000000'
  },
  NL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Amsterdam',
    address_line1: '123 Sesame St',
    address_postal_code: '1071 JA',
    address_state: 'DR',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  NO: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Oslo',
    address_line1: '123 Sesame St',
    address_postal_code: '0001',
    address_state: '02',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  NZ: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Auckland',
    address_line1: '844 Fleet Street',
    address_postal_code: '6011',
    address_state: 'N',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  PL: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Krakow',
    address_line1: '123 Park Lane',
    address_postal_code: '32-400',
    address_state: 'KR',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  PT: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Lisbon',
    address_line1: '123 Sesame St',
    address_postal_code: '4520',
    address_state: '01',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  SE: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Stockholm',
    address_line1: '123 Sesame St',
    address_postal_code: '00150',
    address_state: 'K',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  SG: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Singapore',
    address_line1: '123 Sesame St',
    address_postal_code: '339696',
    address_state: 'SG',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    id_number: '000000000',
    phone: '456-789-0123'
  },
  SI: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Ljubljana',
    address_line1: '123 Sesame St',
    address_postal_code: '1210',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  SK: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'Slovakia',
    address_line1: '123 Sesame St',
    address_postal_code: '00102',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123'
  },
  US: {
    business_profile_mcc: '8931',
    business_profile_url: 'https://a-website.com',
    address_city: 'New York',
    address_line1: '285 Fulton St',
    address_postal_code: '10007',
    address_state: 'NY',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950',
    phone: '456-789-0123',
    ssn_last_4: '0000'
  }
}

const beneficialOwnerData = module.exports.beneficialOwnerData = {
  AT: {
    address_city: 'Berlin',
    address_country: 'DE',
    address_line1: 'First Street',
    address_postal_code: '01067',
    address_state: 'BW',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  AU: {
    address_city: 'Berlin',
    address_country: 'DE',
    address_line1: 'First Street',
    address_postal_code: '01067',
    address_state: 'BW',
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
    address_city: 'Berlin',
    address_country: 'DE',
    address_line1: 'First Street',
    address_postal_code: '01067',
    address_state: 'BW',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  EE: {
    address_city: 'Berlin',
    address_country: 'DE',
    address_line1: 'First Street',
    address_postal_code: '01067',
    address_state: 'BW',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  ES: {
    address_city: 'Berlin',
    address_country: 'DE',
    address_line1: 'First Street',
    address_postal_code: '01067',
    address_state: 'BW',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  FI: {
    address_city: 'Berlin',
    address_country: 'DE',
    address_line1: 'First Street',
    address_postal_code: '01067',
    address_state: 'BW',
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
    dob_year: '1950'
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
    address_city: 'Berlin',
    address_country: 'DE',
    address_line1: 'First Street',
    address_postal_code: '01067',
    address_state: 'BW',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  AU: {
    address_city: 'Berlin',
    address_country: 'DE',
    address_line1: 'First Street',
    address_postal_code: '01067',
    address_state: 'BW',
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
    address_city: 'Berlin',
    address_country: 'DE',
    address_line1: 'First Street',
    address_postal_code: '01067',
    address_state: 'BW',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  EE: {
    address_city: 'Berlin',
    address_country: 'DE',
    address_line1: 'First Street',
    address_postal_code: '01067',
    address_state: 'BW',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  ES: {
    address_city: 'Berlin',
    address_country: 'DE',
    address_line1: 'First Street',
    address_postal_code: '01067',
    address_state: 'BW',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  FI: {
    address_city: 'Berlin',
    address_country: 'DE',
    address_line1: 'First Street',
    address_postal_code: '01067',
    address_state: 'BW',
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
  MY: false,
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
  SG: false,
  SK: {
    address_city: 'Slovakia',
    address_country: 'SK',
    address_line1: '123 Sesame St',
    address_postal_code: '00102',
    address_state: 'BC',
    dob_day: '1',
    dob_month: '1',
    dob_year: '1950'
  },
  US: false
}
