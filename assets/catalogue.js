/* Filter the complete static catalogue: no pagination or network dependency. */
(() => {
  'use strict';
  const grid = document.getElementById('catalogue-list');
  if (!grid) return;
  const search = document.getElementById('catalogue-search');
  const destination = document.getElementById('catalogue-destination');
  const category = document.getElementById('catalogue-category');
  const cards = [...grid.querySelectorAll('[data-category]')];
  const params = new URLSearchParams(location.search);
  for (const [key, el] of [['destination', destination], ['category', category]]) {
    if ([...el.options].some(option => option.value === params.get(key))) el.value = params.get(key);
  }
  search.value = params.get('q') || '';
  function render() {
    const q = search.value.trim().toLocaleLowerCase();
    let count = 0;
    for (const card of cards) {
      const matches = (!category.value || card.dataset.category === category.value)
        && (!destination.value || card.dataset.destination === destination.value)
        && (!q || card.dataset.search.includes(q));
      card.hidden = !matches;
      if (matches) count++;
    }
    document.getElementById('catalogue-count').textContent = `Showing ${count} of ${cards.length} tours`;
    document.getElementById('catalogue-empty').hidden = count !== 0;
    const next = new URLSearchParams();
    if (q) next.set('q', search.value.trim());
    if (destination.value) next.set('destination', destination.value);
    if (category.value) next.set('category', category.value);
    history.replaceState(null, '', location.pathname + (next.size ? '?' + next : '') + location.hash);
  }
  search.addEventListener('input', render);
  for (const el of [destination, category]) el.addEventListener('change', render);
  document.getElementById('catalogue-reset').addEventListener('click', () => {
    search.value = destination.value = category.value = '';
    render();
  });
  render();
})();
