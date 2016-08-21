/**
 * Controller module
 */
window.dmc.Controller = (function() {
    'use strict';

    var initialize = function() {
        // console.log('Controller.initialize');
        embedCSS();

        // add card overlay
        $('body').append('<div id="dmc-overlay"></div>');
        // add adunit silhouette to page for animation effect
        $('body').append('<div id="dmc-card"></div>');

        bind();
        window.dmc.initialized = true;
    };

    var bind = function() {
        // $('#dmc-card').click(function(event) {
        //     minimizeUnit();
        // });

        //bind iframe listener
        var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
        var eventer = window[eventMethod];
        var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

        // Listen to message from child window (iframe)
        eventer(messageEvent, function(e) {
            // console.log('parent received message: ', e.data);
            if (e.data == 'dmc-card-loaded') {
                // console.log('card loaded');
            }

            if (e.data == 'dmc-card-initialized') {
                // console.log('card initialized');
                var url = window.location.protocol + "//" + window.location.host + window.location.pathname;
                //send card referring URL information
                //POST message to CHILD
                var domain = '*';
                var iframe = document.getElementById('dmc-card-iframe').contentWindow;
                var m = {
                    type: 'dmc-card-message',
                    key: 'page_url',
                    value: url
                };
                iframe.postMessage(m, domain);
            }

            if (e.data == 'dmc-get-card-dimensions') {
                //fire event... other modules should have listeners setup for this event
                var evt = new Event('dmc-get-card-dimensions');
                // Dispatch the event.
                window.dispatchEvent(evt);
            }


            if (e.data == 'dmc-eject-card') {
                console.log('eject card');
                minimizeUnit();
            }
        }, false);
    };

    var embedCSS = function() {
        // CSS STYLING
        var sheet = (function() {
            // Create the <style> tag
            var style = document.createElement('style');

            // Add a media (and/or media query) here if you'd like!
            // style.setAttribute('media', 'screen')
            // style.setAttribute('media', 'only screen and (max-width : 1024px)')

            // WebKit hack :(
            style.appendChild(document.createTextNode(''));

            // Add the <style> element to the page
            document.head.appendChild(style);

            return style.sheet;
        })();

        //dmc-native
        sheet.insertRule(".dmc-native { cursor:pointer;overflow:hidden;}", 0);
        // dmc-overlay
        sheet.insertRule("#dmc-overlay { display:none; background: black; position: absolute; height: 100vh;width: 100vh; z-index: 999998; opacity:0.8;}", 0);
        sheet.insertRule("#dmc-overlay.active  {display:block;}", 0);
        //dmc-card
        sheet.insertRule("#dmc-card { background:white; width:100%; height: 5px;position: absolute;box-shadow: 0 0 12px 0 rgba(0, 0, 0, 0.8);z-index:999999;visibility:hidden;}", 0);
        sheet.insertRule("#dmc-card.active { visibility:visible;}", 0);
        sheet.insertRule("#dmc-card.expanded { box-shadow:none; }", 0);
        sheet.insertRule("#dmc-card-iframe {width:100%;height:100%;outline:none;border:none;}", 0);

        // youtube embed... looks great with box-shadow
        // sheet.insertRule("#dmc-card iframe {position: absolute; top:200px; box-shadow: 1px 11px 31px -5px rgba(0, 0, 0, 0.8); }", 0);


        // html, body
        // block scroll for mobile;
        // causes underlying page to jump to top;
        // prevents scrolling on all screens
        // MOBILE-------------------
        sheet.insertRule(".disable-scroll { overflow: hidden; position: fixed; height: 100%;width:100%; margin:0;}", 0);

        function css_add_inline(css_code) {
            var div = document.createElement("div");
            div.innerHTML = "<p>x</p><style>" + css_code + "</style>";
            document.body.appendChild(div.childNodes[1]);
        }
    };

    var minimizeUnit = function() {
        // $('#dmc-card').removeClass('active').empty();
        // $('#dmc-card').removeClass('active').empty();
        $('#dmc-overlay, #dmc-card').removeClass('active').empty();
        $('#dmc-card').removeClass('expanded');
        $('html, body').removeClass('disable-scroll');
        //scroll to original position
        window.scrollTo(0, window.dmc.viewportTop);
        //fire event... other modules should have listeners setup for this event
        var e = new Event('unitMinimized');
        // Dispatch the event.
        window.dispatchEvent(e);
    };

    var activateAdUnit = function() {
        // console.log('activateAdUnit');
        // issue call to original script delivered from ad server
        // notify mothership that AdUnit is ready for activation
        window.dmc.activate(adunitCallback);
    };

    // callback from original script
    var adunitCallback = function(index, data, placeholder) {
        data = JSON.parse(data);
        // console.log('adunitCallback: ', index + ' - ' + placeholder);
        // console.log('adunitCallback', data);
        window.dmc.AdUnitController.createAdUnit(index, data, placeholder);
    };

    return {
        initialize: initialize,
        activateAdUnit: activateAdUnit
    };
})();


