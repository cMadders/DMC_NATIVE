// $(document).ready(function() {
// console.log("mvp ready");

// $('.dmc-thumbnail').click(function(event) {
//     event.preventDefault();
//     if ($(this).width() == 200) {
//         TweenLite.to($(this), 1, {
//             width: "100px",
//             height: "80px"
//         });
//     } else {
//         TweenLite.to($(this), 1, {
//             width: "200px",
//             height: "150px"
//         });
//     }
// });

// function initialize(adunitID) {
//     alert('HOORAY: ' + adunitID);
// }

// // notify mothership that you're ready to intialize
// window.dmcNative.ready(this.initialize);

// });


(function() {

    var uuid;
    var template;

    var newInstance = function(uuid) {
        // console.log('uuid',uuid);
        return (function(uuid) {
            console.log('new instance', uuid);
            $('#' + uuid).addClass('native-adunit');
            $('#' + uuid).css('cursor', 'pointer');

            //INITIALIZE
            var adunitWidth;
            var adunitHeight;
            var adunitTop;
            var adunitLeft;
            var viewportTop;


            // init wall view
            $.each($('#wall-items .item'), function(index, val) {
                /* iterate through array or object */
                // console.log('index: ' + index);
                $(this).find('.thumbnail').css('backgroundImage', 'url(' + $(this).data('logo') + ')');
            });


            $('body, #extreme-native-card').addClass('card-single');

            // $('html').addClass('native-no-scroll');
            // $('html').css('height', window.innerHeight);
            // $('html').css('overflow', 'hidden');

            $('img.logo').click(function(event) {
                /* Act on the event */
                $("#extreme-native-content").scrollTop(0);
                $('#extreme-native-card').css('top', 0);
            });

            // HEADER NAVIGATION
            $('.back').click(function(event) {
                event.preventDefault();
                $('#wall-item-detail').removeClass('trans-in');
                $('.category-list').show();
                $('.back').hide();
            });


            // CONTROLLER
            $('#controller button').click(function(event) {
                event.preventDefault();
                $('#controller button').removeClass('button-primary');
                $(this).addClass('button-primary');
                if ($(this).attr('name') === 'card-wall') {
                    $('body').removeClass('card-single').addClass('card-wall');
                    $('#extreme-native-card').removeClass('card-single').addClass('card-wall');
                    $('#wall').addClass('list-items');
                } else {
                    $('body').removeClass('card-wall').addClass('card-single');
                    $('#extreme-native-card').removeClass('card-wall').addClass('card-single');
                }
            });


            $('#wall-items .item').click(function(event) {
                event.preventDefault();
                $('#extreme-native-card').addClass('card-wall-detail');
                $("#extreme-native-content").scrollTop(0);
                // populate detail pane
                populateDetailPane($(this));
                // animate-in detail pane
                $('#wall-item-detail').addClass('trans-in');
                $('.category-list').hide();
                $('.back').show();
                //
            });


            function populateDetailPane($unit) {
                //add detail pane to card
                $('#item-detail .title').text($unit.data('tagline'));
                $('#item-detail .tagline').text($unit.data('title'));
                $('#item-detail .logo').attr('src', $unit.data('logo'));
                $('#item-detail video').attr('poster', $unit.data('logo'));
                $('#item-detail video').attr('src', $unit.data('mp4'));
                $('#call-to-action a').attr('href', $unit.data('website'));
                var description = ($unit.data('description')) ? $unit.data('description') : 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vel elit viverra, pulvinar purus in, sodales elit. Phasellus lorem neque, pretium sit amet tortor eu, aliquet placerat odio.';
                $('#item-detail .description').text(description);
            }

            // adunit clicked, trigger card
            $('#' + uuid).on("click", function() {
                // event.preventDefault();
                // event.stopPropagation();
                console.log('clicked');

                var $unit = $(this);

                // disable body scroll
                $('body').addClass('native-no-scroll');

                // ensure card contents are at top
                $("#extreme-native-content").scrollTop(0);

                // add adunit silhouette to page for animation effect
                $('body').append('<div class="silhouette"></div>');

                // add module overlay backdrop
                $('body').append('<div class="md-overlay"></div>');

                // animation listener
                $('.silhouette').on('webkitTransitionEnd oTransitionEnd msTransitionEnd',
                    function(e) {
                        $('.silhouette').addClass('fill-viewport').css('top', viewportTop).height($(window).height()).width($(window).width()).css('left', 0).css('opacity', 1);
                        // show card on silhouette "open" complete
                        if (e.target.className === 'silhouette fill-adunit fill-viewport' && e.originalEvent.propertyName === 'opacity') {
                            console.log('animation complete');

                            // populate detail pane
                            populateDetailPane($unit);

                            //slp or ivb?
                            if ($('body').hasClass('card-wall')) {
                                $('#wall-item-detail').append($('#item-detail'));
                            } else {
                                $('#card-item').append($('#item-detail'));
                            }

                            //show card contents
                            $('#extreme-native-card').addClass('show-card');

                            // autoplay video
                            // document.getElementById('dmc-native-video-player').play();
                        }
                    });

                adunitTop = $(this).offset().top;
                adunitLeft = $(this).offset().left;
                adunitWidth = $(this).width();
                adunitHeight = $(this).height();
                viewportTop = $(document).scrollTop();

                // animate silhouette open
                $('.md-overlay').addClass('show');

                //initialize
                var siloTop = adunitTop + (adunitHeight / 2) - ($('.silhouette').height() / 2);
                // var siloTop = adunitTop;
                $('.silhouette').css('top', siloTop + 'px').css('opacity', '.9').width(adunitWidth).css('left', adunitLeft);

                //animate
                $('.silhouette').addClass('fill-adunit').height(adunitHeight).css('top', adunitTop);

                // set top position of card relative to viewport top
                $('#extreme-native-card').css('top', viewportTop);

                // set content height
                var contentHeight = $(window).height() - $('#extreme-native-card header').height() - 53; //footer height = 53
                $('#extreme-native-content').height(contentHeight + 'px');
            });

            // close card
            $('#extreme-native-card .close').click(function(event) {
                event.preventDefault();
                // document.getElementById('dmc-native-video-player').currentTime = 0;
                // document.getElementById('dmc-native-video-player').pause();
                $('#extreme-native-card').removeClass('show-card').removeClass('card-wall-detail');

                $('.category-list').show();
                $('.back').hide();

                closeSilohette();
            });

            //close silhouette animation (reverse)
            function closeSilohette() {
                $('.md-overlay').remove();
                $('.silhouette').one('webkitTransitionEnd oTransitionEnd msTransitionEnd',
                    function(e) {
                        e.preventDefault();
                        $('body').removeClass('native-no-scroll');
                        $('.silhouette').remove();
                    });

                $('.silhouette').removeClass('fill-viewport').removeClass('fill-adunit').addClass('shrink').css('top', adunitTop).height(adunitHeight).width(adunitWidth).css('left', adunitLeft);
            }

            // $('#' + uuid).click(function(event) {
            //     event.preventDefault();
            //     console.log('click');
            //     if ($(this).find('.dmc-thumbnail').width() == 200) {
            //         TweenLite.to($(this).find('.dmc-thumbnail'), 0.5, {
            //             width: "100px",
            //             height: "80px",
            //             ease: Power2.easeOut
            //         });
            //     } else {
            //         TweenLite.to($(this).find('.dmc-thumbnail'), 0.5, {
            //             width: "200px",
            //             height: "150px",
            //             ease: Power2.easeOut
            //         });
            //     }
            // });
        })(uuid);
    };

    function initialize(uuid, template) {
        // console.log('ad unit initialize', uuid);

        //get new object that contains functions and such - scoped to uuid

        if (typeof jQuery === 'undefined') {
            // jQuery is NOT available
            // console.warn('jquery not avail yet.. hold');
        } else {
            // jQuery is available
            // console.log('jquery available');
            // alert('HOORAY: ' + uuid);
            newInstance(uuid);
            // this.uuid = uuid;
            // this.template = template;
            // this.json = json;
            // writeTemplate(template);
            // $('.dmc-adunit').addClass('native-adunit');
            // $('.dmc-adunit').css('cursor', 'pointer');
            // $('.dmc-adunit').click(function(event) {
            //     event.preventDefault();
            //     if ($(this).find('.dmc-thumbnail').width() == 200) {
            //         TweenLite.to($(this).find('.dmc-thumbnail'), .5, {
            //             width: "100px",
            //             height: "80px",
            //             ease: Power2.easeOut
            //         });
            //     } else {
            //         TweenLite.to($(this).find('.dmc-thumbnail'), .5, {
            //             width: "200px",
            //             height: "150px",
            //             ease: Power2.easeOut
            //         });
            //     }
            // });
        }
    }

    // function writeTemplate(template) {
    //     // console.log(document.currentScript);
    //     console.log('writeTemplate', template);
    //     $container = null;
    //     var readyToInit = $('.dmc-native-container[data-established!="true"]');
    //     if (readyToInit && readyToInit.length > 0) {
    //         $container = $(readyToInit[0]);
    //     } else {
    //         $container = $(readyToInit);
    //     }
    //     // console.log($container);
    //     $container.html(template);
    //     $container.attr('data-established', 'true');
    //     // $('#' + this.uuid).fadeIn('slow');

    //     // var container = document.getElementById('container');
    //     // if (container) {
    //     //     container.innerHTML = template;
    //     // }
    // }

    // notify mothership that you're ready to intialize
    window.dmcNative.activate(initialize);
})();

