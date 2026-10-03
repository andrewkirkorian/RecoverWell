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

const surgeryChecklists = {
  Craniotomy: [
    'Ask the surgical team which neurologic changes need urgent attention and who to contact.',
    'Confirm any head-care, activity, and follow-up instructions with the team.',
  ],
  'Spine surgery': [
    'Ask the team which movement, lifting, and wound-care instructions apply to your procedure.',
    'Confirm whether equipment or help at home is recommended by your care team.',
  ],
  'Cerebral aneurysm repair': [
    'Ask the team what symptoms after this procedure need urgent attention.',
    'Confirm your monitoring and follow-up plan before leaving the hospital.',
  ],
  CABG: [
    'Ask the team which activity and incision-care instructions apply after bypass surgery.',
    'Confirm the cardiac follow-up plan and whom to contact with recovery concerns.',
  ],
  'Valve repair': [
    'Ask the team what follow-up and monitoring are planned after valve repair.',
    'Confirm which activity and incision-care instructions apply to you.',
  ],
  'Heart failure surgery': [
    'Ask the team how recovery follow-up will be coordinated with your heart-care team.',
    'Confirm which symptoms or changes should prompt a call or urgent assessment.',
  ],
  'Abdominal surgery': [
    'Ask the team what eating, drinking, and activity guidance applies after your procedure.',
    'Confirm incision or drain care instructions and whom to contact with concerns.',
  ],
  'Bariatric surgery': [
    'Ask the team for your procedure-specific eating and drinking plan.',
    'Confirm nutrition follow-up and any support resources recommended by your care team.',
  ],
  'GI resections': [
    'Ask the team what bowel, diet, and activity changes to expect and report.',
    'Confirm incision or ostomy care instructions if they apply to your procedure.',
  ],
  'Hip arthroplasty': [
    'Ask your surgeon or physical therapist which movement and weight-bearing guidance applies.',
    'Confirm your mobility aid, home setup, and physical therapy plan with the care team.',
  ],
  'Knee replacement': [
    'Ask your surgeon or physical therapist which movement and weight-bearing guidance applies.',
    'Confirm your mobility aid, home setup, and physical therapy plan with the care team.',
  ],
  'Spine fusion': [
    'Ask the team which movement, lifting, and brace instructions apply to your fusion.',
    'Confirm whether equipment or help at home is recommended by your care team.',
  ],
};

