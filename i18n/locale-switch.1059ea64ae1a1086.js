document.addEventListener('change', (event) => {
  const select = event.target;
  if (
    !(select instanceof HTMLSelectElement) ||
    !select.matches('[data-locale-switch]')
  )
    return;
  const destination = new URL(select.value, window.location.origin);
  destination.search = window.location.search;
  destination.hash = window.location.hash;
  window.location.assign(destination.href);
});
