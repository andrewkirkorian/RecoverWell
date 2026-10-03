import { useEffect, useState } from 'react';

const rxNormSearchUrl = 'https://rxnav.nlm.nih.gov/REST/approximateTerm.json';

const initialMedications = [
  {
    id: 'apixaban',
    name: 'Apixaban',
    detail: '5 mg · oral · twice daily',
    category: 'Prescription',
    purpose: 'Anticoagulant',
  },
  {
    id: 'ibuprofen',
    name: 'Ibuprofen',
    detail: '400 mg · oral · every 6 hours as needed',
    category: 'Over the counter',
    purpose: 'Pain and inflammation',
  },
  {
    id: 'lisinopril',
    name: 'Lisinopril',
    detail: '10 mg · oral · once daily',
    category: 'Prescription',
    purpose: 'Blood pressure',
  },
  {
    id: 'acetaminophen',
    name: 'Acetaminophen',
    detail: '650 mg · oral · every 6 hours as needed',
    category: 'Over the counter',
    purpose: 'Pain relief',
  },
];

function getRxNormSuggestions(payload) {
  const approximateGroup = payload?.approximateGroup;
  if (!approximateGroup || typeof approximateGroup !== 'object') {
    throw new Error('RxNorm returned an unexpected response. Please try again.');
  }

  const candidates = approximateGroup.candidate;
  if (candidates == null) return [];
  if (!Array.isArray(candidates)) {
    throw new Error('RxNorm returned an unexpected response. Please try again.');
  }

  const seenRxcuis = new Set();
  return candidates
    .filter((candidate) => candidate.source === 'RXNORM' && candidate.name && candidate.rxcui)
    .filter((candidate) => {
      if (seenRxcuis.has(candidate.rxcui)) return false;
      seenRxcuis.add(candidate.rxcui);
      return true;
    })
    .slice(0, 15)
    .map((candidate) => ({
      id: `rxnorm-${candidate.rxcui}`,
      rxcui: candidate.rxcui,
      name: candidate.name,
      category: 'RxNorm result',
      purpose: 'Confirm the exact medicine and formulation with a pharmacist.',
    }));
}

