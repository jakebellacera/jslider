/*
 * jslider - An advanced content slider
 * ====================================
 * @version:    v0.7a
 * @url:        http://github.com/jakebellacera/jslider
 * @author:     (c) Jake Bellacera - http://github.com/jakebellacera
 */


(function (window, $) {

    'use strict';

    /*
        SmartResize plugin for debulking resizes.
        TODO: Add a check to see if smartresize was already added, or namespace it.
        @url: https://github.com/louisremi/jquery-smartresize
    */
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

    /* The jSlider plugin */
    $.fn.jslider = function (options, callback) {

        function repeat(str, n) {
            var items = [];
            items.length = n + 1;
            return items.join(str);
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
                slides,
                currentSlide = 1,
                currentOffset,
                $activeFrames,
                settings = $.extend({
                    visible: 1,                     // Amount of slides visible at a time.
                    gutterWidth: 0,                 // Spacing between slides. <= 0 means none.
                    transition: 'slide',            // Type of transition [slide/crossfade/fade/cut].
                    direction: 'normal',            // direction of the sliding transition. Will not work if transition != slide.
                    looping: true,                  // True: loops back to beginning/end. Infinite: Infinite looping mode.
                    speed: 800,                     // Animation speed. If transition == 'cut', this is ignored.
                    easing: 'swing',                // Easing for the animations
                    buttons: true,                  // Enable prev/next buttons.
                    nextText: 'Next Slide',         // Text for next button. HTML is allowed.
                    prevText: 'Previous Slide',     // Text for prev button. HTML is allowed.
                    auto: true,                     // Determine if the slider transitions automatically.
                    duration: 5000,                 // Duration each slide shows. Only works if auto: true.
                    hoverPause: true,               // Hovering over the .boundary pauses the timer. Only works if auto: true.
                    fluid: false                    // Enable responsive sizing (binds the dimension function to the window.resize).
                }, options),

                init = function () {
                    // Sanitize the visible slides setting value, make sure it's >= 1
                    settings.visible = settings.visible < 1 ? 1 : Math.ceil(settings.visible);

                    // Sanitize gutterWidth, make sure it's >= 0
                    settings.gutterWidth = settings.gutterWidth < 0 ? 0 : settings.gutterWidth;

                    // Wrapper: contains the entire slider.
                    $wrapper = $this
                                    .addClass('slider-wrapper')
                                    .css('position', 'relative');

                    // Boundary: the visibile viewport.
                    // This element requires width/height set in CSS.
                    // Recommended: set overflow: hidden; in CSS as well to prevent "jump"
                    $boundary = $wrapper.wrapInner('<div/>').children()
                                    .addClass('slider-boundary')
                                    .css('overflow', 'hidden')
                                    .css('position', 'relative');

                    // Container: contains all of the frames
                    $container = $boundary.wrapInner('<div/>').children()
                                    .addClass('slider-container')
                                    .css('overflow', 'hidden');

                    /* Additional formatting to produce the infinite effect. */
                    if (settings.looping === 'infinite' && settings.transition === 'slide') {

                        $frames = $container.children();

                        if ($frames.length > settings.visible) {
                            // pad slides with empty elements if required
                            if ($frames.length % settings.visible !== 0) {
                                // Find the remaining amount of slides required to finish the last slide.
                                $container.append(repeat('<div class="empty"/>', settings.visible - ($frames.length % settings.visible)));
                            }

                            $frames = $container.children();

                            $frames.filter(':first').before(
                                $frames.slice(-settings.visible).clone().addClass('cloned')
                            );
                            $frames.filter(':last').after(
                                $frames.slice(0, settings.visible).clone().addClass('cloned')
                            );
                        }
                    }

                    $frames = $container.children();

                    // How many slides will we be transitioning.
                    if (settings.looping === 'infinite' && settings.transition === 'slide' && $frames.length > settings.visible) {
                        // remove excess padding frames
                        slides = Math.ceil(($frames.length - (settings.visible * 2)) / settings.visible);
                    } else {
                        slides = Math.ceil($frames.length / settings.visible);
                    }

                    $frames.addClass('slider-frame');

                    // Some styling for the individual frames
                    if (settings.transition === 'slide' && settings.direction === 'inverse') {
                        $container.css({
                            'position': 'absolute',
                            'right': 0
                        });
                    } else {
                        $container.css('position', 'relative');
                        $frames.slice(currentSlide * settings.visible, slides + 1).css('display', 'none');
                    }

                    $frames.css('position', 'absolute');
                    
                    // Adding "last" class to each last frame in a slide
                    if (settings.visible > 1) {
                        $frames.each(function (i, val) { if (i % settings.visible === (settings.visible - 1)) { val.classList.add('last'); } });
                    }

                    /* Append buttons */
                    if (settings.buttons && slides > 1) {
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

                    // Calculate an offset
                    $container.css(function() {
                        var dir;

                        if (settings.direction === 'inverse') {
                            dir = 'margin-right';
                        } else {
                            dir = 'margin-left';
                        }

                        return dir;
                    }, function () {
                        var amount;

                        if (settings.looping === 'infinite') {
                            amount = boundaryWidth*(currentSlide + 1);
                        } else {
                            amount = 0;
                        }

                        // Append the gutterWidth
                        return amount + settings.gutterWidth;
                    });

                    // Any additional bindings should be placed here

                    if (settings.fluid) {
                        $(window).on('smartresize', function () {
                            calculateFrameSize();

                            // Fix le margins
                            if (settings.transition === 'slide') {
                                var dir, amount, styles = {};

                                // Right or left?
                                if (settings.transition === 'slide-inverse') {
                                    dir = 'right';
                                } else {
                                    dir = 'left';
                                }

                                if (settings.looping === 'infinite') {
                                    amount = boundaryWidth*currentSlide + 1;
                                } else {
                                    amount = boundaryWidth*currentSlide;
                                }

                                // Append the gutterWidth
                                amount + settings.gutterWidth;

                                styles['margin-' + dir] = amount;

                                $container.css(styles);
                            }
                        });
                    }

                    // Determine if we need to perform an offset for selecting frames
                    currentOffset = settings.transition !== 'slide' || settings.looping !== 'infinite' && settings.transition === 'slide' ? 1 : 0;
                    setActiveSlides();

                },

                setActiveSlides = function() {
                    $activeFrames = $frames.slice((currentSlide - currentOffset) * settings.visible, ((currentSlide - currentOffset) + 1) * settings.visible);

                    $frames.removeClass('active');
                    $activeFrames.addClass('active');
                },

                calculateFrameSize = function () {
                    var width = $boundary.innerWidth(),
                        height = $boundary.innerHeight(),
                        i = 0,
                        pos = settings.gutterWidth;
                    boundaryWidth = width;
                    boundaryHeight = height;
                    frameWidth = (width - (settings.gutterWidth * (settings.visible - 1))) / settings.visible;
                    console.log(frameWidth);
                    frameHeight = height;

                    $container.css({
                        width: function () {
                            var slidesWidth = function () {
                                    var value;
                                    if (settings.transition === 'slide' && settings.looping == 'infinite') {
                                        value = (slides + 2) * width; // incorportate the cloned slides
                                    } else if (settings.transition === 'slide') {
                                        value = slides * width;
                                    } else {
                                        value = width;
                                    }
                                    return value;
                                };

                            return slidesWidth + (settings.gutterWidth * slides);
                        },
                        height: frameHeight
                    });

                    $frames.each(function (key, val) {
                        var distance = frameWidth + settings.gutterWidth;
                        // Two checks, one for the iterator, one for left

                        if (settings.transition !== 'slide' && i == settings.visible) {
                            i = 0; // reset the counter
                        }

                        console.log(i);

                        pos = (distance * i) + settings.gutterWidth;
                        
                        $(this).css({
                            width: frameWidth,
                            height: frameHeight,
                            left: pos
                        });

                        i++;
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
                        distance = boundaryWidth * dir,
                        marginDir = settings.direction === 'inverse' ? 'right' : 'left',
                        animations = {};

                    if (settings.looping === true && toSlide === 1) {
                        // exceeded the slide count, to back to 0
                        animations['margin-' + marginDir] = (settings.gutterWidth / 2);
                    } else if (settings.looping === true && toSlide === slides) {
                        // can't go negative, 
                        animations['margin-' + marginDir] = -boundaryWidth * (slides - 1) + (settings.gutterWidth / 2);
                    } else {
                        animations['margin-' + marginDir] = '-=' + distance + (settings.gutterWidth / 2);
                    }
                    
                    $container.filter(':not(:animated)').animate(animations, settings.speed, settings.easing, checkSlide);
                    

                    function checkSlide () {
                        currentSlide = toSlide;

                        if (toSlide > slides) {

                            currentSlide = 1;
                            $container.css('margin-' + marginDir, -boundaryWidth);

                        } else if (settings.looping === 'infinite' && toSlide === 0) {

                            currentSlide = slides;
                            $container.css('margin-' + marginDir, -boundaryWidth * slides);

                        }

                        startTimer();
                        setActiveSlides();
                    }
                },

                fade = function (toSlide, crossfade) {
                    // Hide all the frames, show the current slide, fade in the next slide.
                    var actualSlide = settings.visible <= 1 ? toSlide - 1 : (toSlide - 1) * settings.visible,
                        otherSlide = settings.visible <= 1 ? currentSlide - 1 : (currentSlide - 1) * settings.visible,
                        offset = function (input) {
                            return input + settings.visible;
                        };

                    if (crossfade) {
                        $frames.hide().css('z-index', 1);
                        $frames.slice(otherSlide, offset(otherSlide)).show(0, function() {
                            $frames.slice(actualSlide, offset(actualSlide)).css('z-index', 2).fadeIn(settings.speed, function() {
                                startTimer();
                                setActiveSlides();
                            });
                        });
                    } else {
                        $frames.slice(otherSlide, offset(otherSlide)).fadeOut(settings.speed);
                        $frames.slice(actualSlide, offset(actualSlide)).fadeIn(settings.speed, function() {
                            startTimer();
                            setActiveSlides();
                        });
                    }

                    currentSlide = toSlide;
                },

                cut = function (toSlide) {

                    var actualSlide = actualSlide = settings.visible <= 1 ? toSlide - 1 : (toSlide - 1) * settings.visible,
                        offset = function (input) {
                            return input + settings.visible;
                        };

                    $frames.hide().removeClass('active').slice(actualSlide, offset(actualSlide)).show(0, function() {
                        currentSlide = toSlide;

                        startTimer();
                        setActiveSlides();
                    });
                },

                /**
                 * Timers
                 */
                startTimer = function () {
                    if (settings.auto && slides > 1) {
                        clearTimeout(auto);
                        auto = setTimeout(function () {
                            gotoSlide(currentSlide + 1);
                        }, settings.duration);
                    }
                },
                
                stopTimer = function () {
                    if (settings.auto){
                        clearTimeout(auto);
                    }
                };

            init();
        });
    };
}(window, jQuery));
