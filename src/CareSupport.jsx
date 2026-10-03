import { useState } from 'react';

const emergencyWarningSigns = [
  { id: 'breathing', label: 'Severe difficulty breathing, choking, or blue/gray lips' },
  { id: 'chest-pain', label: 'New severe chest pain or pressure' },
  { id: 'stroke', label: 'Sudden face drooping, one-sided weakness, or trouble speaking' },
  { id: 'unresponsive', label: 'Unresponsive, a first seizure, or repeated seizures without recovery' },
  { id: 'allergy', label: 'Severe allergic reaction with tongue/throat swelling or breathing difficulty' },
  { id: 'bleeding', label: 'Uncontrolled bleeding or a severe injury' },
  { id: 'safety', label: 'Immediate risk of suicide or harm to someone' },
];

const initialForm = {
  symptoms: '',
  onset: '',
  severity: '',
  course: '',
  questions: '',
};

function CareSupport() {
  const [form, setForm] = useState(initialForm);
  const [selectedWarningSigns, setSelectedWarningSigns] = useState([]);
  const [summary, setSummary] = useState('');

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setSummary('');
  };

  const toggleWarningSign = (warningSignId) => {
    setSelectedWarningSigns((current) =>
      current.includes(warningSignId)
        ? current.filter((id) => id !== warningSignId)
        : [...current, warningSignId],
    );
  };

  const createSummary = (event) => {
    event.preventDefault();
    const selectedWarningLabels = emergencyWarningSigns
      .filter((warningSign) => selectedWarningSigns.includes(warningSign.id))
      .map((warningSign) => warningSign.label);
    const lines = [
      'Patient-reported visit preparation summary (not a diagnosis)',
      `Symptoms: ${form.symptoms.trim() || 'Not provided'}`,
      `Started: ${form.onset.trim() || 'Not provided'}`,
      `Severity: ${form.severity || 'Not provided'}`,
      `Course: ${form.course || 'Not provided'}`,
      `Emergency warning signs selected: ${selectedWarningLabels.join('; ') || 'None selected'}`,
      `Questions for the care team: ${form.questions.trim() || 'Not provided'}`,
    ];
    setSummary(lines.join('\n'));
  };

  const clearForm = () => {
    setForm(initialForm);
    setSelectedWarningSigns([]);
    setSummary('');
  };

  return (
    <section className="care-support-section" aria-labelledby="care-support-heading">
      <div className="section-heading">
        <p className="eyebrow">PATIENT &amp; CAREGIVER TOOLS</p>
        <h3 id="care-support-heading">Prepare for a care conversation</h3>
        <p className="care-support-intro">
          Organize what you have noticed and questions for your care team. This tool does not
          diagnose symptoms or send information to anyone.
        </p>
      </div>

      <div className="care-support-card">
        <div className="care-support-emergency-note" role="note">
          <strong>Think someone may be having an emergency?</strong>
          <span>
            Contact your local emergency number or go to the nearest emergency department now.
            Do not wait to fill out this form. This warning-sign list is not complete.
          </span>
        </div>

        <form className="care-support-form" onSubmit={createSummary}>
          <div className="care-support-fields">
            <label className="care-support-field" htmlFor="care-symptoms">
              What symptoms or changes have you noticed?
              <textarea
                id="care-symptoms"
                name="symptoms"
                value={form.symptoms}
                onChange={updateField}
                maxLength={1000}
                rows={3}
                placeholder="Describe what you noticed in your own words"
              />
            </label>

            <label className="care-support-field" htmlFor="care-onset">
              When did they start?
              <input
                id="care-onset"
                name="onset"
                value={form.onset}
                onChange={updateField}
                maxLength={200}
                placeholder="For example, this morning"
              />
            </label>

            <label className="care-support-field" htmlFor="care-severity">
              How severe do they feel?
              <select id="care-severity" name="severity" value={form.severity} onChange={updateField}>
                <option value="">Choose if you know</option>
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
                <option value="Unsure">Unsure</option>
              </select>
            </label>

            <label className="care-support-field" htmlFor="care-course">
              How have they changed?
              <select id="care-course" name="course" value={form.course} onChange={updateField}>
                <option value="">Choose if you know</option>
                <option value="Getting better">Getting better</option>
                <option value="About the same">About the same</option>
                <option value="Getting worse">Getting worse</option>
                <option value="Changing or unsure">Changing or unsure</option>
              </select>
            </label>
          </div>

          <fieldset className="care-warning-signs">
            <legend>Is any of this happening right now?</legend>
            <p>If yes, contact your local emergency number now rather than waiting for a reply.</p>
            <div className="care-warning-sign-list">
              {emergencyWarningSigns.map((warningSign) => (
                <label key={warningSign.id}>
                  <input
                    type="checkbox"
                    checked={selectedWarningSigns.includes(warningSign.id)}
                    onChange={() => toggleWarningSign(warningSign.id)}
                  />
                  <span>{warningSign.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {selectedWarningSigns.length > 0 && (
            <div className="care-support-urgent-alert" role="alert" aria-live="assertive">
              One or more emergency warning signs were selected. Contact your local emergency
              number now or go to the nearest emergency department. Do not wait for this tool.
            </div>
          )}

          <label className="care-support-field" htmlFor="care-questions">
            What would you like to ask the care team?
            <textarea
              id="care-questions"
              name="questions"
              value={form.questions}
              onChange={updateField}
              maxLength={1000}
              rows={2}
              placeholder="Add questions or concerns you want to remember"
            />
          </label>

          <div className="care-support-actions">
            <button className="care-support-submit" type="submit">
              Create visit summary
            </button>
            <button className="care-support-clear" type="button" onClick={clearForm}>
              Clear entries
            </button>
          </div>
        </form>

        {summary && (
          <div
            className="care-support-summary"
            role="region"
            aria-labelledby="care-support-summary-heading"
            aria-live="polite"
          >
            <h4 id="care-support-summary-heading">Draft to review with your care team</h4>
            <pre>{summary}</pre>
            <p>Review and correct this summary before sharing it. Nothing is sent or saved by this page.</p>
          </div>
        )}

        <p className="care-support-privacy">
          Only enter information you are comfortable sharing on this device. Entries stay in this
          page while it is open and are not sent to a clinician.
        </p>
      </div>
    </section>
  );
}

export default CareSupport;
