var EventGrid = new Object();
EventGrid.web = new Object();
EventGrid.web.homePage = new Object();

var spinner;

// insensitive contains;
$.expr[":"].Contains = jQuery.expr.createPseudo(function (arg) {
	return function (elem) {
		return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
	};
});

$.validator.addMethod("multiemail", function (value, element) {
	if (this.optional(element)) {
		return true;
	}

	var maxCount = parseInt($(element).attr('data-val-multiemail-maxcount'));
	var emails = value.split(/[,]+/);

	for (var i = 0, limit = emails.length; i < limit; i++) {
		value = emails[i];

		if (jQuery.validator.methods.email.call(this, $.trim(value), element) == false) {

			$.validator.messages.multiemail = 'Email ' + value + ' is not valid. Use comma to separate multiple emails.';
			return false;
		}
	}

	if (maxCount && emails.length > maxCount) {
		$.validator.messages.multiemail = 'Number of emails can\'t be more than ' + maxCount + '.';
		return false;
	}

	return true;
}, 'text');

$.validator.unobtrusive.adapters.add("multiemail", function (options) {
	options.rules["multiemail"] = {};
	//options.messages["multiemail"] = options.message;
});

$.validator.unobtrusive.adapters.add('expirationdate', [], function (options) { // TODO : Still needs to be refactored and updated
	options.rules["expirationdate"] = true;
	options.messages["expirationdate"] = options.message;
});

$.validator.addMethod('expirationdate',
	function (value, element, parameters) {
		var month = parseInt($("#CreditCard_ExpiresMonth").val());
		var year = parseInt($("#CreditCard_ExpiresYear").val());
		var expiredDate = new Date(year, month + 1, 1);
		var currentDate = new Date();
		return currentDate < expiredDate;
	}
);

$.validator.unobtrusive.adapters.addBool('mandatory', 'required');

jQuery.validator.addMethod('correctPhone', function (value, element, params) {
		var digitCount = 0;
		var charPattern = /[0-9]/;
		for (var i = 0; i < value.length; i++)
			if (charPattern.test(value[i])) digitCount++;
		if (digitCount != 10) return false;
	
		var phonePattern = /^([0-9()\-\ ])+$/;
		return phonePattern.test(value);
}, '');

$.validator.addMethod('quantity',
	function (value, element, params) {
		return +value >= params.getCalculatedMin();
	}
);
$.validator.unobtrusive.adapters.add('quantity', ['minfield', 'maxfield', 'sold'], function (options) {
	var form = options.form,
		minField = $('#' + options.params.minfield, form),
		maxField = $('#' + options.params.maxfield, form);

	options.rules['quantity'] = {
		getCalculatedMin: function () {
			return +minField.val() + (+options.params.sold);
		}
	};
	options.messages['quantity'] = function(params) {
		return 'Must be less than or equal to ' + params.getCalculatedMin();
	};
});

$.validator.addMethod('notequalto', function(value, element, params) {
	return $(params).val() !== value;
});

$.validator.unobtrusive.adapters.add('notequalto', ['target'], function(options) {
	options.rules['notequalto'] = options.params.target;
	options.messages['notequalto'] = options.message;
});

//$.validator.addMethod('customRoute', function (value, element, param) {
//		return value.match(/^[A-Z0-9]/i) != null;
//	}
//);

