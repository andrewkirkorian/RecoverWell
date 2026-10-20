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
    purpose: 'Blood thinner',
  },
  {
    id: 'ibuprofen',
    ingredientId: 'ibuprofen',
    name: 'Ibuprofen',
    detail: 'Oral',
    dose: '400 mg',
    frequency: 'Every 6 hours as needed',
    category: 'Over the counter',
    purpose: 'Pain and swelling',
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
            placeholder="For example, 5 mg"
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
            const message = error instanceof Error ? error.message : 'Medicine search failed';
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
      basis: 'our built-in list',
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
        <p className="eyebrow">YOUR MEDICINES</p>
        <h2 id="pharmacy-heading">Pharmacy</h2>
        <p className="pharmacy-intro">
          Keep a list of the medicines you take and see some common ones that may not mix well.
        </p>
      </div>

      <div className="pharmacy-card">
        <div className="pharmacy-notice" role="note">
          <strong>Sample medicine list · check your medicines with your care team</strong>
          <span>
            When you search for a medicine, the words you type are sent to two U.S. government
            medicine databases (the National Library of Medicine and the FDA). Do not type names or
            anything that could identify you. This tool cannot confirm what you take, and it does not
            take the place of talking to a pharmacist.
          </span>
        </div>

        <div className="pharmacy-summary" aria-label="Medication summary">
          <div>
            <strong>{activeMedications.length}</strong>
            <span>medicines on your list</span>
          </div>
          <div>
            <strong>{interactions.length + contraindications.length}</strong>
            <span>things to ask about</span>
          </div>
          <div>
            <strong>{activeMedications.filter((medication) => medication.category === 'Prescription').length}</strong>
            <span>prescription medicines</span>
          </div>
          <div>
            <strong>{activeMedications.filter((medication) => medication.category === 'Over the counter').length}</strong>
            <span>over-the-counter medicines</span>
          </div>
        </div>

        <div className="medication-list-header">
          <div>
            <h3>Your medicine list</h3>
            <p>Only medicines on this list are checked below to see if they may not mix well.</p>
          </div>
          <label className="medication-search">
            <span className="visually-hidden">Search your medicines</span>
            <input
              type="search"
              list="patient-medication-suggestions"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your list"
            />
          </label>
        </div>

        <div className="medication-filters" role="group" aria-label="Filter your medicines">
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

        <ul className="medication-list" aria-label="Your medicine list">
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
                          placeholder="For example, twice a day"
                          value={medication.frequency ?? ''}
                          onChange={(event) => updateRegimen(medication.id, 'frequency', event.target.value)}
                          aria-label={`How often for ${medication.name}`}
                        />
                      </label>
                      {!medication.dose?.trim() || !medication.frequency?.trim() ? (
                        <small className="regimen-missing">Dose or how often is not filled in yet. Check your medicine label.</small>
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
              <h3>Find a medicine to add</h3>
              <p>Search by the medicine name, the brand name, or what it is for.</p>
            </div>
            <label className="medication-search">
              <span className="visually-hidden">Search all medicines</span>
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
            Each result says if it needs a prescription or can be bought over the counter. Medicine
            names come from the National Library of Medicine, and the prescription label comes from
            the FDA. If the FDA cannot be reached, we use our built-in list. Medicines that are not
            on our built-in list are not checked for problems with other medicines.
          </p>
          <p className="medication-data-notice" role="note">
            What you type here is sent to the National Library of Medicine and the FDA. Do not type
            names, health conditions, or anything that could identify you.
          </p>
          <div className="catalog-search-status" role="status">
            {catalogTooShort
              ? 'Enter at least 2 characters to search.'
              : rxNormLoading
                ? 'Searching…'
                : results.length + (results.length === 1 ? ' match' : ' matches') + ' found.'}
          </div>
          {rxNormCurrent.error && (
            <p className="catalog-search-error" role="alert">
              The online medicine search is not working right now. Showing our built-in list only.
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
                              ? 'Not sure if it needs a prescription'
                              : result.availability}
                        </span>
                      </div>
                      {result.purpose && <span>{result.purpose}</span>}
                      <small>
                        {result.availability === 'Unknown'
                          ? 'We could not tell if this needs a prescription. Ask a pharmacist.'
                          : 'Based on ' + result.basis + '.'}
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
                            aria-label={listed ? base + ' is on your list' : 'Add ' + base + ' to your list'}
                            onClick={() => addResult(result, availability)}
                          >
                            {listed ? 'On your list' : label ? 'Add ' + label : 'Add to my list'}
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
            <p className="medication-empty">No matches found. Check the spelling or ask a pharmacist.</p>
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
              <p className="mini-label">BASIC SAFETY CHECK</p>
              <h3>Medicines that may not mix well</h3>
            </div>
            <span className="review-count">{interactions.length + contraindications.length} to ask about</span>
          </div>

          <p className="reference-disclosure">
            These warnings are written in our own words and link to the official drug labels on
            DailyMed. This check is basic. It does not catch every problem, and it does not look at
            every ingredient, dose, or health condition. Medicines that are not on our built-in list
            are not checked at all. Ask a pharmacist or your doctor to look over your full list.
          </p>

          {unscreened.length > 0 && (
            <p className="unscreened-note" role="note">
              Not checked (not on our built-in list): {unscreened.join(', ')}. Ask a pharmacist to
              check these.
            </p>
          )}

          {contraindications.map((item) => (
            <article className="safety-alert contraindication-alert" key={`${item.title}-${item.medication}`}>
              <span className="alert-level">Based on your health history</span>
              <div>
                <h4>{item.title}</h4>
                <p><strong>{item.medication}:</strong> {item.description}</p>
              </div>
            </article>
          ))}

          {interactions.map((interaction) => (
            <article
              className={`safety-alert ${interaction.level === 'High' ? 'high-alert' : 'moderate-alert'}`}
              key={interaction.key}
            >
              <span className="alert-level">{interaction.level === 'High' ? 'Serious' : 'Use caution'}</span>
              <div>
                <h4>{interaction.title}</h4>
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
                  Official drug label for {interaction.sourceDrug} on DailyMed (opens in new tab)
                </a>
              </div>
            </article>
          ))}

          {interactions.length === 0 && contraindications.length === 0 && (
            <p className="no-safety-flags">
              No problems found by this basic check. That does not mean your medicines are safe together. Ask a pharmacist or your doctor.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default Pharmacy;
