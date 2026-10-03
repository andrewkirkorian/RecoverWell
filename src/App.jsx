import { useState } from 'react';
import CareSupport from './CareSupport';
import Pharmacy from './Pharmacy';
import './App.css';

const initialTasks = [
  { id: 'meds', time: '8:00 AM', label: 'Morning medication', done: true },
  { id: 'water', time: '9:30 AM', label: 'Drink water', done: true },
  { id: 'walk', time: '11:00 AM', label: 'Walk to the window', done: false },
  { id: 'rest', time: '2:00 PM', label: 'Rest break', done: false },
];

const recoveryStages = [
  {
    phase: 'ICU / PACU',
    focus: 'Stabilization and monitoring',
    items: ['Continuous vital sign monitoring', 'Pain control and sedation management', 'Early breathing support and mobility'],
  },
  {
    phase: 'Hospital ward',
    focus: 'Mobility and daily recovery',
    items: ['Regular turning and walking', 'Wound checks and drain care', 'Hydration, nutrition, and medication rounds'],
  },
  {
    phase: 'Discharge',
    focus: 'Transition to home',
    items: ['Medication teaching and follow-up plan', 'Home safety setup and mobility goals', 'Symptoms to call the care team about'],
  },
  {
    phase: 'At home',
    focus: 'Ongoing healing',
    items: ['Short walks and activity progression', 'Sleep, hydration, and nutrition', 'Wound, swelling, and pain tracking'],
  },
];

const procedureOptions = [
  {
    name: 'General surgery',
    recovery: 'Focus on breathing exercises, early walking, diet progression, and wound monitoring.',
  },
  {
    name: 'Orthopedic surgery',
    recovery: 'Protect the joint, manage swelling, and follow physical therapy for safe movement.',
  },
  {
    name: 'Cardiac surgery',
    recovery: 'Gradual mobility, heart rhythm monitoring, breathing support, and careful medication adherence.',
  },
  {
    name: 'Neurosurgery',
    recovery: 'Track alertness, head pain, nausea, and follow all neuro checks and activity restrictions.',
  },
  {
    name: 'Abdominal surgery',
    recovery: 'Support digestion, rest, hydration, and avoid lifting until the team approves it.',
  },
  {
    name: 'Spine surgery',
    recovery: 'Use guarded movement, core care, and therapist-guided mobility to avoid strain.',
  },
];

const icuCareModel = [
  {
    title: 'Airway & breathing',
    detail: 'Monitor oxygenation, ventilation settings, and respiratory effort to support safe gas exchange.',
  },
  {
    title: 'Hemodynamics',
    detail: 'Track blood pressure, heart rate, perfusion, and fluid balance to maintain organ support.',
  },
  {
    title: 'Neurologic status',
    detail: 'Assess consciousness, pain, agitation, and neurologic changes to detect early complications.',
  },
  {
    title: 'Renal & metabolic',
    detail: 'Review urine output, electrolytes, kidney function, and acid-base status to guide treatment.',
  },
  {
    title: 'Infection control',
    detail: 'Use line care, surveillance cultures, and early evaluation when new signs of infection appear.',
  },
  {
    title: 'Mobility & rehab',
    detail: 'Progress safe movement, prevent deconditioning, and coordinate early physical therapy.',
  },
];

const serviceLineBundles = [
  {
    service: 'Neuro',
    procedures: ['Craniotomy', 'Spine surgery', 'Cerebral aneurysm repair'],
    operativeNote: 'Craniotomy with dural closure and hemostasis',
    bundle: ['Neuro checks every 1-2 hours', 'Head-of-bed elevation 30°', 'Seizure precautions and sedation review'],
    risk: 'Watch for new deficits, worsening headache, or pupillary change.',
  },
  {
    service: 'Cardiac',
    procedures: ['CABG', 'Valve repair', 'Heart failure surgery'],
    operativeNote: 'CABG with saphenous harvest',
    bundle: ['Continuous telemetry and rhythm review', 'Hemodynamic monitoring and chest tube assessment', 'Early mobilization with strict activity limits'],
    risk: 'Escalate chest pain, arrhythmia, or low output symptoms promptly.',
  },
  {
    service: 'General surgery',
    procedures: ['Abdominal surgery', 'Bariatric surgery', 'GI resections'],
    operativeNote: 'Laparoscopic colectomy with lysis of adhesions',
    bundle: ['Pain control and pulmonary toilet', 'Drain and wound surveillance', 'Diet progression and bowel function checks'],
    risk: 'Monitor for fever, distension, leakage, or uncontrolled pain.',
  },
  {
    service: 'Orthopedic',
    procedures: ['Hip arthroplasty', 'Knee replacement', 'Spine fusion'],
    operativeNote: 'Total knee arthroplasty with tourniquet use',
    bundle: ['DVT prevention and mobility goals', 'Joint protection and physical therapy', 'Swelling and neurovascular checks'],
    risk: 'Red flags include calf pain, acute swelling, or sudden loss of movement.',
  },
];