function App() {
  const [activePage, setActivePage] = useState('home');
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedService, setSelectedService] = useState('Neuro');
  const [selectedProcedure, setSelectedProcedure] = useState(serviceLineBundles[0].procedures[0]);
  const [procedureDate, setProcedureDate] = useState('');
  const [procedureArrival, setProcedureArrival] = useState('');
  const [checklistState, setChecklistState] = useState({});
  const [messageTopic, setMessageTopic] = useState('Recovery question');
  const [messageText, setMessageText] = useState('');
  const [messageDraft, setMessageDraft] = useState('');
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

  const toggleChecklistItem = (item) => {
    setChecklistState((current) => ({
      ...current,
      [selectedProcedure]: {
        ...current[selectedProcedure],
        [item]: !current[selectedProcedure]?.[item],
      },
    }));
  };

  const createMessageDraft = (event) => {
    event.preventDefault();
    setMessageDraft(
      [
        `Subject: ${messageTopic}`,
        `Procedure: ${selectedProcedure}`,
        `Procedure date: ${procedureDate || 'Not provided'}`,
        '',
        messageText.trim(),
      ].join('\n'),
    );
  };

  const navigateTo = (page, event) => {
    setActivePage(page);
    event.currentTarget.closest('details')?.removeAttribute('open');
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

      <nav className="primary-nav" aria-label="Main navigation">
        <button
          className="home-nav-button"
          type="button"
          aria-current={activePage === 'home' ? 'page' : undefined}
          onClick={(event) => navigateTo('home', event)}
        >
          Home
        </button>
        <details className="nav-dropdown">
          <summary>My recovery</summary>
          <div className="nav-dropdown-menu">
            <button type="button" onClick={(event) => navigateTo('plan', event)}>
              Daily plan
            </button>
            <button type="button" onClick={(event) => navigateTo('medications', event)}>
              Medicines
            </button>
            <button type="button" onClick={(event) => navigateTo('care', event)}>
              Prepare for a care visit
            </button>
            <button type="button" onClick={(event) => navigateTo('message', event)}>
              Message the care team
            </button>
          </div>
        </details>
        <details className="nav-dropdown">
          <summary>Recovery information</summary>
          <div className="nav-dropdown-menu">
            <button type="button" onClick={(event) => navigateTo('guide', event)}>
              Procedure planning
            </button>
            <button type="button" onClick={(event) => navigateTo('journey', event)}>
              Recovery journey
            </button>
          </div>
        </details>
      </nav>

      <main className="page-content">
        <aside className="emergency-banner" role="note">
          <strong>Need urgent help?</strong>
          <span>
            If someone may be having an emergency, contact your local emergency number now. Do not
            wait for this website.
          </span>
        </aside>

        <section className="home-page" hidden={activePage !== 'home'}>
          <div className="hero-card">
            <div>
              <p className="eyebrow">WELCOME TO RECOVER WELL</p>
              <h2>Your recovery, in one place.</h2>
              <p>Choose a tool below, or use the menus to find your plan, medicines, and guides.</p>
            </div>
          </div>

          <section className="summary-grid" aria-label="Recovery overview">
            <article className="summary-card" aria-label="Recovery progress overview">
              <p className="eyebrow">TODAY'S PROGRESS</p>
              <h3>{percent}% complete</h3>
              <div
                className="mini-progress"
                role="progressbar"
                aria-label="Today's recovery plan"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={percent}
              >
                <span style={{ width: `${percent}%` }} />
              </div>
            </article>
            <article className="summary-card">
              <p className="eyebrow">QUICK REMINDER</p>
              <h3>Follow your care team's instructions</h3>
              <p>Use the tools here to organize questions and information for your care team.</p>
            </article>
          </section>

          <section className="home-shortcuts" aria-labelledby="home-shortcuts-heading">
            <div className="section-heading">
              <p className="eyebrow">GET STARTED</p>
              <h3 id="home-shortcuts-heading">What would you like to do?</h3>
            </div>
            <div className="shortcut-grid">
              <button type="button" onClick={(event) => navigateTo('plan', event)}>
                <strong>View today's plan</strong>
                <span>Check progress and see your recovery checklist.</span>
              </button>
              <button type="button" onClick={(event) => navigateTo('medications', event)}>
                <strong>Review medicines</strong>
                <span>Organize medicines and view limited interaction prompts.</span>
              </button>
              <button type="button" onClick={(event) => navigateTo('care', event)}>
                <strong>Prepare for a care visit</strong>
                <span>Collect symptoms and questions in a draft summary.</span>
              </button>
              <button type="button" onClick={(event) => navigateTo('message', event)}>
                <strong>Write to the care team</strong>
                <span>Prepare a message draft to review and send through your usual channel.</span>
              </button>
              <button type="button" onClick={(event) => navigateTo('guide', event)}>
                <strong>Plan for a procedure</strong>
                <span>Record procedure details and review a procedure-specific checklist.</span>
              </button>
              <button type="button" onClick={(event) => navigateTo('journey', event)}>
                <strong>Explore recovery information</strong>
                <span>Explore general recovery information and topics.</span>
              </button>
            </div>
          </section>
        </section>

        <div hidden={activePage !== 'guide'}>
        <section className="procedure-planner-section" aria-labelledby="procedure-planner-heading">
          <div className="section-heading">
            <p className="eyebrow">PROCEDURE PLANNING</p>
            <h3 id="procedure-planner-heading">Keep your procedure details together</h3>
            <p className="planner-disclaimer">
              This is a personal planning aid only. It does not book or confirm a procedure.
              Follow instructions directly from your surgical team.
            </p>
          </div>

          <div className="procedure-planner-card">
            <div className="planner-fields">
              <label htmlFor="procedure-date">
                Procedure date
                <input
                  id="procedure-date"
                  type="date"
                  value={procedureDate}
                  onChange={(event) => setProcedureDate(event.target.value)}
                />
              </label>
              <label htmlFor="procedure-arrival">
                Arrival time or clinic details (as provided)
                <input
                  id="procedure-arrival"
                  type="text"
                  maxLength={160}
                  placeholder="Optional"
                  value={procedureArrival}
                  onChange={(event) => setProcedureArrival(event.target.value)}
                />
              </label>
              <label htmlFor="operative-service">
                Surgical service
                <select
                  id="operative-service"
                  value={selectedService}
                  onChange={handleServiceChange}
                >
                  {serviceLineBundles.map((bundle) => (
                    <option key={bundle.service} value={bundle.service}>
                      {bundle.service}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor="operative-procedure">
                Procedure
                <select
                  id="operative-procedure"
                  value={selectedProcedure}
                  onChange={(event) => setSelectedProcedure(event.target.value)}
                >
                  {selectedBundle.procedures.map((procedure) => (
                    <option key={procedure} value={procedure}>
                      {procedure}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="planner-local-note">
              These details stay in this page while it is open. They are not sent to a clinic or
              saved as an appointment.
            </p>
          </div>

          <div className="surgery-checklist-card">
            <h4>Checklist for {selectedProcedure}</h4>
            <p>General prompts to discuss with your care team; they are not personalized medical instructions.</p>
            <ul className="surgery-checklist">
              {[
                'Confirm the procedure name, date, arrival time, and location with the surgical team.',
                'Ask your team which food, drink, and medication instructions apply to you. Do not change medicines unless your team tells you to.',
                'Make sure your team knows about your medicines, supplements, and allergies.',
                ...(surgeryChecklists[selectedProcedure] ?? []),
                'Ask what transportation, home support, and follow-up arrangements you should plan for.',
              ].map((item) => (
                <li key={item}>
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(checklistState[selectedProcedure]?.[item])}
                      onChange={() => toggleChecklistItem(item)}
                    />
                    <span>{item}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
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
        </div>

        <section className="tools-page" hidden={activePage !== 'care'} aria-label="Prepare for a care visit">
          <CareSupport />
        </section>
        <section className="tools-page" hidden={activePage !== 'message'} aria-labelledby="care-message-heading">
          <div className="care-message-section">
            <div className="section-heading">
              <p className="eyebrow">CARE TEAM COMMUNICATION</p>
              <h3 id="care-message-heading">Prepare a message for your care team</h3>
              <p className="message-notice">
                This page cannot send messages. For urgent or emergency concerns, call your care
                team or local emergency number instead of waiting for a reply.
              </p>
            </div>
            <form className="care-message-card" onSubmit={createMessageDraft}>
              <label className="care-message-field" htmlFor="message-topic">
                Topic
                <select
                  id="message-topic"
                  value={messageTopic}
                  onChange={(event) => {
                    setMessageTopic(event.target.value);
                    setMessageDraft('');
                  }}
                >
                  <option>Recovery question</option>
                  <option>Symptoms or change</option>
                  <option>Medication question</option>
                  <option>Appointment or follow-up</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="care-message-field" htmlFor="message-procedure">
                Procedure
                <input id="message-procedure" value={selectedProcedure} readOnly />
              </label>
              <label className="care-message-field message-body-field" htmlFor="message-body">
                What would you like your care team to know or answer?
                <textarea
                  id="message-body"
                  rows={6}
                  maxLength={2000}
                  value={messageText}
                  onChange={(event) => {
                    setMessageText(event.target.value);
                    setMessageDraft('');
                  }}
                  placeholder="Write your message in your own words"
                  required
                />
              </label>
              <button className="care-support-submit" type="submit">Create message draft</button>
              {messageDraft && (
                <div className="care-support-summary" role="region" aria-label="Message draft">
                  <h4>Draft only — not sent</h4>
                  <pre>{messageDraft}</pre>
                  <p>Review this draft, then copy it into the secure messaging channel provided by your care team.</p>
                </div>
              )}
              <p className="care-support-privacy">
                Avoid entering identifying details. Your draft stays in this page while it is open
                and is not sent or saved.
              </p>
            </form>
          </div>
        </section>
        <section className="tools-page" hidden={activePage !== 'medications'} aria-label="Medicines">
          <Pharmacy comorbidities={patientComorbidities} />
        </section>

        <section className="main-grid" hidden={activePage !== 'plan'}>
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

        <div hidden={activePage !== 'journey'}>
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
        </div>
      </main>
    </div>
  );
}

export default App;
