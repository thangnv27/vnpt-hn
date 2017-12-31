// JSON Web Service Access Details
var session = '',
	operator = {},
	settings = {},
	cache = false,
	server = '',
	protocol = protocol,
	chatstack = { bottom: 10 },
	notification = true,
	zclip = true,
	shortcuts = true,
	messagesAjax = true,
	autoSignIn = true,
	notificationIcon = 'images/Icon64x64.png',
	visitorsGrid,
	visitorsDataView,
	visitorsColumns,
	visitors,
	visitorsTimer = true,
	visitorsTotal = 0,
	visitorsTimestamp = false,
	selectedVisitor = false,
	websockets = false,
	gravatar = false,
	autoScroll = false,
	intercom = (typeof Intercom !== 'undefined') ? Intercom.getInstance() : false,
	viewed = [],
	visitorsColumns = [
		{ id: 'browser', width: 30 },
		{ id: 'hostname', width: 200 },
		{ id: 'status', width: 80 },
		{ id: 'location', width: 150 },
		{ id: 'pages', width: 30 },
		{ id: 'page', width: 290 },
		{ id: 'referrer', width: 225 },
		{ id: 'pagetime', width: 65 },
		{ id: 'sitetime', width: 65 }
	],
	visitorsGridOptions = {
		enableCellNavigation: true,
		enableColumnReorder: true, // false
		multiColumnSort: true,
		multiSelect: false
	},
	chatPath = 'chat.php',
	address = '',
	directoryPathName = '/livehelp/',
	directoryPath = document.location.pathname.substring(0, document.location.pathname.indexOf(directoryPathName) + 10),
	defaultUserImage = directoryPath + 'images/User.png',
	apiPath = 'xml/WebService.php?',
	apiEndpoint = {
		visitors: 'Visitors',
		chats: 'Chats',
		responses: 'Responses',
		resetpassword: 'ResetPassword',
		operators: 'Operators',
		statistics: 'Statistics',
		settings: 'Settings',
		history: 'History',
		departments: 'Departments',
		users: 'Users',
		send: 'Send',
		emailchat: 'EmailChat',
		login: 'Login'
	},
	apiAuthVersion = 4,
	opts = {
		location: 'index.php',
		messages: {from: true, photo: true},
		visitorColumns: [
			{id: "browser", name: "", field: "UserAgent", width: 30, resizable: false, formatter: Slick.Formatters.Browser},
			{id: "hostname", name: "Hostname / IP Address", field: "Hostname", width: 200, sortable: true, formatter: Slick.Formatters.Hostname},
			{id: "status", name: "Status", field: "Active", sortable: true, formatter: Slick.Formatters.Status},
			{id: "location", name: "Location", field: "Country", width: 150, sortable: true, formatter: Slick.Formatters.Location},
			{id: "pages", name: "# Pages", field: "PagePath", width: 30, sortable: true, formatter: Slick.Formatters.Pages},
			{id: "page", name: "Current Page", field: "CurrentPage", width: 290, sortable: true},
			{id: "referrer", name: "Referrer", field: "Referrer", width: 225, sortable: true, formatter: Slick.Formatters.Referrer},
			{id: "pagetime", name: "Page Time", field: "TimeOnPage", width: 65, sortable: true, formatter: Slick.Formatters.Seconds},
			{id: "sitetime", name: "Site Time", field: "TimeOnSite", width: 65, sortable: true, formatter: Slick.Formatters.Seconds}
		],
		visitorChartColor: '#54c2ea',
		visitorChartBalloonFontSize: 10,
		visitorChartBulletBorderColor: '#54c2ea',
		visitorChartFillColors: '#54c2ea',
		visitorChartLineColor: '#54c2ea',
		visitorChartFillAlphas: 0.5,
		weekdayChartColor: '#54c2ea',
		weekdayBalloonColor: '#54c2ea',
		weekdayBalloonBorderColor: '#54c2ea',
		weekdayBalloonFillColor: '#54c2ea',
		weekdayBalloonFontSize: 15,
		weekdayGraphFillColor: '#54c2ea',
		weekdayGraphColorField: false,
		weekdayGraphFillAlphas: 0.5,
		weekdayGraphLineColor: '#54c2ea',
		weekdayGraphLineColorField: false,
		chatChartColor: '#54c2ea',
		chatBalloonFontSize: 15,
		chatGraphFillAlphas: 0.5,
		statisticsChartColor: '#54c2ea',
		ratingChartColors: ['#54c2ea', '#235A78', '#439494', '#4DAAAB', '#B4DCED', '#1A8BB2'],
		ratingChartBackground: '#54c2ea',
		ratingBalloonBorderColor: '#54c2ea',
		ratingBalloonFontSize: 15,
		historyBalloonFontSize: 15
	},
	locale = {
		unavailable: 'Unavailable',
		pendingchat: 'Pending Chat',
		pendingchatdescription: '{name} is pending to chat'
	},
	tour = false,
	router = false,
	showOfflineOperators = false,
	storage = false,
	chatSections = {},
	startupDate = false,
	saveExpanded = true,
	previousMenuEnabled = true,
	billing = true,
	chatsLoaded = false,
	scrollAlertEnabled = false;

function Storage() {
	this.store = $.initNamespaceStorage('LiveHelp').localStorage;

	this.get = function (key) {
		return this.store.get(key);
	};
	this.set = function (key, value) {
		return this.store.set(key, value);
	};
	this.isSet = function (key) {
		return this.store.isSet(key);
	};

	window.setTimeout(function() {
		$(document).trigger('LiveHelp.LocalSettingsLoaded');
	}, 500);
}

$.preloadImages = function () {
	for (var i = 0; i < arguments.length; i++) {
		$('<img>').attr('src', arguments[i]);
	}
};

function initVisitorsGrid() {

	if (visitorsGrid === undefined && $('.visitors-grid').length) {
		var groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();

		visitorsDataView = new Slick.Data.DataView({
			groupItemMetadataProvider: groupItemMetadataProvider
		});

		// Persist Columns
		if (visitorsGrid !== undefined) {
			visitorsColumns = visitorsGrid.getColumns();
		} else {
			visitorsColumns = opts.visitorColumns;

			var savedColumns = storage.get('visitorsColumns');

			$.each(savedColumns, function (key, savedColumn) {
				$.each(visitorsColumns, function (key, visitorColumn) {
					if (savedColumn.id === visitorColumn.id) {
						visitorColumn.width = savedColumn.width;
						return false;
					}
				});
			});
		}

		visitorsGrid = new Slick.Grid('.visitors-grid', visitorsDataView, visitorsColumns, visitorsGridOptions);
		visitorsGrid.registerPlugin(groupItemMetadataProvider);
		visitorsGrid.setSelectionModel(new Slick.RowSelectionModel());

		visitorsGrid.onColumnsResized.subscribe(function () {
			var savedColumns = [];
			$.each(visitorsGrid.getColumns(), function (key, value) {
				savedColumns.push({id: value.id, width: value.width});
			});
			storage.set('visitorsColumns', savedColumns);
		});

		visitorsGrid.onClick.subscribe(function (e, args) {
			var visitor = visitorsDataView.getItem(args.row);
			if (visitor !== undefined) {
				openVisitor(visitor);
			}
		});

		visitorsGrid.onSort.subscribe(function (e, args) {
			var cols = args.sortCols;
			visitorsDataView.sort(function (dataRow1, dataRow2) {
				for (var i = 0, l = cols.length; i < l; i++) {
					var field = cols[i].sortCol.field;
					var sign = cols[i].sortAsc ? 1 : -1;
					var value1 = dataRow1[field], value2 = dataRow2[field];
					var result = (value1 == value2 ? 0 : (value1 > value2 ? 1 : -1)) * sign;
					if (result !== 0) {
						return result;
					}
				}
				return 0;
			});
			visitorsGrid.invalidate();
			visitorsGrid.render();
		});

		visitorsDataView.onRowCountChanged.subscribe(function (e, args) {
			visitorsGrid.updateRowCount();
			visitorsGrid.render();

			// Select Row
			if (selectedVisitor) {
				var selected = parseInt(selectedVisitor.ID, 10);

				for (var i = 0; i < args.current; i++) {
					id = parseInt(visitorsDataView.mapRowsToIds([i])[0], 10);
					if (selected === id) {
						visitorsGrid.setSelectedRows([i]);
					}
				}
			}
		});

		visitorsDataView.onRowsChanged.subscribe(function (e, args) {
			visitorsGrid.invalidateRows(args.rows);
			visitorsGrid.render();
		});

		visitorsDataView.groupBy(
			function (r) {
				var status = 'Browsing';
				if (r.Active < 0) {
					status = 'Chat Ended';
				} else if (r.Session > 0) {
					status = 'Chatting';
				}
				return status;
			},
			function (g) {
				var label = ' visitor';
				if (g.count > 1) {
					label = ' visitors';
				}
				return g.value + ' - ' + g.count + label;
			},
			function (a, b) {
				return a.value - b.value;
			}
		);

	}

}

function apiRequest(options) {
	// Authorization Token / Headers
	var data = (options.data !== undefined) ? options.data : {},
		headers = {'Accept': 'application/json'};

	// Sign In / Saved Session
	var autoLogin = storage.get('session');
	if (autoLogin.length > 0) {
		$.extend(data, {'Session': autoLogin});
	}

	if (session !== false && session.length > 0 && apiAuthVersion > 4) {
		$.extend(headers, {'Authorization': 'Token signature="' + session + '", version="5"'});
	}

	if (apiAuthVersion < 5) {
		$.extend(data, {
			'Version': '4.0',
			'Format': 'json'
		});
		if (options.url !== apiEndpoint.login && session !== false && session.length > 0) {
			$.extend(data, {'Session': session});
		}
	}

	$.ajax({
		url: (address.length > 0) ? address + apiPath + options.url : directoryPath + apiPath + options.url,
		data: data,
		type: 'POST',
		headers: headers,
		dataType: 'json',
		success: options.success,
		error: options.error
	});
}

var visitorsTimeout = false;

function updateVisitorsGrid(action, request, total, complete) {

	// Clear Timer
	if (visitorsTimeout !== false) {
		window.clearTimeout(visitorsTimeout);
		visitorsTimeout = false;
	}

	if (session.length > 0) {

		if (action === undefined) { action = ''; }
		if (request === undefined) { request = ''; }
		if (total === undefined || total.length === 0) { total = 25; }

		// Web Service URL / Data
		var post = {'Action': action, 'Request': request, 'Record': 0, 'Total': total};

		// Intialise Grid
		initVisitorsGrid();

		// Visitors AJAX / Grid
		apiRequest({
			url: apiEndpoint.visitors,
			data: post,
			success: function (data) {
				// Visitors JSON
				if (data.Visitors !== null && data.Visitors !== undefined && data.Visitors.Visitor !== undefined) {

					$(document).trigger('LiveHelp.VisitorsCompleted', { newVisitors: data.Visitors.Visitor, previousVisitors: visitors });

					visitors = data.Visitors.Visitor;

					// Refresh Data View
					visitorRefreshDataView(visitors, data.Visitors.TotalVisitors);

					// Complete Callback
					if (complete) {
						complete(visitors);
					}

				} else {
					visitorRefreshDataView(null, 0);
				}

				if (visitorsTimer === true && websockets === false) {
					visitorsTimeout = window.setTimeout(updateVisitorsGrid, 15000);
				}
			},
			error: function (jqXHR, textStatus, errorThrown) {
				if (visitorsTimer === true && websockets === false) {
					visitorsTimeout = window.setTimeout(updateVisitorsGrid, 15000);
				}
			}
		});
	} else {
		if (visitorsTimer === true && websockets === false) {
			visitorsTimeout = window.setTimeout(updateVisitorsGrid, 15000);
		}
	}
}

function visitorRefreshDataView(visitors, total, complete) {

	var details = $('#visitor-details .details'),
		visitor = details.data('visitor'),
		id = 0;

	visitorsTotal = total;
	if (visitorsTimestamp === false) {
		visitorsTimestamp = Math.round(new Date().getTime() / 1000);
	}

	if (visitors !== null && visitors !== undefined && $('.visitors-grid').length) {

		// Update Visitor
		if (visitor !== undefined && details.is(':visible')) {
			id = parseInt(visitor.ID, 10);
			$.each(visitors, function (key, value) {
				if (parseInt(value.ID, 10) === id) {
					details.find('#chatstatus').text(value.ChatStatus);
					details.find('#currentpage a').text(value.CurrentPage).attr('href', value.CurrentPage);
					details.find('#pagehistory').text(value.PagePath);
					var initiate = details.find('.btn.initiate');
					if (value.Active.length > 0) {
						initiate.addClass('disabled');
					} else {
						initiate.removeClass('disabled');
					}
					return false;
				}
			});
		}

		// Update Total
		if (visitorsTotal !== undefined) {
			updateTotal($('#visitortotal'), visitorsTotal);
		}

		// Update Visitor Times
		$.each(visitors, function(key, visitor) {
			var time = Math.round(new Date().getTime() / 1000) - visitorsTimestamp;
			visitor.TimeOnPage = parseInt(visitor.TimeOnPage, 10) + time;
			visitor.TimeOnSite = parseInt(visitor.TimeOnSite, 10) + time;
		});
		visitorsTimestamp = Math.round(new Date().getTime() / 1000);

		// Close Removed Visitor
		if (visitorOpen > 0) {
			var exists = _.find(visitors, function (elem) { return parseInt(elem.ID, 10) === visitorOpen; });
			if (exists === undefined) {
				closeVisitor();
			}
		}

		// Initialize DataView
		visitorsDataView.beginUpdate();
		visitorsDataView.setItems(visitors, 'ID');
		for (var i = 0; i < visitorsDataView.getGroups().length; i++) {
			visitorsDataView.expandGroup(visitorsDataView.getGroups()[i].value);
		}

		for (var i = 0; i < visitorsDataView.getItems().length; i++) {
			var item = visitorsDataView.getItems()[i];
			visitorsDataView.updateItem(item.ID, item);
		}
		visitorsDataView.endUpdate();
		visitorsDataView.syncGridSelection(visitorsGrid, true);

		if ($('.worldmap').css('display') == 'none') {
			if (visitors.length > 0) {
				$('.visitors-empty').hide();
				$('.visitors-grid, .visitors-menu').show();
			} else {
				$('.visitors-grid').hide();
				$('.visitors-empty, .visitors-menu').show();

				updateTotal($('#visitortotal'), 0);
			}
		}

		// Update Locations
		updateLocations();
	} else {

		if ($('.worldmap').css('display') == 'none') {
			$('.visitors-grid').hide();
			$('.visitors-empty, .visitors-menu').show();

			updateTotal($('#visitortotal'), 0);
		}
	}

	if (complete !== undefined) {
		complete();
	}
}

function updateLocations() {
	var linksByOrigin = {},
		countByAirport = {},
		locationByAirport = {},
		positions = [],
		data;

	if (visitors !== undefined) {

		data = visitors.filter(function (visitor) {
			if (visitor.Longitude !== null && visitor.Latitude !== null && visitor.Longitude !== undefined && visitor.Latitude !== undefined && visitor.Longitude.length > 0 && visitor.Latitude.length > 0) {
				positions.push(projection([visitor.Longitude, visitor.Latitude]));
				return true;
			}
			return false;
		});

		var radius = 15;
		var map = locations.selectAll('g.node').data(data)
			.attr('id', function (d, i) { return parseInt(d.ID, 10); })
			.on('click', function (d) {
				if (d !== undefined) {
					openVisitor(d);
				}
			});

		locations.selectAll('circle.dot').data(data)
			.attr('class', 'dot')
			.attr('cx', function (d, i) { return positions[i][0]; })
			.attr('cy', function (d, i) { return positions[i][1]; })
			.attr('r', function (d, i) { return Math.sqrt(radius); })
			.attr('fill', 'rgba(0,187,204,0.5)');

		locations.selectAll('circle.animate').data(data)
			.attr('class', 'animate')
			.attr('cx', function (d, i) { return positions[i][0]; })
			.attr('cy', function (d, i) { return positions[i][1]; })
			.attr('r', function (d, i) { return Math.sqrt(radius); })
			.attr('fill', 'rgba(0,187,204,1.0)')
			.attr('opacity', 1.0);

		var group = map.enter().append('svg:g');

		group.data(data)
			.attr('id', function (d, i) { return parseInt(d.ID, 10); })
			.attr('class', 'node')
			.on('click', function (d) {
				if (d !== undefined) {
					openVisitor(d);
				}
			});

		group.append('svg:circle')
			.attr('class', 'dot')
			.attr('cx', function (d, i) { return positions[i][0]; })
			.attr('cy', function (d, i) { return positions[i][1]; })
			.attr('r', function (d, i) { return Math.sqrt(radius); })
			.attr('fill', 'rgba(0,187,204,0.5)');

		group.append('svg:circle')
			.attr('class', 'animate')
			.attr('cx', function (d, i) { return positions[i][0]; })
			.attr('cy', function (d, i) { return positions[i][1]; })
			.attr('r', function (d, i) { return Math.sqrt(radius); })
			.attr('fill', 'rgba(0,187,204,1.0)')
			.attr('opacity', 1.0);

		map.exit().remove();

	}
}

var projection,
	locations;

function drawWorldMap() {

	var map = $('.worldmap');
	map.empty();

	projection = d3.geo
		.equirectangular()
		.scale(map.width())
		.translate([map.width() / 2, map.height() / 2]);

	var data,
		path = d3.geo
			.path()
			.projection(projection),
		svg = d3.select('.worldmap')
			.append('svg:svg'),
		countries = svg.append('svg:g')
			.attr('id', 'countries');

	locations = svg.append('svg:g')
		.attr('id', 'locations');

	/* World Map Source: https://gist.github.com/2969317 */
	d3.json('scripts/world.json', function(collection) {
		if (collection !== null) {
			var map = countries.selectAll('path')
				.data(collection.features)
				.enter()
				.append('svg:path')
				.attr('d', path)
				.attr('fill', 'rgba(227,227,227,1)')
				.attr('stroke', 'rgba(177,175,181,1)')
				.attr('stroke-width', 1);
		}
	});
}

function initWorldMap() {

	// Draw Map
	drawWorldMap();

	var radius = 125;

	setInterval(function() {
		if ($('.worldmap').css('display') == 'block') {
			locations.selectAll('circle.animate')
				.attr('r', function(d, i) { return Math.sqrt(15); })
				.attr('opacity', 1.0)
				.transition()
				.duration(1000)
				.delay(function(d, i) {
					return i * 10;
				})
				.attr('opacity', 0)
				.attr('r', function(d, i) {
					return Math.sqrt(radius);
				})
				.each('end', function() {
					d3.select(this)
						.attr('opacity', 1.0)
						.attr('r', 0);
				});
		}
	}, 2000);

}

var debounceMap = function(fn, timeout) {
	var timeoutID = -1;
	return function() {
		if (timeoutID > -1) {
			window.clearTimeout(timeoutID);
		}
		timeoutID = window.setTimeout(fn, timeout);
	};
};

var debouncedWorldMap = debounceMap(function() {
	drawWorldMap();
	updateLocations();
}, 125);

$(window).resize(debouncedWorldMap);

var visitorOpen = -1;

function openVisitor(data) {
	var id = parseInt(data.ID, 10);
	if (visitorOpen !== id) {
		var visitor = $('#visitor-details'),
			current = visitor.find('.details').data('visitor'),
			visit = (current !== undefined && current !== false) ? parseInt(current.ID, 10) : -1;

		// Update Details
		if (data.title === undefined && visit !== parseInt(data.ID, 10)) {
			visitorOpen = id;

			visitor.find('.details').data('visitor', data);
			visitor.find('#hostname').text(convertHostname(data));
			visitor.find('#useragent').text(data.UserAgent);

			var image = convertBrowserIcon(data.UserAgent, false).image;
			if (visitor.find('#useragent-image').length === 0) {
				$('<img id="useragent-image" src="' + image + '"/>').prependTo(visitor.find('.useragent.value'));
			} else {
				visitor.find('#useragent-image').attr('src', image);
			}
			visitor.find('#resolution').text(data.Resolution);
			visitor.find('#country-image').removeAttr('class').addClass(convertCountryIcon(data.Country));
			visitor.find('#country').text(convertCountry(data));
			if (data.Referrer != 'Direct Visit / Bookmark') {
				visitor.find('#referrer .direct').hide();
				visitor.find('#referrer a').text(convertReferrer(data.Referrer)).attr('href', data.Referrer).show();
			} else {
				visitor.find('#referrer a').hide();
				visitor.find('#referrer .direct').show();
			}
			visitor.find('#currentpage a').text(data.CurrentPage).attr('href', data.CurrentPage);
			visitor.find('#chatstatus').text(data.ChatStatus);
			visitor.find('#pagehistory').text(data.PagePath);

			var initiate = visitor.find('.btn.initiate');
			if (data.Active.length > 0) {
				initiate.addClass('disabled');
			} else {
				initiate.removeClass('disabled');
			}

			if (visitor.width() === 0 || visitor.css('display') === 'none') {
				visitor.show();
				visitor.animate({ width: '40%', opacity: 1 }, 250);
			}
		}
	}
}

function closeVisitor() {
	var visitor = $('#visitor-details'),
		width = visitor.width();

	visitor.find('.details').data('visitor', false);
	visitorOpen = -1;

	visitor.animate({width:0, opacity:0}, 250, function () {
		visitor.hide();
		selectedVisitor = false;
		if (visitorsGrid.getSelectedRows() > 0) {
			visitorsGrid.setSelectedRows([]);
		}
	});
}

function sendInitiateChat() {

	var dialog = $('.initiate.dialog');
	dialog.find('.progressring').show();
	dialog.find('.title').text('Sending Initiate Chat');
	dialog.find('.description').text('One moment while your initiate chat request is sent.');
	dialog.show().animate({bottom: 0}, 250, 'easeInOutBack');

	var details = $('#visitor-details .details'),
		visitor = details.data('visitor'),
		id = parseInt(visitor.ID, 10);

	updateVisitorsGrid('Initiate', id, 25, function (data) {
		// Close Dialog
		dialog.animate({bottom: -90}, 250, 'easeInOutBack');
	});
}

var chatResponsesOpen = false,
	activechats = [],
	blockedchats = [];

function checkBlocked(id) {
	var blocked = false,
		dialog = $('.chat-stack .closing-chat.dialog');

	$.each(blockedchats, function (key, value) {
		if (value.id === id) {
			blocked = true;
			return;
		}
	});

	if (!blocked) {
		// Hide Dialog
		dialog.animate({bottom: '-145px'}, 250, function () {
			dialog.find('.unblock').hide();
			dialog.find('.progressring img').attr('src', 'images/ProgressRing.gif');
			dialog.hide();
		});
	} else {
		// Show Dialog
		dialog.find('.progressring img').attr('src', 'images/Block.png');
		dialog.find('.title').text('Chat Session Blocked');
		dialog.find('.description').text('The chat session is blocked and inactive.');
		dialog.find('.unblock').show();
		dialog.show().animate({bottom: '1px'}, 250);
	}
}

var settingsMenuClickedCallback = function (id) {
	var save = $('.settings.dropdown .save.button');
	if (id === 'htmlcode') {
		save.fadeOut();
	} else {
		save.fadeIn();
	}
}

function processTagsMenu(id, message) {
	var words = message.split(' '),
		html = '',
		menu = false;

	$.each(words, function(key, value) {
		value = value.replace(/[;?.\-,!]/ig, '');
		if ($.inArray(value.toLowerCase(), tags) > -1) {
			menu = true;
		}
	});

	if (menu) {
		html = '<div class="responses-menu" data-message="' + id + '"><div class="close"></div><div class="responses text heading">Text</div><div class="responses-text"></div><div class="responses hyperlink heading">Hyperlink</div><div class="responses-hyperlink"></div><div class="responses image heading">Image</div><div class="responses-image"></div><div class="responses push heading">PUSH</div><div class="responses-push"></div><div class="responses javascript heading">JavaScript</div><div class="responses-javascript"></div></div>';
	}
	return html;
}

function processTags(id, message) {
	var words = message.split(' '),
		html = '',
		tagged = [];

	html = message;
	$.each(words, function(key, value) {
		value = value.replace(/[;?.\-,!]/ig, '');
		if ($.inArray(value.toLowerCase(), tags) > -1 && $.inArray(value.toLowerCase(), tagged) === -1) {
			html = html.replace(value, '<span class="tag" data-message="' + id + '"><span class="icon"></span><span class="text">' + value + '</span></span>');
			tagged.push(value.toLowerCase());
		}
	});

	return html;
}

function scrollToBottom(id, operator, force, channel) {
	var chat = false;
	if (channel !== undefined && channel !== false) {
		chat = $('.chat-stack .channel.' + channel);
	} else {
		chat = $('.chat-stack .chat[data-id=' + id + '][data-operator=' + operator + ']');
	}

	if (chat != false && chat.length > 0) {
		var scroll = chat.find('.scroll'),
			end = scroll.find('div.end'),
			override = chat.data('initalised'),
			bottom = (scroll.length > 0) ? scroll[0].scrollTop + scroll.height() : 0,
			last = chat.find('.messages .message.last:parent'),
			element = 0,
			typing = chat.find('.messages .flex.typing:parent:visible');

		if (typing.length > 0) {
			last = typing;
		}

		if (scroll.length > 0) {
			element = (override !== undefined && last.length > 0) ? scroll[0].scrollTop + last.position().top : scroll[0].scrollTop;
		}

		if (last.length > 0) {
			force = (bottom >= element) ? true : force;
		}

		if (autoScroll || override === undefined || force !== undefined) {
			scroll.scrollTo(end);
			chat.data('initalised', true);
		}
	}
}

function addChat(id, type, closed) {
	var exists = false,
		blocked = false;

	$.each(activechats, function (key, message) {
		if (message.id === id) {
			exists = true;
			return;
		}
	});

	$.each(blockedchats, function (key, message) {
		if (message.id === id) {
			blocked = true;
			return;
		}
	});

	if (!exists && !blocked && !closed) {
		type = type ? 1 : 0;
		activechats.push({id: id, typing: 0, type: type, message: 0, date: new Date()});
	}
}

function updateTypingStatus(currentlyTyping) {
	var chats = $('.chat-stack .chat.focussed'),
		id = chats.data('id'),
		operator = chats.data('operator'),
		chat = _.find(activechats, function (chat) { return chat.id === id && chat.type == operator; }),
		typing;

	$(document).trigger('LiveHelp.UpdateTyping', {id: id, operator: operator, typing: currentlyTyping});

	if (chat !== undefined) {
		if (currentlyTyping) {
			switch (chat.typing) {
				case 0: // None
					typing = 2;
					break;
				case 1: // Guest Only
					typing = 3;
					break;
				case 2: // Operator Only
					typing = 2;
					break;
				case 3: // Both
					typing = 3;
					break;
			}
		} else {
			switch (chat.typing) {
				case 0: // None
					typing = 0;
					break;
				case 1: // Guest Only
					typing = 1;
					break;
				case 2: // Operator Only
					typing = 0;
					break;
				case 3: // Both
					typing = 1;
					break;
			}
		}

		chat.typing = typing;
		return false;
	}

}

