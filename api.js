/**
 * API Module — работа с backend (n8n webhooks)
 * Все запросы автоматически передают Telegram initData для авторизации
 */
const Api = (() => {
    // ⚠️ ЗАМЕНИТЕ на URL вашего n8n webhook (публичный URL)
    const API_BASE_URL = 'https://anxietycoach.online/webhook';
    
    // Пути эндпоинтов
    const ENDPOINTS = {
        PRODUCTS: '/menu',
        COMING_SOON: '/coming-soon',
        CHECKOUT: '/order'
    };

    /**
     * Получить Telegram initData (криптографически подписанный токен)
     * @returns {string} initData или пустая строка
     */
    function getInitData() {
        try {
            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
                return window.Telegram.WebApp.initData;
            }
        } catch (e) {
            console.warn('Telegram WebApp недоступен:', e);
        }
        return '';
    }

    /**
     * Получить telegram_id текущего пользователя (для логирования)
     * @returns {number|null}
     */
    function getUserId() {
        try {
            if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
                return window.Telegram.WebApp.initDataUnsafe.user.id;
            }
        } catch (e) {}
        return null;
    }

    /**
     * Базовый fetch-обертка с обработкой ошибок и заголовками
     * @param {string} endpoint 
     * @param {object} options 
     * @returns {Promise<any>}
     */
    async function request(endpoint, options = {}) {
        const url = API_BASE_URL + endpoint;
        const initData = getInitData();
        
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        // Добавляем Telegram initData для авторизации на backend
        if (initData) {
            defaultHeaders['X-Telegram-Init-Data'] = initData;
        }

        const userId = getUserId();
        if (userId) {
            defaultHeaders['X-Telegram-User-Id'] = String(userId);
        }

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...(options.headers || {})
            }
        };

        try {
            const response = await fetch(url, config);
            
            // Проверка HTTP статуса
            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    // Игнорируем ошибки парсинга
                }
                throw new Error(errorMessage);
            }

            // Парсим ответ (если он есть)
            const text = await response.text();
            if (!text) return null;
            
            try {
                return JSON.parse(text);
            } catch (e) {
                return text;
            }
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    /**
     * Получить список активных товаров
     * @returns {Promise<Array>}
     */
    async function getProducts() {
        try {
            const data = await request(ENDPOINTS.PRODUCTS, { method: 'GET' });
            return Array.isArray(data) ? data : (data?.products || []);
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            // Возвращаем пустой массив, чтобы приложение не падало
            return [];
        }
    }

    /**
     * Получить список "Скоро появится"
     * @returns {Promise<Array>}
     */
    async function getComingSoon() {
        try {
            const data = await request(ENDPOINTS.COMING_SOON, { method: 'GET' });
            return Array.isArray(data) ? data : (data?.items || []);
        } catch (error) {
            console.error('Ошибка загрузки "Скоро появится":', error);
            return [];
        }
    }

    /**
     * Оформить заказ
     * @param {object} orderData 
     * @param {string} orderData.name
     * @param {string} orderData.phone
     * @param {string} orderData.address
     * @param {Array} orderData.items - [{ id, name, price, quantity }]
     * @returns {Promise<object>}
     */
    async function checkout(orderData) {
        if (!orderData.items || orderData.items.length === 0) {
            throw new Error('Корзина пуста');
        }

        if (!orderData.name || !orderData.phone || !orderData.address) {
            throw new Error('Заполните все поля');
        }

        // Валидация телефона (базовая)
        const phoneClean = orderData.phone.replace(/\D/g, '');
        if (phoneClean.length < 10) {
            throw new Error('Некорректный номер телефона');
        }

        const payload = {
            name: orderData.name.trim(),
            phone: orderData.phone.trim(),
            address: orderData.address.trim(),
            items: orderData.items.map(item => ({
                id: item.id,
                name: item.name,
                price: Number(item.price),
                quantity: Number(item.quantity)
            })),
            telegram_id: getUserId()
        };

        return await request(ENDPOINTS.CHECKOUT, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    // Публичный API модуля
    return {
        getProducts,
        getComingSoon,
        checkout,
        getUserId,
        getInitData
    };
})();

// Экспорт в глобальную область видимости
window.Api = Api;