$(document).ready(function() {
    var ac; //active creative
    var keen;
    var track_to_mixpanel;
    var cardViewportTop = 0;
    var page_url = 'http://www.digitalmediacommunications.com';
    var token = 'not set';

    function initCard() {
        // console.log(window.DMC.Native.data);

        // get token from Widgets.DMC for POST authentication
        setXUL_Token();

        //if listing count is greater than 21, show filter menu
        if (window.DMC.Native.data.creative_count > 21) {
            showFilterMenu();
            $('#dmc-card-container').addClass('filter');
        } else {
            setCategoryFilter('all');
        }

        $('#card-list-filter li').removeClass('active');
        $('#card-list-filter li[data-category="all"]').addClass('active');
        // set social to index
        setSocial(window.DMC.Native.data.extra.dmc_index_url, window.DMC.Native.data.extra.dmc_index_url_short);
        getDimensions();

        //LISTEN for message from PARENT
        window.addEventListener('message', function(event) {
            // console.log(event);
            if (event.data.type && event.data.type === "dmc-card-message") {
                // console.log('child message from parent');
                // console.log(event.data.key, event.data.value);
                switch (event.data.key) {
                    case "page_url":
                        page_url = event.data.value;
                        // initKeenIO(page_url);
                        initMixPanel(page_url);
                        break;
                }
            }
            // post message back to parent
            // event.source.postMessage('holla back youngin!', event.origin);
        }, false);

        //listen for window.resize
        window.addEventListener('resize', getDimensions);
        window.parent.postMessage("dmc-card-initialized", "*");


        // $('.loading').fadeOut();
        // Fade In Card
        TweenLite.to($('#dmc-card-container'), 0.5, {
            opacity: "1",
            ease: Power1.easeOut
        });
        // alert('card ready');
    }

    // window.resize callback function
    function getDimensions() {
        window.parent.postMessage("dmc-get-card-dimensions", "*");
        // console.log('getDimensions', window.innerWidth + 'x' + window.innerHeight);
        var h = window.innerHeight - 109;
        $('#card-list').css('height', h);
        $('#card-detail').css('height', h);
    }

    function initKeenIO(page_url) {
        console.log('initKeenIO', page_url);
        keen = new Keen({
            projectId: "56c1264e46f9a71a338f446c",
            writeKey: "936b2216b15acce7d3dd66337d00f30f57e9fdd9b9456b9a4c1609264c90258fc07bfa0dece818e776f1e541cab23eaa7481c3ace0405cc249b2ed5b22f37d6455057944a18b212a412143b19444f195312d3d038ea2877c4fcb34bc42a17ee3",
        });

        // set global properties based on AdUnit, Publisher, and User info
        // Create a factory function
        var myGlobalProperties = function(eventCollection) {
            // Create global properties
            var globalProperties = {
                publisher: window.DMC.Native.data.publisher,
                site: window.DMC.Native.data.site,
                name: window.DMC.Native.data.name,
                id: window.DMC.Native.data._id,
                short_id: window.DMC.Native.data.short_id,
                page_url: page_url
            };
            // Special treatment for a specific event collection
            // if (eventCollection === "purchase") {
            //     globalProperties["isPurchase"] = true;
            // }
            return globalProperties;
        };

        // Apply factory function
        keen.setGlobalProperties(myGlobalProperties);
    }

    function initMixPanel(page_url) {
        console.log('initMixPanel', page_url);
        track_to_mixpanel = true;

        mixpanel.track("IVB Engaged", {
            url: page_url,
            id: window.DMC.Native.data._id,
            short_id: window.DMC.Native.data.short_id,
            publisher: window.DMC.Native.data.publisher,
            site: window.DMC.Native.data.site,
            name: window.DMC.Native.data.name
        });
    }

    function fireVideoPlayBeacon(beacon) {
        if (keen) {
            // Send it to the "video_plays" collection
            keen.addEvent("video_plays", beacon, function(err, res) {
                if (err) {
                    console.error('error logging beacon', err);
                }
            });
        }
        if (track_to_mixpanel) {
            beacon.url = page_url;
            beacon.id = window.DMC.Native.data._id;
            beacon.short_id = window.DMC.Native.data.short_id;
            beacon.publisher = window.DMC.Native.data.publisher;
            beacon.site = window.DMC.Native.data.site;
            beacon.name = window.DMC.Native.data.name;
            mixpanel.track("Video Play", beacon);
        }
    }

    function setXUL_Token() {
        $.get("//widgets.digitalmediacommunications.com/analytics/get_token", function(data) {
            var p = JSON.parse(data);
            // console.log(p);
            console.log('token', p.hash);
            token = p.hash;
        });
    }

    // fires beacon to XUL for additional tracking purposes
    function fireXUL_Beacon(type, listingID) {
        var url = "http://widgets.digitalmediacommunications.com/analytics/clicks";

        if (type == "apply") {
            type = "apply_here";
        }
        var arr = [listingID.toString(), type, "M1", "native", window.DMC.Native.data.extra.dmc_publication_id, page_url];

        // console.log('fireXUL_Beacon', arr);
        // console.log('token', token);
        if (!token) return;

        $.ajax({
            type: "POST",
            url: url,
            data: {
                "ci_csrf_token": token,
                "data": JSON.stringify(arr)
            },
            success: function(result) {
                window.console.log('XUL Analytics Logged Successfully');
            }
        });
    }


    function filterMenuOpenStart() {
        $('#dmc-card-container').addClass('filter-menu-open');
    }

    function filterMenuOpened() {
        getDimensions();
    }

    function filterMenuClosed() {
        $('#card-header').css('position', 'fixed');
        $('#dmc-card-container').removeClass('filter-menu-open');
        getDimensions();
    }

    function showFilterMenu() {
        $('#card-header').css('position', 'absolute');
        $('#card-list-filter').scrollTop(0);
        var w = window.innerWidth - 70;
        TweenLite.to($('#card'), 0.3, {
            left: w + "px",
            onStart: filterMenuOpenStart,
            onComplete: filterMenuOpened,
            ease: Power1.easeOut
        });
    }

    function hideFilterMenu(delay) {
        delay = delay || 0;
        $('#dmc-card-container').removeClass('filter');
        TweenLite.to($('#card'), 0.3, {
            left: "0",
            // delay: delay,
            onComplete: filterMenuClosed,
            ease: Power1.easeOut
        });
    }

    function setCategoryFilter(category) {
        // hide all items
        $('#card-list .item').hide();
        // show items with selected category
        if (category !== 'all') {
            $('.item[data-category="' + category + '"]').show();
            $('#card').scrollTop(0);
            $('#card-list').scrollTop(0);
        } else {
            $('.item').show();
        }
        hideFilterMenu('.3');
    }

    $('#card-header .filter.category').click(function(event) {
        event.preventDefault();
        $('#dmc-card-container').toggleClass('filter');
        if ($('#dmc-card-container').hasClass('filter')) {
            showFilterMenu();
        } else {
            hideFilterMenu('.3');
        }
    });

    $('#card-header .close-card').click(function(event) {
        event.preventDefault();
        window.parent.postMessage("dmc-eject-card", "*");
    });

    $('#card-list-filter li').click(function(event) {
        event.preventDefault();
        $('#card-list-filter li').removeClass('active');
        $(this).addClass('active');
        setCategoryFilter($(this).data('category'));
    });

    function detailOpened() {
        window.scrollTo(0, 0);
        getDimensions();
        $('html, body').addClass('disable-scroll');
    }

    function detailClosed() {
        $('#card-detail').scrollTop(0);
        $('html, body').removeClass('disable-scroll');
        $('#card-detail').css('display', 'none');
        getDimensions();
        $('html body').animate({
            scrollTop: cardViewportTop
        }, 300);
    }

    function resetDetailView() {
        // reset video player
        if (document.getElementById('native-video-player')) {
            document.getElementById('native-video-player').currentTime = 0;
            document.getElementById('native-video-player').pause();
        }

        if (document.getElementById('clixie-video-player')) {
            $('#clixie-video-player').attr('src', '');
        }

        // reset detail view
        $('#card-detail .coupon').hide();
        $('#card-detail .address').hide();
        $('#card-detail .map').hide();
        ac = null;
    }

    // return to card list view
    $('#card-header .back').click(function(event) {
        event.preventDefault();
        resetDetailView();
        $('#card-header .filter').show();
        $('#card-header .back').hide();
        $('#card-footer .apply').hide();
        $('#card-footer').addClass('reverse');

        // set social to index
        setSocial(window.DMC.Native.data.extra.dmc_index_url, window.DMC.Native.data.extra.dmc_index_url_short);

        // hide card detail
        var w = window.innerWidth;
        var delay = 0;
        TweenLite.to($('#card-detail'), 0.5, {
            left: w,
            delay: delay,
            onComplete: detailClosed,
            ease: Power1.easeOut
        });
    });

    // hijack footer action/links
    $('#card-footer a').click(function(event) {
        var medium = $(this).data('medium'); //Facebook, SMS, etc.
        var action = "share_actions";
        if (medium === "Apply") {
            action = "apply_actions";
        }

        if (ac) {
            fireXUL_Beacon(medium.toLowerCase(), ac.extra.listingID);
        }

        if (keen && ac) {
            keen.trackExternalLink(event, action, {
                'creative': ac,
                'medium': medium
            });
        }

        var beacon = constructCreativeBeacon();
        if (track_to_mixpanel) {
            if (action == "share_actions") {
                action = "Share";
            } else {
                action = "Apply";
            }
            beacon.url = page_url;
            beacon.id = window.DMC.Native.data._id;
            beacon.short_id = window.DMC.Native.data.short_id;
            beacon.publisher = window.DMC.Native.data.publisher;
            beacon.site = window.DMC.Native.data.site;
            beacon.name = window.DMC.Native.data.name;
            beacon.medium = medium;
            mixpanel.track(action, beacon);
        }
        return;
    });

    $('#card-list .item').click(function(event) {
        event.preventDefault();
        //close if filter menu is open
        if ($('#dmc-card-container').hasClass('filter-menu-open')) {
            return hideFilterMenu();
        }
        var id = $(this).data('id');
        // console.log(data.creatives_compiled);
        $.each(DMC.Native.data.creatives_compiled, function(index, creative) {
            if (creative._id === id) {
                ac = creative;
                return false;
            }
        });

        //note viewport top
        cardViewportTop = document.body.scrollTop;
        setDetailView();
        setSocial(ac.link.slp, ac.link.slp_short, ac.link.website, { advertiser: ac.advertiser, tagline: ac.tagline });

        // show card detail
        var delay = 0;
        TweenLite.to($('#card-detail'), 0.5, {
            left: "0",
            // visibility: 'visible',
            display: 'block',
            delay: delay,
            onComplete: detailOpened,
            ease: Power1.easeOut
        });

        $('#card-header .filter').hide();
        $('#card-header .back').css('display', 'flex');

        var beacon = constructCreativeBeacon();
        fireVideoPlayBeacon(beacon);
        fireXUL_Beacon("video_play", beacon.listingID);
    });

    function constructCreativeBeacon() {
        var beacon = {};
        if (ac) {
            var videoType = (ac.extra.clixie_vid_uuid) ? 'Clixie' : 'DMC';
            beacon = {
                id: ac._id,
                listingID: ac.extra.listingID,
                dmcAdNumber: ac.extra.dmcAdNumber,
                headline: ac.headline,
                tagline: ac.tagline,
                category: ac.category,
                vertical: ac.vertical,
                referrer: document.referrer,
                type: 'listing',
                videoType: videoType,
                keen: {
                    timestamp: new Date().toISOString()
                }
            };
        } else {
            beacon = {
                type: 'ivb',
                referrer: document.referrer,
                keen: {
                    timestamp: new Date().toISOString()
                }
            };
        }
        return beacon;
    }

    function setDetailView() {
        var source = $("#entry-template").html();
        var template = Handlebars.compile(source);

        // clixie?
        if (ac.extra.clixie_vid_uuid && ac.extra.clixie_vid_uuid != "0") {
            ac.isClixie = true;
        }

        var compiledTemplate = template(ac);
        $('#entryOutput').html(compiledTemplate);
    }

    function setSocial(social_url, social_url_short, website, creative) {
        // console.log('social_url: ', social_url);
        // console.log('social_url_short: ', social_url_short);
        // console.log('website: ', website);
        // console.log(creative);

        if (website) {
            if (ac.vertical && ac.vertical.toLowerCase() != "employment") {
                $('#card-footer .apply p').text('Visit Website');
            }
            $('#card-footer .apply').show();
            $('#card-footer .apply').attr('href', website);
            $('#card-footer').removeClass('reverse');
        } else {
            $('#card-footer .apply').hide();
            $('#card-footer').addClass('reverse');
        }

        if (social_url) {
            $('#card-footer .share').show();

            var message = encodeURIComponent(window.DMC.Native.data.publisher + ': ' + window.DMC.Native.data.headline + ', ' + social_url);

            //social_url_short?
            if (!social_url_short) {
                social_url_short = social_url;
            }

            if (creative) {
                if (ac.vertical.toLowerCase() == "retail" || ac.vertical.toLowerCase() == "real estate") {
                    message = encodeURIComponent('Check out this video from ' + creative.advertiser + ', ' + social_url_short);
                } else {
                    message = encodeURIComponent(creative.advertiser + ' has an opening for ' + creative.tagline + '! Check out this video, ' + social_url_short);
                }
            }

            //set facebook
            var fb = 'https://www.facebook.com/dialog/feed?app_id=484257678295938&display=popup&redirect_uri=';
            fb = fb + encodeURIComponent(social_url) + '&link=' + encodeURIComponent(social_url) + '&caption=' + encodeURIComponent(window.DMC.Native.data.publisher + ': ' + window.DMC.Native.data.headline);
            $('#card-footer .fb').attr('href', fb);

            // force short_url for Twitter and SMS
            if (!creative && social_url_short) {
                message = encodeURIComponent(window.DMC.Native.data.publisher + ': ' + window.DMC.Native.data.headline + ', ' + social_url_short);
            }

            //set twitter
            var twitter = 'https://twitter.com/intent/tweet?text=';
            twitter = twitter + message;
            $('#card-footer .twitter').attr('href', twitter);

            //set sms
            var sms = 'sms://&body=';
            sms = sms + message;
            $('#card-footer .sms').attr('href', sms);
        } else {
            $('#card-footer .share').hide();
            $('#card-footer').addClass('reverse');
        }
    }

    initCard();
});