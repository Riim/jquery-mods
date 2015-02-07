jquery-mods
===========

Хелпер для удобной работы с БЭМ-модификаторами. Значения кешируются, т. е. парсинг className происходит только один раз, при
первом вызове.

### Пример

```js
var $el = $('<li class="list_item list_item__selected list_item__posIndex_1 list_item__anim_blink" />');

console.log($el.mods()); // { selected: true, posIndex: 1, anim: 'blink' }

$el.mods({
	selected: undefined,
    hidden: true,
    type: 'building',
    posIndex: 5
});

console.log($el[0].className); // 'list_item list_item__anim_blink list_item__hidden list_item__type_building list_item__posIndex_5'
```

### Конфигурация

Перед началом работы можно задать шаблон (в дальнейшем его лучше не менять):
```js
$.fn.mods.setPattern('b-{b}_e-{e}__{m}_{mv}');
```
При шаблоне выше модификаторами будут считаться классы вида `'b-list__selected'` и `'b-list_e-item__selected'`.

По умолчанию используется следующий шаблон: `'{b}_{e}__{m}_{mv}'`.

Можно задать набор возможных символов в именах:
```js
$.fn.mods.setPattern('b-{b:[0-9a-z]}_e-{e:[0-9a-z]}__{m:\\w}_{mv\\S}');
```
По умолчанию для блока, элемента и модификатора могут использоваться цифры, буквы и минус,
для значения модификатора - любые непробельные символы.

Можно сконфигурировать для использования модификаторов без привязки к блоку/элементу:
```js
$.fn.mods.setPattern('__{m}_{mv}');

var $el = $('<div />').mods({ opened: 'yes' });

console.log($el[0].className); // '__opened_yes'
```

По умолчанию шаблон делится на четыре части. Разделение происходит после закрывающей фигурной скобки.
Т. е. следующий шаблон `b-{b}_e-{e}__{m}_{mv}` разделится так:
* блок - `b-{b}`;
* элемент - `_e-{e}`;
* модификатор - `__{m}`;
* значение модификатора - `__{mv}`.

Используя запятую можно точно указать где должно происходить разделение:
```js
$.fn.mods.setPattern('-{b}-,{e}_,_{m}_{mv}');

var $el = $('<div class="-list-" />').mods({ opened: 'yes' });

console.log($el[0].className); // '-list- -list-_opened_yes'
```

### События

При изменении модификатора генерируется событие `change.mods`. Поле `diff` на объекте события содержит описание сделанных изменений.
```js
var $el = $('<div class="list_item list_item__selected list_item__opened" />');

$(el).bind('change.mods', function(evt) {
    console.log(evt.diff);
});

$(el).mods({ selected: undefined, opened: false, disabled: true });
// {
//     selected: {
//         type: 'delete',
//         oldValue: true,
//         value: undefined
//     },
//     opened: {
//         type: 'update',
//         oldValue: true,
//         value: false
//     },
//     disabled: {
//         type: 'add',
//         oldValue: undefined,
//         value: true
//     }
// }
```