function App() {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedService, setSelectedService] = useState('Neuro');
  const [selectedProcedure, setSelectedProcedure] = useState(serviceLineBundles[0].procedures[0]);
  const [patientAge, setPatientAge] = useState('58');
  const [patientComorbidities, setPatientComorbidities] = useState('Hypertension');
  const [mobilityStatus, setMobilityStatus] = useState('Independent with assistance');

  const completedCount = tasks.filter((task) => task.done).length;
  const percent = Math.round((completedCount / tasks.length) * 100);

  const selectedBundle =
    serviceLineBundles.find((bundle) => bundle.service === selectedService) ?? serviceLineBundles[0];

  const handleServiceChange = (event) => {
    const nextService = event.target.value;
    const nextBundle = serviceLineBundles.find((bundle) => bundle.service === nextService) ?? serviceLineBundles[0];
    setSelectedService(nextService);
    setSelectedProcedure(nextBundle.procedures[0]);
  };

  const comorbidityList = patientComorbidities
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const ageValue = Number(patientAge) || 0;
  let riskScore = 0;

  if (ageValue >= 70) riskScore += 2;
  else if (ageValue >= 60) riskScore += 1;

  if (comorbidityList.length >= 3) riskScore += 2;
  else if (comorbidityList.length >= 2) riskScore += 1;

  if (selectedService === 'Cardiac' || selectedService === 'Neuro') riskScore += 1;

  if (mobilityStatus.toLowerCase().includes('limited')) riskScore += 1;

  const patientRisk = riskScore >= 4 ? 'High' : riskScore >= 2 ? 'Moderate' : 'Low';

  const dischargeReadiness =
    patientRisk === 'High'
      ? {
          label: 'Step-down monitored transfer',
          detail: 'Requires extended cardiac monitoring and slower mobility progression.',
        }
      : patientRisk === 'Moderate'
        ? {
            label: 'Progressive discharge planning',
            detail: 'Continue close monitoring and increase mobility only as tolerated.',
          }
        : {
            label: 'Ready for floor transfer',
            detail: 'Continue standard recovery monitoring with routine reassessment.',
          };

  const personalizedWarning =
    patientRisk === 'High'
      ? 'This patient carries elevated risk and needs more frequent reassessment with a slower transition to ambulation.'
      : patientRisk === 'Moderate'
        ? 'This patient needs close monitoring and individualized mobility goals during ICU recovery.'
        : 'This patient can progress through standard ICU recovery goals with usual surveillance.';

  const toggleTask = (taskId) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      ),
    );
  };

  return (
    <div className="recovery-app">
      <header className="topbar">
        <div className="brand-wrap">
          <span className="brand-badge">RW</span>
          <div>
            <p className="eyebrow">RECOVERY APP</p>
            <h1>Recover Well</h1>
          </div>
        </div>
        <span className="header-pill">Day 4 after surgery</span>
      </header>

      <main className="page-content">
        <section className="hero-card">
          <div>
            <p className="eyebrow">WELCOME BACK</p>
            <h2>Recovery is a progression from ICU to home.</h2>
            <p>
              Each step matters: close monitoring in the ICU, guided mobility on the floor,
              and steady routines at home as healing continues.
            </p>
          </div>
          <div className="hero-badge">
            <span>Follow-up</span>
            <strong>May 14</strong>
          </div>
        </section>

        <section className="summary-grid">
          <article className="summary-card" aria-label="Recovery progress overview">
            <p className="eyebrow">TODAY'S PROGRESS</p>
            <h3>{percent}% complete</h3>
            <div className="mini-progress">
              <span style={{ width: `${percent}%` }} />
            </div>
          </article>

          <article className="summary-card">
            <p className="eyebrow">COMMON GOALS</p>
            <h3>Mobility, hydration, rest</h3>
            <p>Recovery is driven by safe movement, symptom monitoring, and medication adherence.</p>
          </article>

          <article className="summary-card warning-card">
            <p className="eyebrow">CALL CARE</p>
            <h3>Fever, severe pain, or swelling</h3>
            <p>Urgent symptoms should be reported to the medical team right away.</p>
          </article>
        </section>

        <section className="icu-model-section">
          <div className="section-heading">
            <p className="eyebrow">ICU CARE BASE MODEL</p>
            <h3>Core domains of critical care support</h3>
          </div>

          <div className="icu-model-grid">
            {icuCareModel.map((domain) => (
              <article key={domain.title} className="icu-model-card">
                <h4>{domain.title}</h4>
                <p>{domain.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="service-bundle-section">
          <div className="section-heading">
            <p className="eyebrow">PATIENT-SPECIFIC ICU FOLLOW-UP</p>
            <h3>Operative-note guided personalization</h3>
          </div>

          <div className="patient-profile-card">
            <div className="patient-controls">
              <label htmlFor="operative-service">Operative service</label>
              <select
                id="operative-service"
                value={selectedService}
                onChange={handleServiceChange}
                aria-label="Operative service"
              >
                {serviceLineBundles.map((bundle) => (
                  <option key={bundle.service} value={bundle.service}>
                    {bundle.service}
                  </option>
                ))}
              </select>

              <label htmlFor="operative-procedure">Procedure</label>
              <select
                id="operative-procedure"
                value={selectedProcedure}
                onChange={(event) => setSelectedProcedure(event.target.value)}
                aria-label="Operative procedure"
              >
                {selectedBundle.procedures.map((procedure) => (
                  <option key={procedure} value={procedure}>
                    {procedure}
                  </option>
                ))}
              </select>
            </div>

            <div className="patient-summary">
              <p className="mini-label">MD operative note</p>
              <h4>
                {selectedService} operative note: {selectedProcedure}
              </h4>
              <p>{selectedBundle.operativeNote}</p>
            </div>

            <div className="service-body">
              <div>
                <p className="mini-label">Care adjustments</p>
                <ul>
                  {selectedBundle.bundle.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mini-label">Clinical warning</p>
                <p>{selectedBundle.risk}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="patient-profile-section">
          <div className="section-heading">
            <p className="eyebrow">PATIENT RISK PROFILE</p>
            <h3>{patientRisk} risk patient profile</h3>
          </div>

          <div className="patient-profile-grid">
            <div className="patient-form-card">
              <div className="field-row">
                <label htmlFor="patient-age">Patient age</label>
                <input
                  id="patient-age"
                  type="number"
                  min="18"
                  max="110"
                  value={patientAge}
                  onChange={(event) => setPatientAge(event.target.value)}
                />
              </div>

              <div className="field-row">
                <label htmlFor="patient-comorbidities">Comorbidities</label>
                <input
                  id="patient-comorbidities"
                  type="text"
                  value={patientComorbidities}
                  onChange={(event) => setPatientComorbidities(event.target.value)}
                />
              </div>

              <div className="field-row">
                <label htmlFor="patient-mobility">Mobility status</label>
                <select
                  id="patient-mobility"
                  value={mobilityStatus}
                  onChange={(event) => setMobilityStatus(event.target.value)}
                >
                  <option value="Independent with assistance">Independent with assistance</option>
                  <option value="Limited mobility">Limited mobility</option>
                  <option value="Bedbound">Bedbound</option>
                </select>
              </div>
            </div>

            <div className="patient-risk-card">
              <p className="mini-label">Risk assessment</p>
              <h4>Risk summary</h4>
              <p>{personalizedWarning}</p>

              <div className="readiness-box">
                <p className="mini-label">Discharge readiness</p>
                <strong>{dischargeReadiness.label}</strong>
                <p>{dischargeReadiness.detail}</p>
              </div>
            </div>
          </div>
        </section>

        <CareSupport />
        <Pharmacy comorbidities={patientComorbidities} />

        <section className="main-grid">
          <article className="plan-card">
            <div className="plan-header">
              <div>
                <p className="eyebrow">TODAY'S RECOVERY PLAN</p>
                <h3>Recovery checklist</h3>
              </div>
              <span>{completedCount}/{tasks.length} done</span>
            </div>

            <ul className="task-list">
              {tasks.map((task) => (
                <li key={task.id} className={task.done ? 'task-item done' : 'task-item'}>
                  <label>
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task.id)}
                      aria-label={`Mark ${task.label.toLowerCase()} complete`}
                    />
                    <span className="task-time">{task.time}</span>
                    <span className="task-name">{task.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </article>

          <aside className="care-panel">
            <p className="eyebrow">CARE TEAM</p>
            <h3>Dr. Nguyen</h3>
            <p>Daily goals include safe ambulation, pain monitoring, and wound review.</p>
          </aside>
        </section>

        <section className="timeline-section">
          <div className="section-heading">
            <p className="eyebrow">CONTINUUM OF CARE</p>
            <h3>From ICU care to at-home recovery</h3>
          </div>

          <div className="timeline-grid">
            {recoveryStages.map((stage) => (
              <article key={stage.phase} className="timeline-card">
                <span className="stage-badge">{stage.phase}</span>
                <h4>{stage.focus}</h4>
                <ul>
                  {stage.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="procedures-section">
          <div className="section-heading">
            <p className="eyebrow">COMMON SURGICAL TYPES</p>
            <h3>Procedure-specific recovery priorities</h3>
          </div>

          <div className="procedure-grid">
            {procedureOptions.map((procedure) => (
              <article key={procedure.name} className="procedure-card">
                <h4>{procedure.name}</h4>
                <p>{procedure.recovery}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
