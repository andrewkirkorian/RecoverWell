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
          <h3>Sold both over the counter and by prescription</h3>
          <p>
            You can buy these medicines off the shelf (over the counter) or get them from a doctor
            (prescription). The two versions come in different strengths and doses. Pick the one
            you actually take.
          </p>
        </div>
      </div>
      <p className="reference-disclosure" role="note">
        For learning only. This is not medical advice. A doctor or pharmacist has not checked
        these doses, so do not use them to decide how much to take. They are typical adult
        directions from FDA-approved labels, put in simpler words. Follow the label on your
        package or the instructions from your doctor or pharmacist. Products are not all the same.
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
                  <h4>{form.label}</h4>
                  <dl>
                    <dt>Strengths</dt>
                    <dd>{info.strengths}</dd>
                    <dt>Usual adult directions</dt>
                    <dd>{info.directions}</dd>
                    <dt>Most you can take in a day</dt>
                    <dd>{info.maxDaily}</dd>
                    <dt>How long to use it, and warnings</dt>
                    <dd>{info.limits}</dd>
                  </dl>
                  <button
                    type="button"
                    className="catalog-add-button"
                    disabled={listed}
                    aria-label={
                      listed
                        ? `${entry.name} ${form.label} is on your list`
                        : `Add ${entry.name} ${form.label} version to your list`
                    }
                    onClick={() => onAdd(entry.id, form.availability)}
                  >
                    {listed ? 'On your list' : `Add ${form.label} version`}
                  </button>
                </section>
              );
            })}
          </div>
          <p className="dual-cautions"><strong>Be careful:</strong> {entry.cautions}</p>
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
