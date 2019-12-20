/*
  This script scans KYC requirements and ensures that the array data
  is alphabetically sorted

  Example:

  "company": [
    "business_profile.mcc",
    "business_profile.product_description",
    "business_profile.url",
    "company.address_kana.city",
    "company.address_kana.line1",
    "company.address_kana.postal_code",
    "company.address_kana.state",
    "company.address_kana.town",
    "company.address_kanji.city",
    "company.address_kanji.line1",
    "company.address_kanji.postal_code",
    "company.address_kanji.state",
    "company.address_kanji.town",
    "company.name",
    "company.name_kana",
    "company.name_kanji",
    "company.phone",
    "company.tax_id"
  ],
*/

const fs = require('fs')
const path = require('path')
const filePath = path.join(__dirname, process.argv[2])
const fileContents = fs.readFileSync(filePath).toString()
const parsed = JSON.parse(fileContents)
for (const field in parsed) {
  parsed[field] = parsed[field].sort()
}
fs.writeFileSync(filePath, JSON.stringify(parsed, null, '  '))
