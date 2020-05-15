/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../index.js')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@userdashboard/dashboard/test-helper.js')

describe('/account/connect/edit-stripe-account', function () {
  this.retries(10)
  this.timeout(60 * 60 * 1000)
  const hasIndividualElementResults = {}
  const hasCompanyElementResults = {}
  const rejectIndividualMissingResults = {}
  const rejectIndividualMissingResultsStripeV3 = {}
  const rejectCompanyMissingResults = {}
  const rejectCompanyMissingResultsStripeV3 = {}
  const testedIndividualRequiredFields = []  
  const testedCompanyRequiredFields = [
    'relationship_title',
    'relationship_director',
    'relationship_executive',
    'relationship_representative',
    'relationship_owner'
  ]
  // const uploadFields = [
  //   'verification_document_front',
  //   'verification_document_back',
  //   'verification_additional_document_front',
  //   'verification_additional_document_back'
  // ]
  before(async () => {
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const individuals = {}
    const companies = {}
    for (const country of connect.countrySpecs) {
      const individualPayload = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
      if (individualPayload === false) {
        continue
      }
      for (const field in individualPayload) {
        if (testedIndividualRequiredFields.indexOf(field) > -1) {
          continue
        }
        let individual = individuals[country.id]
        if (!individual) {
          individual = await TestHelper.createUser()
          await TestHelper.createStripeAccount(individual, {
            country: country.id,
            type: 'individual'
          })
          individuals[country.id] = individual
        }
        testedIndividualRequiredFields.push(field)
        const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${individual.stripeAccount.id}`)
        req.account = individual.account
        req.session = individual.session
        hasIndividualElementResults[field] = await req.get()
        // submit without stripe.js
        const req3 = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${individual.stripeAccount.id}`)
        req3.account = individual.account
        req3.session = individual.session
        req3.body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
        delete (req3.body[field])
        rejectIndividualMissingResults[field] = await req3.post()
        // submit with stripe.js version 3
        req3.body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
        req3.waitBefore = async (page) => {
          while (true) {
            const loaded = await page.evaluate(() => {
              return window.loaded
            })
            if (loaded) {
              break
            }
            await page.waitFor(100)
          }
        }
        req3.waitAfter = async (page) => {
          while (true) {
            const message = await page.evaluate(() => {
              var container = document.getElementById('message-container')
              return container && container.children.length
            })
            if (message > 0) {
              return
            }
            await page.waitFor(100)
          }
        }
        req3.uploads = {
          verification_document_front: TestHelper['success_id_scan_back.png'],
          verification_document_back: TestHelper['success_id_scan_back.png']
        }
        delete (req3.body[field])
        global.stripeJS = 3
        rejectIndividualMissingResultsStripeV3[field] = await req3.post()
        global.stripeJS = false
      }
      const companyPayload = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
      if (companyPayload === false) {
        continue
      }
      for (const field in companyPayload) {
        if (testedCompanyRequiredFields.indexOf(field) > -1) {
          continue
        }
        testedCompanyRequiredFields.push(field)
        let company = companies[country.id]
        if (!company) {
          company = await TestHelper.createUser()
          await TestHelper.createStripeAccount(company, {
            country: country.id,
            type: 'company'
          })
          companies[country.id] = company
        }
        const req2 = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${company.stripeAccount.id}`)
        req2.account = company.account
        req2.session = company.session
        hasCompanyElementResults[field] = await req2.get()
        const req4 = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${company.stripeAccount.id}`)
        req4.account = company.account
        req4.session = company.session
        req4.uploads = {
          verification_document_front: TestHelper['success_id_scan_back.png'],
          verification_document_back: TestHelper['success_id_scan_back.png']
        }
        req4.body = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
        delete (req4.body[field])
        rejectCompanyMissingResults[field] = await req4.post()
        req4.waitBefore = async (page) => {
          while (true) {
            const loaded = await page.evaluate(() => {
              return window.loaded
            })
            if (loaded) {
              break
            }
            await page.waitFor(100)
          }
        }
        req4.waitAfter = async (page) => {
          while (true) {
            try {
              const message = await page.evaluate(() => {
                var container = document.getElementById('message-container')
                return container ? container.children.length : 0
              })
              if (message > 0) {
                return
              }
            } catch (error) {
            }
            await page.waitFor(100)
          }
        }
        global.stripeJS = 3
        rejectCompanyMissingResultsStripeV3[field] = await req4.post()
        global.stripeJS = false
      }
    }
    // TODO: testing upload fields is not possible at the moment because
    // they're erroneously classified as 'pending verification' on Stripe
    // which means they're submitted already so they do not become required
    // upload fields
    // for (const field of uploadFields) {
    //   const user = await TestHelper.createUser()
    //   await TestHelper.createStripeAccount(user, {
    //     country: 'AT',
    //     type: 'individual'
    //   })
    //   await TestHelper.updateStripeAccount(user, TestStripeAccounts.createPostData(TestStripeAccounts.individualData.AT))
    //   const property = field.replace('verification_', 'verification.').replace('_front', '').replace('_back', '')
    //   if (field.indexOf('additional') !== -1) {
    //     await TestHelper.updateStripeAccount(user, null, {
    //       verification_document_front: TestHelper['success_id_scan_back.png'],
    //       verification_document_back: TestHelper['success_id_scan_back.png']
    //     })
    //   }
    //   await TestHelper.waitForAccountRequirement(user, property)
    //   const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
    //   req.account = user.account
    //   req.session = user.session
    //   hasIndividualElementResults[field] = await req.get()
    //   // submit without stripe.js
    //   req.uploads = {
    //     verification_additional_document_front: TestHelper['success_id_scan_back.png'],
    //     verification_additional_document_back: TestHelper['success_id_scan_back.png'],
    //     verification_document_front: TestHelper['success_id_scan_back.png'],
    //     verification_document_back: TestHelper['success_id_scan_back.png']
    //   }
    //   delete (req.uploads[field])
    //   rejectIndividualMissingResults[field] = await req.post()
    //   // with stripe.js v3
    //   const req2 = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
    //   req2.waitBefore = async (page) => {
    //     while (true) {
    //       const loaded = await page.evaluate(() => {
    //         return window.loaded
    //       })
    //       if (loaded) {
    //         break
    //       }
    //       await page.waitFor(100)
    //     }
    //   }
    //   req2.waitAfter = async (page) => {
    //     while (true) {
    //       const message = await page.evaluate(() => {
    //         var container = document.getElementById('message-container')
    //         return container.children.length
    //       })
    //       if (message > 0) {
    //         return
    //       }
    //       await page.waitFor(100)
    //     }
    //   }
    //   req2.account = user.account
    //   req2.session = user.session
    //   if (field.indexOf('additional') > -1) {
    //     req2.uploads = {
    //       verification_additional_document_front: TestHelper['success_id_scan_back.png'],
    //       verification_additional_document_back: TestHelper['success_id_scan_back.png']
    //     }
    //   } else {
    //     req2.uploads = {
    //       verification_document_front: TestHelper['success_id_scan_back.png'],
    //       verification_document_back: TestHelper['success_id_scan_back.png']
    //     }
    //   }
    //   delete (req2.uploads[field])
    //   global.stripeJS = 3
    //   rejectIndividualMissingResultsStripeV3[field] = await req2.post()
    //   global.stripeJS = false
    // }
  })
  describe('exceptions', () => {
    it('should reject invalid Stripe account', async () => {
      const user = await TestHelper.createUser()
      const req = TestHelper.createRequest('/account/connect/edit-stripe-account?stripeid=invalid')
      req.account = user.account
      req.session = user.session
      let errorMessage
      try {
        await req.route.api.before(req)
      } catch (error) {
        errorMessage = error.message
      }
      assert.strictEqual(errorMessage, 'invalid-stripeid')
    })
  })

  describe('view', async () => {
    const testedCompanyRequiredFields = []
    for (const country of connect.countrySpecs) {
      const companyPayload = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
      for (const field in companyPayload) {
        if (testedCompanyRequiredFields.indexOf(field) > -1) {
          continue
        }
        testedCompanyRequiredFields.push(field)
        it(`should have element for ${field} (company)`, async () => {
          const result = hasCompanyElementResults[field]
          const doc = TestHelper.extractDoc(result.html)
          const elementContainer = doc.getElementById(`${field}-container`)
          assert.strictEqual(elementContainer.tag, 'div')
        })
      }
    }
    const testedIndividualRequiredFields = []
    for (const country of connect.countrySpecs) {
      const individualPayload = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
      for (const field in individualPayload) {
        if (testedIndividualRequiredFields.indexOf(field) > -1) {
          continue
        }
        testedIndividualRequiredFields.push(field)
        it(`should have element for ${field} (individual)`, async () => {
          const result = hasIndividualElementResults[field]
          const doc = TestHelper.extractDoc(result.html)
          if (field.startsWith('dob_')) {
            const elementContainer = doc.getElementById('dob-container')
            assert.strictEqual(elementContainer.tag, 'div')
          } else {
            const elementContainer = doc.getElementById(`${field}-container`)
            assert.strictEqual(elementContainer.tag, 'div')
          }
        })
      }
    }
    // const individualFields = [
    //   'verification_document',
    //   'verification_additional_document'
    // ]
    // for (const field of individualFields) {
    //   it(`should have upload element for ${field} (individual)`, async () => {
    //     const result = hasIndividualElementResults[field]
    //     const doc = TestHelper.extractDoc(result.html)
    //     const container = field.indexOf('additiional') > -1 ? 'individual-additional-document-container' : 'individual-document-container'
    //     const elementContainer = doc.getElementById(container)
    //     assert.strictEqual(elementContainer.tag, 'div')
    //   })
    // }
    // TODO: company verification document can't be tested
    // because the Stripe test API erroneously marks it as
    // under review instead of required, and this form only
    // supports required fields
    // const companyFields = [
    //   'verification_document'
    // ]
    // for (const field of companyFields) {
    //   it(`should have upload element for ${field} (company)`, async () => {
    //     const result = hasCompanyElementResults[field]
    //     const doc = TestHelper.extractDoc(result.html)
    //     const elementContainer = doc.getElementById(`${field}-container`)
    //     assert.strictEqual(elementContainer.tag, 'div')
    //   })
    // }
  })

  describe('submit', () => {
    it('should update registration no stripe.js (individual)', async () => {
      const country = connect.countrySpecs[Math.floor(Math.random() * connect.countrySpecs.length)]
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: country.id,
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
      req.uploads = {
        verification_document_front: TestHelper['success_id_scan_back.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_back.png'],
        verification_additional_document_back: TestHelper['success_id_scan_back.png']
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should update registration stripe.js v3 (individual) (screenshots)', async () => {
      global.stripeJS = 3
      const country = connect.countrySpecs[Math.floor(Math.random() * connect.countrySpecs.length)]
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: country.id,
        type: 'individual'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
      req.uploads = {
        verification_document_front: TestHelper['success_id_scan_back.png'],
        verification_document_back: TestHelper['success_id_scan_back.png'],
        verification_additional_document_front: TestHelper['success_id_scan_back.png'],
        verification_additional_document_back: TestHelper['success_id_scan_back.png']
      }
      req.filename = __filename
      req.screenshots = [
        { hover: '#account-menu-container' },
        { click: '/account/connect' },
        { click: '/account/connect/stripe-accounts' },
        { click: `/account/connect/stripe-account?stripeid=${user.stripeAccount.id}` },
        { click: `/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}` },
        {
          fill: '#submit-form',
          waitAfter: async (page) => {
            while (true) {
              try {
                const frame = await page.frames().find(f => f.name() === 'application-iframe')
                if (frame) {
                  const loaded = await frame.evaluate(() => {
                    var accountTable = document.getElementById('stripe-accounts-table')
                    return accountTable && accountTable.children.length
                  })
                  if (loaded) {
                    break
                  }
                }
              } catch (error) {
              }
              await page.waitFor(100)
            }
          }
        }
      ]
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const accountTable = doc.getElementById(user.stripeAccount.id)
      assert.strictEqual(accountTable.tag, 'tbody')
    })

    it('should update registration no stripe.js (company)', async () => {
      const country = connect.countrySpecs[Math.floor(Math.random() * connect.countrySpecs.length)]
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: country.id,
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.body = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
      req.uploads = {
        verification_document_front: TestHelper['success_id_scan_back.png'],
        verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })

    it('should update registration stripe.js v3 (company)', async () => {
      global.stripeJS = 3
      const country = connect.countrySpecs[Math.floor(Math.random() * connect.countrySpecs.length)]
      const user = await TestHelper.createUser()
      await TestHelper.createStripeAccount(user, {
        country: country.id,
        type: 'company'
      })
      const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
      req.account = user.account
      req.session = user.session
      req.waitAfter = async (page) => {
        while (true) {
          try {
            const loaded = await page.evaluate(() => {
              return document.getElementById('message-container').children.length
            })
            if (loaded) {
              break
            }
          } catch (error) {
          }
          await page.waitFor(100)
        }
      }
      req.body = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
      req.uploads = {
        verification_document_front: TestHelper['success_id_scan_back.png'],
        verification_document_back: TestHelper['success_id_scan_back.png']
      }
      const result = await req.post()
      const doc = TestHelper.extractDoc(result.html)
      const messageContainer = doc.getElementById('message-container')
      const message = messageContainer.child[0]
      assert.strictEqual(message.attr.template, 'success')
    })
  })

  describe('errors', () => {
    let testedMissingFields = []
    for (const country of connect.countrySpecs) {
      const companyPayload = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
      for (const field in companyPayload) {
        if (testedMissingFields.indexOf(field) > -1) {
          continue
        }
        testedMissingFields.push(field)
        it(`should reject missing ${field} no stripe.js (company)`, async () => {
          const result = rejectCompanyMissingResults[field]
          const doc = TestHelper.extractDoc(result.html)
          const messageContainer = doc.getElementById('message-container')
          const message = messageContainer.child[0]
          assert.strictEqual(message.attr.template, `invalid-${field}`)
        })

        it(`should reject missing ${field} stripe.js v3 (company)`, async () => {
          global.stripeJS = 3
          const result = rejectCompanyMissingResultsStripeV3[field]
          const doc = TestHelper.extractDoc(result.html)
          const messageContainer = doc.getElementById('message-container')
          const message = messageContainer.child[0]
          assert.strictEqual(message.attr.template, `invalid-${field}`)
        })
      }
    }
    testedMissingFields = []
    for (const country of connect.countrySpecs) {
      const individualPayload = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
      for (const field in individualPayload) {
        if (testedMissingFields.indexOf(field) > -1) {
          continue
        }
        testedMissingFields.push(field)
        it(`should reject missing ${field} no stripe.js (individual)`, async () => {
          const result = rejectIndividualMissingResults[field]
          const doc = TestHelper.extractDoc(result.html)
          const messageContainer = doc.getElementById('message-container')
          const message = messageContainer.child[0]
          assert.strictEqual(message.attr.template, `invalid-${field}`)
        })

        it(`should reject missing ${field} stripe.js v3 (individual)`, async () => {
          global.stripeJS = 3
          const result = rejectIndividualMissingResultsStripeV3[field]
          const doc = TestHelper.extractDoc(result.html)
          const messageContainer = doc.getElementById('message-container')
          const message = messageContainer.child[0]
          assert.strictEqual(message.attr.template, `invalid-${field}`)
        })
      }
    }

    // TODO: company verification document can't be tested
    // because the Stripe test API erroneously marks it as
    // under review instead of required prior to submission
    // and this form only supports fields specified in the
    // account requirements
    // const individualFields = [
    //   'verification_document_front',
    //   'verification_document_back',
    //   'verification_additional_document_front',
    //   'verification_additional_document_back'
    // ]
    // for (const field of individualFields) {
    //   it(`should reject missing upload ${field} no stripe.js (individual)`, async () => {
    //     const result = rejectIndividualMissingResults[field]
    //     const doc = TestHelper.extractDoc(result.html)
    //     const messageContainer = doc.getElementById('message-container')
    //     const message = messageContainer.child[0]
    //     assert.strictEqual(message.attr.template, `invalid-${field}`)
    //   })

    //   it(`should reject missing upload ${field} stripe.js v3 (individual)`, async () => {
    //     const result = rejectIndividualMissingResultsStripeV3[field]
    //     const doc = TestHelper.extractDoc(result.html)
    //     const messageContainer = doc.getElementById('message-container')
    //     const message = messageContainer.child[0]
    //     assert.strictEqual(message.attr.template, `invalid-${field}`)
    //   })
    // }

    // TODO: Stripe's test API erroneously marks the company
    // document as verifying before it is even submitted so
    // the exceptions for missing uploads cannot be tested as
    // the documents must be required to trigger exceptions
    // const companyFields = [
    //   'verification_document_front',
    //   'verification_document_back'
    // ]
    // for (const field of companyFields) {
    //   it(`should reject missing upload ${field} no stripe.js (company)`, async () => {
    //     const user = await TestHelper.createUser()
    //     await TestHelper.createStripeAccount(user, {
    //       country: 'DE',
    //       type: 'company'
    //     })
    //     await TestHelper.updateStripeAccount(user, TestStripeAccounts.createPostData(TestStripeAccounts.companyData.DE))
    //     await TestHelper.waitForAccountRequirement(user, 'company.verification.document')
    //     const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
    //     req.account = user.account
    //     req.session = user.session
    //     req.uploads = {
    //       verification_document_front: TestHelper['success_id_scan_back.png'],
    //       verification_document_back: TestHelper['success_id_scan_back.png']
    //     }
    //     delete (req.uploads[field])
    //     const result = await req.post()
    //     const doc = TestHelper.extractDoc(result.html)
    //     const messageContainer = doc.getElementById('message-container')
    //     const message = messageContainer.child[0]
    //     assert.strictEqual(message.attr.template, `invalid-${field}`)
    //   })

    //   it(`should reject missing upload ${field} stripe.js v3 (company)`, async () => {
    //     const user = await TestHelper.createUser()
    //     await TestHelper.createStripeAccount(user, {
    //       country: 'DE',
    //       type: 'company'
    //     })
    //     await TestHelper.updateStripeAccount(user, TestStripeAccounts.createPostData(TestStripeAccounts.companyData.DE))
    //     await TestHelper.waitForAccountRequirement(user, 'company.verification.document')
    //     const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
    //     req.account = user.account
    //     req.session = user.session
    //     req.uploads = {
    //       verification_document_front: TestHelper['success_id_scan_back.png'],
    //       verification_document_back: TestHelper['success_id_scan_back.png']
    //     }
    //     delete (req.uploads[field])
    //     const result = await req.post()
    //     const doc = TestHelper.extractDoc(result.html)
    //     const messageContainer = doc.getElementById('message-container')
    //     const message = messageContainer.child[0]
    //     assert.strictEqual(message.attr.template, `invalid-${field}`)
    //   })
    // }
  })
})