
describe('jquery.mods.js', function() {

	$.fn.mods.setPattern('{b}_{e}__{m}_{mv}');

	describe('mods', function() {

		it('Парсит className на блоке', function() {
			var el = document.createElement('div');
			el.className = 'b b__bool b__zero_0 b__num_5 b__negNum_-5 b__NaN_NaN b__inf_Infinity b__negInf_-Infinity b__emptyStr_ b__str_str';

			expect($(el).mods())
				.to.deep.equal({
					bool: true,
					zero: 0,
					num: 5,
					negNum: -5,
					NaN: NaN,
					inf: Infinity,
					negInf: -Infinity,
					emptyStr: '',
					str: 'str'
				});
		});

		it('Парсит className на элементе', function() {
			var el = document.createElement('div');
			el.className = 'b_e b_e__bool b_e__zero_0 b_e__num_5 b_e__negNum_-5 b_e__NaN_NaN b_e__inf_Infinity b_e__negInf_-Infinity b_e__emptyStr_ b_e__str_str';

			expect($(el).mods())
				.to.deep.equal({
					bool: true,
					zero: 0,
					num: 5,
					negNum: -5,
					NaN: NaN,
					inf: Infinity,
					negInf: -Infinity,
					emptyStr: '',
					str: 'str'
				});
		});

		it('Не находит модификаторы на блоке, если сам блок не указан', function() {
			var el = document.createElement('div');
			el.className = 'b__test1 __test2';

			expect($(el).mods())
				.to.deep.equal({});
		});

		it('Не находит модификаторы на элементе, если сам элемент не указан', function() {
			var el = document.createElement('div');
			el.className = 'b_e__test1 __test2';

			expect($(el).mods())
				.to.deep.equal({});
		});

		it('Устанавливает значения', function() {
			var el = document.createElement('div');
			el.className = 'b';

			$(el).mods({ bool: true });

			expect(el.className)
				.to.equal('b b__bool');

			$(el).mods({ num: 5 });

			expect(el.className)
				.to.equal('b b__bool b__num_5');

			$(el).mods({ str: 'str' });

			expect(el.className)
				.to.equal('b b__bool b__num_5 b__str_str');
		});

		it('Не устанавливает модификаторы, если не указаны ни блок, ни элемент', function() {
			var el = document.createElement('div');

			$(el).mods({ test: true });

			expect(el.className)
				.to.equal('');
		});

		it('Не меняет className, если NaN заменяется на NaN', function() {
			var el = document.createElement('div');
			el.className = 'b_e b_e__num1_1 b_e__NaN_NaN b_e__num2_2';

			var oldCls = el.className;

			$(el).mods({ NaN: NaN });

			expect(el.className)
				.to.equal(oldCls);
		});

		it('Конфигурируется', function() {
			$.fn.mods.setPattern('b-{b}_e-{e}__m-{m}_mv-{mv}');

			var el = document.createElement('div');
			el.className = 'b-testBlock_e-testElement';

			$(el).mods();

			expect($(el).data('mods'))
				.to.deep.equal({
					block: 'testBlock',
					element: 'testElement',
					mods: {},
					className: 'b-testBlock_e-testElement'
				});

			$(el).mods({ num: 5 });

			expect(el.className)
				.to.equal('b-testBlock_e-testElement b-testBlock_e-testElement__m-num_mv-5');
		});

		it('Конфигурируется шаблоном с постфиксами', function() {
			$.fn.mods.setPattern('-{b}-,_{e}_,-{m}-,_{mv}_');

			var el = document.createElement('div');
			el.className = '-b-_e_ -b-_e_-str-_str_ -b-_e_-str2-_str2_';

			$(el).mods();

			expect($(el).data('mods'))
				.to.deep.equal({
					block: 'b',
					element: 'e',
					mods: {
						str: 'str',
						str2: 'str2'
					},
					className: '-b-_e_ -b-_e_-str-_str_ -b-_e_-str2-_str2_'
				});

			$(el).mods({ bool: true, num: 5, str: 'str', str2: 'newStr2' });

			expect(el.className)
				.to.equal('-b-_e_ -b-_e_-str-_str_ -b-_e_-bool- -b-_e_-num-_5_ -b-_e_-str2-_newStr2_');
		});

		it('Конфигурируется с указанием наборов символов', function() {
			$.fn.mods.setPattern('{b:[a-z]}_{e:[a-z]}__{m:[a-z]}_{mv:\\S}');

			var el = document.createElement('div');
			el.className = 'b1_e b_e1 b_e b1_e__testt b_e1__testt b_e__test3 b_e__test';

			$(el).mods();

			expect($(el).data('mods'))
				.to.deep.equal({
					block: 'b',
					element: 'e',
					mods: {
						test: true
					},
					className: 'b1_e b_e1 b_e b1_e__testt b_e1__testt b_e__test3 b_e__test'
				});
		});

		it('Конфигурируется для работы с модификаторами без указаного блока или элемента', function() {
			$.fn.mods.setPattern('__{m}_{mv}');

			var el = document.createElement('div');
			el.className = '__num_5 __str_str';

			expect($(el).mods())
				.to.deep.equal({
					num: 5,
					str: 'str'
				});

			$(el).mods({ num: 10, num2: 15 });

			expect(el.className)
				.to.equal('__str_str __num_10 __num2_15');
		});

		it('Генерирует событие с diff-ом', function(done) {
			$.fn.mods.setPattern('{b}_{e}__{m}_{mv}');

			var el = document.createElement('div');
			el.className = 'list_item list_item__selected list_item__opened';

			$(el).bind('change.mods', function(evt) {
				expect(evt.type)
					.to.equal('change');

				expect(evt.namespace)
					.to.equal('mods');

				expect(evt.diff)
					.to.deep.equal({
						selected: {
							type: 'delete',
							oldValue: true,
							value: undefined
						},
						opened: {
							type: 'update',
							oldValue: true,
							value: false
						},
						disabled: {
							type: 'add',
							oldValue: undefined,
							value: true
						}
					});

				done();
			});

			$(el).mods({ selected: undefined, opened: false, disabled: true });
		});

		it('Обновляется, если вручную изменить className', function() {
			$.fn.mods.setPattern('{b}_{e}__{m}_{mv}');

			var el = document.createElement('div');
			el.className = 'list_item';

			$(el).mods();

			expect($(el).data('mods'))
				.to.deep.equal({
					block: 'list',
					element: 'item',
					mods: {},
					className: 'list_item'
				});

			el.className = '';

			expect($(el).mods())
				.to.deep.equal({});

			expect($(el).data('mods'))
				.to.equal(null);
		});

		it('Обновляется, если вручную изменить className (2)', function() {
			$.fn.mods.setPattern('{b}_{e}__{m}_{mv}');

			var el = document.createElement('div');
			el.className = 'list_item';

			expect($(el).mods())
				.to.deep.equal({});

			el.className += ' list_item__selected';

			expect($(el).mods())
				.to.deep.equal({
					selected: true
				});
		});

	});

});
