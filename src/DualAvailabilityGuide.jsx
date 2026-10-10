import { dualAvailabilityMedications } from './dualAvailabilityMedications';

const forms = [
  { key: 'otc', label: 'Over the counter', availability: 'Over the counter' },
  { key: 'rx', label: 'Prescription', availability: 'Prescription' },
];

function DualAvailabilityGuide({ isListed, onAdd }) {
  return (
    <div className="dual-guide">
      <div className="medication-list-header">
        <div>
          <h4>Sold both over the counter and by prescription</h4>
          <p>
            The over-the-counter and prescription versions of these medicines have different
            strengths and dosing. Pick the version the patient actually uses.
          </p>
        </div>
      </div>
      <p className="reference-disclosure" role="note">
        Prototype educational content only—not medical advice. The dosing text has not been
        reviewed by a clinician or pharmacist. Do not use these figures to choose a dose. They
        paraphrase examples of typical adult directions from FDA-authorized labeling. Follow the
        exact Drug Facts label or the prescriber’s or pharmacist’s instructions; products and
        formulations differ.
      </p>
      {dualAvailabilityMedications.map((entry) => (
        <details className="dual-card" key={entry.id}>
          <summary>
            <strong>{entry.name}</strong>
            <span>{entry.purpose}</span>
          </summary>
          <div className="dual-compare">
            {forms.map((form) => {
              const info = entry[form.key];
              const listed = isListed(entry.id, form.availability);
              return (
                <section className="dual-column" key={form.key} aria-label={`${entry.name} ${form.label}`}>
                  <h5>{form.label}</h5>
                  <dl>
                    <dt>Strengths</dt>
                    <dd>{info.strengths}</dd>
                    <dt>Typical adult directions</dt>
                    <dd>{info.directions}</dd>
                    <dt>Daily limit</dt>
                    <dd>{info.maxDaily}</dd>
                    <dt>Duration and cautions</dt>
                    <dd>{info.limits}</dd>
                  </dl>
                  <button
                    type="button"
                    className="catalog-add-button"
                    disabled={listed}
                    aria-label={
                      listed
                        ? `${entry.name} ${form.label} is on the patient list`
                        : `Add ${entry.name} ${form.label} version as reported, unverified`
                    }
                    onClick={() => onAdd(entry.id, form.availability)}
                  >
                    {listed ? 'On patient list' : `Add ${form.label} version`}
                  </button>
                </section>
              );
            })}
          </div>
          <p className="dual-cautions"><strong>Cautions:</strong> {entry.cautions}</p>
          <p className="dual-sources">
            {entry.sources.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">
                {source.label} (opens in new tab)
              </a>
            ))}
          </p>
        </details>
      ))}
    </div>
  );
}

export default DualAvailabilityGuide;
