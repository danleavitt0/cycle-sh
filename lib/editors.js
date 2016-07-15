var htmlEditor = require('./html-editor')
var jsEditor = require('brace')
var uiController = require('./ui-controller')
require('brace/mode/javascript')
require('brace/theme/tomorrow')
require('brace/ext/language_tools')
require('brace/ext/searchbox')

jsEditor.acequire('brace/ext/language_tools')
jsEditor.acequire('brace/ext/searchbox')

var editorHeadEl = document.querySelector('#edit-head')
var editorBodyEl = document.querySelector('#edit-body')
var editorMetaEl = document.querySelector('#edit-meta')
var editorEl = document.querySelector('#edit-bundle')

var editorActions = {}
var editors = {}
var activeEditor

var jsOptions = {
  undef: true,
  esversion: 6,
  asi: true,
  browserify: true,
  predef: ['require', 'console']
}

/**
 * Creates the editors which are mapped inside self with a name,
 * each editor will be filled with the contents of code[name] if such
 * editor exists
 *
 * @param {Object} code
 */
editorActions.init = function (code) {
  // javascript editors
  var bundleEditor = jsEditor.edit(editorEl)
  bundleEditor.getSession().setMode('ace/mode/javascript')
  bundleEditor.setTheme('ace/theme/tomorrow')
  bundleEditor.getSession().setTabSize(2)
  bundleEditor.setHighlightActiveLine(false)
  bundleEditor.setShowPrintMargin(false)
  bundleEditor.$blockScrolling = Infinity
  bundleEditor.name = 'bundle'
  bundleEditor.editor = {}
  bundleEditor.clean = true
  bundleEditor.session.$worker.call('setOptions', [jsOptions])
  bundleEditor.setOptions({
    enableLiveAutocompletion: true
  })
  bundleEditor.getSession().setUseWrapMode(true)
  bundleEditor.on('change', function () {
    bundleEditor.clean = false
  })
  bundleEditor.editor.isClean = function () {
    return bundleEditor.clean
  }
  bundleEditor.editor.markClean = function () {
    bundleEditor.clean = true
  }

  bundleEditor.commands.addCommand({
    name: 'outline',
    bindKey: {win: 'Ctrl-Shift-F', mac: 'Command-Shift-F'},
    exec: function (editor) {
      var session = bundleEditor.getSession()
      var inClass = 0
      var leftP = 0
      var rightP = 0
      var functions = session.getDocument().$lines.reduce(function (cur, next, i) {
        var tokens = session.getTokens(i).filter(function (token) {
          if (inClass) {
            if (token.type === 'paren.lparen') leftP++
            if (token.type === 'paren.rparen') rightP++
            if (token.type === 'paren.rparen' && leftP === rightP) {
              leftP = 0
              rightP = 0
              inClass--
            }
          }
          if (token.value === 'class') inClass++
          return token.type === 'entity.name.function' || (inClass && leftP > 0 && token.type === 'identifier')
        })
        if (tokens.length > 0) {
          cur.push({name: tokens[0].value, line: i + 1})
        }
        return cur
      }, [])
      uiController.showFunctionSearch(functions, function (line) {
        bundleEditor.focus()
        bundleEditor.gotoLine(line, 0, true)
      })
    }
  })

  // html editors
  var metaEditor = htmlEditor.factory({
    // initial value is not important here, when the editor gets the focus
    // the content will be overwritten
    value: '',
    name: 'meta',
    mode: 'application/json',
    container: editorMetaEl,
    lineWrapping: true
  })
  var bodyEditor = htmlEditor.factory({
    name: 'body',
    value: '<!-- contents of this file will be placed inside the <body> -->\n',
    container: editorBodyEl
  })
  var headEditor = htmlEditor.factory({
    name: 'head',
    value: '<!-- contents of this file will be placed inside the <head> -->\n',
    container: editorHeadEl
  })

  editorActions.put(bundleEditor)
  editorActions.put(metaEditor)
  editorActions.put(bodyEditor)
  editorActions.put(headEditor)

  // update the code of each editor based on the contents of `code`
  Object.keys(code).forEach(function (key) {
    if (code[key]) {
      var editor = editorActions.get(key)
      editor && editor.setValue(code[key], 1)
    }
  })
}

editorActions.get = function (name) {
  return editors[name]
}

editorActions.put = function (editor) {
  if (!editor.name) {
    throw Error('the editor must have a name')
  }
  if (editors[editor.name]) {
    throw Error('there is an editor already registered with that name')
  }
  editors[editor.name] = editor
}

editorActions.setActive = function (name) {
  activeEditor = editorActions.get(name)
}

editorActions.getActive = function () {
  return activeEditor
}

/**
 * Executes fn for all the editors (code, head, body, meta), since each
 * element is called with Array.prototype.map the returning value is an
 * array with the returning value of `fn` called with each editor
 * @param fn
 * @return {Array}
 */
editorActions.all = function (fn) {
  return this.asArray().map(fn)
}

editorActions.asArray = function () {
  return Object.keys(editors)
    .map(function (key) {
      return editors[key]
    })
}

editorActions.getAll = editorActions.asArray

module.exports = editorActions
