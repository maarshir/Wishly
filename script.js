        // --- КОНФИГУРАЦИЯ ---
        const SB_URL = 'https://gsjozmgbwuglqevjxuaj.supabase.co';
        const SB_KEY = 'sb_publishable_NkwRATYjXxOox-HSnLd4xg_06Ds2vzH';
        
        const supabaseClient = supabase.createClient(SB_URL, SB_KEY);
        const tg = window.Telegram.WebApp;
        tg.expand();
        tg.headerColor = '#0A0A0A';
        tg.backgroundColor = '#0A0A0A';

        const myName = tg.initDataUnsafe.user?.first_name || 'Я';

        // Состояния
        let userFilter = 'all'; // all, me, partner
        let catFilter = 'all';  // all, gift, food, place, goodies
        let currentDesire = 1;

        // Свайп
        let startX = 0;
        let startY = 0;
        const categories = ['all', 'gift', 'food', 'place', 'goodies'];

        async function loadItems() {
            let query = supabaseClient.from('items').select('*').order('created_at', { ascending: false });
            
            // Фильтр по категории
            if (catFilter !== 'all') query = query.eq('category', catFilter);
            
            const { data, error } = await query;
            if (error) return console.error(error);

            // Фильтр по пользователю (делаем на клиенте для простоты)
            let filteredData = data;
            if (userFilter === 'me') {
                filteredData = data.filter(item => item.added_by === myName);
            } else if (userFilter === 'partner') {
                filteredData = data.filter(item => item.added_by !== myName);
            }

            render(filteredData);
        }

        function render(items) {
            const list = document.getElementById('wishlist');
            if (items.length === 0) {
                list.className = "mt-20 text-center";
                list.innerHTML = `<div class="text-white/30">Ничего не найдено 🤷‍♂️</div>`;
                return;
            }

            list.className = "grid grid-cols-2 gap-4"; // Возвращаем сетку
            list.innerHTML = items.map(item => `
                <div onclick="viewItem(${JSON.stringify(item).replace(/"/g, '&quot;')})" class="glass-card flex flex-col relative ${item.is_completed ? 'opacity-30 grayscale' : ''} ${item.desire_level === 4 ? 'desire-4' : ''} cursor-pointer">
                    ${item.image_url ? 
                        `<img src="${item.image_url}" class="h-32 w-full object-cover">` : 
                        `<div class="h-32 w-full bg-white/5 flex items-center justify-center text-4xl">${getCatData(item.category).emoji}</div>`
                    }
                    
                    <div class="p-3 flex flex-col flex-grow">
                        <div class="text-xs text-white/50 mb-1 flex justify-between">
                            <span>${item.added_by === myName ? 'Моё' : 'Её'}</span>
                            ${item.desire_level ? '🔥'.repeat(item.desire_level) : ''}
                        </div>
                        <div class="font-semibold text-sm mb-2 leading-tight">${item.title}</div>
                        ${item.price ? `<div class="text-xs font-bold text-green-400 mb-2">${item.price}</div>` : ''}
                        
                        <div class="mt-auto flex gap-2">
                            ${item.link ? `<a href="${item.link}" target="_blank" class="flex-1 bg-white/10 text-center py-1.5 rounded-lg text-xs hover:bg-white/20">Ссылка</a>` : ''}
                            ${item.location ? `<a href="${item.location}" target="_blank" class="flex-1 bg-blue-500/20 text-blue-300 text-center py-1.5 rounded-lg text-xs hover:bg-blue-500/40">Карта</a>` : ''}
                        </div>
                    </div>
                    <div class="category-badge">${getCatData(item.category).emoji}</div>
                    <div class="absolute top-2 right-2 flex gap-1" onclick="event.stopPropagation()">
                        ${item.added_by === myName ? `<button onclick="editItem(${JSON.stringify(item).replace(/"/g, '&quot;')})" class="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white/50 flex items-center justify-center hover:border-white/50">
                            ✏️
                        </button>` : ''}
                        ${item.added_by === myName ? `<button onclick="deleteItem('${item.id}')" class="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-red-400/50 text-red-400 flex items-center justify-center hover:border-red-400">
                            🗑️
                        </button>` : ''}
                        <button onclick="toggleStatus('${item.id}', ${item.is_completed})" class="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border ${item.is_completed ? 'border-green-400 text-green-400' : 'border-white/20 text-white/50'} flex items-center justify-center">
                            ✓
                        </button>
                    </div>
                </div>
            `).join('');
        }

        function editItem(item) {
            // Заполняем поля данными элемента
            document.getElementById('edit-id').value = item.id;
            document.getElementById('modal-category').value = item.category;
            document.getElementById('m-title').value = item.title;
            document.getElementById('m-price').value = item.price || '';
            document.getElementById('m-link').value = item.link || '';
            document.getElementById('m-location').value = item.location || '';
            if (item.desire_level) currentDesire = item.desire_level;
            setDesire(currentDesire);
            
            // Обновляем поля модалки
            updateModalFields();
            
            // Меняем заголовок и кнопку
            document.querySelector('#modal h2').innerText = 'Редактировать';
            document.getElementById('saveBtn').innerText = 'Обновить в хотелки';
            
            // Показываем, что фото уже есть
            const imageLabel = document.querySelector('#field-image label');
            if (item.image_url) {
                imageLabel.innerText = 'Фотография (уже загружена, выберите новую для замены)';
            } else {
                imageLabel.innerText = 'Фотография';
            }
            
            // Открываем модалку
            document.getElementById('modal').classList.remove('hidden');
        }

        async function deleteItem(id) {
            if (confirm('Удалить этот элемент из хотелок?')) {
                await supabaseClient.from('items').delete().eq('id', id);
                loadItems();
                tg.HapticFeedback.impactOccurred('heavy');
            }
        }

        let viewItemLink = '';

        function viewItem(item) {
            document.getElementById('view-title').innerText = item.title;
            const imageDiv = document.getElementById('view-image');
            if (item.image_url) {
                imageDiv.innerHTML = `<img src="${item.image_url}" class="w-full h-full object-cover">`;
            } else {
                imageDiv.innerHTML = `<div class="w-full h-full bg-white/5 flex items-center justify-center text-6xl">${getCatData(item.category).emoji}</div>`;
            }
            const priceEl = document.getElementById('view-price');
            priceEl.innerText = item.price ? item.price : 'Цена не указана';
            const linkBtn = document.getElementById('view-link');
            const linkText = document.getElementById('view-link-text');
            if (item.link) {
                viewItemLink = item.link;
                linkBtn.classList.remove('hidden');
                linkText.innerText = item.link;
                linkText.classList.remove('text-white/60');
                linkText.classList.add('text-white');
            } else {
                viewItemLink = '';
                linkBtn.classList.add('hidden');
                linkText.innerText = 'Ссылка не добавлена';
                linkText.classList.remove('text-white');
                linkText.classList.add('text-white/60');
            }
            document.getElementById('view-modal').classList.remove('hidden');
        }

        function openLink() {
            if (viewItemLink) {
                window.open(viewItemLink, '_blank');
            }
        }

        function closeViewModal() {
            document.getElementById('view-modal').classList.add('hidden');
        }

        // --- УПРАВЛЕНИЕ UI ---

        function setUserFilter(f) {
            userFilter = f;
            ['all', 'me', 'partner'].forEach(id => {
                document.getElementById('u-'+id).className = "flex-1 py-2 rounded-xl tab-inactive transition-all text-sm";
            });
            document.getElementById('u-'+f).className = "flex-1 py-2 rounded-xl tab-active transition-all text-sm";
            loadItems();
        }

        function setCatFilter(f) {
            catFilter = f;
            ['all', 'gift', 'food', 'place', 'goodies'].forEach(id => {
                document.getElementById('c-'+id).className = "pb-1 cat-inactive transition-all";
            });
            document.getElementById('c-'+f).className = "pb-1 cat-active transition-all";
            loadItems();
        }

        function setDesire(level) {
            currentDesire = level;
            const btns = document.querySelectorAll('.desire-btn');
            btns.forEach((b, i) => {
                b.className = `desire-btn flex-1 py-2 rounded-xl text-xl border transition-all ${i+1 === level ? 'bg-white/20 border-white/50 scale-105' : 'bg-white/5 border-transparent'}`;
            });
        }

        function getCatData(c) {
            const data = {
                'gift': { emoji: '🎁' },
                'food': { emoji: '🍴' },
                'place': { emoji: '📍' },
                'goodies': { emoji: '🍬' }
            };
            return data[c] || { emoji: '✨' };
        }

        // --- ЛОГИКА ДОБАВЛЕНИЯ (ДИНАМИКА) ---

        function updateModalFields() {
            const cat = document.getElementById('modal-category').value;
            
            // Сбрасываем видимость
            document.getElementById('field-image').classList.remove('hidden');
            document.getElementById('field-link').classList.remove('hidden');
            document.getElementById('field-price').classList.remove('hidden');
            document.getElementById('field-location').classList.add('hidden');
            document.getElementById('field-desire').classList.add('hidden');

            const priceLabel = document.getElementById('label-price');

            if (cat === 'gift') {
                document.getElementById('field-desire').classList.remove('hidden');
                priceLabel.innerText = "Цена";
            } else if (cat === 'food') {
                document.getElementById('field-location').classList.remove('hidden');
                document.getElementById('field-image').classList.add('hidden');
                priceLabel.innerText = "Средний чек (на человека)";
            } else if (cat === 'place') {
                document.getElementById('field-location').classList.remove('hidden');
                document.getElementById('field-image').classList.add('hidden');
                priceLabel.innerText = "Стоимость (если есть)";
            } else if (cat === 'goodies') {
                priceLabel.innerText = "Цена";
            }
        }

        async function saveItem() {
            const title = document.getElementById('m-title').value;
            if (!title) { alert('Название обязательно!'); return; }

            const btn = document.getElementById('saveBtn');
            btn.innerText = 'Загрузка...';
            btn.disabled = true;

            const editId = document.getElementById('edit-id').value;
            const cat = document.getElementById('modal-category').value;
            const price = document.getElementById('m-price').value;
            const link = document.getElementById('m-link').value;
            const location = document.getElementById('m-location').value;
            
            let imageUrl = null;
            
            // Обработка загрузки фото (только если новый файл выбран)
            const fileInput = document.getElementById('m-image');
            if (fileInput.files.length > 0 && !document.getElementById('field-image').classList.contains('hidden')) {
                const file = fileInput.files[0];
                const reader = new FileReader();
                reader.onload = function(e) {
                    const base64 = e.target.result;
                    imageUrl = base64;
                };
                reader.readAsDataURL(file);
                // Ждём загрузки
                await new Promise(resolve => reader.onloadend = resolve);
            }

            const payload = {
                title,
                category: cat,
                added_by: myName,
                price: price || null,
                link: link || null,
                location: location || null,
                desire_level: cat === 'gift' ? currentDesire : null
            };
            
            if (imageUrl) payload.image_url = imageUrl; // Обновляем фото только если новое

            if (editId) {
                // Обновляем существующий элемент
                await supabaseClient.from('items').update(payload).eq('id', editId);
            } else {
                // Создаем новый элемент
                await supabaseClient.from('items').insert([payload]);
            }

            // Очистка формы
            document.getElementById('edit-id').value = '';
            document.getElementById('m-title').value = '';
            document.getElementById('m-price').value = '';
            document.getElementById('m-link').value = '';
            document.getElementById('m-location').value = '';
            fileInput.value = '';
            setDesire(1);
            
            closeModal();
            loadItems();
            tg.HapticFeedback.notificationOccurred('success');
            
            btn.innerText = editId ? 'Обновить в хотелки' : 'Сохранить в хотелки';
            btn.disabled = false;
        }

        async function toggleStatus(id, current) {
            await supabaseClient.from('items').update({ is_completed: !current }).eq('id', id);
            tg.HapticFeedback.impactOccurred('light');
            loadItems();
        }

        function openModal() { 
            document.getElementById('edit-id').value = '';
            document.querySelector('#modal h2').innerText = 'Добавить';
            document.getElementById('saveBtn').innerText = 'Сохранить в хотелки';
            document.querySelector('#field-image label').innerText = 'Фотография';
            document.getElementById('modal').classList.remove('hidden'); 
            updateModalFields(); // Обновляем поля под текущую выбранную категорию
            setDesire(1);
        }
        function closeModal() { 
            document.getElementById('edit-id').value = '';
            document.querySelector('#field-image label').innerText = 'Фотография';
            document.getElementById('modal').classList.add('hidden'); 
        }

        // Realtime
        supabaseClient.channel('any').on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, loadItems).subscribe();

        // Старт
        loadItems();

        // Свайп для категорий
        document.body.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        document.body.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const deltaX = endX - startX;
            const deltaY = endY - startY;

            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                const currentIndex = categories.indexOf(catFilter);
                if (deltaX > 0 && currentIndex > 0) {
                    // Свайп вправо - предыдущая категория
                    setCatFilter(categories[currentIndex - 1]);
                } else if (deltaX < 0 && currentIndex < categories.length - 1) {
                    // Свайп влево - следующая категория
                    setCatFilter(categories[currentIndex + 1]);
                }
            }
        });