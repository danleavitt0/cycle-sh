var jsonp = require('jsonp')
var url = require('url')
var iframe = require('iframe')
var getGistFiles = require('./get-gist-files')
var $ = window.jQuery
var hljs = window.hljs
var parsedURL = url.parse(window.location.href, true)
var gistID = parsedURL.query.gist

var $codeEls = $('#output > div')
var $links = $('#links a')

var binURL = '?gist=' + gistID

if (gistID.indexOf('/') > -1) gistID = gistID.split('/')[1]

run()

function run () {
  updateUIBeforeGistLoad()
  loadFromAPI(gistID)
}

function updateUIBeforeGistLoad () {
  // update the links to requirebin
  $('.requirebin-link').attr('href', 'http://requirebin.com/' + binURL)

  // tabs state
  var tabs = (parsedURL.query.tabs || '')
    .split(',')
    .filter(Boolean)
  if (tabs.length) {
    $('#result-link').addClass('visible')
    $('#nav').show()
    tabs.forEach(function (tab) {
      $('#' + tab + '-link').addClass('visible')
    })
  } else {
    // if no tab is enabled then plain mode is activated
    $(document.body).addClass('plain')
  }
}

function loadFromAPI (gistID) {
  jsonp('https://api.github.com/gists/' + gistID, function (err, gist) {
    if (err) return console.log(err)

    getGistFiles(gist, ['page-head.html', 'page-body.html', 'head.html', 'minified.js', 'package.json', 'index.js'], function (err) {
      if (err) return console.log(err)
      var files = gist.data.files
      var content = {}

      var headFile = files['page-head.html'] || files['head.html']
      if (headFile) {
        content.head = headFile.content
      }
      if (files['page-body.html']) {
        content.body = files['page-body.html'].content
      }
      if (files['minified.js']) {
        content.bundle = files['minified.js'].content
        content.code = files['index.js'].content
      }
      if (files['package.json']) {
        content.meta = files['package.json'].content
      }

      updateUI(content)
      setUpUIController(content)
      render(content)
    })
  })
}

function render (content) {
  if (!content.bundle || !content.meta) {
    content.bundle = 'document.write("not a valid requirebin gist - missing minified.js")'
  }

  // disable default styling on the iframe
  if (content.head) {
    content.head = '<style> html, body{ margin: 0; padding: 0; border: 0; }</style>' + content.head
  }

  iframe({
    container: document.getElementById('result'),
    head: content.head,
    body: content.body + '<script type="text/javascript">' +
    'setTimeout(function(){\n;' + content.bundle + '\n;}, 0)</script>',
    sandboxAttributes: ['allow-scripts', 'allow-same-origin']
  })
}

function updateUI (content) {
  // highlight the code
  ['code', 'head', 'body', 'meta'].forEach(function (key) {
    var box = document.querySelector('#' + key + ' code')
    box.textContent = box.innerText = content[key]
  })
  hljs.initHighlightingOnLoad()
}

function setUpUIController (content) {
  window.onpopstate = function () {
    var hash = window.location.hash.substr(1)
    if (content[hash] || hash === 'result') {
      changeEditor(hash)
    }
  }
}

function changeEditor (hash) {
  $codeEls.removeClass('active')
  $links.removeClass('btn-primary')
  $('#' + hash).addClass('active')
  $('#' + hash + '-link').addClass('btn-primary')
}
