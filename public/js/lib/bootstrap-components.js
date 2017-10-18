/*! =========================================================
 *
 *
 * Maintainers:
 *		Kyle Kemp
 *			- Twitter: @seiyria
 *			- Github:  seiyria
 *		Rohit Kalkur
 *			- Twitter: @Rovolutionary
 *			- Github:  rovolution
 *
 * =========================================================
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */


/**
 * Bridget makes jQuery widgets
 * v1.0.1
 * MIT license
 */
const windowIsDefined = (typeof window === "object");


(function(factory) {
	if(typeof define === "function" && define.amd) {
		define(["jquery"], factory);
	}
	else if(typeof module === "object" && module.exports) {
		var jQuery;
		try {
			jQuery = require("jquery");
		}
		catch (err) {
			jQuery = null;
		}
		module.exports = factory(jQuery);
	}
	else if(window) {
		window.Slider = factory(window.jQuery);
	}
}(function($) {
	// Constants
	const NAMESPACE_MAIN = 'slider';
	const NAMESPACE_ALTERNATE = 'bootstrapSlider';

	// Polyfill console methods
	if (windowIsDefined && !window.console) {
		window.console = {};
	}
	if (windowIsDefined && !window.console.log) {
		window.console.log = function () { };
	}
	if (windowIsDefined && !window.console.warn) {
		window.console.warn = function () { };
	}

	// Reference to Slider constructor
	var Slider;


	(function( $ ) {

		'use strict';

		// -------------------------- utils -------------------------- //

		var slice = Array.prototype.slice;

		function noop() {}

		// -------------------------- definition -------------------------- //

		function defineBridget( $ ) {

			// bail if no jQuery
			if ( !$ ) {
				return;
			}

			// -------------------------- addOptionMethod -------------------------- //

			/**
			 * adds option method -> $().plugin('option', {...})
			 * @param {Function} PluginClass - constructor class
			 */
			function addOptionMethod( PluginClass ) {
				// don't overwrite original option method
				if ( PluginClass.prototype.option ) {
					return;
				}

			  // option setter
			  PluginClass.prototype.option = function( opts ) {
			    // bail out if not an object
			    if ( !$.isPlainObject( opts ) ){
			      return;
			    }
			    this.options = $.extend( true, this.options, opts );
			  };
			}


			// -------------------------- plugin bridge -------------------------- //

			// helper function for logging errors
			// $.error breaks jQuery chaining
			var logError = typeof console === 'undefined' ? noop :
			  function( message ) {
			    console.error( message );
			  };

			/**
			 * jQuery plugin bridge, access methods like $elem.plugin('method')
			 * @param {String} namespace - plugin name
			 * @param {Function} PluginClass - constructor class
			 */
			function bridge( namespace, PluginClass ) {
			  // add to jQuery fn namespace
			  $.fn[ namespace ] = function( options ) {
			    if ( typeof options === 'string' ) {
			      // call plugin method when first argument is a string
			      // get arguments for method
			      var args = slice.call( arguments, 1 );

			      for ( var i=0, len = this.length; i < len; i++ ) {
			        var elem = this[i];
			        var instance = $.data( elem, namespace );
			        if ( !instance ) {
			          logError( "cannot call methods on " + namespace + " prior to initialization; " +
			            "attempted to call '" + options + "'" );
			          continue;
			        }
			        if ( !$.isFunction( instance[options] ) || options.charAt(0) === '_' ) {
			          logError( "no such method '" + options + "' for " + namespace + " instance" );
			          continue;
			        }

			        // trigger method with arguments
			        var returnValue = instance[ options ].apply( instance, args);

			        // break look and return first value if provided
			        if ( returnValue !== undefined && returnValue !== instance) {
			          return returnValue;
			        }
			      }
			      // return this if no return value
			      return this;
			    } else {
			      var objects = this.map( function() {
			        var instance = $.data( this, namespace );
			        if ( instance ) {
			          // apply options & init
			          instance.option( options );
			          instance._init();
			        } else {
			          // initialize new instance
			          instance = new PluginClass( this, options );
			          $.data( this, namespace, instance );
			        }
			        return $(this);
			      });

			      if(!objects || objects.length > 1) {
			      	return objects;
			      } else {
			      	return objects[0];
			      }
			    }
			  };

			}

			// -------------------------- bridget -------------------------- //

			/**
			 * converts a Prototypical class into a proper jQuery plugin
			 *   the class must have a ._init method
			 * @param {String} namespace - plugin name, used in $().pluginName
			 * @param {Function} PluginClass - constructor class
			 */
			$.bridget = function( namespace, PluginClass ) {
			  addOptionMethod( PluginClass );
			  bridge( namespace, PluginClass );
			};

			return $.bridget;

		}

	  	// get jquery from browser global
	  	defineBridget( $ );

	})( $ );


	/*************************************************

			BOOTSTRAP-SLIDER SOURCE CODE

	**************************************************/

	(function($) {

		var ErrorMsgs = {
			formatInvalidInputErrorMsg : function(input) {
				return "Invalid input value '" + input + "' passed in";
			},
			callingContextNotSliderInstance : "Calling context element does not have instance of Slider bound to it. Check your code to make sure the JQuery object returned from the call to the slider() initializer is calling the method"
		};

		var SliderScale = {
			linear: {
				toValue: function(percentage) {
					var rawValue = percentage/100 * (this.options.max - this.options.min);
					var shouldAdjustWithBase = true;
					if (this.options.ticks_positions.length > 0) {
						var minv, maxv, minp, maxp = 0;
						for (var i = 1; i < this.options.ticks_positions.length; i++) {
							if (percentage <= this.options.ticks_positions[i]) {
								minv = this.options.ticks[i-1];
								minp = this.options.ticks_positions[i-1];
								maxv = this.options.ticks[i];
								maxp = this.options.ticks_positions[i];

								break;
							}
						}
						var partialPercentage = (percentage - minp) / (maxp - minp);
						rawValue = minv + partialPercentage * (maxv - minv);
						shouldAdjustWithBase = false;
					}

					var adjustment = shouldAdjustWithBase ? this.options.min : 0;
					var value = adjustment + Math.round(rawValue / this.options.step) * this.options.step;
					if (value < this.options.min) {
						return this.options.min;
					} else if (value > this.options.max) {
						return this.options.max;
					} else {
						return value;
					}
				},
				toPercentage: function(value) {
					if (this.options.max === this.options.min) {
						return 0;
					}

					if (this.options.ticks_positions.length > 0) {
						var minv, maxv, minp, maxp = 0;
						for (var i = 0; i < this.options.ticks.length; i++) {
							if (value  <= this.options.ticks[i]) {
								minv = (i > 0) ? this.options.ticks[i-1] : 0;
								minp = (i > 0) ? this.options.ticks_positions[i-1] : 0;
								maxv = this.options.ticks[i];
								maxp = this.options.ticks_positions[i];

								break;
							}
						}
						if (i > 0) {
							var partialPercentage = (value - minv) / (maxv - minv);
							return minp + partialPercentage * (maxp - minp);
						}
					}

					return 100 * (value - this.options.min) / (this.options.max - this.options.min);
				}
			},

			logarithmic: {
				/* Based on http://stackoverflow.com/questions/846221/logarithmic-slider */
				toValue: function(percentage) {
					var min = (this.options.min === 0) ? 0 : Math.log(this.options.min);
					var max = Math.log(this.options.max);
					var value = Math.exp(min + (max - min) * percentage / 100);
					value = this.options.min + Math.round((value - this.options.min) / this.options.step) * this.options.step;
					/* Rounding to the nearest step could exceed the min or
					 * max, so clip to those values. */
					if (value < this.options.min) {
						return this.options.min;
					} else if (value > this.options.max) {
						return this.options.max;
					} else {
						return value;
					}
				},
				toPercentage: function(value) {
					if (this.options.max === this.options.min) {
						return 0;
					} else {
						var max = Math.log(this.options.max);
						var min = this.options.min === 0 ? 0 : Math.log(this.options.min);
						var v = value === 0 ? 0 : Math.log(value);
						return 100 * (v - min) / (max - min);
					}
				}
			}
		};


		/*************************************************

							CONSTRUCTOR

		**************************************************/
		Slider = function(element, options) {
			createNewSlider.call(this, element, options);
			return this;
		};

		function createNewSlider(element, options) {

			/*
				The internal state object is used to store data about the current 'state' of slider.

				This includes values such as the `value`, `enabled`, etc...
			*/
			this._state = {
				value: null,
				enabled: null,
				offset: null,
				size: null,
				percentage: null,
				inDrag: false,
				over: false
			};


			if(typeof element === "string") {
				this.element = document.querySelector(element);
			} else if(element instanceof HTMLElement) {
				this.element = element;
			}

			/*************************************************

							Process Options

			**************************************************/
			options = options ? options : {};
			var optionTypes = Object.keys(this.defaultOptions);

			for(var i = 0; i < optionTypes.length; i++) {
				var optName = optionTypes[i];

				// First check if an option was passed in via the constructor
				var val = options[optName];
				// If no data attrib, then check data atrributes
				val = (typeof val !== 'undefined') ? val : getDataAttrib(this.element, optName);
				// Finally, if nothing was specified, use the defaults
				val = (val !== null) ? val : this.defaultOptions[optName];

				// Set all options on the instance of the Slider
				if(!this.options) {
					this.options = {};
				}
				this.options[optName] = val;
			}

			/*
				Validate `tooltip_position` against 'orientation`
				- if `tooltip_position` is incompatible with orientation, swith it to a default compatible with specified `orientation`
					-- default for "vertical" -> "right"
					-- default for "horizontal" -> "left"
			*/
			if(this.options.orientation === "vertical" && (this.options.tooltip_position === "top" || this.options.tooltip_position === "bottom")) {

				this.options.tooltip_position	= "right";

			}
			else if(this.options.orientation === "horizontal" && (this.options.tooltip_position === "left" || this.options.tooltip_position === "right")) {

				this.options.tooltip_position	= "top";

			}

			function getDataAttrib(element, optName) {
				var dataName = "data-slider-" + optName.replace(/_/g, '-');
				var dataValString = element.getAttribute(dataName);

				try {
					return JSON.parse(dataValString);
				}
				catch(err) {
					return dataValString;
				}
			}

			/*************************************************

							Create Markup

			**************************************************/

			var origWidth = this.element.style.width;
			var updateSlider = false;
			var parent = this.element.parentNode;
			var sliderTrackSelection;
			var sliderTrackLow, sliderTrackHigh;
			var sliderMinHandle;
			var sliderMaxHandle;

			if (this.sliderElem) {
				updateSlider = true;
			} else {
				/* Create elements needed for slider */
				this.sliderElem = document.createElement("div");
				this.sliderElem.className = "slider";

				/* Create slider track elements */
				var sliderTrack = document.createElement("div");
				sliderTrack.className = "slider-track";

				sliderTrackLow = document.createElement("div");
				sliderTrackLow.className = "slider-track-low";

				sliderTrackSelection = document.createElement("div");
				sliderTrackSelection.className = "slider-selection";

				sliderTrackHigh = document.createElement("div");
				sliderTrackHigh.className = "slider-track-high";

				sliderMinHandle = document.createElement("div");
				sliderMinHandle.className = "slider-handle min-slider-handle";
				sliderMinHandle.setAttribute('role', 'slider');
				sliderMinHandle.setAttribute('aria-valuemin', this.options.min);
				sliderMinHandle.setAttribute('aria-valuemax', this.options.max);

				sliderMaxHandle = document.createElement("div");
				sliderMaxHandle.className = "slider-handle max-slider-handle";
				sliderMaxHandle.setAttribute('role', 'slider');
				sliderMaxHandle.setAttribute('aria-valuemin', this.options.min);
				sliderMaxHandle.setAttribute('aria-valuemax', this.options.max);

				sliderTrack.appendChild(sliderTrackLow);
				sliderTrack.appendChild(sliderTrackSelection);
				sliderTrack.appendChild(sliderTrackHigh);

				/* Add aria-labelledby to handle's */
				var isLabelledbyArray = Array.isArray(this.options.labelledby);
				if (isLabelledbyArray && this.options.labelledby[0]) {
					sliderMinHandle.setAttribute('aria-labelledby', this.options.labelledby[0]);
				}
				if (isLabelledbyArray && this.options.labelledby[1]) {
					sliderMaxHandle.setAttribute('aria-labelledby', this.options.labelledby[1]);
				}
				if (!isLabelledbyArray && this.options.labelledby) {
					sliderMinHandle.setAttribute('aria-labelledby', this.options.labelledby);
					sliderMaxHandle.setAttribute('aria-labelledby', this.options.labelledby);
				}

				/* Create ticks */
				this.ticks = [];
				if (Array.isArray(this.options.ticks) && this.options.ticks.length > 0) {
					this.ticksContainer = document.createElement('div');
					this.ticksContainer.className = 'slider-tick-container';

					for (i = 0; i < this.options.ticks.length; i++) {
						var tick = document.createElement('div');
						tick.className = 'slider-tick';
						this.ticks.push(tick);
						this.ticksContainer.appendChild(tick);
					}

					sliderTrackSelection.className += " tick-slider-selection";
				}

				this.tickLabels = [];
				if (Array.isArray(this.options.ticks_labels) && this.options.ticks_labels.length > 0) {
					this.tickLabelContainer = document.createElement('div');
					this.tickLabelContainer.className = 'slider-tick-label-container';

					for (i = 0; i < this.options.ticks_labels.length; i++) {
						var label = document.createElement('div');
						var noTickPositionsSpecified = this.options.ticks_positions.length === 0;
						var tickLabelsIndex = (this.options.reversed && noTickPositionsSpecified) ? (this.options.ticks_labels.length - (i + 1)) : i;
						label.className = 'slider-tick-label';
						label.innerHTML = this.options.ticks_labels[tickLabelsIndex];

						this.tickLabels.push(label);
						this.tickLabelContainer.appendChild(label);
					}
				}

				const createAndAppendTooltipSubElements = function(tooltipElem) {
					var arrow = document.createElement("div");
					arrow.className = "tooltip-arrow";

					var inner = document.createElement("div");
					inner.className = "tooltip-inner";

					tooltipElem.appendChild(arrow);
					tooltipElem.appendChild(inner);
				};

				/* Create tooltip elements */
				const sliderTooltip = document.createElement("div");
				sliderTooltip.className = "tooltip tooltip-main";
				sliderTooltip.setAttribute('role', 'presentation');
				createAndAppendTooltipSubElements(sliderTooltip);

				const sliderTooltipMin = document.createElement("div");
				sliderTooltipMin.className = "tooltip tooltip-min";
				sliderTooltipMin.setAttribute('role', 'presentation');
				createAndAppendTooltipSubElements(sliderTooltipMin);

				const sliderTooltipMax = document.createElement("div");
				sliderTooltipMax.className = "tooltip tooltip-max";
				sliderTooltipMax.setAttribute('role', 'presentation');
				createAndAppendTooltipSubElements(sliderTooltipMax);

				/* Append components to sliderElem */
				this.sliderElem.appendChild(sliderTrack);
				this.sliderElem.appendChild(sliderTooltip);
				this.sliderElem.appendChild(sliderTooltipMin);
				this.sliderElem.appendChild(sliderTooltipMax);

				if (this.tickLabelContainer) {
					this.sliderElem.appendChild(this.tickLabelContainer);
				}
				if (this.ticksContainer) {
					this.sliderElem.appendChild(this.ticksContainer);
				}

				this.sliderElem.appendChild(sliderMinHandle);
				this.sliderElem.appendChild(sliderMaxHandle);

				/* Append slider element to parent container, right before the original <input> element */
				parent.insertBefore(this.sliderElem, this.element);

				/* Hide original <input> element */
				this.element.style.display = "none";
			}
			/* If JQuery exists, cache JQ references */
			if($) {
				this.$element = $(this.element);
				this.$sliderElem = $(this.sliderElem);
			}

			/*************************************************

								Setup

			**************************************************/
			this.eventToCallbackMap = {};
			this.sliderElem.id = this.options.id;

			this.touchCapable = 'ontouchstart' in window || (window.DocumentTouch && document instanceof window.DocumentTouch);

			this.touchX = 0;
			this.touchY = 0;

			this.tooltip = this.sliderElem.querySelector('.tooltip-main');
			this.tooltipInner = this.tooltip.querySelector('.tooltip-inner');

			this.tooltip_min = this.sliderElem.querySelector('.tooltip-min');
			this.tooltipInner_min = this.tooltip_min.querySelector('.tooltip-inner');

			this.tooltip_max = this.sliderElem.querySelector('.tooltip-max');
			this.tooltipInner_max= this.tooltip_max.querySelector('.tooltip-inner');

			if (SliderScale[this.options.scale]) {
				this.options.scale = SliderScale[this.options.scale];
			}

			if (updateSlider === true) {
				// Reset classes
				this._removeClass(this.sliderElem, 'slider-horizontal');
				this._removeClass(this.sliderElem, 'slider-vertical');
				this._removeClass(this.tooltip, 'hide');
				this._removeClass(this.tooltip_min, 'hide');
				this._removeClass(this.tooltip_max, 'hide');

				// Undo existing inline styles for track
				["left", "top", "width", "height"].forEach(function(prop) {
					this._removeProperty(this.trackLow, prop);
					this._removeProperty(this.trackSelection, prop);
					this._removeProperty(this.trackHigh, prop);
				}, this);

				// Undo inline styles on handles
				[this.handle1, this.handle2].forEach(function(handle) {
					this._removeProperty(handle, 'left');
					this._removeProperty(handle, 'top');
				}, this);

				// Undo inline styles and classes on tooltips
				[this.tooltip, this.tooltip_min, this.tooltip_max].forEach(function(tooltip) {
					this._removeProperty(tooltip, 'left');
					this._removeProperty(tooltip, 'top');
					this._removeProperty(tooltip, 'margin-left');
					this._removeProperty(tooltip, 'margin-top');

					this._removeClass(tooltip, 'right');
					this._removeClass(tooltip, 'top');
				}, this);
			}

			if(this.options.orientation === 'vertical') {
				this._addClass(this.sliderElem,'slider-vertical');
				this.stylePos = 'top';
				this.mousePos = 'pageY';
				this.sizePos = 'offsetHeight';
			} else {
				this._addClass(this.sliderElem, 'slider-horizontal');
				this.sliderElem.style.width = origWidth;
				this.options.orientation = 'horizontal';
				this.stylePos = 'left';
				this.mousePos = 'pageX';
				this.sizePos = 'offsetWidth';

			}
			this._setTooltipPosition();
			/* In case ticks are specified, overwrite the min and max bounds */
			if (Array.isArray(this.options.ticks) && this.options.ticks.length > 0) {
					this.options.max = Math.max.apply(Math, this.options.ticks);
					this.options.min = Math.min.apply(Math, this.options.ticks);
			}

			if (Array.isArray(this.options.value)) {
				this.options.range = true;
				this._state.value = this.options.value;
			}
			else if (this.options.range) {
				// User wants a range, but value is not an array
				this._state.value = [this.options.value, this.options.max];
			}
			else {
				this._state.value = this.options.value;
			}

			this.trackLow = sliderTrackLow || this.trackLow;
			this.trackSelection = sliderTrackSelection || this.trackSelection;
			this.trackHigh = sliderTrackHigh || this.trackHigh;

			if (this.options.selection === 'none') {
				this._addClass(this.trackLow, 'hide');
				this._addClass(this.trackSelection, 'hide');
				this._addClass(this.trackHigh, 'hide');
			}

			this.handle1 = sliderMinHandle || this.handle1;
			this.handle2 = sliderMaxHandle || this.handle2;

			if (updateSlider === true) {
				// Reset classes
				this._removeClass(this.handle1, 'round triangle');
				this._removeClass(this.handle2, 'round triangle hide');

				for (i = 0; i < this.ticks.length; i++) {
					this._removeClass(this.ticks[i], 'round triangle hide');
				}
			}

			var availableHandleModifiers = ['round', 'triangle', 'custom'];
			var isValidHandleType = availableHandleModifiers.indexOf(this.options.handle) !== -1;
			if (isValidHandleType) {
				this._addClass(this.handle1, this.options.handle);
				this._addClass(this.handle2, this.options.handle);

				for (i = 0; i < this.ticks.length; i++) {
					this._addClass(this.ticks[i], this.options.handle);
				}
			}

			this._state.offset = this._offset(this.sliderElem);
			this._state.size = this.sliderElem[this.sizePos];
			this.setValue(this._state.value);

			/******************************************

						Bind Event Listeners

			******************************************/

			// Bind keyboard handlers
			this.handle1Keydown = this._keydown.bind(this, 0);
			this.handle1.addEventListener("keydown", this.handle1Keydown, false);

			this.handle2Keydown = this._keydown.bind(this, 1);
			this.handle2.addEventListener("keydown", this.handle2Keydown, false);

			this.mousedown = this._mousedown.bind(this);
			this.touchstart = this._touchstart.bind(this);
			this.touchmove = this._touchmove.bind(this);

			if (this.touchCapable) {
				// Bind touch handlers
				this.sliderElem.addEventListener("touchstart", this.touchstart, false);
				this.sliderElem.addEventListener("touchmove", this.touchmove, false);
			}
			this.sliderElem.addEventListener("mousedown", this.mousedown, false);

			// Bind window handlers
			this.resize = this._resize.bind(this);
			window.addEventListener("resize", this.resize, false);


			// Bind tooltip-related handlers
			if(this.options.tooltip === 'hide') {
				this._addClass(this.tooltip, 'hide');
				this._addClass(this.tooltip_min, 'hide');
				this._addClass(this.tooltip_max, 'hide');
			}
			else if(this.options.tooltip === 'always') {
				this._showTooltip();
				this._alwaysShowTooltip = true;
			}
			else {
				this.showTooltip = this._showTooltip.bind(this);
				this.hideTooltip = this._hideTooltip.bind(this);

				this.sliderElem.addEventListener("mouseenter", this.showTooltip, false);
				this.sliderElem.addEventListener("mouseleave", this.hideTooltip, false);

				this.handle1.addEventListener("focus", this.showTooltip, false);
				this.handle1.addEventListener("blur", this.hideTooltip, false);

				this.handle2.addEventListener("focus", this.showTooltip, false);
				this.handle2.addEventListener("blur", this.hideTooltip, false);
			}

			if(this.options.enabled) {
				this.enable();
			} else {
				this.disable();
			}

		}



		/*************************************************

					INSTANCE PROPERTIES/METHODS

		- Any methods bound to the prototype are considered
		part of the plugin's `public` interface

		**************************************************/
		Slider.prototype = {
			_init: function() {}, // NOTE: Must exist to support bridget

			constructor: Slider,

			defaultOptions: {
				id: "",
			  min: 0,
				max: 10,
				step: 1,
				precision: 0,
				orientation: 'horizontal',
				value: 5,
				range: false,
				selection: 'before',
				tooltip: 'show',
				tooltip_split: false,
				handle: 'round',
				reversed: false,
				enabled: true,
				formatter: function(val) {
					if (Array.isArray(val)) {
						return val[0] + " : " + val[1];
					} else {
						return val;
					}
				},
				natural_arrow_keys: false,
				ticks: [],
				ticks_positions: [],
				ticks_labels: [],
				ticks_snap_bounds: 0,
				scale: 'linear',
				focus: false,
				tooltip_position: null,
				labelledby: null
			},

			getElement: function() {
				return this.sliderElem;
			},

			getValue: function() {
				if (this.options.range) {
					return this._state.value;
				}
				else {
					return this._state.value[0];
				}
			},

			setValue: function(val, triggerSlideEvent, triggerChangeEvent) {
				if (!val) {
					val = 0;
				}
				var oldValue = this.getValue();
				this._state.value = this._validateInputValue(val);
				var applyPrecision = this._applyPrecision.bind(this);

				if (this.options.range) {
					this._state.value[0] = applyPrecision(this._state.value[0]);
					this._state.value[1] = applyPrecision(this._state.value[1]);

					this._state.value[0] = Math.max(this.options.min, Math.min(this.options.max, this._state.value[0]));
					this._state.value[1] = Math.max(this.options.min, Math.min(this.options.max, this._state.value[1]));
				}
				else {
					this._state.value = applyPrecision(this._state.value);
					this._state.value = [ Math.max(this.options.min, Math.min(this.options.max, this._state.value))];
					this._addClass(this.handle2, 'hide');
					if (this.options.selection === 'after') {
						this._state.value[1] = this.options.max;
					} else {
						this._state.value[1] = this.options.min;
					}
				}

				if (this.options.max > this.options.min) {
					this._state.percentage = [
						this._toPercentage(this._state.value[0]),
						this._toPercentage(this._state.value[1]),
						this.options.step * 100 / (this.options.max - this.options.min)
					];
				} else {
					this._state.percentage = [0, 0, 100];
				}

				this._layout();
				var newValue = this.options.range ? this._state.value : this._state.value[0];

				this._setDataVal(newValue);
				if(triggerSlideEvent === true) {
					this._trigger('slide', newValue);
				}
				if( (oldValue !== newValue) && (triggerChangeEvent === true) ) {
					this._trigger('change', {
						oldValue: oldValue,
						newValue: newValue
					});
				}

				return this;
			},

			destroy: function(){
				// Remove event handlers on slider elements
				this._removeSliderEventHandlers();

				// Remove the slider from the DOM
				this.sliderElem.parentNode.removeChild(this.sliderElem);
				/* Show original <input> element */
				this.element.style.display = "";

				// Clear out custom event bindings
				this._cleanUpEventCallbacksMap();

				// Remove data values
				this.element.removeAttribute("data");

				// Remove JQuery handlers/data
				if($) {
					this._unbindJQueryEventHandlers();
					this.$element.removeData('slider');
				}
			},

			disable: function() {
				this._state.enabled = false;
				this.handle1.removeAttribute("tabindex");
				this.handle2.removeAttribute("tabindex");
				this._addClass(this.sliderElem, 'slider-disabled');
				this._trigger('slideDisabled');

				return this;
			},

			enable: function() {
				this._state.enabled = true;
				this.handle1.setAttribute("tabindex", 0);
				this.handle2.setAttribute("tabindex", 0);
				this._removeClass(this.sliderElem, 'slider-disabled');
				this._trigger('slideEnabled');

				return this;
			},

			toggle: function() {
				if(this._state.enabled) {
					this.disable();
				} else {
					this.enable();
				}
				return this;
			},

			isEnabled: function() {
				return this._state.enabled;
			},

			on: function(evt, callback) {
				this._bindNonQueryEventHandler(evt, callback);
				return this;
			},

      off: function(evt, callback) {
          if($) {
              this.$element.off(evt, callback);
              this.$sliderElem.off(evt, callback);
          } else {
              this._unbindNonQueryEventHandler(evt, callback);
          }
      },

			getAttribute: function(attribute) {
				if(attribute) {
					return this.options[attribute];
				} else {
					return this.options;
				}
			},

			setAttribute: function(attribute, value) {
				this.options[attribute] = value;
				return this;
			},

			refresh: function() {
				this._removeSliderEventHandlers();
				createNewSlider.call(this, this.element, this.options);
				if($) {
					// Bind new instance of slider to the element
					$.data(this.element, 'slider', this);
				}
				return this;
			},

			relayout: function() {
				this._resize();
				this._layout();
				return this;
			},

			/******************************+

						HELPERS

			- Any method that is not part of the public interface.
			- Place it underneath this comment block and write its signature like so:

			  					_fnName : function() {...}

			********************************/
			_removeSliderEventHandlers: function() {
				// Remove keydown event listeners
				this.handle1.removeEventListener("keydown", this.handle1Keydown, false);
				this.handle2.removeEventListener("keydown", this.handle2Keydown, false);

				if (this.showTooltip) {
					this.handle1.removeEventListener("focus", this.showTooltip, false);
					this.handle2.removeEventListener("focus", this.showTooltip, false);
				}
				if (this.hideTooltip) {
					this.handle1.removeEventListener("blur", this.hideTooltip, false);
					this.handle2.removeEventListener("blur", this.hideTooltip, false);
				}

				// Remove event listeners from sliderElem
				if (this.showTooltip) {
					this.sliderElem.removeEventListener("mouseenter", this.showTooltip, false);
				}
				if (this.hideTooltip) {
					this.sliderElem.removeEventListener("mouseleave", this.hideTooltip, false);
				}
				this.sliderElem.removeEventListener("touchstart", this.touchstart, false);
				this.sliderElem.removeEventListener("touchmove", this.touchmove, false);
				this.sliderElem.removeEventListener("mousedown", this.mousedown, false);

				// Remove window event listener
				window.removeEventListener("resize", this.resize, false);
			},
			_bindNonQueryEventHandler: function(evt, callback) {
				if(this.eventToCallbackMap[evt] === undefined) {
					this.eventToCallbackMap[evt] = [];
				}
				this.eventToCallbackMap[evt].push(callback);
			},
      _unbindNonQueryEventHandler: function(evt, callback) {
          var callbacks = this.eventToCallbackMap[evt];
          if(callbacks !== undefined) {
              for (var i = 0; i < callbacks.length; i++) {
                  if (callbacks[i] === callback) {
                      callbacks.splice(i, 1);
                      break;
                  }
              }
          }
      },
			_cleanUpEventCallbacksMap: function() {
				var eventNames = Object.keys(this.eventToCallbackMap);
				for(var i = 0; i < eventNames.length; i++) {
					var eventName = eventNames[i];
					this.eventToCallbackMap[eventName] = null;
				}
			},
			_showTooltip: function() {
				if (this.options.tooltip_split === false ){
        	this._addClass(this.tooltip, 'in');
        	this.tooltip_min.style.display = 'none';
        	this.tooltip_max.style.display = 'none';
		    } else {
          this._addClass(this.tooltip_min, 'in');
          this._addClass(this.tooltip_max, 'in');
          this.tooltip.style.display = 'none';
		    }
				this._state.over = true;
			},
			_hideTooltip: function() {
				if (this._state.inDrag === false && this.alwaysShowTooltip !== true) {
					this._removeClass(this.tooltip, 'in');
					this._removeClass(this.tooltip_min, 'in');
					this._removeClass(this.tooltip_max, 'in');
				}
				this._state.over = false;
			},
			_layout: function() {
				var positionPercentages;

				if(this.options.reversed) {
					positionPercentages = [ 100 - this._state.percentage[0], this.options.range ? 100 - this._state.percentage[1] : this._state.percentage[1]];
				}
				else {
					positionPercentages = [ this._state.percentage[0], this._state.percentage[1] ];
				}

				this.handle1.style[this.stylePos] = positionPercentages[0]+'%';
				this.handle1.setAttribute('aria-valuenow', this._state.value[0]);

				this.handle2.style[this.stylePos] = positionPercentages[1]+'%';
				this.handle2.setAttribute('aria-valuenow', this._state.value[1]);

				/* Position ticks and labels */
				if (Array.isArray(this.options.ticks) && this.options.ticks.length > 0) {

					var styleSize = this.options.orientation === 'vertical' ? 'height' : 'width';
					var styleMargin = this.options.orientation === 'vertical' ? 'marginTop' : 'marginLeft';
					var labelSize = this._state.size / (this.options.ticks.length - 1);

					if (this.tickLabelContainer) {
						var extraMargin = 0;
						if (this.options.ticks_positions.length === 0) {
							if (this.options.orientation !== 'vertical') {
								this.tickLabelContainer.style[styleMargin] = -labelSize/2 + 'px';
							}

							extraMargin = this.tickLabelContainer.offsetHeight;
						} else {
							/* Chidren are position absolute, calculate height by finding the max offsetHeight of a child */
							for (i = 0 ; i < this.tickLabelContainer.childNodes.length; i++) {
								if (this.tickLabelContainer.childNodes[i].offsetHeight > extraMargin) {
									extraMargin = this.tickLabelContainer.childNodes[i].offsetHeight;
								}
							}
						}
						if (this.options.orientation === 'horizontal') {
							this.sliderElem.style.marginBottom = extraMargin + 'px';
						}
					}
					for (var i = 0; i < this.options.ticks.length; i++) {

						var percentage = this.options.ticks_positions[i] || this._toPercentage(this.options.ticks[i]);

						if (this.options.reversed) {
							percentage = 100 - percentage;
						}

						this.ticks[i].style[this.stylePos] = percentage + '%';

						/* Set class labels to denote whether ticks are in the selection */
						this._removeClass(this.ticks[i], 'in-selection');
						if (!this.options.range) {
							if (this.options.selection === 'after' && percentage >= positionPercentages[0]){
								this._addClass(this.ticks[i], 'in-selection');
							} else if (this.options.selection === 'before' && percentage <= positionPercentages[0]) {
								this._addClass(this.ticks[i], 'in-selection');
							}
						} else if (percentage >= positionPercentages[0] && percentage <= positionPercentages[1]) {
							this._addClass(this.ticks[i], 'in-selection');
						}

						if (this.tickLabels[i]) {
							this.tickLabels[i].style[styleSize] = labelSize + 'px';

							if (this.options.orientation !== 'vertical' && this.options.ticks_positions[i] !== undefined) {
								this.tickLabels[i].style.position = 'absolute';
								this.tickLabels[i].style[this.stylePos] = percentage + '%';
								this.tickLabels[i].style[styleMargin] = -labelSize/2 + 'px';
							} else if (this.options.orientation === 'vertical') {
								this.tickLabels[i].style['marginLeft'] =  this.sliderElem.offsetWidth + 'px';
								this.tickLabelContainer.style['marginTop'] = this.sliderElem.offsetWidth / 2 * -1 + 'px';
							}
						}
					}
				}

				var formattedTooltipVal;

				if (this.options.range) {
					formattedTooltipVal = this.options.formatter(this._state.value);
					this._setText(this.tooltipInner, formattedTooltipVal);
					this.tooltip.style[this.stylePos] = (positionPercentages[1] + positionPercentages[0])/2 + '%';

					if (this.options.orientation === 'vertical') {
						this._css(this.tooltip, 'margin-top', -this.tooltip.offsetHeight / 2 + 'px');
					} else {
						this._css(this.tooltip, 'margin-left', -this.tooltip.offsetWidth / 2 + 'px');
					}

					if (this.options.orientation === 'vertical') {
						this._css(this.tooltip, 'margin-top', -this.tooltip.offsetHeight / 2 + 'px');
					} else {
						this._css(this.tooltip, 'margin-left', -this.tooltip.offsetWidth / 2 + 'px');
					}

					var innerTooltipMinText = this.options.formatter(this._state.value[0]);
					this._setText(this.tooltipInner_min, innerTooltipMinText);

					var innerTooltipMaxText = this.options.formatter(this._state.value[1]);
					this._setText(this.tooltipInner_max, innerTooltipMaxText);

					this.tooltip_min.style[this.stylePos] = positionPercentages[0] + '%';

					if (this.options.orientation === 'vertical') {
						this._css(this.tooltip_min, 'margin-top', -this.tooltip_min.offsetHeight / 2 + 'px');
					} else {
						this._css(this.tooltip_min, 'margin-left', -this.tooltip_min.offsetWidth / 2 + 'px');
					}

					this.tooltip_max.style[this.stylePos] = positionPercentages[1] + '%';

					if (this.options.orientation === 'vertical') {
						this._css(this.tooltip_max, 'margin-top', -this.tooltip_max.offsetHeight / 2 + 'px');
					} else {
						this._css(this.tooltip_max, 'margin-left', -this.tooltip_max.offsetWidth / 2 + 'px');
					}
				} else {
					formattedTooltipVal = this.options.formatter(this._state.value[0]);
					this._setText(this.tooltipInner, formattedTooltipVal);

					this.tooltip.style[this.stylePos] = positionPercentages[0] + '%';
					if (this.options.orientation === 'vertical') {
						this._css(this.tooltip, 'margin-top', -this.tooltip.offsetHeight / 2 + 'px');
					} else {
						this._css(this.tooltip, 'margin-left', -this.tooltip.offsetWidth / 2 + 'px');
					}
				}

				if (this.options.orientation === 'vertical') {
					this.trackLow.style.top = '0';
					this.trackLow.style.height = Math.min(positionPercentages[0], positionPercentages[1]) +'%';

					this.trackSelection.style.top = Math.min(positionPercentages[0], positionPercentages[1]) +'%';
					this.trackSelection.style.height = Math.abs(positionPercentages[0] - positionPercentages[1]) +'%';

					this.trackHigh.style.bottom = '0';
					this.trackHigh.style.height = (100 - Math.min(positionPercentages[0], positionPercentages[1]) - Math.abs(positionPercentages[0] - positionPercentages[1])) +'%';
				}
				else {
					this.trackLow.style.left = '0';
					this.trackLow.style.width = Math.min(positionPercentages[0], positionPercentages[1]) +'%';

					this.trackSelection.style.left = Math.min(positionPercentages[0], positionPercentages[1]) +'%';
					this.trackSelection.style.width = Math.abs(positionPercentages[0] - positionPercentages[1]) +'%';

					this.trackHigh.style.right = '0';
					this.trackHigh.style.width = (100 - Math.min(positionPercentages[0], positionPercentages[1]) - Math.abs(positionPercentages[0] - positionPercentages[1])) +'%';

			        var offset_min = this.tooltip_min.getBoundingClientRect();
			        var offset_max = this.tooltip_max.getBoundingClientRect();

			        if (this.options.tooltip_position === 'bottom') {
			        	if (offset_min.right > offset_max.left) {
			        		this._removeClass(this.tooltip_max, 'bottom');
			        		this._addClass(this.tooltip_max, 'top');
			        		this.tooltip_max.style.top = '';
                            this.tooltip_max.style.bottom = 22 + 'px';
                        } else {
                            this._removeClass(this.tooltip_max, 'top');
                            this._addClass(this.tooltip_max, 'bottom');
                            this.tooltip_max.style.top = this.tooltip_min.style.top;
                            this.tooltip_max.style.bottom = '';
			        	}
			        } else {
				        if (offset_min.right > offset_max.left) {
				            this._removeClass(this.tooltip_max, 'top');
				            this._addClass(this.tooltip_max, 'bottom');
				            this.tooltip_max.style.top = 18 + 'px';
				        } else {
				            this._removeClass(this.tooltip_max, 'bottom');
				            this._addClass(this.tooltip_max, 'top');
				            this.tooltip_max.style.top = this.tooltip_min.style.top;
				        }
			        }
				}
			},
			_resize: function (ev) {
				/*jshint unused:false*/
				this._state.offset = this._offset(this.sliderElem);
				this._state.size = this.sliderElem[this.sizePos];
				this._layout();
			},
			_removeProperty: function(element, prop) {
				if (element.style.removeProperty) {
				    element.style.removeProperty(prop);
				} else {
				    element.style.removeAttribute(prop);
				}
			},
			_mousedown: function(ev) {
				if(!this._state.enabled) {
					return false;
				}

				this._state.offset = this._offset(this.sliderElem);
				this._state.size = this.sliderElem[this.sizePos];

				var percentage = this._getPercentage(ev);

				if (this.options.range) {
					var diff1 = Math.abs(this._state.percentage[0] - percentage);
					var diff2 = Math.abs(this._state.percentage[1] - percentage);
					this._state.dragged = (diff1 < diff2) ? 0 : 1;
					this._adjustPercentageForRangeSliders(percentage);
				} else {
					this._state.dragged = 0;
				}

				this._state.percentage[this._state.dragged] = percentage;
				this._layout();

				if (this.touchCapable) {
					document.removeEventListener("touchmove", this.mousemove, false);
					document.removeEventListener("touchend", this.mouseup, false);
				}

				if(this.mousemove){
					document.removeEventListener("mousemove", this.mousemove, false);
				}
				if(this.mouseup){
					document.removeEventListener("mouseup", this.mouseup, false);
				}

				this.mousemove = this._mousemove.bind(this);
				this.mouseup = this._mouseup.bind(this);

				if (this.touchCapable) {
					// Touch: Bind touch events:
					document.addEventListener("touchmove", this.mousemove, false);
					document.addEventListener("touchend", this.mouseup, false);
				}
				// Bind mouse events:
				document.addEventListener("mousemove", this.mousemove, false);
				document.addEventListener("mouseup", this.mouseup, false);

				this._state.inDrag = true;
				var newValue = this._calculateValue();

				this._trigger('slideStart', newValue);

				this._setDataVal(newValue);
				this.setValue(newValue, false, true);

				this._pauseEvent(ev);

				if (this.options.focus) {
					this._triggerFocusOnHandle(this._state.dragged);
				}

				return true;
			},
			_touchstart: function(ev) {
				if (ev.changedTouches === undefined) {
					this._mousedown(ev);
					return;
				}

				var touch = ev.changedTouches[0];
				this.touchX = touch.pageX;
				this.touchY = touch.pageY;
			},
			_triggerFocusOnHandle: function(handleIdx) {
				if(handleIdx === 0) {
					this.handle1.focus();
				}
				if(handleIdx === 1) {
					this.handle2.focus();
				}
			},
			_keydown: function(handleIdx, ev) {
				if(!this._state.enabled) {
					return false;
				}

				var dir;
				switch (ev.keyCode) {
					case 37: // left
					case 40: // down
						dir = -1;
						break;
					case 39: // right
					case 38: // up
						dir = 1;
						break;
				}
				if (!dir) {
					return;
				}

				// use natural arrow keys instead of from min to max
				if (this.options.natural_arrow_keys) {
					var ifVerticalAndNotReversed = (this.options.orientation === 'vertical' && !this.options.reversed);
					var ifHorizontalAndReversed = (this.options.orientation === 'horizontal' && this.options.reversed);

					if (ifVerticalAndNotReversed || ifHorizontalAndReversed) {
						dir = -dir;
					}
				}

				var val = this._state.value[handleIdx] + dir * this.options.step;
				if (this.options.range) {
					val = [ (!handleIdx) ? val : this._state.value[0],
						    ( handleIdx) ? val : this._state.value[1]];
				}

				this._trigger('slideStart', val);
				this._setDataVal(val);
				this.setValue(val, true, true);

				this._setDataVal(val);
				this._trigger('slideStop', val);
				this._layout();

				this._pauseEvent(ev);

				return false;
			},
			_pauseEvent: function(ev) {
				if(ev.stopPropagation) {
					ev.stopPropagation();
				}
			    if(ev.preventDefault) {
			    	ev.preventDefault();
			    }
			    ev.cancelBubble=true;
			    ev.returnValue=false;
			},
			_mousemove: function(ev) {
				if(!this._state.enabled) {
					return false;
				}

				var percentage = this._getPercentage(ev);
				this._adjustPercentageForRangeSliders(percentage);
				this._state.percentage[this._state.dragged] = percentage;
				this._layout();

				var val = this._calculateValue(true);
				this.setValue(val, true, true);

				return false;
			},
			_touchmove: function(ev) {
				if (ev.changedTouches === undefined) {
					return;
				}

				var touch = ev.changedTouches[0];

				var xDiff = touch.pageX - this.touchX;
				var yDiff = touch.pageY - this.touchY;

				if (!this._state.inDrag) {
					// Vertical Slider
					if (this.options.orientation === 'vertical' && (xDiff <= 5 && xDiff >= -5) && (yDiff >=15 || yDiff <= -15)) {
						this._mousedown(ev);
					}
					// Horizontal slider.
					else if ((yDiff <= 5 && yDiff >= -5) && (xDiff >= 15 || xDiff <= -15)) {
						this._mousedown(ev);
					}
				}
			},
			_adjustPercentageForRangeSliders: function(percentage) {
				if (this.options.range) {
					var precision = this._getNumDigitsAfterDecimalPlace(percentage);
					precision = precision ? precision - 1 : 0;
					var percentageWithAdjustedPrecision = this._applyToFixedAndParseFloat(percentage, precision);
					if (this._state.dragged === 0 && this._applyToFixedAndParseFloat(this._state.percentage[1], precision) < percentageWithAdjustedPrecision) {
						this._state.percentage[0] = this._state.percentage[1];
						this._state.dragged = 1;
					} else if (this._state.dragged === 1 && this._applyToFixedAndParseFloat(this._state.percentage[0], precision) > percentageWithAdjustedPrecision) {
						this._state.percentage[1] = this._state.percentage[0];
						this._state.dragged = 0;
					}
				}
			},
			_mouseup: function() {
				if(!this._state.enabled) {
					return false;
				}
				if (this.touchCapable) {
					// Touch: Unbind touch event handlers:
					document.removeEventListener("touchmove", this.mousemove, false);
					document.removeEventListener("touchend", this.mouseup, false);
				}
                // Unbind mouse event handlers:
                document.removeEventListener("mousemove", this.mousemove, false);
                document.removeEventListener("mouseup", this.mouseup, false);

				this._state.inDrag = false;
				if (this._state.over === false) {
					this._hideTooltip();
				}
				var val = this._calculateValue(true);

				this._layout();
				this._setDataVal(val);
				this._trigger('slideStop', val);

				return false;
			},
			_calculateValue: function(snapToClosestTick) {
				var val;
				if (this.options.range) {
					val = [this.options.min,this.options.max];
			        if (this._state.percentage[0] !== 0){
			            val[0] = this._toValue(this._state.percentage[0]);
			            val[0] = this._applyPrecision(val[0]);
			        }
			        if (this._state.percentage[1] !== 100){
			            val[1] = this._toValue(this._state.percentage[1]);
			            val[1] = this._applyPrecision(val[1]);
			        }
				} else {
		            val = this._toValue(this._state.percentage[0]);
					val = parseFloat(val);
					val = this._applyPrecision(val);
				}

				if (snapToClosestTick) {
					var min = [val, Infinity];
					for (var i = 0; i < this.options.ticks.length; i++) {
						var diff = Math.abs(this.options.ticks[i] - val);
						if (diff <= min[1]) {
							min = [this.options.ticks[i], diff];
						}
					}
					if (min[1] <= this.options.ticks_snap_bounds) {
						return min[0];
					}
				}

				return val;
			},
			_applyPrecision: function(val) {
				var precision = this.options.precision || this._getNumDigitsAfterDecimalPlace(this.options.step);
				return this._applyToFixedAndParseFloat(val, precision);
			},
			_getNumDigitsAfterDecimalPlace: function(num) {
				var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
				if (!match) { return 0; }
				return Math.max(0, (match[1] ? match[1].length : 0) - (match[2] ? +match[2] : 0));
			},
			_applyToFixedAndParseFloat: function(num, toFixedInput) {
				var truncatedNum = num.toFixed(toFixedInput);
				return parseFloat(truncatedNum);
			},
			/*
				Credits to Mike Samuel for the following method!
				Source: http://stackoverflow.com/questions/10454518/javascript-how-to-retrieve-the-number-of-decimals-of-a-string-number
			*/
			_getPercentage: function(ev) {
				if (this.touchCapable && (ev.type === 'touchstart' || ev.type === 'touchmove')) {
					ev = ev.touches[0];
				}

				var eventPosition = ev[this.mousePos];
				var sliderOffset = this._state.offset[this.stylePos];
				var distanceToSlide = eventPosition - sliderOffset;
				// Calculate what percent of the length the slider handle has slid
				var percentage = (distanceToSlide / this._state.size) * 100;
				percentage = Math.round(percentage / this._state.percentage[2]) * this._state.percentage[2];
				if (this.options.reversed) {
					percentage = 100 - percentage;
				}

				// Make sure the percent is within the bounds of the slider.
				// 0% corresponds to the 'min' value of the slide
				// 100% corresponds to the 'max' value of the slide
				return Math.max(0, Math.min(100, percentage));
			},
			_validateInputValue: function(val) {
				if (typeof val === 'number') {
					return val;
				} else if (Array.isArray(val)) {
					this._validateArray(val);
					return val;
				} else {
					throw new Error( ErrorMsgs.formatInvalidInputErrorMsg(val) );
				}
			},
			_validateArray: function(val) {
				for(var i = 0; i < val.length; i++) {
					var input =  val[i];
					if (typeof input !== 'number') { throw new Error( ErrorMsgs.formatInvalidInputErrorMsg(input) ); }
				}
			},
			_setDataVal: function(val) {
				this.element.setAttribute('data-value', val);
				this.element.setAttribute('value', val);
        this.element.value = val;
			},
			_trigger: function(evt, val) {
				val = (val || val === 0) ? val : undefined;

				var callbackFnArray = this.eventToCallbackMap[evt];
				if(callbackFnArray && callbackFnArray.length) {
					for(var i = 0; i < callbackFnArray.length; i++) {
						var callbackFn = callbackFnArray[i];
						callbackFn(val);
					}
				}

				/* If JQuery exists, trigger JQuery events */
				if($) {
					this._triggerJQueryEvent(evt, val);
				}
			},
			_triggerJQueryEvent: function(evt, val) {
				var eventData = {
					type: evt,
					value: val
				};
				this.$element.trigger(eventData);
				this.$sliderElem.trigger(eventData);
			},
			_unbindJQueryEventHandlers: function() {
				this.$element.off();
				this.$sliderElem.off();
			},
			_setText: function(element, text) {
                if(typeof element.textContent !== "undefined") {
                    element.textContent = text;
                } else if(typeof element.innerText !== "undefined") {
                	element.innerText = text;
                }
			},
			_removeClass: function(element, classString) {
				var classes = classString.split(" ");
				var newClasses = element.className;

				for(var i = 0; i < classes.length; i++) {
					var classTag = classes[i];
					var regex = new RegExp("(?:\\s|^)" + classTag + "(?:\\s|$)");
					newClasses = newClasses.replace(regex, " ");
				}

				element.className = newClasses.trim();
			},
			_addClass: function(element, classString) {
				var classes = classString.split(" ");
				var newClasses = element.className;

				for(var i = 0; i < classes.length; i++) {
					var classTag = classes[i];
					var regex = new RegExp("(?:\\s|^)" + classTag + "(?:\\s|$)");
					var ifClassExists = regex.test(newClasses);

					if(!ifClassExists) {
						newClasses += " " + classTag;
					}
				}

				element.className = newClasses.trim();
			},
			_offsetLeft: function(obj){
				return obj.getBoundingClientRect().left;
			},
			_offsetTop: function(obj){
				var offsetTop = obj.offsetTop;
				while((obj = obj.offsetParent) && !isNaN(obj.offsetTop)){
					offsetTop += obj.offsetTop;
					if( obj.tagName !== 'BODY') {
						offsetTop -= obj.scrollTop;
					}
				}
				return offsetTop;
			},
		    _offset: function (obj) {
				return {
					left: this._offsetLeft(obj),
					top: this._offsetTop(obj)
				};
		    },
			_css: function(elementRef, styleName, value) {
                if ($) {
                    $.style(elementRef, styleName, value);
                } else {
                    var style = styleName.replace(/^-ms-/, "ms-").replace(/-([\da-z])/gi, function (all, letter) {
                        return letter.toUpperCase();
                    });
                    elementRef.style[style] = value;
                }
			},
			_toValue: function(percentage) {
				return this.options.scale.toValue.apply(this, [percentage]);
			},
			_toPercentage: function(value) {
				return this.options.scale.toPercentage.apply(this, [value]);
			},
			_setTooltipPosition: function(){
				var tooltips = [this.tooltip, this.tooltip_min, this.tooltip_max];
				if (this.options.orientation === 'vertical'){
					var tooltipPos = this.options.tooltip_position || 'right';
					var oppositeSide = (tooltipPos === 'left') ? 'right' : 'left';
					tooltips.forEach(function(tooltip){
						this._addClass(tooltip, tooltipPos);
						tooltip.style[oppositeSide] = '100%';
					}.bind(this));
				} else if(this.options.tooltip_position === 'bottom') {
					tooltips.forEach(function(tooltip){
						this._addClass(tooltip, 'bottom');
						tooltip.style.top = 22 + 'px';
					}.bind(this));
				} else {
					tooltips.forEach(function(tooltip){
						this._addClass(tooltip, 'top');
						tooltip.style.top = -this.tooltip.outerHeight - 14 + 'px';
					}.bind(this));
				}
			}
		};

		/*********************************

			Attach to global namespace

		*********************************/
		if($) {
			var autoRegisterNamespace;

			if (!$.fn.slider) {
				$.bridget(NAMESPACE_MAIN, Slider);
				autoRegisterNamespace = NAMESPACE_MAIN;
			}
			else {
				if (windowIsDefined) {
					window.console.warn("bootstrap-slider.js - WARNING: $.fn.slider namespace is already bound. Use the $.fn.bootstrapSlider namespace instead.");
				}
				autoRegisterNamespace = NAMESPACE_ALTERNATE;
			}
			$.bridget(NAMESPACE_ALTERNATE, Slider);

			// Auto-Register data-provide="slider" Elements
			$(function() {
				$("input[data-provide=slider]")[autoRegisterNamespace]();
			});
		}

	})( $ );

	return Slider;
}));


