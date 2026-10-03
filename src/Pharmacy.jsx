import { useState } from 'react';

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

const medicationCatalog = [
  { id: 'aspirin', name: 'Aspirin', category: 'Over the counter', drugClass: 'Pain & inflammation', purpose: 'Pain relief; antiplatelet' },
  { id: 'naproxen', name: 'Naproxen', category: 'Over the counter', drugClass: 'Pain & inflammation', purpose: 'Pain and inflammation' },
  { id: 'celecoxib', name: 'Celecoxib', category: 'Prescription', drugClass: 'Pain & inflammation', purpose: 'Pain and inflammation' },
  { id: 'tramadol', name: 'Tramadol', category: 'Prescription', drugClass: 'Pain & inflammation', purpose: 'Prescription pain relief' },
  { id: 'oxycodone', name: 'Oxycodone', category: 'Prescription', drugClass: 'Pain & inflammation', purpose: 'Opioid pain relief' },
  { id: 'warfarin', name: 'Warfarin', category: 'Prescription', drugClass: 'Blood thinners', purpose: 'Anticoagulant' },
  { id: 'clopidogrel', name: 'Clopidogrel', category: 'Prescription', drugClass: 'Blood thinners', purpose: 'Antiplatelet' },
  { id: 'rivaroxaban', name: 'Rivaroxaban', category: 'Prescription', drugClass: 'Blood thinners', purpose: 'Anticoagulant' },
  { id: 'amlodipine', name: 'Amlodipine', category: 'Prescription', drugClass: 'Heart & blood pressure', purpose: 'Blood pressure' },
  { id: 'metoprolol', name: 'Metoprolol', category: 'Prescription', drugClass: 'Heart & blood pressure', purpose: 'Heart rate and blood pressure' },
  { id: 'spironolactone', name: 'Spironolactone', category: 'Prescription', drugClass: 'Heart & blood pressure', purpose: 'Diuretic; heart failure and blood pressure' },
  { id: 'nitroglycerin', name: 'Nitroglycerin', category: 'Prescription', drugClass: 'Heart & blood pressure', purpose: 'Angina' },
  { id: 'sildenafil', name: 'Sildenafil', category: 'Prescription', drugClass: 'Heart & blood pressure', purpose: 'Erectile dysfunction or pulmonary hypertension' },
  { id: 'atorvastatin', name: 'Atorvastatin', category: 'Prescription', drugClass: 'Cholesterol', purpose: 'Cholesterol management' },
  { id: 'rosuvastatin', name: 'Rosuvastatin', category: 'Prescription', drugClass: 'Cholesterol', purpose: 'Cholesterol management' },
  { id: 'metformin', name: 'Metformin', category: 'Prescription', drugClass: 'Diabetes', purpose: 'Blood glucose management' },
  { id: 'insulin-glargine', name: 'Insulin glargine', category: 'Prescription', drugClass: 'Diabetes', purpose: 'Long-acting insulin' },
  { id: 'insulin-lispro', name: 'Insulin lispro', category: 'Prescription', drugClass: 'Diabetes', purpose: 'Mealtime insulin' },
  { id: 'semaglutide', name: 'Semaglutide', category: 'Prescription', drugClass: 'Diabetes', purpose: 'Blood glucose management' },
  { id: 'sertraline', name: 'Sertraline', category: 'Prescription', drugClass: 'Mental health', purpose: 'Depression and anxiety' },
  { id: 'escitalopram', name: 'Escitalopram', category: 'Prescription', drugClass: 'Mental health', purpose: 'Depression and anxiety' },
  { id: 'lorazepam', name: 'Lorazepam', category: 'Prescription', drugClass: 'Mental health', purpose: 'Anxiety' },
  { id: 'albuterol', name: 'Albuterol', category: 'Prescription', drugClass: 'Respiratory', purpose: 'Rescue inhaler for wheezing' },
  { id: 'fluticasone', name: 'Fluticasone', category: 'Prescription', drugClass: 'Respiratory', purpose: 'Allergy or asthma control' },
  { id: 'omeprazole', name: 'Omeprazole', category: 'Over the counter', drugClass: 'Digestive health', purpose: 'Heartburn and acid reflux' },
  { id: 'famotidine', name: 'Famotidine', category: 'Over the counter', drugClass: 'Digestive health', purpose: 'Heartburn and acid reflux' },
  { id: 'levothyroxine', name: 'Levothyroxine', category: 'Prescription', drugClass: 'Hormones', purpose: 'Thyroid hormone replacement' },
  { id: 'prednisone', name: 'Prednisone', category: 'Prescription', drugClass: 'Hormones', purpose: 'Inflammation and immune conditions' },
  { id: 'amoxicillin', name: 'Amoxicillin', category: 'Prescription', drugClass: 'Anti-infectives', purpose: 'Antibiotic' },
  { id: 'trimethoprim-sulfamethoxazole', name: 'Trimethoprim-sulfamethoxazole', category: 'Prescription', drugClass: 'Anti-infectives', purpose: 'Antibiotic' },
  { id: 'clarithromycin', name: 'Clarithromycin', category: 'Prescription', drugClass: 'Anti-infectives', purpose: 'Antibiotic' },
  { id: 'fluconazole', name: 'Fluconazole', category: 'Prescription', drugClass: 'Anti-infectives', purpose: 'Antifungal' },
  { id: 'calcium-carbonate', name: 'Calcium carbonate', category: 'Over the counter', drugClass: 'Vitamins & supplements', purpose: 'Calcium supplement; antacid' },
  { id: 'potassium-chloride', name: 'Potassium chloride', category: 'Prescription', drugClass: 'Vitamins & supplements', purpose: 'Potassium replacement' },
  { id: 'ferrous-sulfate', name: 'Ferrous sulfate', category: 'Over the counter', drugClass: 'Vitamins & supplements', purpose: 'Iron supplement' },
  { id: 'st-johns-wort', name: "St. John's wort", category: 'Over the counter', drugClass: 'Vitamins & supplements', purpose: 'Herbal supplement' },
];

