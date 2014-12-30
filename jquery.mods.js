
(function($, undef) {

	var _hasOwnProperty = Array.prototype.hasOwnProperty;

	var reNotWhitespaces = /\S+/g;

	/**
	 * @param {string} re
	 * @returns {string}
	 */
	function escapeRegExp(re) {
		return re.replace(/([?(){}[+\-\]^|$\.\/\\*])/g, '\\$1');
	}

	/**
	 * Пробует преобразовать строку в число.
	 * В случае успеха возвращает полученное число, иначе - исходную строку.
	 *
	 * @param {string} str - Строка для преобразования.
	 * @returns {number|string}
	 */
	function tryStringAsNumber(str) {
		if (str != '') {
			if (str == 'NaN') {
				return NaN;
			}

			var num = Number(str);

			if (num == num) {
				return num;
			}
		}

		return str;
	}

	var blockPrefix;
	var blockPostfix;
	var elementPrefix;
	var elementPostfix;
	var modPrefix;
	var modPostfix;
	var modValuePrefix;
	var modValuePostfix;

	var init;

	var rePattern = new RegExp([
		'^',
		'    (',
		'        ([^{\\s]*)\\{b(?::([^}\\s]+))?\\}(?:([^,{\\s]*),)?',
		'        ([^{\\s]+)\\{e(?::([^}\\s]+))?\\}(?:([^,{\\s]*),)?',
		'    )?',
		'    ([^{\\s]+)\\{m(?::([^}\\s]+))?\\}(?:([^,{\\s]*),)?',
		'    ([^{\\s]+)\\{mv(?::([^}\\s]+))?\\}(\\S*)',
		'$'
	].join('').replace(/\s+/g, ''));

	function setPattern(pattern) {
		pattern = pattern.match(rePattern);

		if (!pattern) {
			throw new SyntaxError('Incorrect pattern');
		}

		modPrefix = pattern[8];
		modPostfix = pattern[10] || '';
		modValuePrefix = pattern[11];
		modValuePostfix = pattern[13] || '';

		var reMod = escapeRegExp(modPrefix) + (pattern[9] ? '(' + pattern[9] + '+?)' : '([-0-9a-z]+?)') +
			escapeRegExp(modPostfix);
		var reModValue = escapeRegExp(modValuePrefix) + (pattern[12] ? '(' + pattern[12] + '*?)' : '(\\S*?)') +
			escapeRegExp(modValuePostfix);

		if (pattern[1]) {
			blockPrefix = pattern[2];
			blockPostfix = pattern[4] || '';
			elementPrefix = pattern[5];
			elementPostfix = pattern[7] || '';

			var reBlockElement = escapeRegExp(blockPrefix) +
				(pattern[3] ? '(' + pattern[3] + '+?)' : '([-0-9a-z]+?)') + escapeRegExp(blockPostfix) +
				'(?:' + escapeRegExp(elementPrefix) +
				(pattern[6] ? '(' + pattern[6] + '+?)' : '([-0-9a-z]+?)') + escapeRegExp(elementPostfix) + ')?';

			reMod = new RegExp('\\s' + reBlockElement + reMod + '(?:' + reModValue + ')?(?=\\s)', 'gi');
			reBlockElement = new RegExp('\\s' + reBlockElement + '\\s', 'i');

			init = function($el, cls) {
				var block;
				var el;
				var mods = {};
				var data = { mods: mods };

				for (var match; match = reMod.exec(cls);) {
					if (block) {
						if (match[1] != block || match[2] !== el) {
							continue;
						}
					} else {
						var cl = blockPrefix + match[1] + blockPostfix +
							(match[2] ? elementPrefix + match[2] + elementPostfix : '');

						if (cls.indexOf(' ' + cl + ' ') != -1) {
							block = data.block = match[1];
							el = data.element = match[2];
						} else {
							continue;
						}
					}

					mods[match[3]] = match[4] === undef ? true : tryStringAsNumber(match[4]);
				}

				if (!block) {
					if (reBlockElement.test(cls)) {
						data.block = RegExp.$1 || undef;
						data.element = RegExp.$2 || undef;
					} else {
						return null;
					}
				}

				$el.data('mods', data);

				return data;
			};
		} else {
			reMod = new RegExp('\\s' + reMod + '(?:' + reModValue + ')?(?=\\s)', 'gi');

			init = function($el, cls) {
				var mods = {};
				var data = { mods: mods };

				for (var match; match = reMod.exec(cls);) {
					mods[match[1]] = match[2] === undef ? true : tryStringAsNumber(match[2]);
				}

				$el.data('mods', data);

				return data;
			};
		}
	}

	setPattern('{b}_{e}__{m}_{mv}');

	/**
	 * @param {Object} [values]
	 * @returns {$|Object|undefined}
	 */
	function mods(values) {
		if (values) {
			return this.each(function() {
				var $el = $(this);
				var cls = ' ' + (this.className.match(reNotWhitespaces) || []).join(' ') + ' ';
				var data = $el.data('mods') || init($el, cls);

				if (!data) {
					return;
				}

				var block = data.block;
				var el = data.element;
				var mods = data.mods;
				var oldCls = cls;
				var diff = {};

				for (var name in values) {
					var hasName = _hasOwnProperty.call(mods, name);
					var oldValue = hasName ? mods[name] : undef;
					var value = values[name];

					// если не равны и хотя бы один из них не NaN (если оба NaN, то равны)
					if (oldValue !== value && (oldValue == oldValue || value == value)) {
						if (typeof value == 'string' && value !== tryStringAsNumber(value)) {
							throw new TypeError('Value can\'t be a string convertible to a number');
						}

						var blockElementMod = (
							block ? blockPrefix + block + blockPostfix +
								(el ? elementPrefix + el + elementPostfix : '') : ''
						) + modPrefix + name + modPostfix;

						if (oldValue != null && oldValue !== false) {
							cls = cls
								.split(
									blockElementMod +
										(oldValue === true ? '' : modValuePrefix + oldValue + modValuePostfix) + ' '
								)
								.join('');
						}

						if (value != null && value !== false) {
							cls += blockElementMod +
								(value === true ? '' : modValuePrefix + value + modValuePostfix) + ' ';
						}

						if (value === undef) {
							diff[name] = { type: 'delete', oldValue: oldValue, value: value };
							delete mods[name];
						} else {
							diff[name] = { type: hasName ? 'update' : 'add', oldValue: oldValue, value: value };
							mods[name] = value;
						}
					}
				}

				if (oldCls != cls) {
					this.className = cls.trim();

					$el.trigger({
						type: 'change.mods',
						diff: diff
					});
				}
			});
		}

		if (this[0]) {
			var $el = $(this[0]);
			var data = $el.data('mods') ||
				init($el, ' ' + (this[0].className.match(reNotWhitespaces) || []).join(' ') + ' ');

			return data ? data.mods : {};
		}
	}

	mods.setPattern = setPattern;

	$.fn.mods = mods;

})(jQuery);
