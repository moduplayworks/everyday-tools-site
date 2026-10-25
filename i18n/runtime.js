const locale = document.documentElement.lang;
if (locale === 'en' || locale === 'ja') {
  const comparisonMessages =
    locale === 'ja'
      ? {
          loading: '翻訳を読み込んでいます。少し待ってから再計算してください。',
          failed:
            '翻訳を読み込めませんでした。ページを再読み込みしてください。',
        }
      : {
          loading:
            'Translations are loading. Try calculating again in a moment.',
          failed:
            'Translations could not be loaded. Refresh this page and try again.',
        };
  let catalogReady = false;
  let catalogFailed = false;
  document.addEventListener(
    'submit',
    (event) => {
      const form = event.target;
      if (
        catalogReady ||
        !(form instanceof HTMLFormElement) ||
        !form.closest('[data-comparison-tool]')
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      const status = form.querySelector('[data-status]');
      if (status)
        status.textContent = catalogFailed
          ? comparisonMessages.failed
          : comparisonMessages.loading;
    },
    true,
  );
  const normalize = (value) => value.replace(/\s+/g, ' ').trim();
  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const isKorean = (value) =>
    /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/.test(value);
  const runtimeRegions =
    'button,option,[role="status"],[role="alert"],[aria-live],[data-i18n-dynamic],[data-i18n-dynamic-value],[data-result-summary],[data-result-hint]';
  const exactOnlyRegions = '[data-result-summary],[data-result-hint]';
  const dynamicValueRegions = 'textarea[data-i18n-dynamic-value]';

  const preserveEdgeWhitespace = (original, replacement) => {
    const leading = original.match(/^\s*/)?.[0] ?? '';
    const trailing = original.match(/\s*$/)?.[0] ?? '';
    return `${leading}${replacement}${trailing}`;
  };

  const translateString = (
    original,
    exact,
    patterns,
    fragments,
    allowFragments = true,
  ) => {
    const key = normalize(original);
    if (exact.has(key)) return preserveEdgeWhitespace(original, exact.get(key));

    for (const pattern of patterns) {
      const match = pattern.regex.exec(key);
      if (!match) continue;
      const translated = pattern.target.replace(
        /⟦I18N_VAR_(\d+)⟧/g,
        (_marker, index) => match[Number(index) + 1] ?? '',
      );
      return preserveEdgeWhitespace(original, translated);
    }

    if (!allowFragments) return original;
    let result = original;
    for (const [source, target] of fragments) {
      if (result.includes(source)) result = result.split(source).join(target);
    }
    return result;
  };

  const translateAttribute = (element, attribute, exact) => {
    if (!element.hasAttribute(attribute)) return;
    const current = element.getAttribute(attribute);
    const translated = exact.get(normalize(current));
    if (translated) element.setAttribute(attribute, translated);
  };

  const translateDynamicValue = (element, exact, patterns) => {
    if (
      !(element instanceof HTMLTextAreaElement) ||
      !element.matches(dynamicValueRegions)
    )
      return;
    const original = element.value;
    if (!isKorean(original)) return;
    const translated = original
      .split(/(\r?\n)/)
      .map((line) =>
        /^\r?\n$/.test(line)
          ? line
          : translateString(line, exact, patterns, [], false),
      )
      .join('');
    if (translated !== original) element.value = translated;
  };

  const translateRegion = (root, exact, patterns, fragments) => {
    if (root instanceof Text) {
      const parent = root.parentElement;
      if (
        parent?.closest(runtimeRegions) &&
        !parent.closest(
          'pre,code,textarea,[contenteditable="true"],[data-i18n-private]',
        ) &&
        isKorean(root.nodeValue ?? '')
      ) {
        const translated = translateString(
          root.nodeValue ?? '',
          exact,
          patterns,
          fragments,
          !parent.closest(exactOnlyRegions),
        );
        if (translated !== root.nodeValue) root.nodeValue = translated;
      }
      return;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    for (const node of textNodes) {
      const parent = node.parentElement;
      if (
        !parent ||
        parent.closest(
          'pre,code,textarea,[contenteditable="true"],[data-i18n-private]',
        )
      )
        continue;
      if (!parent.closest(runtimeRegions)) continue;
      const current = node.nodeValue ?? '';
      if (!isKorean(current)) continue;
      const translated = translateString(
        current,
        exact,
        patterns,
        fragments,
        !parent.closest(exactOnlyRegions),
      );
      if (translated !== current) node.nodeValue = translated;
    }

    const elements = [];
    if (root instanceof Element) elements.push(root);
    elements.push(...root.querySelectorAll(runtimeRegions));
    for (const element of elements) {
      for (const attribute of ['aria-label', 'title', 'placeholder'])
        translateAttribute(element, attribute, exact);
      translateDynamicValue(element, exact, patterns);
    }
  };

  const catalogUrl =
    document
      .querySelector('script[data-i18n-catalog]')
      ?.getAttribute('data-i18n-catalog') ||
    new URL(import.meta.url).searchParams.get('catalog') ||
    `/i18n/${locale}.json`;
  fetch(catalogUrl, { credentials: 'same-origin' })
    .then((response) => {
      if (!response.ok) throw new Error(`i18n ${response.status}`);
      return response.json();
    })
    .then((catalog) => {
      const exact = new Map(Object.entries(catalog.strings ?? {}));
      const fragments = [...exact.entries()]
        .filter(([source]) => source.length > 1 && isKorean(source))
        .sort(([left], [right]) => right.length - left.length);
      const patterns = (catalog.patterns ?? []).map((item) => {
        const expression = item.source
          .split(/(⟦I18N_VAR_\d+⟧)/g)
          .map((part) =>
            /^⟦I18N_VAR_\d+⟧$/.test(part) ? '([\\s\\S]+?)' : escapeRegExp(part),
          )
          .join('');
        return {
          regex: new RegExp(`^${expression}$`),
          target: item.target,
        };
      });

      translateRegion(document.body, exact, patterns, fragments);
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          if (record.type === 'characterData') {
            const parent = record.target.parentElement;
            if (parent?.closest(runtimeRegions))
              translateRegion(parent, exact, patterns, fragments);
          } else if (record.type === 'childList') {
            for (const node of record.addedNodes)
              if (node instanceof Element || node instanceof Text)
                translateRegion(node, exact, patterns, fragments);
          } else if (record.type === 'attributes') {
            translateAttribute(record.target, record.attributeName, exact);
          }
        }
      });
      document.addEventListener('et:i18n-dynamic-value', (event) => {
        const target = event.target;
        if (target instanceof Element && target.matches(dynamicValueRegions))
          translateDynamicValue(target, exact, patterns);
      });
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['aria-label', 'title', 'placeholder'],
      });
      document.documentElement.dataset.i18nReady = locale;
      catalogReady = true;
      document.dispatchEvent(new Event('et:i18n-ready'));
    })
    .catch(() => {
      catalogFailed = true;
      document
        .querySelectorAll('[data-comparison-tool] [data-status]')
        .forEach((status) => {
          status.textContent = comparisonMessages.failed;
        });
    });
}