const interactionRules = [
  {
    medications: ['apixaban', 'ibuprofen'],
    level: 'High',
    title: 'Bleeding risk',
    description:
      'Ibuprofen may increase bleeding risk when taken with apixaban. Confirm this combination with the prescribing clinician or pharmacist.',
  },
  {
    medications: ['apixaban', 'aspirin'],
    level: 'High',
    title: 'Bleeding risk',
    description:
      'Aspirin may add to apixaban’s blood-thinning effect and increase bleeding risk. Confirm the combination with the care team.',
  },
  {
    medications: ['warfarin', 'ibuprofen'],
    level: 'High',
    title: 'Bleeding risk',
    description:
      'Ibuprofen can increase bleeding risk with warfarin. Ask the prescriber or pharmacist before using them together.',
  },
  {
    medications: ['warfarin', 'trimethoprim-sulfamethoxazole'],
    level: 'High',
    title: 'Warfarin effect may increase',
    description:
      'This antibiotic can raise warfarin effect and bleeding risk. Prompt prescriber review and INR monitoring may be needed.',
  },
  {
    medications: ['warfarin', 'fluconazole'],
    level: 'High',
    title: 'Warfarin effect may increase',
    description:
      'Fluconazole may raise warfarin effect and bleeding risk. Confirm with the care team; INR monitoring may be needed.',
  },
  {
    medications: ['lisinopril', 'ibuprofen'],
    level: 'Moderate',
    title: 'Kidney function and blood pressure',
    description:
      'Ibuprofen can affect kidney function and blood pressure when combined with lisinopril. The risk may be higher with dehydration or kidney disease.',
  },
  {
    medications: ['lisinopril', 'potassium-chloride'],
    level: 'Moderate',
    title: 'High potassium',
    description:
      'Lisinopril and potassium supplements together may raise blood potassium. Confirm the combination and any monitoring plan with the care team.',
  },
  {
    medications: ['lisinopril', 'spironolactone'],
    level: 'High',
    title: 'High potassium',
    description:
      'Both medicines can raise blood potassium. The combination may be prescribed, but requires clinician review and appropriate monitoring.',
  },
  {
    medications: ['sertraline', 'tramadol'],
    level: 'High',
    title: 'Serotonin and seizure risks',
    description:
      'Taking tramadol with sertraline may increase the risk of serotonin syndrome and seizures. Contact the prescriber or pharmacist for review.',
  },
  {
    medications: ['sertraline', 'ibuprofen'],
    level: 'Moderate',
    title: 'Bleeding risk',
    description:
      'Combining an SSRI such as sertraline with an NSAID such as ibuprofen may increase bleeding risk.',
  },
  {
    medications: ['oxycodone', 'lorazepam'],
    level: 'High',
    title: 'Excess sedation and breathing risk',
    description:
      'Combining an opioid with lorazepam can cause dangerous sedation and slowed breathing. Use together only under explicit prescriber direction.',
  },
  {
    medications: ['atorvastatin', 'clarithromycin'],
    level: 'High',
    title: 'Muscle injury risk',
    description:
      'Clarithromycin can raise atorvastatin levels and the risk of muscle injury. The prescriber may need to adjust treatment.',
  },
  {
    medications: ['levothyroxine', 'calcium-carbonate'],
    level: 'Moderate',
    title: 'Reduced thyroid medicine absorption',
    description:
      'Calcium can reduce levothyroxine absorption. Ask a pharmacist about dose timing and separation.',
  },
  {
    medications: ['nitroglycerin', 'sildenafil'],
    level: 'High',
    title: 'Dangerously low blood pressure',
    description:
      'Nitrates such as nitroglycerin must not be combined with sildenafil because blood pressure can drop dangerously. Seek urgent clinical guidance.',
  },
  {
    medications: ['apixaban', 'st-johns-wort'],
    level: 'High',
    title: 'Reduced anticoagulant effect',
    description:
      "St. John's wort may reduce apixaban levels and make it less effective. Avoid starting this supplement without prescriber review.",
  },
];

