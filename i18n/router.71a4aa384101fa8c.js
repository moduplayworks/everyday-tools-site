const target = document.querySelector('meta[name="et-route-target"]')?.content;
if (target) {
  const supported = ['ko', 'en', 'ja'];
  const requested = [...(navigator.languages ?? []), navigator.language ?? ''];
  const locale =
    requested
      .map((language) => language.split('-')[0].toLowerCase())
      .find((language) => supported.includes(language)) ?? 'en';
  const base = document.documentElement.dataset.siteBase || '/';
  const destination = new URL(
    `${base}${locale}${target}`,
    window.location.origin,
  );
  destination.search = window.location.search;
  destination.hash = window.location.hash;
  window.location.replace(destination.href);
}