function escapeHtml(text) {
	var result = '',
		map = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;'
		};

	if (typeof text === 'string') {
		result = text.replace(/[&<>"']/g, function(m) { return map[m]; });
	}
	return result;
}

function updateTyping(chat, typing) {

	var visible = -1;
	$.each($('.chat-stack .chat'), function (key, value) {
		if ($(this).position().left === 0) {
			visible = parseInt($(this).data('id'), 10);
			return false;
		}
	});

	/*
	if (chat == visible && (typing == 1 || typing == 3)) {
		typingstatus.show();
	} else {
		typingstatus.hide();
	}
	*/
}

function messageHTML(messageid, status, content, datetime, from, username, firstname, email, id, op, total, uuid) {
	var chat = chat = $('.chat-stack .chat[data-id=' + id + '][data-operator="' + op + '"]'),
		html = '',
		tweets = [],
		size = (window.devicePixelRatio > 1) ? 192 : 96,
		message = {id: messageid, timestamp: datetime.unix(), time: (datetime !== false) ? datetime.local().format('h:mm A') : false},
		defaultimage = (server.length > 0) ? protocol + server + defaultUserImage : encodeURIComponent(window.location.protocol + '//' + window.location.host + path.replace(path.substring(path.indexOf(directoryPath + 'admin/')), directoryPath + 'images/UserSmall.png'));

	if (status > 0) {
		message.content = $('<div>').text(content).html();
	} else {
		message.content = escapeHtml(content);
	}

	message.username = escapeHtml(username);
	email = escapeHtml(email);

	var tweetRegex = /^(http|https):\/\/twitter.com\/([^\/"\s]*)\/status\/([^\/"\s]*)\/*$/g,
		matchesTweet = tweetRegex.exec(message.content);

	// Image
	if (status === 3) {
		var regEx = /(https?|ftp|file):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[A-Z0-9+&@#\/%=~_|](\.jpg|.jpeg|\.gif|\.png)/im;
		var match = regEx.exec(message.content);
		if (match !== null) {
			message.content = '<img src="' + match[0] + '" />';
		}
	} else {

		if (matchesTweet && matchesTweet.length > 2) {
			message.tweet = matchesTweet[3];
			tweets.push(message.tweet);
			message.content = '';
		} else {
			message.content = message.content.replace(/(?!.*(?:\.jpe?g|\.gif|\.png)$)((?:(?:http(?:s?))|(?:ftp)):\/\/[^\s|<|>|'|"]*)/img, '<a href="$1" target="_blank">$1</a>');
			message.content = message.content.replace(/^(https?|ftp|file):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[A-Z0-9+&@#\/%=~_|](\.jpg|.jpeg|\.gif|\.png)$/img, '<img src="$&"/>');
		}
	}

	message.content = message.content.replace(/(\r\n|\r|\n)/g, '<br/>');
	if (settings.Smilies !== 0) {
		message.content = htmlSmilies(message.content);
	}

	// Operator-Operator Chat
	if (op !== false && from > 0) {
		if (operator.id !== from) {
			status = 0;
		} else {
			status = 1;
		}
	}

	message.alignment = (status > 0) ? 'right' : 'left';

	if (status >= 0) {
		if (status === 0) {
			message.tags = processTagsMenu(messageid, message.content);
			total++;
			alert = {id: id, username: username, message: message.content};
			message.content = processTags(messageid, message.content);
		}

		var account = false;
		if (email === undefined || from === undefined) {
			$.each(accounts, function (key, value) {
				var id = parseInt(value.ID, 10);
				if ((from !== undefined && id === from) || (from === undefined && value.Username === username)) {
					account = value;
					if (value.Image !== undefined && value.Image.indexOf('http') > -1) {
						email = false;
					} else {
						email = value.Email;
					}
					if (from === undefined) {
						from = id;
					}
					return false;
				}
			});
		}

		if (opts.messages.photo) {
			var css = 'operator';
			if (from !== undefined) {
				message.image = operatorImage(from, email, size);
			}
			if (account !== false && account.Image !== undefined && (account.Image.indexOf('https://') > -1 || account.Image.indexOf('data:image/') > -1)) {
				message.image = account.Image;
			} else if (status === 0 && op == false) {
				var user = $('.chatting .visitor[data-id=' + id + '], .other-chatting .visitor[data-id=' + id + ']').data('user');
				if (user !== undefined) {
					email = user.Email;
				}
				message.image = 'https://secure.gravatar.com/avatar/' + CryptoJS.MD5(email) + '?s=' + size + '&r=g&d=' + defaultimage;
				css = 'guest';
			}
		}

		if (firstname !== undefined && firstname.length > 0) {
			message.username = capitaliseFirstLetter(firstname);
		}

		if (opts.messages.from) {
			if (status > 0) {
				message.username = '';
			} else {
				message.username += ' ';
			}
		}

		var uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
		if (uuidRegex.test(messageid)) {
			message.sending = true;
		}

		html += App.templates.message(message);

	} else if (status === -2) {
		html += '<div class="visitor alert" data-id="' + message.id + '" data-datetime="' + message.timestamp + '"><img src="' + operatorImage(false, email, 20, false, true) + '"/>' + capitaliseFirstLetter(message.content) + '</div>';
	} else if (status === -3) {
		var rating = parseInt(message.content.substring(message.content.length - 1), 10),
			stars = '';

		for (var i = 1; i <= 5; i++) {
			if (rating >= i) {
				stars += '<div class="sprite RatingHighlight"></div>';
			} else {
				stars += '<div class="sprite Rating"></div>';
			}
		}

		message.content = message.content.substring(0, message.content.length - 2);
		switch (rating) {
			case 5:
				rating = 'Excellent';
				break;
			case 4:
				rating = 'Very Good';
				break;
			case 3:
				rating = 'Good';
				break;
			case 2:
				rating = 'Poor';
				break;
			case 1:
				rating = 'Very Poor';
				break;
		}

		html += '<div style="margin-left:20px" data-id="' + message.id + '" data-datetime="' + message.timestamp + '">' + message.content + '<span>' + stars + '<span style="margin-left:10px">' + rating + '</span></span></div>';
	}

	var selector = '.messages blockquote[data-id="' + message.id + '"], .messages div[data-id="' + message.id + '"]';
	if (uuid !== undefined) {
		selector += ', .messages blockquote[data-id="' + uuid + '"], .messages div[data-id="' + uuid + '"]';
	}

	if (chat.find(selector).length === 0) {
		return {html: html, total: total, alert: alert, tweets: tweets};
	} else {
		return false;
	}
}

function displayMessages(id, op, chat, html, status, total, last, scroll, channel, tweets, email) {
	var closed = chat.data('closed'),
		alert = undefined,
		visitor = $('.chat-list .visitor[data-id=' + id + '][data-operator=' + op + ']');

	if (channel !== undefined && channel !== false) {
		visitor = $('.chat-list .channel.' + channel);
	}

	// Chat Ended
	/*
	if (status === -1 && !closed && chat.data('operator') === false) {

		// Close Chat
		html = '<div style="margin-left:20px; text-align: center">The chat session has been closed.</div>';
		chat.data('closed', true);

		// Remove Chat
		if (id != false) {
			chats = [];
			$.each(activechats, function (key, chat) {
				if (chat.id !== id) {
					chats.push(chat);
					return;
				}
			});
			activechats = chats;
		}
	}
	*/

	if (html.length > 0 && !closed) {
		var typing = chat.find('.messages .flex.typing');
		if (typing.length > 0) {
			$(html).insertBefore(typing);
		} else {
			if (chat.length === 0) {
				if (visitor.length > 0) {
					chattingVisitorClickCallback.call(visitor, {}, true, true);
					chat = $('.chat-stack .chat[data-id=' + id + '][data-operator=' + op + ']');
				}
			}

			var messages = chat.find('.message').filter(function () {
				var id = $(this).data('id');
				return !(typeof id === 'string' && id.length == 36) && id > last;
			});
			if (messages.length > 0) {
				$(html).insertBefore(messages.first());
			} else {
				$(html).appendTo(chat.find('.messages'));
			}
		}

		// Default Image
		if (email !== false) {

			if (email === undefined) {
				var user = visitor.data('user');
				if (user !== undefined) {
					email = user.Email;
				}
			}

			var images = chat.find('.avatar.guest'),
				size = (window.devicePixelRatio > 1) ? 192 : 96,
				defaultimage = (server.length > 0) ? protocol + server + defaultUserImage : encodeURIComponent(window.location.protocol + '//' + window.location.host + path.replace(path.substring(path.indexOf(directoryPath + 'admin/')), directoryPath + 'images/UserSmall.png')),
				image = 'https://secure.gravatar.com/avatar/' + CryptoJS.MD5(email) + '?s=' + size + '&r=g&d=' + defaultimage;

			$('<img/>').attr('src', image).load(function() {
				$(this).remove();
			}).error(function () {
				$(this).remove();
				images.css('background-image', 'url(' + defaultimage + ')');
			});
		}

		// Tweets
		if (tweets !== false && tweets.length > 0) {
			$.each(tweets, function (key, value) {
				var element = $('.message .content[data-twitter=' + value + ']'),
					embedded = element.find('.twitter-tweet').length;

				if (element.length > 0 && !embedded) {
					twttr.widgets.createTweet(
						value,
						element.get(0),
						{ theme: 'light' }
					);
				}
			});
		}

		// Update Last Message
		$.each(activechats, function (key, chat) {
			if (chat.id === id) {
				chat.message = last;
				return;
			}
		});

		// Scroll / Sound Alert
		setTimeout(function () {
			scrollToBottom(id, op, scroll, channel);
		}, 150);

		if (total > 0 && id != false) {
			alert = true;
			updateMessageAlert(id, op, total, last);
		}

		// Update Last Message
		if (last > 0 && visitor.length > 0) {
			visitor.data('messages', last);
		}

	}

	return alert;
}

function playMessageSound(alert, last) {
	if (alert && messageSound !== undefined) {

		// Play Sound
		messageSound.play();
		$(document).trigger('LiveHelp.PlayMessageSound', last);

		alert = false;
	}
}

// Messages
function updateMessages(callback) {
	if (session.length > 0 && messagesAjax) {
		var stack = $('.chat-stack'),
			chats = stack.find('.chat[data-id]');

		$.each(chats, function (key, value) {
			var chat = $(value),
				id = chat.data('id'),
				closed = chat.data('closed'),
				operator = chat.data('operator'),
				type = (operator !== false) ? 1 : 0;

			addChat(id, type, closed);

		});

		if (activechats.length > 0) {
			var data = '';

			$.each(activechats, function (key, chat) {
				if (data.length > 0) {
					data += '|';
				}
				data += chat.id + ',' + chat.typing + ',' + chat.type + ',' + chat.message; // ID,Typing,Type,Message|ID,Typing,Type,Message
			});
			post = {'Data': data};

			apiRequest({
				url: apiEndpoint.chats,
				data: post,
				success: function (data) {

					var alert = false,
						html = '',
						lastmessage = {},
						tweets = [];

					// Messages JSON
					if (data.MultipleMessages !== undefined && data.MultipleMessages.Messages !== undefined) {

						$.each(data.MultipleMessages.Messages, function(key, messages) {
							if (messages !== undefined) {

								var op = (parseInt(messages.ChatType, 10)) ? true : false;

								var id = (typeof messages.ID === 'string' && messages.ID.length == 36) ? messages.ID : parseInt(messages.ID, 10),
									status = parseInt(messages.Status, 10),
									typing = messages.Typing,
									chat = $('.chat-stack .chat[data-id=' + id + '][data-operator="' + op + '"]'),
									pos = 'left',
									total = 0,
									last = false;

								chat.find('.message.last').removeClass('last');
								chat.find('.message:not(.typing):last').addClass('last');

								$.each(activechats, function(key, value) {
									if (value.id !== undefined && value.id == id) {
										// Current Typing
										value.typing = typing;
										updateTyping(value.id, value.typing);
										return false;
									}
								});

								html = '';
								email = false;
								if (messages.Message !== undefined && messages.Message.length > 0) {
									$.each(messages.Message, function(key, value) {
										var messageid = parseInt(value.ID, 10),
											status = parseInt(value.Status, 10),
											content = value.Content,
											date = new moment(value.Datetime, 'YYYY-MM-DD HH-mm:ssZZ'),
											from = (value.From !== undefined) ? parseInt(value.From, 10) : undefined;

										email = value.Email;

										var username = (value.Username !== undefined) ? value.Username : '';
										if (op !== false && value.Name !== undefined) {
											username = value.Name;
										}

										var message = messageHTML(messageid, status, content, date, from, username, undefined, email, id, op, total);
										if (message !== false) {
											html += message.html;
											total = message.total;
											lastmessage = message.alert;
											if (message.tweets.length > 0) {
												tweets = tweets.concat(message.tweets);
											}
										}

										last = messageid;
									});
								}

								// Display Messages
								var newAlert = displayMessages(id, op, chat, html, status, total, last, false, false, tweets, email);
								if (newAlert !== undefined) {
									alert = newAlert;
								}

							}

						});

					}

					if (callback) {
						callback();
					}

					// New Message Sound
					playMessageSound(alert, lastmessage);

					if (!$.isEmptyObject(lastmessage)) {
						$(document).trigger('LiveHelp.MessagesUpdated');
					}

					// Refresh Messages
					refreshMessages();

				},
				error: function (xhr, ajaxOptions, thrownError) {
					refreshMessages();

					if (callback) {
						callback();
					}
				}
			});
		} else {
			refreshMessages();
		}
	} else {
		refreshMessages();
	}

}

function refreshMessages() {
	if (websockets === false) {
		window.setTimeout(updateMessages, 2000);
	}
}

var closeAddResponseCallback = function (responses) {
	responses.find('.search, #response-list, .button-toolbar.add').fadeIn(250, function () {
		$('#response-list .response, #responses .button-toolbar.add').show();
	});
}

function saveScroll() {
	var scroll = $(this),
		chat = scroll.closest('.chat'),
		id = chat.data('id'),
		operator = chat.data('operator'),
		viewedchat = _.find(viewed, function (chat) { return chat.id === id && chat.operator == operator; });

	if (viewedchat !== undefined) {
		viewedchat.scroll = scroll.scrollTop();
		storage.set('viewed', viewed);
	} else {
		viewed.push({
			id: id,
			operator: operator,
			message: 0,
			viewed: 0,
			scroll: scroll.scrollTop()
		});
		storage.set('viewed', viewed);
	}
}

var initialiseRoute = function () {
	var route = window.location.hash.slice(2);
	if (route.length > 0) {
		storage.set('route', route);
	} else {
		storage.set('route', '');
	}
};

// Chat Scroll
var debouncedSaveScroll = _.debounce(saveScroll, 300);

// Document Ready
$(document).ready(function () {

	// Chat Sections
	chatSections = {chatting: { element: $('.chatting.list'), height: 74 }, other: { element: $('.other-chatting.list'), height: 74 }, pending: { element: $('.pending.list'), height: 74 }, operators: { element: $('.operators.list'), height: 74 }, none: { height: 0, enabled: false }};

	var routes = {
		'/home': function () {
			switchMenu('home');
		},
		'/accounts': function () {
			switchMenu('accounts');
		},
		'/settings': function () {
			openSettings();
		},
		'/settings/:menu': function (menu) {
			openSettings(menu);
		},
		'/tour': function () {
			if (tour !== false) {
				tour.setCurrentStep(0);
				tour.start(true);
			}
		}
	};
	router = Router(routes);

	// Initialise Storage
	storage = new Storage();

	// Initialise Route
	initialiseRoute();

	// Web Sockets
	$(document).bind('LiveHelp.WebSocketStateChanged', function (event, data) {
		websockets = data;
		if (websockets !== false) {
			window.clearTimeout(usersTimer);
			window.clearTimeout(visitorsTimer);
		}
	});

	// Reset Chatting List Height Data
	var lists = $('.chat-list .list');
	$.each(lists, function (key, value) {
		var section = $(value);
		if (section.find('.visitor').length === 0) {
			if (chatSections.none.enabled) {
				section.data('height', chatSections.none.height);
			} else {
				section.find('no-visitor').hide();
				section.data('height', 0);
			}
		} else {
			var height = sectionHeight(section);
			section.data('height', height);
		}
	});

	$('.chat-list').on({
		mouseenter: function() {
			$(this).find('.image, .close, .dropdown-toggle.options').addClass('hover');
		},
		mouseleave: function() {
			$(this).find('.image, .close, .dropdown-toggle.options').removeClass('hover');
		}
	}, '.visitor');

	$('.chat-list').on({
		mouseenter: function () {
			$('.chat-list').find('.visitor.selected, .channel.selected').addClass('previous');
			$('.chat-list').find('.visitor, .channel').removeClass('selected');
		},
		mouseleave: function () {
			$('.chat-list .previous').removeClass('previous').addClass('selected');
		}
	}, '.visitor, .channel');

	$('.history.container .search #search').keyup(function (e) {
		if (e.which == 27) {
			$(this).val('');
		}
		historySearch = $(this).val();
		updateHistoryFilter();
	});

	$('.history.container .search.button').click(function () {
		historySearch = $('.history.container .search #search').val();
		updateHistoryFilter();
	});

	$('.VisitorsTotal, #visitortotal').click(function () {
		switchMenu('home');
	});

	$('#responses .close').click(function () {
		closeResponses();
	});

	// Accounts Back Button
	$('#account-details .back').click(function () {
		// Close Edit Details
		if ($('#account-details.edit').length) {
			closeAccountDetails();
		}
		showAccounts();
	});

	// Sidebar Menu
	$('.sidebar-icons .menu').click(function(e) {
		var type = $(this).data('type'),
			menu = ['home', 'statistics', 'history'];

		// Menu
		switchMenu(type);

		if (e.preventDefault) {
			e.preventDefault();
		}
		if (e.stopPropagation) {
			e.stopPropagation();
		}
	});

	// Visitors List / Map
	$('.visitors-list.button').click(function() {
		$(this).addClass('selected');
		$('.visitors-map.button').removeClass('selected');
		$('.worldmap').hide();
		if (visitors.length > 0) {
			$('.visitors-grid').fadeIn();
		} else {
			$('.visitors-empty').fadeIn();
			updateTotal($('#visitortotal'), 0);
		}
	});
	$('.visitors-map.button').click(function() {
		$(this).addClass('selected');
		$('.visitors-list.button').removeClass('selected');
		$('.visitors-empty, .visitors-grid').hide();

		var parent = $('.worldmap');
		$('.worldmap svg').attr('width', parent.width()).attr('height', parent.height());
		$('.worldmap').fadeIn();
	});

	// Visitor Details / Initiate Chat
	$('#visitor-details .btn.initiate').click(function () {
		sendInitiateChat();
	});

	// Notification Events
	$('.notification .close').click(function() {
		closeNotification();
		return false;
	});

	// Settings Events
	$('.settings.dropdown .close, .settings.dropdown .cancel').click(function() {
		closeSettings();
		return false;
	});

	// Change Settings to Switches
	var settingtoggles = $('.settings.dropdown .checkbox.toggle');
	settingtoggles.each(function(key, value) {
		var element = $(value),
			css = element.attr('class').replace(/checkbox|toggle/g, '').trim(),
			disabled = (element.is('.disabled')) ? ' disabled="disabled"' : '';
			toggle = $('<label class="switch"><input type="checkbox" class="checkbox ' + css + ' ios-switch"' + disabled + '/><div><div></div></div></label>').appendTo(element),
			checkbox = toggle.find('.checkbox');

		checkbox.on('change', function () {
			var enable = element.find('.radios .enable'),
				disable = element.find('.radios .disable');

			if ($(this).is(':checked')) {
				enable.prop('checked', true).change();
			} else {
				disable.prop('checked', true).change();
			}
		});
	});

	$(document).on('LiveHelp.SettingsLoaded', function (event, data) {
		settingtoggles.each(function(key, value) {
			var element = $(value),
				checkbox = element.find('.switch .checkbox');

			if (element.find('.radios .enable').is(':checked')) {
				checkbox.prop('checked', true).change();
			} else {
				checkbox.prop('checked', false).change();
			}
		});
	});

	// Save Settings
	$('.settings.dropdown .save').on('click', function(e) {
		saveSettings();
		e.stopPropagation();
	});

	$('.settingsmenu div').click(function() {
		var id = $(this).attr('id'),
			route = 'settings/' + id;

		storage.set('route', route);
		router.setRoute(route);

		$(document).trigger('LiveHelp.RouteChanged');
	});

	$('.dropdown-toggle').dropdown();

	// History Calendar
	$('#calendar').ical();

	$('#calendar').on('click', 'td', function () {
		var date = $(this).attr('id'),
			selected = $(this);

		if (date !== undefined && date.length > 0 && /^\d{4}-\d{2}-\d{2}$/i.test(date)) {
			// Save Selected Date
			storage.set('history-date', date);

			// Selected Date
			selected.closest('table').find('td').removeClass('selected-date');
			selected.addClass('selected-date');

			// Update History
			initHistoryGrid(date);
		}
	});

	// Chat History
	var history = $('#history-chat');
	history.find('.btn.unblock').click(function() {
		var chat = history.data('id'),
			dialog = history.find('.dialog');

		unblockChat(chat, dialog);
	});

	var chatstack = $('.chat-stack');
	chatstack.find('.dialog .btn.unblock').click(function () {
		var chats = chatstack.find('.chat'),
			dialog = chatstack.find('.dialog'),
			chat;

		$.each(chats, function (key, value) {
			if ($(value).position().left === 0) {
				chat = $(value);
				return;
			}
		});

		if (chat !== undefined && chat.length > 0) {
			chat = chat.data('id');
			unblockChat(chat, dialog);
		}
	});

	// Chats Stack
	chatstack.on('click', '.chat', function() {
		var obj = $(this),
			id = obj.data('id'),
			pos = { top: parseInt(obj.css('top'), 10), left: parseInt(obj.css('left'), 10), bottom: parseInt(obj.css('bottom'), 10) },
			focussed = obj.is('.focussed'),
			scroll = obj.find('.scroll'),
			total = obj.find('.message-alert').data('total');

		if (!focussed) {

			// Save Scroll Position
			$('.chat-stack .chat').each(function(index, value) {
				var chat = $(value),
					left = parseInt(chat.position().left, 10);

				if (left === 0) {
					$(chat).data('scroll', chat.find('.scroll').scrollTop());
				}
			});

			// Animate Front Position
			obj.animate({'z-index':80, 'left':0, 'bottom':0, 'top':0, 'backgroundColor': '#fffff'}, 150, 'easeInOutBack', function () {
				obj.find('.inputs, input').fadeIn();
				obj.find('.inputs input').focus();

				var scroll = obj.data('scroll');

				if (total > 0) {
					scroll = obj.find('.scroll .end');
				}

				// Update Email Transcript
				var id = obj.data('id');

				// Check Blocked Chat
				checkBlocked(id);

				if (scroll !== undefined) {
					obj.find('.scroll').scrollTo(scroll);
				}
			});

			// Close Smilies
			$('.chat-stack .smilies.button').close();

			// Hide Name / Alert
			obj.find('.name').hide();
			resetMessageAlert(obj);

			// Stack Chats
			$('.chat-stack .chat').each(function(index, value) {
				var chat = $(value),
					left = parseInt(chat.css('left'), 10),
					zindex = parseInt(chat.css('z-index'), 10),
					top = 0,
					bottom = 2,
					color = '#fafafa';

				if (left < pos.left) {
					if (left > 0) {
						top = 0;
						bottom = 4;
						color = '#f6f6f6';
					}
					chat.animate({'z-index': zindex - 10, 'top': top, 'left': left + 35, 'bottom': bottom, 'backgroundColor': color}, 150, 'easeInOutBack');
					chat.find('.inputs, input').fadeOut();
					chat.find('.name').fadeIn();
				}
			});

			scroll.scrollTo(scroll.find('.end'));

		}
	});

	chatstack.on('click', '.chat .scrollalert a, .chat .scrollalert .scrollmessage, .chat .scrollalert .arrow', function () {
		var chat = $('.chat-stack .chat.focussed'),
			id = chat.data('id'),
			visitor = $('.chat-list .visitor[data-id="' + id + '"]'),
			operator = $('.chat.focussed').data('operator'),
			alert = visitor.find('.message-alert'),
			total = alert.data('total');

		if (total > 0) {
			var last = chat.find('.messages .flex.left:nth-last-child(' + total + ')'),
				typing = chat.find('.messages .flex.typing:visible');

			if (typing.length > 0) {
				last = typing;
			}
			chat.find('.scroll').scrollTo(last);
		} else {
			scrollToBottom(id, operator, true);
		}

		resetMessageAlert(visitor);
		$('.chat-stack .chat[data-id="' + id + '"] .scrollalert').hide();
	});

	$('#visitor-details .close').click(function () {
		closeVisitor();
	});

	// Keyboard Shortcuts
	var keyselector = 'body, input, textarea';
	$(keyselector).bind('keydown', 'esc', function () {
		if (shortcuts) {
			processEscKeyDown();
		}
	});

	$(keyselector).bind('keydown', 'ctrl+shift+s', function () {
		if (shortcuts) {
			openSettings();
		}
	});

	$(keyselector).bind('keydown', 'ctrl+shift+a', function () {
		if (shortcuts) {
			openAccounts();
		}
	});

	$(keyselector).bind('keydown', 'ctrl+shift+r', function () {
		if (shortcuts) {
			openResponses();
		}
	});

	$('#account-details .close').click(function () {
		// Close Edit Details
		if ($('#account-details.edit').length) {
			closeAccountDetails();
		}
		closeAccount();
	});

	$('#response-list').on({
		mouseenter: function () {
			var edit = $(this).find('.edit');
			if (activechats.length > 0) {
				edit = $(this).find('.edit');
			}
			edit.animate({opacity: 0.3}, 250);
		}, mouseleave: function () {
			var edit = $(this).find('.edit');
			if (activechats.length > 0) {
				edit = $(this).find('.edit');
			}
			edit.animate({opacity: 0}, 250);
		}
	}, '.response');

	$('#response-list').on({
		mouseenter: function () {
			if (activechats.length > 0) {
				var edit = $(this);
				edit.animate({opacity: 0.6}, 250);
			}
		},
		mouseleave: function () {
			if (activechats.length > 0) {
				var edit = $(this);
				edit.animate({opacity: 0.3}, 250);
			}
		}
	}, '.response .edit');

	$('#response-list').on('click', '.response .edit', function () {

		// Response
		var response = $(this).closest('.response'),
			id = response.data('id'),
			edit = $('#responses #add-response'),
			types = ['Text', 'Hyperlink', 'Image', 'PUSH', 'JavaScript'];

		response = [];
		$.each(responses, function(type, section) {
			if ($.inArray(type, types) > -1) {
				$.each(section, function(key, value) {
					if (parseInt(value.ID, 10) === id) {
						response = value;
						return false;
					}
				});
			}
		});

		$('#ResponseID').val(response.ID);
		$('#ResponseName').val(response.Name);
		$('#ResponseCategory').val(response.Category);

		// Type
		var selector = 'Text';
		switch (response.Type) {
		case 2:
			selector = 'Hyperlink';
			break;
		case 3:
			selector = 'Image';
			break;
		case 4:
			selector = 'PUSH';
			break;
		case 5:
			selector = 'JavaScript';
			break;
		}
		$('#ResponseType' + selector).attr('checked', 'checked');

		if (selector === 'Text') {
			$('#ResponseContent').val(response.Content);
			$('#add-response .URL').hide();
			$('#add-response .Content').show();
		} else {
			$('#ResponseURL').val(response.Content);
			$('#add-response .Content').hide();
			$('#add-response .URL').val(response.Content).show();
		}

		// Add Tags
		$('.add-response.tags').html('');
		addTags(response.Tags);

		showResponse();
	});

	$('.chat-stack .smilies.button').on({
		mouseenter: function () {
			$(this).removeClass('Smilies').addClass('SmiliesHover');
		},
		mouseleave: function () {
			$(this).removeClass('SmiliesHover').addClass('Smilies');
		},
		click: function () {
			$(this).bubbletip($('#SmiliesTooltip'), { calculateOnShow: true }).open();
		}
	});

	$('.chat-stack').on('focus', '#message', function () {
		$('.chat-stack .smilies.button').close();
	});

	$('#SmiliesTooltip span').click(function () {
		var smilie = $(this).attr('class').replace(/sprite | Small/g, ''),
			text = '',
			textarea = $('.chat-stack textarea'),
			val = textarea.val();

		switch (smilie) {
		case 'Laugh':
			text = ':D';
			break;
		case 'Smile':
			text = ':)';
			break;
		case 'Sad':
			text = ':(';
			break;
		case 'Money':
			text = '$)';
			break;
		case 'Impish':
			text = ':P';
			break;
		case 'Sweat':
			text = ':\\';
			break;
		case 'Cool':
			text = '8)';
			break;
		case 'Frown':
			text = '>:L';
			break;
		case 'Wink':
			text = ';)';
			break;
		case 'Surprise':
			text = ':O';
			break;
		case 'Woo':
			text = '8-)';
			break;
		case 'Tired':
			text = 'X-(';
			break;
		case 'Shock':
			text = '8-O';
			break;
		case 'Hysterical':
			text = 'xD';
			break;
		case 'Kissed':
			text = ':-*';
			break;
		case 'Dizzy':
			text = ':S';
			break;
		case 'Celebrate':
			text = '+O)';
			break;
		case 'Angry':
			text = '>:O';
			break;
		case 'Adore':
			text = '<3';
			break;
		case 'Sleep':
			text = 'zzZ';
			break;
		case 'Stop':
			text = ':X';
			break;
		}
		textarea.val(val + text).keyup();
	});

	// Close Chat
	var confirmclose = $('.chat-stack .confirm-close.dialog');
	confirmclose.find('.cancel-button').on('click', function () {
		confirmclose.show().animate({bottom: -90}, 250, 'easeInOutBack', function () {
			confirmclose.hide();
		});
	});

	confirmclose.find('.accept-button').on('click', function () {
		var id = $('.chat-list .visitor.selected').data('id'),
			chat = $('.chat-stack .chat[data-id=' + id + ']');

		if (chat !== null) {
			// Confirm Close
			confirmclose.find('.buttons').hide();
			confirmclose.find('.progressring').css('opacity', 1).show();

			// Close Tour Chat
			if (id < 0) {
				var section = $('.chatting.list'),
					element = section.find('.visitor[data-id=-1]'),
					count = section.find('.visitor').length;

				if (count > 1) {
					removeUser(section, element);
				} else {
					clearUsers(section);
				}

				closeChatCompletedCallback();
				return;
			}

			// Close Chat AJAX
			updateUsers('Close', id, function () {

				// Close Chat Callback
				var chats = $('.chat-stack .chat');
				closeChatCompletedCallback(id, chats);

				// Remove Chat
				chats = [];
				$.each(activechats, function (key, message) {
					if (message.id !== id) {
						chats.push(message);
						return;
					}
				});
				activechats = chats;

				$(document).trigger('LiveHelp.CloseChatCompleted');

			});
		}
	});

	// Operator Status Dropdown
	$('.operator .name, .operator .photo').on('click', function (e) {
		$('.operator .dropdown-toggle').click();
		e.stopPropagation();
	});

	// Pre-typed Responses
	loadResponses();

	var responsesParent = $('#responses');
	responsesParent.find('input').on('keydown', '#search', 'return', filterResponses);
	responsesParent.click(filterResponses);

	function showResponse() {
		$('.responses .empty').hide();
		responsesParent.find('.back, .back-background, #add-response').fadeIn();
		responsesParent.find('.header').text('Add Response');

		responsesParent.find('.search, #response-list, .button-toolbar.add').hide();
		responsesParent.find('.button-toolbar.save').fadeIn().animate({bottom: '15px'}, 250, 'easeInOutBack');
	}

	// Add Response
	responsesParent.find('.add-small.button, .button-toolbar .add-button').click(function () {
		clearResponse();
		showResponse();
	});

	function clearResponse() {
		// Clear
		responsesParent.find('#ResponseID, #ResponseName, #ResponseCategory, #ResponseURL, #ResponseContent, #ResponseTags').val('');
		responsesParent.find('#ResponseTypeText').attr('checked', 'checked');
		responsesParent.find('.add-response.tags').html('');

		// Reset Content / URL / Hide Errors
		responsesParent.find('.URL, .InputError').hide();
		responsesParent.find('.Content').show();
	}

	responsesParent.find('.cancel.button').click(function () {
		// Clear
		clearResponse();

		// Close
		closeAddResponse();
	});

	// Response Delete Button
	var confirm = responsesParent.find('.confirm-delete.dialog');
	responsesParent.find('.delete-button').click(function () {
		confirm.find('.progressring img').css({opacity: 0});
		confirm.find('.buttons').show();
		confirm.find('.title').text('Confirm Response Delete');
		confirm.find('.description').text('Are you sure that you wish to delete this response?');
		confirm.show().animate({bottom: 0}, 250, 'easeInOutBack');
	});

	// Confirm Delete Response Button
	confirm.find('.delete').click(function () {
		// Show Progress
		confirm.find('.buttons').fadeOut();
		confirm.find('.progressring img').css({opacity: 0.5});

		// Delete Response
		deleteResponse();
	});

	// Confirm Cancel Button
	confirm.find('.cancel').click(function () {
		confirm.animate({bottom: '-90px'}, 250, 'easeInOutBack');
	});

	// Validate Required Fields
	responsesParent.find('#ResponseName').on('keydown keyup change blur', function () {
		var id = $(this).attr('id');
		validateField($(this), '#' + id + 'Error');
	});

	// Text / JavaScript
	responsesParent.find('#ResponseTypeText, #ResponseTypeJavaScript').on('click', function () {
		if ($(this).is(':checked')) {
			responsesParent.find('.URL').hide();
			responsesParent.find('.Content').show();
		}
	});

	// Hyperlink / Image / PUSH
	responsesParent.find('#ResponseTypeHyperlink, #ResponseTypeImage, #ResponseTypePUSH').on('click', function () {
		if ($(this).is(':checked')) {
			responsesParent.find('.Content').hide();
			responsesParent.find('.URL').show();
		}
	});

	function validateResponseURL(url) {
		if (responsesParent.find('#ResponseTypeHyperlink, #ResponseTypePUSH, #ResponseTypeImage').is(':checked')) {
			if (/^(?:\b(https?|file):\/\/[\-A-Z0-9+&@#\/%?=~_|$!:,.;]*[A-Z0-9+&@#\/%=~_|$])$/i.test(url)) {
				// Successful match
				responsesParent.find('#ResponseURLError').removeClass('CrossSmall').addClass('TickSmall').fadeIn(250);
			} else {
				responsesParent.find('#ResponseURLError').removeClass('TickSmall').addClass('CrossSmall').fadeIn(250);
			}
		}
	}

	// Validate Content / URL
	responsesParent.find('#ResponseContent, #ResponseURL').on('keydown keyup change blur', function () {
		var type = responsesParent.find('.checkbox input:checked').data('type'),
			url = responsesParent.find('#ResponseURL'),
			content = responsesParent.find('#ResponseContent');

		// Validate Content / URL
		if (type === 'Text' || type === 'JavaScript') {
			// Validate Content
			validateField(content, '#ResponseContentError');
		} else {
			// TODO Validate URL / Image / Link
			// TODO Show Image Preview
			validateResponseURL(url.val());
		}
	});

	function deleteResponse() {
		var id = responsesParent.find('#ResponseID');

		function deleteCompleted(data) {
			// Update Responses
			if (data !== undefined && data.Responses !== undefined) {
				updateResponses(data.Responses);
			}

			// Clear
			clearResponse();

			// Close
			closeAddResponse();

			// Hide Progress
			$('#responses .confirm-delete.dialog').show().animate({bottom: -90}, 250, 'easeInOutBack');
		}

		// Save Response
		if (responsesParent.find('.CrossSmall').length === 0) {

			var response = {ID: id.val()};

			// Save Response
			apiRequest({
				url: apiEndpoint.responses,
				data: response,
				success: function (data) {
					deleteCompleted(data);
				}
			});
		}
	}

	function saveResponse() {
		var id = responsesParent.find('#ResponseID'),
			name = responsesParent.find('#ResponseName'),
			category = responsesParent.find('#ResponseCategory'),
			type = responsesParent.find('.checkbox input:checked').data('type'),
			url = responsesParent.find('#ResponseURL'),
			content = responsesParent.find('#ResponseContent'),
			tags = responsesParent.find('#ResponseTags'),
			result = true;

		// Validate Name
		validateField(name, '#ResponseNameError');

		// Validate Content / URL
		if (type === 'Text' || type === 'JavaScript') {
			// Validate Content
			validateField(content, '#ResponseContentError');
			content = content.val();
		} else {
			// TODO Validate URL / Image / Link
			// TODO Show Image Preview
			validateResponseURL(url.val());
			content = url.val();
		}

		function saveCompleted(data) {
			// Update Responses
			if (data !== undefined && data.Responses !== undefined) {
				updateResponses(data.Responses);
			}

			// Clear
			clearResponse();

			// Close
			closeAddResponse();
		}

		// Save Response
		if (responsesParent.find('.CrossSmall').length === 0) {

			// Response Type
			switch (type) {
			case 'Text':
				type = 1;
				break;
			case 'Hyperlink':
				type = 2;
				break;
			case 'Image':
				type = 3;
				break;
			case 'PUSH':
				type = 4;
				break;
			case 'JavaScript':
				type = 5;
				break;
			}

			// Tags
			var tags = [],
				tag = '';

			$.each(responsesParent.find('.add-response .tag'), function (key, value) {
				tag = $(value).text();
				if (tag.length > 0 && $.inArray(value, tags) === -1) {
					tags.push(tag.toLowerCase());
				}
			});
			tags = tags.join(';');

			var response = {
					ID: id.val(),
					Name: name.val(),
					Category: category.val(),
					Content: content,
					Type: type,
					Tags: tags
				};

			// Save Response
			apiRequest({
				url: apiEndpoint.responses,
				data: response,
				success: function (data) {
					saveCompleted(data);
				}
			});
		}
	}

	responsesParent.find('.save.button').click(function () {
		saveResponse();
	});

	function addTags(tags) {
		if (tags !== undefined && tags.length > 0) {
			$.each(tags, function (key, tag) {
				responsesParent.find('.add-response.tags').append('<span class="tag"><span class="tag-icon"></span>' + tag.trim() + '<span class="delete" title="Delete"></span></span>');
			});
		}
	}

	responsesParent.find('.add-tag').click(function () {
		var field = responsesParent.find('#ResponseTags'),
			tags = field.val().split(' ');

		// Add Tags
		addTags(tags);

		// Clear Tags Field
		field.val('');
	});

	// Response Tags
	$('#responses').on({'mouseenter': function () {
		$(this).find('.delete').css({opacity: 0.3});
	}, 'mouseleave': function () {
		$(this).find('.delete').css({opacity: 0.1});
	}}, '.add-response.tags .tag');

	$('#responses').on('click', '.tag .delete', function () {
		$(this).closest('.add-response.tags .tag').remove();
	});

	function closeAddResponse() {
		responsesParent = $('#responses');
		responsesParent.find('#add-response').fadeOut();
		responsesParent.find('.header').text('Pre-typed Response');
		responsesParent.find('.back, .back-background').fadeOut();

		var save = responsesParent.find('.button-toolbar.save'),
			height = save.height();

		save.hide().css('bottom', -height + 'px');
		closeAddResponseCallback(responsesParent);

		if (!responsesParent.find('#responses .scroll #response-list .response').length) {
			$('.responses .empty').show();
		}
	}

	// Close Add Response
	responsesParent.find('.back').click(function () {
		closeAddResponse();
	});

	$('.chat-stack').on('click', '.search.button', function () {
		chatResponsesOpen = true;
		openResponses(function () {
			$('#responses #search').focus();
		});
	});

	$(document).bind('LiveHelp.AccountsUpdated', function (event, accounts) {
		var operators = $('.operators.list .visitor');
		$.each(operators, function(key, value) {
			var operator = $(value),
				id = operator.data('id');

			$.each(accounts, function(key, account) {
				if (parseInt(account.ID, 10) == id) {
					operator.find('.name').text(account.Firstname);
					operator.find('.department').text(account.Department);

					var access = convertAccessLevel(account.Privilege);
					operator.find('.accesslevel').text(access);
				}
			});
		});
	});

	// Send Button
	$('.chat-stack .send').on({
		click: function () {
			// Send Message
			sendMessage();

			// Close Pre-typed Responses
			var menu = $('.responses-menu');
			if (menu.css('display') != 'none') {
				menu.height(0).hide();
			}
			return false;
		},
		mouseenter: function () {
			$(this).css({'opacity': 1.0}).removeClass('sprite SendButton').addClass('sprite SendButtonHover');
		},
		mouseleave: function () {
			$(this).css({'opacity': 0.4}).removeClass('sprite SendButtonHover').addClass('sprite SendButton');
		}
	});

	var textarea = $('.chat-stack textarea');
	textarea.bind('keydown', 'return', function () {
		sendMessage();
		return false;
	}).bind('keyup', 'return', function() {
		updateTypingStatus(false);
	}).bind('focusout', function () {
		updateTypingStatus(false);
	}).bind('keydown', 'ctrl+return', function () {
		var input = $(this),
			value = input.val(),
			start = input.caret().start,
			end = input.caret().end;

		input.val(value.substr(0, start) + '\n' + value.substr(end)).caret(start + 1, start + 1);
		return false;
	}).bind('keydown', function () {
		updateTypingStatus(true);
	});

	function toggleTaggedResponses() {
		var tag = $(this),
			id = tag.data('message'),
			menu = $('.responses-menu[data-message=' + id + ']'),
			height = 300,
			opacity = 1,
			tagtext = tag.find('.text').text();

		if (menu.length === 0) {
			menu = tag.parent();
		}

		if (menu.height() > 0) {
			height = 0;
			opacity = 0;
		} else {
			var count = 0;
			menu.find('.responses-text, .responses-hyperlink, .responses-image, .responses-push, .responses-javascript').html('').hide();
			menu.find('.responses.heading').hide();
			$.each(responses, function(key, response) {
				if (key === 'Text') {
					count = 0;
					$.each(response, function(key, text) {
						$.each(text.Tags, function(key, tag) {
							tag = tag.toLowerCase();
							if (tag === tagtext.toLowerCase()) {
								var html = '<div class="response" data-content="' + text.Content + '">' + text.Name + '</div>';
								menu.find('.tag-text').text(tag);
								$(html).appendTo(menu.find('.responses-text'));
								count++;
							}
						});
					});
					if (count > 0) {
						menu.find('.responses.text.heading, .responses-text').show();
					}
				} else if (key === 'Hyperlink') {
					count = 0;
					$.each(response, function(key, text) {
						$.each(text.Tags, function(key, tag) {
							tag = tag.toLowerCase();
							if (tag === tagtext.toLowerCase()) {
								var html = '<div class="response" data-content="' + text.Content + '">' + text.Name + '</div>';
								menu.find('.tag-text').text(tag);
								$(html).appendTo(menu.find('.responses-hyperlink'));
								count++;
							}
						});
					});
					if (count > 0) {
						menu.find('.responses.hyperlink.heading, .responses-hyperlink').show();
					}
				} else if (key === 'Image') {
					count = 0;
					$.each(response, function(key, text) {
						$.each(text.Tags, function(key, tag) {
							tag = tag.toLowerCase();
							if (tag === tagtext.toLowerCase()) {
								var html = '<div class="response">' + text.Content + '</div>';
								menu.find('.tag-text').text(tag);
								$(html).appendTo(menu.find('.responses-image'));
								count++;
							}
						});
					});
					if (count > 0) {
						menu.find('.responses.image.heading, .responses-image').show();
					}
				} else if (key === 'PUSH') {
					count = 0;
					$.each(response, function(key, text) {
						$.each(text.Tags, function(key, tag) {
							tag = tag.toLowerCase();
							if (tag === tagtext.toLowerCase()) {
								var html = '<div class="response">' + text.Content + '</div>';
								menu.find('.tag-text').text(tag);
								$(html).appendTo(menu.find('.responses-push'));
								count++;
							}
						});
					});
					if (count > 0) {
						menu.find('.responses.push.heading, .responses-push').show();
					}
				} else if (key === 'JavaScript') {
					count = 0;
					$.each(response, function(key, text) {
						$.each(text.Tags, function(key, tag) {
							tag = tag.toLowerCase();
							if (tag === tagtext.toLowerCase()) {
								var html = '<div class="response">' + text.Content + '</div>';
								menu.find('.tag-text').text(tag);
								$(html).appendTo(menu.find('.responses-javascript'));
								count++;
							}
						});
					});
					if (count > 0) {
						menu.find('.responses.javascript.heading, .responses-javascript').show();
					}
				}
			});
			height = '100%';
		}
		menu.animate({height:height, opacity:opacity}, 100, 'easeOutBack', function () {
			$(this).toggle();
		});
	}

	$('.chat-stack').on('click', '.responses-menu .response', function () {
		$('.chat-stack textarea').val($(this).data('content'));
	});

	$(document).on('click', '.messages .tag, .responses-menu > .close', toggleTaggedResponses);

	$('.chat-list-heading').on('click', function () {
		var menu = $(this).next(),
			height = menu.height(),
			expanded = false;

		if (height === 0) {
			height = menu.data('height');
			expanded = true;
		} else {
			menu.data('height', height);
			height = 0;
		}
		$(this).attr('aria-expanded', expanded);

		toggleChatMenu(menu, height, true);
	});

	$('.chat-list-heading').on({
		mouseenter: function () {
			$(this).find('.expander').css('opacity', 1.0);
		},
		mouseleave: function () {
			$(this).find('.expander').css('opacity', 0);
		}
	});

	$('.reset.password').on('click', function () {
		$('.login .signin.form, .btn-toolbar.signin, .login .error').hide();
		$('.login .reset.form, .btn-toolbar.reset').show();
		$('.login .reset.form #username').focus();
	});

	var twofactor = $('.twofactor.form');
	twofactor.find('a.disable.twofactor').on('click', function () {
		twofactor.find('div.twofactor.signin').hide();
		twofactor.find('div.twofactor.disable').show();
	});

	function hideResetPassword() {
		$('.login .reset.form, .btn-toolbar.reset, .login .error').hide();
		$('.login .signin.form, .btn-toolbar.signin').show();
		$('.login .signin.form #username').focus();
	}

	var resettoolbar = $('.btn-toolbar.reset');
	resettoolbar.find('.btn.back').on('click', function () {
		hideResetPassword();
	});

	resettoolbar.find('.btn.reset').on('click', function () {
		var reset = $('.reset.form'),
			username = reset.find('#username').val(),
			email = reset.find('#email').val(),
			post = {'Username': username, 'Email': email};

		apiRequest({
			url: apiEndpoint.resetpassword,
			data: post,
			success: function (data) {
				// Reset Password JSON
				hideResetPassword();
			},
			error: function (xhr, ajaxOptions, thrownError) {
				var login = $('.login, .inputs');
				$('.login .signin.form .error .text').text('Incorrect Username or Email');

				login.find('.error').fadeIn();
				login.effect('shake', {times:3, distance: 10}, 150);
			}
		});
	});

	// Initalise Administration
	$(document).on('LiveHelp.LocalSettingsLoaded', function(e) {

		(function initSettings() {

			// Remove jStorage
			if (typeof migrateLocalStorage === 'undefined' && localStorage !== undefined && localStorage.jStorage !== undefined) {
				localStorage.removeItem('jStorage');
			}

			if (!storage.isSet('session')) { storage.set('session', ''); }
			if (!storage.isSet('server')) { storage.set('server', ''); }
			if (!storage.isSet('protocol')) { storage.set('protocol', 'http://'); }
			if (!storage.isSet('locale')) { storage.set('locale', {}); }
			if (!storage.isSet('html5-notifications')) { storage.set('html5-notifications', false); }
			if (!storage.isSet('accounts')) { storage.set('accounts', []); }
			if (!storage.isSet('account')) { storage.set('account', null); }
			if (!storage.isSet('route')) { storage.set('route', 'home'); }
			if (!storage.isSet('history-date')) { storage.set('history-date', ''); }
			if (!storage.isSet('viewed')) { storage.set('viewed', viewed); }

			if (!storage.isSet('startupDate')) { storage.set('startupDate', new Date().getTime()); }
			startupDate = storage.get('startupDate');

			var size = {width: 900, height: 650};
			if (!storage.isSet('size')) { storage.set('size', size); } else { size = storage.get('size'); }
			if (!storage.isSet('position')) { storage.set('position', {top: (window.screen.height - size.height) / 2, left: (window.screen.width - size.width) / 2}); }

			if (!storage.isSet('visitorsColumns')) {
				storage.set('visitorsColumns', visitorsColumns);
			}

			if (!storage.isSet('historyColumns')) {
				storage.set('historyColumns', [
					{id: "history", name: "Chat History", field: "Username", headerCssClass: "username-column-header", width: 550, formatter: renderHistoryCell, sortable: true, resizable: true},
					{id: "date", name: "Date", field: "Date", width: 150, formatter: Slick.Formatters.Date, sortable: true, resizable: true}
				]);
			}

			var language = storage.get('locale');
			if (!$.isEmptyObject(language)) {
				locale = language;

				$(document).trigger('LiveHelp.LocaleUpdated');
			}

		})();

		// Operator
		operator = storage.get('operator');

		$('.operators.list').on('click', '.visitor .status', function() {

			var dropdown = '<ul class="dropdown-menu statusmode"> \
		<li><a href="#" class="Online" data-lang-key="online">Online</a></li> \
		<li><a href="#" class="Offline" data-lang-key="offline">Offline</a></li> \
		<li><a href="#" class="BRB" data-lang-key="brb">Be Right Back</a></li> \
		<li><a href="#" class="Away" data-lang-key="away">Away</a></li>';

			var element = $(this),
				visitor = element.closest('.visitor')
				account = (element.is('.parent')) ? element : visitor.find('.status.parent'),
				id = visitor.data('id');

			if (id === operator.id) {
				dropdown += '	<li class="divider"></li> \
		<li><a href="#" class="Signout" data-lang-key="signout">Sign Out</a></li>';
			}

			dropdown += '</ul>';

			if (!visitor.find('.dropdown-menu').length) {
				$(dropdown).insertAfter(account);
			}
			account.dropdown();

		});

		// Status Mode Menu
		$('.operators.list').on('click', '.dropdown-menu.statusmode li a', function () {
			var element = $(this),
				status = element.attr('class'),
				visitor = element.closest('.visitor'),
				id = visitor.data('id');

			if (id === operator.id) {
				id = undefined;
			}

			if (status !== 'Signout') {
				changeStatus(status, $(this).text(), id);
			} else {
				signOut();
			}

			visitor.find('.status.parent').dropdown();
		});

		// Administration
		initAdmin();

	});

});

var showLogin = function () {
	// Hide Loading
	$('.loading').fadeOut(250, function () {
		$('.loading').hide();
	});

	// Show Login
	$('.login').show().fadeIn();
};

var chattingVisitorClickCallback = function (event, autoOpen, message, trigger) {
	var visitor = (this instanceof jQuery) ? this : $(this),
		id = visitor.data('id'),
		user = visitor.data('user'),
		operator = (visitor.data('operator') !== undefined) ? visitor.data('operator') : false;

	if ((user.Status !== undefined && operator.id !== parseInt(user.ID, 10)) || user.Status === undefined) {
		openChat(id, user, autoOpen, operator, message, trigger);
	}
}

function changeStatus(status, text, id) {
	// Update Status
	updateUsers(status, id, function () {
		refreshAccounts(status);
	});

	var statusmode = false;
	if (text === undefined) {
		switch (status) {
			case 'Hidden':
			case 'Offline':
				text = 'Offline';
				statusmode = 0
				break;
			case 'Online':
				text = 'Online';
				statusmode = 1;
				break;
			case 'BRB':
				text = 'Be Right Back';
				statusmode = 2
				break;
			case 'Away':
				text = 'Away';
				statusmode = 3;
				break;
		}
	}

	if (id === undefined && statusmode !== false) {
		operator.status = statusmode;
	}

	$(document).trigger('LiveHelp.StatusChanged', status);

	$('.operator .dropdown-toggle .status').text(text);
	$('.operator .mode').removeClass('online offline hidden brb away').addClass(status.toLowerCase());

}

function initAdmin() {
	// Hide Loading
	$('.loading').hide();

	// Sign In / Saved Session
	var autoLogin = storage.get('session');
	if (autoLogin !== undefined && autoLogin.length > 0) {
		// Update Session
		session = autoLogin;
		if (autoSignIn) {
			signIn();
			$(document).trigger('LiveHelp.AutoSignIn', true);
		} else {
			$(document).trigger('LiveHelp.AutoSignIn', false);
		}
	} else {

		// Show Login
		showLogin();

		$(document).trigger('LiveHelp.AutoSignIn', false);
	}

	// Metro Pivot
	$('div.metro-pivot').metroPivot({selectedItemChanged: function(index) {
		// Show Charts
		showVisitorChart();
		showChatChart();
	}, controlInitialized: function () {
		// Initialise amCharts
		//loadStatisticsChartData();
	}});

	// Images
	$.preloadImages('images/bubbletip/bubbletip.png');

	// Two Factor Authentication
	$('.twofactor .factor').hover(function () {
		$(this).find('span, img').animate({opacity: 1}, 250);
	}, function () {
		if (!$(this).data('selected')) {
			$(this).find('span').animate({opacity: 0}, 250);
			$(this).find('img').animate({opacity: 0.5}, 250);
		}
	}).click(function () {
		var twofactor = $('.twofactorcode'),
			login = $('.login');

		factor = $(this).data('factor');

		$(this).parent().find('.factor').each(function (key, value) {
			var element = $(value);
			if (element.data('factor') !== factor) {
				element.data('selected', false).find('img').animate({opacity: 0.5}, 250);
				element.find('span').animate({opacity: 0}, 250);
			}
		});

		$(this).data('selected', true).find('span, img').animate({opacity: 1}, 250);
		twofactor.fadeIn();

		if (factor === 'push') {
			twofactor.find('.code').fadeOut(function() {
				twofactor.find('.status span').text('Authenticate to send Duo PUSH request');
				twofactor.find('.status, .status img').fadeIn();
			});
		} else if (factor === 'sms' || factor === 'token') {
			if (factor === 'sms') {
				twofactor.find('.code label').text('SMS Code');
				twofactor.find('.hint-token').hide();
				twofactor.find('.hint-sms').show();
			} else {
				twofactor.find('.code label').text('Token Code');
				twofactor.find('.hint-sms').hide();
				twofactor.find('.hint-token').text('Enter your hardware token code or Duo Mobile code').show();
			}

			twofactor.find('.status').fadeOut(function() {
				twofactor.find('.code').fadeIn(function () {
					$('#twofactor').focus();
				});
			});
		}
		$('#twofactor').focus();
	});

	$('.login input').keypress(function(e){
		if (e.which === 13) {
			signIn();
			e.preventDefault();
		}
	});

	// Sign In
	$('.login .signin.btn').click(function () {
		signIn();
	});

	// Clear
	$('.login .clear').click(function () {
		var inputs = $('.login .inputs');
		inputs.find('.server input, .username input, .password input').val('');
		inputs.find('.server input').focus();
	});

	var account = $('#account-details');

	// Drag / Drop Events
	$(document).bind('dragover', function (e) {
		var targets = $('#account-dropzone, #account-upload'),
			dropZone = $('#account-upload'),
			timeout = window.dropZoneTimeout;

		if (!timeout) {
			dropZone.addClass('in');
		} else {
			clearTimeout(timeout);
		}
		if ($.inArray(e.target, targets) > -1) {
			dropZone.addClass('hover');
		} else {
			dropZone.removeClass('hover');
		}
		window.dropZoneTimeout = setTimeout(function () {
			window.dropZoneTimeout = null;
			dropZone.removeClass('in hover');
		}, 100);
	});

	// Ignore Default Drag / Drop
	function ignoreDrag(e) {
		if (e.preventDefault) {
			e.preventDefault();
		}
		if (e.stopPropagation) {
			e.stopPropagation();
		}
		if (e.dataTransfer !== undefined) {
			var allowed = $('#account-details.add, #account-details.edit').length;
			if (allowed) {
				e.dataTransfer.dropEffect = 'copy';
			} else {
				e.dataTransfer.dropEffect = 'none';
			}
		}
		return false;
	}

	// Drop Event
	$(document).bind('drop', function (e) {
		ignoreDrag(e.originalEvent);

		var allowed = $('#account-details.add, #account-details.edit').length;
		if (allowed) {
			var dt = e.originalEvent.dataTransfer,
				files = dt.files;

			if (dt.files.length > 0) {
				var file = dt.files[0],
					reader = new FileReader();

				reader.onload = function (e) {
					var id = $('#account-details .details #AccountID').val();
					if (id.length > 0) {
						id = parseInt(id, 10);
					} else {
						id = -1;
					}
					updateAccountImage(id, e.target.result, true);
				};
				accountFiles = file;
				reader.readAsDataURL(file);
			}
		}
	});

	// Drag Over Event
	$(document).bind('drop dragover', function (e) {
		ignoreDrag(e.originalEvent);
	});

	// Account Upload
	$('#account-upload').fileupload({
		url: (server.length > 0) ? protocol + server + directoryPath + apiPath + apiEndpoint.operators : directoryPath + apiPath + apiEndpoint.operators,
		headers: {'Authorization': 'Token signature="' + session + '", version="5"', 'Accept': 'application/json'},
		dataType: 'json',
		singleFileUploads: true,
		dropZone: $('#account-dropzone'),
		submit: function (e, data) {
			return false;
		}
	});

	$('.slider.accounts #account-upload input[type=file]').hover(function () {
		$(this).parent().find('.edit').addClass('hover');
	}, function () {
		$(this).parent().find('.edit').removeClass('hover');
	});

	$('#account-upload input[type=file]').on('change', function (e) {
		accountFiles = e.target.files;
		var input = this;
		if (input.files && input.files[0]) {
			var reader = new FileReader();
			reader.onload = function (e) {
				var id = $('#account-details .details #AccountID').val();
				if (id.length > 0) {
					id = parseInt(id, 10);
				} else {
					id = -1;
				}
				updateAccountImage(id, e.target.result, true);
			}
			reader.readAsDataURL(input.files[0]);
		}
	});

	// Account Edit Button
	account.find('.edit-button').click(function () {
		var account = $('#account-details'),
			edit = account.find('.account.button-toolbar.edit'),
			height = account.find('.account.button-toolbar.edit').height();

		edit.hide().css('bottom', -height + 'px');
		account.addClass('edit');
		account.find('.value, .label.devices, .label.twofactor, .value.department .none').hide();
		account.find('.LiveHelpInput, .password').fadeIn();
		account.find('.tagsinput .tag').removeClass('disabled');
		account.find('#AccountDepartment').parent().hide();
		account.find('.tagsinput .tagsinput-add-container').css('display', 'inline-block');
		account.find('.value.department, .tagsinput').show();
		account.find('.account.button-toolbar.save').fadeIn().animate({bottom: '15px'}, 250, 'easeInOutBack');
		account.find('.InputError').removeClass('TickSmall CrossSmall');
	});

	// Departments
	var dialog = account.find('.departments.dialog');

	account.on('click', '.tagsinput-add', function () {
		updateDepartment(false, function () {
			dialog.animate({bottom: 0}, 250, 'easeInOutBack');
		})
	});

	account.on('click', '.tagsinput-remove-link', function () {
		var tag = $(this).parent();
		if (tag.is('.tag:not(.disabled)')) {
			tag.remove();

			var tags = $('#account-details .department.value .tagsinput .tag').map(function() { return $(this).data('department'); }).get();
			if (tags.length > 0) {
				$('#account-details #AccountDepartment').val(tags.join('; '));
			}

		}
	})

	dialog.on('click', '.save-button', function () {
		var status = (dialog.find('#DepartmentPublic').is(':checked')) ? 0 : 1;
		var id = parseInt(dialog.find('#DepartmentID').val(), 10),
			name = dialog.find('#DepartmentName'),
			email = dialog.find('#DepartmentEmail'),
			data = {
				name: name.val(),
				email: email.val(),
				status: status
			};

		// Validation
		if (validateField(name, '#DepartmentNameError') == false || validateEmail(email, '#DepartmentEmailError', true) == false) {
			return;
		}

		if (!isNaN(id)) {
			$.extend(data, {id: id});
		}

		updateDepartment(data, function () {
			closeEditDepartment();
		});
	});

	dialog.on('click', '.delete-button', function () {
		var id = dialog.find('#DepartmentID').val(),
			data = {id: parseInt(id, 10)},
			department = $('.departments.dialog .department.item[data-id=' + id + '] .name').text();

		updateDepartment(data, function () {

			// Update Accounts Grid
			$.each(accounts, function (key, account) {
				var departments = account.Department.split('; ');
				departments = _.reject(departments, function (value) { return $.trim(value) === department });
				account.Department = departments.join('; ');
				accountsGrid.invalidate();
			});

			closeEditDepartment();
		});
	});

	dialog.on('click', '.department .edit.button', function (e) {
		var item = $(this).parent();
		if (item.is('.department.item')) {
			dialog.find('.title').text('Edit Department');
			dialog.find('.description').text('Complete the details below to modify the department.');
			dialog.find('#DepartmentID').val(item.data('id'));
			dialog.find('#DepartmentName').val(item.find('.name').text());
			dialog.find('#DepartmentEmail').val(item.find('.email').text());
			if (item.data('status') == false) {
				dialog.find('#DepartmentPublic').attr('checked', 'checked');
			} else {
				dialog.find('#DepartmentHidden').attr('checked', 'checked');
			}

			dialog.find('.scroll, .add.button').hide();
			dialog.find('.department.edit, .LiveHelpInput').show();
			dialog.find('.button-toolbar.departments').removeClass('add save').addClass('edit');
			dialog.find('.save.button, .delete.button, .cancel.button').css({'display': 'inline-block', 'position': 'relative'});
			dialog.show().animate({height: dialog.height() - 100}, 250, 'easeInOutBack');
		}
		e.stopPropagation();
	});

	dialog.on('click', '.add-button', function () {
		dialog.find('.title').text('Add Department');
		dialog.find('.description').text('Complete the details below to add a new department.');
		dialog.find('#DepartmentID').val('');
		dialog.find('#DepartmentName').val('');
		dialog.find('#DepartmentEmail').val('');
		dialog.find('#DepartmentPublic').attr('checked', 'checked');

		dialog.find('.scroll, .add.button, .delete.button').hide();
		dialog.find('.department.edit, .LiveHelpInput').show();
		dialog.find('.button-toolbar.departments').removeClass('save edit').addClass('add');
		dialog.find('.save.button').css('display', 'inline-block');
		dialog.show().animate({height: dialog.height() - 100}, 250, 'easeInOutBack');
	});

	dialog.on('click', '.department.item', function () {
		var department = $(this).find('.name').text(),
			existingtags = $('#account-details .department.value .tagsinput'),
			tags = existingtags.find('.tagsinput-add-container');

		if (existingtags.find('.tag[data-department="' + department + '"]').length === 0) {
			$('<span class="tag" data-department="' + department + '"><span>' + department + '</span><a class="tagsinput-remove-link"></a></span>').insertBefore(tags);
		}

		var tags = existingtags.find('.tag').map(function() { return $(this).data('department'); }).get();
		if (tags.length > 0) {
			$('#account-details #AccountDepartment').val(tags.join('; '));
		}

		dialog.show().animate({bottom: -dialog.height()}, 250, 'easeInOutBack');
	});

	function closeEditDepartment() {
		dialog.find('.title').text('Select a department');
		dialog.find('.description').text('Select a department to assign the department to the current operator.');

		if (dialog.find('.edit.department.form').is(':visible')) {
			dialog.find('.department.edit, .save.button, .delete.button').hide();
			dialog.find('.scroll').show();
			dialog.find('.button-toolbar.departments').removeClass('save edit').addClass('add');
			dialog.find('.add.button').css('display', 'inline-block');
			dialog.animate({height: dialog.height() + 100}, 250, 'easeInOutBack');
		} else {
			dialog.show().animate({bottom: -dialog.height()}, 250, 'easeInOutBack');
		}
	}

	// Departments Dialog Cancel
	dialog.on('click', '.cancel-button', function () {
		closeEditDepartment();
	});

	// Account Cancel Button
	account.find('.edit.account.button-toolbar .cancel-button.account, .save.account.button-toolbar .cancel-button.account').click(closeAccountDetails);

	// Account Add Button
	account.find('.add-button.account').click(function () {
		showAddAccount();
	});

	// Account Save Button
	account.find('.save-button.account').click(function () {
		var header = $('#account-details .header').text();
		if (header === 'Add Account') {
			addAccount();
		} else {
			saveAccount();
		}
	});

	// Validate Required Fields
	account.find('input, select, .password').filter(':not(#AccountUsername, #AccountEmail, #ConfirmPassword)').on('keydown keyup change blur', function () {
		var id = $(this).attr('id');
		validateField($(this), '#' + id + 'Error');
	});

	// Validate Username
	account.find('#AccountUsername').on('keydown keyup change blur', function () {
		var id = $(this).attr('id');
		validateUsername($(this), '#' + id + 'Error');
	});

	// Validate Email
	account.find('#AccountEmail').on('keydown keyup change blur', function () {
		var id = $(this).attr('id');
		validateEmail($(this), '#' + id + 'Error', false);
	});

	// Validate Password
	account.find('#AccountPasswordConfirm').on('keydown keyup change blur', function () {
		var id = $(this).attr('id');
		validatePassword($(this), $('#AccountPassword').val(), '#' + id + 'Error');
	});

	// Account Delete Button
	var confirm = account.find('.confirm-delete.dialog');
	account.find('.button-toolbar.account .delete-button').click(function () {
		deleteAccountClickedCallback();
	});

	// Confirm Delete Account Button
	confirm.find('.delete').click(function () {
		deleteAccountConfirmClickedCallback();
	});

	// Confirm Cancel Button
	confirm.find('.cancel').click(function () {
		confirm.animate({bottom: '-90px'}, 250, 'easeInOutBack');
	});

	function closeDropdown() {
		$('.operator .dropdown-toggle').dropdown('toggle');
	}

	// Status Mode Menu
	$('.operator').on('click', '.dropdown-menu.statusmode li a', function () {
		var status = $(this).attr('class');
		if (status === 'Accounts') {
			switchMenu('accounts');
		} else if (status === 'History') {
			switchMenu('history');
		} else if (status === 'Responses') {
			switchMenu('responses');
		} else if (status === 'Settings') {
			switchMenu('settings');
			return false;
		} else if (status === 'Integrations') {
			closeDropdown();
			switchMenu('integrations');
			return false;
		} else if (status === 'Billing') {
			$(document).trigger('LiveHelp.OpenBilling');
			closeDropdown();
			return false;
		} else if (status === 'Signout') {
			signOut();
		} else {
			changeStatus(status, $(this).text());
		}
	});

	// Accept Pending Chat
	$('#pending').on('click', '.visitor', $(this), function(e){
		var chat = ($(e.target).is('.visitor')) ? $(e.target) : $(e.target).parent(),
			id = chat.data('id');

		acceptChat(id);
		closeNotification();
	});

	// Pending / Chatting Click Events
	$(document).on('click', '.chatting .visitor, .other-chatting .visitor, .operators .visitor', chattingVisitorClickCallback);

	// Chat Close Event
	$('.chat-stack').on('click', '.chat .inputs > .close', function() {
		// Close Chat
		closeChats();

		// Close Chat Responses
		if (chatResponsesOpen) {
			closeResponses();
			chatResponsesOpen = false;
		}
	});

	// Resize Grids
	$(window).resize(function () {
		if (historyGrid) {
			historyGrid.resizeCanvas();
		}
		if (accountsGrid !== undefined) {
			accountsGrid.resizeCanvas();
		}
		if (visitorsGrid !== undefined) {
			visitorsGrid.resizeCanvas();
		}

		if (visitorChart === undefined && chatChart === undefined) {
			showVisitorChart();
			showChatChart();
		}

	});

	// Pre-typed Response
	$('#responses').on('click', '.response', function (e) {
		if (activechats.length > 0) {
			var id = $(e.target).closest('.response').data('id'),
				types = ['Text', 'Hyperlink', 'Image', 'PUSH', 'JavaScript'],
				response,
				type;

			$.each(responses, function(sectiontype, section) {
				if ($.inArray(sectiontype, types) > -1) {
					$.each(section, function(key, value) {
						if (id === parseInt(value.ID, 10)) {
							response = value;
							type = sectiontype;
							return;
						}
					});
				}
			});

			if (response !== undefined) {
				var message = $('.chat-stack #message'),
					content = response.Content;

				if (type === 'Hyperlink' || type === 'PUSH') {
					content = response.Name + ' - ' + response.Content;
				}
				message.val(content).keyup();
			}
		}
	});

	// Responses Send Button
	$('#responses').on('click', '.response .send .menu-item', function () {
		var chat = $(this).data('id'),
			menu = $(this).closest('.response'),
			id = menu.data('id'),
			types = ['Text', 'Hyperlink', 'Image', 'PUSH', 'JavaScript'],
			response,
			type;

		$.each(responses, function(sectiontype, section) {
			if ($.inArray(sectiontype, types) > -1) {
				$.each(section, function(key, value) {
					if (id === parseInt(value.ID, 10)) {
						response = value;
						type = sectiontype;
						return;
					}
				});
			}
		});

		menu.find('.dropdown-toggle').dropdown('toggle');

		return sendResponse(chat, type, response);

	});
}

function sendResponse(id, type, response) {
	if (id > 0) {
		if (type === 'Text') {
			sendMessage(response.Content, id);
			return false;
		} else {
			sendCommand(id, type.toUpperCase(), response.Name, response.Content);
			return false;
		}
	}
	return false;
}

var acceptChatStyles = {'background': '#e2e2e2'}

function clearNotification(id) {
	var remove = -1;
	$.each(notifications, function (key, value) {
		if (id === value.id) {
			remove = key;
			if (value.notification.cancel) { value.notification.cancel(); }
			if (value.notification.close) { value.notification.close(); }
			return false;
		}
	});

	if (typeof notifications[remove] !== 'undefined') {
		notifications.splice(remove, 1);
	}
}

function acceptChat(id, event, complete) {
	var chat = $('.pending .visitor[data-id=' + id + ']'),
		data = { visitor: id };

	if (chat && chat.length > 0) {
		var name = chat.find('.details.name'),
			id = (typeof chat.data('id') === 'number') ? parseInt(chat.data('id'), 10) : chat.data('id'),
			user = name.text();

		// Data
		data = {id: id, name: name};

		// Clear Notification
		clearNotification(id);

		chat.css(acceptChatStyles);
		chat.find('.image').addClass('hover');
		name.text('Accepting Chat');
		chat.find('.details.department').text('with ' + user);
		chat.find('.image').css({'background': 'url(images/ProgressRing.gif) no-repeat', 'opacity': 0.5, 'border': 'none', 'box-shadow': 'none'});
		chat.find('.details.accesslevel').html('&nbsp;');
		chat.delay(3000).fadeOut(function () {
			$(this).remove();
		});

		if ((typeof id === 'number' && id > 0) || (typeof id === 'string' && id.length == 36)) {
			updateUsers('Accept', id, function () {
				if (typeof complete === 'function') {
					complete();
				}
				$('.chatting, .other-chatting, .operators').find('.visitor[data-id!=' + id + ']').removeClass('selected previous');
				$('.chatting, .other-chatting').find('.visitor[data-id=' + id + ']').addClass('selected');
			});
		}

	}

	if (event === undefined) {
		$(document).trigger('LiveHelp.AcceptChat', data);
	}
}

var visitorChart,
	visitorChartData = [],
	visitorChartCursor,
	visitorChartEmpty = false;

// Visitor Chat
function showVisitorChart() {

	if ($('.metro-pivot').is(':visible')) {

		// Validate Chart Data
		var opacity = 1.0,
			color = opts.visitorChartColor,
			bulletBorderColor = opts.visitorChartBulletBorderColor,
			fillColors = opts.visitorChartFillColors,
			lineColor = opts.visitorChartLineColor;

		if (visitorChartData.length === 0) {
			for (var i = 30; i > 0; i--) {
				var date = new Date(),
					chats = Math.floor(Math.random() * (80 - 30 + 1)) + 30,
					visits = Math.floor(Math.random() * (250 - 120 + 1)) + 120;

				date.setDate(date.getDate() - i);
				visitorChartData.push({
					date: date,
					chats: chats,
					visits: visits
				});
			}
			visitorChartEmpty = true;
		}

		if (visitorChartEmpty) {
			color = '#cccccc';
			bulletBorderColor = color;
			fillColors = color;
			lineColor = color;
			opacity = 0.5;
		}

		// Opacity
		$('#visitor-chart').parent().css('opacity', opacity);

		// Serial Chart
		visitorChart = new AmCharts.AmSerialChart();
		//visitorChart.pathToImages = '../amcharts/images/';
		visitorChart.dataProvider = visitorChartData;
		visitorChart.categoryField = 'date';
		visitorChart.balloon.bulletSize = 5;

		// Chart Events
		visitorChart.addListener('dataUpdated', visitorChartDataUpdated);

		// Catgory Axis
		var categoryAxis = visitorChart.categoryAxis;
		categoryAxis.parseDates = true; // as our data is date-based, we set parseDates to true
		categoryAxis.minPeriod = 'DD'; // our data is daily, so we set minPeriod to DD
		categoryAxis.axisAlpha = 0;
		categoryAxis.dashLength = 1;
		categoryAxis.boldPeriodBeginning = false;
		categoryAxis.position = 'bottom';
		categoryAxis.axisColor = '#dadada';

		// Balloon
		var balloon = visitorChart.balloon;
		balloon.adjustBorderColor = true;
		balloon.color = color; //'#000000';
		balloon.cornerRadius = 5;
		balloon.borderAlpha = 1;
		balloon.borderColor = color; //'#000000';
		balloon.borderThickness = 1;
		balloon.fillColor = color; //'#000000';
		balloon.fillAlpha = 0.8;
		balloon.color = '#f3f3f3'; //'#ffffff';
		balloon.showBullet = true;
		balloon.fontSize = opts.visitorChartBalloonFontSize;
		balloon.textShadowColor = '#666';

		// Value Axis
		var valueAxis = new AmCharts.ValueAxis();
		valueAxis.axisAlpha = 0;
		valueAxis.dashLength = 1;
		valueAxis.minimum = 0;
		visitorChart.addValueAxis(valueAxis);

		// Graph
		var graph = new AmCharts.AmGraph();
		graph.type = 'line';
		graph.valueField = 'visits';
		graph.bullet = 'round';
		graph.bulletColor = '#ffffff';
		graph.bulletBorderColor = bulletBorderColor;
		graph.bulletBorderThickness = 2;
		graph.bulletSize = 6;
		graph.fillColors = fillColors;
		graph.fillAlphas = 0.2;
		graph.lineThickness = 2;
		graph.lineColor = lineColor;
		graph.balloonText = '[[category]]: [[value]] visitors';
		visitorChart.addGraph(graph);

		var columnGraph = new AmCharts.AmGraph();
		columnGraph.type = 'column';
		columnGraph.valueField = 'chats';
		//columnGraph.lineAlpha = 0;
		columnGraph.fillColors = color;
		//columnGraph.fillAlphas = 1;
		columnGraph.fillAlphas = opts.visitorChartFillAlphas;
		columnGraph.lineColor = color;
		columnGraph.lineThickness = 1;
		columnGraph.balloonText = '[[value]] chats';
		columnGraph.startDuration = 1;
		visitorChart.addGraph(columnGraph);

		// Cursor
		visitorChartCursor = new AmCharts.ChartCursor();
		visitorChartCursor.cursorPosition = 'mouse';
		visitorChartCursor.pan = false;
		visitorChartCursor.zoomable = false;
		visitorChartCursor.categoryBalloonEnabled = false;
		visitorChartCursor.cursorAlpha = 0;
		visitorChartCursor.categoryBalloonDateFormat = 'EEE DD MMM YYYY';

		visitorChart.addChartCursor(visitorChartCursor);
		visitorChart.fontFamily = 'Segoe UI';
		visitorChart.fontSize = 14;
		visitorChart.color = '#666';

		// Output Chart
		visitorChart.write('visitor-chart');

		// Chart Empty
		if (visitorChartEmpty === true) {
			$('#visitor-empty').fadeIn();
		}
	}
}

var weekdayChart,
	weekdayChartData = [],
	weekdayChartCursor,
	weekdayChartEmpty = false;

function showWeekdayChart() {

	if ($('#weekday-chart').length) {

		var balloonColor = opts.weekdayBalloonColor,
			balloonBorderColor = opts.weekdayBalloonBorderColor,
			balloonFillColor = opts.weekdayBalloonFillColor,
			balloonFontSize = opts.weekdayBalloonFontSize,
			graphFillColor = opts.weekdayGraphFillColor,
			graphColorField = opts.weekdayGraphColorField,
			graphFillAlphas = opts.weekdayGraphFillAlphas,
			graphLineColor = opts.weekdayGraphLineColor,
			graphLineColorField = opts.weekdayGraphLineColorField;

		// Validate Chart Data
		var opacity = 1.0;

		// Sample Weekday Chart Data
		if (weekdayChartData.length === 0) {
			weekdayChartData = [
				{"Day":"Sun","Total":3,"Average":1.5},
				{"Day":"Mon","Total":4,"Average":2},
				{"Day":"Tue","Total":1,"Average":1},
				{"Day":"Wed","Total":5,"Average":2.5},
				{"Day":"Thu","Total":3,"Average":3},
				{"Day":"Fri","Total":5,"Average":1.7},
				{"Day":"Sat","Total":0,"Average":1.5}
			];

			weekdayChartEmpty = true;
		} else {
			var data = [],
				colors = ['#655499', '#6093BF', '#68D4D4', '#56BF95', '#17996B', '#655499', '#6093BF'];

			$.each(weekdayChartData, function (key, value) {
				value = $.extend(value, {'Color': colors[key]});
				data.push(value);
			});
			weekdayChartData = data;
		}

		if (weekdayChartEmpty) {
			color = '#cccccc';
			opacity = 0.4;
		}

		// Opacity
		$('#weekday-chart').css('opacity', opacity);

		// Serial Chart
		weekdayChart = new AmCharts.AmSerialChart();
		//weekdayChart.pathToImages = '../amcharts/images/';
		weekdayChart.dataProvider = weekdayChartData;
		weekdayChart.categoryField = 'Day';
		weekdayChart.balloon.bulletSize = 5;
		weekdayChart.startDuration = 1;

		// Chart Events
		//weekdayChart.addListener('dataUpdated', weekdayChartDataUpdated);

		// Catgory Axis
		var categoryAxis = weekdayChart.categoryAxis;
		categoryAxis.parseDates = false;
		categoryAxis.minPeriod = 'DD';
		categoryAxis.axisAlpha = 0;
		categoryAxis.dashLength = 1;
		categoryAxis.boldPeriodBeginning = false;
		categoryAxis.position = 'bottom';
		categoryAxis.axisColor = '#dadada';

		// Balloon
		var balloon = weekdayChart.balloon;
		balloon.adjustBorderColor = true;
		balloon.color = balloonColor;
		balloon.cornerRadius = 5;
		balloon.borderAlpha = 1;
		balloon.borderColor = balloonBorderColor;
		balloon.borderThickness = 1;
		balloon.fillColor = balloonFillColor;
		balloon.fillAlpha = 0.8;
		balloon.color = '#f3f3f3';
		balloon.showBullet = true;
		balloon.bulletSize = 4;
		balloon.fontSize = balloonFontSize;
		balloon.textShadowColor = '#666';

		// Value Axis
		var valueAxis = new AmCharts.ValueAxis();
		valueAxis.axisAlpha = 0;
		valueAxis.dashLength = 1;
		valueAxis.minimum = 0;
		weekdayChart.addValueAxis(valueAxis);

		// Graph
		var graph = new AmCharts.AmGraph();
		graph.type = 'column';
		graph.valueField = 'Average';
		graph.bulletSize = 0;

		if (graphFillColor) {
			graph.fillColors = graphFillColor;
		}

		if (graphColorField) {
			graph.colorField = graphColorField;
		}

		graph.fillAlphas = graphFillAlphas;
		graph.lineThickness = 1;

		if (graphLineColor) {
			graph.lineColor = graphLineColor;
		}

		if (graphLineColorField) {
			graph.lineColorField = graphLineColorField;
		}

		graph.balloonText = '[[category]]: [[value]] chats (average)';
		weekdayChart.addGraph(graph);

		// Cursor
		weekdayChartCursor = new AmCharts.ChartCursor();
		weekdayChartCursor.cursorPosition = 'mouse';
		weekdayChartCursor.pan = false;
		weekdayChartCursor.zoomable = false;
		weekdayChartCursor.categoryBalloonEnabled = false;
		weekdayChartCursor.cursorAlpha = 0;
		weekdayChartCursor.categoryBalloonDateFormat = 'EEE DD MMM YYYY';

		weekdayChart.addChartCursor(weekdayChartCursor);
		weekdayChart.fontFamily = 'Segoe UI';
		weekdayChart.fontSize = 14;
		weekdayChart.color = '#666';

		// Output Chart
		weekdayChart.write('weekday-chart');

		// Chats Empty
		if (weekdayChartEmpty === true) {
			$('#weekday-empty').fadeIn();
		}
	}
}


var chatChart,
	chatChartData = [],
	chatChartCursor,
	chatChartEmpty = false;

// Chat Chat
function showChatChart() {

	if ($('.metro-pivot').is(':visible')) {

		var color = opts.chatChartColor,
			balloonFontSize = opts.chatBalloonFontSize,
			fillAlphas = opts.chatGraphFillAlphas,
			empty = $('#chat-empty'),
			opacity = 1.0;

		// Validate Chart Data
		if (chatChartData.length === 0) {
			for (var i = 30; i > 0; i--) {
				var date = new Date(),
					chats = Math.floor(Math.random() * (80 - 30 + 1)) + 30;

				date.setDate(date.getDate() - i);
				chatChartData.push({
					date: date,
					chats: chats
				});
			}
			chatChartEmpty = true;
		} else {
			empty.hide();
		}

		if (chatChartEmpty) {
			color = '#cccccc';
			opacity = 0.4;
		}

		// Opacity
		$('#chat-chart').css('opacity', opacity);

		// Serial Chart
		chatChart = new AmCharts.AmSerialChart();
		//chatChart.pathToImages = '../amcharts/images/';
		chatChart.dataProvider = chatChartData;
		chatChart.categoryField = 'date';
		chatChart.balloon.bulletSize = 5;
		chatChart.startDuration = 1;

		// Chart Events
		chatChart.addListener('dataUpdated', chatChartDataUpdated);

		// Catgory Axis
		var categoryAxis = chatChart.categoryAxis;
		categoryAxis.parseDates = true;
		categoryAxis.minPeriod = 'DD';
		categoryAxis.axisAlpha = 0;
		categoryAxis.dashLength = 1;
		categoryAxis.boldPeriodBeginning = false;
		categoryAxis.position = 'bottom';
		categoryAxis.axisColor = '#dadada';

		// Balloon
		var balloon = chatChart.balloon;
		balloon.adjustBorderColor = true;
		balloon.color = color;
		balloon.cornerRadius = 5;
		balloon.borderAlpha = 1;
		balloon.borderColor = color;
		balloon.borderThickness = 1;
		balloon.fillColor = color;
		balloon.fillAlpha = 0.8;
		balloon.color = '#f3f3f3';
		balloon.showBullet = true;
		balloon.bulletSize = 4;
		balloon.fontSize = balloonFontSize;
		balloon.textShadowColor = '#666';

		// Value Axis
		var valueAxis = new AmCharts.ValueAxis();
		valueAxis.axisAlpha = 0;
		valueAxis.dashLength = 1;
		valueAxis.minimum = 0;
		chatChart.addValueAxis(valueAxis);

		// Graph
		var graph = new AmCharts.AmGraph();
		graph.type = 'column';
		graph.valueField = 'chats';
		graph.bulletSize = 0;
		graph.fillColors = color;
		graph.fillAlphas = fillAlphas;
		graph.lineThickness = 1;
		graph.lineColor = color;
		graph.balloonText = '[[category]]: [[value]] chats';
		chatChart.addGraph(graph);

		// Cursor
		chatChartCursor = new AmCharts.ChartCursor();
		chatChartCursor.cursorPosition = 'mouse';
		chatChartCursor.pan = false;
		chatChartCursor.zoomable = false;
		chatChartCursor.categoryBalloonEnabled = false;
		chatChartCursor.cursorAlpha = 0;
		chatChartCursor.categoryBalloonDateFormat = 'EEE DD MMM YYYY';

		chatChart.addChartCursor(chatChartCursor);
		chatChart.fontFamily = 'Segoe UI';
		chatChart.fontSize = 14;
		chatChart.color = '#666';

		// Output Chart
		chatChart.write('chat-chart');

		// Chats Empty
		if (chatChartEmpty === true) {
			empty.fadeIn();
		}
	}
}

function pad(value) {
	return value < 10 ? '0' + value : value;
}

function getUTCOffset() {
	var date = new Date();
	var sign = (date.getTimezoneOffset() > 0) ? '-' : '+';
	var offset = Math.abs(date.getTimezoneOffset());
	var hours = pad(Math.floor(offset / 60));
	var minutes = pad(offset % 60);
	return sign + hours + minutes;
}

// Visitor Chart Data
function loadStatisticsChartData() {

	if (session.length > 0) {

		// Web Service / Data
		var post = {'Timezone': getUTCOffset()};

		// Statistics AJAX / Charts
		apiRequest({
			url: apiEndpoint.statistics,
			data: post,
			success: function (data) {
				// Statistics JSON
				if (data.Statistics !== null && data.Statistics !== undefined) {
					var i = 0,
						chats = data.Statistics.Chats,
						visitors = data.Statistics.Visitors,
						duration = data.Statistics.Duration,
						rating = data.Statistics.Rating,
						firstDate,
						newDate;

					// Visitors
					if (visitors !== null && visitors !== undefined) {

						firstDate = new moment(visitors.Date).add('d', 1).toDate();

						if (visitors !== null && chats !== null) {

							if (chats.Data === undefined) {
								chats.Data = new Array(30 + 1).join('0').split('').map(parseFloat);
							}

							visitors.Data = visitors.Data.reverse();
							visitorChartData = [];
							for (i = 0; i < 30; i++) {
								visitorChartData.push({
									date: new moment(firstDate).add('day', i).toDate(),
									chats: chats.Data[i],
									visits: visitors.Data[i]
								});
								visitorChartEmpty = false;
							}
						}
					}
					showVisitorChart();

					// Chats
					if (chats !== null && chats !== undefined && chats.Data !== undefined) {
						var alpha = 0.5;
						firstDate = new moment(chats.Date).add('day', 1).toDate();
						historyChartData = [];
						chatChartData = [];
						for (i = 0; i < 30; i++) {
							if (i > 23) {
								historyChartData.push({
									date: new moment(firstDate).add('day', i).toDate(),
									chats: chats.Data[i]
								});
							}

							if (i > 28) {
								color = '#00637d';
								alpha = 0.8;
							} else {
								color = opts.statisticsChartColor;
								alpha = 0.5;
							}

							chatChartData.push({
								date: new moment(firstDate).add('day', i).toDate(),
								color: color,
								alpha: alpha,
								chats: chats.Data[i]
							});
							chatChartEmpty = false;
						}

						// Weekday Chart
						weekdayChartData = chats.Weekday;

					}

					showChatChart();
					showHistoryChart();
					showWeekdayChart();

					// Duration
					var total = 0,
						statistics = $('.statistics.container');

					if (duration !== null && duration !== undefined && duration.Data !== undefined) {
						$.each(duration.Data, function(key, time) {
							total += time;
						});

						var time = parseInt(total / duration.Data.length, 10);
						var hours = Math.floor(time / 3600);
						var minutes = Math.floor((time - (hours * 3600)) / 60);
						var seconds = time - (hours * 3600) - (minutes * 60) + ' seconds';

						hours = (hours > 0) ? hours + ' hours ' : '';
						minutes = minutes + ' minutes ';

						time = hours + minutes + seconds;
						statistics.find('.averagechattime').text(time);

					} else {
						statistics.find('.averagechattime').text(locale.unavailable);
					}

					// Rating
					total = 0;
					if (rating !== null && rating !== undefined) {
						ratingChartData = [
							{rating: 'Excellent', total: parseInt(rating.Excellent, 10)},
							{rating: 'Very Good', total: parseInt(rating.VeryGood, 10)},
							{rating: 'Good', total: parseInt(rating.Good, 10)},
							{rating: 'Poor', total: parseInt(rating.Poor, 10)},
							{rating: 'Very Poor', total: parseInt(rating.VeryPoor, 10)},
							{rating: 'Unrated', total: parseInt(rating.Unrated, 10)}
						];
						ratingChartEmpty = false;

						var average = 0;
						rating = 5;
						$.each(ratingChartData, function(key, value) {
							if (value.total > 0 && key < 5) {
								total += value.total;
								average += (rating - key) * value.total;
								rating--;
							}
						});
						if (total > 0) {
							average = (average / total).toFixed(2);
							rating = ratingChartData[5 - parseInt(average, 10)].rating;
							statistics.find('.averagechatrating').text(average + ' ' + rating);
						} else {
							statistics.find('.averagechatrating').text(locale.unavailable);
						}
					} else {
						statistics.find('.averagechatrating').text(locale.unavailable);
					}
					showRatingChart();
				}
			}
		});
	}
}

// Visitor Data Updated Event
function visitorChartDataUpdated() {
	if (!visitorChartEmpty) {
		$('#visitor-chart').fadeTo(1000, 1.0);
	}
}

// Chat Data Updated Event
function chatChartDataUpdated() {
	if (!chatChartEmpty) {
		$('#chat-chart').fadeTo(1000, 1.0);
	}
}

// Rating Chart
var ratingChart,
	ratingChartData = [],
	ratingChartCursor,
	ratingChartEmpty = false;

function showRatingChart() {

	if ($('#rating-chart').length) {

		// Validate Chart Data
		var empty = false,
			colors = opts.ratingChartColors,
			opacity = 0.8,
			background = opts.ratingChartBackground;

		if (ratingChartData.length === 0) {
			ratingChartData = [{rating: 'Excellent', total: 20}, {rating: 'Very Good', total: 18}, {rating: 'Good', total: 10}, {rating: 'Poor', total: 4}, {rating: 'Very Poor', total: 2}, {rating: 'Unrated', total: 8}];
			ratingChartEmpty = true;
		}

		// Empty
		if (ratingChartEmpty) {
			colors = ['#2F3540', '#666A73', '#F2EDE4', '#D9D1C7', '#8C8681', '#333333'];
			opacity = 0.1;
			background = '#CCC';
		}

		// Update Histogram
		var histogram = $('.rating.histogram'),
			total = 0,
			step = 0,
			selectors = ['.excellent', '.verygood', '.good', '.poor', '.verypoor', '.unrated'];

		$.each(ratingChartData, function(key, value) {
			total += parseInt(value.total, 10);
		});
		step = 250 / total;
		$.each(selectors, function(key, value) {
			histogram.find(value).css({background: background}).animate({'width': ratingChartData[key].total * step}, 1000, 'easeInOutBack');
		});

		ratingChart = new AmCharts.AmPieChart();
		ratingChart.dataProvider = ratingChartData;
		ratingChart.titleField = 'rating';
		ratingChart.valueField = 'total';
		ratingChart.outlineColor = '#eeedee';
		ratingChart.outlineAlpha = 1.0;
		ratingChart.outlineThickness = 2;
		ratingChart.radius = '30%';
		ratingChart.colors = colors;
		ratingChart.pieAlpha = opacity;
		ratingChart.pullOutOnlyOne = true;

		// Balloon
		var balloon = ratingChart.balloon;
		balloon.adjustBorderColor = true;
		balloon.cornerRadius = 5;
		balloon.borderAlpha = 1;
		balloon.borderColor = opts.ratingBalloonBorderColor;
		balloon.borderThickness = 1;
		balloon.fillColor = '[[color]]';
		balloon.fillAlpha = opacity;
		balloon.color = '#f3f3f3';
		balloon.showBullet = true;
		balloon.fontSize = opts.ratingBalloonFontSize;
		balloon.textShadowColor = '#666';

		// Output Chart
		ratingChart.write('rating-chart');

		// Rating Empty
		if (ratingChartEmpty) {
			$('#rating-empty').fadeIn();
		}
	}
}

// History Chart
var historyChart,
	historyChartData = [],
	historyChartCursor;

function showHistoryChart() {

	if ($('#history-chart').length) {

		// Validate Chart Data
		var empty = false;
		if (historyChartData.length === 0) {
			for (var i = 7; i > 0; i--) {
				var date = new Date(),
					chats = Math.floor(Math.random() * (20 - 5 + 1)) + 5;

				date.setDate(date.getDate() - i);
				historyChartData.push({
					date: date,
					chats: chats
				});
			}
			empty = true;
		}

		// Serial Chart
		historyChart = new AmCharts.AmSerialChart();
		//historyChart.pathToImages = '../amcharts/images/';
		historyChart.dataProvider = historyChartData;
		historyChart.categoryField = 'date';
		historyChart.balloon.bulletSize = 5;

		// Chart Events
		historyChart.addListener('dataUpdated', historyChartDataUpdated);

		// Catgory Axis
		var categoryAxis = historyChart.categoryAxis;
		categoryAxis.parseDates = true;
		categoryAxis.minPeriod = 'DD';
		categoryAxis.axisAlpha = 0;
		categoryAxis.dashLength = 0;
		categoryAxis.boldPeriodBeginning = false;
		categoryAxis.position = 'top';
		categoryAxis.axisColor = '#dadada';
		categoryAxis.labelsEnabled = false;
		categoryAxis.gridAlpha = 0;

		// Balloon
		var balloon = historyChart.balloon;
		balloon.adjustBorderColor = true;
		balloon.color = '#999999';
		balloon.cornerRadius = 5;
		balloon.borderAlpha = 1;
		balloon.borderColor = '#999999';
		balloon.borderThickness = 1;
		balloon.fillColor = '#999999';
		balloon.fillAlpha = 0.8;
		balloon.color = '#f3f3f3';
		balloon.showBullet = true;
		balloon.fontSize = opts.historyBalloonFontSize;
		balloon.textShadowColor = '#666';

		// Value Axis
		var valueAxis = new AmCharts.ValueAxis();
		valueAxis.axisAlpha = 0;
		valueAxis.dashLength = 0;
		valueAxis.labelsEnabled = false;
		valueAxis.minimum = 0;
		valueAxis.gridAlpha = 0.1;
		historyChart.addValueAxis(valueAxis);

		// Graph
		var graph = new AmCharts.AmGraph();
		graph.type = 'line';
		graph.valueField = 'chats';
		graph.bullet = 'round';
		graph.bulletColor = '#ffffff';
		graph.bulletBorderColor = '#999999';
		graph.bulletBorderThickness = 2;
		graph.bulletSize = 6;
		graph.fillColors = '#999999';
		graph.fillAlphas = 0.2;
		graph.lineThickness = 2;
		graph.lineColor = '#999999';
		graph.balloonText = '[[category]]: [[value]] chats';
		historyChart.addGraph(graph);

		// Cursor
		historyChartCursor = new AmCharts.ChartCursor();
		historyChartCursor.cursorPosition = 'mouse';
		historyChartCursor.pan = false;
		historyChartCursor.zoomable = false;
		historyChartCursor.categoryBalloonEnabled = false;
		historyChartCursor.cursorAlpha = 0;
		historyChartCursor.categoryBalloonDateFormat = 'EEE DD MMM YYYY';

		historyChart.addChartCursor(historyChartCursor);
		historyChart.fontFamily = 'Segoe UI';
		historyChart.fontSize = 14;
		historyChart.color = '#666';

		// Output Chart
		historyChart.write('history-chart');

		// History Empty
		if (empty) {
			$('#history-empty').fadeIn();
		}

	}

}

// History Data Updated Event
function historyChartDataUpdated() {
	$('#history-chart').fadeTo(1000, 1.0);
}

function ucwords(str) {
	return (str + '').replace(/^([a-z])|\s+([a-z])/g, function ($1) {
		return $1.toUpperCase();
	});
}

function strtolower(str) {
	return (str + '').toLowerCase();
}

function htmlSmilies(message) {
	var smilies = [
			{ regex: /^:D$|^:D | :D | :D$/g, css: 'Laugh Small' },
			{ regex: /^:\)$|^:\) | :\) | :\)$/g, css: 'Smile Small' },
			{ regex: /^:\($|^:\( | :\( | :\($/g, css: 'Sad Small' },
			{ regex: /^\$\)$|^\$\) | \$\) | \$\)$/g, css: 'Money Small' },
			{ regex: /^&gt;:O$|^&gt;:O |^>:O | &gt;:O | >:O | &gt;:O$| >:O$/g, css: 'Angry Small' },
			{ regex: /^:P$|^:P | :P | :P$/g, css: 'Impish Small' },
			{ regex: /^:\\$|^:\\ | :\\ | :\\$/g, css: 'Sweat Small' },
			{ regex: /^8\)$|^8\) | 8\) | 8\)$/g, css: 'Cool Small' },
			{ regex: /^&gt;:L$|^&gt;:L |^>:L | &gt;:L | >:L | &gt;:L$| >:L$/g, css: 'Frown Small' },
			{ regex: /^;\)$|^;\) | ;\) | ;\)$/g, css: 'Wink Small' },
			{ regex: /^:O$|^:O | :O | :O$/g, css: 'Surprise Small' },
			{ regex: /^8-\)$|^8-\) | 8-\) | 8-\)$/g, css: 'Woo Small' },
			{ regex: /^8-O$|^8-O | 8-O | 8-O$/g, css: 'Shock Small' },
			{ regex: /^xD$|^xD | xD | xD$/g, css: 'Hysterical Small' },
			{ regex: /^:-\*$|^:-\* | :-\* | :-\*$/g, css: 'Kissed Small' },
			{ regex: /^:S$|^:S | :S | :S$/g, css: 'Dizzy Small' },
			{ regex: /^\+O\)$|^\+O\) | \+O\) | \+O\)$/g, css: 'Celebrate Small' },
			{ regex: /^&lt;3$|^<3$|^&lt;3|^<3 | &lt;3|<3 | &lt;3$| <3$/g, css: 'Adore Small' },
			{ regex: /^zzZ$|^zzZ | zzZ | zzZ$/g, css: 'Sleep Small' },
			{ regex: /^:X$|^:X | :X | :X$/g, css: 'Stop Small' },
			{ regex: /^X-\($|^X-\( | X-\( | X-\($/g, css: 'Tired Small' }
		];

	for (var i = 0; i < smilies.length; i++) {
		var smilie = smilies[i];
		message = message.replace(smilie.regex, ' <span title="' + smilie.css + '" class="sprite ' + smilie.css + ' Smilie"></span> ');
	}
	return $.trim(message);
}

function openHome() {
	// Show Visitors
	$('.chat-stack, .history.container, .statistics.container, .accounts.slider, .responses.slider, .settings.container').hide();
	closeHistory();

	// Check # Visitors
	if (visitors !== undefined && visitors.length > 0 && $('.worldmap').css('display') == 'none') {
		$('.visitors-empty').hide();
		$('.visitors.container, .visitors-grid, .visitors-menu').show();
		$('.visitors-list.button').addClass('selected');
		$('.visitors-map.button').removeClass('selected');
	} else {
		$('.visitors.container, .visitors-empty').show();
	}
}

function processLanguage(data) {
	locale = data;

	$(document).trigger('LiveHelp.LocaleUpdated');

	var elements = $('[data-lang-key]');
	$.each(elements, function (key, element) {
		var element = $(element),
			key = element.attr('data-lang-key');

		element.text(data[key]);
	});

	storage.set('locale', locale);
}

var updateLanguage = function(language) {

	$.ajax({url: address + 'locale/' + language + '/admin.json',
		type: 'GET',
		success: function (data) {
			// Process Language Pack
			if (data !== undefined) {
				processLanguage(data);
			}
		},
		error: function (jqXHR, textStatus, errorThrown) { },
		dataType: 'json'
	});
};

function loadSettings(data) {

	// Settings
	settings = data;
	storage.set('settings', settings);

	// General Settings
	$('#domainname').val(data.Domain);
	$('#siteaddress').val(data.SiteAddress);
	$('#livehelpname').val(data.Name);
	if (data.VisitorTracking !== 0) {
		$('#visitortracking-enable').attr('checked', 'checked');
	} else {
		$('#visitortracking-disable').attr('checked', 'checked');
	}
	if (data.Departments !== 0) {
		$('#departments-enable').attr('checked', 'checked');
	} else {
		$('#departments-disable').attr('checked', 'checked');
	}
	$('#welcomenote').val(data.WelcomeMessage);
	$('#language').empty();

	var languages = data.Language.Available.split(', ');
	var locales = [
		{code: 'af', name: 'Afrikaans'},
		{code: 'ar', name: 'Arabic'},
		{code: 'be', name: 'Byelorussian'},
		{code: 'bg', name: 'Bulgarian'},
		{code: 'ca', name: 'Catalan'},
		{code: 'zh', name: 'Chinese Simplified'},
		{code: 'cs', name: 'Czech'},
		{code: 'da', name: 'Danish'},
		{code: 'de', name: 'German'},
		{code: 'el', name: 'Greek'},
		{code: 'en', name: 'English'},
		{code: 'es', name: 'Spanish'},
		{code: 'et', name: 'Estonian'},
		{code: 'eu', name: 'Basque'},
		{code: 'fi', name: 'Finnish'},
		{code: 'fo', name: 'Faroese'},
		{code: 'fr', name: 'French'},
		{code: 'ga', name: 'Irish'},
		{code: 'gl', name: 'Galician'},
		{code: 'hr', name: 'Croatian'},
		{code: 'hu', name: 'Hungarian'},
		{code: 'is', name: 'Icelandic'},
		{code: 'it', name: 'Italian'},
		{code: 'he', name: 'Hebrew'},
		{code: 'ja', name: 'Japanese'},
		{code: 'ko', name: 'Korean'},
		{code: 'lt', name: 'Lithuanian'},
		{code: 'lv', name: 'Latvian'},
		{code: 'mk', name: 'Macedonian'},
		{code: 'mt', name: 'Maltese'},
		{code: 'nl', name: 'Dutch'},
		{code: 'no', name: 'Norwegian'},
		{code: 'pl', name: 'Polish'},
		{code: 'pt', name: 'Portuguese'},
		{code: 'ro', name: 'Romanian'},
		{code: 'ru', name: 'Russian'},
		{code: 'sk', name: 'Slovak'},
		{code: 'sl', name: 'Slovenian'},
		{code: 'sq', name: 'Albanian'},
		{code: 'sv', name: 'Swedish'},
		{code: 'tr', name: 'Turkish'},
		{code: 'uk', name: 'Ukrainian'}
	];

	$.each(languages, function (key, language) {
		var locale = '';
		$.each(locales, function (index, value) {
			if (language == value.code) {
				locale = value.name;
				return false;
			}
		});
		$('<option value="' + language + '">' + locale + '</option>').appendTo('#language');
	});
	$('#language').val(data.Language.Locale);
	updateLanguage(data.Language.Locale);

	// Appearance Settings
	var templates = $('#template');
	templates.find('option').remove();
	$.each(data.Templates, function(key, value) {
		templates.append('<option value="' + value.value + '">' + value.name + '</option>');
	});
	templates.val(data.Template);

	if (data.Smilies !== 0) {
		$('#smilies-enable').attr('checked', 'checked');
		enableSmilies();
	} else {
		$('#smilies-disable').attr('checked', 'checked');
		disableSmilies();
	}
	$('#backgroundcolor').val(data.BackgroundColor);
	$('#generalfont').val(data.Font.Type);
	$('#generalfontsize').val(data.Font.Size);
	$('#generalfontcolor').val(data.Font.Color);
	$('#generalfontlinkcolor').val(data.Font.LinkColor);
	$('#guestchatfont').val(data.ChatFont.Type);
	$('#guestchatfontsize').val(data.ChatFont.Size);
	$('#sentcolor').val(data.ChatFont.SentColor);
	$('#receivedcolor').val(data.ChatFont.ReceivedColor);
	$('#chatwindowsize').val(data.ChatWindowSize.Width + ' x ' + data.ChatWindowSize.Height);

	$('#backgroundcolor, #sentcolor, #receivedcolor, #generalfontcolor, #generalfontlinkcolor').minicolors();

	// HTML5 Alerts / Safari / WebKit
	if (window.webkitNotifications || 'Notification' in window) {
		$('#html5-notifications-enable').attr('checked', 'checked');
		if (storage.get('html5-notifications')) {
			checkHTML5NotificationsPermission();
		} else {
			$('#html5-notifications-disable').attr('checked', 'checked');
		}
	} else {
		$('#html5-notifications-disable').attr('checked', 'checked');
		$('.html5-notifications input').attr('disabled', 'disabled');
		storage.set('html5-notifications', false);
	}

	// Images
	$('#logo').val(data.Logo);
	$('#campaignimage').val(data.Campaign.Image);
	$('#campaignlink').val(data.Campaign.Link);
	$('#onlineimage').val(data.OnlineLogo);
	$('#offlineimage').val(data.OfflineLogo);

	if (data.BeRightBackLogo !== false) {
		$('#berightbackimage').val(data.BeRightBackLogo);
	} else {
		$('#berightbackimage, .berightbackimage').hide();
	}

	if (data.AwayLogo !== false) {
		$('#awayimage').val(data.AwayLogo);
	} else {
		$('#awayimage, .awayimage').hide();
	}

	// HTML Code
	$('#htmlcodestep1').val(data.Code.Head);
	$('#htmlcodestep2').val(data.Code.Image);

	// Email
	$('#emailaddress').val(data.Email);
	$('#offlineurlredirection').val(data.OfflineEmail.Redirect);
	if (data.OfflineEmail.Enabled !== 0) {
		$('#email-enable').attr('checked', 'checked');
	} else {
		$('#email-disable').attr('checked', 'checked');
	}

	// Initiate Chat
	$('#autoinitiatechat-enable').change(function () {
		if ($(this).is(':checked')) {
			$('.autoinitiate-pageviews').fadeIn();
		}
	});
	$('#autoinitiatechat-disable').change(function () {
		if ($(this).is(':checked')) {
			$('.autoinitiate-pageviews').fadeOut();
		}
	});
	if (data.InitiateChat.Auto > 0) {
		$('#autoinitiatechat-enable').attr('checked', 'checked');
		$('#autoinitiatechat-pages').val(data.InitiateChat.Auto);
		$('.autoinitiate-pageviews').fadeIn();
	} else {
		$('#autoinitiatechat-disable').attr('checked', 'checked');
		$('#autoinitiatechat-pages').val(data.InitiateChat.Auto);
		$('.autoinitiate-pageviews').hide();
	}
	$('#verticalalignment').val(data.InitiateChat.Vertical);
	$('#horizontalalignment').val(data.InitiateChat.Horizontal);

	// Privacy
	var guestdetails = $('.guestemailaddress, .guestquestion, .guestlogindetailsrequired');
	if (data.LoginDetails.Enabled !== 0) {
		$('#guestlogindetails-enable').attr('checked', 'checked');
		guestdetails.show();
	} else {
		$('#guestlogindetails-disable').attr('checked', 'checked');
		guestdetails.hide();
	}

	if (data.LoginDetails.Required !== 0) {
		$('#guestlogindetailsrequired-enable').attr('checked', 'checked');
		guestdetails.show();
	}

	$('#guestlogindetails-enable, #guestlogindetails-disable').change(function () {
		var guestdetails = $('.guestemailaddress, .guestquestion, .guestlogindetailsrequired');
		if ($('#guestlogindetails-enable').is(':checked')) {
			guestdetails.show();
		} else {
			guestdetails.hide();
		}
	});

	if (data.LoginDetails.Email !== 0) {
		$('#guestemailaddress-enable').attr('checked', 'checked');
	} else {
		$('#guestemailaddress-disable').attr('checked', 'checked');
	}
	if (data.LoginDetails.Question !== 0) {
		$('#guestquestion-enable').attr('checked', 'checked');
	} else {
		$('#guestquestion-disable').attr('checked', 'checked');
	}
	if (data.SecurityCode !== 0) {
		$('#securitycode-enable').attr('checked', 'checked');
	} else {
		$('#securitycode-disable').attr('checked', 'checked');
	}
	$('#telephone').val(data.Telephone);
	$('#address').val(data.Address);

	// Version
	if (data.Version !== undefined) {
		var version = data.Version.Server;
		if (version >= 4.1) {
			$('.visitors-list.button, .visitors-map.button').css('display', 'inline-block');
		}
	}

	$(document).trigger('LiveHelp.SettingsLoaded', settings);
}

function enableSmilies() {
	$('.smilies.button').show();
}

function disableSmilies() {
	$('.smilies.button').hide();
}

function requestHTML5NotificationsPermission() {
	if (window.webkitNotifications || 'Notification' in window) {
		if (window.webkitNotifications) {
			window.webkitNotifications.requestPermission(checkHTML5NotificationsPermission);
		} else if ('Notification' in window) {
			Notification.requestPermission(function (permission) {
				if(!('permission' in Notification)) {
					Notification.permission = permission;
				}
				checkHTML5NotificationsPermission();
			});
		} else {
			storage.set('html5-notifications', false);
		}
	} else {
		$('.html5-notifications input').attr('disabled', 'disabled');
		storage.set('html5-notifications', false);
	}
}

function checkHTML5NotificationsPermission() {
	var accepted = false;
	if (window.webkitNotifications !== undefined) {
		if (window.webkitNotifications.checkPermission() === 0) {
			accepted = true;
		}
	} else if ('Notification' in window) {
		if (Notification.permission === 'granted') {
			// Accepted
			accepted = true;
		}
	}

	if (accepted) {
		$('.html5-notifications input').removeAttr('disabled');
	} else {
		$('.html5-notifications input').attr('disabled', 'disabled');
	}
	storage.set('html5-notifications', accepted);

	return accepted;
}

function openSettings(section) {
	var settings = $('.settings.dropdown'),
		menu = settings.find('.settingsmenu'),
		toolbar = settings.find('.button-toolbar');

	$('.accounts.slider, .responses.slider, .chat-stack, .section.settings-integrations').hide();
	menu.show();
	closeHistory();

	if (section !== undefined && section.length > 0) {
		menu.find('div').removeClass('selectedLava');
		menu.find('#' + section).addClass('selectedLava');
		openSettingsMenu(section);
	} else {
		settings.find('.section').hide();
		menu.find('#general').click();
		settings.find('.section.settings-general').show();
	}
	toolbar.animate({bottom: '15px'}, 250, 'easeInOutBack');

	if (settings.is(':hidden')) {

		// Access Level
		var menus  = $('.settingsmenu > div:not(#htmlcode, #alerts, .backLava)');
		if (operator.access >= 2) {
			menus.remove();
			if (section === undefined) {
				menu.find('#alerts').click();
			}
		}

		$(document).trigger('LiveHelp.OpenSettings');
		$('.settings.container').show();

		settings.show();
		settings.find('#general').mouseover();

		// Settings Menu
		if (menu.find('.backLava').length === 0) {
			menu.lavaLamp({target: 'div', container:'div', speed: 250, includeMargins:true, easing: 'easeOutBack', fx: 'easeOutBack' });
		}

		// Settings AJAX / Grid
		apiRequest({
			url: apiEndpoint.settings,
			success: function (data) {
				// Settings JSON
				if (data.Settings !== undefined) {
					loadSettings(data.Settings);
				}
			}
		});

		// HTML5 Notifications
		$('#html5-notifications-enable, #html5-notifications-disable').change(function () {
			if ($('#html5-notifications-enable').is(':checked')) {
				requestHTML5NotificationsPermission();
			} else {
				$(this).attr('disabled', 'disabled');
				storage.set('html5-notifications', false);
			}
		});

	}

}

function openSettingsMenu(menu) {
	switch (menu) {
		case 'htmlcode':
			$(document).trigger('LiveHelp.SettingsHTMLCodeClick');

			// Settings HTML Code Copy
			if (zclip) {
				$('.copy.step1, .copy.step2').off('copy afterCopy');
				$('.copy.step1').on('copy', function(e) {
					e.clipboardData.clearData();
					e.clipboardData.setData('text/plain', $('textarea#htmlcodestep1').val());
					e.preventDefault();
				})
				.on('afterCopy', function(e) {
						$('textarea#htmlcodestep1').pulse({ backgroundColor: ['#dbf3f8', '#ffffff'] }, 500, 2);
				});
				$('.copy.step2').on('copy', function(e) {
					e.clipboardData.clearData();
					e.clipboardData.setData('text/plain', $('textarea#htmlcodestep2').val());
					e.preventDefault();
				})
				.on('afterCopy', function(e) {
					$('textarea#htmlcodestep2').pulse({ backgroundColor: ['#dbf3f8', '#ffffff'] }, 500, 2);
				});
			}
			break;
		case 'integrations':
			$('.settingsmenu').hide();
			break;
	}

	// Open Menu
	var section = $('.settings-' + menu),
		sections = section.parent().find('.section');

	settingsMenuClickedCallback(menu);

	section.show();
	$.each(sections, function(key, value) {
		var element = $(value);
		if (element.attr('class').indexOf('settings-' + menu) == -1) {
			element.hide();
		}
	});
}

var saveSettingsCallback = function () {
	// Show Progress
	var dialog = $('.settings.dialog');
	dialog.find('.progressring').show();
	dialog.find('.title').text('Saving Settings');
	dialog.find('.description').text('One moment while your settings are saved.');
	dialog.show().animate({bottom: 0}, 250, 'easeInOutBack');
};

var saveSettingsCompletedCallback = function () {
	// Settings Saved
	window.setTimeout(function () {
		var dialog = $('.settings.dialog');
		dialog.find('.progressring').hide();
		dialog.find('.title').text('Settings Saved Successfully');
		dialog.find('.description').text('Your settings were saved successfully.');

		// Hide Progress
		dialog.delay(1000).show().animate({bottom: -90}, 250, 'easeInOutBack');
	}, 500);
};

var saveSettingsErrorCallback = function () {
	// Settings Error
	var dialog = $('.settings.dialog');
	dialog.find('.progressring').hide();
	dialog.find('.title').text('Error Saving Settings');
	dialog.find('.description').text('An error occurred while saving the settings.  Please contact technical support.');

	// Hide Progress
	dialog.delay(3000).show().animate({bottom: -90}, 250, 'easeInOutBack');
};

var overrideSettingsCallback = function (settings) {
	return settings;
}

function saveSettings() {

	// Access Level
	if (operator.access >= 2) {
		return;
	}

	var smilies = ($('#settings #smilies-enable').is(':checked')) ? -1 : 0,
		visitortracking = ($('#settings #visitortracking-enable').is(':checked')) ? -1 : 0,
		departments = ($('#settings #departments-enable').is(':checked')) ? -1 : 0,
		offlineemail = ($('#settings #email-enable').is(':checked')) ? -1 : 0,
		loginemail = ($('#settings #guestemailaddress-enable').is(':checked')) ? -1 : 0,
		loginquestion = ($('#settings #guestquestion-enable').is(':checked')) ? -1 : 0,
		initiatechatauto = ($('#settings #autoinitiatechat-disable:checked').length > 0) ? -1 : $('#settings #autoinitiatechat-pages').val(),
		securitycode = ($('#settings #securitycode-enable').is(':checked')) ? -1 : 0,
		logindetails = ($('#settings #guestlogindetails-enable').is(':checked')) ? -1 : 0,
		loginrequired = ($('#settings #guestlogindetailsrequired-enable').is(':checked')) ? -1 : 0,
		chatwindowsize = $('#settings select#chatwindowsize').val(),
		windowsize = {width: parseInt(chatwindowsize.substring(0, chatwindowsize.indexOf(' x ')), 10), height: parseInt(chatwindowsize.substring(chatwindowsize.indexOf(' x ') + 3), 10)},
		settings = {
			Domain: $('#settings #domainname').val(),
			URL: $('#settings #siteaddress').val(),
			Email: $('#settings #emailaddress').val(),
			Name: $('#settings #livehelpname').val(),
			Logo: $('#settings #logo').val(),
			Introduction: $('#settings #welcomenote').val(),
			Smilies: smilies,
			Font: $('#settings #generalfont').val(),
			FontSize: $('#settings #generalfontsize').val(),
			FontColor: $('#settings #generalfontcolor').val(),
			ChatFont: $('#settings #guestchatfont').val(),
			SentFontColor: $('#settings #sentcolor').val(),
			ReceivedFontColor: $('#settings #receivedcolor').val(),
			LinkColor: $('#settings #generalfontlinkcolor').val(),
			BackgroundColor: $('#settings #backgroundcolor').val(),
			ChatFontSize: $('#settings #guestchatfontsize').val(),
			OfflineLogo: $('#settings #offlineimage').val(),
			OnlineLogo: $('#settings #onlineimage').val(),
			OfflineEmailLogo: $('#settings #offlineimage').val(),
			BeRightBackLogo: $('#settings #berightbackimage').val(),
			AwayLogo: $('#settings #awayimage').val(),
			LoginDetails: logindetails,
			LoginEmail: loginemail,
			LoginQuestion: loginquestion,
			OfflineEmail: offlineemail,
			OfflineEmailRedirect: $('#settings #offlineurlredirection').val(),
			SecurityCode: securitycode,
			Departments: departments,
			VisitorTracking: visitortracking,
			Locale: $('#settings #language').val(),
			InitiateChatVertical: $('#settings #verticalalignment').val(),
			InitiateChatHorizontal: $('#settings #horizontalalignment').val(),
			InitiateChatAuto: initiatechatauto,
			ChatUsername: -1,
			CampaignImage: $('#settings #campaignimage').val(),
			CampaignLink: $('#settings #campaignlink').val(),
			IP2Country: -1,
			ChatWindowWidth: windowsize.width,
			ChatWindowHeight: windowsize.height,
			RequireGuestDetails: loginrequired,
			Template: $('#settings #template').val(),
			Telephone: $('#settings #telephone').val(),
			Address: $('#settings #address').val()
		};

	// Save Settings
	saveSettingsCallback();

	// Override Settings Callback
	settings = overrideSettingsCallback(settings);

	// Settings AJAX / Grid
	apiRequest({
		url: apiEndpoint.settings,
		data: settings,
		success: function (data) {
			// Settings JSON
			if (data.Settings !== undefined) {
				loadSettings(data.Settings);
				saveSettingsCompletedCallback();
			} else {
				saveSettingsErrorCallback();
			}
		},
		error: function (jqXHR, textStatus, errorThrown) {
			saveSettingsErrorCallback();
		}
	});
}

function closeSettings() {
	$('.miniColors-selector').hide();
	$('.settings.dropdown').animate({height:0, opacity:0}, 250, 'easeInOutBack', function() {
		$(this).hide();
		$('.settings.container').hide();
		$(this).find('.button-toolbar').animate({bottom: '-90px'}, 250, 'easeInOutBack');
	});
	switchPreviousMenu();
}

function zeroFill(number, width) {
	width -= number.toString().length;
	if (width > 0) {
		return new Array(width + (/\./.test(number) ? 2 : 1) ).join('0') + number;
	}
	return number;
}

function capitaliseFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function openHistoryChat(data) {
	var history = $('#history-chat'),
		chat = parseInt(data.Session, 10),
		active = parseInt(data.Active, 10),
		post = {'Data': chat + ',0,0,0'};

	// Show Chat
	if (chat > 0) {

		var historyemail = data.Email;
		if (historyemail.indexOf('<') > -1 || historyemail.indexOf('>') > -1) {
			historyemail = $(data.Email).text();
		}

		history.data('id', chat);
		history.find('.name').text(data.Username + ' - ' + historyemail);
		history.find('.messages').html('');

		// Blocked Chat
		var dialog = history.find('.dialog');
		if (active === -3) {
			dialog.show().animate({bottom: '1px'}, 250);
		} else {
			dialog.animate({bottom: '-145px'}, 250, function () {
				$(this).hide();
			});
		}

		// Chat AJAX
		apiRequest({
			url: apiEndpoint.chats,
			data: post,
			success: function (data) {
				// Messages JSON
				if (data.MultipleMessages !== undefined && data.MultipleMessages.Messages !== undefined) {

					var messages = data.MultipleMessages.Messages[0],
						html = '',
						pos = 'left',
						defaultimage = (server.length > 0) ? protocol + server + defaultUserImage : encodeURIComponent(window.location.protocol + '//' + window.location.host + path.replace(path.substring(path.indexOf(directoryPath + 'admin/')), directoryPath + 'images/UserSmall.png')),
						size = (window.devicePixelRatio > 1) ? 192 : 96;

					if (parseInt(messages.ID, 10) === chat && messages.Message.length > 0) {
						$.each(messages.Message, function(key, value) {
							var status = parseInt(value.Status, 10),
								message = value.Content,
								date = new moment(value.Datetime, 'YYYY-MM-DD HH:mm:ss').toDate(),
								time = date.getHours() + ':' + zeroFill(date.getMinutes(), 2);

							if (status > 0) {
								message = $('<div>').text(message).html();
							}

							// Image
							if (status === 3) {
								var regEx = /(https?|ftp|file):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[A-Z0-9+&@#\/%=~_|](\.jpg|.jpeg|\.gif|\.png)/im;
								var match = regEx.exec(message);
								if (match !== null) {
									message = '<img src="' + match[0] + '" />';
								}
							} else {
								message = message.replace(/(?!.*(?:\.jpe?g|\.gif|\.png)$)((?:(?:http(?:s?))|(?:ftp)):\/\/[^\s|<|>|'|"]*)/img, '<a href="$1" target="_blank">$1</a>');
								message = message.replace(/^(https?|ftp|file):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[A-Z0-9+&@#\/%=~_|](\.jpg|.jpeg|\.gif|\.png)$/img, '<img src="$&"/>');
							}

							if (settings.Smilies !== 0) {
								message = htmlSmilies(message);
							}

							var username = value.Username,
								email = value.Email,
								accountID = 0,
								photo = '',
								from = '';

							if (status === 1) {
								$.each(accounts, function (key, account) {
									if (account.Username === username) {
										username = account.Firstname;
										accountID = account.ID;
										return;
									}
								});
							}
							username = (username.length > 0) ? 'from ' + capitaliseFirstLetter(username) : '';

							pos = (status > 0) ? 'right' : 'left';
							if (status >= 0) {

								var account = false;
								if (status > 0) {
									$.each(accounts, function (key, account) {
										var id = parseInt(account.ID, 10);
										if (value.Username === account.Username) {
											if (value.Image !== undefined && value.Image.indexOf('http') > -1) {
												email = false;
											} else {
												email = account.Email;
											}
											from = id;
											return false;
										}
									});
								}

								if (opts.messages.photo) {
									var css = '';
									if (status > 0) {
										image = operatorImage(from, email, size);
									}
									if (account !== false && account.Image !== undefined && (account.Image.indexOf('https://') > -1 || account.Image.indexOf('data:image/') > -1)) {
										image = account.Image;
									} else if (status === 0) {
										var email = historyemail;
										image = 'https://secure.gravatar.com/avatar/' + CryptoJS.MD5(email) + '?s=' + size + '&r=g&d=' + defaultimage;
										css = ' guest';
									}
									photo = '<div class="avatar' + css + '" style="background-image:url(\'' + image + '\'); background-size: 32px auto"></div>';
								}

								if (opts.messages.from) {
									from = '<div class="from">' + username + ' at ' + time + '</div>';
								}

								//html += '<blockquote class="message ' + pos + '">' + photo + '<div class="content">' + message + '</div>' + from + '</blockquote>';
								//html += '<div class="flex ' + pos + image + '">'
								image = (photo.length > 0) ? ' image' : '';
								html += '<div class="flex ' + pos + image + '">' + photo + '<blockquote class="message ' + pos + '"><div class="content">' + message + '</div>' + from + '</blockquote></div>';
							} else if (status === -2) {
								html += '<div class="visitor alert"><img src="' + defaultimage + '" style="width: 20px; height: 20px"/>' + capitaliseFirstLetter(message) + '</div>';
							} else if (status === -3) {
								var rating = parseInt(message.substring(message.length - 1), 10),
									stars = '';

								for (var i = 1; i <= 5; i++) {
									if (rating >= i) {
										stars += '<div class="sprite RatingHighlight"></div>';
									} else {
										stars += '<div class="sprite Rating"></div>';
									}
								}

								message = message.substring(0, message.length - 2);
								switch (rating) {
									case 5:
										rating = 'Excellent';
										break;
									case 4:
										rating = 'Very Good';
										break;
									case 3:
										rating = 'Good';
										break;
									case 2:
										rating = 'Poor';
										break;
									case 1:
										rating = 'Very Poor';
										break;
								}

								html += '<div style="margin-left:20px">' + message + '<span>' + stars + '<span style="margin-left:10px">' + rating + '</span></span></div>';
							}
						});
						$(html).appendTo('#history-chat .messages');
					}

				}
			}
		});

		history.show();
	}
}

function closeHistory() {
	if (historyGrid) {
		$('#history-chat').hide();
		historyGrid.setSelectedRows([]);
		historyGrid.resetActiveCell();
	}
}

var historyGrid = false,
	historyColumns,
	historyDataView,
	historyOptions = {
			rowHeight: 220,
			enableCellNavigation: true,
			enableColumnReorder: false,
			multiColumnSort: true,
			multiSelect: false
		};

function updateHistoryFilter() {
	historyDataView.setFilterArgs({
		searchString: historySearch
	});
	historyDataView.refresh();
}

function initHistoryGridEvents() {

	if (!historyGrid) {

		var groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();
		historyDataView = new Slick.Data.DataView({
			groupItemMetadataProvider: groupItemMetadataProvider
		});

		// Persist Columns
		if (historyGrid) {
			historyColumns = historyGrid.getColumns();
		} else {
			historyColumns = storage.get('historyColumns');

			// Configure Column Formatters
			historyColumns[0].formatter = renderHistoryCell;
			historyColumns[1].formatter = Slick.Formatters.Date;
		}

		historyGrid = new Slick.Grid('.history-grid', historyDataView, historyColumns, historyOptions);
		historyGrid.registerPlugin(groupItemMetadataProvider);
		historyGrid.setSelectionModel(new Slick.RowSelectionModel());

		historyGrid.onColumnsResized.subscribe(function () {
			storage.set('historyColumns', historyGrid.getColumns());
		});

		historyGrid.onSelectedRowsChanged.subscribe(function () {
			rows = historyGrid.getSelectedRows();
			chat = historyDataView.getItem(rows);
			if (chat !== undefined) {
				openHistoryChat(chat);
			}
		});

		historyGrid.onSort.subscribe(function (e, args) {
			var cols = args.sortCols;
			historyDataView.sort(function (dataRow1, dataRow2) {
				for (var i = 0, l = cols.length; i < l; i++) {
					var field = cols[i].sortCol.field;
					var sign = cols[i].sortAsc ? 1 : -1;
					var value1 = dataRow1[field], value2 = dataRow2[field];
					var result = (value1 == value2 ? 0 : (value1 > value2 ? 1 : -1)) * sign;
					if (result !== 0) {
						return result;
					}
				}
				return 0;
			});
			historyGrid.invalidate();
			historyGrid.render();
		});

		historyDataView.onRowCountChanged.subscribe(function (e, args) {
			historyGrid.updateRowCount();
			historyGrid.render();
		});

		historyDataView.onRowsChanged.subscribe(function (e, args) {
			historyGrid.invalidateRows(args.rows);
			historyGrid.render();
		});
	}
}

function renderHistoryCell(row, cell, value, columnDef, dataContext) {

	var browser = 'Chrome',
		image = '',
		location = dataContext.Country;

	value = dataContext.UserAgent;
	if (value.indexOf('MSIE') !== -1 || value.indexOf('Trident/') !== -1) {
		browser = 'InternetExplorer';
	} else if (value.indexOf('Chrome') !== -1) {
		browser = 'Chrome';
	} else if (value.indexOf('Opera') !== -1) {
		browser = 'Opera';
	} else if (value.indexOf('Safari') !== -1) {
		browser = 'Safari';
	} else if (value.indexOf('Firefox') !== -1) {
		browser = 'Firefox';
	}
	dataContext.Username = ucwords(dataContext.Username.toLowerCase());
	dataContext.UserAgent = './images/' + browser + '.png';

	if (dataContext.State !== null && dataContext.State.length > 0) {
		if (dataContext.City !== null && dataContext.City.length > 0) {
			location = dataContext.City + ', ' + dataContext.State + ', ' + dataContext.Country;
		} else {
			location = dataContext.State + ', ' + dataContext.Country;
		}
	} else {
		if (dataContext.City !== null && dataContext.City.length > 0) {
			location = dataContext.City + ', ' + dataContext.Country;
		}
	}
	image = '<span class="' + convertCountryIcon(dataContext.Country) + '" style="float:left; margin: 3px 5px 3px 0; display:inline-block"></span>';
	dataContext.Location = image + location;

	// Rating
	var rating = parseInt(dataContext.Rating, 10),
		ratingText = 'No Rating',
		ratingHtml = '';

	switch (rating) {
		case 1:
			ratingText = 'Very Poor';
			break;
		case 2:
			ratingText = 'Poor';
			break;
		case 3:
			ratingText = 'Good';
			break;
		case 4:
			ratingText = 'Very Good';
			break;
		case 5:
			ratingText = 'Excellent';
			break;
	}

	for (var i = 1; i <= 5; i++) {
		var css = '',
			disabled = '';

		if (rating >= i) {
			css = 'Highlight';
		}
		if (rating === 0) {
			disabled = ' disabled';
		}
		ratingHtml += '<div class="sprite Rating' + css + disabled + '"></div>';
	}
	ratingHtml += '<span class="rating text">' + ratingText + '</span>';

	if (dataContext.Department.length === 0) {
		dataContext.Department = 'Unavailable';
	}

	if (dataContext.Email.length > 0) {
		if (dataContext.Email.indexOf('mailto:') === -1 && dataContext.Email.length > 0) {
			var email = escapeHtml(dataContext.Email);
			dataContext.Email = '<a href="mailto:' + email + '">' + email + '</a>';
		}
	} else {
		dataContext.Email = 'Unavailable';
	}
	if (dataContext.CurrentPage.indexOf('href') === -1 && dataContext.CurrentPage.length > 0) {
		var page = escapeHtml(dataContext.CurrentPage);
		dataContext.CurrentPage = '<a href="' + page + '" target="_blank">' + page + '</a>';
	}

	var referrer = dataContext.Referrer,
		regEx = /^http[s]{0,1}:\/\/(?:[^.]+[\\.])*google(?:(?:.[a-z]{2,3}){1,2})[\/](?:search|url|imgres|aclk)(?:\?|.*&)q=([^&]*)/i,
		keywords = regEx.exec(referrer);

	if (keywords !== null) {
		if (keywords[1].length > 0) {
			referrer = 'Google Search (Keywords: ' + keywords[1] + ')';
		} else {
			referrer = 'Google Search';
		}
	}
	dataContext.Referrer = referrer;

	var cell = '<div class="cell-inner"> \
	<div class="cell-left"> \
		<img src="' + dataContext.UserAgent + '"/> \
	</div> \
	<div class="cell-main"> \
	  <h2 style="text-transform: none">' + dataContext.Username + '</h2> \
	  <span>' + dataContext.Operator + '</span><br/> \
	  <span>' + dataContext.Department + '</span><br/> \
	  <span>' + dataContext.Hostname + '</span><br/> \
	  <span>' + dataContext.Email + '</span><br/> \
	  <span>' + dataContext.Referrer + '</span><br/> \
	  <span>' + dataContext.CurrentPage + '</span><br/> \
	  <span>' + dataContext.Location + '</span><br/> \
	  <span>' + ratingHtml + '</span><br/> \
	</div> \
</div>';

	return cell;
}

function initHistoryGrid(date) {

	// History Grid
	var history,
		historySearch = '',
		title = $('.history.container .menu .title .text');

	if (date === undefined) {
		// Selected Date
		date = storage.get('history-date');

		// Selected Date
		var calendar = $('.history.container #calendar');
		calendar.find('td').removeClass('selected-date');
		calendar.find('td[id="' + date + '"]').addClass('selected-date');

	}

	date = (date.length > 0) ? new moment(date, 'YYYY-MM-DD HH:mm:ss') : new moment();
	title.text(date.format('dddd, MMMM D YYYY'));
	date = date.year() + '-' + zeroFill(date.month() + 1, 2) + '-' + zeroFill(date.date(), 2);

	function historyFilter(item, args) {
		var search = args.searchString.toLowerCase();
		if (search !== '' && item.Username.toLowerCase().indexOf(search) == -1 && item.Email.toLowerCase().indexOf(search) == -1 && item.Department.toLowerCase().indexOf(search) == -1 && item.Operator.toLowerCase().indexOf(search) == -1 && item.Hostname.toLowerCase().indexOf(search) == -1) {
			return false;
		}

		return true;
	}

	if (session.length > 0) {

		// Web Service / Data
		var post = {'StartDate': date, 'EndDate': date, 'Timezone': getUTCOffset(), 'Transcripts': 1, 'ID': 0};

		// Initialise Grid
		initHistoryGridEvents();

		// History AJAX / Grid
		apiRequest({
			url: apiEndpoint.history,
			data: post,
			success: function (data) {
				// Chat History JSON
				if (data.ChatHistory !== undefined) {

					history = [];
					$.each(data.ChatHistory, function(key, value) {
						history.push(value.Visitor);
					});
					history = history.reverse();

					historyDataView.beginUpdate();
					historyDataView.setItems(history, 'Session');
					historyDataView.setFilterArgs({
						searchString: historySearch
					});
					historyDataView.setFilter(historyFilter);
					historyDataView.endUpdate();

					var chats = '',
						length = history.length;

					if (length > 1) {
						chats = ' - ' + history.length + ' chats';
					} else if (length > 0) {
						chats = ' - ' + history.length + ' chat';
					}

					if (length > 0) {
						$('.history-empty').hide();
						$('.history-grid').show();
					} else {
						//$('.history-grid').hide();
						$('.history-empty, .history-grid').show();
					}
					$('.username-column-header .slick-column-name').text('Chat History' + chats);

				}
			}
		});
	}
}

function sliderIndex() {
	// Adjust Sliders
	var sliders = $('.slider.right'),
		zindex = 0;

	if (sliders.length > 0) {
		$.each(sliders, function (key, value) {
			var element = $(value),
				i = parseInt(element.css('z-index'), 10);

			if (element.width() > 0 && i > zindex) {
				zindex = i;
			}
		});
	}
	return zindex;
}

var openResponsesCallback = function (responses, opened) {
	// Reload Responses
	loadResponses();

	// Open Responses
	responses.css('z-index', sliderIndex() + 100);
	responses.css({width:'calc(100% - 300px)', opacity:1});

	// Callback
	if (opened) {
		opened();
	}
};

function openResponses(opened) {
	// Open Responses
	var responses = $('#responses');
	$('.chat-stack, .history.container, .statistics.container, .accounts.slider, .settings.container').hide();
	responses.show();
	openResponsesCallback(responses, opened)
}

function closeResponses() {
	var responses = $('#responses'),
		width = responses.width();

	responses.find('.search input').val('');
	filterResponses();

	responses.animate({width:0, opacity:0}, 250, function () {
		responses.hide();
	});
	switchPreviousMenu();
}

var accountsLoaded = false;

function lastUpdatedAccount(accounts) {
	var lastUpdated = null;
	$.each(accounts, function (key, value) {
		var updated = new moment(value.Updated, 'YYYY-MM-DD HH:mm:ss').toDate();
		if (!lastUpdated || updated > lastUpdated) {
			lastUpdated = updated;
		}
	});
	return lastUpdated;
}

function storeAccounts(accounts) {

	// TODO Save Operator Images
	var newaccounts = [];
	$.each(accounts, function (key, value) {
		if (value.Image !== undefined && value.Image.indexOf('https://') < 0) {
			value.Image = '';
		}
		newaccounts.push(value);
	})

	storage.set('accounts', newaccounts);
}

function showAccountsGrid(accounts, override) {
	var storedAccounts = storage.get('accounts'),
		storedLastUpdated = lastUpdatedAccount(storedAccounts);

	override = (override !== undefined) ? override : false;
	storeAccounts(accounts);
	$(document).trigger('LiveHelp.AccountsUpdated', [accounts]);

	var newAccount = false;
	$.each(storedAccounts, function (key, account) {
		var storedID = parseInt(account.ID, 10),
			exists = false;

		$.each(accounts, function (key, value) {
			var ID = parseInt(value.ID, 10);
			if (storedID === ID) {
				exists = true;
			}
		});

		if (!exists) {
			newAccount = true;
		}
	});

	var lastUpdated = lastUpdatedAccount(accounts);
	if (lastUpdated > storedLastUpdated || newAccount || storedAccounts.length != accounts.length) {
		updateAccountsGrid(accounts, override);
	} else {
		updateAccountsGrid(accounts, true);
		$(document).trigger('LiveHelp.AccountsCompleted');
	}
}

// Accounts Grid
var accountsGrid,
	accountsDataView,
	accounts,
	accountsColumns = [
		{id: 'account', name: '', field: 'Username', formatter: renderAccountCell, sortable: true}
	],
	accountsOptions = {
		rowHeight: 80,
		enableCellNavigation: true,
		enableColumnReorder: false,
		forceFitColumns: true,
		multiColumnSort: true,
		multiSelect: false
	},
	accountTemplate = null;

function renderAccountCell(row, cell, value, columnDef, dataContext) {
	var data = dataContext,
		status = parseInt(data.Status, 10);

	if (!isNaN(status)) {
		switch (status) {
			case 0:
				status = 'Offline';
				break;
			case 1:
				status = 'Online';
				break;
			case 2:
				status = 'Be Right Back';
				break;
			case 3:
				status = 'Away';
				break;
		}
		data.Status = status;
	}

	data.Mobile = 'none';
	if (data.Devices.length > 0) {
		data.Mobile = 'inline-block';
	}

	var disabled = (data.Disabled !== 'none' && data.Disabled !== '0') ? true : false;
	if (disabled && data.Devices.length === 0) {
		data.Disabled = 'inline-block; background:url(\'images/Lock.png\') no-repeat; ';
	} else {
		data.Disabled = 'none';
	}

	var size = (window.devicePixelRatio > 1) ? 600 : 300,
		image = operatorImage(data.ID, data.Email, size);

	if (data.Image !== undefined && data.Image.indexOf('https://') > -1) {
		image = data.Image.replace('.png', '-100px.png');
	}

	var cell = '<div class="cell-inner" data-id="' + data.ID + '"> \
	<div class="cell-left"> \
		<div class="image" style="background: url(' + image + ') no-repeat; background-size: 60px auto; width: 60px; height: 60px"></div> \
	</div> \
	<div class="cell-main"> \
		<div class="cell-heading name">' + data.Firstname + ' ' + data.Lastname + '</div> \
		<span class="cell-details department">' + data.Department + '</span> \
		<span class="cell-details status">' + data.Status + '</span> \
		<span class="disabled" title="Account Disabled" style="width:22px; height:22px; display:inline-block; position:absolute; bottom:10px; right:30px; opacity:0.3; display:' + data.Disabled + '"></span> \
		<span class="sprite Smartphone" title="Logged in with Mobile App" style="position:absolute; bottom:10px; right:25px; opacity:0.5; display:' + data.Mobile + '"></span> \
	</div> \
</div>';

	return cell;
}

function initAccountsGridEvents() {

	if (accountsGrid === undefined) {

		var groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();
		accountsDataView = new Slick.Data.DataView({
			groupItemMetadataProvider: groupItemMetadataProvider
		});

		accountsGrid = new Slick.Grid('.accounts-grid', accountsDataView, accountsColumns, accountsOptions);
		accountsGrid.registerPlugin(groupItemMetadataProvider);
		accountsGrid.setSelectionModel(new Slick.RowSelectionModel());

		accountsGrid.onSelectedRowsChanged.subscribe(function() {
			rows = accountsGrid.getSelectedRows();
			account = accountsDataView.getItem(rows);

			if (account !== undefined) {

				var storedAccounts = storage.get('accounts');
				$.each(storedAccounts, function(key, value) {
					if (parseInt(account.ID, 10) === parseInt(value.ID, 10)) {
						account = value;
					}
				});

				showAccount(account);
				accountsGrid.setSelectedRows([]);
				accountsGrid.resetActiveCell();
			}
		});

		accountsGrid.onSort.subscribe(function (e, args) {
			var cols = args.sortCols;
			accountsDataView.sort(function (dataRow1, dataRow2) {
				for (var i = 0, l = cols.length; i < l; i++) {
					var field = cols[i].sortCol.field;
					var sign = cols[i].sortAsc ? 1 : -1;
					var value1 = dataRow1[field], value2 = dataRow2[field];
					var result = (value1 == value2 ? 0 : (value1 > value2 ? 1 : -1)) * sign;
					if (result !== 0) {
						return result;
					}
				}
				return 0;
			});
			accountsGrid.invalidate();
			accountsGrid.render();
		});

		accountsDataView.onRowCountChanged.subscribe(function (e, args) {
			accountsGrid.updateRowCount();
			accountsGrid.render();
		});

		accountsDataView.onRowsChanged.subscribe(function (e, args) {
			accountsGrid.invalidateRows(args.rows);
			accountsGrid.render();
		});
	}
}

function updateAccountsGrid(accounts, override) {
	override = (override !== undefined) ? override : false;

	// Initialise Grid
	initAccountsGridEvents();

	function displayAccountsGrid() {

		$('#account-details .details').css('background', 'none');

		// Refresh Data View
		accountsDataView.beginUpdate();
		accountsDataView.setItems(accounts, 'ID');
		accountsDataView.endUpdate();
	}

	// Preload Images
	var loaded = [];
	if (override) {
		displayAccountsGrid();
		$(document).trigger('LiveHelp.AccountsCompleted');
	} else if (loaded.length != accounts.length) {
		var size = (window.devicePixelRatio > 1) ? 600 : 300;
		$.each(accounts, function (key, account) {
			if (account.Image === undefined) {
				account.Image = operatorImage(account.ID, account.Email, size);
				$('<img />').load(function () {
					loaded.push(account.ID);
					if (loaded.length == accounts.length) {
						displayAccountsGrid();
						$(document).trigger('LiveHelp.AccountsOpenLoaded');
					}
				}).attr('src', account.Image);
			} else {
				override = true;
			}
		});

		if (override) {
			displayAccountsGrid();
			$(document).trigger('LiveHelp.AccountsOpenLoaded');
		}

	} else {
		$(document).trigger('LiveHelp.AccountsCompleted');
	}

}

function initAccountsGrid(showGrid) {

	if (session.length > 0) {

		// Web Service URL / Data
		var cached = new Date().toString('yyyy-MM-dd HH:mm:ss'),
			post = {'Cached': cached},
			storedAccounts = storage.get('accounts'),
			storedLastUpdated = lastUpdatedAccount(storedAccounts);

		if (storedAccounts.length > 0 && $('#account-details').css('display') != 'none' && !accountsLoaded) {
			if (showGrid !== undefined && showGrid === true) {
				updateAccountsGrid(storedAccounts, true);
				accountsLoaded = true;
			}
		} else {
			var rows = $('.accounts-grid .cell-inner');
			$.each(rows, function (key, row) {
				var id = $(row).data('id');
				row = $(row);

				$.each(accounts, function (key, account) {
					var status = 'Offline';
					if (id === parseInt(account.ID, 10)) {
						// Status Mode
						switch(parseInt(account.Status, 10)) {
							case 1:
								status = 'Online';
								break;
							case 2:
								status = 'Be Right Back';
								break;
							case 3:
								status = 'Away';
								break;
						}
						row.find('.cell-details.name').text(account.Firstname + " " + account.Lastname);
						row.find('.cell-details.department').text(account.Department);
						row.find('.cell-details.status').text(status);
						return;
					}
				});
			});
		}

		$(document).trigger('LiveHelp.AccountsOpened');

		// Accounts AJAX / Grid
		apiRequest({
			url: apiEndpoint.operators,
			data: post,
			success: function (data) {
				// Accounts JSON
				if (data.Operators !== undefined && data.Operators.Operator !== undefined) {
					accounts = data.Operators.Operator;

					storeAccounts(accounts);
					$(document).trigger('LiveHelp.AccountsUpdated', [accounts]);

					if (showGrid !== undefined && showGrid === true) {
						showAccountsGrid(accounts);
					} else {
						$(document).trigger('LiveHelp.AccountsCompleted');
					}
				}
			}
		});
	}

}

function closeAccountDetails() {
	var account = $('#account-details'),
		save = account.find('.account.button-toolbar.save'),
		edit = account.find('.account.button-toolbar.edit'),
		heading = account.find('.header:not(.account)').text();
		height = save.height(),
		id = account.find('.details #AccountID').val();

	if (id.length > 0) {
		var id = parseInt(id, 10),
			exists = _.find(unsavedImages, function (value) { return value.id === id });

		if (exists !== undefined) {
			resetAccountImage(exists);
		}
	}

	account.removeClass('edit add');
	if (heading === 'Add Account' || edit.filter(':visible').length > 0) {
		showAccounts();
		return;
	}

	account.find('.tagsinput .tag').addClass('disabled');
	account.find('.tagsinput-add-container').hide();
	account.find('.LiveHelpInput, .password').hide();
	account.find('.value, .account.button-toolbar.edit, .label.twofactor').fadeIn();
	save.hide().css('bottom', -height + 'px');
	edit.fadeIn().animate({bottom: '15px'}, 250, 'easeInOutBack');
}

function validateField(obj, id) {
	var value = (obj instanceof $) ? obj.val() : $(obj).val();
	if ($.trim(value) === '') {
		$(id).removeClass('TickSmall').addClass('CrossSmall').fadeIn(250);
		return false;
	} else {
		$(id).removeClass('CrossSmall').addClass('TickSmall').fadeIn(250);
		return true;
	}
}

function validateUsername(obj, id) {
	var value = (obj instanceof $) ? obj.val() : $(obj).val(),
		accounts = storage.get('accounts'),
		exists = false,
		accountID = $('#AccountID').val();

	accountID = (accountID.length > 0) ? parseInt(accountID, 10) : 0;

	$.each(accounts, function(index, account) {
		account.ID = parseInt(account.ID, 10);
		if ((account.Username === value && accountID === 0) || (account.Username === value && accountID > 0 && accountID !== account.ID)) {
			exists = true;
		}
	});

	if ($.trim(value) === '' || exists) {
		var element = $(id);
		if (exists) {
			element.attr('title', 'Username Already In Use');
		} else {
			element.attr('title', 'Username Required');
		}
		element.removeClass('TickSmall').addClass('CrossSmall').fadeIn(250);
		return false;
	} else {
		$(id).removeClass('CrossSmall').addClass('TickSmall').fadeIn(250);
		return true;
	}
}

function validateEmail(obj, id, department) {
	var value = (obj instanceof $) ? obj.val() : $(obj).val(),
		accounts = storage.get('accounts'),
		exists = false,
		valid = false,
		accountID = $('#AccountID').val();

	if (/^[\-!#$%&'*+\\.\/0-9=?A-Z\^_`a-z{|}~]+@[\-!#$%&'*+\\\/0-9=?A-Z\^_`a-z{|}~]+\.[\-!#$%&'*+\\.\/0-9=?A-Z\^_`a-z{|}~]+$/i.test(value)) {
		valid = true;
	} else {
		valid = false;
	}

	if (!department) {
		accountID = (accountID.length > 0) ? parseInt(accountID, 10) : 0;

		$.each(accounts, function(index, account) {
			account.ID = parseInt(account.ID, 10);
			if ((account.Email === value && accountID === 0) || (account.Email === value && accountID > 0 && accountID !== account.ID)) {
				exists = true;
			}
		});
	}

	if (valid !== false && (department || !department && !exists)) {
		var element = $(id);
		if (!department && !exists) {
			element.attr('title', 'Email Already In Use');
		} else {
			element.attr('title', 'Email Required');
		}
		element.removeClass('CrossSmall').addClass('TickSmall').fadeIn(250);
		return true;
	} else {
		$(id).removeClass('TickSmall').addClass('CrossSmall').fadeIn(250);
		return false;
	}
}

function validatePassword(obj, password, id) {
	var value = (obj instanceof $) ? obj.val() : $(obj).val();
	if ($.trim(value) === '' || value !== password) {
		$(id).removeClass('TickSmall').addClass('CrossSmall').fadeIn(250);
		return false;
	} else {
		$(id).removeClass('CrossSmall').addClass('TickSmall').fadeIn(250);
		return true;
	}
}

var accountSavingCallback = function () {
	// Show Progress
	var dialog = $('.account.dialog');
	dialog.css('height', '90px');
	dialog.find('.progressring').show();
	dialog.find('.title').text('Saving Account');
	dialog.find('.description').text('One moment while your account is saved.');
	dialog.show().animate({bottom: 0}, 250, 'easeInOutBack');
};

var accountSaveErrorCallback = function (error) {
	// Account Error
	var dialog = $('.account.dialog'),
		title = 'Error Saving Account',
		description = 'An error occurred while saving your account.  Please contact technical support.';

	if (error !== false) {
		title = error.title;
		description = error.description;
	}

	dialog.css('height', '120px');
	dialog.find('.progressring').hide();
	dialog.find('.title').text(title);
	dialog.find('.description').text(description);

	// Hide Progress
	dialog.delay(2000).animate({bottom: -dialog.height()}, 250, 'easeInOutBack');
};

function saveAccount() {

	var storedAccounts = storage.get('accounts'),
		storedLastUpdated = lastUpdatedAccount(storedAccounts),
		disabled = ($('#AccountStatusEnable').is(':checked')) ? 0 : -1,
		account = {
			ID: $('#AccountID').val(),
			User: $('#AccountUsername').val(),
			Firstname: $('#AccountFirstname').val(),
			Lastname: $('#AccountLastname').val(),
			Email: $('#AccountEmail').val(),
			Department: $('#AccountDepartment').val(),
			Privilege: $('#AccountAccessLevel').val(),
			NewPassword: $('#AccountPassword').val(),
			Disabled: disabled,
			Cached: new moment(storedLastUpdated.toString(), 'YYYY-MM-DD HH:mm:ss').toDate()
		};

	// Save Account Validation
	validateAccount(false);
	if ($('#account-details').find('.InputError.CrossSmall').length > 0) {
		return;
	}

	// Show Progress
	accountSavingCallback();

	function saveCompleted(data, updatedImage) {
		if (data.Operators !== null && data.Operators !== undefined && data.Operators.Operator !== undefined) {

			var account = false;
			if (!updatedImage) {
				accounts = data.Operators.Operator;
				storeAccounts(accounts);
			} else {
				var saved = _.find(data.Operators.Operator, function (value) { return operator.id === parseInt(value.ID, 10); });

				account = _.find(accounts, function (value) { return operator.id === parseInt(value.ID, 10); });
				if (account !== undefined && saved !== undefined) {
					saved.Image = account.Image;
				}
				accounts = data.Operators.Operator;
				storage.set('accounts', accounts);
			}

			$(document).trigger('LiveHelp.AccountsUpdated', [accounts]);

			var newAccount = false;
			$.each(storedAccounts, function (key, account) {
				var storedID = parseInt(account.ID, 10),
					exists = false;

				$.each(accounts, function (key, value) {
					var ID = parseInt(value.ID, 10);
					if (storedID === ID) {
						exists = true;
					}
				});

				if (!exists) {
					newAccount = true;
				}
			});

			if (!updatedImage) {
				var lastUpdated = lastUpdatedAccount(accounts);
				if (lastUpdated > storedLastUpdated || newAccount) {
					updateAccountsGrid(accounts, true);
				} else if (accountsGrid !== undefined) {
					accountsGrid.invalidate();
					$(document).trigger('LiveHelp.AccountsCompleted');
				}
			}

			// Show Updated Account
			if (account !== false) {
				$.each(accounts, function(index, value) {
					if (value.ID === account.ID) {
						showAccount(value);
						return false;
					}
				});
			}
			closeAccountDetails();

			$(document).trigger('LiveHelp.AccountSaveCompleted');

			// Hide Progress
			var dialog = $('.account.dialog');
			dialog.animate({bottom: -dialog.height()}, 250, 'easeInOutBack', function () {
				$(this).hide();
			});
		} else {
			// Account Error
			var error = (data.error !== undefined) ? data.error : false;
			accountSaveErrorCallback(error);
		}
	}

	// Save Account
	if (accountFiles !== undefined) {

		// Remove Unsaved
		unsavedImages = _.reject(unsavedImages, function (value) { return value.id === parseInt(account.ID, 10) });

		// Save Account / Image Upload
		$('#account-upload').fileupload('send', {
			headers: {'Authorization': 'Token signature="' + session + '", version="5"', 'Accept': 'application/json'},
			formData: account,
			files: accountFiles
		}).success(function (data, textStatus, jqXHR) {
			// Account Saved
			saveCompleted(data, true);
		}).error(function (jqXHR, textStatus, errorThrown) {
			// Account Error
			var error = (data.error !== undefined) ? data.error : false;
			accountSaveErrorCallback(error);
		});
		accountFiles = undefined;
	} else {
		// Save Account
		apiRequest({
			url: apiEndpoint.operators,
			data: account,
			success: function (data) {
				saveCompleted(data, false);
			}
		});
	}
}

function showAddAccount() {
	$('.accounts-grid').fadeOut();

	var account = $('#account-details'),
		save = account.find('.account.button-toolbar.save'),
		height = save.height(),
		toolbars = account.find('.account.button-toolbar.edit, .account.button-toolbar.add');

	$('#account-details').addClass('add');
	account.find('.header').text('Add Account');
	account.find('.back, .back-background').fadeIn();
	account.find('.details').css('bottom', '25px');
	account.find('.value, .label.devices').hide();
	account.find('input, select, .password').val('').fadeIn();
	account.find('.scroll, .account.button-toolbar.save, .LiveHelpInput, #account-upload, .upload, #account-dropzone').fadeIn();
	account.find('#AccountStatusEnable').attr('checked', 'checked');
	account.find('.InputError').removeClass('TickSmall CrossSmall');

	toolbars.css('bottom', -height + 'px').hide();
	save.fadeIn().animate({bottom: '15px'}, 250, 'easeInOutBack');

	$(document).trigger('LiveHelp.ShowAccountLoaded');

}

function validateAccount(password) {
	var account = $('#account-details .scroll'),
		required = account.find('input, select, .password').filter(':not(#AccountUsername, #AccountEmail, #AccountPasswordConfirm)');

	if (!password) {
		required = account.find('input, select').filter(':not(#AccountUsername, #AccountEmail, #AccountPasswordConfirm, #AccountPassword)');
	}

	// Validate Required Fields
	$.each(required, function (key, value) {
		var id = $(value).attr('id');
		validateField($(value), '#' + id + 'Error');
	});

	// Validate Username
	var element = $('#AccountUsername'),
		id = element.attr('id');

	validateUsername(element, '#' + id + 'Error');

	// Validate Email
	element = $('#AccountEmail');
	id = element.attr('id');
	validateEmail(element, '#' + id + 'Error', false);

	// Validate Password
	var passwordfield = $('#AccountPassword'),
		confirmpassword = $('#AccountPasswordConfirm');

	if (!password) {
		if (passwordfield.val().length === 0 && confirmpassword.val().length === 0) {
			return;
		}
	}
	id = confirmpassword.attr('id');
	validatePassword(confirmpassword, passwordfield.val(), '#' + id + 'Error');
}

var unsavedImages = [];

function updateAccountImage(id, image, dropped) {

	var exists = _.find(unsavedImages, function (value) { return value.id === id; }),
		upload = $('#account-upload'),
		profile = upload.find('.image');

	if (dropped && exists === undefined) {
		var background = profile.css('background-image'),
			unsavedImage = background.match(/\b(https?|ftp|file):\/\/[\-A-Z0-9+&@#\/%?=~_|$!:,.;]*[A-Z0-9+&@#\/%=~_|$]/ig);

		if (unsavedImage !== null && unsavedImage.length > 0) {
			unsavedImage = unsavedImage[0];
			unsavedImages.push({id: id, image: unsavedImage});
		}
	}

	var stored = _.find(accounts, function (value) { return id === parseInt(value.ID, 10); });
	if (stored !== undefined) {
		stored.Image = image;
		storage.set('accounts', accounts);
	}

	profile.css({'background': 'url(' + image + ') no-repeat', 'opacity': 1.0, 'width': '100px', 'height': '100px', 'padding': 0, 'background-size': '100px 100px'});
	upload.css({'border': 'none', 'border-radius': 0, 'background': 'transparent'}).fadeIn();
	$('.upload').hide();

	if (dropped) {
		var online = $('.operators.list .visitor[data-id=' + id + '] .image');
		if (online.length > 0) {
			online.css({'background': 'url(' + image + ') no-repeat', 'background-size': '40px 40px'});
		}

		var account = $('.accounts-grid .slick-row .cell-inner[data-id=' + id + '] .image');
		if (account.length > 0) {
			account.css({'background': 'url(' + image + ') no-repeat', 'background-size': '60px 60px'});
		}

		if (operator.id === id) {
			$('.operator .photo').css({'background': 'url(' + image + ') no-repeat', 'background-size': '50px 50px'});
		}
	}

}

function resetAccountImage(unsaved) {
	var online = $('.operators.list .visitor[data-id=' + unsaved.id + '] .image'),
		image = unsaved.image;

	var stored = _.find(accounts, function (value) { return id === parseInt(value.ID, 10); });
	if (stored !== undefined) {
		stored.Image = image;
		storage.set('accounts', accounts);
	}

	$('#account-upload .image').css({'background': 'url(' + image + ') no-repeat', 'background-size': '100px 100px'});

	if (online.length > 0) {
		online.css({'background': 'url(' + image + ') no-repeat', 'background-size': '40px 40px'});
	}

	var account = $('.accounts-grid .slick-row .cell-inner[data-id=' + unsaved.id + '] .image');
	if (account.length > 0) {
		account.css({'background': 'url(' + image + ') no-repeat', 'background-size': '60px 60px'});
	}

	if (operator.id === unsaved.id) {
		$('.operator .photo').css({'background': 'url(' + image + ') no-repeat', 'background-size': '50px 50px'});
	}
}

var accountFiles,
	accountAddingCallback = function () {
		// Show Progress
		var dialog = $('.account.dialog');
		dialog.css('height', '90px');
		dialog.find('.progressring').show();
		dialog.find('.title').text('Adding Account');
		dialog.find('.description').text('One moment while you account is created.');
		dialog.show().animate({bottom: 0}, 250, 'easeInOutBack');
	},
	accountAddErrorCallback = function () {
		// Account Error
		var dialog = $('.account.dialog');
		dialog.css('height', '120px');
		dialog.find('.progressring').hide();
		dialog.find('.title').text('Error Adding Account');
		dialog.find('.description').text('An error occurred while adding your account.  Please contact technical support.');
	};

function addAccount() {

	var account = $('#account-details'),
		disabled = account.find('#AccountStatusEnable').is(':checked') ? 0 : -1,
		post = {
			User: account.find('#AccountUsername').val(),
			Firstname: account.find('#AccountFirstname').val(),
			Lastname: account.find('#AccountLastname').val(),
			Email: account.find('#AccountEmail').val(),
			Department: account.find('#AccountDepartment').val(),
			NewPassword: account.find('#AccountPassword').val(),
			Privilege: account.find('#AccountAccessLevel').val(),
			Disabled: disabled
		};

	// Add Account Validation
	validateAccount(true);
	if (account.find('.InputError.CrossSmall').length > 0) {
		return;
	}

	// Adding Account
	accountAddingCallback();

	function accountAdded(data) {
		if (data.Operators !== undefined && data.Operators.Operator !== undefined) {
			// Operators
			var operators = data.Operators.Operator;
			showAccountsGrid(operators);
			showAccounts();

			// Update Image
			var id = 0,
				email = '';

			$.each(operators, function(key, value) {
				if (value.Username === post.User) {
					id = parseInt(value.ID, 10);
					email = value.Email;
					return false;
				}
			});
			if (id > 0) {
				$('#account-details .cell-inner[data-id="' + id + '"] img').attr('src', operatorImage(id, email, 60));
			}
		} else {
			// Add Account Error
			accountAddErrorCallback();
		}

		$(document).trigger('LiveHelp.AccountAddCompleted');

		// Hide Progress
		var dialog = $('.account.dialog');
		dialog.animate({bottom: -dialog.height()}, 250, 'easeInOutBack', function () {
			$(this).hide();
		});
	}

	// Add Account without Image Upload
	if (accountFiles !== undefined) {
		// Add Account / Image Upload
		$('#account-upload').fileupload('send', {
			headers: {'Authorization': 'Token signature="' + session + '", version="5"', 'Accept': 'application/json'},
			formData: post,
			files: accountFiles
		}).success(function (data, textStatus, jqXHR) {
			// Account Added
			accountAdded(data);
		}).error(function (jqXHR, textStatus, errorThrown) {
			// Account Error
			accountAddErrorCallback();
		});
		accountFiles = undefined;
	} else {
		// Add Account
		apiRequest({
			url: apiEndpoint.operators,
			data: post,
			success: function (data) {
				// Account Added
				accountAdded(data);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				// Account Error
				accountAddErrorCallback();
			}
		});
	}

}

function accountDeleted(data) {
	if (data.Operators !== null && data.Operators !== undefined && data.Operators.Operator !== undefined) {

		// Account Deleted
		var operators = data.Operators.Operator;
		showAccountsGrid(operators, true);
		showAccounts();

		// Hide Progress
		var dialog = $('#account-details .confirm-delete.dialog');
		dialog.delay(2000).hide().animate({bottom: -90}, 250, 'easeInOutBack');
	} else {
		// Account Error
		accountDeletedErrorCallback();
	}
}

var accountDeletedCallback = function (data) {
		// Account Deleted
		accountDeleted(data);
		$(document).trigger('LiveHelp.AccountDeleted');
	},
	accountDeletedErrorCallback = function (jqXHR, textStatus, errorThrown) {
		// Account Error
		var dialog = $('#account-details .confirm-delete.dialog');
		dialog.find('.progressring').hide();
		dialog.find('.title').text('Error Deleting Account');
		dialog.find('.description').text('An error occurred while deleting your account.  Please contact technical support.');

		// Hide Progress
		dialog.delay(2000).hide().animate({bottom: -90}, 250, 'easeInOutBack');
	},
	deleteAccountClickedCallback = function () {
		var confirm = $('#account-details .confirm-delete.dialog');
		confirm.find('.progressring').hide();
		confirm.find('.buttons').show();
		confirm.find('.title').text('Confirm Account Delete');
		confirm.find('.description').text('Are you sure that you wish to delete this account?');
		confirm.show().animate({bottom: 0}, 250, 'easeInOutBack');
	},
	deleteAccountConfirmClickedCallback = function () {
		// Show Progress
		var confirm = $('#account-details .confirm-delete.dialog');
		confirm.find('.buttons').fadeOut();
		confirm.find('.progressring').show();
		confirm.find('.progressring img').css({opacity: 0.5});

		// Delete Account
		deleteAccount();
	};

function deleteAccount() {
	var account = {ID: $('#AccountID').val()};

	// Delete Account
	apiRequest({
		url: apiEndpoint.operators,
		data: account,
		success: accountDeletedCallback,
		error: accountDeletedErrorCallback
	});
}

function refreshAccounts(status) {
	switch (status) {
		case "Online":
			status = 1;
			break;
		case "BRB":
			status = 2;
			break;
		case "Away":
			status = 3;
			break;
		default:
			status = 0;
			break;
	}
	$.each(accounts, function (key, account) {
		if (operator.id === parseInt(account.ID, 10)) {
			account.Status = status;
		}
	});
}

var accountsScrollTop = 0;

function showAccount(data) {
	// Save Scroll
	var viewport = $('.accounts-grid .slick-viewport');
	if (viewport.is(':visible')){
		accountsScrollTop = viewport.scrollTop();
	}
	$('.accounts-grid').fadeOut();

	// Load Departments
	updateDepartment(false, false, false);

	$(document).trigger('LiveHelp.AccountLoaded', data);

	// Status Button
	var button = $('#account-details .details .btn-group'),
		status = 'Offline';

	// Access Level
	if (operator.access >= 2) {
		button.hide();
	} else {
		button.css('display', 'inline-block');
	}

	data.status = parseInt(data.Status, 10);
	switch(data.status) {
		case 1:
			status = 'Online';
			break;
		case 2:
			status = 'Be Right Back';
			break;
		case 3:
			status = 'Away';
			break;
	}
	button.find('.status').text(status);
	if (data.status !== 1) {
		button.find('.btn').addClass('disabled');
	} else {
		button.find('.btn').removeClass('disabled');
	}
	button.find('.dropdown-menu.statusmode li a').on('click', function () {

		// Show Dialog
		var dialog = $('.account.dialog');
		dialog.css('height', '90px');
		dialog.find('.progressring').show();
		dialog.find('.title').text('Updating Operator Status Mode');
		dialog.find('.description').text('One moment while the operator status mode is updated.');
		dialog.show().animate({bottom: 0}, 250, 'easeInOutBack');

		// Update Status
		var id = $('#account-details .details #AccountID').val(),
			button = button,
			status = $(this).attr('class');

		updateUsers(status, id, function () {
			// Accounts
			refreshAccounts(status);

			// Update Button
			status = (status === 'BRB') ? 'Be Right Back' : status;
			$('#account-details .dropdown-toggle .status').text(status);

			// Hide Progress
			dialog.delay(1000).animate({bottom: -90}, 250, 'easeInOutBack');
		});
	});

	storage.set('account', data);

	// Update Account Details
	var account = $('#account-details');
	account.find('.details').css('background', 'none');
	account.find('.header').hide()
	account.find('.header.account').text(data.Firstname + ' ' + data.Lastname).show();
	account.find('.back, .back-background').fadeIn();

	var size = (window.devicePixelRatio > 1) ? 600 : 300;
	var image = operatorImage(data.ID, data.Email, size);
	if (data.Image !== undefined && (data.Image.indexOf('https://') > -1 || data.Image.indexOf('data:image/') > -1)) {
		image = data.Image;
	}
	updateAccountImage(data.ID, image, false);

	account.find('#AccountID').val(data.ID);
	account.find('.username.value').text(data.Username);
	account.find('#AccountUsername').val(data.Username);
	account.find('.firstname.value').text(data.Firstname);
	account.find('#AccountFirstname').val(data.Firstname);
	account.find('.lastname.value').text(data.Lastname);
	account.find('#AccountLastname').val(data.Lastname);
	account.find('.email.value').text(data.Email);
	account.find('#AccountEmail').val(data.Email);

	var department = account.find('.department.value .tagsinput'),
		departments = data.Department.split(';');

	department.find('.tag').remove();
	$.each(departments, function (key, value) {
		if (value.length > 0) {
			value = $.trim(value);
			$('<span class="tag disabled" data-department="' + value + '"><span>' + value + '</span><a class="tagsinput-remove-link"></a></span>').prependTo(department);
		}
	});

	if (department.find('.tag').length > 0) {
		account.find('.department.value .none').hide();
		department.show();
	} else {
		department.hide();
		account.find('.department.value .none').show();
	}

	account.find('#AccountDepartment').val(data.Department);
	account.find('.tagsinput .tagsinput-add-container').hide();

	var access = parseInt(data.Privilege, 10);
	account.find('#AccountAccessLevel').val((access < 0) ? 0 : access);

	access = convertAccessLevel(data.Privilege);
	account.find('.accesslevel.value').text(access);

	var disabled = parseInt(data.Disabled, 10),
		accountstatus = 'Disabled';

	if (disabled === 0) {
		account.find('#AccountStatusEnable').attr('checked', 'checked');
		accountstatus = 'Enabled';
	} else {
		account.find('#AccountStatusDisable').attr('checked', 'checked');
		accountstatus = 'Disabled';
	}
	account.find('.accountstatus.value').text(accountstatus);

	// Devices
	var html = '';
	if (data.Devices !== undefined) {
		$.each(data.Devices, function (key, value) {
			html += '<div class="device value">' + value.Device + ' - ' + value.OS + '</div>';
		});
	}

	if (html.length > 0) {
		account.find('.devices.value').html(html);
		account.find('.devices.label').show();
	} else {
		account.find('.devices.value').html('');
		account.find('.devices.label').hide();
	}

	account.find('.details').css('bottom', '25px');
	account.find('.value').show();

	// Two Factor Authentication
	var twofactor = account.find('.twofactor.label, .twofactor.value');
	if (data.TwoFactor !== undefined && twofactor.length > 0) {
		var status = 'Disabled',
			button = 'Enable';
		if (data.TwoFactor !== false) {
			status = 'Enabled';
			button = 'Disable';
		}
		account.find('.twofactor.value .status').text(status);
		account.find('.twofactor.value .btn').text(button);

		account.find('.twofactor.label').css('display', 'inline');
		account.find('.twofactor.value').show();
	} else {
		twofactor.hide();
	}

	account.find('.LiveHelpInput, .password, .account.button-toolbar.save').hide();
	account.find('.scroll').fadeIn();

	if (parseInt(data.ID, 10) === operator.id || operator.access < 2) {
		var edit = account.find('.account.button-toolbar.edit'),
			height = edit.height(),
			toolbars = account.find('.account.button-toolbar.add, .account.button-toolbar.save');

		toolbars.css('bottom', -height + 'px').hide();
		edit.fadeIn().animate({bottom: '15px'}, 250, 'easeInOutBack');
	}
}

function updateDepartment(data, complete, autoOpen) {
	var dialog = $('#account-details .departments.dialog'),
		element = dialog.find('.departments.list'),
		post = {};

	if (data !== undefined && data !== false) {
		post = {'Data': $.toJSON(data)};
	}

	if (element.find('.department').length > 0 && parseInt(dialog.css('bottom'), 10) < 0 && autoOpen === undefined) {
		dialog.show().animate({bottom: 0}, 250, 'easeInOutBack');
	}

	// Department HTTP Request
	apiRequest({
		url: apiEndpoint.departments,
		data: post,
		success: function (data) {
			// Settings JSON
			if (data !== undefined) {
				element.find('.department').remove();
				$.each(data, function (key, department) {
					$('<div class="department item" data-id="' + department.id + '" data-status="' + department.hidden + '"><div class="name">' + department.name + '</div><div class="edit button sprite Edit" title="Edit Department"></div><div class="email">' + department.email + '</div></div>').appendTo(element);
				});
			}
			if (complete) {
				complete();
			}
		}
	});
}

var openAccountsCallback = function () {};

function showAccounts() {
	var account = $('#account-details'),
		toolbars = account.find('.account.button-toolbar.save, .account.button-toolbar.edit'),
		add = account.find('.account.button-toolbar.add'),
		confirm = account.find('.confirm-delete.dialog'),
		upload = account.find('#account-upload'),
		departments = $('.departments.dialog'),
		height = toolbars.height();

	account.removeClass('edit add');
	account.find('.header.account').hide();
	account.find('.header:not(.account)').text('Add / Edit Accounts').show();
	account.find('.scroll').fadeOut();
	account.find('#account-image, .upload, #account-dropzone').fadeOut();
	account.find('.back, .back-background').fadeOut();
	account.find('.details').css('bottom', 0);

	upload.hide().find('.image').css({ 'background': 'none', 'opacity': 0.5, 'width': '100px', 'height': '100px', 'padding': '20px' });
	upload.css({'border': '2px dashed #CCC', 'border-radius': '100px', 'background': '#fafafa'});

	toolbars.fadeOut().css('bottom', -height + 'px');

	departments.hide().animate({bottom: -departments.height()}, 250, 'easeInOutBack');

	var twofactor = $('.twofactor-dialog');
	if (twofactor.length > 0 && parseInt(twofactor.css('bottom'), 10) >= 0) {
		twofactor.animate({bottom: -twofactor.height()}, 250, 'easeInOutBack');
	}

	// Access Level
	if (operator.access >= 2) {
		add.fadeOut();
	} else {
		add.fadeIn().animate({bottom: '15px'}, 250, 'easeInOutBack');
	}

	confirm.animate({bottom: '-90px'}, 250, 'easeInOutBack');
	$('.accounts-grid').fadeIn();
	$('.accounts-grid .slick-viewport').scrollTop(accountsScrollTop);

	$('#account-details .details .btn-group').hide();

	if (account.filter(':visible').length > 0) {
		storage.set('account', null);
		initAccountsGrid(true);
	}

}

function openAccounts() {
	// Open Account
	var account = $('#account-details'),
		add = account.find('.account.button-toolbar.add');

	// Access Level
	if (operator.access >= 2) {
		add.hide();
	}

	openAccountsCallback();

	account.show();
	account.css('z-index', sliderIndex() + 100);
	account.css({width:'calc(100% - 300px)', opacity:1});

	var account = storage.get('account'),
		storedAccounts = storage.get('accounts');
	if (account !== null) {
		$.each(storedAccounts, function(index, value) {
			if (account.ID === value.ID) {
				account = value;
			}
		});
		showAccount(account);
		return;
	}
	initAccountsGrid(true);
}

var closeAccountCallback = function (account) {
	account.animate({width:0, opacity:0}, 250, function () {
		account.hide();
	});
};

function closeAccount() {
	var account = $('#account-details'),
		width = account.width();

	closeAccountCallback(account);
	switchPreviousMenu();
}

(function () {

	var updateTime = function () {

		var visitors = $('.pending.list .visitor, .transferred.list .visitor');
		$.each(visitors, function (key, visitor) {
			visitor = $(visitor);
			var datetime = moment(visitor.attr('data-datetime')),
				seconds = moment().diff(datetime, 'seconds') % 60,
				minutes = moment().diff(datetime, 'minutes'),
				output = (minutes > 0) ? minutes + 'm' : seconds + 's';

			if (!isNaN(minutes) && !isNaN(seconds)) {
				visitor.find('.time').text(output);
			}
		});

		window.setTimeout(updateTime, 1000);
	}
	updateTime();

})();

var notifications = [];

function addOperator(id, name, department, access, status, account, offline) {
	var data = {},
		exists = $('.operators.list .visitor[data-id=' + id + ']').length;

	if (id !== operator.id & !exists) {
		var activechat = false;

		// Operator Chats
		$.each(activechats, function (key, value) {
			if (id === value.id && value.type > 0) {
				activechat = true;
				return false;
			}
		});

		// Accounts
		if (!account) {
			if (accounts === undefined) {
				accounts = storage.get('accounts');
			}
			$.each(accounts, function (key, value) {
				if (parseInt(value.ID, 10) === id) {
					account = value;
					return false;
				}
			})
		}

		// Image
		var image = operatorImage(id, account.Email, 40);

		if (((status === 1 || status === 2 || status === 3) && offline === undefined) || offline !== undefined) {
			if (account !== false && account.Image !== undefined && account.Image.indexOf('https://') > -1) {
				image = account.Image.replace('.png', '-100px.png');
			} else {
				var defaultimage = (server.length > 0) ? protocol + server + defaultUserImage : window.location.protocol + '//' + window.location.host + path.replace(path.substring(path.indexOf(directoryPath + '/admin/')), defaultUserImage),
					hash = CryptoJS.MD5(account.Email);

				image = 'https://secure.gravatar.com/avatar/' + hash + '?s=100&r=g&d=' + defaultimage;
			}

			var statusmode = 'offline';
			switch (status) {
				case 1:
					statusmode = 'online';
					break;
				case 2:
					statusmode = 'brb';
					break;
				case 3:
					statusmode = 'away';
					break;
			}

			data.id = id;
			data.firstname = account.Firstname;
			data.statusmode = statusmode;
			data.image = image;
			data.name = name;
			data.department = department;
			data.access = access;
			return data;
		}
	}
	return false;
}

function sortOperators() {

	// Sort Status Mode
	var order = {online: 1, brb: 2, away: 3, offline: 4};
	$('.operators.list').find('.visitor').sort(function (a, b) {
		return order[$(a).data('status')] - order[$(b).data('status')];
	}).each(function (_, account) {
		$(account).parent().append(account);
	});

	// Sort Name
	var operators = ['online', 'brb', 'away', 'offline'];
	$.each(operators, function (key, section) {
		$('.operators.list .visitor[data-status="' + section + '"]').sort(function (a, b) {
			return $(a).data('name').localeCompare($(b).data('name'));
		}).each(function (_, account) {
			$(account).parent().append(account);
		});
	});
}

function updateSelectedChat() {
	// Selected User
	var chats = $('.chat-list');
	if (!chats.find('.visitor.selected').length) {
		var selected = storage.get('selected-chat'),
			route = storage.get('route'),
			focussed = route.indexOf('setting') > -1 || route === 'accounts' || route === 'responses';

		if (!focussed) {
			var visitor = false,
				channel = false;

			if (selected !== undefined) {
				visitor = chats.find('.visitor[data-id=' + selected.id + '][data-operator=' + selected.operator + ']');
			} else {
				visitor = chats.find('.channel.everyone');
				channel = true;
			}
			if (visitor !== false && visitor.length > 0) {
				visitor.addClass('selected');
				visitor.click();
				if (!channel) {
					chattingVisitorClickCallback.call(visitor, {}, undefined, undefined, true);
				}
			}
		}
	}
}

function updateUser(section, users) {
	var html = '',
		exists = false,
		staff = false,
		hash = '',
		path = window.location.pathname,
		element = null,
		chatting = $('.chatting.list'),
		heading = false,
		height = 0,
		alert = false,
		chatstotal = $('#chatstotal'),
		existingheight = 0,
		defaultimage = (server.length > 0) ? protocol + server + defaultUserImage : window.location.protocol + '//' + window.location.host + path.replace(path.substring(path.indexOf(directoryPath + '/admin/')), defaultUserImage);

	if (section === 'Online') {
		element = chatSections.other.element;
		// Update Total
		updateTotal(chatstotal, users.length);
	} else if (section === 'Pending' || section === 'Transferred') {
		element = chatSections.pending.element;
		alert = true;
	} else if (section === 'Staff') {
		element = chatSections.operators.element;
		staff = true;
	}

	if (element !== null) {
		if (users.length > 0) {

			if (!chatSections.none.enabled && section !== 'Staff') {
				element.parent().find('.chat-list-heading.pending').show();
			}

			$.each(users, function(key, visitor) {
				html = '';
				if (section === 'Online') {
					var active = parseInt(visitor.Active, 10);
					if (active === operator.id || (settings.LoginDetails !== undefined && !settings.LoginDetails.Enabled && active !== operator.id)) {
						element = chatSections.chatting.element;
					} else {
						element = chatSections.other.element;
					}
				}
				hash = CryptoJS.MD5(visitor.Email);
				exists = false;
				$.each(element.find('.visitor'), function(key, chat) {
					var id = (typeof visitor.ID === 'number') ? parseInt(visitor.ID, 10) : visitor.ID;

					if (id === $(chat).data('id')) {
						exists = true;

						// Messages
						if (section === 'Online') {
							var messages = parseInt(visitor.Messages, 10),
								current = $(chat).data('messages'),
								count = messages - current,
								stack = $('.chat-stack'),
								top = stack.position().top,
								open = stack.find('.chat[data-id=' + id + ']').length,
								visible = (top < 0 || open === 0) ? false : true;

							var viewedchat = _.find(viewed, function (chat) { return chat.id === id && chat.operator == false; });
							if (viewedchat !== undefined) {
								viewedchat.message = 0;
								if (viewedchat.count !== undefined) {
									if (messages > viewedchat.count) {
										count = messages - viewedchat.count;
									} else {
										count = 0;
									}
								}
								storage.set('viewed', viewed);
							}

							if (count > 0 && !visible && viewedchat !== undefined && viewedchat.count !== undefined && viewedchat.count < messages) {
								$(chat).find('.message-alert').text(count).fadeIn();
							}
						}
						return;
					}
				});

				if (!exists) {
					var name = ucwords(visitor.Name.toLowerCase());
					if (staff) {
						var accounts = storage.get('accounts'),
							department = visitor.Department,
							access = (visitor.Access !== undefined) ? convertAccessLevel(visitor.Access) : '',
							status = parseInt(visitor.Status, 10),
							css = '',
							id = (typeof visitor.ID === 'number') ? parseInt(visitor.ID, 10) : visitor.ID,
							operatoraccount = false;

						if (visitor.Firstname !== undefined && visitor.Firstname.length === 0) {
							$.each(accounts, function(index, account) {
								if (parseInt(account.ID, 10) === parseInt(visitor.ID, 10)) {
									operatoraccount = account;
									name = account.Firstname;
									department = account.Department;
									access = convertAccessLevel(account.Privilege);
									return;
								}
							});
						} else {
							name = visitor.Firstname;
						}

						var account = addOperator(id, name, department, access, status, operatoraccount);
						if (account) {
							html = App.templates.operator(account);
						}

					} else {

						var messages = parseInt(visitor.Messages, 10),
							stack = $('.chat-stack'),
							size = (window.devicePixelRatio > 1) ? 192 : 96,
							defaultimage = (server.length > 0) ? protocol + server + defaultUserImage : encodeURIComponent(window.location.protocol + '//' + window.location.host + path.replace(path.substring(path.indexOf(directoryPath + 'admin/')), directoryPath + 'images/UserSmall.png'));

						visitor.id = (typeof visitor.ID === 'number') ? parseInt(visitor.ID, 10) : visitor.ID;
						visitor.name = name;
						visitor.department = visitor.Department;
						visitor.server = visitor.Server;
						visitor.hash = visitor.Hash;
						visitor.image = 'https://secure.gravatar.com/avatar/' + CryptoJS.MD5(visitor.Email).toString() + '?s=' + size + '&r=g&d=' + defaultimage;
						html = App.templates.user(visitor);

						// Add Chat
						if (stack.length && !stack.find('.chat[data-id=' + visitor.id + '][data-operator=false]').length) {
							var chathtml = App.templates.chat({id: visitor.id, styles: 'chat', operator: false}),
								chat = $(chathtml).prependTo(stack);

							chat.find('.scroll').on('scroll', debouncedSaveScroll);

							if (typeof addEmailAPIRequest !== 'undefined') {
								addEmailAPIRequest(chat, visitor.Email, name, visitor.image);
							}
						}

						// Stored Notifications
						var html5notify = storage.get('html5-notifications');
						exists = false;
						$.each(notifications, function (key, value) {
							if (value.id === id) {
								exists = true;
								return false;
							}
						});

						// Notifications
						if (section === 'Pending' || section === 'Transferred') {
							// Add Notification
							if (!exists && html5notify && checkHTML5NotificationsPermission()) {
								var title = section + ' Chat Request',
									text = name + ' is waiting to chat';

								if (visitor.Department.length > 0) {
									text += ' (' + visitor.Department + ')';
								}

								var notification = false;
								if (window.webkitNotifications !== undefined) {
									notification = window.webkitNotifications.createNotification(notificationIcon, title, text);
								} else if ('Notification' in window) {
									notification = new Notification(title, {icon: notificationIcon, body: text});
								}

								if (notification !== false) {
									notifications.push({id: id, section: section, notification: notification});
									notification.onclick = function (e) {
										var id = 0,
											chat = null;

										$.each(notifications, function (key, value) {
											id = value.id;
											if (id > 0) {
												acceptChat(id);
											}
										});
									};

									if (typeof(notification.show) === 'function') {
										notification.show();
									}
								}
							}
						} else if (section === 'Online') {
							// Remove Notification
							$.each(notifications, function (key, value) {
								if (value.id === id) {
									if (value.notification.cancel) { value.notification.cancel(); }
									if (value.notification.close) { value.notification.close(); }
									return false;
								}
							});
						}
					}

					// Pending / Transferred
					if (alert && pendingSound !== undefined) {
						pendingSound.play();
					}

				}
				if (html.length > 0) {
					element.find('.no-visitor').hide();

					var user = false;
					if (chatsLoaded) {
						user = $(html).prependTo(element);
					} else {
						user = $(html).appendTo(element);
					}

					var dropdown = user.find('.dropdown-toggle.options'),
						options = user.find('.dropdown-menu.options');

					dropdown.dropdown();
					dropdown.on('click', function () {

						var top = dropdown.offset().top + dropdown.outerHeight(),
							visitors = $('.chatting .visitor');

						options.css('top', top + 'px');
						options.css('left', dropdown.offset().left + 'px');

						// Offline Email
						options.find('.EmailChatOffline').text('Email Chat - ' + settings.Email);

						// Visitors Email
						$.each(visitors, function (key, value) {
							var email = $(this).data('user').Email,
								menu = $(this).find('.EmailChatVisitor');

							if (email.length > 0) {
								menu.text('Email Chat - ' + email).data('email', email).show();
							} else {
								menu.hide();
							}
						});

					});

					options.find('.Close').click(function () {
						// Close Chat
						closeChat();
					});

					options.find('.Block').click(function () {
						// Block Chat
						blockChat();
					});

					options.find('.EmailChatOffline').click(function () {
						var id = $(this).closest('.visitor').data('user').ID;
						emailChat(id, '');
					});

					options.find('.EmailChatVisitor').click(function () {
						var id = $(this).closest('.visitor').data('user').ID;
						emailChat(id, $(this).data('email'));
					});

					// Default Image
					var image = user.find('.image');
					$('<img/>').attr('src', visitor.image).load(function() {
						$(this).remove();
					}).error(function () {
						$(this).remove();
						image.css('background-image', 'url(' + defaultimage + ')');
					});

					if (user !== false) {
						$(user).data('user', visitor);
					}

				}

				// Adjust Height
				height = element.find('.visitor').length * sectionHeight(element);
				existingheight = element.data('height');
				if (height > 0 && height !== existingheight) {
					if (element.is('.operators')) {
						height = height + 30;
					}
					if (element.is(':hidden')) {
						element.show();
					}
					element.data('height', height);
					element.animate({height:height}, 250, 'easeOutBack');
				}

			});

			function adjustSections(element, section, name, height) {
				if (!chatSections.none.enabled && !chatSections.none.height) {
					if (section === 'Staff') {
						existingheight = element.data('height');
						height = $('.' + name + '.list').find('.visitor').length * height;
						heading = $('.chat-list-heading.' + name);
						if (height > 0 && height !== existingheight) {
							heading.show();
						} else {
							heading.hide();
						}
					}
				}
			}

			// Adjust Operators Heading
			adjustSections(element, section, 'operators', chatSections.operators.height);

			// Adjust Other Chatting Heading
			adjustSections(element, section, 'other-chatting', chatSections.other.height);

			// Adjust Chatting Height
			height = chatting.find('.visitor').length * chatSections.chatting.height;
			existingheight = chatting.data('height');
			heading = $('.chat-list-heading.chatting');
			if (height > 0 && height !== existingheight) {
				chatting.data('height', height);
				if (chatting.height() > 0) {
					chatting.animate({height:height}, 250, 'easeOutBack');
					heading.show();
				} else {
					heading.hide();
				}
			}
		} else {
			if (section != 'Pending' && section != 'Transferred') {
				clearUsers(element);
				if (section === 'Online' && !chatting.find('.visitor[data-id=-1]').length) {
					clearUsers(chatting);
				}
			}

			// Remove Notifications
			if (section === 'Pending' || section === 'Transferred') {
				$.each(notifications, function (key, value) {
					if (value.section === section) {
						if (value.notification.cancel) { value.notification.cancel(); }
						if (value.notification.close) { value.notification.close(); }
					}
				});
			}
		}
	}

	chatsLoaded = true;
}

function sectionHeight(section) {
	var height = 74;
	if (section.is('.chatting')) {
		height = chatSections.chatting.height;
	} else if (section.is('.other-chatting')) {
		height = chatSections.other.height;
	} else if (section.is('.pending')) {
		height = chatSections.pending.height;
	} else if (section.is('.operators')) {
		height = chatSections.operators.height;
	}
	return height;
}

function clearUsers(element) {

	var height = sectionHeight(element),
		section = element.attr('id'),
		heading = $('.chat-list-heading.' + section);

	if (height > 0) {
		element.find('.visitor').remove();
		if (chatSections.none.enabled) {
			element.find('.no-visitor').show();
			element.height(chatSections.none.height);
			element.data('height', chatSections.none.height);
		} else {
			if (element.is('.chatting') && !chatSections.none.enabled) {
				element.parent().find('.chat-list-heading.pending').hide();
			}
			element.find('.no-visitor').hide();
			element.height(0);
			element.data('height', 0);
			heading.hide();
		}
	} else if (element.is(':visible')) {
		element.hide();
	}
}

function removeUser(section, element) {

	// Remove Chatting Visitor
	element.remove();

	var height = sectionHeight(section);

	// Adjust Height
	height = section.find('.visitor').length * height;
	if (height > 0) {
		if (section.height() > 0) {
			section.animate({height:height}, 250, 'easeOutBack');
		}
		section.data('height', height);
	}
}

var users = {},
	usersTimer;

var updateUsersSuccess = function (data, action, id, complete) {

	// Update Interface
	updateUsersInterface(data.Users, action, id);

	$(document).trigger('LiveHelp.UpdateUsersCompleted');

	// Callback
	if (complete) {
		complete();
	}
};

function updateUsers(action, id, complete) {

	if (session.length > 0) {

		// Validate Action / ID
		var post = {};
		if (action !== undefined) {
			$.extend(post, {'Action': action});
		}
		if (id !== undefined) {
			$.extend(post, {'ID': id});
		}

		// Clear Timer
		window.clearTimeout(usersTimer);

		// Users AJAX
		apiRequest({
			url: apiEndpoint.users,
			data: post,
			success: function (data) {
				updateUsersSuccess(data, action, id, complete);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				if (websockets === false) {
					usersTimer = window.setTimeout(updateUsers, 10000);
				}
			}
		});
	}

	$(document).trigger('LiveHelp.UpdateUsersComplete');
}

var acceptOpenChatCallback = function (id, value) {
	openChat(id, value);
}

function updateResponsesChats() {
	var menus = $('.responses .response .dropdown-menu.send-response'),
		chats = users.Online.User;

	if (chats.length > 0) {
		menus.find('.none').hide();
		$.each(chats, function (key, value) {
			if (!menus.find('li[data-id=' + value.ID + ']').length) {
				$('<li class="menu-item" data-id="' + value.ID + '"><a href="#">' + value.Name + '</a></li>').appendTo(menus);
			}
		})
	} else {
		menus.find('.none').show();
	}

	// users.Online.User
}

function updateUsersInterface(data, action, id, complete) {
	// Users JSON
	if (data !== undefined) {

		// Users Event
		$(document).trigger('LiveHelp.UsersCompleted', { newUsers: data, previousUsers: users });

		users = data;

		// Responses Chats
		updateResponsesChats();

		// Remove Chatting Users
		var operators = $('.operators .visitor'),
			chatting = $('.chatting .visitor, .other-chatting .visitor'),
			pending = $('.pending .visitor'),
			section = $('.operators.list'),
			chatid = id,
			empty = $('.chat-list .empty');

		// Operators
		if (showOfflineOperators === false) {
			var staff = 0;
			$.each(operators, function (key, value) {
				var element = $(value),
					id = element.data('id'),
					exists = false;

				$.each(users.Staff.User, function(key, value) {
					if (parseInt(value.ID, 10) === id && parseInt(value.Status, 10) === 1) {
						exists = true;
						staff++;
					}
				});

				if (!exists) {
					// Remove Chat
					// TODO Update Customer Status Indicator
				}

			});

			// Clear Operators
			if (staff === 0) {
				clearUsers(section);
			}
		}

		// Check Accepted
		$.each(users.Online.User, function(key, value) {
			if (action === 'Accept' && ((typeof value.ID === 'number' && chatid === parseInt(value.ID, 10)) || (typeof value.ID === 'string' && value.ID.length == 36 && chatid === value.ID)) && parseInt(value.Active, 10) === operator.id) {
				openChat(id, value);
			}
		});

		// Chatting
		section = $('.chatting.list');
		var demo = section.find('.visitor[data-id=-1]');
		if (chatting.length > 0) {
			var chats = 0;

			$.each(chatting, function (key, value) {
				var element = $(value),
					id = element.data('id'),
					exists = false;

				$.each(users.Online.User, function(key, value) {
					if ((typeof value.ID === 'number' && parseInt(value.ID, 10) === id) || (typeof value.ID === 'string' && value.ID === id)) {
						exists = true;
					}
					if (parseInt(value.Active, 10) === operator.id) {
						chats++;
					}
				});

				if (!exists && !element.is('.visitor[data-id=-1]')) {
					// Remove Chat
					// TODO Update Customer Status Indicator
				}

			});

			if (chats === 0 && !demo.length) {
				clearUsers(section);
			}

		} else if (!demo.length) {
			clearUsers(section);
		}

		// Pending / Transferred Notification
		if (users.Pending.User.length > 0) {
			showPendingNotification(users.Pending.User);
		} else {
			closeNotification();
		}

		// Pending / Transferred
		section = $('.pending.list');
		if (pending.length > 0) {
			$.each(pending, function (key, value) {
				var element = $(value),
					id = element.data('id'),
					exists = false,
					total = users.Pending.User.length + users.Transferred.User.length;

				$.each(users.Pending.User, function(key, value) {
					if ((typeof value.ID === 'number' && parseInt(value.ID, 10) === id) || (typeof value.ID === 'string' && value.ID === id)) {
						exists = true;
						return false;
					}
				});

				$.each(users.Transferred.User, function(key, value) {
					if ((typeof value.ID === 'number' && parseInt(value.ID, 10) === id) || (typeof value.ID === 'string' && value.ID === id)) {
						exists = true;
						return false;
					}
				});

				if (!exists) {
					// Remove Chat
					// TODO Update Customer Status Indicator
				}

				if (total === 0) {
					clearUsers(section);
				}
			});
		} else {
			clearUsers(section);
		}

		// Add Visitors
		var sections = { Online: users.Online, Pending: users.Pending, Transferred: users.Transferred };
		if (showOfflineOperators === false) {
			sections.Staff = users.Staff;
		}

		$.each(sections, function(key, user) {
			if (user != null && user.User !== undefined) {
				updateUser(key, user.User);
			}
		});

	}

	// Sort
	sortOperators();

	// Selected Chat
	updateSelectedChat();

	// Check Empty
	var teamTotal = users.Staff.User.length;
	if (teamTotal) {
		$.each(users.Staff.User, function(key, value) {
			if (parseInt(value.ID, 10) === operator.id) {
				teamTotal = teamTotal - 1;
				return false;
			}
		});
	}

	if (!teamTotal && !users.Online.User.length && !users.Pending.User.length && !users.Transferred.User.length) {
		empty.show();
	} else {
		empty.hide();
	}

	if (complete) {
		complete();
	}

	if (websockets === false) {
		usersTimer = window.setTimeout(updateUsers, 10000);
	}
}

function convertAccessLevel(access) {
	var privilege = parseInt(access, 10);
	switch (privilege) {
		case -1:
		case 0:
			access = 'Full Administrator';
			break;
		case 1:
			access = 'Department Administrator';
			break;
		case 2:
			access = 'Limited Administrator';
			break;
		case 3:
			access = 'Sales / Support Staff';
			break;
		case 4:
			access = 'Guest';
			break;
	}
	return access;
}

function updateMessageAlert(id, operator, messages, previous) {
	var notify = $('.chat-list .visitor[data-id="' + id + '"][data-operator="' + operator + '"] .message-alert'),
		chat = $('.chat[data-id="' + id + '"][data-operator=' + operator + ']');

	messages = (messages !== undefined) ? parseInt(messages, 10) : 1;

	// Scroll Alert
	if (scrollAlertEnabled) {
		var scroll = chat.find('.scroll'),
			bottom = (scroll.length > 0) ? scroll[0].scrollTop + scroll.height() : 0,
			last = chat.find('.messages .message.left:not(.typing):last'),
			text = parseInt(notify.text(), 10),
			total = (isNaN(text)) ? messages : text + messages,
			element = 0;

		if (scroll.length > 0) {
			element = (last.length > 0) ? scroll[0].scrollTop + last.position().top : scroll[0].scrollTop;
		}

		if (previous > 0) {
			if (bottom < element) {
				// Scroll Alert
				var scrolltext = (total > 1) ? total + ' New Messages' : total + ' New Message';
				chat.find('.scrollalert a').text(scrolltext).parent().show();
			}

			if (!chat.is('.focussed') || (chat.is('.focussed') && bottom < element)) {
				setMessageAlert(id, operator, total);
			}
		}

		// Viewed Chat Messages
		$.each(activechats, function (key, activechat) {
			var viewedchat = _.find(viewed, function (chat) { return chat.id === activechat.id && chat.operator === (activechat.type === 1 ? true : false); });
			if (viewedchat !== undefined) {
				if (chat.is('.focussed') && bottom >= element) {
					viewedchat.viewed = activechat.message;
				}
				viewedchat.message = activechat.message;
			} else {
				viewed.push({id: activechat.id, operator: (activechat.type === 1 ? true : false), message: activechat.message, viewed: activechat.message});
			}
		});
		storage.set('viewed', viewed);

	} else if (!chat.is('.focussed')) {
		if (messages > 0) {
			messages = parseInt(notify.text(), 10) + messages;
			setMessageAlert(id, operator, messages, previous);
		} else {
			notify.hide();
		}
	}
}

function setMessageAlert(id, operator, messages, last) {

	var uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
	if (typeof id === 'string' && !uuidRegex.test(id)) {
		id = parseInt(id, 10);
	}

	if (messages > 0) {
		var alerts = storage.get('alerts');
		alerts = (alerts !== undefined && alerts instanceof Array) ? storage.get('alerts') : [];

		var chat = _.find(alerts, function (chat) { return chat.id === id && chat.operator == operator; });
		if (chat !== undefined) {
			if (last !== undefined) {
				if (chat.last !== false && typeof chat.last === 'number') {
					var unread = $('.chat-stack .chat[data-id=' + id + '][data-operator=' + operator + '] .message.left:not(.typing)').filter(function () { return $(this).data('id') > chat.last; });
					messages = unread.length;
				}
				last = _.min(unread, function (message) { return $(message).data('id'); });
				if ((chat.last === undefined || chat.last == false) && !_.isEmpty(last)) {
					chat.last = $(last).data('id');
				}
			}
			chat.alert = messages;
		} else {
			var alert = {id: id, operator: operator, alert: messages, last: false},
				chat = $('.chat[data-id=' + id + '][data-operator=' + operator + '] .messages');

			if (!chat.length) {
				var visitor = $('.chat-list .visitor[data-id=' + id + '][data-operator=' + operator + ']');
				if (visitor.length > 0) {
					chattingVisitorClickCallback.call(visitor, {}, true, undefined, true);
				}
			}

			var latest = $('.chat[data-id=' + id + '][data-operator=' + operator + ']').find('.message.left:not(.typing), .message.right:not(.typing)');
			latest = $(latest[latest.length - messages - 1]).data('id');
			if (latest !== undefined && typeof latest === 'number') {
				alert.last = latest;
			}

			alerts.push(alert);
		}

		if (messages > 0) {
			var notify = $('.chat-list .visitor[data-id="' + id + '"][data-operator="' + operator + '"] .message-alert');
			notify.text(messages).show();
			notify.parent().find('.name').css('font-weight', 400);

			var total = _.reduce($('.chat-list .visitor .message-alert'), function(memo, num){ return memo + parseInt($(num).text(), 10); }, 0);
			$(document).trigger('LiveHelp.MessageAlert', total);
		}

		storage.set('alerts', alerts);
	}
}

function showMessageAlerts() {
	var alerts = storage.get('alerts');
	alerts = (alerts !== undefined && alerts instanceof Array) ? storage.get('alerts') : [];
	$.each(alerts, function (key, value) {
		var chat = $('.chat-stack .chat[data-id="' + value.id + '"][data-operator="' + value.operator + '"]'),
			notify = chat.find('.message-alert');

		if (!chat.length) {
			var visitor = $('.chat-list .visitor[data-id=' + value.id + '][data-operator=' + value.operator + ']');
			if (visitor.length > 0) {
				chattingVisitorClickCallback.call(visitor, {}, true, undefined, true);
			}
		}

		notify.text(value.alert).show();
		notify.parent().find('.name').css('font-weight', 400);
	});
}

function resetMessageAlert(element, pubsub) {
	if (element.length > 0) {
		var id = element.data('id'),
			operator = element.data('operator'),
			notify = element.find('.message-alert'),
			messages = 0,
			alerts = storage.get('alerts');

		notify.fadeOut(function () {
			notify.text(messages);

			var total = _.reduce($('.chat-list .visitor .message-alert'), function(memo, num){ return memo + parseInt($(num).text(), 10); }, 0);
			$(document).trigger('LiveHelp.MessageAlert', total);
		});
		notify.parent().find('.name').css('font-weight', 200);

		alerts = (alerts !== undefined && alerts instanceof Array) ? storage.get('alerts') : [];
		if (!operator) {
			alerts = _.reject(alerts, function (chat) { return chat.id === id && chat.operator === operator; });
		} else {
			var chat = _.find(alerts, function (chat) { return chat.id === id && chat.operator === operator; });
			if (chat !== undefined) {
				chat.alert = 0;
			}

			var unread = $('.chat-stack .chat[data-id=' + id + '][data-operator=' + operator + '] .message.left:not(.typing)'),
				last = _.max(unread, function (message) {
					var id = $(message).data('id');
					if (typeof id === 'number') {
						return id;
					} else {
						return -1;
					}
				});

			if (!_.isEmpty(last)) {
				last = $(last).data('id');
				if (last !== undefined && last !== false && (chat.last == false || (typeof last === 'number' && chat.last < last))) {
					chat.last = last;
				}
			}
		}
		storage.set('alerts', alerts);

		if ($('.chat-stack .chat[data-id=' + id + '][data-operator=' + operator + ']').is('.focussed')) {
			var viewedchat = _.find(viewed, function (chat) { return chat.id === id && chat.operator == operator; });
			if (viewedchat !== undefined) {
				viewedchat.viewed = viewedchat.message;
				storage.set('viewed', viewed);
			}
		}

		if (id > 0 && pubsub === undefined && intercom !== false) {
			intercom.emit('message-alert', {id: id, operator: operator});
		}
	}
}

// Intercom.js
if (intercom !== false) {

	intercom.on('message-alert', function (data) {
		if (data.id > 0 && data.count !== undefined) {
			if (data.count === 0) {
				var element = $('.chat-list .visitor[data-id=' + data.id + '][data-operator=' + data.operator + ']');
				resetMessageAlert(element, false);
			} else {
				var viewedchat = _.find(viewed, function (chat) { return chat.id === data.id && chat.operator == data.operator; });
				if (viewedchat !== undefined) {
					viewedchat.count = data.count;
					updateMessageAlert(data.id, data.operator, data.count - viewedchat.count, data.viewed);
				}
			}
		}
	});
}

$.fn.chatScrollHandler = function (){
	$(this).on('scroll', _.debounce(function () {
		var chat = $(this).closest('.chat'),
			scrollalert = chat.find('.scrollalert'),
			visitor = $('.chat-list .visitor[data-id="' + chat.data('id') + '"][data-operator=' + chat.data('operator') + ']');

		if (scrollalert.is(':visible')) {
			var scroll = chat.find('.scroll'),
				bottom = scroll[0].scrollTop + scroll.height(),
				last = chat.find('.messages .message:not(.typing):last:parent'),
				element = scroll[0].scrollTop + last.position().top;

			if (bottom > element) {
				if (chat.is('.focussed')) {
					resetMessageAlert(visitor);
				}
				scrollalert.hide();
			}
		} else {
			if (chat.is('.focussed')) {
				resetMessageAlert(visitor);
			}
		}
	}, 250));
}

$.fn.getCursorPosition = function() {
	var el = $(this).get(0);
	var pos = 0;
	if ('selectionStart' in el) {
		pos = el.selectionStart;
	} else if ('selection' in document) {
		el.focus();
		var Sel = document.selection.createRange();
		var SelLength = document.selection.createRange().text.length;
		Sel.moveStart('character', -el.value.length);
		pos = Sel.text.length - SelLength;
	}
	return pos;
}

$.fn.selectRange = function(start, end) {
	if (!end) end = start;
	return this.each(function() {
		if (this.setSelectionRange) {
			this.focus();
			this.setSelectionRange(start, end);
		} else if (this.createTextRange) {
			var range = this.createTextRange();
			range.collapse(true);
			range.moveEnd('character', end);
			range.moveStart('character', start);
			range.select();
		}
	});
};

var selectedChat = false,
	chatMessages = [],
	channelMessages = [];

function saveMessage(id, focussing, autoOpen) {

	var stored = chatMessages,
		type = 'chat';

	if (typeof id === 'string') {
		stored = channelMessages;
		type = 'channel';
	}

	// Save Message
	var chat =  _.findWhere(stored, {id: id}),
		text = $('.messages.input #message'),
		previousChat = $('.chat-stack .' + type + '.focussed'),
		prev = $(previousChat).data('id'),
		operator = ($(previousChat).data('operator')) ? $(previousChat).data('operator') : false,
		cursor = 0;

	// Update Existing Item
	if (prev !== null && prev !== undefined) {
		stored = _.reject(stored, function (chat) { return chat.id == prev; });
		stored.push({id: prev, operator: operator, message: text.val(), cursor: text.getCursorPosition()});

		if (type == 'chat') {
			chatMessages = stored;
		} else {
			channelMessages = stored;
		}
	}

	stored = chatMessages;
	if (typeof focussing === 'string') {
		stored = channelMessages;
		type = 'channel';
	}

	chat =  _.findWhere(stored, {id: focussing})
	if (chat !== undefined && focussing !== prev) {
		// Display Saved Message
		text.val(chat.message);

		if (chat.cursor !== undefined) {
			cursor = chat.cursor;
			text.selectRange(cursor);
		}
	} else if ((autoOpen == false && selectedChat !== id) || type === 'channel') {
		text.val('');
	}
}

// Open Chat
function openChat(id, user, autoOpen, operator, message, trigger, callback) {

	operator = (operator !== undefined) ? operator : false;
	if (typeof user === 'string') {
		user = JSON.parse(user);
	}
	var visitor = $('.chat-list .visitor[data-id="' + id + '"][data-operator=' + operator + ']'),
		options = $('.chat-list .dropdown-menu.options');

	var type = (operator == true) ? 1 : 0;
	autoOpen = (autoOpen === undefined || !autoOpen) ? false : true;

	// Selection
	if (visitor.length > 0 && autoOpen == false) {
		$('.chat-list').find('.visitor.selected, .visitor.previous').removeClass('selected previous');
		visitor.addClass('selected');
		storage.set('selected-chat', {id: id, operator: operator});
	}

	// Open Chat Event
	if (visitor.length > 0 && message === undefined && trigger === undefined) {
		$(document).trigger('LiveHelp.OpenChat', {id: id, operator: operator});
	}

	// Close History
	closeHistory();

	// Save Message
	var channel = $('.chat-stack .channel.focussed'),
		previous = (channel.length > 0) ? channel.data('id') : false;

	if (!autoOpen) {
		saveMessage(previous, id, autoOpen);
	}

	// Viewed Chat
	var viewedchat = _.find(viewed, function (chat) { return chat.id === id && chat.operator == operator; }),
		count = (user !== undefined) ? parseInt(user.Messages, 10) : 0;

	if (viewedchat !== undefined && count > 0) {
		viewedchat.count = count;
		storage.set('viewed', viewed);
	}

	var stack = $('.chat-stack'),
		chats = stack.find('.chat'),
		size = (window.devicePixelRatio > 1) ? 300 : 150,
		html = App.templates.chat({id: id, styles: ((autoOpen == false) ? 'chat focussed' : 'chat'), operator: operator}),
		path = window.location.pathname,
		defaultImage = (server.length > 0) ? protocol + server + defaultUserImage : encodeURIComponent(window.location.protocol + '//' + window.location.host + path.replace(path.substring(path.indexOf(directoryPath + '/admin/')), defaultUserImage));

	// Add New Chat
	if (stack.length && !stack.find('.chat[data-id=' + id + '][data-operator=' + operator + ']').length) {

		$(html).prependTo(stack).find('.scroll').on('scroll', debouncedSaveScroll);
		if (websockets !== false) {
			updateMessages(callback);
		} else {
			// Open Chat Callback
			if (callback) {
				callback();
			}
		}

	} else {

		// Open Chat Callback
		if (callback) {
			callback();
		}
	}

	// Focus Chat
	if (autoOpen == false) {

		var input = $('.messages.input');
		if (operator) {
			input.addClass('operator').removeClass('guest');
		} else {
			input.addClass('guest').removeClass('operator');
		}

		stack.find('.chat.focussed, .channel.focussed, .chat:not(.chat[data-id="' + id + '"][data-operator=' + operator + '])').removeClass('focussed').hide();
		stack.find('.chat[data-id="' + id + '"][data-operator=' + operator + ']').addClass('focussed').show();
		selectedChat = id;

		var list = $('.list');
		list.find('.visitor, .channel').removeClass('selected previous');
		list.find('.visitor[data-id="' + id + '"][data-operator=' + operator + ']').addClass('selected previous');

		stack.find('.chat.unfocussed, .channel.unfocussed').removeClass('unfocussed');

		// Scroll
		scrollToBottom(id, operator, true, false);
	}

	// Open Chat Stack
	var chat = stack.find('.chat[data-id=' + id + '][data-operator=' + operator + ']'),
		name = 'Guest',
		hash = '';

	// Remove Message Alert
	if (!chat.find('.scrollalert').is(':visible') && chat.is('.focussed')) {
		resetMessageAlert(visitor);
	}

	if (user !== undefined) {
		if (user.Firstname !== undefined) {
			name = ucwords(user.Firstname);
		} else {
			name = ucwords(user.Name);
		}
		hash = CryptoJS.MD5(user.Email);
	}
	var title = (user !== undefined && user.Email.length > 0) ? name + ' - ' + user.Email : name,
	userImage = (gravatar) ? "https://secure.gravatar.com/avatar/" + hash + "?s=50&r=g&d=" + defaultImage : defaultImage;

	// Scroll Event
	chat.find('.scroll').chatScrollHandler();

	// Title
	if (operator) {
		var account = false;
		$.each(accounts, function (key, value) {
			if (parseInt(value.ID, 10) === user.ID) {
				account = value;
				return false;
			}
		});
		if (account !== false && account.Firstname !== undefined && account.Lastname !== undefined) {
			title = ucwords(account.Firstname + ' ' + account.Lastname);
		} else if (user.Firstname !== undefined ) {
			title = ucwords(user.Firstname);
		}
	}

	// Operator Image
	if (account !== false && user !== undefined) {
		userImage = operatorImage(id, user.Email, 30, true);
	}

	var email = chat.find('.status .email');
	if (user !== undefined) {
		email.attr('href', 'mailto:' + user.Email).text(user.Email).show();
	} else {
		email.hide();
	}

	chat.find('.name').text(name).hide();
	chat.find('.status .name').text(name).show();
	chat.find('.inputs').show();
	chat.find('.title span.title').text(title);
	chat.find('.header .title span.image').css('background-image', "url('" + userImage + "')");
	chat.data('closed', false);

	if (autoOpen == false) {
		// Hide Containers
		$('.statistics.container, .history.container, .responses.slider, .accounts.slider, .settings.container').hide();

		// Show Chat
		if (!stack.is(':visible')) {
			chat.click();
			stack.show();
		} else {
			if (chat.is('.focussed')) {
				stack.find('#message').focus();
			} else {
				chat.click();
			}
		}
	}

	// Update Typing
	/*
	var typingstatus = stack.find('.typing');
	$.each(activechats, function(key, value) {
		if (value.id !== undefined && value.id == id && value.typing) {
			typingstatus.show();
			return false;
		} else {
			typingstatus.hide();
		}
	});
	*/

	// Close Smilies
	stack.find('.smilies.button').close();

	// Check Blocked Chat
	checkBlocked(id);

	// Clear Message Alert
	var visitor = $('.visitor[data-id=' + id + '][data-operator=' + operator + ']'),
		alert = visitor.find('.message-alert'),
		messages = parseInt(visitor.data('messages'), 10) + parseInt(alert.text(), 10);

	visitor.data('messages', messages);

}

// Close Chat
function closeChats() {
	var stack = $('.chat-stack'),
		height = stack.height();

	// Close Smilies
	$('.chat-stack .smilies.button').close();

	// Close Chats
	stack.animate({top:-height, bottom:30 + height}, 250);
	return false;
}

// Pending Notification
function showPendingNotification(users) {
	var alert = $('.notification'),
		title = locale.pendingchat,
		notify = '',
		name = '',
		server = '';

	if (users.length > 1) {
		title = 'Pending Chats';
		notify = users.length + ' visitors are pending to chat';
	} else if (users.length === 1) {
		name = ucwords(users[0].Name.toLowerCase());
		server = users[0].Server;
		if (server.length > 0) {
			if (locale.pendingchatdescription !== undefined) {
				notify = locale.pendingchatdescription.replace('{name}', name);
			} else {
				notify = name + ' is pending to chat at ' + server;
			}
		} else {
			if (locale.pendingchatdescription !== undefined) {
				notify = locale.pendingchatdescription.replace('{name}', name);
			} else {
				notify = name + ' is pending to chat';
			}
		}
	}

	alert.off('click');
	alert.on('click', function () {
		if (users.length === 1) {
			var id = (typeof users[0].ID === 'number') ? parseInt(users[0].ID, 10) : users[0].ID;
			if (id > 0) {
				acceptChat(id);
			}
		}
	});

	// Show Notification
	if (notify.length > 0) {
		if (alert.find('.icon ChatNotification').length === -1) {
			alert.find('.icon').addClass('sprite ChatNotification');
		}
		alert.find('.notify').text(notify);
		showNotification({title: title, text: notify, users: users});
	}
}

// Notification
var notificationUsers = [];
function showNotification(obj) {

	var shown = false;
	$.each(obj.users, function (key, value) {
		var id = parseInt(value.ID, 10),
			exists = false;

		$.each(notificationUsers, function (index, user) {
			if (id === user) {
				exists = true;
				return false;
			}
		});

		if (!exists) {
			notificationUsers.push(id);
		} else {
			shown = true;
		}
	});
	if (!shown) {
		if (notification) {
			$('.notification').animate({ top: -20 }, 250, 'easeInOutBack');
		}
		$(document).trigger('LiveHelp.Notification', obj);
	}
}

function closeNotification() {
	notificationUsers = [];
	var alert = $('.notification'),
		top = parseInt(alert.css('top'), 10);

	if (top >= -20) {
		alert.animate({top:-80}, 500, 'easeInOutBack');
	}
}

function sendMessage(message, id) {
	var stack = $('.chat-stack'),
		textarea = stack.find('textarea'),
		chat = stack.find('.chat.focussed'),
		everyone = stack.find('.channel.everyone'),
		text = (message !== undefined) ? message : textarea.val();

	if (textarea.is('.disconnected')) {
		return false;
	}

	if (id !== undefined || chat.length > 0) {
		var staff = 0,
			post = {'Message': text};

		if (chat.length > 0 && !id) {
			id = chat.data('id');
			staff = (chat.data('operator') !== false) ? 1 : 0;
		}

		if ((typeof id === 'number' && id > 0) || (typeof id === 'string' && id.length === 36)) {
			$(document).trigger('LiveHelp.SendMessage', {from: operator.id, to: id, message: text});

			var account = false;
			$.each(accounts, function (key, value) {
				if (parseInt(value.ID, 10) === operator.id) {
					account = value;
					return false;
				}
			});

			// Display Message
			var status = 1,
				unique = uuid.v4(),
				message = messageHTML(unique, status, text, new moment(), operator.id, operator.username, account.Firstname, operator.email, id, true, 0),
				last = chat.find('.message').last().data('id');

			displayMessages(id, chat.data('operator'), chat, message.html, status, 0, last, false, false, message.tweets);

			var sentSuccess = function(chat, uuid) {
				return function (data) {

					var id = (typeof data.ID === 'number') ? parseInt(data.ID, 10) : data.ID,
						message = chat.find('.message[data-id="' + uuid + '"]');

					if (message.length > 0) {
						message.data('id', id).attr('data-id', id).removeClass('sending');
					}
				};
			};

			$.extend(post, { ID: id, UUID: unique, Staff: staff });
			apiRequest({
				url: apiEndpoint.send,
				data: post,
				success: sentSuccess(chat, unique)
			});
		} else if (typeof id === 'number' && id < 0) {
			$(document).trigger('LiveHelp.SendMessage', {from: operator.id, id: id, message: text});
		}

	} else if (everyone.length > 0) {
		$(document).trigger('LiveHelp.SendMessage', {from: operator.id, channel: 'everyone', message: text});
	}

	textarea.val('');
	textarea.keyup();

	return false;
}

function sendCommand(id, type, name, content) {
	var post = {'ID': id};

	type = (type !== undefined) ? type : '';
	name = (name !== undefined) ? name : '';
	content = (content !== undefined) ? content : '';
	$.extend(post, {'Type': type, 'Name': name, 'Content': content, 'Staff': '0'});

	apiRequest({
		url: apiEndpoint.send,
		data: post,
		success: function (data) {
			//console.log(data);
		}
	});

	return false;
}

function filterResponses() {
	var keyword = $('#responses #search').val(),
		keywords = (keyword !== undefined && keyword.length > 0) ? keyword.split(' ') : '',
		success = [],
		failure = [],
		types = ['Text', 'Hyperlink', 'Image', 'PUSH', 'JavaScript'];

	if (keywords.length > 0) {
		$.each(responses, function(type, value) {
			if ($.inArray(type, types) > -1) {
				$.each(value, function(key, response) {
					var id = parseInt(response.ID, 10),
					found = false;

					$.each(keywords, function(key, word) {
						if (response.Name.toLowerCase().indexOf(word) > -1 || response.Content.toLowerCase().indexOf(word) > -1) {
							found = true;
							return false;
						}
					});

					if (found) {
						success.push(id);
					} else {
						failure.push(id);
					}
				});
			}
		});
	}

	if (responses.length === 0) {
		success.push(failure);
	}

	var elements = $('#responses .response');
	if (success.length === 0 && failure.length === 0) {
		elements.show();
	} else {
		$.each(success, function(key, value) {
			if (value.length > 0) {
				elements.filter('[data-id=' + value + ']').show();
			}
		});

		$.each(failure, function(key, value) {
			if (value.length > 0) {
				elements.filter('[data-id=' + value + ']').hide();
			}
		});
	}
}

function processEscKeyDown() {
	var sliders = $('.slider.right'),
		visitor = $('#visitor-details'),
		account = $('#account-details'),
		settings = $('#settings'),
		accountgrid = $('.accounts-grid'),
		zindex = 0,
		top = null;

	// Close Settings
	if (settings.height() > 0 && settings.width() > 0) {
		closeSettings();
		return;
	}

	// Close Right Sliders
	$.each(sliders, function (key, value) {
		var element = $(value),
			i = parseInt(element.css('z-index'), 10);

		if (element.width() > 0 && i > zindex) {
			top = element;
			zindex = i;
		}
	});

	// Close Slider
	if (top !== null) {
		var id = top.attr('id'),
			menu = '';

		switch (id) {
			case 'responses':
				closeResponses();
				menu = id;
				break;
			case 'visitor-details':
				closeVisitor();
				break;
			case 'account-details':
				if (accountgrid.is(':visible') === false) {
					showAccounts();
				}
				if (account.is(':visible') && account.width() > 0) {
					closeAccount();
				}
				menu = 'accounts';
				break;
			case 'history-chat':
				closeHistory();
				menu = 'history';
				break;
		}

		$(document).trigger('LiveHelp.CloseSlider', {menu: menu, previousMenu: previousMenu});

		return;
	}

	// Close Chats
	if (parseInt($('.chat-stack').css('top'), 10) === 0) {
		closeChats();
		return;
	}
}

var responses = {},
	tags = [];

function updateResponses(responses) {

	if ($('#responses').length) {
		var element = $('#responses .scroll #response-list'),
			types = ['Text', 'Hyperlink', 'Image', 'PUSH', 'JavaScript', 'Other'],
			sections = {};

		element.html('');

		$(document).trigger('LiveHelp.ResponsesUpdated', responses);

		if ((responses.Text !== undefined && responses.Text.length > 0) || (responses.Hyperlink !== undefined && responses.Hyperlink.length > 0) || (responses.Image !== undefined && responses.Image.length > 0) || (responses.PUSH !== undefined && responses.PUSH.length > 0)) {

			// Hide Empty
			$('.responses .empty').hide();

			$.each(responses, function(type, value) {
				if ($.inArray(type, types) > -1) {
					var origtype = (type === 'PUSH' || type === 'Hyperlink') ? '<span style="position: absolute; right: 40px">' + type + '</span>' : '';
					type = type.toLowerCase();
					$('<div class="' + type + '" />').appendTo(element);
					if (sections[type] === undefined) {
						sections[type] = $('#response-list .' + type);
					}
					var menu = $('.chat-list .options.dropdown-menu .' + type);
					if (value.length > 0 && menu.find('ul').length === 0) {
						menu.addClass('dropdown-submenu');
						$('<ul class="dropdown-menu"></ul>').appendTo(menu);
					}
					menu = menu.find('.dropdown-menu');

					// Custom Responses
					var custom = false;
					if (value.length > 0 && value[0].Custom !== undefined) {
						value = value[0].Custom;
						custom = true;
					}

					$.each(value, function(key, response) {
						if (key == 'Description') {
							var optionsmenu = $('.chat-list .options.dropdown-menu'),
								parent = optionsmenu.find('.other.menuitem');

							parent.find('> a').text(response);
							parent.show();
							optionsmenu.find('.other.divider').show();
						} else {
							var id = parseInt(response.ID, 10),
								tag = '',
								css = 'display: none',
								content = response.Content,
								submenu = $('<li class="responseitem submenu"><a href="#">' + response.Name + '</a></li>');

							submenu.data('response', response);
							if (response.Category.length > 0) {
								var menus = menu.find('li.' + type + '.category a'),
									exists = false;

								$.each(menus, function(key, value) {
									var category = $(value);
									if (category.text() === response.Category) {
										exists = category;
										return;
									}
								});
								if (!exists) {
									var category = $('<li class="' + type +' category dropdown-submenu"><a href="#">' + response.Category + '</a><ul class="dropdown-menu"></ul></li>');
									submenu.appendTo(category.find('.dropdown-menu'));
									category.appendTo(menu);
								} else {
									submenu.appendTo(exists.parent().find('ul.dropdown-menu'));
								}
							} else {
								submenu.appendTo(menu);
							}

							if (response.Tags !== undefined) {
								if (response.Tags.length > 0) {
									$.each(response.Tags, function(key, tag) {
										tag = tag.toLowerCase();
										if ($.inArray(tag, tags) === -1) {
											tags.push(tag);
										}
									});
									css = 'display: inline-block';
									tag = response.Tags.join(', ');
								} else {
									css = 'display: none';
								}
							}

							content = content.replace(/^(https?|ftp|file):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[A-Z0-9+&@#\/%=~_|](\.jpg|.jpeg|\.gif|\.png)$/img, '<img src="$&" style="max-width: 300px"/>');

							var dropdown = '<div class="btn-group send"><div class="dropdown-toggle" data-toggle="dropdown"><span class="title">' + response.Name + origtype + '</span> <span class="caret sprite sort-desc"></span></div><ul class="dropdown-menu send-response"><li class="dropdown-header">Send Message To</li><li class="none">No Available Chats</li></ul></div>';

							$('<div class="response" data-id="' + id + '"><div class="label">' + dropdown + '</div><div class="edit sprite Edit" title="Edit Response"></div><div class="content">' + content + '</div><div class="tags"><span class="tag-icon" style="' + css + '"></span><span class="tag">' + tag + '</span></div></div>').appendTo(sections[type]);
							$('.dropdown-toggle').dropdown();
						}
					});
				}
			});
		} else {
			clearResponses();
		}
	}
}

function clearResponses() {
	$('#responses .scroll #response-list .response').remove();
	$(document).trigger('LiveHelp.ClearResponses');
}

function loadResponses() {
	if (session.length > 0) {
		// Responses AJAX
		apiRequest({
			url: apiEndpoint.responses,
			success: function (data) {
				// Responses JSON
				if (data !== undefined && data.Responses !== undefined) {
					responses = data.Responses;
					updateResponses(responses);
				} else {
					clearResponses();
				}
			},
			error: function () {
				clearResponses();
			}
		});
	}
}

function updateTotal(element, total) {
	var id = element.attr('id'),
		current = parseInt(element.data('total'), 10);

	if (total !== current) {
		element.animate({height: 0}, 350, 'easeInOutBack', function () {
			element.text(total);
			element.animate({height: 38}, 350, function () {
				element.data('total', total);
			});
		});

		if (id == 'visitortotal') {
			$(document).trigger('LiveHelp.UpdateVisitorsTotal', total);
		} else {
			$(document).trigger('LiveHelp.UpdateChatsTotal', total);
		}
	}
}

function toggleChatMenu(menu, height, manual) {
	var css = 'expander sprite sort-desc',
		id = menu.attr('id');

	if (height > 0) {
		css = 'expander sprite sort-asc';
	}
	storage.set(id + '.height', height);

	if (height > 0 && saveExpanded || manual) {
		menu.animate({height:height}, 250, 'easeOutBack', function () {
			var expanded = false;
			if (height > 0) {
				menu.show();
				expanded = true;
			} else {
				menu.hide();
			}
			$(this).prev().attr('aria-expanded', expanded);
			$(this).prev().find('.expander').removeAttr('class').addClass(css);
		});
	} else {
		menu.prev().attr('aria-expanded', true);
		menu.prev().find('.expander').removeAttr('class').addClass(css);
	}

}

var openHistoryCallback = function (history) {};

function openHistory() {
	$(document).trigger('LiveHelp.HistoryOpened');

	$('.visitors.container, .statistics.container, .responses.slider, .accounts.slider, .settings.container, .chat-stack').hide();
	var history = $('.history.container').show();
	if (historyChartData.length > 0) {
		showHistoryChart();
	}
	openHistoryCallback(history);
	initHistoryGridEvents();
	initHistoryGrid();
}

function openStatistics() {
	$('.visitors.container, .history.container, .responses.slider, .accounts.slider, .settings.container, .chat-stack').hide();
	$('.statistics.container').show();
	if (ratingChartData.length > 0) {
		showRatingChart();
	}
	if (weekdayChartData.length > 0) {
		showWeekdayChart();
	}
	closeHistory();
}

var openIntegrations = function () {
	openSettings('integrations');
	return 'settings/integrations';
};

var previousMenu = 'home';

function switchMenu(type) {
	var route = false;

	// Switch Menu
	switch (type) {
		case 'home':
			openHome();
			previousMenu = type;
			route = type;
			break;
		case 'statistics':
			openStatistics();
			previousMenu = type;
			route = type;
			break;
		case 'history':
			openHistory();
			previousMenu = type;
			route = type;
			break;
		case 'responses':
			openResponses();
			route = type;
			break;
		case 'accounts':
			openAccounts();
			route = type;
			break;
		case 'settings':
			openSettings();
			var current = $('.settings.dropdown .settingsmenu .selectedLava').attr('id');
			if (current !== undefined && current.length > 0) {
				route = 'settings/' + current;
			} else {
				route = type;
			}
			break;
		case 'integrations':
			route = openIntegrations();
			break;
	}

	$(document).trigger('LiveHelp.MenuChanged', type);

	// Route
	if (route !== false && route.length > 0) {
		storage.set('route', route);
		router.setRoute(route);

		$(document).trigger('LiveHelp.RouteChanged');
	}

}

function switchPreviousMenu() {
	// Reset Popout
	var route = storage.get('route');
	storage.set('route', '');

	// Select Previous Menu
	if (previousMenu.length > 0 && previousMenuEnabled) {
		router.setRoute(previousMenu);
		$(document).trigger('LiveHelp.RouteChanged');
	}

}

// Settings
function loadLocalSettings() {

	// Viewed Chats
	viewed = storage.get('viewed');

	// Popout
	var route = storage.get('route');
	if (route.length > 0) {
		switch (route) {
			case 'responses':
				openResponses();
				break;
			case 'accounts':
				openAccounts();
				break;
			case 'settings':
				openSettings();
				break;
		}

		if (route.indexOf('settings/') > -1) {
			var section = route.replace('settings/', '');
			openSettings(section);
		}

		router.setRoute(route);
		$(document).trigger('LiveHelp.RouteChanged');
	}
}


var session = '',
	factor = '',
	error = false;

function signInComplete() {

	// Complete Login
	$('.login, .loading').fadeOut(250, function() {
		$('.login').hide();
	});
	$('.content').filter(':not(.loading)').show().animate({opacity: 1.0}, 250);

	// Notification
	$(document).trigger('LiveHelp.SignInCompleted');

	// Setup Sounds
	if (messageSound === undefined) {
		messageSound = new buzz.sound(address + '/sounds/New Message', {
			formats: ['ogg', 'mp3', 'wav'],
			volume: 100
		});
	}
	if (pendingSound === undefined) {
		pendingSound = new buzz.sound(address + '/sounds/Pending Chat', {
			formats: ['ogg', 'mp3', 'wav'],
			volume: 100
		});
	}

	// Update Operator Details
	var operator = storage.get('operator'),
		account = false,
		size = (window.devicePixelRatio > 1) ? 300 : 150;

	if (accounts === undefined) {
		accounts = storage.get('accounts');
	}
	$.each(accounts, function (key, value) {
		if (parseInt(value.ID, 10) === operator.id) {
			account = value;
			return false;
		}
	})

	if (operator !== undefined) {
		var image = operatorImage(operator.id, account.Email, size);
		if (account !== false && account.Image !== undefined && account.Image.indexOf('https://') > -1) {
			image = account.Image;
		}
		$('.operator .photo').css({'background': 'url(' + image + ') #fcfcfc', 'background-size': '50px auto'});
		$('.operator .name').text(operator.name);
	}

	// Operator Access
	if (operator.access > 3) {
		$('.menu a[data-type=statistics]').parent().hide();
		$('.menu a[data-type=history]').parent().hide();
		$('.menu a[data-type=accounts]').parent().hide();
	}

	$(document).trigger('LiveHelp.SignInComplete', { account: operator, server: server });

	// Clear Login
	$('.login').find('input[type!=reset][type!=submit], select').val('');

	// Local Settings
	loadLocalSettings();

	// Settings AJAX
	apiRequest({
		url: apiEndpoint.settings,
		success: function (data) {
			// Settings JSON
			if (data.Settings !== undefined) {
				loadSettings(data.Settings);

				// Update Users
				updateUsers(undefined, undefined, function () {
					updateMessages();
				});

				$(document).trigger('LiveHelp.SettingsInitialised', data.Settings);
			}
		}
	});

	// Update Messages
	updateMessages();

	// Update Visitors
	updateVisitorsGrid();

	// Statistics Chart
	loadStatisticsChartData();

	// Accounts
	initAccountsGrid(false);

	// Responses
	loadResponses();

	// World Map / Locations
	try {
		initWorldMap();
	} catch(e) {

	}

}

var closeChatClosingCallback = function () {
	// Show Dialog
	var confirm = $('.chat-stack .confirm-close.dialog');
	confirm.find('.progressring').css('opacity', 0).hide();
	confirm.find('.buttons').show();
	confirm.show().animate({bottom: 0}, 250, 'easeInOutBack');
}

function toggleEmptyChats() {
	var empty = $('.chat-list .empty');

	// Empty Chats
	if (!$('.chat-list .visitor').length) {
		empty.show();
	} else {
		empty.hide();
	}
}

var closeChatCompletedCallback = function (id, chats) {
	// Hide Dialog
	var dialog = $('.chat-stack .confirm-close.dialog');
	dialog.animate({bottom: '-90px'}, 250, function () {
		$(this).hide();
	});

	var selector = '[data-id=' + id + '][data-operator=false]';
	if (chats.length > 1) {
		chats.filter(selector).remove();
	} else {
		chats.remove();
		closeChats();
	}

	$('.chat-list .visitor' + selector).remove();
	$('.chat-stack').hide();

	toggleEmptyChats();
}

function closeChat() {
	// Closing Event
	closeChatClosingCallback();
}

function blockChat() {
	var chats = $('.chat-stack .chat'),
		move = [],
		id = $('.chat-list .visitor.selected').data('id'),
		chat = $('.chat-stack .chat[data-id=' + id + ']');

	if (chat !== null) {
		// Show Dialog
		var dialog = $('.chat-stack .dialog');
		dialog.find('.progressring img').attr('src', 'images/ProgressRing.gif');
		dialog.find('.title').text('Blocking Chat Session');
		dialog.find('.description').text('One moment while the chat session is blocked.');
		dialog.show().animate({bottom: '1px'}, 250);

		// Block Chat AJAX
		updateUsers('Block', id, function () {
			// Hide Dialog
			dialog.find('.progressring img').attr('src', 'images/Block.png');
			dialog.find('.unblock').fadeIn();
			dialog.find('.title').text('Chat Session Blocked');
			dialog.find('.description').text('The chat session is blocked and inactive.');

			var chat = null,
				exists = false,
				chats = [];

			$.each(activechats, function (key, message) {
				if (message.id === id) {
					chat = message;
				} else {
					chats.push(message);
				}
			});
			activechats = chats;

			$.each(blockedchats, function (key, message) {
				if (message.id === id) {
					exists = true;
					return;
				}
			});

			if (!exists) {
				// Blocked Chat
				if ($.inArray(id, blockedchats) === -1) {
					blockedchats.push(chat);
				}
			}

		});
	}
}

function unblockChat(id, dialog) {
	var blocked = [];

	// Update Dialog
	dialog.find('.progressring img').attr('src', 'images/ProgressRing.gif');
	dialog.find('.title').text('Unblocking Chat Session');
	dialog.find('.description').text('One moment while the chat session is unblocked.');

	// Unlock Chat AJAX
	updateUsers('Unblock', id, function () {

		// Hide Dialog
		dialog.find('.progressring img').fadeOut();
		dialog.find('.title').text('Chat Session Unblocked');
		dialog.find('.description').text('The chat session is nunblocked and can now request Live Chat.');
		dialog.animate({bottom: '1px'}, 250, function () {
			dialog.find('.unblock').hide();
			dialog.hide();
		});

		// Remove Blocked Chat
		$.each(blockedchats, function (key, chat) {
			if (chat.id === id) {
				exists = true;
				return;
			} else {
				blocked.push(chat);
			}
		});
		blockedchats = blocked;
	});

}

function emailChat(id, email) {
	// Email Chat AJAX
	apiRequest({
		url: apiEndpoint.emailchat,
		data: {'ID': id, 'Email': email},
		success: function (data) {
			// TODO Email Chat Result
		}
	});
}

var operatorImage = function(id, email, size, round, override) {
	var settings = {size: size},
		defaultimage = address + 'images/User.png',
		hash = CryptoJS.MD5(email);

	if (id !== undefined && id !== false) {
		settings.id = id;
	}
	if (round !== undefined && round !== false) {
		settings.round = true;
	}
	if (override !== undefined && override !== false) {
		settings.override = true;
	}

	return 'https://secure.gravatar.com/avatar/' + hash + '?s=' + size + '&r=g&d=' + defaultimage;
}

function signInError(xhr, element) {
	var text = '',
		login = $('.login, .inputs'),
		error = $('.login .signin .signin.error .text'),
		security = $('.login .signin div.twofactor.signin'),
		backup = $('.login .signin div.twofactor.disable');

	login.find('.logo').removeClass('loading');

	if (backup.is(':visible')) {
		error = backup.find('.signin.error .text');
		if (element !== undefined) {
			error = element;
		}
	} else if (security.is(':visible')) {
		text = 'Invalid Security Code';
		error = security.find('.error .text');
	} else {
		if (xhr.status === 503 && xhr.statusText === 'License Invalid') {
			text = 'License Invalid';
			cache = true;
		} else if (xhr.getResponseHeader('X-Disabled') === '*') {
			text = 'Account Disabled';
		} else {
			text = 'Incorrect Username / Password';
		}
	}

	signInErrorCallback('Sign In Error', text, error);
}

var signInErrorCallback = function showSignInError(title, text, element) {
	var login = $('.login, .inputs'),
		error = (element !== undefined) ? element : $('.login .signin .signin.error .text');

	if (error.length > 0) {
		error.text(text);
	}

	if (error.parent().is('.backup.error')) {
		login.find('.signin.error').hide();
	} else {
		login.find('.backup.error').hide();
	}
	error.parent().fadeIn();

	login.show().find('.inputs, .logo').effect('shake', {times: 3, distance: 10}, 150);
	error = true;
};

var signInCallback = function () { return true; },
	signInTwoFactorCallback = function () {
		// Show Two Factor Security Code
		if ($('.login #username').val().length > 0 && $('.login #password').val().length > 0) {
			$('.login .signin.form, .login .error, .loading').hide();
			$('.login, .login .twofactor.form').show().find('#security').focus();
		} else {
			$('.login, .login .signin.form').show();
		}
	};

function signIn() {

	var result = signInCallback();
	if (result) {

		var login = $('.login'),
			path = window.location.pathname,
			serverinput = (login.find('#server').length) ? login.find('#server').val() : '';

		protocol = login.find('#ssl').is(':checked') ? 'https://' : 'http://';
		login.find('.logo').addClass('loading');

		if (storage.get('server').length > 0) {
			server = storage.get('server');
			protocol = storage.get('protocol');
		}

		if (document.location.protocol == 'https:') {
			protocol = 'https://';
			storage.set('protocol', protocol);
		}

		server = (server !== undefined && server.length > 0) ? server : document.location.host;
		if (serverinput.length > 0) {
			server = serverinput;
		}

		var modulefolder = document.location.pathname.indexOf('/modules/livehelp/admin'),
			subfolder = document.location.pathname.indexOf('/livehelp/admin');

		if (modulefolder > -1) {
			path = document.location.pathname.substring(0, modulefolder);
			address = protocol + server + path + '/modules' + directoryPathName;
		} else if (subfolder > -1) {
			path = document.location.pathname.substring(0, subfolder);
			address = protocol + server + path + directoryPathName;
		} else {
			address = protocol + server + directoryPathName;
		}

		// Router
		router.init();

		$(document).trigger('LiveHelp.SignIn');

		var user = (login.find('#username').length) ? login.find('#username').val() : '',
			pass = (login.find('#password').length) ? login.find('#password').val() : '',
			status = (login.find('#status').length) ? login.find('#status').val() : '',
			security = login.find('#security'),
			backupcode = login.find('#backupcode'),
			post = {};

		if (security.is(':visible')) {
			if (security.val().length == 6) {
				post = $.extend(post, {'Data': $.toJSON({'code': security.val()})});
				$('.login .twofactor.form .error').hide();
			} else {
				$('.login .twofactor.form .error').fadeIn();
				$('.login .inputs, .login .logo').effect('shake', {times: 3, distance: 10}, 150);
				return;
			}
		} else if (backupcode.is(':visible')) {
			user = login.find('.twofactor.form #username').val();
			pass = login.find('.twofactor.form #password').val();
			if (backupcode.val().length == 24) {
				$.extend(post, {'Data': $.toJSON({'backupcode': backupcode.val()})});
				$('.login .twofactor.form .error').hide();
			} else {
				$('.login .twofactor.form .backup.error').fadeIn();
				$('.login .inputs, .login .logo').effect('shake', {times: 3, distance: 10}, 150);
				return;
			}
		}

		if (user.length > 0 && pass.length > 0) {
			$.extend(post, {'Username': user, 'Password': pass, 'Action': status, 'Version': '5.0'});
		} else {
			server = storage.get('server');
			protocol = storage.get('protocol');
		}

		if (server.length === 0) {
			var path = (document.location.pathname.indexOf(directoryPath) > 0) ? document.location.pathname.substring(0, document.location.pathname.indexOf(directoryPath)) : '';
			server = document.location.host + path;
		}

		if (cache) {
			$.extend(post, {'cache': ''});
		}

		apiRequest({
			url: apiEndpoint.login,
			data: post,
			success: function (data) {
				// Hide Loading
				$('.login .logo').removeClass('loading');

				// Login JSON
				if (data.Login !== undefined) {

					// Operator Session
					if (data.Login.Session !== undefined) {
						// Operator Session
						session = data.Login.Session;

						if (session !== false && session.length > 0) {

							// Username / Password
							operator = {id: data.Login.ID, username: user, name: data.Login.Name, email: data.Login.Email, access: parseInt(data.Login.Access, 10), status: data.Login.Status};

							if (data.Login.Datetime !== undefined) {
								operator.datetime = data.Login.Datetime;
							}

							if (data.Login.Customer !== undefined) {
								operator.customer = {
									company: data.Login.Customer.Company,
									plan: data.Login.Customer.Plan,
									datetime: data.Login.Customer.Datetime
								}
							}

							if (data.Login.Users !== undefined) { operator.users = data.Login.Users; }
							if (data.Login.Messages !== undefined) { operator.messages = data.Login.Messages; }
							if (data.Login.TeamMessages !== undefined) { operator.teammessages = data.Login.TeamMessages; }
							if (data.Login.Chats !== undefined) { operator.chats = data.Login.Chats; }
							if (data.Login.Devices !== undefined) { operator.devices = data.Login.Devices; }
							if (data.Login.Hash !== undefined) { operator.hash = data.Login.Hash; }

							// Account
							if (data.Login.Account !== undefined) {
								operator.account = data.Login.Account;
							}

							$(document).trigger('LiveHelp.LoginComplete', session);

							// Sign In / Saved Session
							storage.set('protocol', protocol);
							storage.set('server', server);
							storage.set('session', session);
							storage.set('operator', operator);

							// Complete Sign In
							signInComplete();

							// Update Status Mode
							var status = 'Offline';
							switch(data.Login.Status) {
								case 1:
									status = 'Online';
									break;
								case 2:
									status = 'BRB';
									break;
								case 3:
									status = 'Away';
									break;
							}

							status = (status === 'BRB') ? 'Be Right Back' : status;
							$('.operator .dropdown-toggle .status').text(status);

							if (status === 'Be Right Back') {
								status = 'BRB';
							} else if (status === 'Offline') {
								status = 'Offline';
							}
							$('.operator .mode').removeClass('online offline hidden brb away').addClass(status.toLowerCase());

						} else if (data.Login.OTP !== false) {

							// Two Factor Callback
							signInTwoFactorCallback();

							$(document).trigger('LiveHelp.LoginTwoFactor');

						} else if (data.Login.OTP === false) {
							var element = $('.login .signin .backup.error .text');
							signInError(false, element);
						} else {
							signInError();
						}

					}

				}
			},
			error: function (xhr, textStatus, thrownError) {
				signInError(xhr);
			}
		});
	}
}

var signOutCallback = function () {
	document.location.href = opts.location;
}

function signOut() {

	// Reset Authentication
	session = '';
	storage.set('protocol', '');
	storage.set('server', '');
	storage.set('session', '');
	storage.set('accounts', '');
	storage.set('operator', '');

	// Notification
	$(document).trigger('LiveHelp.SignOut');

	// Refresh
	signOutCallback();

	// Remove Visitors
	$('.chat-list .visitor, .chat-stack .chat').remove();

	// Hide Loading
	$('.loading, .settings.container').hide();

	// Hide Content / Show Login
	$('.content').filter(':not(.loading)').animate({opacity: 0}, 250);
	$('.login').show().fadeIn();

}

var messageSound,
	pendingSound;

function convertHostname(value) {
	var hostname = value.Hostname,
		username = ucwords(value.Username);
	if (username !== null && username.length > 0) {
		hostname = username + ' - ' + hostname;
	}
	return hostname;
}

function convertBrowserIcon(value, small) {
	var browser = 'Chrome',
		image = '',
		css = 'chrome',
		size = 48;

	if (value.indexOf('MSIE') !== -1 || value.indexOf('Trident/') !== -1) {
		browser = 'InternetExplorer';
		css = 'ie';
	} else if (value.indexOf('Edge/') !== -1) {
		browser = 'Edge';
		css = 'edge';
	} else if (value.indexOf('Chrome') !== -1) {
		browser = 'Chrome';
		css = 'chrome';
	} else if (value.indexOf('Opera') !== -1) {
		browser = 'Opera';
		css = 'opera';
	} else if (value.indexOf('Safari') !== -1) {
		browser = 'Safari';
		css = 'safari';
	} else if (value.indexOf('Firefox') !== -1) {
		browser = 'Firefox';
		css = 'firefox';
	}

	if (small) {
		image = './images/' + browser + 'Small.png';
		size = 16;
		css = css + ' browser small vector ';
	} else {
		image = './images/' + browser + '.png';
	}
	css += 'browser small';
	return { image: image, css: css, size: size };
}

function convertReferrer(referrer) {
	var regEx = /^http[s]{0,1}:\/\/(?:[^.]+[\\.])*google(?:(?:.[a-z]{2,3}){1,2})[\/](?:search|url|imgres|aclk)(?:\?|.*&)q=([^&]*)/i;
	var keywords = regEx.exec(referrer);
	if (keywords !== null) {
		if (keywords[1].length > 0) {
			referrer = 'Google Search (Keywords: ' + keywords[1] + ')';
		} else {
			referrer = 'Google Search';
		}
	}
	return referrer;
}

function convertCountryIcon(value) {
	var countries = {"Ascension Island": "ac",
		"Andorra": "ad",
		"United Arab Emirates": "ae",
		"Afghanistan": "af",
		"Antigua And Barbuda": "ag",
		"Anguilla": "ai",
		"Albania": "al",
		"Armenia": "am",
		"Netherlands Antilles": "an",
		"Angola": "ao",
		"Antarctica": "aq",
		"Argentina": "ar",
		"American Samoa": "as",
		"Austria": "at",
		"Australia": "au",
		"Aruba": "aw",
		"Aland Islands": "ax",
		"Azerbaijan": "az",
		"Bosnia And Herzegovina": "ba",
		"Barbados": "bb",
		"Bangladesh": "bd",
		"Belgium": "be",
		"Burkina Faso": "bf",
		"Bulgaria": "bg",
		"Bahrain": "bh",
		"Burundi": "bi",
		"Benin": "bj",
		"Bermuda": "bm",
		"Brunei Darussalam": "bn",
		"Bolivia": "bo",
		"Brazil": "br",
		"Bahamas": "bs",
		"Bhutan": "bt",
		"Bouvet Island": "bv",
		"Botswana": "bw",
		"Belarus": "by",
		"Belize": "bz",
		"Canada": "ca",
		"Cocos (keeling) Islands": "cc",
		"Congo, The Democratic Republic of The": "cd",
		"Central African Republic": "cf",
		"Congo, Republic of The": "cg",
		"Switzerland": "ch",
		"Cote D'ivoire": "ci",
		"Cook Islands": "ck",
		"Chile": "cl",
		"Cameroon": "cm",
		"China": "cn",
		"Colombia": "co",
		"Costa Rica": "cr",
		"Cuba": "cu",
		"Cape Verde": "cv",
		"Christmas Island": "cx",
		"Cyprus": "cy",
		"Czech Republic": "cz",
		"Germany": "de",
		"Djibouti": "dj",
		"Denmark": "dk",
		"Dominica": "dm",
		"Dominican Republic": "do",
		"Algeria": "dz",
		"Ecuador": "ec",
		"Estonia": "ee",
		"Egypt": "eg",
		"Western Sahara": "eh",
		"Eritrea": "er",
		"Spain": "es",
		"Ethiopia": "et",
		"Europe": "eu",
		"Finland": "fi",
		"Fiji": "fj",
		"Falkland Islands ( Malvinas )": "fk",
		"Micronesia, Federated States of": "fm",
		"Faroe Islands": "fo",
		"France": "fr",
		"Gabon": "ga",
		"Grenada": "gd",
		"Georgia": "ge",
		"French Guiana": "gf",
		"Ghana": "gh",
		"Gibraltar": "gi",
		"Greenland": "gl",
		"Gambia": "gm",
		"Guinea": "gn",
		"Guadeloupe": "gp",
		"Equatorial Guinea": "gq",
		"Greece": "gr",
		"South Georgia And The South Sandwich Islands": "gs",
		"Guatemala": "gt",
		"Guam": "gu",
		"Guinea-bissau": "gw",
		"Guyana": "gy",
		"Hong Kong": "hk",
		"Heard Island And Mcdonald Islands": "hm",
		"Honduras": "hn",
		"Croatia": "hr",
		"Haiti": "ht",
		"Hungary": "hu",
		"Indonesia": "id",
		"Ireland, Republic of": "ie",
		"Ireland": "ie",
		"Israel": "il",
		"India": "in",
		"British Indian Ocean Territory": "io",
		"Iraq": "iq",
		"Iran, Islamic Republic of": "ir",
		"Iceland": "is",
		"Italy": "it",
		"Jamaica": "jm",
		"Jordan": "jo",
		"Japan": "jp",
		"Kenya": "ke",
		"Kyrgyzstan": "kg",
		"Cambodia": "kh",
		"Kiribati": "ki",
		"Comoros": "km",
		"Saint Kitts And Nevis": "kn",
		"Korea, Democratic People's Republic of": "kp",
		"Korea, Republic of": "kr",
		"Kuwait": "kw",
		"Cayman Islands": "ky",
		"Kazakhstan": "kz",
		"Lao People's Democratic Republic": "la",
		"Lebanon": "lb",
		"Saint Lucia": "lc",
		"Liechtenstein": "li",
		"Sri Lanka": "lk",
		"Liberia": "lr",
		"Lesotho": "ls",
		"Lithuania": "lt",
		"Luxembourg": "lu",
		"Latvia": "lv",
		"Libyan Arab Jamahiriya": "ly",
		"Morocco": "ma",
		"Monaco": "mc",
		"Moldova, Republic of": "md",
		"Montenegro, Republic of": "me",
		"Madagascar": "mg",
		"Marshall Islands": "mh",
		"Macedonia": "mk",
		"Macedonia, Republic of": "mk",
		"Mali": "ml",
		"Myanmar": "mm",
		"Mongolia": "mn",
		"Macau": "mo",
		"Northern Mariana Islands": "mp",
		"Martinique": "mq",
		"Mauritania": "mr",
		"Montserrat": "ms",
		"Malta": "mt",
		"Mauritius": "mu",
		"Maldives": "mv",
		"Malawi": "mw",
		"Mexico": "mx",
		"Malaysia": "my",
		"Mozambique": "mz",
		"Namibia": "na",
		"New Caledonia": "nc",
		"Niger": "ne",
		"Norfolk Island": "nf",
		"Nigeria": "ng",
		"Nicaragua": "ni",
		"Netherlands": "nl",
		"Norway": "no",
		"Nepal": "np",
		"Nauru": "nr",
		"Niue": "nu",
		"New Zealand": "nz",
		"Oman": "om",
		"Panama": "pa",
		"Peru": "pe",
		"French Polynesia": "pf",
		"Papua New Guinea": "pg",
		"Philippines": "ph",
		"Pakistan": "pk",
		"Poland": "pl",
		"Saint Pierre And Miquelon": "pm",
		"Pitcairn": "pn",
		"Puerto Rico": "pr",
		"Palestinian Territory, Occupied": "ps",
		"Palestinian Territory": "ps",
		"Portugal": "pt",
		"Palau": "pw",
		"Paraguay": "py",
		"Qatar": "qa",
		"Reunion": "re",
		"Romania": "ro",
		"Serbia": "rs",
		"Serbia, Republic of": "rs",
		"Russian Federation": "ru",
		"Rwanda": "rw",
		"Saudi Arabia": "sa",
		"Solomon Islands": "sb",
		"Seychelles": "sc",
		"Sudan": "sd",
		"Sweden": "se",
		"Singapore": "sg",
		"Saint Helena": "sh",
		"Slovenia": "si",
		"Svalbard And Jan Mayen": "sj",
		"Slovakia": "sk",
		"Sierra Leone": "sl",
		"San Marino": "sm",
		"Senegal": "sn",
		"Somalia": "so",
		"Suriname": "sr",
		"Sao Tome And Principe": "st",
		"El Salvador": "sv",
		"Syrian Arab Republic": "sy",
		"Swaziland": "sz",
		"Turks And Caicos Islands": "tc",
		"Chad": "td",
		"French Southern Territories": "tf",
		"Togo": "tg",
		"Thailand": "th",
		"Tajikistan": "tj",
		"Tokelau": "tk",
		"Timor - Leste ( East Timor )": "tl",
		"Turkmenistan": "tm",
		"Tunisia": "tn",
		"Tonga": "to",
		"Turkey": "tr",
		"Trinidad And Tobago": "tt",
		"Tuvalu": "tv",
		"Taiwan": "tw",
		"Taiwan, Province of China": "tw",
		"Tanzania, United Republic of": "tz",
		"Ukraine": "ua",
		"Uganda": "ug",
		"United Kingdom": "uk",
		"United States Minor Outlying Islands": "um",
		"United States": "us",
		"Uruguay": "uy",
		"Uzbekistan": "uz",
		"Holy See ( Atican City State )": "va",
		"Saint Vincent And The Grenadines": "vc",
		"Venezuela": "ve",
		"Virgin Islands, British": "vg",
		"Virgin Islands, United States": "vi",
		"Vietnam": "vn",
		"Vanuatu": "vu",
		"Wallis And Futuna": "wf",
		"Samoa": "ws",
		"Yemen": "ye",
		"Mayotte": "yt",
		"South Africa": "za",
		"Zambia": "zm",
		"Zimbabwe": "zw"},
		country = countries[value],
		location = value;

	if (country === undefined || country === 'Unavailable') {
		location = '';
	} else {
		if (country !== undefined) {
			location = 'sprite country ' + country;
		}
	}

	return location;
}

function convertCountry(value) {
	var location = 'Unavailable';
	if (value.Country !== null && value.Country.length > 0) {
		location = value.Country;

		if (value.State !== null && value.State.length > 0) {
			if (value.City.length > 0) {
				location = value.City + ', ' + value.State + ', ' + value.Country;
			} else {
				location = value.State + ', ' + value.Country;
			}
		} else {
			if (value.City !== null && value.City.length > 0) {
				location = value.City + ', ' + value.Country;
			}
		}
	}
	return location;
}

this["App"] = this["App"] || {};
this["App"]["templates"] = this["App"]["templates"] || {};

this["App"]["templates"]["message"] = Handlebars.template({"1":function(depth0,helpers,partials,data) {
    var helper, alias1=helpers.helperMissing, alias2="function", alias3=this.escapeExpression;

  return "<div class=\"flex image "
    + alias3(((helper = (helper = helpers.alignment || (depth0 != null ? depth0.alignment : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"alignment","hash":{},"data":data}) : helper)))
    + "\">\n  <div class=\"avatar "
    + alias3(((helper = (helper = helpers.css || (depth0 != null ? depth0.css : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"css","hash":{},"data":data}) : helper)))
    + "\" style=\"background-image: url('"
    + alias3(((helper = (helper = helpers.image || (depth0 != null ? depth0.image : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"image","hash":{},"data":data}) : helper)))
    + "'); background-size: 32px auto\"></div>\n";
},"3":function(depth0,helpers,partials,data) {
    var helper;

  return "<div class=\"flex "
    + this.escapeExpression(((helper = (helper = helpers.alignment || (depth0 != null ? depth0.alignment : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0,{"name":"alignment","hash":{},"data":data}) : helper)))
    + "\">\n";
},"5":function(depth0,helpers,partials,data) {
    return " sending";
},"7":function(depth0,helpers,partials,data) {
    var helper, alias1=helpers.helperMissing, alias2="function", alias3=this.escapeExpression;

  return "    <div class=\"content tweet\" data-twitter=\""
    + alias3(((helper = (helper = helpers.tweet || (depth0 != null ? depth0.tweet : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"tweet","hash":{},"data":data}) : helper)))
    + "\">"
    + alias3(((helper = (helper = helpers.content || (depth0 != null ? depth0.content : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"content","hash":{},"data":data}) : helper)))
    + "</div>\n";
},"9":function(depth0,helpers,partials,data) {
    var stack1, helper;

  return "    <div class=\"content\">"
    + ((stack1 = ((helper = (helper = helpers.content || (depth0 != null ? depth0.content : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0,{"name":"content","hash":{},"data":data}) : helper))) != null ? stack1 : "")
    + "</div>\n";
},"11":function(depth0,helpers,partials,data) {
    var helper;

  return " "
    + this.escapeExpression(((helper = (helper = helpers.time || (depth0 != null ? depth0.time : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0,{"name":"time","hash":{},"data":data}) : helper)));
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
    var stack1, helper, alias1=helpers.helperMissing, alias2="function", alias3=this.escapeExpression;

  return ((stack1 = helpers['if'].call(depth0,(depth0 != null ? depth0.image : depth0),{"name":"if","hash":{},"fn":this.program(1, data, 0),"inverse":this.program(3, data, 0),"data":data})) != null ? stack1 : "")
    + "  <blockquote class=\"message "
    + alias3(((helper = (helper = helpers.alignment || (depth0 != null ? depth0.alignment : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"alignment","hash":{},"data":data}) : helper)))
    + ((stack1 = helpers['if'].call(depth0,(depth0 != null ? depth0.sending : depth0),{"name":"if","hash":{},"fn":this.program(5, data, 0),"inverse":this.noop,"data":data})) != null ? stack1 : "")
    + "\" data-id=\""
    + alias3(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"id","hash":{},"data":data}) : helper)))
    + "\" data-datetime=\""
    + alias3(((helper = (helper = helpers.timestamp || (depth0 != null ? depth0.timestamp : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"timestamp","hash":{},"data":data}) : helper)))
    + "\">\n"
    + ((stack1 = helpers['if'].call(depth0,(depth0 != null ? depth0.tweet : depth0),{"name":"if","hash":{},"fn":this.program(7, data, 0),"inverse":this.program(9, data, 0),"data":data})) != null ? stack1 : "")
    + "    <div class=\"from\">"
    + alias3(((helper = (helper = helpers.username || (depth0 != null ? depth0.username : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"username","hash":{},"data":data}) : helper)))
    + ((stack1 = helpers['if'].call(depth0,(depth0 != null ? depth0.time : depth0),{"name":"if","hash":{},"fn":this.program(11, data, 0),"inverse":this.noop,"data":data})) != null ? stack1 : "")
    + "</div>\n    <div class=\"seen\">\n      <span class=\"status\">Seen</span> <span class=\"time\"></span>\n    </div>\n  </blockquote>\n</div>\n"
    + ((stack1 = ((helper = (helper = helpers.tags || (depth0 != null ? depth0.tags : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"tags","hash":{},"data":data}) : helper))) != null ? stack1 : "")
    + "\n";
},"useData":true});
this["App"] = this["App"] || {};
this["App"]["templates"] = this["App"]["templates"] || {};

this["App"]["templates"]["user"] = Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
    var helper, alias1=helpers.helperMissing, alias2="function", alias3=this.escapeExpression;

  return "<div class=\"visitor\" data-id=\""
    + alias3(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"id","hash":{},"data":data}) : helper)))
    + "\" data-datetime=\""
    + alias3(((helper = (helper = helpers.datetime || (depth0 != null ? depth0.datetime : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"datetime","hash":{},"data":data}) : helper)))
    + "\" data-hash=\""
    + alias3(((helper = (helper = helpers.hash || (depth0 != null ? depth0.hash : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"hash","hash":{},"data":data}) : helper)))
    + "\" data-messages=\"0\" data-operator=\"false\">\n  <span class=\"image\" style=\"background-image:url('"
    + alias3(((helper = (helper = helpers.image || (depth0 != null ? depth0.image : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"image","hash":{},"data":data}) : helper)))
    + "')\"></span>\n  <span class=\"details name\">"
    + alias3(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"name","hash":{},"data":data}) : helper)))
    + "</span>\n  <span class=\"details department\">"
    + alias3(((helper = (helper = helpers.department || (depth0 != null ? depth0.department : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"department","hash":{},"data":data}) : helper)))
    + "</span>\n  <span class=\"details accesslevel\">"
    + alias3(((helper = (helper = helpers.server || (depth0 != null ? depth0.server : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"server","hash":{},"data":data}) : helper)))
    + "</span>\n  <span class=\"details time\"></span>\n  <span class=\"close\"></span>\n  <div class=\"dropdown-toggle options\" data-toggle=\"dropdown\" title=\"Options\"></div>\n  <ul class=\"dropdown-menu options\">\n    <li><a href=\"#\" class=\"Close\">Close Chat</a></li>\n    <li><a href=\"#\" class=\"Block\">Block Chat</a></li>\n    <li class=\"divider\"></li>\n    <li><a href=\"#\" class=\"EmailChatOffline\">Email Chat</a></li>\n    <li><a href=\"#\" class=\"EmailChatVisitor\">Email Chat - "
    + alias3(((helper = (helper = helpers.email || (depth0 != null ? depth0.email : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"email","hash":{},"data":data}) : helper)))
    + "</a></li>\n  </ul>\n  <span class=\"message-alert\">0</span>\n</div>\n";
},"useData":true});
this["App"] = this["App"] || {};
this["App"]["templates"] = this["App"]["templates"] || {};

this["App"]["templates"]["operator"] = Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
    var helper, alias1=helpers.helperMissing, alias2="function", alias3=this.escapeExpression;

  return "<div class=\"visitor "
    + alias3(((helper = (helper = helpers.statusmode || (depth0 != null ? depth0.statusmode : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"statusmode","hash":{},"data":data}) : helper)))
    + "\" data-id=\""
    + alias3(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"id","hash":{},"data":data}) : helper)))
    + "\" data-status=\""
    + alias3(((helper = (helper = helpers.statusmode || (depth0 != null ? depth0.statusmode : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"statusmode","hash":{},"data":data}) : helper)))
    + "\" data-name=\""
    + alias3(((helper = (helper = helpers.firstname || (depth0 != null ? depth0.firstname : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"firstname","hash":{},"data":data}) : helper)))
    + "\" data-messages=\"0\" data-operator=\"true\">\n  <span class=\"status parent dropdown-toggle\" data-toggle=\"dropdown\">\n    <span class=\"status\"></span>\n  </span>\n  <span class=\"image\" style=\"background-image:url('"
    + alias3(((helper = (helper = helpers.image || (depth0 != null ? depth0.image : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"image","hash":{},"data":data}) : helper)))
    + "'); background-size: 40px 40px\"></span>\n  <span class=\"details name\">"
    + alias3(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"name","hash":{},"data":data}) : helper)))
    + "</span>\n  <span class=\"details department\">"
    + alias3(((helper = (helper = helpers.department || (depth0 != null ? depth0.department : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"department","hash":{},"data":data}) : helper)))
    + "</span>\n  <span class=\"details accesslevel\">"
    + alias3(((helper = (helper = helpers.access || (depth0 != null ? depth0.access : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"access","hash":{},"data":data}) : helper)))
    + "</span>\n  <span class=\"message-alert red\">0</span>\n</div>\n";
},"useData":true});
this["App"] = this["App"] || {};
this["App"]["templates"] = this["App"]["templates"] || {};