function Pharmacy({ comorbidities }) {
  const [activeMedications, setActiveMedications] = useState(initialMedications);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogClass, setCatalogClass] = useState('All classes');
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

  const catalogClasses = [...new Set(medicationCatalog.map((medication) => medication.drugClass))];
  const visibleCatalog = medicationCatalog.filter((medication) => {
    const matchesClass = catalogClass === 'All classes' || medication.drugClass === catalogClass;
    const matchesSearch = `${medication.name} ${medication.purpose} ${medication.drugClass}`
      .toLowerCase()
      .includes(catalogSearch.trim().toLowerCase());
    return matchesClass && matchesSearch;
  });

  const addMedication = (medication) => {
    setActiveMedications((current) =>
      current.some((item) => item.id === medication.id)
        ? current
        : [
            ...current,
            { ...medication, detail: 'Dose and schedule per patient’s medication record' },
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
          <strong>Sample medication list and reference catalog</strong>
          <span>
            The list and interaction rules are illustrative, not comprehensive or patient-specific
            clinical guidance. Verify all medicines, doses, allergies, and interactions with a
            pharmacist or prescriber.
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
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search patient list"
            />
          </label>
        </div>

        <div className="medication-filters" aria-label="Filter patient medicines">
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
          {visibleMedications.map((medication) => (
            <li className="medication-row" key={medication.id}>
              <span className="medication-mark" aria-hidden="true">
                {medication.category === 'Prescription' ? 'Rx' : 'OTC'}
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
              <p>{medicationCatalog.length} common examples across major medication classes</p>
            </div>
            <label className="medication-search">
              <span className="visually-hidden">Search medication catalog</span>
              <input
                type="search"
                value={catalogSearch}
                onChange={(event) => setCatalogSearch(event.target.value)}
                placeholder="Search catalog"
              />
            </label>
          </div>
          <label className="catalog-class-filter">
            <span>Medication class</span>
            <select value={catalogClass} onChange={(event) => setCatalogClass(event.target.value)}>
              <option>All classes</option>
              {catalogClasses.map((drugClass) => (
                <option key={drugClass}>{drugClass}</option>
              ))}
            </select>
          </label>
          <ul className="medication-list catalog-list" aria-label="Medication catalog">
            {visibleCatalog.map((medication) => {
              const isOnList = activeMedicationIds.has(medication.id);
              return (
                <li className="medication-row" key={medication.id}>
                  <span className="medication-mark" aria-hidden="true">
                    {medication.category === 'Prescription' ? 'Rx' : 'OTC'}
                  </span>
                  <div className="medication-info">
                    <div className="medication-name-line">
                      <strong>{medication.name}</strong>
                      {isOnList && <span className="medication-status">On list</span>}
                    </div>
                    <span>{medication.purpose}</span>
                    <small>{medication.drugClass}</small>
                  </div>
                  <button
                    className="catalog-add-button"
                    type="button"
                    disabled={isOnList}
                    onClick={() => addMedication(medication)}
                  >
                    {isOnList ? 'Added' : 'Add to patient list'}
                  </button>
                </li>
              );
            })}
            {visibleCatalog.length === 0 && (
              <li className="medication-empty">No catalog medicines match this search.</li>
            )}
          </ul>
        </div>

        <div className="safety-review">
          <div className="safety-review-heading">
            <div>
              <p className="mini-label">LIMITED INTERACTION SCREEN</p>
              <h4>Interactions &amp; contraindications</h4>
            </div>
            <span className="review-count">{interactions.length + contraindications.length} to review</span>
          </div>

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
