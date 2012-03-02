(function(window, $, undefined) {

    'use strict';

    var $event = $.event,
        resizeTimeout;

    $event.special.smartresize = {
        setup: function() {
          $(this).bind( "resize", $event.special.smartresize.handler );
        },
        teardown: function() {
          $(this).unbind( "resize", $event.special.smartresize.handler );
        },
        handler: function( event, execAsap ) {
          // Save the context
          var context = this,
              args = arguments;

          // set correct event type
          event.type = "smartresize";

          if ( resizeTimeout ) { clearTimeout( resizeTimeout ); }
          resizeTimeout = setTimeout(function() {
            jQuery.event.handle.apply( context, args );
          }, execAsap === "execAsap"? 0 : 100 );
        }
      };

      $.fn.smartresize = function( fn ) {
        return fn ? this.bind( "smartresize", fn ) : this.trigger( "smartresize", ["execAsap"] );
      };

    $.fn.infinitescroll = function(options, callback) {

        function repeat(str, n) {
            return new Array(n + 1).join(str);
        }

        /*
         * Notes
         * =====
         * wrapper                  - holds it all
         *     buttons              - next/prev buttons
         *     pagination           - shows a slide's pagination
         *     boundary             - visible window
         *         container        - contains frames
         *             slide        - nonexistent, just saved in memory
         *                 frame    - an individual item
         */

        $(this).each(function(key, val) {
            var $this = $(this),
                $wrapper,
                $boundary,
                boundaryHeight = 0,
                boundaryWidth = 0,
                $container,
                $frames,
                frameWidth = 0,
                frameHeight = 0,
                frameCount = 0,
                $prevButton,
                $nextButton,
                $pagination,
                auto,
                visibleFrames,
                slides,
                currentSlide = 1,
                settings = $.extend({
                    visible: 1,             // amount of slides visible at a time
                    transition: 'slide',    // type of transition [slide/slide-inverse/fade] 
                    looping: true,          // infinite looping mode
                    speed: 800,
                    easing: 'easeOutExpo',
                    buttons: true,
                    nextText: 'Next Slide',
                    prevText: 'Previous Slide',
                    direction: 'normal',
                    auto: true,
                    duration: 5000,
                    hoverPause: true,
                    fluid: true
                }, options),

            _init = function() {
                //Set how many frames are per slide
                visibleFrames = Math.ceil(settings.visible);

                // Wrapper: contains the entire slider.
                $wrapper = $this
                                .addClass('slider-wrapper')
                                .css('position', 'relative');

                // Boundary: the visibile viewport.
                // This element requires width/height set in CSS.
                // Recommended: set overflow: hidden; in CSS as well to prevent "jump"
                $boundary = $wrapper.wrapInner('<div/>').children()
                                .addClass('slider-boundary')
                                .css('overflow', 'hidden');

                // Container: contains all of the frames
                $container = $boundary.wrapInner('<div/>').children()
                                .addClass('slider-container')
                                .css('overflow', 'hidden');

                /* Additional formatting to produce the infinite effect. */
                if(settings.looping === 'infinite' && settings.transition === 'slide') {

                    $frames = $container.children();

                    // pad slides with empty elements if required
                    if ($frames.length % visibleFrames != 0) {
                        // Find the remaining amount of slides required to finish the last slide.
                        $container.append(repeat('<div class="empty"/>', visibleFrames - ($frames.length % visibleFrames)));
                    }

                    $frames = $container.children();

                    $frames.filter(':first').before(
                        $frames.slice(-visibleFrames).clone().addClass('cloned')
                    );
                    $frames.filter(':last').after(
                        $frames.slice(0, visibleFrames).clone().addClass('cloned')
                    );
                }

                $frames = $container.children();

                // How many slides will we be transitioning.
                if (settings.looping === 'infinite') {
                    // remove excess padding frames
                    slides = Math.ceil(($frames.length - 2) / visibleFrames);
                } else {
                    slides = Math.ceil($frames.length / visibleFrames);
                }

                $frames.addClass('slider-frame');
                
                // Some styling for the individual frames
                if (settings.transition == 'slide') {
                    $frames.css('float', 'left');
                } else if (settings.transition == 'slide-inverse') {
                    $frames.css('float', 'right');
                }

                /* Append buttons */
                if (settings.buttons) {
                    $prevButton = $('<a class="slider-button slider-prev"/>')
                                        .html(settings.prevText)
                                        .on('click', function(e) {
                                            if (!$(this).hasClass('disabled')) {
                                                _gotoSlide(currentSlide - 1);
                                            }
                                            e.preventDefault();
                                        })
                                        .appendTo($wrapper);
                    $nextButton = $('<a class="slider-button slider-next"/>')
                                        .html(settings.nextText)
                                        .on('click', function(e) {
                                            if (!$(this).hasClass('disabled')) {
                                                _gotoSlide(currentSlide + 1);
                                            }
                                            e.preventDefault();
                                        })
                                        .appendTo($wrapper);
                }

                _calculateFrameSize();

                if (settings.looping === 'infinite') {
                    // Since we're adding a padding frame, we need to shift forward one.
                    $container.css('margin-left', -boundaryWidth);
                }


                /* Start the timer */
                if(settings.auto) {
                    _startTimer(settings.duration);
                    
                    if(settings.hoverPause) {
                        $boundary.hover(function() {
                            _stopTimer();
                        }, function() {
                            _startTimer();
                        });
                    }
                }

                // Any additional bindings should be placed here

                if (settings.fluid) {
                    $(window).on('smartresize', function() {
                        _calculateFrameSize();

                        // Fix le margins
                        if ( settings.transition === 'slide' ) {
                            var dir = function () {
                                    if ( settings.transition === 'vertical' ) {
                                        return 'top';
                                    } else if ( settings.transition === 'slide-inverse' ) {
                                        return 'right';
                                    } else {
                                        return 'left';
                                    }
                                },
                                amount = function () {
                                    if( settings.looping === 'infinite') {
                                        return boundaryWidth*currentSlide + 1;
                                    } else {
                                        return boundaryWidth*currentSlide;
                                    }
                                };
                            $container.css('margin-' + dir(), -amount())
                        }
                    });
                }

            },

            _calculateFrameSize = function () {
                var width = $boundary.innerWidth(),
                    height = $boundary.innerHeight();
                boundaryWidth = width;
                boundaryHeight = height;
                frameWidth = width / visibleFrames;
                frameHeight = height;

                // Calculate container size
                $container.css({
                    width: function () {
                            if(settings.transition === 'slide') {
                                return $frames.length * width;
                            } else {
                                return $frames.length * width;
                            }
                        },
                    height: frameHeight
                });

                $frames.each(function() {
                    $(this).css({
                        width: frameWidth,
                        height: frameHeight
                    })
                });
            },

            _gotoSlide = function (toSlide) {
                // Handles slide navigation

                if(settings.looping !== 'infinite' && settings.looping) {
                    if(toSlide > slides) {
                        _gotoSlide(1);
                        return;
                    } else if (toSlide <= 0) {
                        _gotoSlide(slides);
                        return;
                    }
                } else if(!settings.looping) {
                    if (toSlide > slides || toSlide <= 0) return;
                }

                // Perform the animation
                switch(settings.transition) {
                    case 'slide':
                        _slide(toSlide, settings.direction);
                        break;
                    default:
                        _cut(toSlide);
                        break;
                };


                if(!settings.looping && settings.buttons) {
                    // Sets 'previous' button to disabled if on first frame
                    if(currentSlide === 1) {
                        $prevButton.addClass('disabled');
                    } else {
                        $prevButton.removeClass('disabled');
                    }
                        
                    // Sets 'next' button to disabled if on last frame
                    if(currentSlide === slides) {
                        $nextButton.addClass('disabled');
                    } else {
                        $nextButton.removeClass('disabled');
                    }
                }
            },

            /**
             * Transitions
             */

            // Slide - slides through the frames
            _slide = function (toSlide, direction) {

                var dir = toSlide < currentSlide ? -1 : 1,
                    n = toSlide,
                    position = frameWidth * visibleFrames * n;
                
                if(direction == 'inverse') {
                    
                    // Inversed slide transition ()
                    $container.filter(':not(:animated)').animate({
                        'margin-right': -position
                    }, settings.speed, settings.easing, function() {
                        checkSlide('right')
                    });

                } else if(direction == 'vertical') {
                    
                    // Vertical slide transition (ttb)
                    $container.filter(':not(:animated)').animate({
                        marginTop: -position
                    }, settings.speed, settings.easing, function() {
                        checkSlide('top')
                    });

                } else {

                    // Basic slide transition (ltr)
                    $container.filter(':not(:animated)').animate({
                        'margin-left': -position
                    }, settings.speed, settings.easing, function() {
                        checkSlide('left')
                    });

                }

                function checkSlide(marginDir) {

                    var dimension = function() {
                        if (marginDir == ('top' || 'bottom')) {
                            return boundaryHeight;
                        } else {
                            return boundaryWidth;
                        }
                    };

                    currentSlide = toSlide;

                    if (toSlide > slides) {

                        currentSlide = 1;
                        $container.css('margin-' + marginDir, -dimension());

                    } else if (settings.looping === 'infinite' && toSlide == 0) {

                        currentSlide = slides;
                        $container.css('margin-' + marginDir, -dimension() * (slides));

                    }

                    $frames.eq(currentSlide).addClass('active').siblings().removeClass('active');
                }
                
            },

            /**
             * Timers
             */
            _startTimer = function() {
                auto = setInterval(function() {
                    _gotoSlide(currentSlide + 1);
                }, settings.duration);
            },
            
            _stopTimer = function() {
                if(settings.auto !== false){
                    clearInterval(auto);
                }
            };

            _init();
        });
    }
})(window, jQuery);