this["App"]["templates"]["chat"] = Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
    var helper, alias1=helpers.helperMissing, alias2="function", alias3=this.escapeExpression;

  return "<div data-id=\""
    + alias3(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"id","hash":{},"data":data}) : helper)))
    + "\" data-operator=\""
    + alias3(((helper = (helper = helpers.operator || (depth0 != null ? depth0.operator : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"operator","hash":{},"data":data}) : helper)))
    + "\" class=\""
    + alias3(((helper = (helper = helpers.styles || (depth0 != null ? depth0.styles : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"styles","hash":{},"data":data}) : helper)))
    + "\">\n  <div class=\"name\"></div>\n  <div class=\"header\">\n    <div class=\"title\">\n      <span class=\"title\"></span>\n    </div>\n  </div>\n  <div class=\"inputs\">\n    <div class=\"scroll\">\n      <div class=\"messages\"></div>\n      <div class=\"end\"></div>\n    </div>\n  </div>\n  <div class=\"scrollalert\">\n    <div class=\"scrollmessage\"></div>\n    <a href=\"#\"></a>\n    <div class=\"arrow\"></div>\n  </div>\n  <div class=\"status\">\n    <span class=\"indicator\"></span> <span class=\"name\"></span> <span class=\"activity\">is available</span> <a href=\"#\" class=\"email\"></a>\n  </div>\n  <div class=\"sidebar loading\"></div>\n</div>\n";
},"useData":true});