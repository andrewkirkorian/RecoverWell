import { useEffect, useState } from 'react';
import DualAvailabilityGuide from './DualAvailabilityGuide';
import { dualAvailabilityById } from './dualAvailabilityMedications';
import { availabilityOrder, formulary, searchFormulary } from './medicationFormulary';
import { strengthOptions } from './medicationStrengths';
import { screenMedications } from './medicationInteractions';
import { searchRxNorm } from './rxnormSearch';

const initialMedications = [
  {
    id: 'apixaban',
    name: 'Apixaban',
    detail: 'Oral',
    dose: '5 mg',
    frequency: 'Twice daily',
    category: 'Prescription',
    purpose: 'Anticoagulant',
  },
  {
    id: 'ibuprofen',
    ingredientId: 'ibuprofen',
    name: 'Ibuprofen',
    detail: 'Oral',
    dose: '400 mg',
    frequency: 'Every 6 hours as needed',
    category: 'Over the counter',
    purpose: 'Pain and inflammation',
  },
  {
    id: 'lisinopril',
    name: 'Lisinopril',
    detail: 'Oral',
    dose: '10 mg',
    frequency: 'Once daily',
    category: 'Prescription',
    purpose: 'Blood pressure',
  },
  {
    id: 'acetaminophen',
    name: 'Acetaminophen',
    detail: 'Oral',
    dose: '650 mg',
    frequency: 'Every 6 hours as needed',
    category: 'Over the counter',
    purpose: 'Pain relief',
  },
];

const otherDose = '__other__';

function DoseField({ medication, onChange }) {
  const options = strengthOptions(medication);
  const dose = medication.dose ?? '';
  const [otherMode, setOtherMode] = useState(false);
  const isOther = options.length === 0 || otherMode || (dose !== '' && !options.includes(dose));

  return (
    <>
      {options.length > 0 && (
        <label>
          <span>Dose</span>
          <select
            value={isOther ? otherDose : dose}
            aria-label={`Dose for ${medication.name}`}
            onChange={(event) => {
              if (event.target.value === otherDose) {
                setOtherMode(true);
                onChange('');
              } else {
                setOtherMode(false);
                onChange(event.target.value);
              }
            }}
          >
            <option value="">Select a dose</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            <option value={otherDose}>Other (type it in)</option>
          </select>
        </label>
      )}
      {isOther && (
        <label>
          <span>{options.length > 0 ? 'Other dose' : 'Dose'}</span>
          <input
            type="text"
            maxLength={60}
            placeholder="e.g. 5 mg"
            value={dose}
            onChange={(event) => onChange(event.target.value)}
            aria-label={options.length > 0 ? `Other dose for ${medication.name}` : `Dose for ${medication.name}`}
          />
        </label>
      )}
    </>
  );
}

