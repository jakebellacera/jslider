/*
 *  jSlider: a content slider
 *  =========================
 *  @version:   0.1
 *  @author:    jakebellacera (http://jakebellacera.com)
 *  @url:       http://github.com/jakebellacera/jslider
 *  
 *  Dependencies:
 *  - jquery.smartresize (if you want to use fullscreen mode)
 *  - jquery.easing (if you want easing in your transitions)
 */

(function($){
    $.fn.jslider = function(options, callback) {

        var $this = this,
            $wrapper,
            $boundary,
            boundaryWidth = 0,
            boundaryHeight = 0,
            $container,
            $frames,
            frameWidth = 0,
            frameHeight = 0,
            frameCount = 0,
            $prev,
            $next,
            $pagination,
            auto,
            currentFrame = 1,
            settings = $.extend({
                transition: 'slide',
                duration: 10000,
                speed: 500,
                easing: 'swing',
                fluid: false,
                controls: true,
                controlNextText: 'Next', 
                controlPrevText: 'Prev',
                pagination: false,
                looping: 'finite', // Finite, infinite or false (off)
                auto: true,
                delayedIndex: false,
                hoverPause: true
            }, options);
        
        return this.each(function() {
            var _init = function() {
                $wrapper = $this.addClass('slider-wrapper');
                $boundary = $wrapper.wrapInner('<div/>').children().addClass('slider-boundary').css({'overflow': 'hidden'});
                $container = $boundary.wrapInner('<div/>').children().addClass('slider-container');
                $frames = $container.children().addClass('slider-frame');

                // Count the frames
                frameCount = $frames.length;

                if(settings.transition === 'slide') {
                    $frames.css({'float': 'left'});
                }

                // Calculate the widths
                if(settings.fluid) {
                    _calculateWidths($boundary.innerWidth(), $boundary.innerHeight());
                } else {
                    _calculateWidths();
                }

                // Prev/Next controls
                if(settings.controls) {
                    $prev = $('<a />')
                                .addClass('slider-control prev')
                                .on('click', function(e){ 
                                    e.preventDefault();
                                    
                                    if(!$this.hasClass('disabled')) {
                                        _transition(currentFrame - 1);
                                    }
                                })
                                .text(settings.controlPrevText);
                                
                    $next = $('<a />')
                                .addClass('slider-control next')
                                .on('click', function(e){
                                    e.preventDefault();

                                    if(!$this.hasClass('disabled')) {
                                        _transition(currentFrame + 1);
                                    }
                                })
                                .text(settings.controlNextText);
                                    
                    $prev.add($next)
                        .attr('unselectable', 'on')
                        .css({
                            '-moz-user-select':'none',
                            '-webkit-user-select':'none',
                            'user-select':'none'
                        })
                        .each(function() {
                            this.onselectstart = function() { return false; };
                        });
                        
                    $wrapper
                        .prepend($prev)
                        .append($next);
                }

                // Create the navigation buttons
                if(settings.pagination) {
                    $pagination = $('<ol />').addClass('slider-control-navigation');
                                    
                    $frames.each(function(i, frame) {
                        var $tab = $('<li />')
                                        .addClass('slider-control-navigation-tab')
                                            .append('<span />').find('span')
                                                .addClass('number')
                                                .text(i + 1)
                                                .end()
                                        .click(function(e) {
                                            e.preventDefault();
                                            
                                            if((i+1) != currentFrame) {
                                                _transition(i+1);
                                            }
                                        });
                                        
                        if(i == 0) {
                            $tab
                                .addClass('current');
                        }
                        
                        if($(frame).attr('title')) {
                            $('<span />')
                                .addClass('title')
                                .text($(frame).attr('title'))
                                .appendTo($tab);
                        }
                                        
                        $navigation
                            .append($tab);
                    });
                                    
                    $boundary
                        .append($navigation);
                }

                // Set some additional CSS pertaining to the transition style
                $boundary.css({ 'position': 'relative' });

                if(settings.transition == 'slide') {

                    $container.css({overflow: 'hidden'});

                } else if (settings.transition == 'slide-inverse') {
                    // Go right instead of left, therefore we must anchor the container to the top right.
                    $frames.css({ 'float': 'right' });
                    $container.css({
                        overflow: 'hidden',
                        position: 'absolute',
                        right: 0,
                        top: 0
                    });

                } else {
                    // Since we aren't sliding, we're just going to
                    // stack all of the elements on top of each other.
                    $container.css({ position: 'relative' });
                    $frames
                        .css({
                            position: 'absolute',
                            left: 0,
                            top: 0
                        })
                        .hide();
                    
                    $frames.eq(0).show();
                }

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

                $frames.eq(0).removeClass('active').delay(settings.speed).addClass('active');

                if (settings.fluid) {
                    // Recalculate the slide widths on window.resize
                    $(window).smartresize(function() {
                        _calculateWidths($boundary.innerWidth(), $boundary.innerHeight());
                    });
                }
            },

            _calculateWidths = function(width, height) {

                if(settings.fluid) {
                    // Calculate the widths, abstracted for future reference
                    var wrapperMinWidth = parseInt($wrapper.css('min-width'), 10);

                    // We want to ensure that the width value is no less than the min-width.
                    // If the $boundary does NOT have a min-width, it will default to 0,
                    // aka "no minimum."
                    if(width < wrapperMinWidth) {
                        width = wrapperMinWidth;
                    }

                    // Set the globals
                    frameWidth = width;
                    frameHeight = height;

                    boundaryWidth = width;
                    boundaryHeight = height;
                } else {
                    $frames.each(function() {
                        if($(this).width() > frameWidth) frameWidth = $(this).width(); // Get widest frame's width
                        if($(this).height() > frameHeight) frameHeight = $(this).height(); // Get tallest frame's height

                        if($(this).outerWidth(true) > boundaryWidth) boundaryWidth = $(this).outerWidth(true); // Get widest frame's outer width
                        if($(this).outerHeight(true) > boundaryHeight) boundaryHeight = $(this).outerHeight(true); // Get tallest frame's outer height
                    });
                }

                // set the frame height/width
                // set the container height/width

                if (settings.transition === 'slide') {
                    $container.css({
                        'width': boundaryWidth * frameCount,
                        'height': boundaryHeight
                    });
                } else {
                    $container.css({
                        'width': boundaryWidth,
                        'height': boundaryHeight
                    });
                }

                $frames.css({
                    'width': frameWidth,
                    'height': frameHeight
                });
            },

            _transition = function(toFrame) {
                
                // LOOPING
                // If out of bounds, send to the opposite side
                if(settings.looping == 'finite') {
                    if(toFrame > frameCount) {
                        _transition(1);

                        return;
                    } else if(toFrame <= 0) {
                        _transition(frameCount);
                        return;
                    }

                else if(settings.looping == 'inifinite') {
                    console.log('Hardcore infinite looping mode enabled.');
                }
                    
                // NON-LOOPING
                // If out of bounds, do nothing
                } else {
                    if(toFrame > frameCount || toFrame <= 0) return;
                }
                
                switch(settings.transition) {
                    case 'slide':
                        var diff = toFrame - currentFrame;
                        _slide(diff);
                        break;

                    case 'slide-inverse':
                        var diff = toFrame - currentFrame;
                        _slide(diff);
                        break;
                        
                    case 'fade':
                        _fade(toFrame);
                        break;
                        
                    default:
                        _cut(toFrame);
                        break;
                }
                
                currentFrame = toFrame;

                // Set the active class.
                
                if(settings.delayedIndex) {
                    setTimeout(addActiveClass, settings.speed);
                } else {
                    addActiveClass();
                }

                function addActiveClass() {
                    return $frames.eq(currentFrame - 1).addClass('active').siblings().removeClass('active');
                }
                
                /*
                    TODO get the button disabling / enabling and looping to work
                */
                if(!settings.looping && settings.controls) {
                    // Sets 'previous' button to disabled if on first frame
                    if(currentFrame == 1) {
                        $prev.addClass('disabled');
                    } else {
                        $prev.removeClass('disabled');
                    }
                        
                    // Sets 'next' button to disabled if on last frame
                    if(currentFrame == frameCount) {
                        $next.addClass('disabled');
                    } else {
                        $next.removeClass('disabled');
                    }
                }
                
                if(settings.pagination) {
                    $navigation
                        .children()
                            .removeClass('current')
                            .eq(currentFrame - 1)
                                .addClass('current');
                }
                
            },

            _slide = function(frames) {
                
                if(settings.transition == 'slide-inverse') {
                    $container.stop().animate({
                        marginRight: (-1) * (currentFrame + frames - 1) * boundaryWidth + 'px'
                    }, settings.speed, settings.easing);
                } else if(settings.transition == 'slide-vertical') {
                    $container.stop().animate({
                        marginTop: (-1) * (currentFrame + frames - 1) * boundaryHeight + 'px'
                    }, settings.speed, settings.easing);
                } else {
                    $container.stop().animate({
                        marginLeft: (-1) * (currentFrame + frames - 1) * boundaryWidth + 'px'
                    }, settings.speed, settings.easing);
                }
                
            },
            
            _fade = function(toFrame) {
                
                $frames.eq(toFrame - 1)
                    .fadeIn(settings.speed);
                    
                $frames.eq(currentFrame - 1)
                    .fadeOut(settings.speed);
                
            },

            _cut = function(toFrame) {
                    
                $frames.eq(toFrame - 1)
                    .show();
                    
                $frames.eq(currentFrame - 1)
                    .hide();
                    
            },

            _startTimer = function() {
                auto = setInterval(function() {
                    _transition(currentFrame + 1);
                }, settings.duration);
            },
            
            _stopTimer = function() {
                if(settings.auto !== false){
                    clearInterval(auto);
                }
            };

            // Run it
            _init();
        });
    };
})(jQuery);