(function ($) {
    'use strict';

    //<editor-fold desc="Shims">
    if (!String.prototype.includes) {
        (function () {
            'use strict'; // needed to support `apply`/`call` with `undefined`/`null`
            var toString = {}.toString;
            var defineProperty = (function () {
                // IE 8 only supports `Object.defineProperty` on DOM elements
                try {
                    var object = {};
                    var $defineProperty = Object.defineProperty;
                    var result = $defineProperty(object, object, object) && $defineProperty;
                } catch (error) {
                }
                return result;
            }());
            var indexOf = ''.indexOf;
            var includes = function (search) {
                if (this == null) {
                    throw new TypeError();
                }
                var string = String(this);
                if (search && toString.call(search) == '[object RegExp]') {
                    throw new TypeError();
                }
                var stringLength = string.length;
                var searchString = String(search);
                var searchLength = searchString.length;
                var position = arguments.length > 1 ? arguments[1] : undefined;
                // `ToInteger`
                var pos = position ? Number(position) : 0;
                if (pos != pos) { // better `isNaN`
                    pos = 0;
                }
                var start = Math.min(Math.max(pos, 0), stringLength);
                // Avoid the `indexOf` call if no match is possible
                if (searchLength + start > stringLength) {
                    return false;
                }
                return indexOf.call(string, searchString, pos) != -1;
            };
            if (defineProperty) {
                defineProperty(String.prototype, 'includes', {
                    'value': includes,
                    'configurable': true,
                    'writable': true
                });
            } else {
                String.prototype.includes = includes;
            }
        }());
    }

    if (!String.prototype.startsWith) {
        (function () {
            'use strict'; // needed to support `apply`/`call` with `undefined`/`null`
            var defineProperty = (function () {
                // IE 8 only supports `Object.defineProperty` on DOM elements
                try {
                    var object = {};
                    var $defineProperty = Object.defineProperty;
                    var result = $defineProperty(object, object, object) && $defineProperty;
                } catch (error) {
                }
                return result;
            }());
            var toString = {}.toString;
            var startsWith = function (search) {
                if (this == null) {
                    throw new TypeError();
                }
                var string = String(this);
                if (search && toString.call(search) == '[object RegExp]') {
                    throw new TypeError();
                }
                var stringLength = string.length;
                var searchString = String(search);
                var searchLength = searchString.length;
                var position = arguments.length > 1 ? arguments[1] : undefined;
                // `ToInteger`
                var pos = position ? Number(position) : 0;
                if (pos != pos) { // better `isNaN`
                    pos = 0;
                }
                var start = Math.min(Math.max(pos, 0), stringLength);
                // Avoid the `indexOf` call if no match is possible
                if (searchLength + start > stringLength) {
                    return false;
                }
                var index = -1;
                while (++index < searchLength) {
                    if (string.charCodeAt(start + index) != searchString.charCodeAt(index)) {
                        return false;
                    }
                }
                return true;
            };
            if (defineProperty) {
                defineProperty(String.prototype, 'startsWith', {
                    'value': startsWith,
                    'configurable': true,
                    'writable': true
                });
            } else {
                String.prototype.startsWith = startsWith;
            }
        }());
    }

    if (!Object.keys) {
        Object.keys = function (
            o, // object
            k, // key
            r  // result array
        ){
            // initialize object and result
            r=[];
            // iterate over object keys
            for (k in o)
                // fill result array with non-prototypical keys
                r.hasOwnProperty.call(o, k) && r.push(k);
            // return result
            return r;
        };
    }

    // set data-selected on options that are programmatically selected
    // prior to initialization of bootstrap-select
    var _val = $.fn.val;
    $.fn.val = function(value){
        if (this.is('select') && value) {
            this.find('option[value="' + value + '"]').data('selected', true);
        }

        return _val.apply(this, arguments);
    };

    var changed_arguments = null;
    $.fn.triggerNative = function (eventName) {
        var el = this[0],
            event;

        if (el.dispatchEvent) {
            if (typeof Event === 'function') {
                // For modern browsers
                event = new Event(eventName, {
                    bubbles: true
                });
            } else {
                // For IE since it doesn't support Event constructor
                event = document.createEvent('Event');
                event.initEvent(eventName, true, false);
            }

            el.dispatchEvent(event);
        } else {
            if (el.fireEvent) {
                event = document.createEventObject();
                event.eventType = eventName;
                el.fireEvent('on' + eventName, event);
            }

            this.trigger(eventName);
        }
    };
    //</editor-fold>

    // Case insensitive contains search
    $.expr.pseudos.icontains = function (obj, index, meta) {
        var $obj = $(obj);
        var haystack = ($obj.data('tokens') || $obj.text()).toString().toUpperCase();
        return haystack.includes(meta[3].toUpperCase());
    };

    // Case insensitive begins search
    $.expr.pseudos.ibegins = function (obj, index, meta) {
        var $obj = $(obj);
        var haystack = ($obj.data('tokens') || $obj.text()).toString().toUpperCase();
        return haystack.startsWith(meta[3].toUpperCase());
    };

    // Case and accent insensitive contains search
    $.expr.pseudos.aicontains = function (obj, index, meta) {
        var $obj = $(obj);
        var haystack = ($obj.data('tokens') || $obj.data('normalizedText') || $obj.text()).toString().toUpperCase();
        return haystack.includes(meta[3].toUpperCase());
    };

    // Case and accent insensitive begins search
    $.expr.pseudos.aibegins = function (obj, index, meta) {
        var $obj = $(obj);
        var haystack = ($obj.data('tokens') || $obj.data('normalizedText') || $obj.text()).toString().toUpperCase();
        return haystack.startsWith(meta[3].toUpperCase());
    };

    /**
     * Remove all diatrics from the given text.
     * @access private
     * @param {String} text
     * @returns {String}
     */
    function normalizeToBase(text) {
        var rExps = [
            {re: /[\xC0-\xC6]/g, ch: "A"},
            {re: /[\xE0-\xE6]/g, ch: "a"},
            {re: /[\xC8-\xCB]/g, ch: "E"},
            {re: /[\xE8-\xEB]/g, ch: "e"},
            {re: /[\xCC-\xCF]/g, ch: "I"},
            {re: /[\xEC-\xEF]/g, ch: "i"},
            {re: /[\xD2-\xD6]/g, ch: "O"},
            {re: /[\xF2-\xF6]/g, ch: "o"},
            {re: /[\xD9-\xDC]/g, ch: "U"},
            {re: /[\xF9-\xFC]/g, ch: "u"},
            {re: /[\xC7-\xE7]/g, ch: "c"},
            {re: /[\xD1]/g, ch: "N"},
            {re: /[\xF1]/g, ch: "n"}
        ];
        $.each(rExps, function () {
            text = text.replace(this.re, this.ch);
        });
        return text;
    }


    function htmlEscape(html) {
        var escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '`': '&#x60;'
        };
        var source = '(?:' + Object.keys(escapeMap).join('|') + ')',
            testRegexp = new RegExp(source),
            replaceRegexp = new RegExp(source, 'g'),
            string = html == null ? '' : '' + html;
        return testRegexp.test(string) ? string.replace(replaceRegexp, function (match) {
            return escapeMap[match];
        }) : string;
    }

    var Selectpicker = function (element, options, e) {
        // bootstrap-select has been initialized - revert val back to its original function
        if (_val) {
            $.fn.val = _val;
            _val = null;
        }

        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        this.$element = $(element);
        this.$newElement = null;
        this.$button = null;
        this.$menu = null;
        this.$lis = null;
        this.options = options;

        // If we have no title yet, try to pull it from the html title attribute (jQuery doesnt' pick it up as it's not a
        // data-attribute)
        if (this.options.title === null) {
            this.options.title = this.$element.attr('title');
        }

        //Expose public methods
        this.val = Selectpicker.prototype.val;
        this.render = Selectpicker.prototype.render;
        this.refresh = Selectpicker.prototype.refresh;
        this.setStyle = Selectpicker.prototype.setStyle;
        this.selectAll = Selectpicker.prototype.selectAll;
        this.deselectAll = Selectpicker.prototype.deselectAll;
        this.destroy = Selectpicker.prototype.destroy;
        this.remove = Selectpicker.prototype.remove;
        this.show = Selectpicker.prototype.show;
        this.hide = Selectpicker.prototype.hide;

        this.init();
    };

    Selectpicker.VERSION = '1.11.0';

    // part of this is duplicated in i18n/defaults-en_US.js. Make sure to update both.
    Selectpicker.DEFAULTS = {
        noneSelectedText: '',
        noneResultsText: 'No results matched {0}',
        countSelectedText: function (numSelected, numTotal) {
            return (numSelected == 1) ? "{0} item selected" : "{0} items selected";
        },
        maxOptionsText: function (numAll, numGroup) {
            return [
                (numAll == 1) ? 'Limit reached ({n} item max)' : 'Limit reached ({n} items max)',
                (numGroup == 1) ? 'Group limit reached ({n} item max)' : 'Group limit reached ({n} items max)'
            ];
        },
        selectAllText: 'Select All',
        deselectAllText: 'Deselect All',
        doneButton: false,
        doneButtonText: 'Close',
        multipleSeparator: ', ',
        styleBase: 'btn',
        style: '',
        size: 'auto',
        title: null,
        selectedTextFormat: 'values',
        width: false,
        container: false,
        hideDisabled: false,
        showSubtext: false,
        showIcon: true,
        showContent: true,
        dropupAuto: true,
        header: false,
        liveSearch: false,
        liveSearchPlaceholder: null,
        liveSearchNormalize: false,
        liveSearchStyle: 'contains',
        actionsBox: false,
        iconBase: 'glyphicon',
        tickIcon: 'glyphicon-ok',
        showTick: false,
        template: {
            caret: '<span class="caret"></span>'
        },
        maxOptions: false,
        mobile: false,
        selectOnTab: false,
        dropdownAlignRight: false
    };

    Selectpicker.prototype = {

        constructor: Selectpicker,

        init: function () {
            var that = this,
                id = this.$element.attr('id');

            this.$element.addClass('bs-select-hidden');

            // store originalIndex (key) and newIndex (value) in this.liObj for fast accessibility
            // allows us to do this.$lis.eq(that.liObj[index]) instead of this.$lis.filter('[data-original-index="' + index + '"]')
            this.liObj = {};
            this.multiple = this.$element.prop('multiple');
            this.autofocus = this.$element.prop('autofocus');
            this.$newElement = this.createView();
            this.$element
                .after(this.$newElement)
                .appendTo(this.$newElement);
            this.$button = this.$newElement.children('button');
            this.$menu = this.$newElement.children('.dropdown-menu');
            this.$menuInner = this.$menu.children('.inner');
            this.$searchbox = this.$menu.find('input');

            this.$element.removeClass('bs-select-hidden');

            if (this.options.dropdownAlignRight === true) this.$menu.addClass('dropdown-menu-right');

            if (typeof id !== 'undefined') {
                this.$button.attr('data-id', id);
                $('label[for="' + id + '"]').click(function (e) {
                    e.preventDefault();
                    that.$button.focus();
                });
            }

            this.checkDisabled();
            this.clickListener();
            if (this.options.liveSearch) this.liveSearchListener();
            this.render();
            this.setStyle();
            this.setWidth();
            if (this.options.container) this.selectPosition();
            this.$menu.data('this', this);
            this.$newElement.data('this', this);
            if (this.options.mobile) this.mobile();

            this.$newElement.on({
                'hide.bs.dropdown': function (e) {
                    that.$menuInner.attr('aria-expanded', false);
                    that.$element.trigger('hide.bs.select', e);
                },
                'hidden.bs.dropdown': function (e) {
                    that.$element.trigger('hidden.bs.select', e);
                },
                'show.bs.dropdown': function (e) {
                    that.$menuInner.attr('aria-expanded', true);
                    that.$element.trigger('show.bs.select', e);
                },
                'shown.bs.dropdown': function (e) {
                    that.$element.trigger('shown.bs.select', e);
                }
            });

            if (that.$element[0].hasAttribute('required')) {
                this.$element.on('invalid', function () {
                    that.$button
                        .addClass('bs-invalid')
                        .focus();

                    that.$element.on({
                        'focus.bs.select': function () {
                            that.$button.focus();
                            that.$element.off('focus.bs.select');
                        },
                        'shown.bs.select': function () {
                            that.$element
                                .val(that.$element.val()) // set the value to hide the validation message in Chrome when menu is opened
                                .off('shown.bs.select');
                        },
                        'rendered.bs.select': function () {
                            // if select is no longer invalid, remove the bs-invalid class
                            if (this.validity.valid) that.$button.removeClass('bs-invalid');
                            that.$element.off('rendered.bs.select');
                        }
                    });
                });
            }

            setTimeout(function () {
                that.$element.trigger('loaded.bs.select');
            });
        },

        createDropdown: function () {
            // Options
            // If we are multiple or showTick option is set, then add the show-tick class
            var showTick = (this.multiple || this.options.showTick) ? ' show-tick' : '',
                inputGroup = this.$element.parent().hasClass('input-group') ? ' input-group-btn' : '',
                autofocus = this.autofocus ? ' autofocus' : '';
            // Elements
            var header = this.options.header ? '<div class="popover-title"><button type="button" class="close" aria-hidden="true">&times;</button>' + this.options.header + '</div>' : '';
            var searchbox = this.options.liveSearch ?
            '<div class="bs-searchbox">' +
            '<input type="text" class="form-control" autocomplete="off"' +
            (null === this.options.liveSearchPlaceholder ? '' : ' placeholder="' + htmlEscape(this.options.liveSearchPlaceholder) + '"') + ' role="textbox" aria-label="Search">' +
            '</div>'
                : '';
            var actionsbox = this.multiple && this.options.actionsBox ?
            '<div class="bs-actionsbox">' +
            '<div class="btn-group btn-group-sm btn-block">' +
            '<button type="button" class="actions-btn bs-select-all btn btn-default">' +
            this.options.selectAllText +
            '</button>' +
            '<button type="button" class="actions-btn bs-deselect-all btn btn-default">' +
            this.options.deselectAllText +
            '</button>' +
            '</div>' +
            '</div>'
                : '';
            var donebutton = this.multiple && this.options.doneButton ?
            '<div class="bs-donebutton">' +
            '<div class="btn-group btn-block">' +
            '<button type="button" class="btn btn-sm btn-default">' +
            this.options.doneButtonText +
            '</button>' +
            '</div>' +
            '</div>'
                : '';
            var drop =
                '<div class="bootstrap-select' + showTick + inputGroup + '">' +
                '<button type="button" class="' + this.options.styleBase + ' dropdown-toggle" data-toggle="dropdown"' + autofocus + ' role="button">' +
                '<span class="filter-option"></span>' +
                '</button>' +
                '<div class="dropdown-menu open" role="combobox">' +
                header +
                searchbox +
                actionsbox +
                '<ul class="dropdown-menu inner" role="listbox" aria-expanded="false">' +
                '</ul>' +
                donebutton +
                '</div>' +
                '</div>';

            return $(drop);
        },

        createView: function () {
            var $drop = this.createDropdown(),
                li = this.createLi();

            $drop.find('ul')[0].innerHTML = li;
            return $drop;
        },

        reloadLi: function () {
            //Remove all children.
            this.destroyLi();
            //Re build
            var li = this.createLi();
            this.$menuInner[0].innerHTML = li;
        },

        destroyLi: function () {
            this.$menu.find('li').remove();
        },

        createLi: function () {
            var that = this,
                _li = [],
                optID = 0,
                titleOption = document.createElement('option'),
                liIndex = -1; // increment liIndex whenever a new <li> element is created to ensure liObj is correct

            // Helper functions
            /**
             * @param content
             * @param [index]
             * @param [classes]
             * @param [optgroup]
             * @returns {string}
             */
            var generateLI = function (content, index, classes, optgroup) {
                return '<li' +
                    ((typeof classes !== 'undefined' & '' !== classes) ? ' class="' + classes + '"' : '') +
                    ((typeof index !== 'undefined' & null !== index) ? ' data-original-index="' + index + '"' : '') +
                    ((typeof optgroup !== 'undefined' & null !== optgroup) ? 'data-optgroup="' + optgroup + '"' : '') +
                    '>' + content + '</li>';
            };

            /**
             * @param text
             * @param [classes]
             * @param [inline]
             * @param [tokens]
             * @returns {string}
             */
            var generateA = function (text, classes, inline, tokens) {
                return '<a tabindex="0"' +
                    (typeof classes !== 'undefined' ? ' class="' + classes + '"' : '') +
                    (typeof inline !== 'undefined' ? ' style="' + inline + '"' : '') +
                    (that.options.liveSearchNormalize ? ' data-normalized-text="' + normalizeToBase(htmlEscape(text)) + '"' : '') +
                    (typeof tokens !== 'undefined' || tokens !== null ? ' data-tokens="' + tokens + '"' : '') +
                    ' role="option">' + text +
                    '<span class="' + that.options.iconBase + ' ' + that.options.tickIcon + ' check-mark"></span>' +
                    '</a>';
            };

            if (this.options.title && !this.multiple) {
                // this option doesn't create a new <li> element, but does add a new option, so liIndex is decreased
                // since liObj is recalculated on every refresh, liIndex needs to be decreased even if the titleOption is already appended
                liIndex--;

                if (!this.$element.find('.bs-title-option').length) {
                    // Use native JS to prepend option (faster)
                    var element = this.$element[0];
                    titleOption.className = 'bs-title-option';
                    titleOption.appendChild(document.createTextNode(this.options.title));
                    titleOption.value = '';
                    element.insertBefore(titleOption, element.firstChild);
                    // Check if selected or data-selected attribute is already set on an option. If not, select the titleOption option.
                    // the selected item may have been changed by user or programmatically before the bootstrap select plugin runs,
                    // if so, the option will have the data-selected attribute
                    var $opt = $(element.options[element.selectedIndex]);
                    if ($opt.attr('selected') === undefined && $opt.data('selected') === undefined) {
                        titleOption.selected = true;
                    }
                }
            }

            this.$element.find('option').each(function (index) {
                var $this = $(this);

                liIndex++;

                if ($this.hasClass('bs-title-option')) return;

                // Get the class and text for the option
                var optionClass = this.className || '',
                    inline = this.style.cssText,
                    text = $this.data('content') ? $this.data('content') : $this.html(),
                    tokens = $this.data('tokens') ? $this.data('tokens') : null,
                    subtext = typeof $this.data('subtext') !== 'undefined' ? '<small class="text-muted">' + $this.data('subtext') + '</small>' : '',
                    icon = typeof $this.data('icon') !== 'undefined' ? '<span class="' + that.options.iconBase + ' ' + $this.data('icon') + '"></span> ' : '',
                    $parent = $this.parent(),
                    isOptgroup = $parent[0].tagName === 'OPTGROUP',
                    isOptgroupDisabled = isOptgroup && $parent[0].disabled,
                    isDisabled = this.disabled || isOptgroupDisabled;

                if (icon !== '' && isDisabled) {
                    icon = '<span>' + icon + '</span>';
                }

                if (that.options.hideDisabled && (isDisabled && !isOptgroup || isOptgroupDisabled)) {
                    liIndex--;
                    return;
                }

                if (!$this.data('content')) {
                    // Prepend any icon and append any subtext to the main text.
                    text = icon + '<span class="text">' + text + subtext + '</span>';
                }

                if (isOptgroup && $this.data('divider') !== true) {
                    if (that.options.hideDisabled && isDisabled) {
                        if ($parent.data('allOptionsDisabled') === undefined) {
                            var $options = $parent.children();
                            $parent.data('allOptionsDisabled', $options.filter(':disabled').length === $options.length);
                        }

                        if ($parent.data('allOptionsDisabled')) {
                            liIndex--;
                            return;
                        }
                    }

                    var optGroupClass = ' ' + $parent[0].className || '';

                    if ($this.index() === 0) { // Is it the first option of the optgroup?
                        optID += 1;

                        // Get the opt group label
                        var label = $parent[0].label,
                            labelSubtext = typeof $parent.data('subtext') !== 'undefined' ? '<small class="text-muted">' + $parent.data('subtext') + '</small>' : '',
                            labelIcon = $parent.data('icon') ? '<span class="' + that.options.iconBase + ' ' + $parent.data('icon') + '"></span> ' : '';

                        label = labelIcon + '<span class="text">' + label + labelSubtext + '</span>';

                        if (index !== 0 && _li.length > 0) { // Is it NOT the first option of the select && are there elements in the dropdown?
                            liIndex++;
                            _li.push(generateLI('', null, 'divider', optID + 'div'));
                        }
                        liIndex++;
                        _li.push(generateLI(label, null, 'dropdown-header' + optGroupClass, optID));
                    }

                    if (that.options.hideDisabled && isDisabled) {
                        liIndex--;
                        return;
                    }

                    _li.push(generateLI(generateA(text, 'opt ' + optionClass + optGroupClass, inline, tokens), index, '', optID));
                } else if ($this.data('divider') === true) {
                    _li.push(generateLI('', index, 'divider'));
                } else if ($this.data('hidden') === true) {
                    _li.push(generateLI(generateA(text, optionClass, inline, tokens), index, 'hidden is-hidden'));
                } else {
                    var showDivider = this.previousElementSibling && this.previousElementSibling.tagName === 'OPTGROUP';

                    // if previous element is not an optgroup and hideDisabled is true
                    if (!showDivider && that.options.hideDisabled) {
                        // get previous elements
                        var $prev = $(this).prevAll();

                        for (var i = 0; i < $prev.length; i++) {
                            // find the first element in the previous elements that is an optgroup
                            if ($prev[i].tagName === 'OPTGROUP') {
                                var optGroupDistance = 0;

                                // loop through the options in between the current option and the optgroup
                                // and check if they are hidden or disabled
                                for (var d = 0; d < i; d++) {
                                    var prevOption = $prev[d];
                                    if (prevOption.disabled || $(prevOption).data('hidden') === true) optGroupDistance++;
                                }

                                // if all of the options between the current option and the optgroup are hidden or disabled, show the divider
                                if (optGroupDistance === i) showDivider = true;

                                break;
                            }
                        }
                    }

                    if (showDivider) {
                        liIndex++;
                        _li.push(generateLI('', null, 'divider', optID + 'div'));
                    }
                    _li.push(generateLI(generateA(text, optionClass, inline, tokens), index));
                }

                that.liObj[index] = liIndex;
            });

            //If we are not multiple, we don't have a selected item, and we don't have a title, select the first element so something is set in the button
            if (!this.multiple && this.$element.find('option:selected').length === 0 && !this.options.title) {
                this.$element.find('option').eq(0).prop('selected', true).attr('selected', 'selected');
            }

            return _li.join('');
        },

        findLis: function () {
            if (this.$lis == null) this.$lis = this.$menu.find('li');
            return this.$lis;
        },

        /**
         * @param [updateLi] defaults to true
         */
        render: function (updateLi) {
            var that = this,
                notDisabled;

            //Update the LI to match the SELECT
            if (updateLi !== false) {
                this.$element.find('option').each(function (index) {
                    var $lis = that.findLis().eq(that.liObj[index]);

                    that.setDisabled(index, this.disabled || this.parentNode.tagName === 'OPTGROUP' && this.parentNode.disabled, $lis);
                    that.setSelected(index, this.selected, $lis);
                });
            }

            this.togglePlaceholder();

            this.tabIndex();

            var selectedItems = this.$element.find('option').map(function () {
                if (this.selected) {
                    if (that.options.hideDisabled && (this.disabled || this.parentNode.tagName === 'OPTGROUP' && this.parentNode.disabled)) return;

                    var $this = $(this),
                        icon = $this.data('icon') && that.options.showIcon ? '<i class="' + that.options.iconBase + ' ' + $this.data('icon') + '"></i> ' : '',
                        subtext;

                    if (that.options.showSubtext && $this.data('subtext') && !that.multiple) {
                        subtext = ' <small class="text-muted">' + $this.data('subtext') + '</small>';
                    } else {
                        subtext = '';
                    }
                    if (typeof $this.attr('title') !== 'undefined') {
                        return $this.attr('title');
                    } else if ($this.data('content') && that.options.showContent) {
                        return $this.data('content');
                    } else {
                        return icon + $this.html() + subtext;
                    }
                }
            }).toArray();

            //Fixes issue in IE10 occurring when no default option is selected and at least one option is disabled
            //Convert all the values into a comma delimited string
            var title = !this.multiple ? selectedItems[0] : selectedItems.join(this.options.multipleSeparator);

            //If this is multi select, and the selectText type is count, the show 1 of 2 selected etc..
            if (this.multiple && this.options.selectedTextFormat.indexOf('count') > -1) {
                var max = this.options.selectedTextFormat.split('>');
                if ((max.length > 1 && selectedItems.length > max[1]) || (max.length == 1 && selectedItems.length >= 2)) {
                    notDisabled = this.options.hideDisabled ? ', [disabled]' : '';
                    var totalCount = this.$element.find('option').not('[data-divider="true"], [data-hidden="true"]' + notDisabled).length,
                        tr8nText = (typeof this.options.countSelectedText === 'function') ? this.options.countSelectedText(selectedItems.length, totalCount) : this.options.countSelectedText;
                    title = tr8nText.replace('{0}', selectedItems.length.toString()).replace('{1}', totalCount.toString());
                }
            }

            if (this.options.title == undefined) {
                this.options.title = this.$element.attr('title');
            }

            if (this.options.selectedTextFormat == 'static') {
                title = this.options.title;
            }

            //If we dont have a title, then use the default, or if nothing is set at all, use the not selected text
            if (!title) {
                title = typeof this.options.title !== 'undefined' ? this.options.title : this.options.noneSelectedText;
            }

            //strip all html-tags and trim the result
            this.$button.attr('title', $.trim(title.replace(/<[^>]*>?/g, '')));
            this.$button.children('.filter-option').html(title);

            this.$element.trigger('rendered.bs.select');
        },

        /**
         * @param [style]
         * @param [status]
         */
        setStyle: function (style, status) {
            if (this.$element.attr('class')) {
                this.$newElement.addClass(this.$element.attr('class').replace(/selectpicker|mobile-device|bs-select-hidden|validate\[.*\]/gi, ''));
            }

            var buttonClass = style ? style : this.options.style;

            if (status == 'add') {
                this.$button.addClass(buttonClass);
            } else if (status == 'remove') {
                this.$button.removeClass(buttonClass);
            } else {
                this.$button.removeClass(this.options.style);
                this.$button.addClass(buttonClass);
            }
        },

        liHeight: function (refresh) {
            if (!refresh && (this.options.size === false || this.sizeInfo)) return;

            var newElement = document.createElement('div'),
                menu = document.createElement('div'),
                menuInner = document.createElement('ul'),
                divider = document.createElement('li'),
                li = document.createElement('li'),
                a = document.createElement('a'),
                text = document.createElement('span'),
                header = this.options.header && this.$menu.find('.popover-title').length > 0 ? this.$menu.find('.popover-title')[0].cloneNode(true) : null,
                search = this.options.liveSearch ? document.createElement('div') : null,
                actions = this.options.actionsBox && this.multiple && this.$menu.find('.bs-actionsbox').length > 0 ? this.$menu.find('.bs-actionsbox')[0].cloneNode(true) : null,
                doneButton = this.options.doneButton && this.multiple && this.$menu.find('.bs-donebutton').length > 0 ? this.$menu.find('.bs-donebutton')[0].cloneNode(true) : null;

            text.className = 'text';
            newElement.className = this.$menu[0].parentNode.className + ' open';
            menu.className = 'dropdown-menu open';
            menuInner.className = 'dropdown-menu inner';
            divider.className = 'divider';

            text.appendChild(document.createTextNode('Inner text'));
            a.appendChild(text);
            li.appendChild(a);
            menuInner.appendChild(li);
            menuInner.appendChild(divider);
            if (header) menu.appendChild(header);
            if (search) {
                // create a span instead of input as creating an input element is slower
                var input = document.createElement('span');
                search.className = 'bs-searchbox';
                input.className = 'form-control';
                search.appendChild(input);
                menu.appendChild(search);
            }
            if (actions) menu.appendChild(actions);
            menu.appendChild(menuInner);
            if (doneButton) menu.appendChild(doneButton);
            newElement.appendChild(menu);

            document.body.appendChild(newElement);

            var liHeight = a.offsetHeight,
                headerHeight = header ? header.offsetHeight : 0,
                searchHeight = search ? search.offsetHeight : 0,
                actionsHeight = actions ? actions.offsetHeight : 0,
                doneButtonHeight = doneButton ? doneButton.offsetHeight : 0,
                dividerHeight = $(divider).outerHeight(true),
            // fall back to jQuery if getComputedStyle is not supported
                menuStyle = typeof getComputedStyle === 'function' ? getComputedStyle(menu) : false,
                $menu = menuStyle ? null : $(menu),
                menuPadding = {
                    vert: parseInt(menuStyle ? menuStyle.paddingTop : $menu.css('paddingTop')) +
                    parseInt(menuStyle ? menuStyle.paddingBottom : $menu.css('paddingBottom')) +
                    parseInt(menuStyle ? menuStyle.borderTopWidth : $menu.css('borderTopWidth')) +
                    parseInt(menuStyle ? menuStyle.borderBottomWidth : $menu.css('borderBottomWidth')),
                    horiz: parseInt(menuStyle ? menuStyle.paddingLeft : $menu.css('paddingLeft')) +
                    parseInt(menuStyle ? menuStyle.paddingRight : $menu.css('paddingRight')) +
                    parseInt(menuStyle ? menuStyle.borderLeftWidth : $menu.css('borderLeftWidth')) +
                    parseInt(menuStyle ? menuStyle.borderRightWidth : $menu.css('borderRightWidth'))
                },
                menuExtras =  {
                    vert: menuPadding.vert +
                    parseInt(menuStyle ? menuStyle.marginTop : $menu.css('marginTop')) +
                    parseInt(menuStyle ? menuStyle.marginBottom : $menu.css('marginBottom')) + 2,
                    horiz: menuPadding.horiz +
                    parseInt(menuStyle ? menuStyle.marginLeft : $menu.css('marginLeft')) +
                    parseInt(menuStyle ? menuStyle.marginRight : $menu.css('marginRight')) + 2
                }

            document.body.removeChild(newElement);

            this.sizeInfo = {
                liHeight: liHeight,
                headerHeight: headerHeight,
                searchHeight: searchHeight,
                actionsHeight: actionsHeight,
                doneButtonHeight: doneButtonHeight,
                dividerHeight: dividerHeight,
                menuPadding: menuPadding,
                menuExtras: menuExtras
            };
        },

        setSize: function () {
            this.findLis();
            this.liHeight();

            if (this.options.header) this.$menu.css('padding-top', 0);
            if (this.options.size === false) return;

            var that = this,
                $menu = this.$menu,
                $menuInner = this.$menuInner,
                $window = $(window),
                selectHeight = this.$newElement[0].offsetHeight,
                selectWidth = this.$newElement[0].offsetWidth,
                liHeight = this.sizeInfo['liHeight'],
                headerHeight = this.sizeInfo['headerHeight'],
                searchHeight = this.sizeInfo['searchHeight'],
                actionsHeight = this.sizeInfo['actionsHeight'],
                doneButtonHeight = this.sizeInfo['doneButtonHeight'],
                divHeight = this.sizeInfo['dividerHeight'],
                menuPadding = this.sizeInfo['menuPadding'],
                menuExtras = this.sizeInfo['menuExtras'],
                notDisabled = this.options.hideDisabled ? '.disabled' : '',
                menuHeight,
                menuWidth,
                getHeight,
                getWidth,
                selectOffsetTop,
                selectOffsetBot,
                selectOffsetLeft,
                selectOffsetRight,
                getPos = function() {
                    var pos = that.$newElement.offset(),
                        $container = $(that.options.container),
                        containerPos;

                    if (that.options.container && !$container.is('body')) {
                        containerPos = $container.offset();
                        containerPos.top += parseInt($container.css('borderTopWidth'));
                        containerPos.left += parseInt($container.css('borderLeftWidth'));
                    } else {
                        containerPos = { top: 0, left: 0 };
                    }

                    selectOffsetTop = pos.top - containerPos.top - $window.scrollTop();
                    selectOffsetBot = $window.height() - selectOffsetTop - selectHeight - containerPos.top;
                    selectOffsetLeft = pos.left - containerPos.left - $window.scrollLeft();
                    selectOffsetRight = $window.width() - selectOffsetLeft - selectWidth - containerPos.left;
                };

            getPos();

            if (this.options.size === 'auto') {
                var getSize = function () {
                    var minHeight,
                        hasClass = function (className, include) {
                            return function (element) {
                                if (include) {
                                    return (element.classList ? element.classList.contains(className) : $(element).hasClass(className));
                                } else {
                                    return !(element.classList ? element.classList.contains(className) : $(element).hasClass(className));
                                }
                            };
                        },
                        lis = that.$menuInner[0].getElementsByTagName('li'),
                        lisVisible = Array.prototype.filter ? Array.prototype.filter.call(lis, hasClass('hidden', false)) : that.$lis.not('.hidden'),
                        optGroup = Array.prototype.filter ? Array.prototype.filter.call(lisVisible, hasClass('dropdown-header', true)) : lisVisible.filter('.dropdown-header');

                    getPos();
                    menuHeight = selectOffsetBot - menuExtras.vert;
                    menuWidth = selectOffsetRight - menuExtras.horiz;

                    if (that.options.container) {
                        if (!$menu.data('height')) $menu.data('height', $menu.height());
                        getHeight = $menu.data('height');

                        if (!$menu.data('width')) $menu.data('width', $menu.width());
                        getWidth = $menu.data('width');
                    } else {
                        getHeight = $menu.height();
                        getWidth = $menu.width();
                    }

                    if (that.options.dropupAuto) {
                        that.$newElement.toggleClass('dropup', selectOffsetTop > selectOffsetBot && (menuHeight - menuExtras.vert) < getHeight);
                    }

                    if (that.$newElement.hasClass('dropup')) {
                        menuHeight = selectOffsetTop - menuExtras.vert;
                    }

                    if (that.options.dropdownAlignRight === 'auto') {
                        $menu.toggleClass('dropdown-menu-right', selectOffsetLeft > selectOffsetRight && (menuWidth - menuExtras.horiz) < (getWidth - selectWidth));
                    }

                    if ((lisVisible.length + optGroup.length) > 3) {
                        minHeight = liHeight * 3 + menuExtras.vert - 2;
                    } else {
                        minHeight = 0;
                    }

                    $menu.css({
                        'max-height': menuHeight + 'px',
                        'overflow': 'hidden',
                        'min-height': minHeight + headerHeight + searchHeight + actionsHeight + doneButtonHeight + 'px'
                    });
                    $menuInner.css({
                        'max-height': menuHeight - headerHeight - searchHeight - actionsHeight - doneButtonHeight - menuPadding.vert + 'px',
                        'overflow-y': 'auto',
                        'min-height': Math.max(minHeight - menuPadding.vert, 0) + 'px'
                    });
                };
                getSize();
                this.$searchbox.off('input.getSize propertychange.getSize').on('input.getSize propertychange.getSize', getSize);
                $window.off('resize.getSize scroll.getSize').on('resize.getSize scroll.getSize', getSize);
            } else if (this.options.size && this.options.size != 'auto' && this.$lis.not(notDisabled).length > this.options.size) {
                var optIndex = this.$lis.not('.divider').not(notDisabled).children().slice(0, this.options.size).last().parent().index(),
                    divLength = this.$lis.slice(0, optIndex + 1).filter('.divider').length;
                menuHeight = liHeight * this.options.size + divLength * divHeight + menuPadding.vert;

                if (that.options.container) {
                    if (!$menu.data('height')) $menu.data('height', $menu.height());
                    getHeight = $menu.data('height');
                } else {
                    getHeight = $menu.height();
                }

                if (that.options.dropupAuto) {
                    //noinspection JSUnusedAssignment
                    this.$newElement.toggleClass('dropup', selectOffsetTop > selectOffsetBot && (menuHeight - menuExtras.vert) < getHeight);
                }
                $menu.css({
                    'max-height': menuHeight + headerHeight + searchHeight + actionsHeight + doneButtonHeight + 'px',
                    'overflow': 'hidden',
                    'min-height': ''
                });
                $menuInner.css({
                    'max-height': menuHeight - menuPadding.vert + 'px',
                    'overflow-y': 'auto',
                    'min-height': ''
                });
            }
        },

        setWidth: function () {
            if (this.options.width === 'auto') {
                this.$menu.css('min-width', '0');

                // Get correct width if element is hidden
                var $selectClone = this.$menu.parent().clone().appendTo('body'),
                    $selectClone2 = this.options.container ? this.$newElement.clone().appendTo('body') : $selectClone,
                    ulWidth = $selectClone.children('.dropdown-menu').outerWidth(),
                    btnWidth = $selectClone2.css('width', 'auto').children('button').outerWidth();

                $selectClone.remove();
                $selectClone2.remove();

                // Set width to whatever's larger, button title or longest option
                this.$newElement.css('width', Math.max(ulWidth, btnWidth) + 'px');
            } else if (this.options.width === 'fit') {
                // Remove inline min-width so width can be changed from 'auto'
                this.$menu.css('min-width', '');
                this.$newElement.css('width', '').addClass('fit-width');
            } else if (this.options.width) {
                // Remove inline min-width so width can be changed from 'auto'
                this.$menu.css('min-width', '');
                this.$newElement.css('width', this.options.width);
            } else {
                // Remove inline min-width/width so width can be changed
                this.$menu.css('min-width', '');
                this.$newElement.css('width', '');
            }
            // Remove fit-width class if width is changed programmatically
            if (this.$newElement.hasClass('fit-width') && this.options.width !== 'fit') {
                this.$newElement.removeClass('fit-width');
            }
        },

        selectPosition: function () {
            this.$bsContainer = $('<div class="bs-container" />');

            var that = this,
                $container = $(this.options.container),
                pos,
                containerPos,
                actualHeight,
                getPlacement = function ($element) {
                    that.$bsContainer.addClass($element.attr('class').replace(/form-control|fit-width/gi, '')).toggleClass('dropup', $element.hasClass('dropup'));
                    pos = $element.offset();

                    if (!$container.is('body')) {
                        containerPos = $container.offset();
                        containerPos.top += parseInt($container.css('borderTopWidth')) - $container.scrollTop();
                        containerPos.left += parseInt($container.css('borderLeftWidth')) - $container.scrollLeft();
                    } else {
                        containerPos = { top: 0, left: 0 };
                    }

                    actualHeight = $element.hasClass('dropup') ? 0 : $element[0].offsetHeight;

                    that.$bsContainer.css({
                        'top': pos.top - containerPos.top + actualHeight,
                        'left': pos.left - containerPos.left,
                        'width': $element[0].offsetWidth
                    });
                };

            this.$button.on('click', function () {
                var $this = $(this);

                if (that.isDisabled()) {
                    return;
                }

                getPlacement(that.$newElement);

                that.$bsContainer
                    .appendTo(that.options.container)
                    .toggleClass('open', !$this.hasClass('open'))
                    .append(that.$menu);
            });

            $(window).on('resize scroll', function () {
                getPlacement(that.$newElement);
            });

            this.$element.on('hide.bs.select', function () {
                that.$menu.data('height', that.$menu.height());
                that.$bsContainer.detach();
            });
        },

        /**
         * @param {number} index - the index of the option that is being changed
         * @param {boolean} selected - true if the option is being selected, false if being deselected
         * @param {JQuery} $lis - the 'li' element that is being modified
         */
        setSelected: function (index, selected, $lis) {
            if (!$lis) {
                this.togglePlaceholder(); // check if setSelected is being called by changing the value of the select
                $lis = this.findLis().eq(this.liObj[index]);
            }

            $lis.toggleClass('selected', selected).find('a').attr('aria-selected', selected);
        },

        /**
         * @param {number} index - the index of the option that is being disabled
         * @param {boolean} disabled - true if the option is being disabled, false if being enabled
         * @param {JQuery} $lis - the 'li' element that is being modified
         */
        setDisabled: function (index, disabled, $lis) {
            if (!$lis) {
                $lis = this.findLis().eq(this.liObj[index]);
            }

            if (disabled) {
                $lis.addClass('disabled').children('a').attr('href', '#').attr('tabindex', -1).attr('aria-disabled', true);
            } else {
                $lis.removeClass('disabled').children('a').removeAttr('href').attr('tabindex', 0).attr('aria-disabled', false);
            }
        },

        isDisabled: function () {
            return this.$element[0].disabled;
        },

        checkDisabled: function () {
            var that = this;

            if (this.isDisabled()) {
                this.$newElement.addClass('disabled');
                this.$button.addClass('disabled').attr('tabindex', -1);
            } else {
                if (this.$button.hasClass('disabled')) {
                    this.$newElement.removeClass('disabled');
                    this.$button.removeClass('disabled');
                }

                if (this.$button.attr('tabindex') == -1 && !this.$element.data('tabindex')) {
                    this.$button.removeAttr('tabindex');
                }
            }

            this.$button.click(function () {
                return !that.isDisabled();
            });
        },

        togglePlaceholder: function () {
            var value = this.$element.val();
            this.$button.toggleClass('bs-placeholder', value === null || value === '');
        },

        tabIndex: function () {
            if (this.$element.data('tabindex') !== this.$element.attr('tabindex') &&
                (this.$element.attr('tabindex') !== -98 && this.$element.attr('tabindex') !== '-98')) {
                this.$element.data('tabindex', this.$element.attr('tabindex'));
                this.$button.attr('tabindex', this.$element.data('tabindex'));
            }

            this.$element.attr('tabindex', -98);
        },

        clickListener: function () {
            var that = this,
                $document = $(document);

            this.$newElement.on('touchstart.dropdown', '.dropdown-menu', function (e) {
                e.stopPropagation();
            });

            $document.data('spaceSelect', false);

            this.$button.on('keyup', function (e) {
                if (/(32)/.test(e.keyCode.toString(10)) && $document.data('spaceSelect')) {
                    e.preventDefault();
                    $document.data('spaceSelect', false);
                }
            });

            this.$button.on('click', function () {
                that.setSize();
            });

            this.$element.on('shown.bs.select', function () {
                if (!that.options.liveSearch && !that.multiple) {
                    that.$menuInner.find('.selected a').focus();
                } else if (!that.multiple) {
                    var selectedIndex = that.liObj[that.$element[0].selectedIndex];

                    if (typeof selectedIndex !== 'number' || that.options.size === false) return;

                    // scroll to selected option
                    var offset = that.$lis.eq(selectedIndex)[0].offsetTop - that.$menuInner[0].offsetTop;
                    offset = offset - that.$menuInner[0].offsetHeight/2 + that.sizeInfo.liHeight/2;
                    that.$menuInner[0].scrollTop = offset;
                }
            });

            this.$menuInner.on('click', 'li a', function (e) {
                var $this = $(this),
                    clickedIndex = $this.parent().data('originalIndex'),
                    prevValue = that.$element.val(),
                    prevIndex = that.$element.prop('selectedIndex'),
                    triggerChange = true;

                // Don't close on multi choice menu
                if (that.multiple && that.options.maxOptions !== 1) {
                    e.stopPropagation();
                }

                e.preventDefault();

                //Don't run if we have been disabled
                if (!that.isDisabled() && !$this.parent().hasClass('disabled')) {
                    var $options = that.$element.find('option'),
                        $option = $options.eq(clickedIndex),
                        state = $option.prop('selected'),
                        $optgroup = $option.parent('optgroup'),
                        maxOptions = that.options.maxOptions,
                        maxOptionsGrp = $optgroup.data('maxOptions') || false;

                    if (!that.multiple) { // Deselect all others if not multi select box
                        $options.prop('selected', false);
                        $option.prop('selected', true);
                        that.$menuInner.find('.selected').removeClass('selected').find('a').attr('aria-selected', false);
                        that.setSelected(clickedIndex, true);
                    } else { // Toggle the one we have chosen if we are multi select.
                        $option.prop('selected', !state);
                        that.setSelected(clickedIndex, !state);
                        $this.blur();

                        if (maxOptions !== false || maxOptionsGrp !== false) {
                            var maxReached = maxOptions < $options.filter(':selected').length,
                                maxReachedGrp = maxOptionsGrp < $optgroup.find('option:selected').length;

                            if ((maxOptions && maxReached) || (maxOptionsGrp && maxReachedGrp)) {
                                if (maxOptions && maxOptions == 1) {
                                    $options.prop('selected', false);
                                    $option.prop('selected', true);
                                    that.$menuInner.find('.selected').removeClass('selected');
                                    that.setSelected(clickedIndex, true);
                                } else if (maxOptionsGrp && maxOptionsGrp == 1) {
                                    $optgroup.find('option:selected').prop('selected', false);
                                    $option.prop('selected', true);
                                    var optgroupID = $this.parent().data('optgroup');
                                    that.$menuInner.find('[data-optgroup="' + optgroupID + '"]').removeClass('selected');
                                    that.setSelected(clickedIndex, true);
                                } else {
                                    var maxOptionsText = typeof that.options.maxOptionsText === 'string' ? [that.options.maxOptionsText, that.options.maxOptionsText] : that.options.maxOptionsText,
                                        maxOptionsArr = typeof maxOptionsText === 'function' ? maxOptionsText(maxOptions, maxOptionsGrp) : maxOptionsText,
                                        maxTxt = maxOptionsArr[0].replace('{n}', maxOptions),
                                        maxTxtGrp = maxOptionsArr[1].replace('{n}', maxOptionsGrp),
                                        $notify = $('<div class="notify"></div>');
                                    // If {var} is set in array, replace it
                                    /** @deprecated */
                                    if (maxOptionsArr[2]) {
                                        maxTxt = maxTxt.replace('{var}', maxOptionsArr[2][maxOptions > 1 ? 0 : 1]);
                                        maxTxtGrp = maxTxtGrp.replace('{var}', maxOptionsArr[2][maxOptionsGrp > 1 ? 0 : 1]);
                                    }

                                    $option.prop('selected', false);

                                    that.$menu.append($notify);

                                    if (maxOptions && maxReached) {
                                        $notify.append($('<div>' + maxTxt + '</div>'));
                                        triggerChange = false;
                                        that.$element.trigger('maxReached.bs.select');
                                    }

                                    if (maxOptionsGrp && maxReachedGrp) {
                                        $notify.append($('<div>' + maxTxtGrp + '</div>'));
                                        triggerChange = false;
                                        that.$element.trigger('maxReachedGrp.bs.select');
                                    }

                                    setTimeout(function () {
                                        that.setSelected(clickedIndex, false);
                                    }, 10);

                                    $notify.delay(750).fadeOut(300, function () {
                                        $(this).remove();
                                    });
                                }
                            }
                        }
                    }

                    if (!that.multiple || (that.multiple && that.options.maxOptions === 1)) {
                        that.$button.focus();
                    } else if (that.options.liveSearch) {
                        that.$searchbox.focus();
                    }

                    // Trigger select 'change'
                    if (triggerChange) {
                        if ((prevValue != that.$element.val() && that.multiple) || (prevIndex != that.$element.prop('selectedIndex') && !that.multiple)) {
                            // $option.prop('selected') is current option state (selected/unselected). state is previous option state.
                            changed_arguments = [clickedIndex, $option.prop('selected'), state];
                            that.$element
                                .triggerNative('change');
                        }
                    }
                }
            });

            this.$menu.on('click', 'li.disabled a, .popover-title, .popover-title :not(.close)', function (e) {
                if (e.currentTarget == this) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (that.options.liveSearch && !$(e.target).hasClass('close')) {
                        that.$searchbox.focus();
                    } else {
                        that.$button.focus();
                    }
                }
            });

            this.$menuInner.on('click', '.divider, .dropdown-header', function (e) {
                e.preventDefault();
                e.stopPropagation();
                if (that.options.liveSearch) {
                    that.$searchbox.focus();
                } else {
                    that.$button.focus();
                }
            });

            this.$menu.on('click', '.popover-title .close', function () {
                that.$button.click();
            });

            this.$searchbox.on('click', function (e) {
                e.stopPropagation();
            });

            this.$menu.on('click', '.actions-btn', function (e) {
                if (that.options.liveSearch) {
                    that.$searchbox.focus();
                } else {
                    that.$button.focus();
                }

                e.preventDefault();
                e.stopPropagation();

                if ($(this).hasClass('bs-select-all')) {
                    that.selectAll();
                } else {
                    that.deselectAll();
                }
            });

            this.$element.change(function () {
                that.render(false);
                that.$element.trigger('changed.bs.select', changed_arguments);
                changed_arguments = null;
            });
        },

        liveSearchListener: function () {
            var that = this,
                $no_results = $('<li class="no-results"></li>');

            this.$button.on('click.dropdown.data-api touchstart.dropdown.data-api', function () {
                that.$menuInner.find('.active').removeClass('active');
                if (!!that.$searchbox.val()) {
                    that.$searchbox.val('');
                    that.$lis.not('.is-hidden').removeClass('hidden');
                    if (!!$no_results.parent().length) $no_results.remove();
                }
                if (!that.multiple) that.$menuInner.find('.selected').addClass('active');
                setTimeout(function () {
                    that.$searchbox.focus();
                }, 10);
            });

            this.$searchbox.on('click.dropdown.data-api focus.dropdown.data-api touchend.dropdown.data-api', function (e) {
                e.stopPropagation();
            });

            this.$searchbox.on('input propertychange', function () {
                if (that.$searchbox.val()) {
                    var $searchBase = that.$lis.not('.is-hidden').removeClass('hidden').children('a');
                    if (that.options.liveSearchNormalize) {
                        $searchBase = $searchBase.not(':a' + that._searchStyle() + '("' + normalizeToBase(that.$searchbox.val()) + '")');
                    } else {
                        $searchBase = $searchBase.not(':' + that._searchStyle() + '("' + that.$searchbox.val() + '")');
                    }
                    $searchBase.parent().addClass('hidden');

                    that.$lis.filter('.dropdown-header').each(function () {
                        var $this = $(this),
                            optgroup = $this.data('optgroup');

                        if (that.$lis.filter('[data-optgroup=' + optgroup + ']').not($this).not('.hidden').length === 0) {
                            $this.addClass('hidden');
                            that.$lis.filter('[data-optgroup=' + optgroup + 'div]').addClass('hidden');
                        }
                    });

                    var $lisVisible = that.$lis.not('.hidden');

                    // hide divider if first or last visible, or if followed by another divider
                    $lisVisible.each(function (index) {
                        var $this = $(this);

                        if ($this.hasClass('divider') && (
                            $this.index() === $lisVisible.first().index() ||
                            $this.index() === $lisVisible.last().index() ||
                            $lisVisible.eq(index + 1).hasClass('divider'))) {
                            $this.addClass('hidden');
                        }
                    });

                    if (!that.$lis.not('.hidden, .no-results').length) {
                        if (!!$no_results.parent().length) {
                            $no_results.remove();
                        }
                        $no_results.html(that.options.noneResultsText.replace('{0}', '"' + htmlEscape(that.$searchbox.val()) + '"')).show();
                        that.$menuInner.append($no_results);
                    } else if (!!$no_results.parent().length) {
                        $no_results.remove();
                    }
                } else {
                    that.$lis.not('.is-hidden').removeClass('hidden');
                    if (!!$no_results.parent().length) {
                        $no_results.remove();
                    }
                }

                that.$lis.filter('.active').removeClass('active');
                if (that.$searchbox.val()) that.$lis.not('.hidden, .divider, .dropdown-header').eq(0).addClass('active').children('a').focus();
                $(this).focus();
            });
        },

        _searchStyle: function () {
            var styles = {
                begins: 'ibegins',
                startsWith: 'ibegins'
            };

            return styles[this.options.liveSearchStyle] || 'icontains';
        },

        val: function (value) {
            if (typeof value !== 'undefined') {
                this.$element.val(value);
                this.render();

                return this.$element;
            } else {
                return this.$element.val();
            }
        },

        changeAll: function (status) {
            if (!this.multiple) return;
            if (typeof status === 'undefined') status = true;

            this.findLis();

            var $options = this.$element.find('option'),
                $lisVisible = this.$lis.not('.divider, .dropdown-header, .disabled, .hidden'),
                lisVisLen = $lisVisible.length,
                selectedOptions = [];

            if (status) {
                if ($lisVisible.filter('.selected').length === $lisVisible.length) return;
            } else {
                if ($lisVisible.filter('.selected').length === 0) return;
            }

            $lisVisible.toggleClass('selected', status);

            for (var i = 0; i < lisVisLen; i++) {
                var origIndex = $lisVisible[i].getAttribute('data-original-index');
                selectedOptions[selectedOptions.length] = $options.eq(origIndex)[0];
            }

            $(selectedOptions).prop('selected', status);

            this.render(false);

            this.togglePlaceholder();

            this.$element
                .triggerNative('change');
        },

        selectAll: function () {
            return this.changeAll(true);
        },

        deselectAll: function () {
            return this.changeAll(false);
        },

        toggle: function (e) {
            e = e || window.event;

            if (e) e.stopPropagation();

            this.$button.trigger('click');
        },

        keydown: function (e) {
            var $this = $(this),
                $parent = $this.is('input') ? $this.parent().parent() : $this.parent(),
                $items,
                that = $parent.data('this'),
                index,
                next,
                first,
                last,
                prev,
                nextPrev,
                prevIndex,
                isActive,
                selector = ':not(.disabled, .hidden, .dropdown-header, .divider)',
                keyCodeMap = {
                    32: ' ',
                    48: '0',
                    49: '1',
                    50: '2',
                    51: '3',
                    52: '4',
                    53: '5',
                    54: '6',
                    55: '7',
                    56: '8',
                    57: '9',
                    59: ';',
                    65: 'a',
                    66: 'b',
                    67: 'c',
                    68: 'd',
                    69: 'e',
                    70: 'f',
                    71: 'g',
                    72: 'h',
                    73: 'i',
                    74: 'j',
                    75: 'k',
                    76: 'l',
                    77: 'm',
                    78: 'n',
                    79: 'o',
                    80: 'p',
                    81: 'q',
                    82: 'r',
                    83: 's',
                    84: 't',
                    85: 'u',
                    86: 'v',
                    87: 'w',
                    88: 'x',
                    89: 'y',
                    90: 'z',
                    96: '0',
                    97: '1',
                    98: '2',
                    99: '3',
                    100: '4',
                    101: '5',
                    102: '6',
                    103: '7',
                    104: '8',
                    105: '9'
                };

            if (that.options.liveSearch) $parent = $this.parent().parent();

            if (that.options.container) $parent = that.$menu;

            $items = $('[role="listbox"] li', $parent);

            isActive = that.$newElement.hasClass('open');

            if (!isActive && (e.keyCode >= 48 && e.keyCode <= 57 || e.keyCode >= 96 && e.keyCode <= 105 || e.keyCode >= 65 && e.keyCode <= 90)) {
                if (!that.options.container) {
                    that.setSize();
                    that.$menu.parent().addClass('open');
                    isActive = true;
                } else {
                    that.$button.trigger('click');
                }
                that.$searchbox.focus();
                return;
            }

            if (that.options.liveSearch) {
                if (/(^9$|27)/.test(e.keyCode.toString(10)) && isActive && that.$menu.find('.active').length === 0) {
                    e.preventDefault();
                    that.$menu.parent().removeClass('open');
                    if (that.options.container) that.$newElement.removeClass('open');
                    that.$button.focus();
                }
                // $items contains li elements when liveSearch is enabled
                $items = $('[role="listbox"] li' + selector, $parent);
                if (!$this.val() && !/(38|40)/.test(e.keyCode.toString(10))) {
                    if ($items.filter('.active').length === 0) {
                        $items = that.$menuInner.find('li');
                        if (that.options.liveSearchNormalize) {
                            $items = $items.filter(':a' + that._searchStyle() + '(' + normalizeToBase(keyCodeMap[e.keyCode]) + ')');
                        } else {
                            $items = $items.filter(':' + that._searchStyle() + '(' + keyCodeMap[e.keyCode] + ')');
                        }
                    }
                }
            }

            if (!$items.length) return;

            if (/(38|40)/.test(e.keyCode.toString(10))) {
                index = $items.index($items.find('a').filter(':focus').parent());
                first = $items.filter(selector).first().index();
                last = $items.filter(selector).last().index();
                next = $items.eq(index).nextAll(selector).eq(0).index();
                prev = $items.eq(index).prevAll(selector).eq(0).index();
                nextPrev = $items.eq(next).prevAll(selector).eq(0).index();

                if (that.options.liveSearch) {
                    $items.each(function (i) {
                        if (!$(this).hasClass('disabled')) {
                            $(this).data('index', i);
                        }
                    });
                    index = $items.index($items.filter('.active'));
                    first = $items.first().data('index');
                    last = $items.last().data('index');
                    next = $items.eq(index).nextAll().eq(0).data('index');
                    prev = $items.eq(index).prevAll().eq(0).data('index');
                    nextPrev = $items.eq(next).prevAll().eq(0).data('index');
                }

                prevIndex = $this.data('prevIndex');

                if (e.keyCode == 38) {
                    if (that.options.liveSearch) index--;
                    if (index != nextPrev && index > prev) index = prev;
                    if (index < first) index = first;
                    if (index == prevIndex) index = last;
                } else if (e.keyCode == 40) {
                    if (that.options.liveSearch) index++;
                    if (index == -1) index = 0;
                    if (index != nextPrev && index < next) index = next;
                    if (index > last) index = last;
                    if (index == prevIndex) index = first;
                }

                $this.data('prevIndex', index);

                if (!that.options.liveSearch) {
                    $items.eq(index).children('a').focus();
                } else {
                    e.preventDefault();
                    if (!$this.hasClass('dropdown-toggle')) {
                        $items.removeClass('active').eq(index).addClass('active').children('a').focus();
                        $this.focus();
                    }
                }

            } else if (!$this.is('input')) {
                var keyIndex = [],
                    count,
                    prevKey;

                $items.each(function () {
                    if (!$(this).hasClass('disabled')) {
                        if ($.trim($(this).children('a').text().toLowerCase()).substring(0, 1) == keyCodeMap[e.keyCode]) {
                            keyIndex.push($(this).index());
                        }
                    }
                });

                count = $(document).data('keycount');
                count++;
                $(document).data('keycount', count);

                prevKey = $.trim($(':focus').text().toLowerCase()).substring(0, 1);

                if (prevKey != keyCodeMap[e.keyCode]) {
                    count = 1;
                    $(document).data('keycount', count);
                } else if (count >= keyIndex.length) {
                    $(document).data('keycount', 0);
                    if (count > keyIndex.length) count = 1;
                }

                $items.eq(keyIndex[count - 1]).children('a').focus();
            }

            // Select focused option if "Enter", "Spacebar" or "Tab" (when selectOnTab is true) are pressed inside the menu.
            if ((/(13|32)/.test(e.keyCode.toString(10)) || (/(^9$)/.test(e.keyCode.toString(10)) && that.options.selectOnTab)) && isActive) {
                if (!/(32)/.test(e.keyCode.toString(10))) e.preventDefault();
                if (!that.options.liveSearch) {
                    var elem = $(':focus');
                    elem.click();
                    // Bring back focus for multiselects
                    elem.focus();
                    // Prevent screen from scrolling if the user hit the spacebar
                    e.preventDefault();
                    // Fixes spacebar selection of dropdown items in FF & IE
                    $(document).data('spaceSelect', true);
                } else if (!/(32)/.test(e.keyCode.toString(10))) {
                    that.$menuInner.find('.active a').click();
                    $this.focus();
                }
                $(document).data('keycount', 0);
            }

            if ((/(^9$|27)/.test(e.keyCode.toString(10)) && isActive && (that.multiple || that.options.liveSearch)) || (/(27)/.test(e.keyCode.toString(10)) && !isActive)) {
                that.$menu.parent().removeClass('open');
                if (that.options.container) that.$newElement.removeClass('open');
                that.$button.focus();
            }
        },

        mobile: function () {
            this.$element.addClass('mobile-device');
        },

        refresh: function () {
            this.$lis = null;
            this.liObj = {};
            this.reloadLi();
            this.render();
            this.checkDisabled();
            this.liHeight(true);
            this.setStyle();
            this.setWidth();
            if (this.$lis) this.$searchbox.trigger('propertychange');

            this.$element.trigger('refreshed.bs.select');
        },

        hide: function () {
            this.$newElement.hide();
        },

        show: function () {
            this.$newElement.show();
        },

        remove: function () {
            this.$newElement.remove();
            this.$element.remove();
        },

        destroy: function () {
            this.$newElement.before(this.$element).remove();

            if (this.$bsContainer) {
                this.$bsContainer.remove();
            } else {
                this.$menu.remove();
            }

            this.$element
                .off('.bs.select')
                .removeData('selectpicker')
                .removeClass('bs-select-hidden selectpicker');
        }
    };

    // SELECTPICKER PLUGIN DEFINITION
    // ==============================
    function Plugin(option, event) {
        // get the args of the outer function..
        var args = arguments;
        // The arguments of the function are explicitly re-defined from the argument list, because the shift causes them
        // to get lost/corrupted in android 2.3 and IE9 #715 #775
        var _option = option,
            _event = event;
        [].shift.apply(args);

        var value;
        var chain = this.each(function () {
            var $this = $(this);
            if ($this.is('select')) {
                var data = $this.data('selectpicker'),
                    options = typeof _option == 'object' && _option;

                if (!data) {
                    var config = $.extend({}, Selectpicker.DEFAULTS, $.fn.selectpicker.defaults || {}, $this.data(), options);
                    config.template = $.extend({}, Selectpicker.DEFAULTS.template, ($.fn.selectpicker.defaults ? $.fn.selectpicker.defaults.template : {}), $this.data().template, options.template);
                    $this.data('selectpicker', (data = new Selectpicker(this, config, _event)));
                } else if (options) {
                    for (var i in options) {
                        if (options.hasOwnProperty(i)) {
                            data.options[i] = options[i];
                        }
                    }
                }

                if (typeof _option == 'string') {
                    if (data[_option] instanceof Function) {
                        value = data[_option].apply(data, args);
                    } else {
                        value = data.options[_option];
                    }
                }
            }
        });

        if (typeof value !== 'undefined') {
            //noinspection JSUnusedAssignment
            return value;
        } else {
            return chain;
        }
    }

    var old = $.fn.selectpicker;
    $.fn.selectpicker = Plugin;
    $.fn.selectpicker.Constructor = Selectpicker;

    // SELECTPICKER NO CONFLICT
    // ========================
    $.fn.selectpicker.noConflict = function () {
        $.fn.selectpicker = old;
        return this;
    };

    $(document)
        .data('keycount', 0)
        .on('keydown.bs.select', '.bootstrap-select [data-toggle=dropdown], .bootstrap-select [role="listbox"], .bs-searchbox input', Selectpicker.prototype.keydown)
        .on('focusin.modal', '.bootstrap-select [data-toggle=dropdown], .bootstrap-select [role="listbox"], .bs-searchbox input', function (e) {
            e.stopPropagation();
        });

    // SELECTPICKER DATA-API
    // =====================
    $(window).on('load.bs.select.data-api', function () {
        $('.selectpicker').each(function () {
            var $selectpicker = $(this);
            Plugin.call($selectpicker, $selectpicker.data());
        })
    });
})(jQuery);
