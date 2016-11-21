// ivb
// http://widgets.digitalmediacommunications.com/widget/embed/index/?p=1431&k=bea

// script
// http://widgets.digitalmediacommunications.com/scripts/clixie_integration.js

var ac; //active creative
var player; //clixie player
var clixieCount = 0;

function clixieToastClicked() {
    // console.log('clixieToastClicked');
    // pause video
    try {
        player.pause();
    } catch (err) {
        console.error(err);
    }
    //post message
    var message = {};
    message.id = "dmc-clixie-toast-clicked";
    parent.postMessage(message, "*");
}

function initPlayer() {
    var settings = {
        url: ac.media.mp4,
        layout: 5,
        videoId: ac.extra.clixie_vid_uuid,
        poster: ac.media.logo,
        responsive: false,
        autoplay: false,
        icon: ac.media.clixie_icon || '//s3.amazonaws.com/dmc2k.digitalmediacommunications.com/img/dmcmedia/applyNow.png'
    };

    player = new Clixie.Player("videoPlayer", settings);

    player.on("ready", function() {
        // console.log('player.ready');
        $('#dmc-loading').text('click to play video').addClass('ready');
        $('#dmc-loading.ready').click(function(event) {
            player.play();
        });

        // $('.clixie-dock').remove();

        $('.clixie-canvas').on('click', '.clixie-toast', function(event) {
            event.preventDefault();
            // console.log('toast clicked');
            clixieToastClicked();
        });
    });

    player.on("start", function(event) {
        // console.log('player.start');
        $('#dmc-loading').remove();

        // add action icon
        $('.clixie-video').before('<div id="dmc-apply" class="dmc-clixie-action-btn" style="background: url(' + settings.icon + ')"></div>');
        $('#dmc-apply').click(function(event) {
            event.preventDefault();
            // console.log('clicked');
            clixieToastClicked();
        });

        // track play (disabling b/c Native tracks video play on detail view)
        // var message = {};
        // message.id = "dmc-clixie-video-play";
        // parent.postMessage(message, "*");
    });

    player.on("added", function(event) {
        // console.log(event);
        if (event.type == "clixie:added") {
            clixieCount++;
            if (clixieCount == 2) {
                $('head').append($('<style>.clixie-toast-animated{ animation-duration: 20s; }</style>'));
            }
        }
    });

    player.on("end", function(event) {
        // console.log('player.end');
    });
}

// apply loading overlay
$('#videoPlayer').append('<div id="dmc-loading">loading</div>');


// parent listener
// Create IE + others compatible event handler
var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
var eventer = window[eventMethod];
var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
// Listen to message from child window
eventer(messageEvent, function(e) {
    if (e.data.id === 'dmc-init-clixie-player') {
        // console.log('dmc-init-clixie-player');
        ac = e.data;
        initPlayer();
    }
}, false);

//post message
var message = {};
message.id = "dmc-clixie-player-ready";
parent.postMessage(message, "*");