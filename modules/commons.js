/* globals OO */

Twinkle.oouiLoaded = $.Deferred();

// Repeated calls to this function won't result in the same modules being reloaded.
Twinkle.loadOOUI = function (additionalModules) {
	return mw.loader.using(['oojs-ui-core', 'oojs-ui-widgets'].concat(additionalModules || []), function() {
		Twinkle.oouiLoaded.resolve();
	});
};

Twinkle.getOOUIOverlay = function () {
	var $overlay = $('#twinkle-ooui-overlay');
	// Return existing overlay if already present on the DOM
	if ($overlay.length) {
		return $overlay;
	}
	return $('<div>').attr('id', 'twinkle-ooui-overlay').css({
		'position': 'absolute',
		'z-index': 1500
	}).appendTo('body');
};

Twinkle.syncMultiselectWithOOUITags = function syncMultiselectWithOOUITags($select, oouiTags) {
	$select.empty().append(oouiTags.map(function(item) {
		return $('<option>').val(item.data).prop('selected', true);
	}));
};

// This can run only when OOUI is loaded
Twinkle.oouiLoaded.then(function() {

	var ComboboxWithGroupsWidget = new OO.ui.ComboBoxInputWidget();
	ComboboxWithGroupsWidget.getInput().on('change', function (searchTerm) {
		var items = [];
		var regex = new RegExp(mw.util.escapeRegExp(searchTerm), 'i');
		function highlightSearchMatch (match) {
			var idx = match.input.toUpperCase().indexOf(match[0].toUpperCase());
			return $('<span>').append(
				match.input.slice(0, idx),
				$('<span>').css('text-decoration', 'underline').text(match.input.slice(idx, idx + match[0].length)),
				match.input.slice(idx + match[0].length)
			);
		}
		function getMatchesInGroup (groupOptions) {
			return groupOptions.map(function(opt) {
				return {
					match: opt.label.match(regex),
					data: opt.data
				};
			}).filter(function(e) {
				return e.match;
			});
		}
		function addMatchesToItems(matches) {
			items = items.concat(matches.map(function(e) {
				return new OO.ui.MenuOptionWidget({ data: e.data, label: highlightSearchMatch(e.match) });
			}));
		}
		this.options.forEach(function(group) {
			var match, matches;
			if (match = group.label.match(regex)) { // eslint-disable-line no-cond-assign
				items.push(new OO.ui.MenuSectionOptionWidget({ label: highlightSearchMatch(match) }));
				if (this.showFullGroupOnGroupLabelMatch) {
					items = items.concat(group.options.map(function(opt) {
						return new OO.ui.MenuOptionWidget({ data: opt.data, label: opt.label });
					}));
				} else {
					// show matching options in the group only
					matches = getMatchesInGroup(group.options);
					addMatchesToItems(matches);
				}
			} else {
				matches = getMatchesInGroup(group.options);
				if (matches.length) {
					items.push(new OO.ui.MenuSectionOptionWidget({ label: group.label }));
					addMatchesToItems(matches);
				}
			}
		});
		this.getMenu().clearItems()
			.addItems(items);
	}.bind(ComboboxWithGroupsWidget));

	var SelectWithOptgroupsWidget = function(config) {
		OO.ui.TextInputWidget.call(this, config);
		OO.ui.mixin.LookupElement.call(this, {
			$overlay: Twinkle.getOOUIOverlay(),
			allowSuggestionsWhenEmpty: true
		});
		this.setOptions(config.options || []);
		this.showFullGroupOnGroupLabelMatch = config.showFullGroupOnGroupLabelMatch !== false;
	};
	OO.inheritClass(SelectWithOptgroupsWidget, OO.ui.TextInputWidget);
	OO.mixinClass(SelectWithOptgroupsWidget, OO.ui.mixin.LookupElement);
	window.SelectWithOptgroupsWidget = SelectWithOptgroupsWidget;

	SelectWithOptgroupsWidget.prototype.onLookupMenuChoose = function(item) {
		this.setLookupsDisabled(true);
		this.setValue(item.data);
		this.setLookupsDisabled(false);
	};

	SelectWithOptgroupsWidget.prototype.setOptions = function (options) {
		this.options = options;
	};

	SelectWithOptgroupsWidget.prototype.getLookupRequest = function () {
		// Resolve with just the regex
		var deferred = $.Deferred();
		deferred.resolve(new RegExp(mw.util.escapeRegExp(this.getValue()), 'i'));
		return deferred.promise({ abort: function () {} });
	};
	SelectWithOptgroupsWidget.prototype.getLookupCacheDataFromResponse = function (response) {
		return response || [];
	};

	SelectWithOptgroupsWidget.prototype.getLookupMenuOptionsFromData = function (regex) {
		var items = [];
		function highlightSearchMatch (match) {
			var idx = match.input.toUpperCase().indexOf(match[0].toUpperCase());
			return $('<span>').append(
				match.input.slice(0, idx),
				$('<span>').css('text-decoration', 'underline').text(match.input.slice(idx, idx + match[0].length)),
				match.input.slice(idx + match[0].length)
			);
		}
		function getMatchesInGroup (groupOptions) {
			return groupOptions.map(function(opt) {
				return {
					match: opt.label.match(regex),
					data: opt.data
				};
			}).filter(function(e) {
				return e.match;
			});
		}
		function addMatchesToItems(matches) {
			items = items.concat(matches.map(function(e) {
				return new OO.ui.MenuOptionWidget({ data: e.data, label: highlightSearchMatch(e.match) });
			}));
		}
		this.options.forEach(function(group) {
			var match, matches;
			if (match = group.label.match(regex)) { // eslint-disable-line no-cond-assign
				items.push(new OO.ui.MenuSectionOptionWidget({ label: highlightSearchMatch(match) }));
				if (this.showFullGroupOnGroupLabelMatch) {
					items = items.concat(group.options.map(function(opt) {
						return new OO.ui.MenuOptionWidget({ data: opt.data, label: opt.label });
					}));
				} else {
					// show matching options in the group only
					matches = getMatchesInGroup(group.options);
					addMatchesToItems(matches);
				}
			} else {
				matches = getMatchesInGroup(group.options);
				if (matches.length) {
					items.push(new OO.ui.MenuSectionOptionWidget({ label: group.label }));
					addMatchesToItems(matches);
				}
			}
		});
		return items;
	};


});
