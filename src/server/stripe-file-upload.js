const fs = require('fs')
const Multiparty = require('multiparty')
const stripe = require('stripe')()
const util = require('util')

module.exports = {
  after: async (req) => {
    if (!req.account) {
      return
    }
    if (req.body || req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTION') {
      return
    }
    if (!req.urlPath.startsWith('/account/connect/') && !req.urlPath.startsWith('/api/user/connect/')) {
      return
    }
    if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data;')) {
      await parseMultiPartData(req)
    }
  }
}

const parseMultiPartData = util.promisify((req, callback) => {
  const form = new Multiparty.Form()
  return form.parse(req, async (error, fields, files) => {
    if (error) {
      return callback(error)
    }
    if (files && Object.keys(files).length > 1) {
      await deleteUploads(files)
      throw new Error('invalid-upload')
    }
    if (files && (!files.id_scan || files.id_scan.length !== 1)) {
      await deleteUploads(files)
      return callback(new Error('invalid-upload'))
    }
    req.body = {}
    for (const field in fields) {
      if (field === 'fileid') {
        return callback(new Error('invalid-upload'))
      }
      req.body[field] = fields[field][0]
    }
    if (files.id_scan[0].size) {
      const extension = files.id_scan[0].originalFilename.toLowerCase().split('.').pop()
      if (extension !== 'png' && extension !== 'jpg' && extension !== 'jpeg') {
        return callback(new Error('invalid-upload'))
      }
      const buffer = fs.readFileSync(files.id_scan[0].path)
      await deleteUploads(files)
      const uploadData = {
        purpose: 'identity_document',
        file: {
          data: buffer,
          name: `id_scan.${extension}`,
          type: 'application/octet-stream'
        }
      }
      try {
        req.file = await stripe.files.create(uploadData, req.stripeKey)
      } catch (error) {
        return callback(new Error('unknown-error'))
      }
    }
    return callback()
  })
})

async function deleteUploads (files) {
  for (const field in files) {
    if (!files[field] || !files[field].length) {
      continue
    }
    for (const file of files[field]) {
      fs.unlinkSync(file.path)
    }
  }
}
