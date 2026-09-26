// Тесты чистых функций из lib.js. Запуск: npm test (нужен только Node 18+, зависимостей нет).
const test = require('node:test');
const assert = require('node:assert/strict');
const { escapeHtml, safeUrl, safeImageSrc, categoryEmoji, filterByUser, cardHtml } = require('../lib.js');

const base = {
    id: 7,
    title: 'Наушники',
    category: 'gift',
    added_by: 'Иван',
    price: '5000 ₽',
    link: 'https://example.com/item',
    location: null,
    desire_level: 2,
    is_completed: false,
    image_url: null,
};

test('escapeHtml экранирует все опасные символы', () => {
    assert.equal(escapeHtml(`<a href="x" onclick='y'>&</a>`), '&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
    assert.equal(escapeHtml(null), '');
    assert.equal(escapeHtml(undefined), '');
    assert.equal(escapeHtml(42), '42');
});

test('safeUrl пропускает только http и https', () => {
    assert.equal(safeUrl('https://example.com'), 'https://example.com');
    assert.equal(safeUrl('  http://example.com  '), 'http://example.com');
    assert.equal(safeUrl('javascript:alert(1)'), '');
    assert.equal(safeUrl('JaVaScRiPt:alert(1)'), '');
    assert.equal(safeUrl('data:text/html,<script>1</script>'), '');
    assert.equal(safeUrl(''), '');
    assert.equal(safeUrl(null), '');
});

test('safeImageSrc принимает base64 картинки и обычные адреса', () => {
    assert.equal(safeImageSrc('data:image/png;base64,iVBORw0KGgo='), 'data:image/png;base64,iVBORw0KGgo=');
    assert.equal(safeImageSrc('https://example.com/a.jpg'), 'https://example.com/a.jpg');
    assert.equal(safeImageSrc('data:text/html;base64,PHNjcmlwdD4='), '');
    assert.equal(safeImageSrc('data:image/svg+xml;base64,PHN2Zz4='), '');
    assert.equal(safeImageSrc('x" onerror="alert(1)'), '');
});

test('categoryEmoji знает четыре категории и не падает на неизвестной', () => {
    assert.equal(categoryEmoji('gift'), '🎁');
    assert.equal(categoryEmoji('place'), '📍');
    assert.equal(categoryEmoji('что-то'), '✨');
});

test('filterByUser делит записи на мои и чужие', () => {
    const items = [{ added_by: 'Иван' }, { added_by: 'Аня' }, { added_by: 'Иван' }];
    assert.equal(filterByUser(items, 'all', 'Иван').length, 3);
    assert.equal(filterByUser(items, 'me', 'Иван').length, 2);
    assert.deepEqual(filterByUser(items, 'partner', 'Иван'), [{ added_by: 'Аня' }]);
});

test('cardHtml не вставляет разметку из названия и цены', () => {
    const html = cardHtml({ ...base, title: '<img src=x onerror=alert(1)>', price: '"><script>1</script>' }, 'Иван');
    assert.ok(!html.includes('<img src=x'));
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
});

test('cardHtml не кладёт данные записи в onclick', () => {
    const html = cardHtml({ ...base, title: "'); alert(1); ('" }, 'Иван');
    assert.ok(!/onclick/i.test(html));
    assert.ok(html.includes('data-id="7"'));
    assert.ok(html.includes('data-action="view"'));
});

test('cardHtml выкидывает ссылки javascript: и чужие картинки', () => {
    const html = cardHtml({ ...base, link: 'javascript:alert(1)', location: 'javascript:alert(2)', image_url: 'javascript:alert(3)' }, 'Иван');
    assert.ok(!/javascript:/i.test(html));
    assert.ok(!html.includes('>Ссылка<'));
    assert.ok(!html.includes('>Карта<'));
});

test('cardHtml экранирует id', () => {
    const html = cardHtml({ ...base, id: '1" onmouseover="alert(1)' }, 'Иван');
    assert.ok(html.includes('data-id="1&quot; onmouseover=&quot;alert(1)"'));
});

test('кнопки правки и удаления только у своих записей', () => {
    const mine = cardHtml(base, 'Иван');
    const partner = cardHtml(base, 'Аня');
    assert.ok(mine.includes('data-action="edit"') && mine.includes('data-action="delete"'));
    assert.ok(!partner.includes('data-action="edit"') && !partner.includes('data-action="delete"'));
    assert.ok(partner.includes('data-action="toggle"'));
    assert.ok(mine.includes('Моё') && partner.includes('Её'));
});

test('уровень желания: огоньки, подсветка четвёртого уровня и защита от мусора', () => {
    assert.equal((cardHtml({ ...base, desire_level: 3 }, 'Иван').match(/🔥/g) || []).length, 3);
    assert.ok(cardHtml({ ...base, desire_level: 4 }, 'Иван').includes('desire-4'));
    assert.equal((cardHtml({ ...base, desire_level: 100 }, 'Иван').match(/🔥/g) || []).length, 4);
    assert.equal((cardHtml({ ...base, desire_level: 'abc' }, 'Иван').match(/🔥/g) || []).length, 0);
    assert.equal((cardHtml({ ...base, desire_level: null }, 'Иван').match(/🔥/g) || []).length, 0);
});

test('выполненная запись приглушена', () => {
    assert.ok(cardHtml({ ...base, is_completed: true }, 'Иван').includes('opacity-30'));
    assert.ok(!cardHtml(base, 'Иван').includes('opacity-30'));
});