const interactionRules = [
  {
    medications: ['apixaban', 'ibuprofen'],
    sourceDrug: 'apixaban',
    level: 'High',
    title: 'Bleeding risk',
    description:
      'Ibuprofen may increase bleeding risk when taken with apixaban. Confirm this combination with the prescribing clinician or pharmacist.',
  },
  {
    medications: ['apixaban', 'aspirin'],
    sourceDrug: 'apixaban',
    level: 'High',
    title: 'Bleeding risk',
    description:
      'Aspirin may add to apixaban’s blood-thinning effect and increase bleeding risk. Confirm the combination with the care team.',
  },
  {
    medications: ['warfarin', 'ibuprofen'],
    sourceDrug: 'warfarin',
    level: 'High',
    title: 'Bleeding risk',
    description:
      'Ibuprofen can increase bleeding risk with warfarin. Ask the prescriber or pharmacist before using them together.',
  },
  {
    medications: ['warfarin', 'trimethoprim-sulfamethoxazole'],
    sourceDrug: 'warfarin',
    level: 'High',
    title: 'Warfarin effect may increase',
    description:
      'This antibiotic can raise warfarin effect and bleeding risk. Prompt prescriber review and INR monitoring may be needed.',
  },
  {
    medications: ['warfarin', 'fluconazole'],
    sourceDrug: 'warfarin',
    level: 'High',
    title: 'Warfarin effect may increase',
    description:
      'Fluconazole may raise warfarin effect and bleeding risk. Confirm with the care team; INR monitoring may be needed.',
  },
  {
    medications: ['lisinopril', 'ibuprofen'],
    sourceDrug: 'lisinopril',
    level: 'Moderate',
    title: 'Kidney function and blood pressure',
    description:
      'Ibuprofen can affect kidney function and blood pressure when combined with lisinopril. The risk may be higher with dehydration or kidney disease.',
  },
  {
    medications: ['lisinopril', 'potassium-chloride'],
    sourceDrug: 'lisinopril',
    level: 'Moderate',
    title: 'High potassium',
    description:
      'Lisinopril and potassium supplements together may raise blood potassium. Confirm the combination and any monitoring plan with the care team.',
  },
  {
    medications: ['lisinopril', 'spironolactone'],
    sourceDrug: 'lisinopril',
    level: 'High',
    title: 'High potassium',
    description:
      'Both medicines can raise blood potassium. The combination may be prescribed, but requires clinician review and appropriate monitoring.',
  },
  {
    medications: ['sertraline', 'tramadol'],
    sourceDrug: 'sertraline',
    level: 'High',
    title: 'Serotonin and seizure risks',
    description:
      'Taking tramadol with sertraline may increase the risk of serotonin syndrome and seizures. Contact the prescriber or pharmacist for review.',
  },
  {
    medications: ['sertraline', 'ibuprofen'],
    sourceDrug: 'sertraline',
    level: 'Moderate',
    title: 'Bleeding risk',
    description:
      'Combining an SSRI such as sertraline with an NSAID such as ibuprofen may increase bleeding risk.',
  },
  {
    medications: ['oxycodone', 'lorazepam'],
    sourceDrug: 'oxycodone',
    level: 'High',
    title: 'Excess sedation and breathing risk',
    description:
      'Combining an opioid with lorazepam can cause dangerous sedation and slowed breathing. Use together only under explicit prescriber direction.',
  },
  {
    medications: ['atorvastatin', 'clarithromycin'],
    sourceDrug: 'atorvastatin',
    level: 'High',
    title: 'Muscle injury risk',
    description:
      'Clarithromycin can raise atorvastatin levels and the risk of muscle injury. The prescriber may need to adjust treatment.',
  },
  {
    medications: ['levothyroxine', 'calcium-carbonate'],
    sourceDrug: 'levothyroxine',
    level: 'Moderate',
    title: 'Reduced thyroid medicine absorption',
    description:
      'Calcium can reduce levothyroxine absorption. Ask a pharmacist about dose timing and separation.',
  },
  {
    medications: ['nitroglycerin', 'sildenafil'],
    sourceDrug: 'nitroglycerin',
    level: 'High',
    title: 'Dangerously low blood pressure',
    description:
      'Nitrates such as nitroglycerin must not be combined with sildenafil because blood pressure can drop dangerously. Seek urgent clinical guidance.',
  },
];

