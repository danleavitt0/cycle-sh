var $ = window.$

var $spinner = $('.spinner')
var $runButton = $('.play-button')
var $editors = $('.require-bin-editor')
var $editorPickerLinks = $('.editor-picker a')
var $preview = $('#preview-btn')
var $functionSearch = $('#function-search')
var $resultsWrapper = $('#function-search .results-wrapper')

var controls = {
  $spinner: $spinner,
  $runButton: $runButton,
  $preview: $preview,
  enableShare: function (gistID) {
    var disabled = document.querySelector('#shareDisabled')
    $(disabled).addClass('hidden')
  },
  /**
   * display error/warning messages in the site header
   * cssClass should be a default bootstrap class
   * @param {String} cssClass warning|alert|info|success
   * @param text message content
   */
  tooltipMessage: function (cssClass, text) {
    var message = document.querySelector('.alert')
    if (message) {
      message.classList.remove('hidden')
      message.classList.add('alert-' + cssClass)
      message.innerHTML = text
    } else {
      message = document.createElement('div')
      message.classList.add('alert')
      var close = document.createElement('span')
      close.classList.add('pull-right')
      close.innerHTML = '&times'
      close.addEventListener('click', function () {
        this.parentNode.classList.add('hidden')
      }, false)
      message.classList.add('alert-' + cssClass)
      message.innerHTML = text
      document.querySelector('body').appendChild(message)
      message.appendChild(close)
    }
  },

  showFunctionSearch: function (searchResults, cb) {
    var active = 0
    var items = []
    $functionSearch.show().find('input').focus().select()
    var results = searchResults.map(function (result, i) {
      return createElement(result, i)
    })
    $functionSearch.find('.results-wrapper .results').html(results)

    $functionSearch.find('input').keyup(function (e) {
      var re = new RegExp($(this).val(), 'i')
      e.preventDefault()
      e.stopPropagation()

      var newItems = searchResults.filter(function (result) {
        return result.name.match(re)
      })

      if (e.keyCode === 40) {
        if (active < items.length - 1) {
          active++
          let offsetTop = (active + 1) * ($('.list-group-item.active').outerHeight() - 1)

          if (offsetTop >= $resultsWrapper.outerHeight() + $resultsWrapper.scrollTop()) {
            let off = Math.round(offsetTop - $resultsWrapper.outerHeight())
            $resultsWrapper.scrollTop(off)
          } else if (offsetTop === 0) {
            $resultsWrapper.scrollTop(0)
          }
        }
      } else if (e.keyCode === 38 && active > 0) {
        active--
        let offsetTop = (active) * ($('.list-group-item.active').outerHeight() - 1)

        if (offsetTop <= $resultsWrapper.scrollTop()) {
          let off = Math.round(offsetTop)
          $resultsWrapper.scrollTop(off)
        } else if (offsetTop === 0) {
          $resultsWrapper.scrollTop(0)
        }
      } else if (e.keyCode === 13) {
        $functionSearch.find('input').unbind('keyup')
        $('.list-group-item.active').click()
      } else if (e.keyCode === 27) {
        $functionSearch.find('input').unbind('keyup')
        $functionSearch.hide()
      } else {
        active = 0
      }

      results = newItems.map(function (result, i) {
        return createElement(result, i)
      })

      $functionSearch.find('.results-wrapper .results').html(results)
      items = newItems
    })

    function createElement (result, i) {
      setTimeout(function () {
        attachClick(`#${result.name}-${result.line}`, result, cb)
      }, 300)
      return `<li id='${result.name}-${result.line}' class='list-group-item ${i === active ? 'active' : ''}'>${result.name}: ${result.line}</li>`
    }
  },

  showForks: function (forks, parent) {
    var wrap = document.createElement('div')
    var i, header
    wrap.className = 'white-popup'

    function renderRow (data) {
      var row = document.createElement('div')

      // append requirebin link
      var pre = document.createElement('pre')
      pre.appendChild($('<a />', {
        href: data.requireBinLink,
        target: '_blank',
        html: data.requireBinLink
      })[0])
      row.appendChild(pre)

      // append user
      var from = document.createElement('span')
      from.appendChild($('<span />', { html: 'by ' })[0])
      from.appendChild($('<a />', {
        href: data.userOnGithub,
        target: '_blank',
        html: data.user
      })[0])
      row.appendChild(from)
      return row
    }

    if (parent) {
      header = document.createElement('h3')
      header.innerHTML = 'Parent'
      wrap.appendChild(header)
      wrap.appendChild(renderRow(parent))
    }

    if (forks.length) {
      header = document.createElement('h3')
      header.innerHTML = 'Forks'
      wrap.appendChild(header)

      for (i = 0; i < forks.length; i += 1) {
        var row = renderRow(forks[i])
        wrap.appendChild(row)
      }
    }

    $.magnificPopup.open({
      items: {
        type: 'inline',
        src: wrap
      },
      closeBtnInside: true
    })
  }
}

// changes the active editor
$editorPickerLinks.click(function () {
  var self = $(this)
  // there's only one primary button
  var editorName = self.attr('data-editor')
  $editorPickerLinks.removeClass('btn-primary')
  self.addClass('btn-primary')
  // hide all editors and show the active editor
  $editors.addClass('hidden')
  $('#edit-' + editorName).removeClass('hidden')
})

function attachClick (name, result, cb) {
  $(name).click(function () {
    cb(result.line)
    $functionSearch.find('input').unbind('keyup')
    $functionSearch.hide()
  })
}

module.exports = controls
