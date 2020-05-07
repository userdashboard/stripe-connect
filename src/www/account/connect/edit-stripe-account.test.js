/* eslint-env mocha */
const assert = require('assert')
const connect = require('../../../../index.js')
const TestHelper = require('../../../../test-helper.js')
const TestStripeAccounts = require('../../../../test-stripe-accounts.js')

describe('/account/connect/edit-stripe-account', async () => {
  describe('before', () => {
    it('should reject missing registration', async () => {
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
    let testedRequiredFields = []
    for (const country of connect.countrySpecs) {
      const companyPayload = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
      for (const field in companyPayload) {
        if (testedRequiredFields.indexOf(field) > -1) {
          continue
        }
        testedRequiredFields.push(field)
        it(`should have element for ${field} (company)`, async () => {
          const user = await TestHelper.createUser()
          await TestHelper.createStripeAccount(user, {
            country: country.id,
            type: 'company'
          })
          const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
          req.account = user.account
          req.session = user.session
          const result = await req.get()
          const doc = TestHelper.extractDoc(result.html)
          const elementContainer = doc.getElementById(`${field}-container`)
          assert.strictEqual(elementContainer.tag, 'div')
        })
      }
    }
    testedRequiredFields = []
    for (const country of connect.countrySpecs) {
      const individualPayload = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
      for (const field in individualPayload) {
        if (testedRequiredFields.indexOf(field) > -1) {
          continue
        }
        testedRequiredFields.push(field)
        it(`should have element for ${field} (individual)`, async () => {
          const user = await TestHelper.createUser()
          await TestHelper.createStripeAccount(user, {
            country: country.id,
            type: 'individual'
          })
          const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
          req.account = user.account
          req.session = user.session
          const result = await req.get()
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
    const individualFields = [
      'verification_document',
      'verification_additional_document'
    ]
    for (const field of individualFields) {
      it(`should have upload element for ${field} (individual)`, async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'AT',
          type: 'individual'
        })
        const property = field.replace('verification_', 'verification.')
        await TestHelper.updateStripeAccount(user, TestStripeAccounts.createPostData(TestStripeAccounts.individualData.AT))
        await TestHelper.waitForAccountRequirement(user, `individual.${property}`)
        const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        const result = await req.get()
        const doc = TestHelper.extractDoc(result.html)
        const container = field.indexOf('additiional') > -1 ? 'individual-additional-document-container' : 'individual-document-container'
        const elementContainer = doc.getElementById(container)
        assert.strictEqual(elementContainer.tag, 'div')
      })
    }
    // TODO: company verification document can't be tested
    // because the Stripe test API erroneously marks it as
    // under review instead of required, and this form only
    // supports required fields
    // const companyFields = [
    //   'verification_document'
    // ]
    // for (const field of companyFields) {
    //   it(`should have upload element for ${field} (company)`, async () => {
    //     const user = await TestHelper.createUser()
    //     await TestHelper.createStripeAccount(user, {
    //       country: 'AT',
    //       type: 'company'
    //     })
    //     const property = field.replace('verification_', 'verification.')
    //     await TestHelper.waitForAccountRequirement(user, `individual.${property}`)
    //     const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
    //     req.account = user.account
    //     req.session = user.session
    //     const result = await req.get()
    //     const doc = TestHelper.extractDoc(result.html)
    //     const elementContainer = doc.getElementById(`${field}-container`)
    //     assert.strictEqual(elementContainer.tag, 'div')
    //   })
    // }
  })

  describe('submit', () => {
    let testedMissingFields = []
    for (const country of connect.countrySpecs) {
      const companyPayload = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
      for (const field in companyPayload) {
        if (testedMissingFields.indexOf(field) > -1) {
          continue
        }
        testedMissingFields.push(field)
        it(`should reject missing ${field} no stripe.js (company)`, async () => {
          const user = await TestHelper.createUser()
          await TestHelper.createStripeAccount(user, {
            country: country.id,
            type: 'company'
          })
          const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
          req.account = user.account
          req.session = user.session
          req.body = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
          delete (req.body[field])
          const result = await req.post()
          const doc = TestHelper.extractDoc(result.html)
          const messageContainer = doc.getElementById('message-container')
          const message = messageContainer.child[0]
          assert.strictEqual(message.attr.template, `invalid-${field}`)
        })

        it(`should reject missing ${field} stripe.js v3 (company)`, async () => {
          global.stripeJS = 3
          const user = await TestHelper.createUser()
          await TestHelper.createStripeAccount(user, {
            country: country.id,
            type: 'company'
          })
          const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
          req.account = user.account
          req.session = user.session
          req.body = TestStripeAccounts.createPostData(TestStripeAccounts.companyData[country.id])
          delete (req.body[field])
          const result = await req.post()
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
          const user = await TestHelper.createUser()
          await TestHelper.createStripeAccount(user, {
            country: country.id,
            type: 'individual'
          })
          const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
          req.account = user.account
          req.session = user.session
          req.body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
          delete (req.body[field])
          const result = await req.post()
          const doc = TestHelper.extractDoc(result.html)
          const messageContainer = doc.getElementById('message-container')
          const message = messageContainer.child[0]
          assert.strictEqual(message.attr.template, `invalid-${field}`)
        })

        it(`should reject missing ${field} stripe.js v3 (individual)`, async () => {
          global.stripeJS = 3
          const user = await TestHelper.createUser()
          await TestHelper.createStripeAccount(user, {
            country: country.id,
            type: 'individual'
          })
          const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
          req.account = user.account
          req.session = user.session
          req.waitBefore = async (page) => {
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
          req.body = TestStripeAccounts.createPostData(TestStripeAccounts.individualData[country.id])
          delete (req.body[field])
          const result = await req.post()
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
    const individualFields = [
      'verification_document_front',
      'verification_document_back',
      'verification_additional_document_front',
      'verification_additional_document_back'
    ]
    for (const field of individualFields) {
      it(`should reject missing upload ${field} no stripe.js (individual)`, async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'GB',
          type: 'individual'
        })
        if (field.startsWith('verification_additional_document')) {
          await TestHelper.updateStripeAccount(user, TestStripeAccounts.createPostData(TestStripeAccounts.individualData.GB), {
            verification_document_front: TestHelper['success_id_scan_back.png'],
            verification_document_back: TestHelper['success_id_scan_back.png']
          })
        } else {
          await TestHelper.updateStripeAccount(user, TestStripeAccounts.createPostData(TestStripeAccounts.individualData.GB))
        }
        const property = field.replace('verification_', 'verification.').replace('_front', '').replace('_back', '')
        await TestHelper.waitForAccountRequirement(user, `individual.${property}`)
        const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        if (field.startsWith('verification_additional')) {
          req.uploads = {
            verification_additional_document_front: TestHelper['success_id_scan_back.png'],
            verification_additional_document_back: TestHelper['success_id_scan_back.png']
          }
        } else {
          req.uploads = {
            verification_document_front: TestHelper['success_id_scan_back.png'],
            verification_document_back: TestHelper['success_id_scan_back.png']
          }
        }
        delete (req.uploads[field])
        const result = await req.post()
        const doc = TestHelper.extractDoc(result.html)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, `invalid-${field}`)
      })

      it(`should reject missing upload ${field} stripe.js v3 (individual)`, async () => {
        const user = await TestHelper.createUser()
        await TestHelper.createStripeAccount(user, {
          country: 'GB',
          type: 'individual'
        })
        if (field.startsWith('verification_additional_document')) {
          await TestHelper.updateStripeAccount(user, TestStripeAccounts.createPostData(TestStripeAccounts.individualData.GB), {
            verification_document_front: TestHelper['success_id_scan_back.png'],
            verification_document_back: TestHelper['success_id_scan_back.png']
          })
        } else {
          await TestHelper.updateStripeAccount(user, TestStripeAccounts.createPostData(TestStripeAccounts.individualData.GB))
        }
        const property = field.replace('verification_', 'verification.').replace('_front', '').replace('_back', '')
        await TestHelper.waitForAccountRequirement(user, `individual.${property}`)
        global.stripeJS = 3
        const req = TestHelper.createRequest(`/account/connect/edit-stripe-account?stripeid=${user.stripeAccount.id}`)
        req.account = user.account
        req.session = user.session
        req.waitBefore = async (page) => {
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
        req.waitAfter = async (page) => {
          while (true) {
            const message = await page.evaluate(() => {
              var container = document.getElementById('message-container')
              return container.children.length
            })
            if (message > 0) {
              return
            }
            await page.waitFor(100)
          }
        }
        req.uploads = {
          verification_additional_document_front: TestHelper['success_id_scan_front.png'],
          verification_additional_document_back: TestHelper['success_id_scan_back.png'],
          verification_document_front: TestHelper['success_id_scan_front.png'],
          verification_document_back: TestHelper['success_id_scan_back.png']
        }
        delete (req.uploads[field])
        const result = await req.post()
        const doc = TestHelper.extractDoc(result.html)
        const messageContainer = doc.getElementById('message-container')
        const message = messageContainer.child[0]
        assert.strictEqual(message.attr.template, `invalid-${field}`)
      })
    }

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

    it('should update registration no stripe.js', async () => {
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
})
