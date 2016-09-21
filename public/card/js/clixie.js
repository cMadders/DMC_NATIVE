// ivb
// http://widgets.digitalmediacommunications.com/widget/embed/index/?p=1431&k=bea

// script
// http://widgets.digitalmediacommunications.com/scripts/clixie_integration.js

var ac; //active creative
var player; //clixie player

function applyNowClicked() {
    // console.log('applyNowClicked');
    // pause video
    player.pause();
    //post message
    var message = {};
    message.id = "dmc-clixie-apply-now-clicked";
    parent.postMessage(message, "*");
}

function initPlayer() {
    var settings = {
            url: ac.media.mp4,
            layout: 5,
            videoId: ac.extra.clixie_vid_uuid,
            // poster: "http://dmc2k.digitalmediacommunications.com/html5_logos/employment/default_index_video_slate.jpg",
            poster: ac.media.logo,
            responsive: true,
            autoplay: false
        },
        videoWrapperId = "videoPlayer";

    player = new Clixie.Player(videoWrapperId, settings);

    player.on("ready", function() {
        // console.log('player.ready');
        $('#dmc-loading').text('click to play video').addClass('ready');
        $('#dmc-loading.ready').click(function(event) {
          player.play();
        });
        $('.clixie-dock').remove();
        $('.clixie-canvas').on('click', '.clixie-toast', function(event) {
            event.preventDefault();
            // console.log('toast clicked');
            applyNowClicked();
        });
    });

    player.on("start", function(event) {
        // console.log('player.start');
        $('#dmc-loading').remove();

        // add apply now icon
        $('.clixie-video').before('<div id="dmc-apply"></div>');
        $('#dmc-apply').click(function(event) {
            event.preventDefault();
            // console.log('clicked');
            applyNowClicked();
        });

        // track play (disabling b/c Native tracks video play on detail view)
        // var message = {};
        // message.id = "dmc-clixie-video-play";
        // parent.postMessage(message, "*");
    });

    player.on("added", function(event) {
        // console.log('player.added');
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