/**
 * DependencyService module
 */
/*
window.dmc.DependencyService = (function() {
    var dependencies = ['https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.0/jquery.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/gsap/1.18.2/plugins/CSSPlugin.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/gsap/1.18.2/easing/EasePack.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/gsap/1.18.2/TweenLite.min.js'];
    return {
        loadDependencies: function() {
            var head = document.head || document.getElementsByTagName('head')[0];
            for (var i = 0; i < dependencies.length; i++) {
                var s = document.createElement('script');
                s.async = false;
                s.type = 'text/javascript';
                s.src = dependencies[i];
                head.appendChild(s);
            }
        }
    };
})();
*/

/**
 * BeaconService module
 */
/*
window.dmc.BeaconService = (function() {
    var referring_url;
    return {
        adunitClick: function(data) {
            console.log('adunitClick', data);
            return true; //if successfully pinged
        }
    };
})();
*/

/**
 * ADUNIT CONTROLLER module
 */
// wrap AdUnit instantiation in anon wrapper to protect scope
window.dmc.AdUnitController = (function() {
    var AdUnit = function(data, placeholder) {
        return (function(data, placeholder) {
            //private properties
            var uuid = data.uuid,
                adunit_id = data.adunit_id,
                adunit_short_id = data.adunit_short_id,
                activated = true,
                pos = {
                    top: null,
                    right: null,
                    bottom: null,
                    left: null,
                    width: null,
                    height: null
                },
                $el = null;

            var initialize = function() {
                console.log('AdUnit initialized uuid: ' + data.uuid + ' | short_id: ' + data.adunit_short_id);
                render();
                bind();
            };

            var render = function() {
                var scriptID = $(placeholder).attr('id');
                // console.log('scriptID: ', scriptID);
                $('script#' + scriptID).after(unescapeHtml(data.template));
                var t = $('script#' + scriptID).next();
                var id = $(t).attr('data-adunit');
                var count = $('[data-adunit="' + id + '"]').length;
                $(t).attr('data-index', count);
            };

            var bind = function() {
                $el = $('#' + uuid);

                //bind events
                $el.click(function(event) {
                    event.preventDefault();
                    expandUnit();
                });

                window.addEventListener("unitMinimized", function() {
                    // alert("unitMinimized");
                    console.log('minimizeUnit');
                });

                window.addEventListener("dmc-get-card-dimensions", function() {
                    getCARD_dimensions();
                });
            };

            var expandUnit = function() {
                pos.top = $el.offset().top;
                pos.right = $el.offset().right;
                pos.bottom = document.getElementById(uuid).style.bottom;
                pos.left = $el.offset().left;
                pos.width = document.getElementById(uuid).offsetWidth;
                pos.height = document.getElementById(uuid).offsetHeight;
                // console.log(pos);

                //note viewport top
                window.dmc.viewportTop = document.body.scrollTop;

                // postion shadow atop adunit
                $('#dmc-card').css('top', pos.top + 'px').css('left', pos.left).css('width', pos.width).css('height', pos.height);

                // animate in dmc overlay
                $('#dmc-overlay').css('top', window.dmc.viewportTop);
                $('#dmc-overlay').addClass('active');


                // cut in 1/2 and move to middle of AdUnit
                $('#dmc-card').height($('#dmc-card').height() / 2);
                var shadowTop = pos.top + (pos.height / 2) - ($('#dmc-card').height() / 2);
                $('#dmc-card').css('top', shadowTop);
                $('#dmc-card').addClass('active');

                // TweenLite
                var tween = TweenLite.to($('#dmc-card'), 0.4, {
                    top: window.dmc.viewportTop,
                    left: 0,
                    // delay: 0.3,
                    height: window.innerHeight,
                    width: window.innerWidth,
                    ease: Power1.easeInOut,
                    onComplete: expanded
                });
            };

            var expanded = function() {
                // console.log('expanded', adunit_id);

                // prohibit scroll on webpage below
                $('html, body').addClass('disable-scroll');
                // bring card to top = 0 b/c disabling scroll on html and body automatically jumps user to yPos 0
                $('#dmc-card, #dmc-overlay').css('top', '0');
                $('#dmc-card').addClass('expanded');

                //add iframe to card
                // LOCAL
                $('#dmc-card').html('<iframe id="dmc-card-iframe" src="http://sfo-jcottam.local:5757/card/list/' + adunit_id + '" frameborder="0" style="width:100%;height:100%;"></iframe>');

                // PRODUCTION
                // $('#dmc-card').html('<iframe id="dmc-card-iframe" src="http://native.digitalmediacommunications.com/card/list/' + adunit_id + '" frameborder="0" style="width:100%;height:100%;"></iframe>');

                // Aspen animated html5 ad
                // $('#dmc-card').html('<iframe frameborder="0" scrolling="no" id="creativeIframe632549838" src="https://s1.2mdn.net/4257417/1445981964340/asc_2015_PerfectStorm_300x250/index.html" width="300" height="250" style="display: block; margin-left: auto; margin-right: auto;"></iframe>');

                // youtube
                // $('#dmc-card').html('<iframe style="background-color:black;" width="100%" height="210" src="https://www.youtube.com/embed/vVTnT4843dY?rel=0&amp;controls=0&amp;showinfo=0" frameborder="0" style="position: absolute; top:200px; box-shadow: 1px 11px 31px -5px rgba(0, 0, 0, 0.8);" allowfullscreen></iframe>');

                window.addEventListener('resize', getCARD_dimensions);
                // getCARD_dimensions();
            };

            function getCARD_dimensions() {
                // console.log('getCARD_dimensions', window.innerWidth + 'x' + window.innerHeight);
                $('#dmc-card').css({ 'width': window.innerWidth, 'height': window.innerHeight });
            }

            return {
                uuid: uuid,
                activated: activated,
                initialize: function() {
                    return initialize();
                },
                getData: function() {
                    return data;
                }
            };
        })(data, placeholder);
    };


    return {
        createAdUnit: function(index, data, placeholder) {
            var n = new AdUnit(data, placeholder);
            n.initialize();
            window.dmc.adunits[index] = n;
        }
    };
})();


// INITIALIZE NATIVE
if (!window.dmc.initialized) {
    // code delivered inside iFrame?
    if (self == top) {
        // console.log('NO IFRAME');
    } else if (window.parent == top) {
        console.error('DMC INSIDE IFRAME');
    }
    window.dmc.Controller.initialize();
}
window.dmc.Controller.activateAdUnit();



// UTILS
// Use the browser's built-in functionality to quickly and safely escape the
// string
function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// UNSAFE with unsafe strings; only use on previously-escaped ones!
function unescapeHtml(escapedStr) {
    var div = document.createElement('div');
    div.innerHTML = escapedStr;
    var child = div.childNodes[0];
    return child ? child.nodeValue : '';
}