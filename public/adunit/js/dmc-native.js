'use strict'

window.DMC.Controller = (function() {
  var initialize = function() {
    embedCSS()
    // add adunit silhouette to page for animation effect
    $('body').append('<div id="dmc-card"></div>')

    bind()
    window.DMC.initialized = true
  }

  var bind = function() {
    //bind iframe listener
    var eventMethod = window.addEventListener
      ? 'addEventListener'
      : 'attachEvent'
    var eventer = window[eventMethod]
    var messageEvent = eventMethod == 'attachEvent' ? 'onmessage' : 'message'

    // Listen to message from child window (iframe)
    eventer(
      messageEvent,
      function(e) {
        // console.log('parent received message: ', e.data);
        if (e.data == 'dmc-card-loaded') {
          console.log('card loaded')
        }

        if (e.data == 'dmc-card-initialized') {
          console.log('card initialized')
          var url =
            window.location.protocol +
            '//' +
            window.location.host +
            window.location.pathname
          //send card referring URL information
          //POST message to CHILD
          var domain = '*'
          var iframe = document.getElementById('dmc-card-iframe').contentWindow
          var m = {
            type: 'dmc-card-message',
            key: 'page_url',
            value: url
          }
          iframe.postMessage(m, domain)
        }

        if (e.data == 'dmc-get-card-dimensions') {
          //fire event... other modules should have listeners setup for this event
          var evt = new Event('dmc-get-card-dimensions')
          window.dispatchEvent(evt)
        }

        if (e.data == 'dmc-eject-card') {
          console.log('eject card')
          minimizeUnit()
        }
      },
      false
    )
  }

  var embedCSS = function() {
    var sheet = (function() {
      // Create the <style> tag
      var style = document.createElement('style')
      // WebKit hack :(
      style.appendChild(document.createTextNode(''))
      // Add the <style> element to the page
      document.head.appendChild(style)
      return style.sheet
    })()

    //dmc-native
    sheet.insertRule('.dmc-native { cursor:pointer;overflow:hidden;}', 0)
    //dmc-card
    sheet.insertRule(
      '#dmc-card {width:100%; height: 100vh;position: absolute;z-index:999999;visibility:hidden;bottom: 0;top: 0;background-color: #FFF;opacity:0;}',
      0
    )
    sheet.insertRule('#dmc-card.active { visibility:visible;}', 0)
    sheet.insertRule(
      '#dmc-card-iframe {width:100%;height:100%;outline:none;border:none;}',
      0
    )
    // html, body
    // block scroll for mobile; causes underlying page to jump to top; prevents scrolling on all screens
    sheet.insertRule(
      '.disable-scroll { overflow: hidden; position: fixed; height: 100%;width:100%; margin:0;}',
      0
    )

    function css_add_inline(css_code) {
      var div = document.createElement('div')
      div.innerHTML = '<p>x</p><style>' + css_code + '</style>'
      document.body.appendChild(div.childNodes[1])
    }
  }

  var minimizeUnit = function() {
    $('#dmc-card')
      .removeClass('active')
      .css('width', '100%')
      .css('height', '100vh')
      .empty()
    $('html, body').removeClass('disable-scroll')
    //scroll to original position
    window.scrollTo(0, window.DMC.viewportTop)
    //fire event... other modules should have listeners setup for this event
    var e = new Event('unitMinimized')
    // Dispatch the event.
    window.dispatchEvent(e)
  }

  var activateAdUnit = function() {
    // console.log('activateAdUnit')
    // issue call to original script delivered from ad server
    // notify mothership that AdUnit is ready for activation
    window.DMC.activate(adunitCallback)
  }

  // callback from original script
  var adunitCallback = function(index, data, placeholder) {
    data = JSON.parse(data)
    // console.log('adunitCallback: ', index + ' - ' + placeholder)
    // console.log('adunitCallback', data);
    window.DMC.AdUnitController.createAdUnit(index, data, placeholder)
  }

  return {
    initialize: initialize,
    activateAdUnit: activateAdUnit,
    minimizeUnit: minimizeUnit
  }
})()

/**
 * ADUNIT CONTROLLER module
 */
