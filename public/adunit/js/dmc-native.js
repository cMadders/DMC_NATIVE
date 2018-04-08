'use strict'

/**
 * Controller module
 */
window.DMC.Controller = (function() {
  var initialize = function() {
    // console.log('Controller.initialize');
    embedCSS()

    // add card overlay
    $('body').append('<div id="dmc-overlay"></div>')
    // add adunit silhouette to page for animation effect
    $('body').append('<div id="dmc-card"></div>')

    bind()
    window.DMC.initialized = true
  }

  var bind = function() {
    $('#dmc-overlay').click(function(event) {
      minimizeUnit()
    })

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
          // console.log('card loaded');
        }

        if (e.data == 'dmc-card-initialized') {
          // console.log('card initialized');
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
          // Dispatch the event.
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
    // CSS STYLING
    var sheet = (function() {
      // Create the <style> tag
      var style = document.createElement('style')

      // Add a media (and/or media query) here if you'd like!
      // style.setAttribute('media', 'screen')
      // style.setAttribute('media', 'only screen and (max-width : 1024px)')

      // WebKit hack :(
      style.appendChild(document.createTextNode(''))

      // Add the <style> element to the page
      document.head.appendChild(style)

      return style.sheet
    })()

    //dmc-native
    sheet.insertRule('.dmc-native { cursor:pointer;overflow:hidden;}', 0)
    // dmc-overlay
    sheet.insertRule(
      '#dmc-overlay { display:none; background: black; position: absolute; height: 100vh;width: 100%; z-index: 999998; opacity:0.8;}',
      0
    )
    sheet.insertRule('#dmc-overlay.active  {display:block;}', 0)
    //dmc-card
    sheet.insertRule(
      '#dmc-card { background:white; width:100%; height: 5px;position: absolute;box-shadow: 0 0 12px 0 rgba(0, 0, 0, 0.8);z-index:999999;visibility:hidden;max-width:1000px;}',
      0
    )
    sheet.insertRule('#dmc-card.active { visibility:visible;}', 0)
    sheet.insertRule('#dmc-card.expanded { box-shadow:none; }', 0)
    sheet.insertRule(
      '#dmc-card-iframe {width:100%;height:100%;outline:none;border:none;}',
      0
    )

    // youtube embed... looks great with box-shadow
    // sheet.insertRule("#dmc-card iframe {position: absolute; top:200px; box-shadow: 1px 11px 31px -5px rgba(0, 0, 0, 0.8); }", 0);

    // html, body
    // block scroll for mobile;
    // causes underlying page to jump to top;
    // prevents scrolling on all screens
    // MOBILE-------------------
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
    // $('#dmc-card').removeClass('active').empty();
    // $('#dmc-card').removeClass('active').empty();
    $('#dmc-overlay, #dmc-card')
      .removeClass('active')
      .empty()
    $('#dmc-card').removeClass('expanded')
    $('html, body').removeClass('disable-scroll')
    //scroll to original position
    window.scrollTo(0, window.DMC.viewportTop)
    //fire event... other modules should have listeners setup for this event
    var e = new Event('unitMinimized')
    // Dispatch the event.
    window.dispatchEvent(e)
  }

  var activateAdUnit = function() {
    // console.log('activateAdUnit');
    // issue call to original script delivered from ad server
    // notify mothership that AdUnit is ready for activation
    window.DMC.activate(adunitCallback)
  }

  // callback from original script
  var adunitCallback = function(index, data, placeholder) {
    data = JSON.parse(data)
    // console.log('adunitCallback: ', index + ' - ' + placeholder);
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
        // $('script#' + scriptID).after(unescapeHtml(data.template)).remove();
        // console.log('scriptID: ', scriptID);
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

        // window.addEventListener("unitMinimized", function() {
        //     // alert("unitMinimized");
        //     console.log('minimizeUnit');
        // });

        window.addEventListener('dmc-get-card-dimensions', function() {
          getCardDimensions()
        })
      }

      var expandUnit = function() {
        pos.top = $el.offset().top
        console.log('pos.top', pos.top)
        pos.right = $el.offset().right
        pos.bottom = document.getElementById(uuid).style.bottom
        pos.left = $el.offset().left
        pos.width = document.getElementById(uuid).offsetWidth
        pos.height = document.getElementById(uuid).offsetHeight
        // console.log(pos);

        //note viewport top
        window.DMC.viewportTop = document.body.scrollTop
        var top = window.DMC.viewportTop

        // postion shadow atop adunit
        $('#dmc-card')
          .css('top', pos.top + 'px')
          .css('left', pos.left)
          .css('width', pos.width)
          .css('height', pos.height)

        // animate in dmc overlay
        $('#dmc-overlay').css('top', window.DMC.viewportTop)
        $('#dmc-overlay').addClass('active')

        // cut in 1/2 and move to middle of AdUnit
        $('#dmc-card').height($('#dmc-card').height() / 2)
        var shadowTop = pos.top + pos.height / 2 - $('#dmc-card').height() / 2
        $('#dmc-card').css('top', shadowTop)
        $('#dmc-card').addClass('active')

        var left = 0

        // console.log('screen width: ' + window.innerWidth);
        // is Desktop?
        if (window.innerWidth >= 1000) {
          left = (window.innerWidth - 1000) / 2
        }

        // TweenLite
        var tween = TweenLite.to($('#dmc-card'), 0.4, {
          top: 0,
          left: 0,
          // delay: 0.3,
          height: window.innerHeight,
          width: window.innerWidth,
          ease: Power1.easeInOut,
          onComplete: expanded
        })
      }

      var expanded = function() {
        // prohibit scroll on webpage below
        $('html, body').addClass('disable-scroll')
        // bring card to top = 0 b/c disabling scroll on html and body automatically jumps user to yPos 0
        $('#dmc-card, #dmc-overlay').css('top', '0')
        $('#dmc-card').addClass('expanded')

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
