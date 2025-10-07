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