// wrap AdUnit instantiation in anon wrapper to protect scope
window.DMC.AdUnitController = (function() {
  var AdUnit = function(data, placeholder) {
    return (function(data, placeholder) {
      //private properties
      var uuid = data.uuid,
        adunit_id = data.adunit_id,
        adunit_short_id = data.adunit_short_id,
        domain = data.domain,
        activated = true,
        pos = {
          top: null,
          right: null,
          bottom: null,
          left: null,
          width: null,
          height: null
        },
        $el = null

      var initialize = function() {
        console.log(
          'AdUnit initialized uuid:',
          uuid,
          ' | short_id: ',
          adunit_short_id,
          ' | domain: ',
          domain
        )
        render()
        bind()
      }

      var render = function() {
        var scriptID = $(placeholder).attr('id')
        $('script#' + scriptID).after(unescapeHtml(data.template))
        var t = $('script#' + scriptID).next()
        var id = $(t).attr('data-adunit')
        var count = $('[data-adunit="' + id + '"]').length
        $(t).attr('data-index', count)
      }

      var bind = function() {
        $el = $('#' + uuid)
        //bind events
        $el.click(function(event) {
          event.preventDefault()
          expandUnit()
        })

        window.addEventListener('unitMinimized', function() {
          console.log('unitMinimized')
        })

        window.addEventListener('dmc-get-card-dimensions', function() {
          getCardDimensions()
        })
      }

      var expandUnit = function() {
        //note scrollY at time of click
        window.DMC.viewportTop = window.scrollY

        // animate expansion
        $('#dmc-card')
          .addClass('active')
          .css('top', window.scrollY)
          .css('left', window.innerWidth)
        var tween = TweenLite.to($('#dmc-card'), 0.3, {
          left: 0,
          opacity: 1,
          // ease: Power1.easeInOut,
          onComplete: expanded
        })
      }

      var expanded = function() {
        // prohibit scroll on webpage below
        $('html, body').addClass('disable-scroll')
        $('#dmc-card')
          .css('top', 0)
          .css('left', 0)
        // DESKTOP
        if (window.innerWidth >= 1000) {
          if (data.index_url) {
            // INDEX IVB
            $('#dmc-card').html(
              '<iframe id="dmc-card-iframe" src="' +
                data.index_url +
                '" frameborder="0" seamless style="width:100%;height:' +
                window.innerHeight +
                'px;overflow-y:scroll;"></iframe>'
            )
            $('#dmc-card').prepend(
              '<div id="dmc-close-modal" style="float: right; color: #000; font-size: 30px; font-family: sans-serif; padding: 0 5px; margin: 0; cursor: pointer; -webkit-transition: color .15s linear; transition: color .15s linear; background: #eee; position: absolute; right: 0; border: 1px solid #AAA; box-shadow: 0px 0px 4px 1px rgba(0, 0, 0, 0.35);width:50px; text-align:center;">X</div>'
            )
            $('#dmc-close-modal').click(function(event) {
              DMC.Controller.minimizeUnit()
            })
          } else {
            $('#dmc-card').html(
              '<iframe id="dmc-card-iframe" src="https://native.digitalmediacommunications.com/card/list/' +
                adunit_id +
                '" frameborder="0" seamless style="width:100%;height:100%;"></iframe>'
            )
          }
        } else {
          // MOBILE
          var card_url = `${domain}/card/list/${adunit_id}`
          $('#dmc-card').html(
            `<iframe id="dmc-card-iframe" src="${card_url}" frameborder="0" seamless style="width:100%;height:100%;"></iframe>`
          )
        }

        window.addEventListener('resize', getCardDimensions)
      }

      function getCardDimensions() {
        console.log(
          'getCardDimensions: ',
          window.innerWidth + 'x' + window.innerHeight
        )
        $('#dmc-card').css({
          width: window.innerWidth,
          height: window.innerHeight
        })
      }

      return {
        uuid: uuid,
        activated: activated,
        adunit_id: adunit_id,
        initialize: function() {
          return initialize()
        },
        getData: function() {
          return data
        }
      }
    })(data, placeholder)
  }

  return {
    createAdUnit: function(index, data, placeholder) {
      var n = new AdUnit(data, placeholder)
      n.initialize()
      window.DMC.adunits[index] = n
    }
  }
})()

// INITIALIZE NATIVE
if (!window.DMC.initialized) {
  // code delivered inside iFrame?
  if (self == top) {
    // console.log('NO IFRAME');
  } else if (window.parent == top) {
    console.error('DMC INSIDE IFRAME')
  }
  window.DMC.Controller.initialize()
}
window.DMC.Controller.activateAdUnit()

// UTILS
// Use the browser's built-in functionality to quickly and safely escape the
// string
function escapeHtml(str) {
  var div = document.createElement('div')
  div.appendChild(document.createTextNode(str))
  return div.innerHTML
}

// UNSAFE with unsafe strings; only use on previously-escaped ones!
function unescapeHtml(escapedStr) {
  var div = document.createElement('div')
  div.innerHTML = escapedStr
  var child = div.childNodes[0]
  return child ? child.nodeValue : ''
}
