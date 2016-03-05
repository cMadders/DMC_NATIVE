// @codekit-prepend "../../../bower_components/sample.js";

if (!window.dmc) {
     window.dmc = {
         dependenciesLoaded:false,
         BeaconService: null,
         DependencyService: null,
         pendingUnit: data,
         adunits: []
     };
 }

/**
 * DependencyService module
 */
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


/**
 * BeaconService module
 */
window.dmc.BeaconService = (function() {
    var referring_url;

    return {
        adunitClick: function(data) {
            console.log('adunitClick', data);
            return true; //if successfully pinged
        }
    };
})();


/**
 * ADUNIT CONTROLLER module
 */
// wrap AdUnit instantiation in anon wrapper to protect scope
window.dmc.AdUnitController = (function() {
    /**
     * ADUNIT module
     */
    var AdUnit = function(data) {
        console.log('AdUnit', data.uuid);
        return (function(data) {

            //native components
            var CardController = null,
                CardList = null,
                CardListItem = null,
                CardListItemFilter = null,
                Card = null;

            //private properties
            var adunit_id = null,
                thumbnail_media_type = null, //image or autoplay video
                html = null, //html with inline css
                beaconsFired = ['one', 'two'];


            var initialize = function() {
                console.log('AdUnit initialize', data.uuid);
            };

            var render = function() {
                //write html to DOM
            };

            var bind = function() {
                //bind events
            };
            var activateCard = function() {
                // CardController.activate();
                window.dmc.BeaconService.adunitClick(data);
            };

            return {
                initialize: function() {
                    return initialize();
                }
            };
        })(data);
    };


    return {
        createAdUnit: function(data) {
            var n = new AdUnit(data);
            n.initialize();
            window.dmc.adunits[data.uuid] = n;
            // clear pendingUnit
            window.dmc.pendingUnit = null;
        }
    };
})();


// CREATE NEW ADUNIT
(function() {
    window.dmc.dependenciesLoaded = true;
    return (window.dmc.pendingUnit) ? window.dmc.AdUnitController.createAdUnit(window.dmc.pendingUnit) : null;
})();

// notify mothership that you're ready to intialize
// window.dmc.activate(initialize);