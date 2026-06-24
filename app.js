/**
 * Main Application Module
 * Telegram Mini App — АгроМагазин (Клиентская часть)
 */
const App = (() => {
    // Ссылка на Telegram WebApp SDK
    const tg = window.Telegram?.WebApp;
    
    // ============================================
    // STATE — глобальное состояние приложения
    // ============================================
    const state = {
        products: [],
        comingSoon: [],
        cart: {},           // { productId: { ...product, quantity } }
        currentScreen: 'home',
        currentProduct: null,
        isInitialized: false
    };

    const CART_STORAGE_KEY = 'agroshop_cart_v1';

    // ============================================
    // DOM REFERENCES
    // ============================================
    const DOM = {
        loader: document.getElementById('loader'),
        toast: document.getElementById('toast'),
        backBtn: document.getElementById('back-btn'),
        cartBtn: document.getElementById('cart-btn'),
        cartBadge: document.getElementById('cart-badge'),
        cartSheetCount: document.getElementById('cart-sheet-count'),
        cartCheckoutBtn: document.getElementById('cart-checkout-btn'),
        pageTitle: document.getElementById('page-title'),
        viewAllBtn: document.getElementById('view-all-btn'),
        goCatalogBtn: document.getElementById('go-catalog-btn'),
        backHomeBtn: document.getElementById('back-home-btn'),
        heroDots: document.getElementById('hero-dots'),
        
        // Экраны
        screens: {
            home: document.getElementById('screen-home'),
            catalog: document.getElementById('screen-catalog'),
            product: document.getElementById('screen-product'),
            cart: document.getElementById('screen-cart'),
            checkout: document.getElementById('screen-checkout'),
            success: document.getElementById('screen-success')
        },
        
        // Контейнеры
        catalogPreview: document.getElementById('catalog-preview'),
        catalogFull: document.getElementById('catalog-full'),
        catalogEmpty: document.getElementById('catalog-empty'),
        productDetail: document.getElementById('product-detail'),
        cartItems: document.getElementById('cart-items'),
        cartSummary: document.getElementById('cart-summary'),
        cartEmpty: document.getElementById('cart-empty'),
        comingSoonList: document.getElementById('coming-soon-list'),
        subtotal: document.getElementById('subtotal'),
        totalPrice: document.getElementById('total-price'),
        checkoutTotalPrice: document.getElementById('checkout-total-price'),
        
        // Форма
        checkoutForm: document.getElementById('checkout-form'),
        inputName: document.getElementById('input-name'),
        inputPhone: document.getElementById('input-phone'),
        inputAddress: document.getElementById('input-address')
    };

    const heroState = {
        current: 0,
        timer: null,
        interval: 3600
    };

    let headerApple = null;

    function getHomeTitleHtml() {
        return '<span class="header-apple" aria-hidden="true"><span class="header-apple-fallback">🍏</span></span> АгроМагазин';
    }

    function stopHeaderApple() {
        if (!headerApple) return;

        if (headerApple.frameId) {
            cancelAnimationFrame(headerApple.frameId);
        }

        if (headerApple.renderer) {
            headerApple.renderer.dispose();
        }

        headerApple = null;
    }

    function initHeaderApple() {
        const container = DOM.pageTitle.querySelector('.header-apple');
        if (!container || container.classList.contains('is-rendered') || !window.THREE) return;

        try {
            stopHeaderApple();

            const THREE = window.THREE;
            const scene = new THREE.Scene();
            const camera = new THREE.OrthographicCamera(-1.25, 1.25, 1.25, -1.25, 0.1, 10);
            camera.position.set(0, 0.1, 4);
            camera.lookAt(0, 0, 0);

            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            renderer.setSize(22, 22, false);
            renderer.outputColorSpace = THREE.SRGBColorSpace;

            const group = new THREE.Group();
            scene.add(group);

            const appleProfile = [
                new THREE.Vector2(0, -0.82),
                new THREE.Vector2(0.44, -0.72),
                new THREE.Vector2(0.66, -0.38),
                new THREE.Vector2(0.72, 0.08),
                new THREE.Vector2(0.58, 0.48),
                new THREE.Vector2(0.3, 0.68),
                new THREE.Vector2(0.08, 0.58),
                new THREE.Vector2(0, 0.5)
            ];
            const appleGeometry = new THREE.LatheGeometry(appleProfile, 40);
            const appleMaterial = new THREE.MeshStandardMaterial({
                color: 0x77b82a,
                roughness: 0.42,
                metalness: 0.02
            });
            const apple = new THREE.Mesh(appleGeometry, appleMaterial);
            apple.scale.set(0.82, 0.82, 0.82);
            group.add(apple);

            const stem = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.065, 0.34, 10),
                new THREE.MeshStandardMaterial({ color: 0x6b3b1c, roughness: 0.6 })
            );
            stem.position.set(0.08, 0.68, 0);
            stem.rotation.z = -0.28;
            group.add(stem);

            const leafShape = new THREE.Shape();
            leafShape.moveTo(0, 0);
            leafShape.bezierCurveTo(0.18, 0.12, 0.34, 0.1, 0.48, 0);
            leafShape.bezierCurveTo(0.32, -0.08, 0.16, -0.1, 0, 0);
            const leaf = new THREE.Mesh(
                new THREE.ShapeGeometry(leafShape),
                new THREE.MeshStandardMaterial({
                    color: 0x4f9e2f,
                    roughness: 0.48,
                    side: THREE.DoubleSide
                })
            );
            leaf.position.set(0.08, 0.82, 0);
            leaf.rotation.set(0.28, -0.34, 0.32);
            leaf.scale.set(0.7, 0.7, 0.7);
            group.add(leaf);

            scene.add(new THREE.HemisphereLight(0xffffff, 0xb5d28a, 1.8));
            const keyLight = new THREE.DirectionalLight(0xffffff, 1.7);
            keyLight.position.set(2.5, 3, 3);
            scene.add(keyLight);
            const fillLight = new THREE.DirectionalLight(0xd6f7ff, 0.7);
            fillLight.position.set(-2, 1, 2);
            scene.add(fillLight);

            container.appendChild(renderer.domElement);
            container.classList.add('is-rendered');

            headerApple = { container, renderer, frameId: null };

            const animate = () => {
                if (!container.isConnected) {
                    stopHeaderApple();
                    return;
                }

                group.rotation.y += 0.018;
                renderer.render(scene, camera);
                headerApple.frameId = requestAnimationFrame(animate);
            };

            animate();
        } catch (error) {
            console.warn('3D header apple fallback:', error);
            stopHeaderApple();
            container.classList.remove('is-rendered');
        }
    }

    // ============================================
    // TELEGRAM INIT
    // ============================================
    function initTelegram() {
        if (!tg) {
            console.warn('Запуск вне Telegram. Некоторые функции будут недоступны.');
            return;
        }
        
        // Инициализация WebApp
        tg.ready();
        tg.expand();
        
        // Применение темы (Telegram сам применит CSS переменные, но мы можем форсировать)
        document.documentElement.setAttribute('data-theme', tg.colorScheme);
        
        // Отключаем вертикальные свайпы для закрытия (чтобы не было случайных выходов)
        tg.disableVerticalSwipes?.();
        
        // Скрываем нативную кнопку MainButton на главной — будем включать её только на корзине
        tg.MainButton.hide();
        tg.MainButton.setParams({
            text: 'ОФОРМИТЬ ЗАКАЗ',
            color: getComputedStyle(document.documentElement).getPropertyValue('--tg-theme-button-color').trim() || '#40a7e3',
            text_color: getComputedStyle(document.documentElement).getPropertyValue('--tg-theme-button-text-color').trim() || '#ffffff'
        });
        
        // Обработчик нажатия на нативную кнопку
        tg.MainButton.onClick(() => {
            if (state.currentScreen === 'cart') {
                navigateTo('checkout');
            } else if (state.currentScreen === 'checkout') {
                submitCheckout();
            }
        });
        
        // Back button Telegram
        tg.BackButton.onClick(() => {
            handleBackButton();
        });
        
        // Тема изменилась
        tg.onEvent?.('themeChanged', () => {
            document.documentElement.setAttribute('data-theme', tg.colorScheme);
        });
    }

    // ============================================
    // НАВИГАЦИЯ
    // ============================================
    function navigateTo(screenName, options = {}) {
        // Скрываем текущий экран
        Object.values(DOM.screens).forEach(s => s.classList.remove('active'));
        
        // Показываем нужный
        const screen = DOM.screens[screenName];
        if (!screen) {
            console.error('Экран не найден:', screenName);
            return;
        }
        screen.classList.add('active');
        
        const prevScreen = state.currentScreen;
        state.currentScreen = screenName;
        
        // Заголовки и кнопки
        const config = getScreenConfig(screenName);
        if (screenName === 'home') {
            DOM.pageTitle.innerHTML = getHomeTitleHtml();
            initHeaderApple();
        } else {
            stopHeaderApple();
            DOM.pageTitle.textContent = config.title;
        }
        DOM.backBtn.classList.toggle('hidden', !config.showBack);
        DOM.cartBtn.classList.toggle('hidden', screenName === 'cart' || screenName === 'checkout' || screenName === 'success');
        
        // Telegram BackButton
        if (tg) {
            if (config.showBack) {
                tg.BackButton.show();
            } else {
                tg.BackButton.hide();
            }
        }
        
        // MainButton (нативная кнопка Telegram)
        if (tg) {
            if (screenName === 'cart' && getCartItemsCount() > 0) {
                updateMainButtonText();
                tg.MainButton.show();
            } else if (screenName === 'checkout') {
                tg.MainButton.setParams({ text: 'ПОДТВЕРДИТЬ ЗАКАЗ' });
                tg.MainButton.show();
            } else {
                tg.MainButton.hide();
            }
        }
        
        // Рендеринг контента
        renderScreen(screenName, options);
        
        // Scroll to top
        window.scrollTo(0, 0);
        
        // Haptic feedback
        haptic('light');
    }

    function getScreenConfig(screenName) {
        const configs = {
            home: { title: 'АгроМагазин', showBack: false },
            catalog: { title: 'Каталог', showBack: true },
            product: { title: state.currentProduct?.name || 'Товар', showBack: true },
            cart: { title: 'Корзина', showBack: true },
            checkout: { title: 'Оформление', showBack: true },
            success: { title: 'Готово', showBack: false }
        };
        return configs[screenName] || { title: 'АгроМагазин', showBack: false };
    }

    function handleBackButton() {
        const backMap = {
            catalog: 'home',
            product: 'catalog',
            cart: 'home',
            checkout: 'cart'
        };
        const target = backMap[state.currentScreen];
        if (target) {
            navigateTo(target);
        } else {
            // На главной или success — выходим из Mini App
            tg?.close();
        }
    }

    function renderScreen(screenName, options = {}) {
        switch (screenName) {
            case 'home':
                renderHome();
                break;
            case 'catalog':
                renderCatalog();
                break;
            case 'product':
                renderProductDetail();
                break;
            case 'cart':
                renderCart();
                break;
            case 'checkout':
                renderCheckout();
                break;
            case 'success':
                // Успех уже отрендерен в HTML
                break;
        }
    }

    // ============================================
    // HAPTIC FEEDBACK
    // ============================================
    function haptic(type = 'light') {
        if (tg?.HapticFeedback) {
            try {
                tg.HapticFeedback.impactOccurred(type);
            } catch (e) {
                // Игнорируем ошибки на устройствах без тактильной отдачи
            }
        }
    }

    function hapticNotify(type = 'success') {
        if (tg?.HapticFeedback) {
            try {
                tg.HapticFeedback.notificationOccurred(type);
            } catch (e) {}
        }
    }

    // ============================================
    // TOAST
    // ============================================
    let toastTimer = null;
    function showToast(message, duration = 2000) {
        DOM.toast.textContent = message;
        DOM.toast.classList.add('show');
        
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            DOM.toast.classList.remove('show');
        }, duration);
    }

    // ============================================
    // КОРЗИНА
    // ============================================
    function loadCart() {
        try {
            const saved = localStorage.getItem(CART_STORAGE_KEY);
            if (saved) {
                state.cart = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Ошибка загрузки корзины:', e);
            state.cart = {};
        }
    }

    function saveCart() {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
        } catch (e) {
            console.error('Ошибка сохранения корзины:', e);
        }
    }

    function addToCart(product) {
        if (!product || !product.id) return;
        
        if (state.cart[product.id]) {
            state.cart[product.id].quantity += 1;
        } else {
            state.cart[product.id] = {
                id: product.id,
                name: product.name,
                price: Number(product.price),
                image_url: product.image_url,
                emoji: product.emoji,
                quantity: 1
            };
        }
        
        saveCart();
        updateCartBadge();
        showToast(`${product.name} добавлен в корзину`);
        haptic('medium');
        
        // Пульс анимация на кнопке
        const addBtns = document.querySelectorAll(`[data-id="${product.id}"][data-action="add"]`);
        addBtns.forEach(btn => {
            btn.classList.add('pulse');
            setTimeout(() => btn.classList.remove('pulse'), 400);
        });
    }

    function updateQuantity(productId, delta) {
        const item = state.cart[productId];
        if (!item) return;
        
        const newQty = item.quantity + delta;
        
        if (newQty <= 0) {
            delete state.cart[productId];
            haptic('light');
        } else {
            item.quantity = newQty;
            haptic('light');
        }
        
        saveCart();
        updateCartBadge();
        
        // Если мы на экране корзины — перерисовать
        if (state.currentScreen === 'cart') {
            renderCart();
        }
        
        // Обновить MainButton
        if (tg && state.currentScreen === 'cart') {
            if (getCartItemsCount() > 0) {
                updateMainButtonText();
                tg.MainButton.show();
            } else {
                tg.MainButton.hide();
            }
        }
    }

    function clearCart() {
        state.cart = {};
        saveCart();
        updateCartBadge();
    }

    function getCartItems() {
        return Object.values(state.cart);
    }

    function getCartItemsCount() {
        return Object.values(state.cart).reduce((sum, item) => sum + item.quantity, 0);
    }

    function getCartTotal() {
        return Object.values(state.cart).reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    function updateCartBadge() {
        const count = getCartItemsCount();
        if (count > 0) {
            DOM.cartBadge.textContent = count > 99 ? '99+' : count;
            DOM.cartBadge.classList.remove('hidden');
            const hint = document.getElementById('cart-hint');
            if (hint) {
    hint.style.display = count > 0 ? 'inline' : 'none';
}
        } else {
            DOM.cartBadge.classList.add('hidden');
            const hint = document.getElementById('cart-hint');
            if (hint) {
                hint.style.display = 'none';
            }
        }
    }

    function updateMainButtonText() {
        if (tg) {
            const total = getCartTotal();
            tg.MainButton.setParams({
                text: `ОФОРМИТЬ • ${formatPrice(total)} ₽`
            });
        }
    }

    // ============================================
    // RENDERING
    // ============================================
    function formatPrice(price) {
        const num = Number(price) || 0;
        return num.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }

    function createProductCard(product, options = {}) {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        const productImage = getProductImage(product);
        
        card.innerHTML = `
            <div class="product-image" ${productImage.style}>${productImage.content}</div>
            <div class="product-info">
                <div class="product-name">${escapeHtml(product.name)}</div>
                <div class="product-price-row">
                    <div class="product-price">${formatPrice(product.price)} ₽</div>
                    <button class="add-btn" data-action="add" data-id="${escapeHtml(product.id)}" aria-label="Добавить">+</button>
                </div>
            </div>
        `;
        
        // Клик на карточку — открытие деталей
        card.addEventListener('click', (e) => {
            if (e.target.dataset.action === 'add') {
                e.stopPropagation();
                addToCart(product);
                return;
            }
            if (!options.disableDetails) {
                openProductDetail(product);
            }
        });
        
        return card;
    }

    function getProductImage(product) {
        const imageUrl = (product?.image_url || '').trim();
        const hasImage = /^https?:\/\//i.test(imageUrl);
        const fallback = escapeHtml(product?.emoji || getEmojiForProduct(product?.name));
        return {
            style: '',
            content: hasImage
                ? `<img class="product-photo" src="${escapeHtml(imageUrl)}" alt="" loading="lazy" onerror="this.parentElement.textContent='${fallback}'">`
                : fallback
        };
    }

    function getEmojiForProduct(name) {
        const lower = (name || '').toLowerCase();
        if (lower.includes('картоф')) return '🥔';
        if (lower.includes('морков')) return '🥕';
        if (lower.includes('томат') || lower.includes('помидор')) return '🍅';
        if (lower.includes('огур')) return '🥒';
        if (lower.includes('яблок')) return '🍎';
        if (lower.includes('груш')) return '🍐';
        if (lower.includes('клубник')) return '🍓';
        if (lower.includes('малин')) return '🫐';
        if (lower.includes('чеснок')) return '🧄';
        if (lower.includes('лук')) return '🧅';
        if (lower.includes('перец')) return '🌶️';
        if (lower.includes('капуст')) return '🥬';
        if (lower.includes('свекл')) return '🥗';
        if (lower.includes('мёд') || lower.includes('мед')) return '🍯';
        if (lower.includes('яйц')) return '🥚';
        return '🌾';
    }

    function renderHome() {
        // Превью каталога (первые 4 товара)
        DOM.catalogPreview.innerHTML = '';
        const preview = state.products.slice(0, 4);
        preview.forEach(p => DOM.catalogPreview.appendChild(createProductCard(p)));
        
        if (state.products.length === 0) {
            DOM.catalogPreview.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--tg-theme-hint-color);">Товары загружаются...</p>';
        }
        
        // Скоро появится
        renderComingSoon();
    }

    function renderCatalog() {
        DOM.catalogFull.innerHTML = '';
        
        if (state.products.length === 0) {
            DOM.catalogEmpty.classList.remove('hidden');
            return;
        }
        
        DOM.catalogEmpty.classList.add('hidden');
        state.products.forEach(p => DOM.catalogFull.appendChild(createProductCard(p)));
    }

    function renderComingSoon() {
        DOM.comingSoonList.innerHTML = '';
        
        if (state.comingSoon.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'coming-soon-item';
            empty.innerHTML = `
                <span class="coming-soon-name" style="color: var(--tg-theme-hint-color);">Список пока пуст</span>
            `;
            DOM.comingSoonList.appendChild(empty);
            return;
        }
        
        state.comingSoon.forEach(item => {
            const el = document.createElement('div');
            el.className = 'coming-soon-item';
            el.innerHTML = `
                <span class="coming-soon-name">${escapeHtml(item.name)}</span>
                <span class="coming-soon-badge">${escapeHtml(item.season) || 'Скоро'}</span>
            `;
            DOM.comingSoonList.appendChild(el);
        });
    }

    function openProductDetail(product) {
        state.currentProduct = product;
        navigateTo('product');
    }

    function renderProductDetail() {
        const p = state.currentProduct;
        if (!p) return;
        
        DOM.pageTitle.textContent = p.name;
        
        const productImage = getProductImage(p);
        
        DOM.productDetail.innerHTML = `
            <div class="product-detail-image" ${productImage.style}>${productImage.content}</div>
            <h2 class="product-detail-title">${escapeHtml(p.name)}</h2>
            <div class="product-detail-price">${formatPrice(p.price)} ₽ / кг</div>
            <p class="product-detail-description">${escapeHtml(p.description || 'Свежий фермерский продукт. Выращено с заботой и любовью.')}</p>
            <button id="detail-add-btn" class="btn btn-primary btn-full">Добавить в корзину</button>
        `;
        
        document.getElementById('detail-add-btn').addEventListener('click', () => {
            addToCart(p);
        });
    }

    function renderCart() {
        const items = getCartItems();
        DOM.cartItems.innerHTML = '';
        updateCartSheetCount();
        
        if (items.length === 0) {
            DOM.cartEmpty.classList.remove('hidden');
            DOM.cartSummary.classList.add('hidden');
            if (tg) tg.MainButton.hide();
            return;
        }
        
        DOM.cartEmpty.classList.add('hidden');
        DOM.cartSummary.classList.remove('hidden');
        
        items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'cart-item';
            
            const productImage = getProductImage(item);
            
            const itemTotal = item.price * item.quantity;
            
            row.innerHTML = `
                <div class="cart-item-image" ${productImage.style}>${productImage.content}</div>
                <div class="cart-item-info">
                    <div>
                        <div class="cart-item-name">${escapeHtml(item.name)}</div>
                        <div class="cart-item-price">${formatPrice(item.price)} ₽ / шт</div>
                    </div>
                    <div class="cart-item-footer">
                        <div class="quantity-control">
                            <button class="qty-btn ${item.quantity === 1 ? 'remove' : ''}" data-action="dec" data-id="${item.id}" aria-label="Уменьшить">
                                ${item.quantity === 1 ? '🗑' : '−'}
                            </button>
                            <div class="qty-value">${item.quantity}</div>
                            <button class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="Увеличить">+</button>
                        </div>
                        <div class="cart-item-total">${formatPrice(itemTotal)} ₽</div>
                    </div>
                </div>
            `;
            
            DOM.cartItems.appendChild(row);
        });
        
        // Обработчики для +/- 
        DOM.cartItems.querySelectorAll('[data-action="inc"]').forEach(btn => {
            btn.addEventListener('click', () => updateQuantity(btn.dataset.id, 1));
        });
        DOM.cartItems.querySelectorAll('[data-action="dec"]').forEach(btn => {
            btn.addEventListener('click', () => updateQuantity(btn.dataset.id, -1));
        });
        
        // Итоги
        const total = getCartTotal();
        DOM.subtotal.textContent = `${formatPrice(total)} ₽`;
        DOM.totalPrice.textContent = `${formatPrice(total)} ₽`;
        
        updateMainButtonText();
    }

    function updateCartSheetCount() {
        if (!DOM.cartSheetCount) return;
        const count = getCartItemsCount();
        DOM.cartSheetCount.textContent = count > 99 ? '99+' : count;
        DOM.cartSheetCount.classList.toggle('hidden', count === 0);
    }

    function renderCheckout() {
        const total = getCartTotal();
        DOM.checkoutTotalPrice.textContent = `${formatPrice(total)} ₽`;
        
        // Фокус на первом поле
        setTimeout(() => DOM.inputName.focus(), 300);
    }

    // ============================================
    // CHECKOUT
    // ============================================
    async function submitCheckout() {
        // Валидация формы
        const name = DOM.inputName.value.trim();
        const phone = DOM.inputPhone.value.trim();
        const address = DOM.inputAddress.value.trim();
        
        let hasError = false;
        
        [DOM.inputName, DOM.inputPhone, DOM.inputAddress].forEach(el => el.classList.remove('invalid'));
        
        if (!name) {
            DOM.inputName.classList.add('invalid');
            hasError = true;
        }
        if (!phone || phone.replace(/\D/g, '').length < 10) {
            DOM.inputPhone.classList.add('invalid');
            hasError = true;
        }
        if (!address) {
            DOM.inputAddress.classList.add('invalid');
            hasError = true;
        }
        
        if (hasError) {
            showToast('Заполните все поля корректно');
            hapticNotify('error');
            return;
        }
        
        // Блокируем кнопку
        if (tg) {
            tg.MainButton.showProgress();
            tg.MainButton.disable();
        }
        
        try {
            const orderData = {
                name,
                phone,
                address,
                items: getCartItems()
            };
            
            await Api.checkout(orderData);
            
            // Успех!
            hapticNotify('success');
            clearCart();
            DOM.checkoutForm.reset();
            
            navigateTo('success');
            
            // Закрываем MainButton на success
            if (tg) tg.MainButton.hide();
            
        } catch (error) {
            console.error('Ошибка оформления заказа:', error);
            showToast(`Ошибка: ${error.message || 'Попробуйте позже'}`);
            hapticNotify('error');
        } finally {
            if (tg) {
                tg.MainButton.hideProgress();
                tg.MainButton.enable();
            }
        }
    }

    // ============================================
    // DATA LOADING
    // ============================================
    async function loadData() {
        DOM.loader.classList.remove('hidden');
        
        try {
            // Параллельная загрузка товаров и "Скоро появится"
            const [products, comingSoon] = await Promise.all([
                Api.getProducts(),
                Api.getComingSoon()
            ]);
            
            state.products = products;
            state.comingSoon = comingSoon;
            
            // Рендер главной
            renderHome();
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            showToast('Не удалось загрузить данные');
        } finally {
            DOM.loader.classList.add('hidden');
        }
    }

    // ============================================
    // ESCAPE HTML (защита от XSS)
    // ============================================
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ============================================
    // PHONE MASK (простая)
    // ============================================
    function setupPhoneMask() {
        DOM.inputPhone.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.startsWith('8')) {
                value = '7' + value.slice(1);
            }
            if (!value.startsWith('7') && value.length > 0) {
                value = '7' + value;
            }
            
            let formatted = '';
            if (value.length > 0) formatted = '+' + value[0];
            if (value.length > 1) formatted += ' (' + value.slice(1, 4);
            if (value.length >= 4) formatted += ') ' + value.slice(4, 7);
            if (value.length >= 7) formatted += '-' + value.slice(7, 9);
            if (value.length >= 9) formatted += '-' + value.slice(9, 11);
            
            e.target.value = formatted;
        });
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================
    function bindEvents() {
        // Кнопка назад (наш хедер)
        DOM.backBtn.addEventListener('click', () => {
            handleBackButton();
        });
        
        // Кнопка корзины
        DOM.cartBtn.addEventListener('click', () => {
            navigateTo('cart');
        });
        
        // "Смотреть весь каталог"
        DOM.viewAllBtn.addEventListener('click', () => {
            navigateTo('catalog');
        });
        
        // "Перейти в каталог" (из пустой корзины)
        DOM.goCatalogBtn.addEventListener('click', () => {
            navigateTo('catalog');
        });
        
        // "На главную" (после успеха)
        DOM.backHomeBtn.addEventListener('click', () => {
            navigateTo('home');
        });

        if (DOM.cartCheckoutBtn) {
            DOM.cartCheckoutBtn.addEventListener('click', () => {
                if (getCartItemsCount() > 0) {
                    navigateTo('checkout');
                }
            });
        }
        
        // Маска телефона
        setupPhoneMask();
        
        // Предотвращаем отправку формы по Enter
        DOM.checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (state.currentScreen === 'checkout') {
                submitCheckout();
            }
        });
    }

    // ============================================
    // HERO SLIDER
    // ============================================
    function setupHeroSlider() {
        const slides = Array.from(document.querySelectorAll('.hero-slide'));
        const arrows = Array.from(document.querySelectorAll('[data-hero-dir]'));
        if (slides.length === 0 || !DOM.heroDots) return;

        DOM.heroDots.innerHTML = '';
        slides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = 'hero-dot';
            dot.type = 'button';
            dot.setAttribute('aria-label', `Слайд ${index + 1}`);
            dot.addEventListener('click', () => {
                setHeroSlide(index);
                restartHeroSlider();
            });
            DOM.heroDots.appendChild(dot);
        });

        arrows.forEach(btn => {
            btn.addEventListener('click', () => {
                const direction = Number(btn.dataset.heroDir) || 1;
                setHeroSlide(heroState.current + direction);
                restartHeroSlider();
            });
        });

        setHeroSlide(0);
        restartHeroSlider();
    }

    function setHeroSlide(index) {
        const slides = Array.from(document.querySelectorAll('.hero-slide'));
        const dots = Array.from(document.querySelectorAll('.hero-dot'));
        if (slides.length === 0) return;

        heroState.current = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => {
            slide.classList.toggle('active', slideIndex === heroState.current);
        });
        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle('active', dotIndex === heroState.current);
        });
    }

    function restartHeroSlider() {
        if (heroState.timer) clearInterval(heroState.timer);
        heroState.timer = setInterval(() => {
            setHeroSlide(heroState.current + 1);
        }, heroState.interval);
    }

    // ============================================
    // INIT
    // ============================================
    async function init() {
        if (state.isInitialized) return;
        state.isInitialized = true;
        
        initTelegram();
        loadCart();
        updateCartBadge();
        bindEvents();
        setupHeroSlider();
        initHeaderApple();
        await loadData();
    }

    // Публичный API
    return {
        init,
        navigateTo,
        addToCart,
        state
    };
})();

// ============================================
// АВТОЗАПУСК
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Если DOM уже загружен (скрипт в конце body)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => App.init(), 1);
}

window.App = App;
