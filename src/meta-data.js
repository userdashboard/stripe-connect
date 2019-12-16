module.exports = {
  parse,
  store
}

/**
 * restores a JSON object from a Stripe object's metadata, which
 * imposes a 500-character limit so the JSON may have been stored
 * in chunks
 * @param {} metaData
 * @param {*} fieldName
 */
function parse (metaData, fieldName) {
  const parts = []
  let i = 2
  let part = metaData[fieldName]
  while (part) {
    parts.push(part)
    part = metaData[`${fieldName}${i}`]
    i++
  }
  if (parts.length) {
    return JSON.parse(parts.join(''))
  }
  return null
}

/**
 * writes a JSON object to a Stripe object's metadata, which
 * imposes a 500-character limit so the JSON may be stored
 * in chunks
 * @param {*} metaData
 * @param {*} fieldName
 * @param {*} object
 */
function store (metaData, fieldName, object) {
  for (const field in metaData) {
    if (field.startsWith(fieldName)) {
      metaData[field] = ''
    }
  }
  let json = JSON.stringify(object)
  if (json.length < 501) {
    metaData[fieldName] = json
  } else {
    const parts = []
    while (json.length > 500) {
      parts.push(json.substring(0, 500))
      json = json.substring(500)
    }
    parts.push(json)
    let i = 1
    for (const part of parts) {
      if (i === 1) {
        metaData[fieldName] = part
      } else {
        metaData[`${fieldName}${i}`] = part
      }
      i++
    }
  }
}
