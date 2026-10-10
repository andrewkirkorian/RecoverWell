import { useState } from 'react';

const emergencyWarningSigns = [
  { id: 'breathing', label: 'Severe difficulty breathing, choking, or blue/gray lips' },
  { id: 'chest-pain', label: 'New severe chest pain or pressure' },
  { id: 'stroke', label: 'Sudden face drooping, one-sided weakness, or trouble speaking' },
  { id: 'unresponsive', label: 'Unresponsive, a first seizure, a seizure lasting about 5 minutes or longer, or repeated seizures without recovery' },
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
  const [copyMessage, setCopyMessage] = useState('');
  const [copyFailed, setCopyFailed] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [exportFailed, setExportFailed] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setSummary('');
    setCopyMessage('');
    setExportMessage('');
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
    setCopyMessage('');
    const selectedWarningLabels = emergencyWarningSigns
      .filter((warningSign) => selectedWarningSigns.includes(warningSign.id))
      .map((warningSign) => warningSign.label);
    const lines = [
      'Visit preparation notes (personal use only)',
      `Symptoms: ${form.symptoms.trim() || 'Not provided'}`,
      `Started: ${form.onset.trim() || 'Not provided'}`,
      `Severity: ${form.severity || 'Not provided'}`,
      `Course: ${form.course || 'Not provided'}`,
      `Emergency warning signs selected: ${selectedWarningLabels.join('; ') || 'None selected'}`,
      `Questions to bring up: ${form.questions.trim() || 'Not provided'}`,
    ];

    setSummary(lines.join('\n'));
  };

  const copySummary = async () => {
    setCopyMessage('');
    setCopyFailed(false);
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard access is unavailable in this browser.');
      }
      await navigator.clipboard.writeText(summary);
      setCopyMessage('Draft copied. Review it before sharing.');
    } catch {
      setCopyFailed(true);
      setCopyMessage('Could not copy the draft. You can select and copy the text above manually.');
    }
  };

  const downloadSummary = () => {
    setExportMessage('');
    setExportFailed(false);
    let objectUrl;
    try {
      objectUrl = URL.createObjectURL(new Blob([summary], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = 'visit-preparation-notes.txt';
      link.click();
      setExportMessage('Draft downloaded. Review it before sharing.');
    } catch {
      setExportFailed(true);
      setExportMessage('Could not download the draft. You can select and copy the text above manually.');
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  };

  const printSummary = () => {
    setExportMessage('');
    setExportFailed(false);
    try {
      window.print();
    } catch {
      setExportFailed(true);
      setExportMessage('Could not open the print dialog. Try your browser’s print command instead.');
    }
  };

  const clearForm = () => {
    setForm(initialForm);
    setSelectedWarningSigns([]);
    setSummary('');
    setCopyMessage('');
    setCopyFailed(false);
    setExportMessage('');
    setExportFailed(false);
  };

  return (
    <section className="care-support-section" aria-labelledby="care-support-heading">
      <div className="section-heading">
        <p className="eyebrow">PATIENT TOOL</p>
        <h2 id="care-support-heading">Prepare for your next visit</h2>
        <p className="care-support-intro">
          Organize what you have noticed, what matters most to you, and the questions or reminders
          you want to keep with you. This tool does not diagnose symptoms, send information, or
          replace a clinical assessment.
        </p>
      </div>

      <div className="care-support-card">

        <div className="care-support-emergency-note" role="note">
          <strong>Think someone may be having an emergency?</strong>
          <span>
            Contact your local emergency number or go to the nearest emergency department now.
            For possible poisoning or overdose, contact emergency services or poison control
            promptly; do not induce vomiting or wait for symptoms. Do not wait to fill out this
            form. This warning-sign list is not complete.
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
            What would you like to remember or ask?
            <textarea
              id="care-questions"
              name="questions"
              value={form.questions}
              onChange={updateField}
              maxLength={1000}
              rows={2}
              placeholder="Add questions, concerns, or reminders you want to keep with you"
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
            <h3 id="care-support-summary-heading">Draft to review</h3>
            <pre>{summary}</pre>
            <p>Review and correct this summary before sharing it. Nothing is sent or saved by this page.</p>
            <div className="care-support-actions">
              <button className="care-support-submit" type="button" onClick={copySummary}>
                Copy draft
              </button>
              <button className="care-support-submit" type="button" onClick={downloadSummary}>
                Download draft
              </button>
              <button className="care-support-submit" type="button" onClick={printSummary}>
                Print draft
              </button>
            </div>
            {copyMessage && (
              <p role={copyFailed ? 'alert' : 'status'} aria-live={copyFailed ? 'assertive' : 'polite'}>
                {copyMessage}
              </p>
            )}
            {exportMessage && (
              <p role={exportFailed ? 'alert' : 'status'} aria-live={exportFailed ? 'assertive' : 'polite'}>
                {exportMessage}
              </p>
            )}
          </div>
        )}

        <p className="care-support-privacy">
          Only enter information you are comfortable sharing on this device. Entries stay in this
          page while it is open and are not sent to a clinician. Healthcare professionals should
          verify information and use their organization's approved documentation system.
        </p>
      </div>
    </section>
  );
}

export default CareSupport;
