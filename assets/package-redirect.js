/* Preserve old package.html?id= links while canonical tour pages remain static. */
(() => {
  const detail = document.getElementById('package-detail');
  fetch('assets/packages.json').then(r => { if (!r.ok) throw Error(); return r.json(); }).then(data => {
    const p = data.find(p => p.id === new URLSearchParams(location.search).get('id') && p.published !== false);
    if (p) location.replace('tours/' + encodeURIComponent(p.slug) + '.html');
    else if (detail) detail.textContent = 'Package not found. Please browse All Packages from the navigation.';
  }).catch(() => {if (detail) detail.textContent = 'Unable to load this package. Please browse All Packages from the navigation.';});
})();