jQuery.extend(EventGrid.web, {
	appendScript: function (url, onload) {
		var s = document.createElement("script");
		s.type = "text/javascript";
		s.src = url;
		s.async = true;
		s.onload = function () {
			if (_.isFunction(onload)) {
				onload();
			}
		};

		document.body.appendChild(s);
	},
	map: null,
	mapOptions: null,
	createMap: function(divId, drawcontrols) {
		EventGrid.web.mapOptions = {
			zoom: 8,
			center: new google.maps.LatLng(-33, 151),
			disableDefaultUI: !drawcontrols,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};


		if (EventGrid.web.map == null) {

			var obj;
			if (typeof divId == 'string')
				obj = document.getElementById(divId);
			else obj = divId;

			EventGrid.web.map = new google.maps.Map(obj, EventGrid.web.mapOptions);
		}

		if (typeof divId == 'string')
			$("#" + divId).show();
		else
			$(divId).show();


	},

	showMap: function (container, address) {
		if (!container || !container.length) return;
		if (typeof address === 'undefined' || !address) {
			address = container.attr('data-map-address');
		}
		if (!address) return;
		
		var showControl = container.attr('data-map-show-controls') == "true";
		var showMarker = container.attr('data-map-show-marker') == "true" || container.attr('data-map-show-marker') != "false";
		

		var options = {
			zoom: 8,
			center: new google.maps.LatLng(-33, 151),
			disableDefaultUI: false,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			panControl: showControl,
			scaleControl: showControl, 
			rotateControl: showControl,
			scrollwheel: showControl,
			streetViewControl: false,
			zoomControl: showControl,
			zoomControlOptions: {
				style: google.maps.ZoomControlStyle.LARGE
			}
		};


		var map = container.data('map');
		if (!map) {
			map = new google.maps.Map(container[0], options);
			container.data('map', map);
		} else {
			map.setOptions({
				scaleControl: showControl,
				rotateControl: showControl,
				panControl: showControl,
				scrollwheel: showControl,
				streetViewControl: false,
				zoomControl: showControl
			});
		}

		// Create new geocoding object
		var geocoder = new google.maps.Geocoder();

		geocoder.geocode({ 'address': address }, function (results, status) {
			if (status == google.maps.GeocoderStatus.OK) {

				map.setCenter(results[0].geometry.location);
				map.setZoom(13);

				var marker = container.data('map-marker');
				if (marker) marker.setMap(null);

				if (showMarker) {
					var newMarker = new google.maps.Marker({
						map: map,
						position: results[0].geometry.location
					});
					
					container.data('map-marker', newMarker);
				}
			}
		});
	},

	centerMap: function(lat, lon, zoom) {
		if (EventGrid.web.map != null) {
			var centerLatLng = new google.maps.LatLng(lat, lon);
			EventGrid.web.map.setCenter(centerLatLng);
			EventGrid.web.map.setZoom(zoom);
		}
	},
	addIcon: function(lat, lon, number) {
		if (EventGrid.web.map != null) {
			var iconLatLng = new google.maps.LatLng(lat, lon);
			if (number) {
				var icon = new google.maps.Marker({
					position: iconLatLng,
					map: EventGrid.web.map,
					icon: resolveUrl("~/content/img/markers/" + number + ".png")
				});
			} else {
				var icon = new google.maps.Marker({
					position: iconLatLng,
					map: EventGrid.web.map
				});
			}

		}
	},
	openSubscribeWindow: function() {
		$("#dialog-modal").dialog({
			height: 'auto',
			width: 'auto',
			modal: true,
			resizable: false
		});
		$(".ui-dialog-titlebar").hide();
	},
	doGoogleMap: function(address, divId) {
		if (address == '297 3rd Ave 2nd fl, New York, NY')
			currentAddress = '297 3rd Ave, New York, NY';
		else if (address == '220 Madison Avenue, Ground Floor C, New York, NY')
			currentAddress = '220 Madison Avenue, New York, NY';
		else
			currentAddress = address;

		// Create new map object
		EventGrid.web.createMap(divId, true);

		// Create new geocoding object
		geocoder = new google.maps.Geocoder();

		// Retrieve location information, pass it to addToMap()
		geocoder.geocode({ 'address': currentAddress }, function(results, status) {
			EventGrid.web.addToMap(results, status);
			EventGrid.web.map.setZoom(13);
		});
	},

	addToMap: function(results, status) {
		try {
			if (status == google.maps.GeocoderStatus.OK) {
				EventGrid.web.map.setCenter(results[0].geometry.location);
				EventGrid.web.map.setZoom(5);

				var marker = new google.maps.Marker({
					map: EventGrid.web.map,
					position: results[0].geometry.location
				});
			}
		} catch (err) {
		}
	},
	getNELatLon: function() {
		var bounds = EventGrid.web.map.getBounds();

		var ne = bounds.getNorthEast();

		return ne;
	},

	getSWLatLon: function() {
		var bounds = EventGrid.web.map.getBounds();

		var ne = bounds.getSouthWest();

		return ne;
	},

	changeSearchLocation: function(locationStr) {

		geocoder = new google.maps.Geocoder();

		// Retrieve location information, pass it to addToMap()
		geocoder.geocode({ 'address': locationStr }, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				EventGrid.web.map.setCenter(results[0].geometry.location);
				EventGrid.web.map.setZoom(5);

				$("#search-form").submit();
			} else alert("Can't geocode address...");


		});
	},
	formSubmit: function(id) {
		var form = $('#' + id);

		if (form.valid()) {
			form.submit();
		}
	},

	closeAlert: function() {
		$(".alert").animate({
			opacity: 0
		}, 150, function() { $(".alert").alert('close'); });
	},

	popupWindow: function(url, title, w, h) {
		w = w || 650;
		h = h || 350;
		var left = (screen.width / 2) - (w / 2);
		var top = (screen.height / 2) - (h / 2);
		return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
	},

	disableButton: function ($btn, text) {
		if (text) {
			$btn.text(text);
		}

		$btn.blur();

		$btn.attr('onclick', '').unbind('click');
		$btn.attr('onclick', 'javascript: void(0); return false;');

		if ($btn.hasClass('btn-default')) $btn.attr('data-type', 'default');
		else if ($btn.hasClass('btn-primary')) $btn.attr('data-type', 'primary');
		else if ($btn.hasClass('btn-success')) $btn.attr('data-type', 'success');
		else if ($btn.hasClass('btn-info')) $btn.attr('data-type', 'info');
		else if ($btn.hasClass('btn-warning')) $btn.attr('data-type', 'warning');
		else if ($btn.hasClass('btn-danger')) $btn.attr('data-type', 'danger');
		else if ($btn.hasClass('btn-link')) $btn.attr('data-type', 'link');

		$btn.removeClass('btn-' + $btn.attr('data-type'));
		//$btn.removeClass('btn');
		$btn.addClass('btn-loading');

		spinner = new SpinnerHelper({ color: $btn.css('color') });
		$btn.prepend(spinner.el);
	},

	enableButton: function ($btn, text, onclick) {
		spinner && spinner.stop();
		if (typeof onclick === "string") {
			$btn.attr('onclick', onclick);
		} else {
			$btn.attr('onclick', '');
			$btn.on('click', onclick);
		}
		$btn.removeClass('btn-loading');

		$btn.addClass('btn-' + $btn.attr('data-type'));

		//$btn.addClass('btn');

		if (text) {
			$btn.html(text);
		}
	},

	isIE11: function() {
		var ua = navigator.userAgent.toLowerCase();
		var match = /(chrome)[ \/]([\w.]+)/.exec(ua) ||
			/(webkit)[ \/]([\w.]+)/.exec(ua) ||
			/(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
			/(msie) ([\w.]+)/.exec(ua) ||
			ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) ||
			[];
		var browser = match[1] || "";
		var version = match[2] || "0";

		return browser == 'mozilla' && version == '11.0';
	},

	getFormattedPrice: function (amount, currencyTemplate, groupSeparator) {
		groupSeparator = groupSeparator || ',';
		var applySeparator = function(line) {
			return line.replace(/./g, function(c, ii, a) {
				return ii && c !== "." && ((a.length - ii) % 3 === 0) ? groupSeparator + c : c;
			});
		};
	
		var indexOfCurrencyTemplateSeparator = currencyTemplate.toString().indexOf('#') + 1;
		var decimalPartTemplateLength = currencyTemplate.split('0').length - 1;
		var pow = Math.pow(10, decimalPartTemplateLength);
		amount = Math.round(amount * pow) / pow;

		if (amount % 1 == 0) {
			currencyTemplate = currencyTemplate.substring(0, indexOfCurrencyTemplateSeparator) 
				+ currencyTemplate.substring(indexOfCurrencyTemplateSeparator + decimalPartTemplateLength + 1);
		}

		var priceStr = amount.toString();
		var indexOfSeparator = priceStr.toString().indexOf('.');
		if (indexOfSeparator == -1) {
			return currencyTemplate.replace('#', applySeparator(priceStr));
		}

		var entirePart = priceStr.substring(0, indexOfSeparator);
		var decimalPart = priceStr.substring(indexOfSeparator + 1);

		var result = currencyTemplate;

		for (var i = 0; i < decimalPart.length && i < decimalPartTemplateLength; ++i) {
			result = result.substring(0, indexOfCurrencyTemplateSeparator + 1 + i) +
				decimalPart.substring(i, i + 1) + result.substring(indexOfCurrencyTemplateSeparator + 2 + i);
		}

		result = result.replace('#', applySeparator(entirePart));

		return result;
	},

	round: function(num, decimalPlaces) {
		var d = decimalPlaces || 0;
		var m = Math.pow(10, d);
		var n = +(d ? num * m : num).toFixed(8); // Avoid rounding errors
		var i = Math.floor(n), f = n - i;
		var e = 1e-8; // Allow for rounding errors in f
		var r = (f > 0.5 - e && f < 0.5 + e) ?
		((i % 2 == 0) ? i : i + 1) : Math.round(n);
		return d ? r / m : r;
	},

	infoHelper: {
		init: function (selector) {
			var infoIconDataObject = {
				addEvent: {
					Description: "Ticket Type description, displayed under Ticket Type name on Event Page",
					EventgridFee: "Fee included into Ticket Price for each ticket. For more information see http://eventgrid.com/#pricing",
					CreditCardFee: "Fee included into Ticket Price for each ticket purchased using Credit Card. For more information see http://eventgrid.com/#pricing",
					PriceType: "Multiple Prices option allows you to specify different prices for Adults, Children and Seniors",
					Tax: "Percentage of Tax amount that is added to Price",
					Status: "What is the difference between Hidden status and Hide this ticket type from event page option?",
					AddAdditionalFee: "You can set additional percentage or flat amount fee that will be added to Price",
					SetPeriod: "You can set date interval when tickets are available for purchasing",
					UseWaitlist: "If you check this option, attendees will be able to add their contact information to Wait list when tickets are sold out",
					HideThisTicketType: "You can hide this ticket type from Event page",
					DoNotCollectGuestInfo: 'If this option is enabled, customer is required to select previously entered attendee for this ticket'
				},
				editEvent: {
					OrganizationLogo: "Organizer logo that appears on event page",
					OrganizerDescription:"Organizer description that appears on event page",
					ShortDescription: "Event Description allows you to add formatted text and images to introduce your Event",
					TwitterHashtag: "The hashtag that will be used in a message when Event is shared on Twitter",
					HasSchedule: "If this option is checked, you will be able to add tracks and sessions to your Event",
					AllowRegisterForSessions: "If this option is checked, your customer will be able to book sessions, otherwise sessions will be for display only.",
					LimitTicketsTotalQuantity: "You can set a limit on the total number of tickets sold for your event, regardless of the ticket type",
					LimitRegistrationsTotalQuantity: "You can set a limit on the total number of registrations sold for your event, regardless of the registration type",
					ShowCountryList: "Attendee will have to select country in contact information section on ticket purchasing or registration",
					ShowCustomizedMessage: "You can add message that is displayed at the bottom of Thank You Page",
					ShowWaiver: "You can add additional waiver to Checkout Page, that user will have to accept to complete his Order",
					IsPrivateEvent: "Hidden from search results",
					PasswordProtectedEvent: "Customer will have to enter password to be able to see event information and order tickets",
					IsInviteOnly: "Invitation is required to attend",
					AllowPayByCheckOrWire: "Allow customers to pay by check or wire",
					EventTypeId: "Indicates which labels are used on buttons and panels on Order Checkout. For ex. 'Register Now'/'Order Now', 'Registrations'/'Tickets', etc...",
					ForceDifferentAttendee: 'All attendees must be unique in order',
					KeepSubmittedOrderStatusOpen: 'Use Set as Paid to complete it',
					AllowUserManageTickets: 'Allows buyers to view their orders, print tickets and modify information they provided',
					AllowRegisterForMembership: 'Allow Customer to subscribe to Membership',
					SellProductsOnOrderPage: 'Allow Customer to sell products as a part of the order flow',
					MaxSessionsPerDay: 'Limits max sessions per day for single registration.',
					MaxSessionsPerEvent: 'Limits max sessions that can be added to single registration.',
					MinSessionsPerEvent: 'Limits min sessions that can be added to single registration.',
					SendEmailReminders: "Send am email to event attendees to remind them of the event.  You can customize this email using menu on the left 'Edit Event -> Email Notification'."
			},
				addCustomField: {
					TicketType: "Ticket types to apply custom field to. At least one ticket type should be chosen."
				},
				editTicketType: {
					SetDifferentQuantityForEventDates: "Use this feature if you would like to set different quantity for each event date.",
					TotalQuantityForEditQuantities: "Total quantity of tickets that includes available, sold and reserved.",
				},
				editPaymentSettings: {
					StripeRecipientName: "Full legal name or full incorporated name."
				}
			},
				getInfoHelperValue = function (path) {
					var pathArray = path.split(".");

					if (infoIconDataObject.hasOwnProperty(pathArray[0])) {
						if (infoIconDataObject[pathArray[0]].hasOwnProperty(pathArray[1])) {
							return infoIconDataObject[pathArray[0]][pathArray[1]];
						}
					}
					return false;
				}
			
			$(selector || '.info-icon').each(function () {
				var $this = $(this);

				if (!$this.hasClass('info-icon-inited')) {
					var thisinfoHelperData = false || $this.data("content"),
						InfoHelperValue;
					InfoHelperValue = getInfoHelperValue(thisinfoHelperData);
					console.log('thisinfoHelperData', thisinfoHelperData);

				    var container = $this.attr('data-po-container');

					$this.append($("<div class=\"info-icon-svg\"></div>"));
					$this.children(".info-icon-svg").popover({
						placement: 'top',
						content: InfoHelperValue || thisinfoHelperData,
						trigger: 'hover',
						delay: 200,
						container: container
					});
					$this.addClass('info-icon-inited');
				}
			});
		}
	},

	loadingIcon: function (opts) {
		opts = opts || {};

		return '<div style="position: relative;display: inline-block; width: 22px;height: 10px;">' + new Spinner(_.extend(opts, {
			lines: 9,
			length: 0,
			width: 4,
			radius: 8,
			corners: 1,
			rotate: 0,
			direction: 1,
			color: '#000',
			speed: 1,
			trail: 70,
			shadow: false,
			hwaccel: false,
			className: 'spinner',
			zIndex: 2e9,
			top: '20',
			left: '20',
			position: 'relative'
		})).spin().el.innerHTML + '</div>';
	},

	keysToLowerCase: function(obj) {
		if (!typeof (obj) === "object" || typeof (obj) === "string" || typeof (obj) === "number" || typeof (obj) === "boolean" || obj === null) {
			return obj;
		}
		var keys = Object.keys(obj);
		var n = keys.length;
		var lowKey;
		while (n--) {
			var key = keys[n];
			if ((obj instanceof Array)) {
				obj[key] = this.keysToLowerCase(obj[key]);
			}
			else {
				if (key === (lowKey = key.toLowerCase()))
					continue;
				obj[lowKey] = this.keysToLowerCase(obj[key]);
				delete obj[key];
			}
		}
		return (obj);
	}
});

jQuery.extend(EventGrid.web.homePage, {
	requestDemoUrl: null,
	requestDemoPartialUrl: null,
	errorPageUrl: null
});

$(function () {
	// Info details
	$('body').on('click', '.info-details_toggler', function () {
		var $cont = $(this).closest('.info-details'), isOpen = $cont.hasClass('info-details--show');
		$cont.toggleClass('info-details--show');

		setTimeout(function () {
			if (isOpen) {
				$cont.find('.info-details_toggler_show').css('display', 'inline');
				$cont.find('.info-details_toggler_hide').css('display', 'none');
			}
			else {
				$cont.find('.info-details_toggler_show').css('display', 'none');
				$cont.find('.info-details_toggler_hide').css('display', 'inline');
			}
		}, 175);
	});
});