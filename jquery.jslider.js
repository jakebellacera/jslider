/*
 * jslider - An advanced content slider
 * ====================================
 * @version v0.5
 * @url     http://github.com/jakebellacera/jslider
 * @author  (c) Jake Bellacera - http://github.com/jakebellacera
 */


(function (window, $) {

    'use strict';

    var $event = $.event,
        resizeTimeout;

    $event.special.smartresize = {
        setup: function () {
            $(this).bind("resize", $event.special.smartresize.handler);
        },
        teardown: function () {
            $(this).unbind("resize", $event.special.smartresize.handler);
        },
        handler: function (event, execAsap) {
            // Save the context
            var context = this,
                args = arguments;

            // set correct event type
            event.type = "smartresize";

            if (resizeTimeout) { clearTimeout(resizeTimeout); }
            resizeTimeout = setTimeout(function () { $.event.handle.apply(context, args); }, execAsap === "execAsap" ? 0 : 100);
        }
    };

    $.fn.smartresize = function (fn) {
        return fn ? this.bind("smartresize", fn) : this.trigger("smartresize", ["execAsap"]);
    };

    $.fn.jslider = function (options, callback) {

        function repeat(str, n) {
            var derp = [];
            derp.length = n + 1;
            return derp.join(str);
        }

        $(this).each(function (key, val) {
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
                    visible: 1,                     // Amount of slides visible at a time.
                    transition: 'slide',            // Type of transition [slide/crossfade/fade/cut].
                    direction: 'normal',            // direction of the sliding transition. Will not work if transition != slide.
                    looping: true,                  // True: loops back to beginning/end. Infinite: Infinite looping mode.
                    speed: 800,                     // Animation speed. If transition == 'cut', this is ignored.
                    easing: 'swing',                // jQuery.easing.
                    buttons: true,                  // Enable prev/next buttons.
                    nextText: 'Next Slide',         // Text for next button. HTML is allowed.
                    prevText: 'Previous Slide',     // Text for prev button. HTML is allowed.
                    auto: true,                     // Determine if the slider transitions automatically.
                    duration: 5000,                 // Duration each slide shows. Only works if auto: true.
                    hoverPause: true,               // Hovering over the .boundary pauses the timer. Only works if auto: true.
                    fluid: false                    // Enable responsive sizing (binds the dimension function to the window.resize).
                }, options),

                init = function () {
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
                    if (settings.looping === 'infinite' && settings.transition === 'slide') {

                        $frames = $container.children();

                        // pad slides with empty elements if required
                        if ($frames.length % visibleFrames !== 0) {
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
                    if (settings.looping === 'infinite' && settings.transition === 'slide') {
                        // remove excess padding frames
                        slides = Math.ceil(($frames.length - 2) / visibleFrames);
                    } else {
                        slides = Math.ceil($frames.length / visibleFrames);
                    }

                    $frames.addClass('slider-frame');

                    // Some styling for the individual frames
                    if (settings.transition === 'slide') {
                        $frames.css('float', 'left');
                    } else if (settings.transition === 'slide' && settings.direction === 'inverse') {
                        $frames.css('float', 'right');
                    } else {
                        $container.css('position', 'relative');
                        $frames.css('position', 'absolute').slice(currentSlide, slides).css('display', 'none');
                    }

                    /* Append buttons */
                    if (settings.buttons) {
                        $prevButton = $('<a class="slider-button slider-prev"/>')
                                            .html(settings.prevText)
                                            .on('click', function (e) {
                                                if (!$(this).hasClass('disabled')) {
                                                    gotoSlide(currentSlide - 1);
                                                }
                                                e.preventDefault();
                                            })
                                            .appendTo($wrapper);
                        $nextButton = $('<a class="slider-button slider-next"/>')
                                            .html(settings.nextText)
                                            .on('click', function (e) {
                                                if (!$(this).hasClass('disabled')) {
                                                    gotoSlide(currentSlide + 1);
                                                }
                                                e.preventDefault();
                                            })
                                            .appendTo($wrapper);
                    }

                    calculateFrameSize();

                    if (settings.looping === 'infinite' && settings.transition === 'slide') {
                        // Since we're adding a padding frame, we need to shift forward one.
                        $container.css('margin-left', -boundaryWidth);
                    }


                    /* Start the timer */
                    if (settings.auto) {
                        startTimer(settings.duration);
                        
                        if (settings.hoverPause) {
                            $boundary.hover(function () {
                                stopTimer();
                            }, function () {
                                startTimer();
                            });
                        }
                    }

                    // Any additional bindings should be placed here

                    if (settings.fluid) {
                        $(window).on('smartresize', function () {
                            calculateFrameSize();

                            // Fix le margins
                            if (settings.transition === 'slide') {
                                var dir = function () {
                                        var value;
                                        if (settings.transition === 'vertical') {
                                            value = 'top';
                                        } else if (settings.transition === 'slide-inverse') {
                                            value = 'right';
                                        } else {
                                            value = 'left';
                                        }

                                        return value;
                                    },
                                    amount = function () {
                                        var value;
                                        if (settings.looping === 'infinite') {
                                            value = boundaryWidth*currentSlide + 1;
                                        } else {
                                            value = boundaryWidth*currentSlide;
                                        }

                                        return value;
                                    };
                                $container.css('margin-' + dir(), -amount());
                            }
                        });
                    }

                },

                calculateFrameSize = function () {
                    var width = $boundary.innerWidth(),
                        height = $boundary.innerHeight();
                    boundaryWidth = width;
                    boundaryHeight = height;
                    frameWidth = width / visibleFrames;
                    frameHeight = height;

                    // Calculate container size
                    $container.css({
                        width: function () {
                            var value;
                            if (settings.transition === 'slide' && settings.looping == 'infinite') {
                                value = (slides + 2) * width; // incorportate the cloned slides
                            } else if (settings.transition === 'slide') {
                                value = slides * width;
                            } else {
                                value = width;
                            }

                            return value;
                        },
                        height: frameHeight
                    });

                    $frames.each(function () {
                        $(this).css({
                            width: frameWidth,
                            height: frameHeight
                        });
                    });
                },

                gotoSlide = function (toSlide) {
                    // Handles slide navigation
                    var delay;

                    if (settings.looping === true || settings.looping && settings.transition !== 'slide') {
                        if (toSlide > slides) {
                            gotoSlide(1);
                            return;
                        } else if (toSlide <= 0) {
                            gotoSlide(slides);
                            return;
                        }
                    } else if (!settings.looping) {
                        if (toSlide > slides || toSlide <= 0) { return; }
                    }

                    // Kill the timer
                    stopTimer();

                    // Perform the animation
                    switch(settings.transition) {
                        case 'slide':
                            slide(toSlide, settings.direction);
                            delay = settings.speed;
                            break;
                        case 'crossfade':
                            fade(toSlide, true);
                            delay = settings.speed;
                            break;
                        case 'fade':
                            fade(toSlide);
                            delay = settings.speed;
                            break;
                        default:
                            cut(toSlide);
                            delay = 0;
                            break;
                    }

                    setTimeout(function() {
                        startTimer();
                    }, delay)


                    if (!settings.looping && settings.buttons) {
                        // Sets 'previous' button to disabled if on first frame
                        if (currentSlide === 1) {
                            $prevButton.addClass('disabled');
                        } else {
                            $prevButton.removeClass('disabled');
                        }
                            
                        // Sets 'next' button to disabled if on last frame
                        if (currentSlide === slides) {
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
                slide = function (toSlide, direction) {

                    var dir = toSlide < currentSlide ? -1 : 1,
                        n = settings.looping !== 'infinite' ? toSlide - 1 : toSlide,
                        position = frameWidth * visibleFrames * n;
                    
                    if (direction === 'inverse') {
                        
                        // Inversed slide transition ()
                        $container.filter(':not(:animated)').animate({
                            'margin-right': -position
                        }, settings.speed, settings.easing, function () {
                            checkSlide('right');
                        });

                    } else if (direction === 'vertical') {
                        
                        // Vertical slide transition (ttb)
                        $container.filter(':not(:animated)').animate({
                            marginTop: -position
                        }, settings.speed, settings.easing, function () {
                            checkSlide('top');
                        });

                    } else {

                        // Basic slide transition (ltr)
                        $container.filter(':not(:animated)').animate({
                            'margin-left': -position
                        }, settings.speed, settings.easing, function () {
                            checkSlide('left');
                        });

                    }

                    function checkSlide (marginDir) {

                        var dimension = function () {
                            var value;
                            if (marginDir === 'top' || marginDir === 'bottom') {
                                value = boundaryHeight;
                            } else {
                                value = boundaryWidth;
                            }

                            return value;
                        };

                        currentSlide = toSlide;

                        if (toSlide > slides) {

                            currentSlide = 1;
                            $container.css('margin-' + marginDir, -dimension());

                        } else if (settings.looping === 'infinite' && toSlide === 0) {

                            currentSlide = slides;
                            $container.css('margin-' + marginDir, -dimension() * (slides));

                        }

                        $frames.eq(settings.looping !== 'infinite' ? currentSlide - 1 : currentSlide).addClass('active').siblings().removeClass('active');
                    }
                    
                },

                fade = function (toSlide, crossfade) {
                    // Hide all the frames, show the current slide, fade in the next slide.
                    var actualSlide = toSlide - 1,
                        otherSlide = currentSlide - 1;

                    if (crossfade) {
                        $frames.removeClass('active').hide().css('z-index', 1);
                        $frames.eq(otherSlide).show(0, function() {
                            $frames.eq(actualSlide).css('z-index', 2).addClass('active').fadeIn(settings.speed);
                        });
                    } else {
                        $frames.eq(otherSlide).fadeOut(settings.speed);
                        $frames.eq(actualSlide).fadeIn(settings.speed);
                    }

                    currentSlide = toSlide;
                },

                cut = function (toSlide) {

                    var actualSlide = toSlide - 1;
                    currentSlide = toSlide;
                        
                    $frames.eq(actualSlide).show().addClass('active').siblings().hide().removeClass('active');
                        
                },

                /**
                 * Timers
                 */
                startTimer = function () {
                    auto = setTimeout(function () {
                        gotoSlide(currentSlide + 1);
                    }, settings.duration);
                },
                
                stopTimer = function () {
                    if (settings.auto !== false){
                        clearTimeout(auto);
                    }
                };

            init();
        });
    };
}(window, jQuery));
