/*
 * jslider - An advanced content slider
 * ====================================
 * @version:    v0.7b
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
    if (!window.jQuery.fn.smartresize) {
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
    }

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
                    } else if (settings.transition === 'slide') {
                        $container.css('position', 'absolute');
                    } else {
                        $container.css('position', 'relative');
                        $frames.slice(currentSlide * settings.visible, settings.visible * slides).css('display', 'none');
                    }

                    $frames.css('position', 'absolute');
                    
                    // Adding "last" class to each last frame in a slide
                    if (settings.visible > 1) {
                        $frames.each(function (i, val) { if (i % settings.visible === (settings.visible - 1)) { val.classList.add('last'); } });
                    }

                    // Append buttons, if enabled
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

                    // Calculate initial offset margins on $container
                    if (settings.transition === 'slide' && settings.looping === 'infinite') {
                        $container.css((function() {
                            var value;

                            if (settings.direction === 'inverse') {
                                value = 'margin-right';
                            } else {
                                value = 'margin-left';
                            }

                            return value;
                        }()), -boundaryWidth - settings.gutterWidth);
                    }

                    // Any additional bindings should be placed here

                    // Responsive sliders
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

                                if (slides > 1) {
                                    amount = -currentSlide * (boundaryWidth + settings.gutterWidth)
                                } else {
                                    amount = 0;
                                }

                                styles['margin-' + dir] = amount;

                                $container.css(styles);
                            }
                        });
                    }

                    // Determine if we need to perform an offset for selecting frames
                    currentOffset = settings.transition !== 'slide' || settings.looping !== 'infinite' && settings.transition === 'slide' ? 1 : 0;

                    setActiveSlides();

                    // Start the timer initially if auto
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

                },

                setActiveSlides = function() {
                    // Handles setting active slides.

                    $activeFrames = $frames.slice((currentSlide - currentOffset) * settings.visible, ((currentSlide - currentOffset) + 1) * settings.visible);

                    $frames.removeClass('active');
                    $activeFrames.addClass('active');
                },

                calculateFrameSize = function () {
                    // Calculates sizes. Needs to be abstracted to DRY up fluid layouts

                    var width = $boundary.innerWidth(),
                        height = $boundary.innerHeight(),
                        i = 0,
                        pos = settings.gutterWidth;
                    boundaryWidth = width;
                    boundaryHeight = height;
                    frameWidth = (width - (settings.gutterWidth * (settings.visible - 1))) / settings.visible;
                    frameHeight = height;

                    $container.css({
                        width: function () {
                            var value,
                                slidesAmount = settings.transition === 'slide' && settings.looping === 'infinite' ? slides + 2 : slides;

                            if (settings.transition === 'slide') {
                                value = slidesAmount * width;
                            } else {
                                value = width;
                            }

                            return value + (settings.gutterWidth * slidesAmount * settings.visible);
                        },
                        height: frameHeight
                    });

                    $frames.each(function (key, val) {
                        // Loop through each frame
                        var distance = frameWidth + settings.gutterWidth,
                            styles = {
                                width: frameWidth,
                                height: frameHeight
                            };
                        
                        // Reset the counter if needed
                        if (settings.transition !== 'slide' && i == settings.visible) {
                            i = 0; // reset the counter
                        }

                        pos = distance * i;

                        // We need to ensure that positioning are places on right/left depending on the direction
                        if (settings.transition === 'slide' && settings.direction === 'inverse') {
                            styles.right = pos;
                        } else {
                            styles.left = pos;
                        }
                        
                        $(this).css(styles);

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

                slide = function (toSlide, direction) {
                    // Slide - slides through the frames

                    var dir = toSlide < currentSlide ? -1 : 1,
                        distance = (boundaryWidth * dir) + (settings.gutterWidth * dir),
                        marginDir = settings.direction === 'inverse' ? 'right' : 'left',
                        animations = {};

                    if (settings.looping === true && toSlide === 1) {
                        // If we exceeded the slide count, to back to 0
                        animations['margin-' + marginDir] = 0;
                        currentSlide = 1;
                    } else if (settings.looping === true && toSlide === (slides + 1)) {
                        // We're going too far back, we need to go to the end
                        animations['margin-' + marginDir] = distance * slides;
                        currentSlide = slides;
                    } else {
                        // Normal movement
                        animations['margin-' + marginDir] = '-=' + distance;
                        currentSlide = toSlide;
                    }
                    
                    $container.filter(':not(:animated)').animate(animations, settings.speed, settings.easing, checkSlide);
                    

                    function checkSlide () {
                    // With the cloned slides, we can alter margins AFTER an
                    // animation has been completed to give the infinite looping effect

                        if (settings.looping === 'infinite') {
                            if (toSlide > slides) {
                                // If too far forward, we need to silently shift back to the first slide.
                                currentSlide = 1;
                                $container.css('margin-' + marginDir, -distance);

                            } else if (settings.looping === 'infinite' && toSlide === 0) {
                                // If too far back, we need to silently shift to the last slide.
                                currentSlide = slides;
                                $container.css('margin-' + marginDir, distance * slides);
                            }
                        }

                        startTimer();
                        setActiveSlides();
                    }
                },

                fade = function (toSlide, crossfade) {
                    // Fade - fade out the previous frames, fade in the current ones

                    var actualSlide = settings.visible <= 1 ? toSlide - 1 : (toSlide - 1) * settings.visible,
                        otherSlide = settings.visible <= 1 ? currentSlide - 1 : (currentSlide - 1) * settings.visible,
                        offset = function (input) {
                            return input + settings.visible;
                        },
                        $actualSlides = $frames.slice(actualSlide, offset(actualSlide)),
                        $otherSlides = $frames.slice(otherSlide, offset(otherSlide));

                    if (crossfade) {
                        $frames.hide().css('z-index', 1);
                        $otherSlides.show(0, function() {
                            $actualSlides.css('z-index', 2).fadeIn(settings.speed, function() {
                                startTimer();
                                setActiveSlides();
                            });
                        });
                    } else {
                        $otherSlides.fadeOut(settings.speed);
                        $actualSlides.fadeIn(settings.speed, function() {
                            startTimer();
                            setActiveSlides();
                        });
                    }

                    currentSlide = toSlide;
                },

                cut = function (toSlide) {
                    // Cut - hide previous frames, show the current ones

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
                    // Handles starting the timer

                    if (settings.auto && slides > 1) {
                        clearTimeout(auto);
                        auto = setTimeout(function () {
                            gotoSlide(currentSlide + 1);
                        }, settings.duration);
                    }
                },
                
                stopTimer = function () {
                    // Stops the timer

                    if (settings.auto){
                        clearTimeout(auto);
                    }
                };

            init();
        });
    };
}(window, jQuery));
