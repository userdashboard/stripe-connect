window.uploadDocumentFiles = function (documentFront, documentBack, callback) {
  if ((!documentFront || !documentFront.files || !documentFront.files.length) &&
      (!documentBack || !documentBack.files || !documentBack.files.length)) {
    return callback()
  }
  let first = true
  let frontFile, backFile
  function upload () {
    let field = first ? documentFront : documentBack
    if (!field || !field.files || !field.files.length) {
      if (first) {
        field = documentBack
        first = false
        if (!field || !field.files || !field.files.length) {
          return callback(null, frontFile, backFile)
        }
      } else {
        return callback(null, frontFile, backFile)
      }
    }
    const stripePublishableKey = document.getElementById('stripe-publishable-key')
    const data = new window.FormData()
    data.append('file', field.files[0])
    data.append('purpose', 'identity_document')
    const headers = {
      Authorization: 'Bearer ' + stripePublishableKey.value
    }
    return window.send('https://uploads.stripe.com/v1/files', data, headers, 'POST', function (error, file) {
      if (error) {
        return window.renderError('upload-error')
      }
      if (file) {
        file = JSON.parse(file)
      }
      if (file && file.error) {
        return callback(new Error(file.error.message))
      }
      if (first) {
        first = false
        frontFile = file
        return upload()
      } else {
        backFile = file
        return callback(null, frontFile, backFile)
      }
    })
  }
  return upload()
}

let lastHighlight
window.renderError = function (templateid) {
  const template = document.getElementById(templateid)
  if (!template) {
    throw new Error('unknown template ' + templateid)
  }
  if (lastHighlight) {
    delete (lastHighlight.style.borderColor)
  }
  if (templateid.indexOf('invalid-') === 0) {
    const field = templateid.substring('invalid-'.length)
    const highlight = document.getElementById(field)
    if (highlight) {
      lastHighlight = highlight
      highlight.style.borderColor = '#F00'
      document.location.hash = '#' + field + '-anchor'
    }
  }
  const messageContainer = document.getElementById('message-container')
  messageContainer.innerHTML = ''
  const node = document.importNode(template.content, true)
  messageContainer.appendChild(node)
  messageContainer.firstChild.setAttribute('template', templateid)
}

window.send = function (url, body, headers, method, callback) {
  const x = getRequest()
  x.open(method, url, true)
  if (headers) {
    for (const field in headers) {
      x.setRequestHeader(field, headers[field])
    }
  }
  x.onreadystatechange = function () {
    if (x.readyState !== 4) {
      return
    }
    return callback(null, x.responseText)
  }
  x.send(body)
  return x
}

let useXMLHttpRequest, compatibleActiveXObject
function getRequest () {
  if (useXMLHttpRequest || typeof XMLHttpRequest !== 'undefined') {
    useXMLHttpRequest = true
    return new window.XMLHttpRequest()
  }
  if (compatibleActiveXObject !== null) {
    return new window.ActiveXObject(compatibleActiveXObject)
  }
  let xhr
  const xhrversions = ['MSXML2.XmlHttp.5.0', 'MSXML2.XmlHttp.4.0', 'MSXML2.XmlHttp.3.0', 'MSXML2.XmlHttp.2.0', 'Microsoft.XmlHttp']
  for (let i = 0, len = xhrversions.length; i < len; i++) {
    try {
      xhr = new window.ActiveXObject(xhrversions[i])
      compatibleActiveXObject = xhrversions[i]
      return xhr
    } catch (e) { }
  }
}
