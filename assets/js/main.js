// R2 splash page
/*jshint latedef:false*/

//=include "../bower_components/jquery/dist/jquery.js"
//=include "../bower_components/velocity/velocity.min.js"

var Main = (function($) {

  var breakpoints = [],
      breakpointClasses = ['xl','lg','nav','md','sm','xs'],
      $body,
      $window,
      $document,
      headerOffset;

  function _init() {
    // Cache some common DOM queries
    $body = $(document.body);
    $window = $(window);
    $document = $(document);

    // DOM is loaded
    $body.addClass('loaded');

    // Set breakpoint vars
    _resize();

    // Zig zag the mothership
    $window.on('resize', Main.resize);

    // Esc handlers
    $document.keyup(function(e) {
      if (e.keyCode === 27) {}
    });

    _initSmoothScrollLinks();
    // _injectSvgDefs();

    // Scroll down to hash afer page load
    $window.on('load', function() {
      if (window.location.hash && $(window.location.hash).length) {
        _scrollBody(window.location.hash);
      }
    });

  }

  /**
   * Smoothscroll links
   */
  function _initSmoothScrollLinks() {
    $('a.smoothscroll,.smoothscroll a').click(function(e) {
      var href = $(this).attr('href').replace(/(https?:)?\/\//,'');
      var anchor = href.replace(/^[^#]/,'');
      // Is this a link + an anchor?
      if (href !== anchor) {
        // Is this anchor on another page? Just return normal link behavior and location.hash will be handled on load
        if (location.pathname !== href.replace(anchor,'')) {
          return;
        }
      }
      e.preventDefault();
      _scrollBody(anchor);
    });

   }

  /**
   * Pull in svg-defs.svg to body for <use> tags
   */
  function _injectSvgDefs() {
    var ajax = new XMLHttpRequest();
    ajax.open('GET', '/assets/dist/svgs-defs.svg', true);
    ajax.send();
    ajax.onload = function(e) {
      var div = document.createElement('div');
      div.classList.add('hidden');
      div.innerHTML = ajax.responseText;
      document.body.insertBefore(div, document.body.childNodes[0]);
    };
  }

  /**
   * Scroll body to element using Velocity
   */
  function _scrollBody(element, duration, delay) {
    // Defaults
    if (typeof duration === 'undefined') {
      duration = 500;
    }
    if (typeof delay === 'undefined') {
      delay = 0;
    }

    // Sending '#hash' instead of jquery element?
    if (typeof element === 'string') {
      var anchor = element;
      // Support for a[name=foo] anchors
      element = $(anchor+',a[name="'+anchor.replace('#','')+'"]');
      if (element.length === 0) {
        return;
      }
    }

    // Add a bit of breaking room to offset
    var offset = 20 + headerOffset;

    $(element).velocity('scroll', {
      duration: duration,
      delay: delay,
      offset: -offset
    }, 'easeOutSine');
   }

  /**
   * Track ajax pages in Analytics
   */
  function _trackPage() {
    if (typeof ga !== 'undefined') { ga('send', 'pageview', document.location.href); }
  }

  /**
   * Track events in Analytics
   */
  function _trackEvent(category, action) {
    if (typeof ga !== 'undefined') { ga('send', 'event', category, action); }
  }

  /**
   * Called in quick succession as window is resized
   */
  function _resize() {

    // Check breakpoint indicator in DOM ( :after { content } is controlled by CSS media queries )
    var breakpointIndicatorString = window.getComputedStyle(
      document.querySelector('#breakpoint-indicator'), ':after'
    ).getPropertyValue('content').replace(/['"]/g, '');
    breakpoints = {};

    // Check for breakpoint with `if (breakpoint['md'])`
    for (var i = 0; i < breakpointClasses.length; i++) {
      breakpoints[breakpointClasses[i]] = (breakpointIndicatorString === breakpointClasses[i] || (i>0 && breakpoints[breakpointClasses[i-1]]));
    }

    // Update header offset used in _scrollBody()
    _setHeaderOffset();

  }

  /**
   * Set headerOffset var used for scrollbody calculations
   */
  function _setHeaderOffset() {
    headerOffset = 0; // Set to any sticky header height
  }

  /**
   * Public functions
   */
  return {
    init: _init,
    resize: _resize,
    scrollBody: function(section, duration, delay) {
      _scrollBody(section, duration, delay);
    }
  };

})(jQuery);

// Fire up the mothership
$(function() {
  Main.init
});
