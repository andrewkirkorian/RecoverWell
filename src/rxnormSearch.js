import { resolveIngredients } from './medicationFormulary';

const rxNormUrl = 'https://rxnav.nlm.nih.gov/REST/approximateTerm.json';
const openFdaUrl = 'https://api.fda.gov/drug/label.json';
const maxResults = 6;

function fromProductTypes(terms) {
  const otc = terms.includes('HUMAN OTC DRUG');
  const rx = terms.includes('HUMAN PRESCRIPTION DRUG');
  if (otc && rx) return 'Both';
  if (rx) return 'Prescription';
  if (otc) return 'Over the counter';
  return null;
}

async function fdaProductTypes(search, signal) {
  const params = new URLSearchParams({ search, count: 'openfda.product_type.exact' });
  const response = await fetch(`${openFdaUrl}?${params}`, { signal });
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`openFDA lookup failed (HTTP ${response.status})`);
  const data = await response.json();
  return (data.results ?? []).map((item) => item.term);
}

async function classify(rxcui, name, signal) {
  try {
    const byCode = fromProductTypes(await fdaProductTypes(`openfda.rxcui:"${rxcui}"`, signal));
    if (byCode) return { availability: byCode, basis: 'FDA drug labeling' };
    if (!/\d/.test(name)) {
      const safeName = name.replace(/"/g, '').toLowerCase();
      const byName = fromProductTypes(await fdaProductTypes(`openfda.generic_name:"${safeName}"`, signal));
      if (byName) return { availability: byName, basis: 'FDA drug labeling' };
    }
  } catch (error) {
    if (error.name === 'AbortError') throw error;
  }

  const local = resolveIngredients({ name });
  const kinds = new Set(local.map((entry) => entry.availability));
  if (kinds.size === 1) return { availability: [...kinds][0], basis: 'built-in reference list' };
  return { availability: 'Unknown', basis: '' };
}

export async function searchRxNorm(term, signal) {
  const params = new URLSearchParams({ term, maxEntries: '12' });
  const response = await fetch(`${rxNormUrl}?${params}`, { signal });
  if (!response.ok) throw new Error(`RxNorm search failed (HTTP ${response.status})`);
  const data = await response.json();

  const unique = new Map();
  (data.approximateGroup?.candidate ?? []).forEach((candidate) => {
    if (candidate.source === 'RXNORM' && candidate.name && !unique.has(candidate.rxcui)) {
      unique.set(candidate.rxcui, candidate.name);
    }
  });

  return Promise.all(
    [...unique].slice(0, maxResults).map(async ([rxcui, name]) => ({
      rxcui,
      name,
      ...(await classify(rxcui, name, signal)),
    })),
  );
}
