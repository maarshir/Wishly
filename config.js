// Настройки подключения к Supabase для рабочей версии приложения.
// Ключ здесь публичного типа (sb_publishable): браузер всё равно получает его при загрузке страницы,
// поэтому он не секрет. Данные защищают правила доступа (RLS) в самой базе, см. README.
// Секретный ключ (service_role / sb_secret) сюда класть нельзя никогда.
window.WISHLY_CONFIG = {
    supabaseUrl: 'https://gsjozmgbwuglqevjxuaj.supabase.co',
    supabaseKey: 'sb_publishable_NkwRATYjXxOox-HSnLd4xg_06Ds2vzH',
};
