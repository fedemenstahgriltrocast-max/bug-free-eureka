// Generated file. Do not edit directly. Use `npm run build` to regenerate.
const DEFAULT_LOCALE = 'es-EC';
const DEFAULT_CURRENCY = 'USD';

function formatCurrency(value, { locale = DEFAULT_LOCALE, currency = DEFAULT_CURRENCY } = {}) {
  const amount = Number.parseFloat(value ?? 0);
  if (Number.isNaN(amount)) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(0);
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function roundCurrency(value, precision = 2) {
  const multiplier = 10 ** precision;
  return Math.round(Number.parseFloat(value) * multiplier + Number.EPSILON) / multiplier;
}

const currencyDefaults = Object.freeze({
  locale: DEFAULT_LOCALE,
  currency: DEFAULT_CURRENCY,
});


const translations = Object.freeze({
  en: {
    // Global navigation & layout
    skipToContent: 'Skip to content',
    brandName: 'Marxia',
    brandTagline: 'Coffee & Bites',
    brandTitle: 'Marxia Café y Bocaditos',
    brandSubtitle: 'Breakfasts, pastries & catering in Guayaquil',
    brandSubheading: 'Breakfast bites',
    navHome: 'Home',
    navHomeAria: 'Return to the home page',
    navOrder: 'Order',
    navGallery: 'Gallery',
    navContact: 'Contact',
    navConsent: 'Consent management',
    navTerms: 'Terms & Conditions',
    quickPreferences: 'Quick preferences',
    languageSelection: 'Language selection',
    languageToggleToEnglish: 'Switch to English',
    languageToggleToSpanish: 'Switch to Spanish',
    themeSelection: 'Theme selection',
    themeToggleDark: 'Dark',
    themeToggleLight: 'Light',
    themeToggleAriaDark: 'Switch to dark theme',
    themeToggleAriaLight: 'Switch to light theme',
    legalInfo: 'Legal information',
    landingFooterSecurity: 'Marxia Café y Bocaditos. Security reinforced with PCI DSS, NIST CSF, and CISA best practices.',

    // Landing & ordering
    heroEyebrow: 'Marxia Café y Bocaditos',
    heroTitle: 'Marxia Café y Bocaditos',
    heroSubtitle: 'Breakfasts, bites, and deliveries across North Guayaquil.',
    heroHeadline: 'Marxia Café y Bocaditos',
    heroSubheadline: 'Breakfasts, bites, and deliveries across North Guayaquil.',
    heroPromise: 'Fresh flavors every day.',
    headline: 'Marxia Café y Bocaditos',
    tagline: 'Breakfasts, pastries, and deliveries in North Guayaquil.',
    promise: 'Fresh flavors every day.',
    deliveryCoverage: 'We deliver in North Guayaquil: Saucés · Alborada · Guayacanes · Tarazana · Brisas del Río',
    galleryTitle: 'Our menu',
    gallerySubtitle: 'Choose what energizes your day.',
    galleryHint: 'Choose what energizes your day.',
    galleryImage1Alt: 'Freshly brewed espresso shot',
    galleryImage2Alt: 'Breakfast tray with coffee, tortilla, eggs, and sausage',
    galleryImage3Alt: 'Golden tortilla on a serving board',
    galleryImage4Alt: 'Fried eggs served with sausage',
    galleryImage5Alt: 'Bottled Pepsi chilled with ice',
    galleryImage6Alt: 'Seven Up bottle on crushed ice',
    orderNow: 'Order now',
    openCalculatorLabel: 'Open calculator',
    openCalculatorAria: 'Open order calculator in a new tab',
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
    carouselPagination: 'Menu highlights',
    carouselSlideLabel: 'View slide {index}',
    addToOrder: 'Add to order',
    removeFromOrder: 'Remove from order',
    productActionsAria: 'Quantity controls',
    summaryIncrease: 'Add one {item}',
    summaryDecrease: 'Remove one {item}',
    inCart: 'In cart: {count}',
    contactDeliveryHeading: 'We deliver to:',
    contactDeliveryAreas: 'Saucés · Alborada · Guayacanes · Tarazana · Brisas del Río',
    contactWhatsAppLabel: 'WhatsApp:',
    footerConsentLink: 'Consent management',
    footerTermsLink: 'Terms & Conditions',
    footerLegalContact: 'Legal contact',
    footerCalculatorLink: 'Order calculator',
    rights: 'All rights reserved.',
    edgeSecurity: 'Edge protected via Cloudflare Zero Trust',

    // Consent center UI
    consentMetaTitle: 'Consent Management | Marxia Café y Bocaditos',
    consentMetaDescription: 'Overview of consent, cookies, and privacy choices for Marxia Café y Bocaditos.',
    consentHeading: 'Consent management',
    consentTagline: 'Transparency in how we collect, use, and protect your data.',
    consentOverviewTitle: 'Overview',
    consentOverviewBody:
      'Marxia Café y Bocaditos operates with privacy by design and default. We process personal information only with clear legal bases, record consent, and provide simple mechanisms so you can adjust your preferences at any time.',
    consentDataTitle: 'Data we collect',
    consentDataIntro: 'The information we may process is grouped as follows:',
    consentDataEssential:
      '<strong>Essential data:</strong> elements required to deliver the requested service, such as language selection, cart items, and delivery choices.',
    consentDataContact:
      '<strong>Contact data:</strong> name, email, or phone number when you choose to interact via forms or messaging channels.',
    consentDataMetrics:
      '<strong>Experience metrics:</strong> pseudonymised information about site usage to improve accessibility, performance, and security.',
    consentLegalTitle: 'Legal bases for processing',
    consentLegalIntro: 'We process your personal data under the following grounds:',
    consentLegalConsent:
      '<strong>Explicit consent:</strong> required for non-essential cookies, personalised marketing, and optional communications.',
    consentLegalContract:
      '<strong>Performance of a contract:</strong> when you request products or services and we need your details to fulfil delivery.',
    consentLegalInterest:
      '<strong>Legitimate interest:</strong> to prevent fraud, protect infrastructure, and improve accessibility while respecting your rights.',
    consentCookiesTitle: 'Cookie categories and similar technologies',
    consentCookiesCaption: 'Responsible use of cookies',
    consentCookiesColumnCategory: 'Category',
    consentCookiesColumnPurpose: 'Purpose',
    consentCookiesColumnDuration: 'Duration',
    consentCookiesColumnLegal: 'Legal basis',
    consentCookiesEssential: 'Essential',
    consentCookiesEssentialPurpose:
      'Keep sessions active, remember language or accessibility preferences, and secure payments.',
    consentCookiesEssentialDuration: 'Session or up to 12 months',
    consentCookiesEssentialLegal: 'Contract performance / Legitimate interest',
    consentCookiesAnalytics: 'Analytics',
    consentCookiesAnalyticsPurpose: 'Measure visits, detect errors, and optimise the experience.',
    consentCookiesAnalyticsDuration: '30 minutes to 24 months',
    consentCookiesAnalyticsLegal: 'Consent',
    consentCookiesMarketing: 'Marketing',
    consentCookiesMarketingPurpose: 'Send relevant promotions or opt-in reminders.',
    consentCookiesMarketingDuration: 'Until revoked',
    consentCookiesMarketingLegal: 'Consent',
    consentCookiesNote:
      'Analytics and marketing cookies are disabled by default. You can manage them from the consent preference centre at the bottom of the site.',
    consentCenterTitle: 'Dynamic preference centre',
    consentCenterIntro:
      'Control which optional categories you authorise in real time. Changes are saved instantly and applied across the site, honouring privacy by default.',
    consentAcceptAll: 'Allow all',
    consentRejectAll: 'Reject optional',
    consentStatusIdle: 'Adjust your preferences and save changes to personalise your experience.',
    consentStatusSaved: 'Preferences saved. You can adjust each category whenever you need.',
    consentTimestampLabel: 'Last updated:',
    consentEssentialCard: 'Essential',
    consentBadgeRequired: 'Required',
    consentEssentialCopy:
      'Ensure the platform runs securely: sessions, language, accessibility, and order maintenance.',
    consentEssentialAria: 'Essential cookies are always on',
    consentSwitchActive: 'Active',
    consentAnalyticsCard: 'Analytics',
    consentBadgeOptional: 'Optional',
    consentAnalyticsCopy:
      'Help us measure performance, detect issues, and improve the experience without identifying you directly.',
    consentAnalyticsAria: 'Toggle analytics cookies on or off',
    consentMarketingCard: 'Marketing',
    consentMarketingCopy:
      'Personalise communications and campaigns that might interest you based on your tastes and previous orders.',
    consentMarketingAria: 'Toggle marketing communications on or off',
    consentManageTitle: 'Manage your preferences',
    consentManageStepOne: 'Click the “Privacy preferences” button in the footer.',
    consentManageStepTwo: 'Select each category to review its description and activate or deactivate as needed.',
    consentManageStepThree:
      'Save your changes. Your settings will sync across devices where you use the same account.',
    consentManageNote: 'You can withdraw consent at any time without affecting processing carried out before the withdrawal.',
    consentRightsTitle: 'Your privacy rights',
    consentRightsIntro: 'Depending on your jurisdiction, you may exercise the following rights:',
    consentRightsAccess: 'Access, rectify, and update your personal information.',
    consentRightsDeletion: 'Delete or anonymise data when it is no longer needed.',
    consentRightsPortability: 'Request data portability in a structured format.',
    consentRightsObjection: 'Object to or restrict processing based on legitimate interests.',
    consentRightsComplaint: 'File complaints with the relevant supervisory authority.',
    consentRightsContact:
      'To exercise these rights, email us at <a href="mailto:privacidad@marxia.ec">privacidad@marxia.ec</a> or send us a WhatsApp message.',
    consentRetentionTitle: 'Data retention and security',
    consentRetentionBody:
      'We retain personal data only as long as necessary for the stated purposes or as required by law. We implement encryption, access controls, and continuous monitoring aligned with NIST CSF, CISA Cyber Essentials, and PCI DSS 4.0 to protect your information.',
    consentUpdatesTitle: 'Updates',
    consentUpdatesBody:
      'We review this consent policy periodically. Significant changes will be announced via on-site banners with a visible update date. Last updated: <time datetime="2024-06-01">June 1, 2024</time>.',
    consentFooterRights: 'Marxia Café y Bocaditos. All rights reserved.',
    consentFooterLinksPrefix: 'Also review our',
    consentFooterTerms: 'Terms & Conditions',
    consentFooterAnd: 'and the',
    consentFooterPreferences: 'preference settings',
    consentFooterSuffix: 'to manage cookies.',

    // Legal (terms)
    termsMetaTitle: 'Terms & Conditions | Marxia Café y Bocaditos',
    termsMetaDescription: 'Usage conditions, responsibilities, and service policies for Marxia Café y Bocaditos.',
    termsHeading: 'Terms & Conditions',
    termsTagline: 'Service agreement for using Marxia Café y Bocaditos digital channels.',
    termsScopeHeading: '1. Scope and acceptance',
    termsScopeBody:
      'These Terms and Conditions govern access to and use of the website, applications, and related channels of Marxia Café y Bocaditos. By accessing or placing an order you agree to this agreement, the Consent Policy, and any additional guidelines published on the platform.',
    termsServicesHeading: '2. Services offered',
    termsServicesBody:
      'We provide culinary experiences, reservations, and deliveries within designated areas of Guayaquil. Features and availability may vary based on seasons, capacity, or special events. Changes will be communicated through the site or official messaging channels.',
    termsOrdersHeading: '3. Orders, payments, and billing',
    termsOrdersConfirm:
      'Orders are confirmed only after receiving proof of payment or manual validation.',
    termsOrdersPayments:
      'We accept payment methods enabled in the checkout flow, including PCI DSS compatible cards and transfers.',
    termsOrdersInvoices:
      'We issue electronic invoices or receipts under Ecuadorian regulations when applicable.',
    termsOrdersPricing:
      'Prices include applicable taxes; any additional charges will be disclosed before confirming the order.',
    termsUserHeading: '4. User responsibilities',
    termsUserAccurateInfo: 'Provide truthful, complete information when registering or requesting deliveries.',
    termsUserSchedule: 'Respect delivery times and established cancellation policies.',
    termsUserConduct: 'Do not use the site for illicit, fraudulent, or security-compromising activities.',
    termsUserAllergens: 'Review allergen notices and nutrition facts before placing an order.',
    termsPrivacyHeading: '5. Privacy and consent',
    termsPrivacyBody:
      'Personal data processing follows our <a href="consent.html">Consent Management</a>. We apply technical and organisational controls aligned with NIST CSF, CISA Cyber Essentials, and PCI DSS to safeguard confidentiality, integrity, and availability.',
    termsIntellectualHeading: '6. Intellectual property',
    termsIntellectualBody:
      'All content, trademarks, logos, photographs, and designs are owned by Marxia Café y Bocaditos or its licensors. Reproducing, modifying, or distributing the material without prior written authorisation is prohibited.',
    termsLiabilityHeading: '7. Limitation of liability',
    termsLiabilityBody:
      'We make reasonable efforts to provide a secure and available service. However, we are not liable for indirect damages, interruptions, or losses caused by factors beyond our control, including third-party failures, power outages, or force majeure.',
    termsChangesHeading: '8. Modifications',
    termsChangesBody:
      'We may update these terms to reflect regulatory, product, or business changes. Updated versions take effect upon publication with the latest revision date. Continued use after changes signifies acceptance.',
    termsContactHeading: '9. Contact',
    termsContactBody:
      'For legal questions or inquiries about these terms, email <a href="mailto:legal@marxia.ec">legal@marxia.ec</a> or reach us via WhatsApp. You can also visit our Guayaquil location by appointment.',
    termsLawHeading: '10. Governing law and jurisdiction',
    termsLawBody:
      'This agreement is governed by the laws of the Republic of Ecuador. Disputes will be resolved before the competent courts of Guayaquil, without prejudice to alternative resolution mechanisms agreed by the parties.',
    termsUpdated: 'Last updated: <time datetime="2024-06-01">June 1, 2024</time>.',
    termsFooterRights: 'Marxia Café y Bocaditos. All rights reserved.',
    termsFooterLinksPrefix: 'Also review our',
    termsFooterConsent: 'Consent management',
    termsFooterAnd: 'and the security policies applied on the',
    termsFooterSite: 'main site',
    termsFooterSuffix: '.',

    // Drawer & FAB labels
    chatTitle: 'Live chat',
    chatWelcome: 'Hello 👋 How can we help you today?',
    chatLabel: 'Message',
    chatSend: 'Send',
    chatPlaceholder: 'Type your message…',
    chatClose: 'Close chat',
    payTitle: 'Checkout preview',
    payNow: 'Pay now',
    payCloseAction: 'Close',
    fabNavLabel: 'Quick actions navigation',
    fabLanguageLabel: 'Language options',
    fabThemeLabel: 'Theme options',
    fabChatLabel: 'Live chat',
    fabPayLabel: 'Payment summary',
  },
  es: {
    // Navegación y diseño global
    skipToContent: 'Saltar al contenido',
    brandName: 'Marxia',
    brandTagline: 'Café y Bocaditos',
    brandTitle: 'Marxia Café y Bocaditos',
    brandSubtitle: 'Desayunos, bocaditos y catering en Guayaquil',
    brandSubheading: 'Desayunos artesanales',
    navHome: 'Inicio',
    navHomeAria: 'Volver a la página principal',
    navOrder: 'Ordenar',
    navGallery: 'Galería',
    navContact: 'Contacto',
    navConsent: 'Gestión de consentimiento',
    navTerms: 'Términos y Condiciones',
    quickPreferences: 'Preferencias rápidas',
    languageSelection: 'Selección de idioma',
    languageToggleToEnglish: 'Cambiar a inglés',
    languageToggleToSpanish: 'Cambiar a español',
    themeSelection: 'Selección de tema',
    themeToggleDark: 'Oscuro',
    themeToggleLight: 'Claro',
    themeToggleAriaDark: 'Cambiar a tema oscuro',
    themeToggleAriaLight: 'Cambiar a tema claro',
    legalInfo: 'Información legal',
    landingFooterSecurity:
      'Marxia Café y Bocaditos. Seguridad reforzada con buenas prácticas PCI DSS, NIST CSF y CISA.',

    // Landing y pedidos
    heroEyebrow: 'Marxia Café y Bocaditos',
    heroTitle: 'Marxia Café y Bocaditos',
    heroSubtitle: 'Desayunos, bocaditos y entregas en el Norte de Guayaquil.',
    heroHeadline: 'Marxia Café y Bocaditos',
    heroSubheadline: 'Desayunos, bocaditos y entregas en el Norte de Guayaquil.',
    heroPromise: 'Sabores frescos todos los días.',
    headline: 'Marxia Café y Bocaditos',
    tagline: 'Desayunos, bocaditos y entregas en el Norte de Guayaquil.',
    promise: 'Sabores frescos todos los días.',
    deliveryCoverage:
      'Entregamos en el Norte de Guayaquil: Saucés · Alborada · Guayacanes · Tarazana · Brisas del Río',
    galleryTitle: 'Nuestro menú',
    gallerySubtitle: 'Elige lo que energiza tu día.',
    galleryHint: 'Elige lo que energiza tu día.',
    galleryImage1Alt: 'Shot de espresso recién preparado',
    galleryImage2Alt: 'Bandeja de desayuno con café, tortilla, huevos y salchicha',
    galleryImage3Alt: 'Tortilla dorada sobre tabla de madera',
    galleryImage4Alt: 'Huevos fritos servidos con salchicha',
    galleryImage5Alt: 'Botella de Pepsi fría con hielo',
    galleryImage6Alt: 'Botella de Seven Up sobre hielo',
    orderNow: 'Ordenar ahora',
    openCalculatorLabel: 'Abrir calculadora',
    openCalculatorAria: 'Abrir la calculadora de pedidos en una nueva pestaña',
    orderTitle: 'Nuestro menú',
    orderSubtitle: 'Toca para descubrir nuestros favoritos artesanales.',
    insightsTitle: 'Tablero de experiencia',
    insightsSubtitle: '',
    sentimentTitle: 'Sentimiento del consumidor final',
    sentimentUpdated: 'Actualizado cada 30 minutos',
    sentimentScore: 'Calificación promedio',
    sentimentReviews: '1.248 reseñas verificadas',
    visitorsTitle: 'Visitantes',
    visitorsMeta: 'Tráfico físico y digital',
    visitorsCaption: 'Hoy 320 · Este mes 8.450 · El año pasado 92.300',
    salesTitle: 'Ventas en línea',
    salesMeta: 'Oportunidad de crecimiento',
    salesCaption: 'Hoy $620 · Este mes $18.400 · El año pasado $212.000',
    ordersTitle: 'Detalles del pedido',
    ordersMeta: 'Pago seguro habilitado',
    ordersSubtotal: 'Subtotal',
    ordersTax: 'IVA 15%',
    ordersDelivery: 'Entrega',
    ordersTotal: 'Total',
    orderItems: 'Productos seleccionados',
    orderSummaryEmpty: 'Tu canasta está vacía. Agrega tus favoritos para verlos aquí.',
    deliveryTitle: 'Horario de entrega',
    deliveryEta: 'Entrega estimada: {time}',
    deliveryEtaPrompt: 'Selecciona una ventana de entrega para ver tu ETA.',
    clearOrder: 'Limpiar',
    checkout: 'Pago seguro',
    carouselPrev: 'Favoritos anteriores',
    carouselNext: 'Siguientes favoritos',
    carouselPagination: 'Destacados del menú',
    carouselSlideLabel: 'Ver diapositiva {index}',
    addToOrder: 'Agregar al pedido',
    removeFromOrder: 'Quitar del pedido',
    productActionsAria: 'Controles de cantidad',
    summaryIncrease: 'Agregar un {item}',
    summaryDecrease: 'Quitar un {item}',
    inCart: 'En la canasta: {count}',
    contactDeliveryHeading: 'Entregamos en:',
    contactDeliveryAreas: 'Saucés · Alborada · Guayacanes · Tarazana · Brisas del Río',
    contactWhatsAppLabel: 'WhatsApp:',
    footerConsentLink: 'Gestión de consentimiento',
    footerTermsLink: 'Términos y Condiciones',
    footerLegalContact: 'Contacto legal',
    footerCalculatorLink: 'Calculadora de pedidos',
    rights: 'Todos los derechos reservados.',
    edgeSecurity: 'Protegido en el borde con Cloudflare Zero Trust',

    // Centro de consentimiento
    consentMetaTitle: 'Gestión de consentimiento | Marxia Café y Bocaditos',
    consentMetaDescription:
      'Resumen de consentimiento, cookies y opciones de privacidad para Marxia Café y Bocaditos.',
    consentHeading: 'Gestión de consentimiento',
    consentTagline: 'Transparencia en cómo recopilamos, usamos y protegemos tus datos.',
    consentOverviewTitle: 'Resumen general',
    consentOverviewBody:
      'Marxia Café y Bocaditos opera con un enfoque de privacidad por diseño y por defecto. Procesamos la información personal únicamente con fundamentos legales claros, registramos el consentimiento y ofrecemos mecanismos sencillos para que puedas ajustar tus preferencias en cualquier momento.',
    consentDataTitle: 'Datos que recopilamos',
    consentDataIntro: 'La información que podemos procesar se clasifica de la siguiente manera:',
    consentDataEssential:
      '<strong>Datos esenciales:</strong> elementos necesarios para brindar el servicio solicitado, como idioma seleccionado, artículos en el carrito y opciones de entrega.',
    consentDataContact:
      '<strong>Datos de contacto:</strong> nombre, correo electrónico o teléfono cuando decides interactuar mediante formularios o canales de mensajería.',
    consentDataMetrics:
      '<strong>Métricas de experiencia:</strong> información pseudonimizada sobre el uso del sitio para mejorar accesibilidad, rendimiento y seguridad.',
    consentLegalTitle: 'Base legal para el procesamiento',
    consentLegalIntro: 'Procesamos tus datos personales bajo los siguientes fundamentos:',
    consentLegalConsent:
      '<strong>Consentimiento explícito:</strong> requerido para el uso de cookies no esenciales, marketing personalizado y comunicaciones opcionales.',
    consentLegalContract:
      '<strong>Ejecución de un contrato:</strong> cuando solicitas productos o servicios y necesitamos tus datos para completar la entrega.',
    consentLegalInterest:
      '<strong>Interés legítimo:</strong> para prevenir fraude, proteger la infraestructura y mejorar la accesibilidad del sitio, respetando siempre tus derechos.',
    consentCookiesTitle: 'Categorías de cookies y tecnologías similares',
    consentCookiesCaption: 'Uso responsable de cookies',
    consentCookiesColumnCategory: 'Categoría',
    consentCookiesColumnPurpose: 'Propósito',
    consentCookiesColumnDuration: 'Duración',
    consentCookiesColumnLegal: 'Base legal',
    consentCookiesEssential: 'Esenciales',
    consentCookiesEssentialPurpose:
      'Mantener el inicio de sesión, recordar el idioma o preferencias de accesibilidad y asegurar la integridad de pagos.',
    consentCookiesEssentialDuration: 'Sesión o hasta 12 meses',
    consentCookiesEssentialLegal: 'Ejecución de contrato / Interés legítimo',
    consentCookiesAnalytics: 'Analíticas',
    consentCookiesAnalyticsPurpose: 'Medir visitas, detectar errores y optimizar la experiencia.',
    consentCookiesAnalyticsDuration: '30 minutos a 24 meses',
    consentCookiesAnalyticsLegal: 'Consentimiento',
    consentCookiesMarketing: 'Marketing',
    consentCookiesMarketingPurpose: 'Enviar promociones relevantes o recordatorios opt-in.',
    consentCookiesMarketingDuration: 'Hasta revocación',
    consentCookiesMarketingLegal: 'Consentimiento',
    consentCookiesNote:
      'Las cookies analíticas y de marketing están desactivadas por defecto. Puedes gestionarlas desde el Centro de Preferencias de Consentimiento en la parte inferior del sitio.',
    consentCenterTitle: 'Centro de preferencias dinámico',
    consentCenterIntro:
      'Controla qué categorías opcionales autorizas en tiempo real. Los cambios se guardan al instante y aplican al resto del sitio, respetando el principio de privacidad por defecto.',
    consentAcceptAll: 'Permitir todo',
    consentRejectAll: 'Rechazar opcionales',
    consentStatusIdle: 'Ajusta tus preferencias y guarda los cambios para personalizar tu experiencia.',
    consentStatusSaved: 'Preferencias guardadas. Puedes ajustar cada categoría cuando lo necesites.',
    consentTimestampLabel: 'Última actualización:',
    consentEssentialCard: 'Esenciales',
    consentBadgeRequired: 'Necesario',
    consentEssentialCopy:
      'Garantizan que la plataforma funcione de forma segura: inicio de sesión, idioma, accesibilidad y mantenimiento de pedidos.',
    consentEssentialAria: 'Las cookies esenciales siempre están activas',
    consentSwitchActive: 'Activo',
    consentAnalyticsCard: 'Analíticas',
    consentBadgeOptional: 'Opcional',
    consentAnalyticsCopy:
      'Nos ayudan a medir el rendimiento, detectar incidencias y mejorar la experiencia sin identificarte directamente.',
    consentAnalyticsAria: 'Activar o desactivar cookies analíticas',
    consentMarketingCard: 'Marketing',
    consentMarketingCopy:
      'Personalizan comunicaciones y campañas que podrían interesarte según tus gustos y pedidos previos.',
    consentMarketingAria: 'Activar o desactivar comunicaciones de marketing',
    consentManageTitle: 'Gestiona tus preferencias',
    consentManageStepOne: 'Haz clic en el botón “Preferencias de privacidad” en el pie de página.',
    consentManageStepTwo: 'Selecciona cada categoría para ver su descripción y activar o desactivar según tus necesidades.',
    consentManageStepThree:
      'Guarda los cambios. Tus ajustes se sincronizarán en todos los dispositivos donde utilices la misma cuenta.',
    consentManageNote:
      'Siempre podrás retirar tu consentimiento sin afectar la legalidad del procesamiento previo a la revocación.',
    consentRightsTitle: 'Tus derechos de privacidad',
    consentRightsIntro: 'Dependiendo de tu jurisdicción, puedes ejercer los siguientes derechos:',
    consentRightsAccess: 'Acceso, rectificación y actualización de tu información personal.',
    consentRightsDeletion: 'Eliminación o anonimización de datos cuando ya no sean necesarios.',
    consentRightsPortability: 'Portabilidad de datos en un formato estructurado.',
    consentRightsObjection: 'Oposición o restricción al procesamiento basado en intereses legítimos.',
    consentRightsComplaint: 'Presentar quejas ante la autoridad de control competente.',
    consentRightsContact:
      'Para ejercer estos derechos, escríbenos a <a href="mailto:privacidad@marxia.ec">privacidad@marxia.ec</a> o envíanos un mensaje vía WhatsApp.',
    consentRetentionTitle: 'Conservación y seguridad de los datos',
    consentRetentionBody:
      'Conservamos los datos personales únicamente durante el tiempo necesario para cumplir con los fines descritos o según lo requiera la ley aplicable. Implementamos cifrado, controles de acceso y monitoreo continuo conforme a NIST CSF, CISA Cyber Essentials y PCI DSS 4.0 para proteger tu información.',
    consentUpdatesTitle: 'Actualizaciones',
    consentUpdatesBody:
      'Revisamos esta política de consentimiento de manera periódica. Notificaremos cambios sustanciales mediante banners en el sitio y una fecha de actualización visible. Última actualización: <time datetime="2024-06-01">1 de junio de 2024</time>.',
    consentFooterRights: 'Marxia Café y Bocaditos. Todos los derechos reservados.',
    consentFooterLinksPrefix: 'Consulta también nuestros',
    consentFooterTerms: 'Términos y Condiciones',
    consentFooterAnd: 'y la',
    consentFooterPreferences: 'configuración de preferencias',
    consentFooterSuffix: 'para administrar cookies.',

    // Términos legales
    termsMetaTitle: 'Términos y Condiciones | Marxia Café y Bocaditos',
    termsMetaDescription:
      'Condiciones de uso, responsabilidades y políticas de servicio de Marxia Café y Bocaditos.',
    termsHeading: 'Términos y Condiciones',
    termsTagline: 'Acuerdo de servicio para utilizar los canales digitales de Marxia Café y Bocaditos.',
    termsScopeHeading: '1. Alcance y aceptación',
    termsScopeBody:
      'Estos Términos y Condiciones regulan el acceso y uso del sitio web, aplicaciones y canales asociados de Marxia Café y Bocaditos. Al acceder o realizar un pedido aceptas cumplir este acuerdo, la Política de Consentimiento y cualquier lineamiento complementario publicado en la plataforma.',
    termsServicesHeading: '2. Servicios ofrecidos',
    termsServicesBody:
      'Ofrecemos experiencias gastronómicas, reservas y entregas a domicilio dentro de las zonas habilitadas de Guayaquil. Las características y disponibilidad pueden variar según temporadas, aforo y eventos especiales. Cualquier cambio será comunicado mediante el sitio o canales oficiales de mensajería.',
    termsOrdersHeading: '3. Pedidos, pagos y facturación',
    termsOrdersConfirm:
      'Los pedidos se considerarán confirmados únicamente tras recibir un comprobante de pago o validación manual.',
    termsOrdersPayments:
      'Aceptamos métodos de pago habilitados en el flujo de checkout, incluyendo tarjetas compatibles con PCI DSS y transferencias.',
    termsOrdersInvoices:
      'Emitimos facturas o comprobantes electrónicos bajo normativa ecuatoriana cuando corresponda.',
    termsOrdersPricing:
      'Los precios incluyen impuestos aplicables; cualquier cargo adicional se informará antes de confirmar la orden.',
    termsUserHeading: '4. Responsabilidades del usuario',
    termsUserAccurateInfo: 'Proporcionar información veraz y completa al registrarse o solicitar entregas.',
    termsUserSchedule: 'Respetar horarios de entrega y políticas de cancelación establecidas.',
    termsUserConduct: 'No utilizar el sitio para actividades ilícitas, fraudulentas o que comprometan la seguridad.',
    termsUserAllergens: 'Revisar las alertas de alérgenos y fichas nutricionales antes de realizar un pedido.',
    termsPrivacyHeading: '5. Privacidad y consentimiento',
    termsPrivacyBody:
      'El tratamiento de datos personales se rige por nuestra <a href="consent.html">Gestión de consentimiento</a>. Utilizamos controles técnicos y organizativos alineados con NIST CSF, CISA Cyber Essentials y PCI DSS para salvaguardar la confidencialidad, integridad y disponibilidad de tu información.',
    termsIntellectualHeading: '6. Propiedad intelectual',
    termsIntellectualBody:
      'Todos los contenidos, marcas, logotipos, fotografías y diseños son propiedad de Marxia Café y Bocaditos o de sus licenciantes. No se permite reproducir, modificar o distribuir el material sin autorización escrita previa.',
    termsLiabilityHeading: '7. Limitación de responsabilidad',
    termsLiabilityBody:
      'Hacemos esfuerzos razonables por garantizar un servicio seguro y disponible. Sin embargo, no asumimos responsabilidad por daños indirectos, interrupciones o pérdidas derivadas de causas fuera de nuestro control, incluyendo fallos de terceros, cortes eléctricos o eventos de fuerza mayor.',
    termsChangesHeading: '8. Modificaciones',
    termsChangesBody:
      'Podemos actualizar estos términos para reflejar cambios regulatorios, de producto o de negocio. Las versiones modificadas entrarán en vigencia al publicarse en esta página, indicando la fecha de última actualización. El uso continuado posterior a los cambios implica tu aceptación.',
    termsContactHeading: '9. Contacto',
    termsContactBody:
      'Si tienes consultas legales o sobre estos términos, escríbenos a <a href="mailto:legal@marxia.ec">legal@marxia.ec</a> o contáctanos mediante WhatsApp. También puedes visitar nuestra sede en Guayaquil previa cita.',
    termsLawHeading: '10. Ley aplicable y jurisdicción',
    termsLawBody:
      'Este acuerdo se rige por las leyes de la República del Ecuador. Cualquier controversia se resolverá ante los tribunales competentes de Guayaquil, sin perjuicio de mecanismos alternativos de resolución que las partes acuerden.',
    termsUpdated: 'Última actualización: <time datetime="2024-06-01">1 de junio de 2024</time>.',
    termsFooterRights: 'Marxia Café y Bocaditos. Todos los derechos reservados.',
    termsFooterLinksPrefix: 'Revisa también nuestra',
    termsFooterConsent: 'Gestión de consentimiento',
    termsFooterAnd: 'y las políticas de seguridad aplicadas en el',
    termsFooterSite: 'sitio principal',
    termsFooterSuffix: '.',

    // Etiquetas de cajones y FAB
    chatTitle: 'Chat en vivo',
    chatWelcome: 'Hola 👋 ¿En qué podemos ayudarte hoy?',
    chatLabel: 'Mensaje',
    chatSend: 'Enviar',
    chatPlaceholder: 'Escribe tu mensaje…',
    chatClose: 'Cerrar chat',
    payTitle: 'Resumen de pago',
    payNow: 'Pagar ahora',
    payCloseAction: 'Cerrar',
    fabNavLabel: 'Accesos rápidos',
    fabLanguageLabel: 'Opciones de idioma',
    fabThemeLabel: 'Opciones de tema',
    fabChatLabel: 'Chat en vivo',
    fabPayLabel: 'Resumen de pago',
  },
});

const SUPPORTED_LANGUAGES = Object.freeze(Object.keys(translations));
const DEFAULT_LANGUAGE = 'es';


const STORAGE_KEY = 'marxia-lang';

function normalizeLanguage(language) {
  if (!language) return DEFAULT_LANGUAGE;
  const normalized = language.toLowerCase();
  return SUPPORTED_LANGUAGES.includes(normalized) ? normalized : DEFAULT_LANGUAGE;
}

function createI18nManager({
  html = typeof document !== 'undefined' ? document.documentElement : undefined,
  storage = typeof window !== 'undefined' ? window.localStorage : undefined,
  initialLanguage,
} = {}) {
  let currentLanguage = normalizeLanguage(initialLanguage || html?.lang);
  const listeners = new Set();

  if (html) {
    html.lang = currentLanguage;
  }

  if (storage) {
    const stored = storage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
      currentLanguage = stored;
      if (html) {
        html.lang = currentLanguage;
      }
    } else {
      storage.setItem(STORAGE_KEY, currentLanguage);
    }
  }

  const notify = () => {
    listeners.forEach((listener) => {
      try {
        listener(currentLanguage);
      } catch (error) {
        console.error('i18n listener error', error);
      }
    });
  };

  const getDictionary = (lang = currentLanguage) => translations[normalizeLanguage(lang)] ?? {};

  const format = (key, replacements = {}, lang = currentLanguage) => {
    const dictionary = getDictionary(lang);
    const template = dictionary[key];
    if (template === undefined) {
      return undefined;
    }
    return Object.entries(replacements).reduce(
      (acc, [token, value]) => acc.replace(new RegExp(`\\{${token}\\}`, 'g'), String(value)),
      template,
    );
  };

  const translate = (key, lang = currentLanguage) => getDictionary(lang)[key];

  const setLanguage = (lang) => {
    const nextLanguage = normalizeLanguage(lang);
    if (nextLanguage === currentLanguage) {
      return currentLanguage;
    }
    currentLanguage = nextLanguage;
    if (html) {
      html.lang = currentLanguage;
    }
    if (storage) {
      storage.setItem(STORAGE_KEY, currentLanguage);
    }
    notify();
    return currentLanguage;
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return {
    get language() {
      return currentLanguage;
    },
    setLanguage,
    translate,
    format,
    subscribe,
    getDictionary,
  };
}




function createCartStore({ taxRate = 0, deliveryFee = 0 } = {}) {
  const items = new Map();

  const getItem = (id) => items.get(id);

  const list = ({ includeZero = false } = {}) =>
    Array.from(items.entries())
      .map(([id, entry]) => ({ id, ...entry }))
      .filter((entry) => includeZero || entry.quantity > 0);

  const totals = () => {
    const snapshot = list();
    const subtotal = snapshot.reduce((sum, { price, quantity }) => sum + price * quantity, 0);
    const tax = subtotal * taxRate;
    const delivery = snapshot.length > 0 ? deliveryFee : 0;
    const total = subtotal + tax + delivery;
    return {
      subtotal: roundCurrency(subtotal),
      tax: roundCurrency(tax),
      delivery: roundCurrency(delivery),
      total: roundCurrency(total),
    };
  };

  const register = (id, data) => {
    if (!id) return;
    const nextEntry = {
      price: Number.parseFloat(data?.price ?? 0),
      quantity: Number.parseInt(data?.quantity ?? 0, 10) || 0,
      labels: data?.labels ?? {},
      card: data?.card,
    };
    items.set(id, nextEntry);
  };

  const modify = (id, delta) => {
    const entry = getItem(id);
    if (!entry) {
      return 0;
    }
    const nextQuantity = Math.max(0, Number.parseInt(entry.quantity ?? 0, 10) + delta);
    entry.quantity = nextQuantity;
    items.set(id, entry);
    return nextQuantity;
  };

  const clear = () => {
    items.forEach((entry, id) => {
      entry.quantity = 0;
      items.set(id, entry);
    });
  };

  return {
    register,
    modify,
    clear,
    getItem,
    get: getItem,
    has: (id) => items.has(id),
    list,
    totals,
    size: () => items.size,
  };
}


(function () {
  const sanitizeBase = (value) => {
    if (typeof value !== 'string') {
      return '';
    }
    const trimmed = value.trim();
    return trimmed.replace(/\/+$/, '');
  };

  const resolveWorkerBase = (element) => {
    const candidates = [];
    if (element) {
      candidates.push(element.getAttribute('data-worker-base'));
      candidates.push(element.getAttribute('data-calculator-base'));
    }
    if (document.body) {
      candidates.push(document.body.getAttribute('data-calculator-base'));
      candidates.push(document.body.getAttribute('data-worker-base'));
    }
    candidates.push(document.documentElement.getAttribute('data-calculator-base'));
    candidates.push(document.documentElement.getAttribute('data-worker-base'));

    for (const candidate of candidates) {
      const sanitized = sanitizeBase(candidate);
      if (sanitized) {
        return sanitized;
      }
    }
    return '';
  };

  const openInNewTab = (url) => {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.style.position = 'absolute';
    anchor.style.opacity = '0';
    anchor.style.pointerEvents = 'none';
    anchor.style.width = '1px';
    anchor.style.height = '1px';
    document.body.appendChild(anchor);
    anchor.click();
    window.requestAnimationFrame(() => {
      anchor.remove();
    });
  };

  const initializeCalculatorButton = () => {
    const calculatorButton = document.querySelector('#openCalc');
    if (!(calculatorButton instanceof HTMLButtonElement)) {
      return;
    }

    const workerBase = resolveWorkerBase(calculatorButton);
    const targetUrl = workerBase ? `${workerBase}/calc` : '';

    if (!targetUrl) {
      calculatorButton.setAttribute('disabled', 'true');
      calculatorButton.setAttribute('aria-disabled', 'true');
      return;
    }

    calculatorButton.addEventListener('click', () => {
      openInNewTab(targetUrl);
    });
  };

  if (typeof document !== 'undefined') {
    initializeCalculatorButton();
  }
})();


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

    const fabTarget = target.closest('.fab');

    if (fabTarget === fabLanguage) {
      showFabLabel(fabLanguage);
      toggleMenu(document.querySelector('#fabLanguageMenu'), fabLanguage);
    } else if (fabTarget === fabTheme) {
      showFabLabel(fabTheme);
      toggleMenu(document.querySelector('#fabThemeMenu'), fabTheme);
    } else if (fabTarget === fabChat) {
      toggleFabDrawer(fabChat, 'chatDrawer');
    } else if (fabTarget === fabPay) {
      toggleFabDrawer(fabPay, 'payDrawer');
    } else if (!target.closest('.fab-menu') && !fabTarget) {
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
