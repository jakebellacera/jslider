# jslider - an advanced content slider

jSlider is a content slider with a bunch of cool options such as looping, delayed indexing, etc.

## Dependencies

* [jQuery](http://jquery.com)
* [jQuery Easing](http://gsgd.co.uk/sandbox/jquery/easing/) — **OPTIONAL** - if you'd like easing with your transitions

## Installation

Include jQuery, any optional dependencies and then jslider. Afterwards, paste in this code and change any options to suit your needs:

```javascript
$('#slideshow').jslider({
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
});
```

### Looping

By default, jslider loops your slides. If you'd like an infinite loop effect (the last frame will seamlessly slide in the first frame), you must make sure that you have your `transition: 'slide'` before you set `looping: 'infinite'`. If you'd like to disable this feature, simply set `looping: false`

## Release Notes

### 0.7

* Frame incrementing
* Multiple frames at a time, with classes!


### 0.5

Added:

* Infinite looping
* Responsive (fluid) layout mode (Using bundled [smartresize](http://github.com/louisremi/jquery-smartresize))
* Frame-chunking
* Fade/cut transitions
* More bugs!

Changed:

* Re-built from the ground up

### 0.1

* Initial release. Probably has a few bugs but it works.

## Found a bug?

If you find any issues or want to contribute, please report them in [jslider's issues](http://github.com/jakebellacera/jslider/issues). jslider is under active development, and pull requests are always welcome!

### Contributing

Please note that all pull requests including the minified version of the script will be scrapped and re-minified.

## License

Please fork and enjoy. MIT licensed: http://jakebellacera.mit-license.org