function Pharmacy({ comorbidities }) {
  const [activeMedications, setActiveMedications] = useState(initialMedications);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogResults, setCatalogResults] = useState([]);
  const [catalogStatus, setCatalogStatus] = useState('idle');
  const [catalogError, setCatalogError] = useState('');

  useEffect(() => {
    const term = catalogSearch.trim();
    if (term.length < 2) {
      setCatalogResults([]);
      setCatalogStatus(term ? 'minimum' : 'idle');
      setCatalogError('');
      return undefined;
    }

    setCatalogResults([]);
    setCatalogStatus('loading');
    setCatalogError('');

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setCatalogStatus('loading');
      setCatalogError('');

      try {
        const url = new URL(rxNormSearchUrl);
        url.searchParams.set('term', term);
        url.searchParams.set('maxEntries', '30');
        url.searchParams.set('option', '1');

        const response = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) {
          throw new Error(`RxNorm search failed (HTTP ${response.status}). Please try again.`);
        }

        const results = getRxNormSuggestions(await response.json());
        if (!controller.signal.aborted) {
          setCatalogResults(results);
          setCatalogStatus('success');
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setCatalogError(
          error instanceof Error
            ? error.message
            : 'RxNorm search failed unexpectedly. Please try again.',
        );
        setCatalogStatus('error');
      }
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [catalogSearch]);

  const activeMedicationIds = new Set(activeMedications.map((medication) => medication.id));
  const interactions = interactionRules.filter((interaction) =>
    interaction.medications.every((id) => activeMedicationIds.has(id)),
  );
  const hasKidneyDisease = /\b(ckd|chronic kidney disease|kidney disease)\b/i.test(comorbidities);
  const contraindications = hasKidneyDisease && activeMedicationIds.has('ibuprofen')
    ? [
        {
          title: 'Kidney disease noted in patient profile',
          medication: 'Ibuprofen',
          description:
            'NSAIDs such as ibuprofen may worsen kidney function. Avoid use unless the patient’s clinician specifically approves it.',
        },
      ]
    : [];

  const visibleMedications = activeMedications.filter((medication) => {
    const matchesFilter = activeFilter === 'All' || medication.category === activeFilter;
    const matchesSearch = `${medication.name} ${medication.detail} ${medication.purpose}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const addMedication = (medication) => {
    setActiveMedications((current) =>
      current.some((item) => item.id === medication.id)
        ? current
        : [
            ...current,
              {
                ...medication,
                detail: 'Dose and schedule not provided · verify with patient',
              },
            ],
    );
  };

  const filters = ['All', 'Prescription', 'Over the counter'];

  return (
    <section className="pharmacy-section" aria-labelledby="pharmacy-heading">
      <div className="section-heading">
        <p className="eyebrow">MEDICATION RECONCILIATION</p>
        <h3 id="pharmacy-heading">Pharmacy</h3>
        <p className="pharmacy-intro">
          Review the patient’s reported medicines and check common medication safety concerns.
        </p>
      </div>

      <div className="pharmacy-card">
        <div className="pharmacy-notice" role="note">
          <strong>Sample medication list · verify medicines with the care team</strong>
          <span>
            Search terms are sent to the U.S. National Library of Medicine RxNorm API. Do not enter
            patient names or other identifying information. RxNorm search results identify terms;
            they do not confirm what a patient takes or provide interaction checking.
          </span>
        </div>

        <div className="pharmacy-summary" aria-label="Medication summary">
          <div>
            <strong>{activeMedications.length}</strong>
            <span>medicines on patient list</span>
          </div>
          <div>
            <strong>{interactions.length + contraindications.length}</strong>
            <span>items to review</span>
          </div>
          <div>
            <strong>{activeMedications.filter((medication) => medication.category === 'Prescription').length}</strong>
            <span>prescriptions on list</span>
          </div>
        </div>

        <div className="medication-list-header">
          <div>
            <h4>Patient medication list</h4>
            <p>Only medicines on this list are used for the interaction screen below.</p>
          </div>
          <label className="medication-search">
            <span className="visually-hidden">Search patient medicines</span>
            <input
              type="search"
              list="patient-medication-suggestions"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search patient list"
            />
          </label>
        </div>

        <div className="medication-filters" aria-label="Filter patient medicines">
          {[...filters, 'RxNorm result'].map((filter) => (
            <button
              key={filter}
              type="button"
              className={activeFilter === filter ? 'medication-filter selected' : 'medication-filter'}
              aria-pressed={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <ul className="medication-list" aria-label="Patient medication list">
          {visibleMedications.map((medication) => (
            <li className="medication-row" key={medication.id}>
              <span className="medication-mark" aria-hidden="true">
                {medication.category === 'Over the counter' ? 'OTC' : 'Rx'}
              </span>
              <div className="medication-info">
                <div className="medication-name-line">
                  <strong>{medication.name}</strong>
                  <span className="medication-status">On list</span>
                </div>
                <span>{medication.detail}</span>
                <small>{medication.purpose}</small>
              </div>
              <span className="medication-category">{medication.category}</span>
            </li>
          ))}
          {visibleMedications.length === 0 && (
            <li className="medication-empty">No medicines match this search.</li>
          )}
        </ul>

        <div className="medication-catalog">
          <div className="medication-list-header">
            <div>
              <h4>Browse medication catalog</h4>
              <p>Search active RxNorm concepts by generic, brand, or product name.</p>
            </div>
            <label className="medication-search">
              <span className="visually-hidden">Search medication catalog</span>
              <input
                type="search"
                list="rxnorm-medication-suggestions"
                value={catalogSearch}
                onChange={(event) => setCatalogSearch(event.target.value)}
                placeholder="Search catalog"
              />
            </label>
          </div>
          <p className="rxnorm-catalog-disclosure">
            Current RxNorm search results only; historical or discontinued drug coverage is not
            guaranteed. Results are not a complete global drug list.
          </p>
          <p className="rxnorm-attribution">
            This product uses publicly available data from the U.S. National Library of Medicine
            (NLM), National Institutes of Health, Department of Health and Human Services; NLM is
            not responsible for the product and does not endorse or recommend this or any other
            product.
          </p>
          <div className="catalog-search-status" role="status" aria-live="polite">
            {catalogStatus === 'idle' && 'Enter at least 2 characters to search RxNorm.'}
            {catalogStatus === 'minimum' && 'Enter at least 2 characters to search RxNorm.'}
            {catalogStatus === 'loading' && `Searching RxNorm for “${catalogSearch.trim()}”…`}
            {catalogStatus === 'success' &&
              `${catalogResults.length} RxNorm result${catalogResults.length === 1 ? '' : 's'} found.`}
          </div>
          {catalogError && <p className="catalog-search-error" role="alert">{catalogError}</p>}
          <ul className="medication-list catalog-list" aria-label="Medication catalog">
            {catalogResults.map((medication) => {
              const isOnList = activeMedicationIds.has(medication.id);
              return (
                <li className="medication-row" key={medication.id}>
                  <span className="medication-mark" aria-hidden="true">
                    Rx
                  </span>
                  <div className="medication-info">
                    <div className="medication-name-line">
                      <strong>{medication.name}</strong>
                      {isOnList && <span className="medication-status">Patient list</span>}
                    </div>
                    <span>{medication.purpose}</span>
                    <small>RxCUI {medication.rxcui} · RxNorm</small>
                  </div>
                  <button
                    className="catalog-add-button"
                    type="button"
                    disabled={isOnList}
                    onClick={() => addMedication(medication)}
                  >
                    {isOnList ? 'On patient list' : 'Mark patient-reported'}
                  </button>
                </li>
              );
            })}
            {catalogStatus === 'success' && catalogResults.length === 0 && (
              <li className="medication-empty">No active RxNorm matches found for this search.</li>
            )}
          </ul>
        </div>

        <datalist id="patient-medication-suggestions">
          {activeMedications.map((medication) => (
            <option key={medication.id} value={medication.name} />
          ))}
        </datalist>
        <datalist id="rxnorm-medication-suggestions">
          {catalogResults.map((medication) => (
            <option key={medication.id} value={medication.name} />
          ))}
        </datalist>

        <div className="safety-review">
          <div className="safety-review-heading">
            <div>
              <p className="mini-label">LIMITED INTERACTION SCREEN</p>
              <h4>Interactions &amp; contraindications</h4>
            </div>
            <span className="review-count">{interactions.length + contraindications.length} to review</span>
          </div>

          <p className="rxnorm-catalog-disclosure">
            These independently written prompts link to public DailyMed drug labeling. Label
            warnings are not a complete interaction database, and this sample checker does not
            evaluate every ingredient, product, dose, route, or patient factor. Adding an RxNorm
            result does not check it for interactions or contraindications. Ask a pharmacist or
            prescriber to review the complete medication list.
          </p>

          {contraindications.map((item) => (
            <article className="safety-alert contraindication-alert" key={item.title}>
              <span className="alert-level">Patient-specific</span>
              <div>
                <h5>{item.title}</h5>
                <p><strong>{item.medication}:</strong> {item.description}</p>
              </div>
            </article>
          ))}

          {interactions.map((interaction) => (
            <article
              className={`safety-alert ${interaction.level === 'High' ? 'high-alert' : 'moderate-alert'}`}
              key={`${interaction.title}-${interaction.medications.join('-')}`}
            >
              <span className="alert-level">{interaction.level} · interaction</span>
              <div>
                <h5>{interaction.title}</h5>
                <p>{interaction.description}</p>
                <a
                  className="interaction-source"
                  href={
                    interaction.sourceDrug === 'apixaban'
                      ? 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=41a133ef-e461-48ad-8221-b735bdd0ec25'
                      : `https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=${encodeURIComponent(interaction.sourceDrug)}`
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  DailyMed labeling: {interaction.sourceDrug}
                </a>
              </div>
            </article>
          ))}

          {interactions.length === 0 && contraindications.length === 0 && (
            <p className="no-safety-flags">
              No known flags from this limited screening list. This does not rule out other risks.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default Pharmacy;
