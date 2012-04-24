/*
 * jslider - An advanced content slider
 * ====================================
 * @version:    v0.8
 * @url:        http://github.com/jakebellacera/jslider
 * @author:     Jake Bellacera - http://github.com/jakebellacera
 */


(function (window, $) {
    'use strict';

    var self;

    // === SmartResize =========================================================
    // @url: https://github.com/louisremi/jquery-smartresize
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
            return fn ? self.bind("smartresize", fn) : self.trigger("smartresize", ["execAsap"]);
        };
    }

    // TODO: Do something about this
    function repeat(str, n) {
        var items = [];
        items.length = n + 1;
        return items.join(str);
    }

    // === jSlider =============================================================

    // Object constructor
    $.Slider = function ( options, element ) {
        self = this;

        this.$element = $( element );

        this._create( options );
        this._init();
    };

    // Default options
    $.Slider.defaults = {
        visible: 1,                     // Amount of slides visible at a time.
        gutterWidth: 0,                 // Spacing between slides. <= 0 means none.
        transition: 'slide',            // Type of transition [slide/crossfade/fade/cut].
        incrementing: false,            // Increment per frame instead of per slide.
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
    };

    // The actual Slider object
    // TODO: Make this all work
    $.Slider.prototype = {

        // Methods with an underscore are private, without is public.

        // Runs once, creates and sets up the widget
        _create: function ( options ) {
            console.log(self);
            // Extend custom options set by the user
            self.options = $.extend( {}, $.Slider.defaults, options );

            // create the eles object for storing elements
            self.eles = {};

            // Set the current slide
            self.currentSlide = self.options.transition === 'slide' && self.options.looping === 'infinite' ? (self.options.incrementing ? self.options.visible : 1) :0;

            // Wrapper: contains the entire slider. This is the element that was determined to be the slider
            self.eles.wrapper = self.$element.addClass('slider-wrapper').css('position', 'relative');

            // Boundary: the visibile viewport.
            // This element requires width/height set in CSS.
            // Recommended: set overflow: hidden; in CSS as well to prevent "jump"
            self.eles.boundary = self.eles.wrapper
                            .wrapInner('<div/>')
                            .children()
                            .addClass('slider-boundary')
                            .css({
                                'overflow': 'hidden',
                                'position': 'relative'
                            });

            // Container: contains all of the frames
            self.eles.container = self.eles.boundary
                            .wrapInner('<div/>')
                            .children()
                            .addClass('slider-container')
                            .css('overflow', 'hidden');


            // Account for frames
            self.eles.frames = self.eles.container.children();

            if (self.eles.frames.length > self.options.visible && self.eles.frames.length % self.options.visible !== 0) {
                // Find the remaining amount of slides required to finish the last slide.
                self.eles.container.append(repeat('<div class="empty"/>', self.options.visible - (self.eles.frames.length % self.options.visible)));
            }

            // Clone first and last slides for the infinite effect
            if (self.eles.frames.length > self.options.visible && self.options.looping === 'infinite' && self.options.transition === 'slide') {
                self.eles.frames = self.eles.container.children(); // reallocate for any empty frames
                self.eles.frames.filter(':first').before(
                    self.eles.frames.slice(-self.options.visible).clone().addClass('cloned')
                );
                self.eles.frames.filter(':last').after(
                    self.eles.frames.slice(0, self.options.visible).clone().addClass('cloned')
                );

                self.eles.frames = self.eles.container.children(); // reallocate for cloned slides
            }

            // How many slides will we be transitioning.
            self.slides = self.options.transition === 'slide' && self.options.incrementing ? self.eles.frames.length - 1 : Math.ceil(self.eles.frames.length / self.options.visible);

            self.eles.frames.addClass('slider-frame');

            // Some styling for the individual frames
            if (self.options.transition === 'slide' && self.options.direction === 'inverse') {
                self.eles.container.css({
                    'position': 'absolute',
                    'right': 0
                });
            } else if (self.options.transition === 'slide') {
                self.eles.container.css('position', 'absolute');
            } else {
                self.eles.container.css('position', 'relative');
                self.eles.frames.css('display', 'none');
            }

            self.eles.frames.css('position', 'absolute');
            
            // Adding "last" class to each last frame in a slide
            if (self.options.visible > 1) {
                self.eles.frames.each(function (i, ele) {
                    if (i % self.options.visible === (self.options.visible - 1)) {
                        $(ele).addClass('last');
                    }
                });
            }

            // Append buttons, if enabled
            if (self.options.buttons && self.slides > 1) {
                self.eles.prevButton = $('<a class="slider-button slider-prev"/>')
                                    .html(self.options.prevText)
                                    .on('click', function (e) {
                                        if (!$(this).hasClass('disabled')) {
                                            self.gotoSlide(self.currentSlide - 1);
                                        }
                                        e.preventDefault();
                                    })
                                    .appendTo(self.eles.wrapper);
                self.eles.nextButton = $('<a class="slider-button slider-next"/>')
                                    .html(self.options.nextText)
                                    .on('click', function (e) {
                                        if (!$(this).hasClass('disabled')) {
                                            self.gotoSlide(self.currentSlide + 1);
                                        }
                                        e.preventDefault();
                                    })
                                    .appendTo(self.eles.wrapper);
            }
            
            self.calculateSizes();

            // Calculate initial offset margins on self.eles.container
            if (self.options.transition === 'slide' && self.options.looping === 'infinite') {
                self.eles.container.css(self.options.direction === 'inverse' ? 'margin-right' : 'margin-left', self.eles.frames.length > 1 ? -self.boundaryWidth - self.options.gutterWidth : 0);
            }
        },

        // Initializer
        _init: function () {
            self.gotoSlide(self.currentSlide);

            // Responsive sliders
            if (self.options.fluid) {
                $(window).on('smartresize', function () {
                    self.calculateSizes();
                    self._timer.stop();

                    // Fix le margins
                    if (self.options.transition === 'slide') {
                        // Reset the timer on each animation
                        self._timer.stop();
                        var dir, amount, styles = {};

                        // Right or left?
                        if (self.options.transition === 'slide-inverse') {
                            dir = 'right';
                        } else {
                            dir = 'left';
                        }

                        if (slides > 1) {
                            amount = -((self.currentSlide > 0 ? self.currentSlide : 1) * (self.boundaryWidth + self.options.gutterWidth));
                        } else {
                            amount = 0;
                        }

                        styles['margin-' + dir] = amount;

                        self.eles.container.css(styles);
                        self._timer.start();
                    }
                });
            }

            if(self.options.auto && self.options.hoverPause) {
                self.eles.wrapper.hover(function() {
                    self._timer.stop();
                }, function() {
                    self._timer.start();
                });
            }

            console.log(this);
        },

        _selectFrames: function (index, set) {
            // Selects slides, can set active if set = true
            var range = (self.options.incrementing && self.options.transition === 'slide') ? [index, index + self.options.visible] : [index * self.options.visible, (index + 1) * self.options.visible];
            self.currentSlide = index;
            if (set) {
                self._setActiveFrames(range);
            }
            return range;
        },

        // Handles setting active slides
        _setActiveFrames: function (range) {
            if (self.eles.activeFrames) self.eles.activeFrames.removeClass('active');
            self.eles.activeFrames = self.eles.frames.slice(range[0], range[1]);
            self.eles.activeFrames.addClass('active');
        },

        // Handler for calculating frame sizes
        calculateSizes: function () {
            var width = self.eles.boundary.innerWidth(),
                height = self.eles.boundary.innerHeight(),
                i = 0,
                pos = self.options.gutterWidth;
            self.boundaryWidth = width;
            self.boundaryHeight = height;
            self.frameWidth = (width - (self.options.gutterWidth * (self.options.visible - 1))) / self.options.visible;
            self.frameHeight = height;

            self.eles.container.css({
                width: function () {
                    var value,
                        slidesAmount = self.options.transition === 'slide' && self.options.looping === 'infinite' ? self.slides + 2 : self.slides;

                    if (self.options.transition === 'slide') {
                        value = slidesAmount * width;
                    } else {
                        value = width;
                    }

                    return value + (self.options.gutterWidth * slidesAmount * self.options.visible);
                },
                height: self.frameHeight
            });

            self.eles.frames.each(function (i, val) {
                // Loop through each frame
                // @todo REMOVE UNESSECARY INCREMENTOR!
                var distance = self.frameWidth + self.options.gutterWidth,
                    styles = {
                        width: self.frameWidth,
                        height: self.frameHeight
                    };
                
                // Reset the counter if needed
                if (self.options.transition !== 'slide' && i == self.options.visible) {
                    i = 0; // reset the counter
                }

                pos = distance * i;

                // We need to ensure that positioning are places on right/left depending on the direction
                if (self.options.transition === 'slide' && self.options.direction === 'inverse') {
                    styles.right = pos;
                } else {
                    styles.left = pos;
                }
                
                $(this).css(styles);

                i++;
            });
        },

        gotoSlide: function (toSlide) {
            // Handles slide navigation
            var delay;

            if (self.options.looping === true || self.options.looping && self.options.transition !== 'slide') {
                if (toSlide > self.slides - 1) {
                    self.gotoSlide(0);
                    return;
                } else if (toSlide < 0) {
                    self.gotoSlide(self.slides - 1);
                    return;
                }
            } else if (!self.options.looping) {
                if (toSlide > self.slides - 1 || toSlide < 0) { return; }
            }

            // Kill the timer
            self._timer.stop();

            // Perform the animation
            switch(self.options.transition) {
                case 'slide':
                    self._transition.slide(toSlide, self.options.direction);
                    delay = self.options.speed;
                    break;
                case 'crossfade':
                    self._transition.fade(toSlide, true);
                    delay = self.options.speed;
                    break;
                case 'fade':
                    self._transition.fade(toSlide);
                    delay = self.options.speed;
                    break;
                default:
                    self._transition.cut(toSlide);
                    delay = 0;
                    break;
            }

            if (!self.options.looping && self.options.buttons) {
                // Sets 'previous' button to disabled if on first frame
                if (self.currentSlide === 0) {
                    self.eles.prevButton.addClass('disabled');
                } else {
                    self.eles.prevButton.removeClass('disabled');
                }
                    
                // Sets 'next' button to disabled if on last frame
                if (self.currentSlide === slides - 1) {
                    self.eles.nextButton.addClass('disabled');
                } else {
                    self.eles.nextButton.removeClass('disabled');
                }
            }
        },

        // Transitions
        _transition: {

            // Transitions should be slide-agnostic. They animate out the current
            // frames and animate in the new ones.

            slide: function (toSlide, direction) {
                // Slide - slides through the frames
                var toFrame = toSlide,
                    marginDir = self.options.direction === 'inverse' ? 'right' : 'left',
                    getOffset = function (index) {
                        return parseInt(self.eles.frames.eq(self._selectFrames(index, true)[0]).css(marginDir), 10);
                    },
                    animations = {};

                animations['margin-' + marginDir] = -getOffset(toFrame);
                self.eles.container.filter(':not(:animated)').animate(animations, self.options.speed, self.options.easing, afterTransition);

                function afterTransition () {
                    // With the cloned slides, we can alter margins AFTER an
                    // animation has been completed to give the infinite looping effect

                    if (self.options.looping === 'infinite') {
                        if (toSlide === self.slides - (self.options.incrementing ? (self.options.visible - 1) : 1)) {
                            
                            // If too far forward, we need to silently shift back to the first slide.
                            self.eles.container.css('margin-' + marginDir, -getOffset(self.options.incrementing ? self.options.visible : 1));

                        } else if (toSlide === 0) {

                            // If too far back, we need to silently shift to the last slide.
                            self.eles.container.css('margin-' + marginDir, -getOffset(self.options.incrementing ? ((self.slides + 1) - (self.options.visible * 2)) : (self.slides - 2)));

                        }
                    }

                    self._timer.start();
                }
            },

            // Fade - fade out the previous frames, fade in the current ones
            // Crossfade - fade in next frame underneath the active frame
            // NOTE: Fade is better for transparent slides
            fade: function (toSlide, crossfade) {
                var $prevFrames = self.eles.activeFrames,
                    nextRange = self._selectFrames(toSlide, true);

                if (crossfade) {
                    $prevFrames.show(0, function() {
                        self.eles.activeFrames.css('z-index', 2).fadeIn(self.options.speed, self._timer.start);
                    });
                } else {
                    if ($prevFrames) $prevFrames.fadeOut(self.options.speed);
                    self.eles.activeFrames.fadeIn(self.options.speed, self._timer.start);
                }
            },

            // Cut - hide previous frames, show the current ones
            cut: function (toSlide) {
                var nextRange = self._selectFrames(toSlide, true);

                self.eles.frames.hide().slice(nextRange[0], nextRange[1]).show(0, self._timer.start);
            }
        },

        // The Timer object
        _timer: {

            // Starts the timer
            start: function () {
                if (self.options.auto && self.slides > 1) {
                    if ( self._timer.incrementor ) {
                        clearTimeout( self._timer.incrementor );
                    }
                    self._timer.incrementor = setTimeout(function () {
                        self.gotoSlide(self.currentSlide + 1);
                    }, self.options.duration);
                }
            },

            // Kills the timer
            stop: function () {
                console.log(this);
                if (self.options.auto){
                    clearTimeout( self._timer.incrementor );
                }
            }
        }
    };

    // The actual plugin
    // This borrows a lot from Masonry
    $.fn.slider = function ( options, callback ) {
        
        // For each instance of the plugin...
        this.each(function() {
            var instance = $.data( this, 'slider' );
            if ( instance ) {
                // apply options & init
                instance.option( options || {} );
                instance._init();
            } else {
                // initialize new instance
                $.data( this, 'slider', new $.Slider( options, this ) );
            }
        });

        return this;
    }
}(window, jQuery));
