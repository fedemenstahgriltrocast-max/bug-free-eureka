import { createCartStore } from './cart/cart-store.js';
import { createI18nManager } from './i18n/index.js';
import { formatCurrency } from './utils/currency.js';

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
  const carouselPagination = carousel ? carousel.querySelector('[data-carousel-pagination]') : null;
  const accordionTrigger = document.querySelector('.accordion__trigger');
  const accordionContent = document.querySelector('.accordion__content');
  const productCards = Array.from(document.querySelectorAll('.product-card'));
  const productCardImages = orderSection
    ? Array.from(orderSection.querySelectorAll('.product-card img'))
    : [];

  const ensureProductCardImageClass = () => {
    if (!productCardImages.length) {
      return;
    }
    productCardImages.forEach((image) => {
      if (!(image instanceof HTMLImageElement)) {
        return;
      }
      if (!image.classList.contains('product-card__image')) {
        image.classList.add('product-card__image');
      }
    });
  };

  ensureProductCardImageClass();
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
  const drawerFocusOrigins = new Map();
  const TAX_RATE = 0.15;
  const DELIVERY_FEE = 3.5;
  const cart = createCartStore({ taxRate: TAX_RATE, deliveryFee: DELIVERY_FEE });
  const checkoutTrigger = document.querySelector('[data-checkout-trigger]');
  const DELIVERY_STORAGE_KEY = 'marxia-delivery-minutes';
  let currentSlideIndex = 0;
  let maxSlideIndex = 0;
  let lastCarouselPerView = largeScreenQuery.matches ? 2 : 1;
  let carouselPaginationButtons = [];
  let lastCarouselPageCount = 0;
  const i18n = createI18nManager({ html });
  if (typeof window !== 'undefined') {
    window.marxia = window.marxia || {};
    window.marxia.i18n = i18n;
  }
  let currentLanguage = i18n.language;
  let selectedDeliveryTime = null;
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

  const refreshCarouselPagination = () => {
    if (!carousel || !carouselTrack || !carouselPagination) {
      return;
    }
    const perView = Math.max(getCardsPerView(), 1);
    const pageCount = Math.max(1, Math.ceil(productCards.length / perView));
    if (pageCount <= 1) {
      carouselPagination.hidden = true;
      carouselPagination.innerHTML = '';
      carouselPaginationButtons = [];
      lastCarouselPageCount = 0;
      return;
    }

    const template = getTranslation('carouselSlideLabel') || 'View slide {index}';
    carouselPagination.hidden = false;

    if (pageCount !== lastCarouselPageCount) {
      carouselPagination.innerHTML = '';
      const fragment = document.createDocumentFragment();
      carouselPaginationButtons = [];
      for (let index = 0; index < pageCount; index += 1) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'product-carousel__dot';
        button.dataset.carouselPage = String(index);
        button.addEventListener('click', () => {
          currentSlideIndex = index;
          updateCarouselPosition();
          updateCarouselControls();
          refreshCarouselPagination();
        });
        fragment.appendChild(button);
        carouselPaginationButtons.push(button);
      }
      carouselPagination.appendChild(fragment);
      lastCarouselPageCount = pageCount;
    }

    const maxIndex = Math.max(0, pageCount - 1);
    const clampedIndex = clamp(currentSlideIndex, 0, maxIndex);
    if (clampedIndex !== currentSlideIndex) {
      currentSlideIndex = clampedIndex;
      updateCarouselPosition();
      updateCarouselControls();
    } else {
      currentSlideIndex = clampedIndex;
    }

    carouselPaginationButtons.forEach((button, index) => {
      if (!(button instanceof HTMLElement)) {
        return;
      }
      const isActive = index === currentSlideIndex;
      const label = template.replace('{index}', index + 1);
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
      button.toggleAttribute('disabled', isActive);
      button.setAttribute('aria-label', label);
    });
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
    refreshCarouselPagination();
  };

  const getLocale = () => (currentLanguage === 'es' ? 'es-EC' : 'en-US');
  const formatPrice = (value) => formatCurrency(value, { locale: getLocale() });

  const getTranslation = (key, lang = currentLanguage) => {
    const translated = i18n.translate(key, lang);
    if (translated !== undefined) {
      return translated;
    }
    const fallback = i18n.getDictionary('en')[key];
    return fallback ?? '';
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
      const labelTarget = button.querySelector('[data-fab-label-target]');
      if (labelTarget) {
        labelTarget.textContent = label;
      }
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
      priceNode.textContent = formatPrice(price);
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

  const normalizeProductText = (value = '', locale = currentLanguage) =>
    value
      .toLocaleLowerCase(locale)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const shouldHideProductMeta = (nameText, metaText, locale = currentLanguage) => {
    const normalizedName = normalizeProductText(nameText, locale);
    const normalizedMeta = normalizeProductText(metaText, locale);

    if (!normalizedMeta) {
      return true;
    }

    if (normalizedMeta === normalizedName) {
      return true;
    }

    const isMetaContained = normalizedName.includes(normalizedMeta);
    const isNameContained = normalizedMeta.includes(normalizedName);

    if ((isMetaContained || isNameContained) && Math.min(normalizedMeta.length, normalizedName.length) <= 12) {
      return true;
    }

    return false;
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
      if (metaNode) {
        let metaText = meta;
        if (meta !== undefined) {
          metaNode.textContent = meta;
        } else {
          metaText = metaNode.textContent || '';
        }

        const shouldHide = shouldHideProductMeta(name, metaText || '', lang);
        metaNode.hidden = shouldHide;
        if (!shouldHide && meta === undefined) {
          metaNode.textContent = metaText;
        }
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
    const items = cart
      .list()
      .map((entry) => ({
        key: entry.id,
        ...entry,
        displayName: getCartItemLabel(entry, currentLanguage),
      }))
      .filter((item) => item.quantity > 0);

    const hasItems = items.length > 0;
    const { subtotal, tax, delivery, total } = cart.totals();

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
        price.textContent = formatPrice(item.price * item.quantity);

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
        price.textContent = formatPrice(item.price * item.quantity);
        li.append(label, price);
        paymentList.append(li);
      });
      paymentList.toggleAttribute('hidden', !hasItems);
    }

    if (paymentEmpty) {
      paymentEmpty.toggleAttribute('hidden', hasItems);
    }

    if (summaryTotals.subtotal) {
      summaryTotals.subtotal.textContent = formatPrice(subtotal);
    }
    if (summaryTotals.tax) {
      summaryTotals.tax.textContent = formatPrice(tax);
    }
    if (summaryTotals.delivery) {
      summaryTotals.delivery.textContent = formatPrice(delivery);
    }
    if (summaryTotals.total) {
      summaryTotals.total.textContent = formatPrice(total);
    }
    if (paymentTotal) {
      paymentTotal.textContent = formatPrice(total);
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
    cart.modify(name, delta);
    updateCartDisplay();
  };

  const clearCart = () => {
    cart.clear();
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
      cart.register(name, { price, quantity: 0, card, labels });

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
      refreshCarouselPagination();
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
      const labelKey = isDark ? 'themeToggleLight' : 'themeToggleDark';
      const ariaKey = isDark ? 'themeToggleAriaLight' : 'themeToggleAriaDark';
      themeToggle.textContent = getTranslation(labelKey);
      themeToggle.setAttribute('aria-label', getTranslation(ariaKey));
      themeToggle.setAttribute('aria-pressed', String(isDark));
    }
  };

  const applyLanguage = (lang) => {
    const nextLang = i18n.setLanguage(lang);
    currentLanguage = nextLang;
    updateFabMenuSelection();
    if (languageToggle instanceof HTMLElement) {
      const isSpanish = nextLang === 'es';
      languageToggle.setAttribute('data-current-language', nextLang);
      languageToggle.setAttribute('aria-checked', String(!isSpanish));
      const ariaKey = isSpanish ? 'languageToggleToEnglish' : 'languageToggleToSpanish';
      languageToggle.setAttribute('aria-label', getTranslation(ariaKey));
      languageToggle.textContent = nextLang.toUpperCase();
    }

    const dict = i18n.getDictionary(nextLang);
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

      if (node.dataset.i18nHtml === 'true') {
        node.innerHTML = translation;
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

    if (typeof document !== 'undefined' && typeof CustomEvent === 'function') {
      document.dispatchEvent(
        new CustomEvent('marxia:language-change', {
          detail: { language: nextLang },
        })
      );
    }

    updateDeliveryOptionLabels(nextLang);
    syncSelectedDeliveryLabel();
    updateDeliveryDisplay();
    updateFabLabels();
    updateFabMenuSelection();
    updateProductContent(nextLang);
    updateProductPrices();
    updateCartDisplay();
    refreshCarouselPagination();
    applyTheme(html.dataset.theme);
  };

  const restorePreferences = () => {
    const savedTheme = localStorage.getItem('marxia-theme');
    if (savedTheme) {
      applyTheme(savedTheme);
    } else if (prefersDark) {
      applyTheme('dark');
    } else {
      applyTheme('light');
    }
    applyLanguage(currentLanguage);
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

  const openDrawer = (drawer, { focusOrigin } = {}) => {
    if (!drawer) return;
    let originElement = null;
    if (focusOrigin instanceof HTMLElement) {
      originElement = focusOrigin;
    } else if (document.activeElement instanceof HTMLElement) {
      originElement = document.activeElement;
    }
    if (originElement instanceof HTMLElement && drawer.contains(originElement)) {
      originElement = null;
    }
    if (originElement) {
      drawerFocusOrigins.set(drawer, originElement);
    } else {
      drawerFocusOrigins.delete(drawer);
    }
    drawer.hidden = false;
    drawer.removeAttribute('inert');
    drawer.setAttribute('aria-hidden', 'false');
    if (largeScreenQuery.matches && draggableDrawerIds.has(drawer.id)) {
      ensureFloatingPosition(drawer);
    }
    const closeButton = drawer.querySelector('[data-close-drawer]');
    if (closeButton) {
      closeButton.focus();
    }
  };

  const closeDrawer = (drawer, { restoreFocus = true } = {}) => {
    if (!drawer) return;
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && drawer.contains(activeElement)) {
      activeElement.blur();
    }
    drawer.setAttribute('aria-hidden', 'true');
    drawer.hidden = true;
    drawer.setAttribute('inert', '');
    const originElement = drawerFocusOrigins.get(drawer);
    if (restoreFocus && originElement instanceof HTMLElement) {
      window.setTimeout(() => {
        if (document.contains(originElement)) {
          originElement.focus();
        }
      }, 0);
    }
    drawerFocusOrigins.delete(drawer);
  };

  const closeAllDrawers = (options = {}) => {
    drawers.forEach((drawer) => {
      closeDrawer(drawer, options);
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
        openDrawer(drawer, { focusOrigin: fab });
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

    const quickLanguageToggle = target.closest('#languageToggle');
    if (quickLanguageToggle instanceof HTMLElement) {
      const requestedLanguage = quickLanguageToggle.getAttribute('data-current-language');
      const nextLanguage = requestedLanguage === 'en' ? 'es' : 'en';
      applyLanguage(nextLanguage);
      closeMenus();
      return;
    }

    if (target === themeToggle) {
      const nextTheme = html.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    }

    const closeButton = target.closest('[data-close-drawer]');
    if (closeButton instanceof HTMLElement) {
      event.preventDefault();
      const closeTargetId = closeButton.getAttribute('data-close-target');
      const parentDrawer = closeButton.closest('.drawer');

      if (parentDrawer) {
        closeDrawer(parentDrawer, { restoreFocus: !closeTargetId });
      }

      closeMenus();

      drawers.forEach((drawer) => {
        if (drawer !== parentDrawer) {
          closeDrawer(drawer, { restoreFocus: false });
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
    checkoutTrigger.addEventListener('click', (event) => {
      closeMenus();
      closeAllDrawers({ restoreFocus: false });
      resetFabStates();
      if (payDrawer) {
        const focusOrigin = event.currentTarget instanceof HTMLElement ? event.currentTarget : undefined;
        openDrawer(payDrawer, { focusOrigin });
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
    orderButton.addEventListener('click', (event) => {
      event.preventDefault();
      orderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  } else if (orderButton && !orderSection) {
    orderButton.addEventListener('click', () => {
      if (orderButton instanceof HTMLAnchorElement) {
        return;
      }
      window.location.href = 'order.html';
    });
  }

  initializeCart();
  restorePreferences();
  restoreDeliverySelection();
  applyDrawerLayout();
  updateCarousel();
  setCopyright();
})();