function Pharmacy({ comorbidities = '', medications, onMedicationsChange }) {
  const [localMedications, setLocalMedications] = useState(initialMedications);
  const isControlled = Boolean(medications && onMedicationsChange);
  const activeMedications = isControlled ? medications : localMedications;
  const updateMedications = isControlled ? onMedicationsChange : setLocalMedications;
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');

  const catalogTerm = catalogSearch.trim();
  const catalogTooShort = catalogTerm.length < 2;
  const localMatches = searchFormulary(catalogTerm);
  const [rxNorm, setRxNorm] = useState({ term: '', items: [], error: '' });
  const rxNormLoading = !catalogTooShort && rxNorm.term !== catalogTerm;
  const rxNormCurrent = rxNorm.term === catalogTerm ? rxNorm : { items: [], error: '' };

  useEffect(() => {
    if (catalogTooShort) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchRxNorm(catalogTerm, controller.signal)
        .then((items) => setRxNorm({ term: catalogTerm, items, error: '' }))
        .catch((error) => {
          if (error.name !== 'AbortError') {
            const message = error instanceof Error ? error.message : 'Medication search failed';
            setRxNorm({ term: catalogTerm, items: [], error: message });
          }
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [catalogTerm, catalogTooShort]);

  const localNames = new Set(localMatches.map((entry) => entry.name.toLowerCase()));
  const results = [
    ...localMatches.map((entry) => ({
      key: entry.id,
      name: entry.name,
      purpose: entry.purpose,
      availability: entry.availability,
      basis: 'built-in reference list',
      local: true,
    })),
    ...rxNormCurrent.items
      .filter((item) => !localNames.has(item.name.toLowerCase()))
      .map((item) => ({
        key: 'rxnorm-' + item.rxcui,
        name: item.name,
        purpose: '',
        availability: item.availability,
        basis: item.basis,
        local: false,
      })),
  ];

  const { interactions, contraindications, unscreened } = screenMedications(
    activeMedications,
    comorbidities,
  );
  const visibleMedications = activeMedications.filter((medication) => {
    const matchesFilter = activeFilter === 'All' || medication.category === activeFilter;
    const matchesSearch = `${medication.name} ${medication.detail} ${medication.dose ?? ''} ${medication.frequency ?? ''} ${medication.purpose}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const isListed = (ingredientId, availability) =>
    activeMedications.some(
      (medication) =>
        (medication.ingredientId ?? medication.id) === ingredientId &&
        medication.category === availability,
    );

  const isCatalogListed = (key, availability) =>
    activeMedications.some(
      (medication) =>
        (medication.catalogKey ?? medication.ingredientId ?? medication.id) === key &&
        medication.category === availability,
    );

  const updateRegimen = (id, field, value) =>
    updateMedications((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );

  const addResult = (result, availability) => {
    const both = result.availability === 'Both';
    const suffix = availability === 'Prescription' ? 'rx' : 'otc';
    const id = both ? result.key + '-' + suffix : result.key;
    const dual = result.local ? dualAvailabilityById.get(result.key) : null;
    const strengths = dual ? (availability === 'Prescription' ? dual.rx : dual.otc).strengths : '';
    updateMedications((current) =>
      current.some((item) => item.id === id)
        ? current
        : [
            ...current,
            {
              id,
              ...(result.local ? { ingredientId: result.key } : { catalogKey: result.key }),
              name: result.name,
              category: availability,
              purpose: result.purpose,
              detail: strengths ? 'Available strengths: ' + strengths : '',
              dose: '',
              frequency: '',
            },
          ],
    );
  };

  const addMedication = (ingredientId, availability) => {
    const entry = formulary.find((item) => item.id === ingredientId);
    if (!entry) return;
    addResult(
      {
        key: ingredientId,
        name: entry.name,
        purpose: entry.purpose,
        availability: entry.availability,
        local: true,
      },
      entry.availability === 'Both' ? availability : entry.availability,
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
            Medicine searches are sent to the U.S. National Library of Medicine (RxNorm) and the FDA
            (openFDA) to find and classify drugs. Do not enter patient names or other identifying
            information. This tool does not confirm what a patient takes or replace
            a pharmacist’s review.
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
          <div>
            <strong>{activeMedications.filter((medication) => medication.category === 'Over the counter').length}</strong>
            <span>over-the-counter on list</span>
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

        <div className="medication-filters" role="group" aria-label="Filter patient medicines">
          {filters.map((filter) => (
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
          {availabilityOrder.map((group) => {
            const items = visibleMedications.filter((medication) => medication.category === group);
            if (items.length === 0) return null;
            return [
              <li className="medication-group" key={`group-${group}`}>
                {group} · {items.length}
              </li>,
              ...items.map((medication) => (
                <li className="medication-row" key={medication.id}>
                  <span className="medication-mark" aria-hidden="true">
                    {medication.category === 'Over the counter' ? 'OTC' : 'Rx'}
                  </span>
                  <div className="medication-info">
                    <div className="medication-name-line">
                      <strong>{medication.name}</strong>
                      <span className="medication-status">On list</span>
                    </div>
                    {medication.detail && <span>{medication.detail}</span>}
                    <small>{medication.purpose}</small>
                    <div className="regimen-fields">
                      <DoseField
                        medication={medication}
                        onChange={(value) => updateRegimen(medication.id, 'dose', value)}
                      />
                      <label>
                        <span>How often</span>
                        <input
                          type="text"
                          maxLength={80}
                          placeholder="e.g. twice daily"
                          value={medication.frequency ?? ''}
                          onChange={(event) => updateRegimen(medication.id, 'frequency', event.target.value)}
                          aria-label={`How often for ${medication.name}`}
                        />
                      </label>
                      {!medication.dose?.trim() || !medication.frequency?.trim() ? (
                        <small className="regimen-missing">Dose or schedule not entered; verify with the patient.</small>
                      ) : null}
                    </div>
                  </div>
                  <span className="medication-category">{medication.category}</span>
                </li>
              )),
            ];
          })}
          {visibleMedications.length === 0 && (
            <li className="medication-empty">
              {activeMedications.length === 0
                ? 'No medicines have been added to this profile.'
                : 'No medicines match this search.'}
            </li>
          )}
        </ul>

        <div className="medication-catalog">
          <div className="medication-list-header">
            <div>
              <h4>Find a medicine to add</h4>
              <p>Search by generic name, brand name, or purpose.</p>
            </div>
            <label className="medication-search">
              <span className="visually-hidden">Search medication reference</span>
              <input
                type="search"
                list="medication-reference-suggestions"
                value={catalogSearch}
                onChange={(event) => setCatalogSearch(event.target.value)}
                placeholder="Search medicines"
              />
            </label>
          </div>
          <p className="reference-disclosure">
            Each result is marked Prescription or Over the counter. RxNorm supplies drug names and
            FDA drug labeling supplies the marking; the built-in list is used if FDA data is not
            available. Medicines the built-in list cannot match are not screened for interactions.
          </p>
          <p className="medication-data-notice" role="note">
            Search text is sent to the U.S. National Library of Medicine RxNorm API and the U.S.
            Food and Drug Administration openFDA API. Do not enter names, diagnoses, or other
            identifying information.
          </p>
          <div className="catalog-search-status" role="status">
            {catalogTooShort
              ? 'Enter at least 2 characters to search.'
              : rxNormLoading
                ? 'Searching RxNorm and FDA labeling…'
                : results.length + (results.length === 1 ? ' match' : ' matches') + ' found.'}
          </div>
          {rxNormCurrent.error && (
            <p className="catalog-search-error" role="alert">
              {rxNormCurrent.error}. Showing the built-in list only.
            </p>
          )}
          {results.length > 0 && (
            <ul className="medication-list catalog-list" aria-label="Medication search results">
              {results.map((result) => {
                const options =
                  result.availability === 'Both'
                    ? ['Over the counter', 'Prescription']
                    : result.availability === 'Unknown'
                      ? []
                      : [result.availability];
                return (
                  <li className="medication-row" key={result.key}>
                    <span className="medication-mark" aria-hidden="true">
                      {{ 'Over the counter': 'OTC', Prescription: 'Rx', Both: 'Both' }[result.availability] ?? '?'}
                    </span>
                    <div className="medication-info">
                      <div className="medication-name-line">
                        <strong>{result.name}</strong>
                        <span className="medication-status">
                          {result.availability === 'Both'
                            ? 'Over the counter and prescription versions'
                            : result.availability === 'Unknown'
                              ? 'Prescription status not confirmed'
                              : result.availability}
                        </span>
                      </div>
                      {result.purpose && <span>{result.purpose}</span>}
                      <small>
                        {result.availability === 'Unknown'
                          ? 'Could not be confirmed as prescription or over the counter. Ask a pharmacist.'
                          : 'Marked using ' + result.basis + '.'}
                      </small>
                    </div>
                    <div className="catalog-actions">
                      {options.map((availability) => {
                        const listed = isCatalogListed(result.key, availability);
                        const label = result.availability === 'Both' ? availability + ' version' : '';
                        const base = (result.name + ' ' + label).trim();
                        return (
                          <button
                            key={availability}
                            className="catalog-add-button"
                            type="button"
                            disabled={listed}
                            aria-label={listed ? base + ' is on the patient list' : 'Add ' + base + ' as reported, unverified'}
                            onClick={() => addResult(result, availability)}
                          >
                            {listed ? 'On patient list' : label ? 'Add ' + label : 'Add as reported'}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {!catalogTooShort && !rxNormLoading && results.length === 0 && (
            <p className="medication-empty">No matches found. Ask a pharmacist.</p>
          )}
        </div>

        <DualAvailabilityGuide isListed={isListed} onAdd={addMedication} />

        <datalist id="patient-medication-suggestions">
          {activeMedications.map((medication) => (
            <option key={medication.id} value={medication.name} />
          ))}
        </datalist>
        <datalist id="medication-reference-suggestions">
          {results.map((medication) => (
            <option key={medication.key} value={medication.name} />
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

          <p className="reference-disclosure">
            These independently written prompts link to public DailyMed drug labeling. Label
            warnings are not a complete interaction database, and this sample checker does not
            evaluate every ingredient, product, dose, route, or patient factor. Medicines that
            cannot be matched to the built-in reference list are not screened. Ask a pharmacist or
            prescriber to review the complete medication list.
          </p>

          {unscreened.length > 0 && (
            <p className="unscreened-note" role="note">
              Not screened (not found in the built-in reference list): {unscreened.join(', ')}.
              Ask a pharmacist to check these.
            </p>
          )}

          {contraindications.map((item) => (
            <article className="safety-alert contraindication-alert" key={`${item.title}-${item.medication}`}>
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
              key={interaction.key}
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
                  rel="noopener noreferrer"
                >
                  DailyMed labeling: {interaction.sourceDrug} (opens in new tab)
                </a>
              </div>
            </article>
          ))}

          {interactions.length === 0 && contraindications.length === 0 && (
            <p className="no-safety-flags">
              No flags detected in this limited demo list. This is not evidence of safety; ask a pharmacist or prescriber.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default Pharmacy;
