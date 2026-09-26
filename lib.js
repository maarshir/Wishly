// Чистые функции без обращений к базе и к Телеграму.
// Их можно проверить тестами в Node (test/lib.test.js), а в браузере они доступны как window.WishlyLib.
(function (root) {
    const CATEGORY_EMOJI = {
        gift: '🎁',
        food: '🍴',
        place: '📍',
        goodies: '🍬',
    };

    // Любой текст от пользователя перед вставкой в разметку проходит через эту функцию.
    // Иначе название вида <img src=x onerror=...> выполнится у второго человека.
    function escapeHtml(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Ссылки открываются только http и https. Ссылка вида javascript:... превращается в пустую строку.
    function safeUrl(value) {
        if (!value) return '';
        const url = String(value).trim();
        return /^https?:\/\//i.test(url) ? url : '';
    }

    // Картинки: обычные адреса или base64 из загрузки (так фото хранятся в таблице).
    function safeImageSrc(value) {
        if (!value) return '';
        const src = String(value).trim();
        if (/^data:image\/(png|jpe?g|gif|webp|heic|heif|avif);base64,[a-z0-9+/=\s]+$/i.test(src)) return src;
        return safeUrl(src);
    }

    function categoryEmoji(category) {
        return CATEGORY_EMOJI[category] || '✨';
    }

    function filterByUser(items, filter, me) {
        if (filter === 'me') return items.filter(item => item.added_by === me);
        if (filter === 'partner') return items.filter(item => item.added_by !== me);
        return items;
    }

    // Разметка одной карточки. Никаких данных внутри onclick: только data-id и data-action,
    // а обработчик в script.js берёт саму запись из памяти по id.
    function cardHtml(item, me) {
        const id = escapeHtml(item.id);
        const mine = item.added_by === me;
        const emoji = categoryEmoji(item.category);
        const image = safeImageSrc(item.image_url);
        const link = safeUrl(item.link);
        const location = safeUrl(item.location);
        const rawLevel = Math.trunc(Number(item.desire_level));
        const level = Number.isFinite(rawLevel) ? Math.min(Math.max(rawLevel, 0), 4) : 0;

        const classes = ['glass-card', 'flex', 'flex-col', 'relative', 'cursor-pointer'];
        if (item.is_completed) classes.push('opacity-30', 'grayscale');
        if (level === 4) classes.push('desire-4');

        return `
            <div data-id="${id}" data-action="view" class="${classes.join(' ')}">
                ${image
                    ? `<img src="${escapeHtml(image)}" alt="" class="h-32 w-full object-cover">`
                    : `<div class="h-32 w-full bg-white/5 flex items-center justify-center text-4xl">${emoji}</div>`}
                <div class="p-3 flex flex-col flex-grow">
                    <div class="text-xs text-white/50 mb-1 flex justify-between">
                        <span>${mine ? 'Моё' : 'Её'}</span>
                        ${level ? '🔥'.repeat(level) : ''}
                    </div>
                    <div class="font-semibold text-sm mb-2 leading-tight">${escapeHtml(item.title)}</div>
                    ${item.price ? `<div class="text-xs font-bold text-green-400 mb-2">${escapeHtml(item.price)}</div>` : ''}
                    <div class="mt-auto flex gap-2">
                        ${link ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer" data-action="none" class="flex-1 bg-white/10 text-center py-1.5 rounded-lg text-xs hover:bg-white/20">Ссылка</a>` : ''}
                        ${location ? `<a href="${escapeHtml(location)}" target="_blank" rel="noopener noreferrer" data-action="none" class="flex-1 bg-blue-500/20 text-blue-300 text-center py-1.5 rounded-lg text-xs hover:bg-blue-500/40">Карта</a>` : ''}
                    </div>
                </div>
                <div class="category-badge">${emoji}</div>
                <div class="absolute top-2 right-2 flex gap-1">
                    ${mine ? `<button data-id="${id}" data-action="edit" class="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white/50 flex items-center justify-center hover:border-white/50">✏️</button>` : ''}
                    ${mine ? `<button data-id="${id}" data-action="delete" class="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-red-400/50 text-red-400 flex items-center justify-center hover:border-red-400">🗑️</button>` : ''}
                    <button data-id="${id}" data-action="toggle" class="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border ${item.is_completed ? 'border-green-400 text-green-400' : 'border-white/20 text-white/50'} flex items-center justify-center">✓</button>
                </div>
            </div>`;
    }

    const lib = { escapeHtml, safeUrl, safeImageSrc, categoryEmoji, filterByUser, cardHtml };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = lib;
    } else {
        root.WishlyLib = lib;
    }
})(typeof window !== 'undefined' ? window : globalThis);
