# Solaria FAB Chatbot

The Solaria chatbot is a self-contained floating action button (FAB) assistant designed for any static site. It ships without NPM dependencies, performs every interaction in the browser, and never references the Marxia order flow.

## Features

- Accessible FAB that supports icon-only or extended variants, scrim overlays, and `Escape` to close.
- Offline-friendly Q&A using configurable regex or functional matchers.
- Optional async resolver hook for custom backends.
- Bilingual disclaimer and quick suggestion chips out of the box.

## Quick start

```html
<script type="module">
  import { mountSolariaFabChatbot } from '/standalone/solaria-fab-chatbot/solaria-fab-chatbot.js';

  mountSolariaFabChatbot({
    ui: {
      position: 'left',
      fab: { icon: '🌐', label: 'Solaria', ariaLabel: 'Abrir Solaria', variant: 'extended' }
    },
    qna: [
      { match: /pricing/i, reply: 'Consulta nuestros planes en https://example.com/precios' },
      { match: /demo/i, reply: 'Agenda una demo en https://example.com/demo' }
    ],
    resolver: async (text) => {
      // Return null to fall back to local Q&A
      const res = await fetch('https://example.com/api/faq?prompt=' + encodeURIComponent(text));
      if (!res.ok) return null;
      const data = await res.json();
      return data.answer || null;
    }
  });
</script>
```

You can omit the `resolver` field to keep the assistant fully offline. The module never issues write operations, preserving a client-only, read-only posture.
