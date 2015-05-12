(function($, undef) {

	var hasOwn = Array.prototype.hasOwnProperty;

	var reNotWhitespaces = /\S+/g;
	var reEscapableChars = /([?+|$(){}[^.\-\]\/\\*])/g;

	/**
	 * @private
	 *
	 * @param {string} str
	 * @returns {string}
	 */
	function escapeRegExp(str) {
		return str.replace(reEscapableChars, '\\$1');
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
	var elPrefix;
	var elPostfix;
	var modPrefix;
	var modPostfix;
	var modValuePrefix;
	var modValuePostfix;

	var initData;

	var rePattern = RegExp([
		'^',
		//   1
		'    (',
		//       2                 3                 4
		'        ([^{\\s]*)\\{b(?::([^}\\s]+))?\\}(?:([^,{\\s]*),)?',
		//       5                 6                 7
		'        ([^{\\s]+)\\{e(?::([^}\\s]+))?\\}(?:([^,{\\s]*),)?',
		'    )?',
		//   8                 9                 10
		'    ([^{\\s]+)\\{m(?::([^}\\s]+))?\\}(?:([^,{\\s]*),)?',
		//   11                 12             13
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

		var reMod = escapeRegExp(modPrefix) + (pattern[9] ? '(' + pattern[9] + '+?)' : '([0-9a-z]+?)') +
			escapeRegExp(modPostfix) + '(?:' +
			escapeRegExp(modValuePrefix) + (pattern[12] ? '(' + pattern[12] + '*?)' : '(\\S*?)') +
			escapeRegExp(modValuePostfix) + ')?(?=\\s)';

		if (pattern[1]) {
			blockPrefix = pattern[2];
			blockPostfix = pattern[4] || '';
			elPrefix = pattern[5];
			elPostfix = pattern[7] || '';

			var reBlockEl = '\\s' + escapeRegExp(blockPrefix) +
				(pattern[3] ? '(' + pattern[3] + '+?)' : '([0-9a-z]+?)') + escapeRegExp(blockPostfix) +
				'(?:' + escapeRegExp(elPrefix) +
				(pattern[6] ? '(' + pattern[6] + '+?)' : '([0-9a-z]+?)') + escapeRegExp(elPostfix) + ')?';

			reMod = RegExp(reBlockEl + reMod, 'gi');

			initData = function($el, cls) {
				var block;
				var el;
				var mods = {};
				var data = {
					mods: mods,
					className: $el[0].className
				};

				for (var match; match = reMod.exec(cls);) {
					if (block) {
						if (match[1] != block || match[2] !== el) {
							continue;
						}
					} else {
						var cl = blockPrefix + match[1] + blockPostfix +
							(match[2] ? elPrefix + match[2] + elPostfix : '');

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
					if (RegExp(reBlockEl + '\\s', 'i').test(cls)) {
						data.block = RegExp.$1;
						data.element = RegExp.$2 || undef;
					} else {
						$el.data('mods', null);
						return null;
					}
				}

				$el.data('mods', data);

				return data;
			};
		} else {
			reMod = RegExp('\\s' + reMod, 'gi');

			initData = function($el, cls) {
				var mods = {};
				var data = {
					mods: mods,
					className: $el[0].className
				};

				for (var match; match = reMod.exec(cls);) {
					mods[match[1]] = match[2] === undef ? true : tryStringAsNumber(match[2]);
				}

				$el.data('mods', data);

				return data;
			};
		}
	}

	setPattern('{b:[-0-9a-z]}_{e:[-0-9a-z]}__{m:[-0-9a-z]}_{mv}');

	function getData($el, cls) {
		var data = $el.data('mods');

		return data && data.className == $el[0].className ?
			data :
			initData($el, cls || ' ' + ($el[0].className.match(reNotWhitespaces) || []).join(' ') + ' ');
	}

	/**
	 * @param {Object} [values]
	 * @returns {$|Object|undefined}
	 */
	function mods(values) {
		if (values) {
			return this.each(function() {
				var $el = $(this);
				var cls = ' ' + (this.className.match(reNotWhitespaces) || []).join(' ') + ' ';
				var data = getData($el, cls);

				if (!data) {
					return;
				}

				var block = data.block;
				var el = data.element;
				var mods = data.mods;
				var oldCls = cls;
				var diff = {};

				for (var name in values) {
					var hasName = hasOwn.call(mods, name);
					var oldValue = hasName ? mods[name] : undef;
					var value = values[name];

					// если не равны и хотя бы один из них не NaN (если оба NaN, то равны)
					if (oldValue !== value && (oldValue == oldValue || value == value)) {
						if (typeof value == 'string' && value !== tryStringAsNumber(value)) {
							throw new TypeError('Value can\'t be a string convertible to a number');
						}

						var blockElMod =
							(block ? blockPrefix + block + blockPostfix + (el ? elPrefix + el + elPostfix : '') : '') +
							modPrefix + name + modPostfix;

						if (oldValue != null && oldValue !== false) {
							cls = cls
								.split(
									blockElMod +
										(oldValue === true ? '' : modValuePrefix + oldValue + modValuePostfix) + ' '
								)
								.join('');
						}

						if (value != null && value !== false) {
							cls += blockElMod + (value === true ? '' : modValuePrefix + value + modValuePostfix) + ' ';
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
					this.className = data.className = cls.slice(1, -1);

					$el.trigger({
						type: 'change.mods',
						diff: diff
					});
				}
			});
		}

		if (this[0]) {
			return (getData($(this[0])) || { mods: {} }).mods;
		}
	}

	mods.setPattern = setPattern;

	$.fn.mods = mods;

})(window.$ || jQuery);
