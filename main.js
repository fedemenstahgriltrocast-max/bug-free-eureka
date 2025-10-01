(function () {
  const html = document.documentElement;
  const copyright = document.querySelector('#copyrightYear');
  const orderSection = document.querySelector('.order');
  const orderButton = document.querySelector('#orderButton');
  const chipButtons = Array.from(document.querySelectorAll('.chip'));
  const fabLanguage = document.querySelector('#fabLanguage');
  const fabTheme = document.querySelector('#fabTheme');
  const fabChat = document.querySelector('#fabChat');
  const fabPay = document.querySelector('#fabPay');
  const fabMenus = Array.from(document.querySelectorAll('.fab-menu'));
  const fabLanguageMenu = document.querySelector('#fabLanguageMenu');
  const fabThemeMenu = document.querySelector('#fabThemeMenu');
  const drawers = Array.from(document.querySelectorAll('.drawer'));
  const payDrawer = document.querySelector('#payDrawer');
  const languageToggle = document.querySelector('#languageToggle');
  const themeToggle = document.querySelector('#themeToggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const carousel = document.querySelector('[data-carousel]');
  const carouselTrack = document.querySelector('.product-carousel__track');
  const carouselPrevButton = carousel ? carousel.querySelector('[data-carousel-prev]') : null;
  const carouselNextButton = carousel ? carousel.querySelector('[data-carousel-next]') : null;
  const accordionTrigger = document.querySelector('.accordion__trigger');
  const accordionContent = document.querySelector('.accordion__content');
  const productCards = Array.from(document.querySelectorAll('.product-card'));
  const summaryList = document.querySelector('[data-summary-items]');
  const summaryEmpty = document.querySelector('#orderSummaryEmpty');
  const summaryTotals = {
    subtotal: document.querySelector('[data-summary="subtotal"]'),
    tax: document.querySelector('[data-summary="tax"]'),
    delivery: document.querySelector('[data-summary="delivery"]'),
    total: document.querySelector('[data-summary="total"]'),
  };
  const paymentList = document.querySelector('[data-payment-items]');
  const paymentEmpty = document.querySelector('[data-payment-empty]');
  const paymentTotal = document.querySelector('[data-payment-total]');
  const deliverySelectionDisplay = document.querySelector('[data-delivery-selection]');
  const paymentDeliveryDisplay = document.querySelector('[data-payment-delivery]');
  const clearCartButtons = Array.from(document.querySelectorAll('[data-action="clear-cart"]'));
  const smallScreenQuery = window.matchMedia('(max-width: 767px)');
  const largeScreenQuery = window.matchMedia('(min-width: 900px)');
  const draggableDrawerIds = new Set(['chatDrawer', 'payDrawer']);
  const fabButtons = [fabLanguage, fabTheme, fabChat, fabPay].filter(Boolean);
  const fabLabelTimers = new WeakMap();
  const drawerPositions = new Map();
  const TAX_RATE = 0.15;
  const DELIVERY_FEE = 3.5;
  const cart = new Map();
  const checkoutTrigger = document.querySelector('[data-checkout-trigger]');
  const DELIVERY_STORAGE_KEY = 'marxia-delivery-minutes';
  let currentSlideIndex = 0;
  let maxSlideIndex = 0;
  let lastCarouselPerView = largeScreenQuery.matches ? 2 : 1;
  let currentLanguage = html.lang === 'es' ? 'es' : 'en';
  let selectedDeliveryTime = null;
  const translations = {
    en: {
      headline: 'Marxia Café y Bocaditos',
      brandSubtitle: 'Breakfasts, pastries & catering in Guayaquil',
      tagline: 'Breakfasts, pastries, and delivery throughout Guayaquil.',
      promise: 'Fresh flavors every morning.',
      orderNow: 'Order now',
      orderTitle: 'Our menu',
      orderSubtitle: 'Tap to explore our handcrafted favorites.',
      insightsTitle: 'Experience dashboard',
      insightsSubtitle: '',
      sentimentTitle: 'End consumer sentiment',
      sentimentUpdated: 'Updated every 30 minutes',
      sentimentScore: 'Average rating',
      sentimentReviews: '1,248 verified reviews',
      visitorsTitle: 'Visitors',
      visitorsMeta: 'Foot & site traffic',
      visitorsCaption: 'Today 320 · This month 8,450 · Last year 92,300',
      salesTitle: 'Online sales',
      salesMeta: 'Room to grow',
      salesCaption: 'Today $620 · This month $18,400 · Last year $212,000',
      ordersTitle: 'Order details',
      ordersMeta: 'Secure checkout enabled',
      ordersSubtotal: 'Subtotal',
      ordersTax: 'VAT 15%',
      ordersDelivery: 'Delivery',
      ordersTotal: 'Total',
      orderItems: 'Selected items',
      orderSummaryEmpty: 'Your basket is empty. Add menu favorites to see them here.',
      deliveryTitle: 'Delivery time',
      deliveryEta: 'Estimated delivery: {time}',
      deliveryEtaPrompt: 'Select a delivery window to see your ETA.',
      clearOrder: 'Clear',
      checkout: 'Secure checkout',
      carouselPrev: 'Previous favorites',
      carouselNext: 'Next favorites',
      addToOrder: '+ Add',
      removeFromOrder: '- Remove',
      summaryIncrease: 'Add one {item}',
      summaryDecrease: 'Remove one {item}',
      inCart: 'In cart: {count}',
      contactTitle: 'We deliver to',
      contactAreas: 'Saucés · Alborada · Guayacanes · Tarazana · Brisas del Río',
      contactWhatsApp: 'WhatsApp',
      rights: 'All rights reserved.',
      edgeSecurity: 'Edge protected via Cloudflare Zero Trust',
      chatTitle: 'Live chat',
      chatWelcome: 'Hello 👋 How can we help you today?',
      chatLabel: 'Message',
      chatSend: 'Send',
      chatPlaceholder: 'Type your message…',
      chatClose: 'Close chat',
      payTitle: 'Checkout preview',
      payNow: 'Pay now',
      payCloseAction: 'Close',
      fabLanguageLabel: 'Language options',
      fabThemeLabel: 'Theme options',
      fabChatLabel: 'Live chat',
      fabPayLabel: 'Payment summary',
    },
    es: {
      headline: 'Marxia Café y Bocaditos',
      brandSubtitle: 'Desayunos, bocaditos y catering en Guayaquil',
      tagline: 'Desayunos, bocaditos y entregas en todo Guayaquil.',
      promise: 'Sabores frescos cada mañana.',
      orderNow: 'Ordenar ahora',
      orderTitle: 'Nuestro menú',
      orderSubtitle: 'Toca para explorar nuestros favoritos artesanales.',
      insightsTitle: 'Panel de experiencia',
      insightsSubtitle: '',
      sentimentTitle: 'Sentimiento de los clientes',
      sentimentUpdated: 'Actualizado cada 30 minutos',
      sentimentScore: 'Calificación promedio',
      sentimentReviews: '1.248 reseñas verificadas',
      visitorsTitle: 'Visitantes',
      visitorsMeta: 'Tráfico físico y digital',
      visitorsCaption: 'Hoy 320 · Este mes 8.450 · Último año 92.300',
      salesTitle: 'Ventas en línea',
      salesMeta: 'Espacio para crecer',
      salesCaption: 'Hoy $620 · Este mes $18.400 · Último año $212.000',
      ordersTitle: 'Detalles del pedido',
      ordersMeta: 'Checkout seguro habilitado',
      ordersSubtotal: 'Subtotal',
      ordersTax: 'IVA 15%',
      ordersDelivery: 'Envío',
      ordersTotal: 'Total',
      orderItems: 'Artículos seleccionados',
      orderSummaryEmpty: 'Tu pedido está vacío. Agrega favoritos del menú para verlos aquí.',
      deliveryTitle: 'Tiempo de entrega',
      deliveryEta: 'Entrega estimada: {time}',
      deliveryEtaPrompt: 'Selecciona una franja de entrega para ver tu tiempo estimado.',
      clearOrder: 'Vaciar',
      checkout: 'Checkout seguro',
      carouselPrev: 'Favoritos anteriores',
      carouselNext: 'Siguientes favoritos',
      addToOrder: '+ Agregar',
      removeFromOrder: '- Quitar',
      summaryIncrease: 'Agregar uno de {item}',
      summaryDecrease: 'Quitar uno de {item}',
      inCart: 'En carrito: {count}',
      contactTitle: 'Entregamos en',
      contactAreas: 'Saucés · Alborada · Guayacanes · Tarazana · Brisas del Río',
      contactWhatsApp: 'WhatsApp',
      rights: 'Todos los derechos reservados.',
      edgeSecurity: 'Protección perimetral con Cloudflare Zero Trust',
      chatTitle: 'Chat en vivo',
      chatWelcome: 'Hola 👋 ¿Cómo podemos ayudarte hoy?',
      chatLabel: 'Mensaje',
      chatSend: 'Enviar',
      chatPlaceholder: 'Escribe tu mensaje…',
      chatClose: 'Cerrar chat',
      payTitle: 'Vista previa del checkout',
      payNow: 'Pagar ahora',
      payCloseAction: 'Cerrar',
      fabLanguageLabel: 'Opciones de idioma',
      fabThemeLabel: 'Opciones de tema',
      fabChatLabel: 'Chat en vivo',
      fabPayLabel: 'Resumen de pago',
    },
  };

  const isSmallScreen = () => smallScreenQuery.matches;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const getCardsPerView = () => (largeScreenQuery.matches ? 2 : 1);
  const getCarouselGap = () => {
    if (!carouselTrack) {
      return 0;
    }
    const style = window.getComputedStyle(carouselTrack);
    const gapValue =
      style.columnGap || style.gap || style.rowGap || style.getPropertyValue('--carousel-gap');
    const parsed = Number.parseFloat(gapValue);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const updateCarouselControls = () => {
    if (carouselPrevButton) {
      carouselPrevButton.disabled = currentSlideIndex <= 0;
    }
    if (carouselNextButton) {
      carouselNextButton.disabled = currentSlideIndex >= maxSlideIndex;
    }
    if (carousel) {
      carousel.classList.toggle('product-carousel--static', maxSlideIndex === 0);
    }
  };

  const getCarouselStep = () => {
    if (!carouselTrack) {
      return 0;
    }
    const perView = getCardsPerView();
    const startIndex = Math.min(currentSlideIndex * perView, Math.max(productCards.length - 1, 0));
    const firstVisibleCard = productCards[startIndex] || productCards[0];
    if (!firstVisibleCard) {
      return 0;
    }
    const cardWidth = firstVisibleCard.getBoundingClientRect().width;
    const gap = getCarouselGap();
    return perView * cardWidth + Math.max(0, (perView - 1) * gap);
  };

  const updateCarouselPosition = () => {
    if (!carouselTrack) {
      return;
    }
    const step = getCarouselStep();
    const offset = step * currentSlideIndex;
    carouselTrack.style.transform = step > 0 ? `translateX(-${offset}px)` : 'translateX(0)';
  };

  const moveCarousel = (direction) => {
    if (maxSlideIndex <= 0) {
      return;
    }
    currentSlideIndex = clamp(currentSlideIndex + direction, 0, maxSlideIndex);
    updateCarouselPosition();
    updateCarouselControls();
  };

  const getLocale = () => (currentLanguage === 'es' ? 'es-EC' : 'en-US');
  const formatCurrency = (value) => {
    const formatter = new Intl.NumberFormat(getLocale(), {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
    return formatter.format(Math.max(0, Number.isFinite(value) ? value : 0));
  };

  const getTranslation = (key) => {
    const active = translations[currentLanguage] || translations.en;
    return active[key] ?? translations.en[key] ?? '';
  };

  const getDeliveryLabelForChip = (chip, lang = currentLanguage) => {
    if (!(chip instanceof HTMLElement)) {
      return '';
    }
    const dictionaryKey = lang === 'es' ? 'labelEs' : 'labelEn';
    return chip.dataset[dictionaryKey] || chip.textContent.trim();
  };

  const updateDeliveryOptionLabels = (lang = currentLanguage) => {
    chipButtons.forEach((chip) => {
      const label = getDeliveryLabelForChip(chip, lang);
      if (label) {
        chip.textContent = label;
      }
    });
  };

  const syncSelectedDeliveryLabel = () => {
    if (!selectedDeliveryTime) {
      return;
    }
    const activeChip = chipButtons.find((chip) => chip.getAttribute('aria-pressed') === 'true');
    if (activeChip) {
      selectedDeliveryTime.label = getDeliveryLabelForChip(activeChip);
    }
  };

  const updateDeliveryDisplay = () => {
    const label = selectedDeliveryTime?.label;
    const template = getTranslation('deliveryEta') || 'Estimated delivery: {time}';
    const prompt = getTranslation('deliveryEtaPrompt') || '';
    const message = label ? template.replace('{time}', label) : prompt;

    if (deliverySelectionDisplay) {
      deliverySelectionDisplay.textContent = message;
      deliverySelectionDisplay.toggleAttribute('hidden', !message);
    }

    if (paymentDeliveryDisplay) {
      paymentDeliveryDisplay.textContent = message;
      paymentDeliveryDisplay.toggleAttribute('hidden', !message);
    }
  };

  const setSelectedDeliveryTime = (chip, { persist = true } = {}) => {
    if (!(chip instanceof HTMLElement)) {
      return;
    }

    chipButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn === chip));
    });

    const minutesValue = Number(chip.getAttribute('data-delivery-minutes') || chip.dataset.deliveryMinutes || '');
    const minutes = Number.isFinite(minutesValue) ? minutesValue : null;
    const label = getDeliveryLabelForChip(chip);
    selectedDeliveryTime = {
      minutes,
      label,
    };

    if (persist && minutes !== null) {
      try {
        localStorage.setItem(DELIVERY_STORAGE_KEY, String(minutes));
      } catch (error) {
        // no-op: storage might be unavailable
      }
    }
    updateDeliveryDisplay();
  };
  const restoreDeliverySelection = () => {
    updateDeliveryOptionLabels();
    let savedMinutes = null;
    try {
      savedMinutes = localStorage.getItem(DELIVERY_STORAGE_KEY);
    } catch (error) {
      savedMinutes = null;
    }

    let targetChip = null;
    if (savedMinutes) {
      targetChip = chipButtons.find((chip) => chip.getAttribute('data-delivery-minutes') === savedMinutes) || null;
    }
    if (!targetChip) {
      targetChip =
        chipButtons.find((chip) => chip.getAttribute('aria-pressed') === 'true') || chipButtons[0] || null;
    }
    if (targetChip) {
      setSelectedDeliveryTime(targetChip, { persist: false });
    } else {
      updateDeliveryDisplay();
    }
  };

  const updateMenuPressedState = (menu, attribute, activeValue) => {
    if (!(menu instanceof HTMLElement)) {
      return;
    }
    menu.querySelectorAll(`[${attribute}]`).forEach((button) => {
      if (!(button instanceof HTMLElement)) {
        return;
      }
      const value = button.getAttribute(attribute);
      if (!value) {
        button.setAttribute('aria-pressed', 'false');
        return;
      }
      button.setAttribute('aria-pressed', String(value === activeValue));
    });
  };

  const updateFabMenuSelection = () => {
    updateMenuPressedState(fabLanguageMenu, 'data-lang', currentLanguage);
    const activeTheme = html.dataset.theme === 'dark' ? 'dark' : 'light';
    updateMenuPressedState(fabThemeMenu, 'data-theme', activeTheme);
  };

  const updateFabLabels = () => {
    fabButtons.forEach((button) => {
      if (!(button instanceof HTMLElement)) {
        return;
      }
      const key = button.getAttribute('data-fab-label');
      if (!key) {
        return;
      }
      const label = getTranslation(key);
      if (!label) {
        return;
      }
      button.dataset.label = label;
      button.setAttribute('aria-label', label);
    });
  };

  const showFabLabel = (button, duration = 1500) => {
    if (!(button instanceof HTMLElement)) {
      return;
    }
    button.classList.add('fab--show-label');
    const existingTimer = fabLabelTimers.get(button);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }
    const timeout = window.setTimeout(() => {
      button.classList.remove('fab--show-label');
      fabLabelTimers.delete(button);
    }, duration);
    fabLabelTimers.set(button, timeout);
  };

  const updateProductPrices = () => {
    productCards.forEach((card) => {
      const priceNode = card.querySelector('.product-card__price');
      const price = Number.parseFloat(card.dataset.price || '0');
      if (!priceNode || Number.isNaN(price)) {
        return;
      }
      priceNode.textContent = formatCurrency(price);
    });
  };

  const getCartItemLabel = (entry, lang = currentLanguage) => {
    if (!entry) {
      return '';
    }
    const labels = entry.labels || {};
    if (lang === 'es' && labels.es) {
      return labels.es;
    }
    if (lang === 'en' && labels.en) {
      return labels.en;
    }
    return labels.en || labels.es || entry.card?.dataset?.labelEn || entry.card?.dataset?.name || '';
  };

  const updateProductContent = (lang = currentLanguage) => {
    productCards.forEach((card) => {
      const nameKey = lang === 'es' ? 'labelEs' : 'labelEn';
      const metaKey = lang === 'es' ? 'metaEs' : 'metaEn';
      const name = card.dataset[nameKey] || card.dataset.labelEn || card.dataset.name || '';
      const meta = card.dataset[metaKey];

      const titleNode = card.querySelector('.product-card__info h3');
      if (titleNode && name) {
        titleNode.textContent = name;
      }

      const imageNode = card.querySelector('.product-card__image');
      if (imageNode && name) {
        imageNode.setAttribute('alt', name);
      }

      const metaNode = card.querySelector('.product-card__meta');
      if (metaNode && meta !== undefined) {
        metaNode.textContent = meta;
      }
    });
  };

  const updateQuantityLabel = (card, quantity) => {
    const quantityNode = card.querySelector('.product-card__quantity');
    if (!quantityNode) {
      return;
    }
    quantityNode.setAttribute('data-i18n-count', String(quantity));
    const template = getTranslation('inCart') || 'In cart: {count}';
    quantityNode.textContent = template.replace('{count}', quantity);
  };

  const updateCartDisplay = () => {
    const items = Array.from(cart.entries())
      .map(([key, data]) => ({ key, ...data, displayName: getCartItemLabel(data, currentLanguage) }))
      .filter((item) => item.quantity > 0);

    const hasItems = items.length > 0;
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * TAX_RATE;
    const delivery = hasItems ? DELIVERY_FEE : 0;
    const total = subtotal + tax + delivery;

    if (summaryList) {
      summaryList.innerHTML = '';
      items.forEach((item) => {
        const li = document.createElement('li');
        const label = document.createElement('span');
        label.className = 'order-summary__item-label';
        label.textContent = item.displayName;
        label.setAttribute('aria-label', `${item.quantity}× ${item.displayName}`);
        const quantity = document.createElement('span');
        quantity.className = 'order-summary__item-quantity';
        quantity.textContent = `${item.quantity}`;
        const controls = document.createElement('div');
        controls.className = 'order-summary__controls';
        const decreaseButton = document.createElement('button');
        decreaseButton.type = 'button';
        decreaseButton.className = 'order-summary__control order-summary__control--decrease';
        decreaseButton.textContent = '-';
        decreaseButton.setAttribute(
          'aria-label',
          (getTranslation('summaryDecrease') || 'Remove one {item}').replace('{item}', item.displayName),
        );
        decreaseButton.addEventListener('click', () => modifyCart(item.key, -1));
        const increaseButton = document.createElement('button');
        increaseButton.type = 'button';
        increaseButton.className = 'order-summary__control order-summary__control--increase';
        increaseButton.textContent = '+';
        increaseButton.setAttribute(
          'aria-label',
          (getTranslation('summaryIncrease') || 'Add one {item}').replace('{item}', item.displayName),
        );
        increaseButton.addEventListener('click', () => modifyCart(item.key, 1));
        controls.append(decreaseButton, increaseButton);
        const price = document.createElement('span');
        price.className = 'order-summary__item-price';
        price.textContent = formatCurrency(item.price * item.quantity);

        li.append(label, quantity, controls, price);
        summaryList.append(li);
      });
      summaryList.toggleAttribute('hidden', !hasItems);
    }

    if (summaryEmpty) {
      summaryEmpty.toggleAttribute('hidden', hasItems);
    }

    if (paymentList) {
      paymentList.innerHTML = '';
      items.forEach((item) => {
        const li = document.createElement('li');
        const label = document.createElement('span');
        label.textContent = `${item.quantity}× ${item.displayName}`;
        const price = document.createElement('span');
        price.textContent = formatCurrency(item.price * item.quantity);
        li.append(label, price);
        paymentList.append(li);
      });
      paymentList.toggleAttribute('hidden', !hasItems);
    }

    if (paymentEmpty) {
      paymentEmpty.toggleAttribute('hidden', hasItems);
    }

    if (summaryTotals.subtotal) {
      summaryTotals.subtotal.textContent = formatCurrency(subtotal);
    }
    if (summaryTotals.tax) {
      summaryTotals.tax.textContent = formatCurrency(tax);
    }
    if (summaryTotals.delivery) {
      summaryTotals.delivery.textContent = formatCurrency(delivery);
    }
    if (summaryTotals.total) {
      summaryTotals.total.textContent = formatCurrency(total);
    }
    if (paymentTotal) {
      paymentTotal.textContent = formatCurrency(total);
    }

    clearCartButtons.forEach((button) => {
      if (button) {
        button.toggleAttribute('disabled', !hasItems);
      }
    });

    productCards.forEach((card) => {
      const name = card.dataset.name;
      const entry = name ? cart.get(name) : undefined;
      const quantity = entry ? entry.quantity : 0;
      updateQuantityLabel(card, quantity);
      const removeButton = card.querySelector('[data-cart="remove"]');
      if (removeButton) {
        removeButton.toggleAttribute('disabled', quantity === 0);
      }
    });
  };

  const modifyCart = (name, delta) => {
    const entry = cart.get(name);
    if (!entry) {
      return;
    }
    entry.quantity = Math.max(0, entry.quantity + delta);
    cart.set(name, entry);
    updateCartDisplay();
  };

  const clearCart = () => {
    cart.forEach((entry, name) => {
      if (!entry) {
        return;
      }
      entry.quantity = 0;
      cart.set(name, entry);
    });
    updateCartDisplay();
  };

  const initializeCart = () => {
    productCards.forEach((card) => {
      const name = card.dataset.name;
      const price = Number.parseFloat(card.dataset.price || '0');
      if (!name || Number.isNaN(price)) {
        return;
      }
      const labels = {
        en: card.dataset.labelEn || name,
        es: card.dataset.labelEs || card.dataset.labelEn || name,
      };
      if (!cart.has(name)) {
        cart.set(name, { price, quantity: 0, card, labels });
      } else {
        const existing = cart.get(name);
        if (existing) {
          existing.price = price;
          existing.card = card;
          existing.labels = labels;
          cart.set(name, existing);
        }
      }

      const addButton = card.querySelector('[data-cart="add"]');
      const removeButton = card.querySelector('[data-cart="remove"]');

      if (addButton) {
        addButton.addEventListener('click', () => modifyCart(name, 1));
      }

      if (removeButton) {
        removeButton.addEventListener('click', () => modifyCart(name, -1));
        removeButton.setAttribute('disabled', 'true');
      }
      updateQuantityLabel(card, 0);
    });
    updateProductContent(currentLanguage);
    updateProductPrices();
    updateCartDisplay();
  };

  const updateCarousel = () => {
    if (!carousel || !carouselTrack) {
      return;
    }
    const totalCards = productCards.length;
    const perView = getCardsPerView();
    if (perView !== lastCarouselPerView) {
      currentSlideIndex = Math.floor((currentSlideIndex * lastCarouselPerView) / Math.max(perView, 1));
      lastCarouselPerView = perView;
    }
    const nextMaxIndex = Math.max(0, Math.ceil(totalCards / perView) - 1);
    maxSlideIndex = nextMaxIndex;
    currentSlideIndex = clamp(currentSlideIndex, 0, maxSlideIndex);
    window.requestAnimationFrame(() => {
      updateCarouselPosition();
      updateCarouselControls();
    });
  };
  const setCopyright = () => {
    if (copyright) {
      copyright.textContent = String(new Date().getFullYear());
    }
  };

  const applyTheme = (theme) => {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    html.dataset.theme = nextTheme;
    localStorage.setItem('marxia-theme', nextTheme);
    updateFabMenuSelection();
    if (themeToggle) {
      const isDark = nextTheme === 'dark';
      themeToggle.textContent = isDark ? 'Light' : 'Dark';
      themeToggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
      themeToggle.setAttribute('aria-pressed', String(isDark));
    }
  };

  const applyLanguage = (lang) => {
    const nextLang = lang === 'es' ? 'es' : 'en';
    currentLanguage = nextLang;
    html.lang = nextLang;
    localStorage.setItem('marxia-lang', nextLang);
    updateFabMenuSelection();
    if (languageToggle) {
      const isSpanish = nextLang === 'es';
      languageToggle.textContent = isSpanish ? 'EN' : 'ES';
      languageToggle.setAttribute(
        'aria-label',
        isSpanish ? 'Idioma: Español (cambiar a inglés)' : 'Language: English (switch to Spanish)'
      );
      languageToggle.setAttribute('aria-pressed', String(isSpanish));
    }

    const dict = translations[nextLang];
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.getAttribute('data-i18n');
      if (!key) return;
      const translation = dict[key];
      if (translation === undefined) return;

      const attrTarget = node.getAttribute('data-i18n-attr');
      if (attrTarget) {
        node.setAttribute(attrTarget, translation);
      }

      if (node.dataset.i18nSkipText === 'true') {
        return;
      }

      if (node.hasAttribute('data-i18n-count')) {
        const count = Number(node.getAttribute('data-i18n-count') || '0');
        node.textContent = translation.replace('{count}', count);
        return;
      }

      if (node.querySelector('a') && key === 'contactWhatsApp') {
        const prefixNode = node.childNodes[0];
        if (prefixNode) {
          const prefixText = translation ? `${translation} ` : '';
          prefixNode.textContent = prefixText;
        }
      } else {
        node.textContent = translation;
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
      const key = node.getAttribute('data-i18n-placeholder');
      if (key && dict[key]) {
        node.setAttribute('placeholder', dict[key]);
      }
    });

    updateDeliveryOptionLabels(nextLang);
    syncSelectedDeliveryLabel();
    updateDeliveryDisplay();
    updateFabLabels();
    updateFabMenuSelection();
    updateProductContent(nextLang);
    updateProductPrices();
    updateCartDisplay();
  };

  const restorePreferences = () => {
    const savedTheme = localStorage.getItem('marxia-theme');
    const savedLang = localStorage.getItem('marxia-lang');
    if (savedTheme) {
      applyTheme(savedTheme);
    } else if (prefersDark) {
      applyTheme('dark');
    } else {
      applyTheme('light');
    }
    if (savedLang) {
      applyLanguage(savedLang);
    } else {
      applyLanguage('en');
    }
  };

  const closeMenus = (exception) => {
    fabMenus.forEach((menu) => {
      if (menu !== exception) {
        menu.dataset.open = 'false';
        const controller = document.querySelector(`[aria-controls="${menu.id}"]`);
        if (controller) {
          controller.setAttribute('aria-expanded', 'false');
        }
      }
    });
  };

  const toggleMenu = (menu, controller) => {
    if (!menu || !controller) return;
    const open = menu.dataset.open === 'true';
    closeMenus(open ? null : menu);
    menu.dataset.open = String(!open);
    controller.setAttribute('aria-expanded', String(!open));
  };

  const moveDrawerTo = (drawer, position) => {
    if (!drawer || !largeScreenQuery.matches) {
      return;
    }
    const content = drawer.querySelector('.drawer__content');
    if (!(content instanceof HTMLElement)) {
      return;
    }
    const rect = content.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const margin = 16;
    const maxLeft = window.innerWidth - width - margin;
    const maxTop = window.innerHeight - height - margin;
    const left = clamp(position.left, margin, Math.max(margin, maxLeft));
    const top = clamp(position.top, margin, Math.max(margin, maxTop));
    content.style.left = `${left}px`;
    content.style.top = `${top}px`;
    content.style.right = 'auto';
    content.style.bottom = 'auto';
    content.style.transform = 'none';
    content.classList.add('drawer__content--floating');
    drawerPositions.set(drawer.id, { top, left });
  };

  const ensureFloatingPosition = (drawer) => {
    if (!drawer || !largeScreenQuery.matches || drawer.getAttribute('aria-hidden') === 'true') {
      return;
    }
    const content = drawer.querySelector('.drawer__content');
    if (!(content instanceof HTMLElement)) {
      return;
    }
    content.classList.add('drawer__content--floating');
    requestAnimationFrame(() => {
      const rect = content.getBoundingClientRect();
      const stored = drawerPositions.get(drawer.id);
      const defaultTop = Math.max(16, (window.innerHeight - rect.height) / 2);
      const defaultLeft = Math.max(16, (window.innerWidth - rect.width) / 2);
      moveDrawerTo(drawer, {
        top: stored?.top ?? defaultTop,
        left: stored?.left ?? defaultLeft,
      });
    });
  };

  const resetDrawerPosition = (drawer) => {
    const content = drawer?.querySelector('.drawer__content');
    if (!(content instanceof HTMLElement)) {
      return;
    }
    content.classList.remove('drawer__content--floating');
    content.style.left = '';
    content.style.top = '';
    content.style.right = '';
    content.style.bottom = '';
    content.style.transform = '';
    delete content.dataset.dragging;
  };

  const applyDrawerLayout = () => {
    if (!largeScreenQuery.matches) {
      drawers.forEach((drawer) => resetDrawerPosition(drawer));
      drawerPositions.clear();
      return;
    }
    drawers.forEach((drawer) => {
      if (draggableDrawerIds.has(drawer.id) && drawer.getAttribute('aria-hidden') === 'false') {
        ensureFloatingPosition(drawer);
      }
    });
  };

  const setupDraggableDrawer = (drawer) => {
    if (!draggableDrawerIds.has(drawer.id)) {
      return;
    }
    const content = drawer.querySelector('.drawer__content');
    const handle = drawer.querySelector('.drawer__header');
    if (!(content instanceof HTMLElement) || !(handle instanceof HTMLElement)) {
      return;
    }
    let activePointerId = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    const stopDragging = (event) => {
      if (activePointerId === null || (event && event.pointerId !== activePointerId)) {
        return;
      }
      try {
        if (event && typeof handle.releasePointerCapture === 'function') {
          handle.releasePointerCapture(activePointerId);
        }
      } catch (error) {
        // Ignore release errors when pointer capture is already cleared.
      }
      activePointerId = null;
      dragOffsetX = 0;
      dragOffsetY = 0;
      delete content.dataset.dragging;
    };

    handle.addEventListener('pointerdown', (event) => {
      if (!largeScreenQuery.matches || drawer.getAttribute('aria-hidden') === 'true') {
        return;
      }
      if (typeof event.button === 'number' && event.button !== 0) {
        return;
      }
      const pointerTarget = event.target;
      if (
        pointerTarget instanceof HTMLElement &&
        pointerTarget.closest('button, [role="button"], a, input, textarea, select')
      ) {
        return;
      }
      activePointerId = event.pointerId;
      if (typeof handle.setPointerCapture === 'function') {
        handle.setPointerCapture(activePointerId);
      }
      const rect = content.getBoundingClientRect();
      dragOffsetX = event.clientX - rect.left;
      dragOffsetY = event.clientY - rect.top;
      content.dataset.dragging = 'true';
      event.preventDefault();
    });

    handle.addEventListener('pointermove', (event) => {
      if (!largeScreenQuery.matches || activePointerId === null || event.pointerId !== activePointerId) {
        return;
      }
      moveDrawerTo(drawer, {
        left: event.clientX - dragOffsetX,
        top: event.clientY - dragOffsetY,
      });
    });

    handle.addEventListener('pointerup', (event) => {
      if (event.pointerId !== activePointerId) {
        return;
      }
      stopDragging(event);
    });

    handle.addEventListener('pointercancel', (event) => {
      if (event.pointerId !== activePointerId) {
        return;
      }
      stopDragging(event);
    });
  };

  const openDrawer = (drawer) => {
    if (!drawer) return;
    drawer.hidden = false;
    drawer.setAttribute('aria-hidden', 'false');
    if (largeScreenQuery.matches && draggableDrawerIds.has(drawer.id)) {
      ensureFloatingPosition(drawer);
    }
    const closeButton = drawer.querySelector('[data-close-drawer]');
    if (closeButton) {
      closeButton.focus();
    }
  };

  const closeDrawer = (drawer) => {
    if (!drawer) return;
    drawer.setAttribute('aria-hidden', 'true');
    drawer.hidden = true;
  };

  const closeAllDrawers = () => {
    drawers.forEach((drawer) => {
      closeDrawer(drawer);
    });
  };

  const resetFabStates = () => {
    fabButtons.forEach((button) => {
      if (!(button instanceof HTMLElement)) {
        return;
      }
      if (button.hasAttribute('aria-pressed')) {
        button.setAttribute('aria-pressed', 'false');
      }
      if (button.hasAttribute('aria-expanded')) {
        button.setAttribute('aria-expanded', 'false');
      }
    });
  };

  const exitAllFabInteractions = () => {
    closeMenus();
    closeAllDrawers();
    resetFabStates();
  };

  const toggleFabDrawer = (fab, drawerId) => {
    if (!(fab instanceof HTMLElement)) {
      return;
    }
    const drawer = document.querySelector(`#${drawerId}`);
    if (!(drawer instanceof HTMLElement)) {
      return;
    }
    const isOpen = drawer.getAttribute('aria-hidden') === 'false';

    const toggle = () => {
      if (isOpen) {
        closeDrawer(drawer);
      } else {
        openDrawer(drawer);
      }
      fab.setAttribute('aria-pressed', String(!isOpen));
    };

    const shouldDelay = isSmallScreen() && !isOpen;
    showFabLabel(fab);
    if (shouldDelay) {
      window.setTimeout(toggle, 220);
    } else {
      toggle();
    }
  };

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const actionButton = target.closest('.fab-menu [data-action]');
    if (actionButton instanceof HTMLElement) {
      const { action } = actionButton.dataset;
      if (action === 'language') {
        const lang = actionButton.getAttribute('data-lang');
        if (lang) {
          applyLanguage(lang);
          if (fabLanguage) {
            showFabLabel(fabLanguage);
          }
        }
      } else if (action === 'theme') {
        const themeChoice = actionButton.getAttribute('data-theme');
        if (themeChoice) {
          applyTheme(themeChoice);
          if (fabTheme) {
            showFabLabel(fabTheme);
          }
        }
      }
      closeMenus();
      return;
    }

    if (target === themeToggle) {
      const nextTheme = html.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    }

    if (target === languageToggle) {
      const nextLang = html.lang === 'es' ? 'en' : 'es';
      applyLanguage(nextLang);
    }

    const closeButton = target.closest('[data-close-drawer]');
    if (closeButton instanceof HTMLElement) {
      event.preventDefault();
      const closeTargetId = closeButton.getAttribute('data-close-target');
      const parentDrawer = closeButton.closest('.drawer');

      if (parentDrawer) {
        closeDrawer(parentDrawer);
      }

      closeMenus();

      drawers.forEach((drawer) => {
        if (drawer !== parentDrawer) {
          closeDrawer(drawer);
        }
      });

      fabButtons.forEach((button) => {
        if (!(button instanceof HTMLElement)) {
          return;
        }
        button.setAttribute('aria-pressed', 'false');
        if (button.hasAttribute('aria-expanded')) {
          button.setAttribute('aria-expanded', 'false');
        }
      });

      if (closeTargetId) {
        const associatedFab = document.querySelector(`#${closeTargetId}`);
        if (associatedFab instanceof HTMLElement) {
          window.setTimeout(() => {
            associatedFab.focus();
          }, 0);
        }
      }

      return;
    }

    if (target === fabLanguage) {
      showFabLabel(fabLanguage);
      toggleMenu(document.querySelector('#fabLanguageMenu'), fabLanguage);
    } else if (target === fabTheme) {
      showFabLabel(fabTheme);
      toggleMenu(document.querySelector('#fabThemeMenu'), fabTheme);
    } else if (target === fabChat) {
      toggleFabDrawer(fabChat, 'chatDrawer');
    } else if (target === fabPay) {
      toggleFabDrawer(fabPay, 'payDrawer');
    } else if (!target.closest('.fab-menu') && !target.closest('.fab')) {
      closeMenus();
    }
  });

  drawers.forEach((drawer) => {
    setupDraggableDrawer(drawer);
    drawer.addEventListener('click', (event) => {
      if (event.target === drawer) {
        exitAllFabInteractions();
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') {
      return;
    }
    const anyDrawerOpen = drawers.some((drawer) => drawer.getAttribute('aria-hidden') === 'false');
    const anyMenuOpen = fabMenus.some((menu) => menu.dataset.open === 'true');
    if (anyDrawerOpen || anyMenuOpen) {
      event.preventDefault();
      exitAllFabInteractions();
    }
  });

  if (carouselPrevButton) {
    carouselPrevButton.addEventListener('click', () => moveCarousel(-1));
  }

  if (carouselNextButton) {
    carouselNextButton.addEventListener('click', () => moveCarousel(1));
  }

  if (typeof largeScreenQuery.addEventListener === 'function') {
    largeScreenQuery.addEventListener('change', applyDrawerLayout);
    largeScreenQuery.addEventListener('change', () => {
      updateCarousel();
    });
  } else if (typeof largeScreenQuery.addListener === 'function') {
    largeScreenQuery.addListener(applyDrawerLayout);
    largeScreenQuery.addListener(updateCarousel);
  }

  if (typeof smallScreenQuery.addEventListener === 'function') {
    smallScreenQuery.addEventListener('change', () => {
      updateCarousel();
    });
  } else if (typeof smallScreenQuery.addListener === 'function') {
    smallScreenQuery.addListener(updateCarousel);
  }

  if (accordionTrigger && accordionContent) {
    const expanded = accordionTrigger.getAttribute('aria-expanded') === 'true';
    accordionContent.hidden = !expanded;
    const refreshCarouselLayout = () => {
      window.requestAnimationFrame(() => {
        updateCarousel();
      });
    };

    accordionTrigger.addEventListener('click', () => {
      const isExpanded = accordionTrigger.getAttribute('aria-expanded') === 'true';
      const nextExpanded = !isExpanded;
      accordionTrigger.setAttribute('aria-expanded', String(nextExpanded));
      accordionContent.hidden = !nextExpanded;
      if (nextExpanded) {
        currentSlideIndex = 0;
        refreshCarouselLayout();
      }
    });

    if (!accordionContent.hidden) {
      refreshCarouselLayout();
    }
  }

  window.addEventListener('resize', () => {
    updateCarousel();
    if (largeScreenQuery.matches) {
      drawers.forEach((drawer) => {
        if (!draggableDrawerIds.has(drawer.id) || drawer.getAttribute('aria-hidden') === 'true') {
          return;
        }
        const stored = drawerPositions.get(drawer.id);
        if (stored) {
          moveDrawerTo(drawer, stored);
        } else {
          ensureFloatingPosition(drawer);
        }
      });
    }
  });

  clearCartButtons.forEach((button) => {
    if (!button) {
      return;
    }
    button.addEventListener('click', () => {
      clearCart();
      button.blur();
    });
  });

  chipButtons.forEach((chip) => {
    chip.addEventListener('click', () => {
      setSelectedDeliveryTime(chip);
    });
  });

  if (checkoutTrigger) {
    checkoutTrigger.addEventListener('click', () => {
      closeMenus();
      closeAllDrawers();
      resetFabStates();
      if (payDrawer) {
        openDrawer(payDrawer);
      }
      if (fabPay) {
        fabPay.setAttribute('aria-pressed', 'true');
        if (isSmallScreen()) {
          showFabLabel(fabPay);
        }
      }
    });
  }

  if (orderButton && orderSection) {
    orderButton.addEventListener('click', () => {
      orderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  initializeCart();
  restorePreferences();
  restoreDeliverySelection();
  applyDrawerLayout();
  updateCarousel();
  setCopyright();
})();