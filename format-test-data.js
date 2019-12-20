/*
  This script scans test files and ensures that the data required
  for Connect and subscription tests is presented alphabetically
  when using test-helpers to create data and request bodies.

  This allows easily modifying such the data for when it changes for
  whatever country or scenario, by doing a multi-line search/replace
  that updates all instances.

  Example:

  await TestHelper.createCompanyRepresentative(user, {
    relationship_representative_address_city: 'Berlin',
    relationship_representative_address_country: 'DE',
    relationship_representative_address_line1: 'First Street',
    relationship_representative_address_postal_code: '01067',
    relationship_representative_address_state: 'BW',
    relationship_representative_dob_day: '1',
    relationship_representative_dob_month: '1',
    relationship_representative_dob_year: '1950',
    relationship_representative_email: user.profile.contactEmail,
    relationship_representative_first_name: user.profile.firstName,
    relationship_representative_last_name: user.profile.lastName,
    relationship_representative_phone: '456-789-0123',
    relationship_representative_relationship_executive: 'true',
    relationship_representative_relationship_title: 'Owner'
  }, {
    relationship_representative_verification_additional_document_back: TestHelper['success_id_scan_back.png'],
    relationship_representative_verification_additional_document_front: TestHelper['success_id_scan_front.png'],
    relationship_representative_verification_document_back: TestHelper['success_id_scan_back.png'],
    relationship_representative_verification_document_front: TestHelper['success_id_scan_front.png']
  })
*/

const fs = require('fs')
const path = require('path')
const filePath = path.join(__dirname, process.argv[2])
const fileContents = fs.readFileSync(filePath).toString()
if (fileContents.indexOf(', {') === -1) {
  process.exit(0)
}

let parsed = ''
let raw = fileContents
while (raw.indexOf(', {') > -1) {
  parsed += raw.substring(0, raw.indexOf(', {') + 1)
  raw = raw.substring(raw.indexOf(', {') + 1)
  let segment = raw
  segment = segment.substring(0, segment.indexOf(' }') + 2)
  const parts = []
  const lines = segment.split('\n')
  for (const line of lines) {
    if (line.indexOf(':') === -1) {
      continue
    }
    parts.push(line)
  }
  parts.sort()
  for (let i = 0, len = parts.length; i < len; i++) {
    if (i === len - 1) {
      if (parts[i].indexOf(',') > -1) {
        parts[i] = parts[i].substring(0, parts[i].indexOf(','))
      }
    } else {
      if (parts[i].indexOf(',') === -1) {
        parts[i] += ','
      }
    }
  }
  parsed += `{
${parts.join('\n')}
}`
  raw = raw.substring(raw.indexOf(' }') + 2)
}
parsed += raw

raw = parsed
parsed = ''
while (raw.indexOf('= {') > -1) {
  parsed += raw.substring(0, raw.indexOf('= {') + 1)
  raw = raw.substring(raw.indexOf('= {') + 1)
  let segment = raw
  if (segment.indexOf(' {}') === 0) {
    segment = segment.substring(0, segment.indexOf('}') + 1)
    parsed += segment
    raw = raw.substring(raw.indexOf('}') + 1)
    continue
  }
  segment = segment.substring(0, segment.indexOf(' }') + 2)
  const parts = []
  const lines = segment.split('\n')
  for (const line of lines) {
    if (line.indexOf(':') === -1) {
      continue
    }
    parts.push(line)
  }
  parts.sort()
  for (let i = 0, len = parts.length; i < len; i++) {
    if (i === len - 1) {
      if (parts[i].indexOf(',') > -1) {
        parts[i] = parts[i].substring(0, parts[i].indexOf(','))
      }
    } else {
      if (parts[i].indexOf(',') === -1) {
        parts[i] += ','
      }
    }
  }
  parsed += `{
${parts.join('\n')}
}`
  raw = raw.substring(raw.indexOf(' }') + 2)
}
parsed += raw

fs.writeFileSync(filePath, parsed)
