import { useEffect, useRef, useState } from 'react';
import ErrorBoundary from './ErrorBoundary';
import CareSupport from './CareSupport';
import Pharmacy from './Pharmacy';
import SelfCare from './SelfCare';
import HealthReference from './HealthReference';
import './App.css';

const pageTitles = {
  home: 'Home',
  plan: 'Procedure planning',
  medications: 'Pharmacy',
  'health-history': 'Health history',
  care: 'Prepare for your visit',
  selfcare: 'Self-care toolkit',
  guide: 'Anesthesia and ICU guide',
  journey: 'Recovery journey',
  reference: 'Health reference',
};

const initialTasks = [
  { id: 'meds', time: '8:00 AM', label: 'Morning medication', done: false },
  { id: 'water', time: '9:30 AM', label: 'Drink water', done: false },
  { id: 'walk', time: '11:00 AM', label: 'Walk to the window', done: false },
  { id: 'rest', time: '2:00 PM', label: 'Rest break', done: false },
];

const healthHistoryGroups = [
  {
    category: 'Heart and circulation',
    conditions: [
      { id: 'hypertension', label: 'High blood pressure' },
      { id: 'heart-disease', label: 'Heart or coronary artery disease' },
      { id: 'heart-failure', label: 'Heart failure' },
      { id: 'arrhythmia', label: 'Heart rhythm condition' },
      { id: 'stroke-tia', label: 'Prior stroke or TIA' },
      { id: 'vascular-disease', label: 'Peripheral vascular disease' },
    ],
  },
  {
    category: 'Lungs and sleep',
    conditions: [
      { id: 'asthma', label: 'Asthma' },
      { id: 'copd', label: 'COPD or emphysema' },
      { id: 'sleep-apnea', label: 'Sleep apnea' },
    ],
  },
  {
    category: 'Endocrine and metabolic',
    conditions: [
      { id: 'diabetes-type-1', label: 'Type 1 diabetes' },
      { id: 'diabetes-type-2', label: 'Type 2 diabetes' },
      { id: 'obesity', label: 'Obesity' },
      { id: 'thyroid-disease', label: 'Thyroid condition' },
    ],
  },
  {
    category: 'Kidney, liver, and digestive',
    conditions: [
      { id: 'ckd', label: 'Chronic kidney disease (CKD)' },
      { id: 'liver-disease', label: 'Chronic liver disease' },
      { id: 'inflammatory-bowel-disease', label: 'Inflammatory bowel disease' },
    ],
  },
  {
    category: 'Brain and nervous system',
    conditions: [
      { id: 'seizure-disorder', label: 'Seizure disorder' },
      { id: 'cognitive-condition', label: 'Dementia or cognitive condition' },
      { id: 'parkinsons', label: "Parkinson's disease" },
    ],
  },
  {
    category: 'Blood, immune system, and cancer',
    conditions: [
      { id: 'anemia', label: 'Anemia' },
      { id: 'clotting-condition', label: 'Bleeding or clotting condition' },
      { id: 'autoimmune-condition', label: 'Autoimmune condition' },
      { id: 'immunocompromised', label: 'Immunocompromised' },
      { id: 'cancer', label: 'Cancer' },
    ],
  },
  {
    category: 'Mental health',
    conditions: [
      { id: 'depression', label: 'Depression' },
      { id: 'anxiety', label: 'Anxiety disorder' },
    ],
  },
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
  {
    name: 'Urologic surgery',
    recovery: 'Manage catheters, stay hydrated, watch urine color, and follow lifting limits.',
  },
  {
    name: 'Gynecologic surgery',
    recovery: 'Track bleeding and pain, walk gradually, and avoid heavy lifting until cleared.',
  },
  {
    name: 'Oncologic surgery',
    recovery: 'Protect wounds, support nutrition, and follow pathology and treatment follow-up.',
  },
  {
    name: 'Vascular surgery',
    recovery: 'Check limb color, warmth, and pulses, and follow walking and medicine plans closely.',
  },
];

const serviceLineBundles = [
  {
    service: 'Neuro',
    procedures: ['Craniotomy', 'Spine surgery', 'Cerebral aneurysm repair'],
    icuTopics: [
      'Ask what monitoring is planned after your procedure and which new changes your team wants you to report promptly.',
      'Ask the team to explain any equipment, checks, or activity limits that apply to your specific procedure.',
    ],
    recoveryTopics: [
      'Confirm which head, spine, wound, movement, and follow-up instructions apply to you.',
      'Ask whom to contact if you notice a new or worsening symptom after leaving care.',
    ],
  },
  {
    service: 'Cardiac',
    procedures: ['CABG', 'Valve repair', 'Heart failure surgery'],
    icuTopics: [
      'Ask the team to explain any heart monitors, breathing support, lines, or drains used in your care.',
      'Ask which changes or symptoms your team wants you to report promptly.',
    ],
    recoveryTopics: [
      'Confirm the activity, incision-care, and follow-up instructions for your procedure with your cardiac team.',
      'Ask whom to contact with new or worsening symptoms after discharge.',
    ],
  },
  {
    service: 'General surgery',
    procedures: ['Abdominal surgery', 'Bariatric surgery', 'GI resections'],
    icuTopics: [
      'Ask what comfort, breathing, eating or drinking, and wound or drain support applies to your care.',
      'Ask which changes your team wants you to report promptly.',
    ],
    recoveryTopics: [
      'Confirm your procedure-specific eating, drinking, bowel, wound, and activity instructions with the team.',
      'Ask whether any drain, ostomy, or nutrition teaching applies to you and where to get help.',
    ],
  },
  {
    service: 'Orthopedic',
    procedures: ['Hip arthroplasty', 'Knee replacement', 'Spine fusion'],
    icuTopics: [
      'Ask which comfort, circulation, and movement checks are part of your care and what they mean.',
      'Ask what help is available for moving safely while you are in the hospital.',
    ],
    recoveryTopics: [
      'Confirm your procedure-specific movement, weight-bearing, equipment, and therapy instructions.',
      'Ask what support or home arrangements may help and whom to contact with concerns.',
    ],
  },
  {
    service: 'Urology',
    procedures: ['Prostatectomy', 'Nephrectomy', 'Cystectomy', 'TURP', 'Ureteroscopy'],
    icuTopics: [
      'Ask whether a catheter, stent, or other equipment is part of your care and who can explain it.',
      'Ask what changes in urination, comfort, or symptoms you should report to your team.',
    ],
    recoveryTopics: [
      'Confirm any catheter, stent, hydration, wound, activity, or follow-up instructions directly with your team.',
      'Ask how and when to get help if you have a concern after leaving care.',
    ],
  },
  {
    service: 'Gynecology',
    procedures: ['Hysterectomy', 'Myomectomy', 'Oophorectomy', 'Laparoscopic endometriosis excision', 'Pelvic organ prolapse repair'],
    icuTopics: [
      'Ask how your team will support comfort and what bleeding or other changes they want you to report.',
      'Ask which checks, equipment, or activity guidance apply to your specific procedure.',
    ],
    recoveryTopics: [
      'Confirm your procedure-specific incision, bleeding, activity, and follow-up instructions.',
      'Ask whom to contact if symptoms change or you are unsure about an instruction.',
    ],
  },
  {
    service: 'Oncology',
    procedures: ['Mastectomy', 'Lumpectomy', 'Colon cancer resection', 'Lung lobectomy', 'Tumor debulking'],
    icuTopics: [
      'Ask what comfort, breathing, wound, or drain support applies to your procedure and care setting.',
      'Ask which changes your team wants you to report and how results or updates will be shared.',
    ],
    recoveryTopics: [
      'Confirm any wound, drain, nutrition, movement, or follow-up instructions with your team.',
      'Ask who will discuss results and coordinate any next steps, if applicable.',
    ],
  },
  {
    service: 'Vascular',
    procedures: ['Carotid endarterectomy', 'Aortic aneurysm repair', 'Peripheral artery bypass', 'Amputation', 'AV fistula creation'],
    icuTopics: [
      'Ask what circulation or incision checks are part of your care and what they mean.',
      'Ask which changes need prompt attention and how to reach your team.',
    ],
    recoveryTopics: [
      'Confirm your procedure-specific activity, wound, limb or access-site care, and follow-up instructions.',
      'Ask what changes should prompt a call or urgent assessment after leaving care.',
    ],
  },
];

const postoperativeRoutes = {
  Craniotomy: {
    route: 'icu',
    detail: 'ICU or another closely monitored unit may be planned, depending on the operation and local pathway.',
  },
  'Spine surgery': {
    route: 'floor',
    detail: 'A hospital ward is common; the approach, extent of surgery, and recovery can change the plan.',
  },
  'Cerebral aneurysm repair': {
    route: 'icu',
    detail: 'Close monitoring in an ICU or step-down unit may be planned, depending on the repair and the person’s condition.',
  },
  CABG: {
    route: 'icu',
    detail: 'A cardiac ICU stay for close monitoring is commonly planned after the operation, followed by a cardiac ward when appropriate.',
  },
  'Valve repair': {
    route: 'icu',
    detail: 'An ICU stay for close monitoring is commonly planned after open heart surgery, followed by a cardiac ward when appropriate.',
  },
  'Heart failure surgery': {
    route: 'icu',
    detail: 'An ICU stay is commonly planned for close monitoring after major heart surgery; the exact pathway depends on the operation.',
  },
  'Abdominal surgery': {
    route: 'variable',
    detail: 'The term covers many operations: some planned outpatient procedures go home, while more extensive operations commonly stay on a ward.',
  },
  'Bariatric surgery': {
    route: 'floor',
    detail: 'A hospital ward stay is commonly planned, though some programs use selected same-day pathways.',
  },
  'GI resections': {
    route: 'floor',
    detail: 'A hospital ward stay is commonly planned; ICU care may be considered for more complex operations or recovery needs.',
  },
  'Hip arthroplasty': {
    route: 'floor',
    detail: 'A ward stay or a planned same-day pathway may be used, depending on the person, procedure, and local program.',
  },
  'Knee replacement': {
    route: 'floor',
    detail: 'A ward stay or a planned same-day pathway may be used, depending on the person, procedure, and local program.',
  },
  'Spine fusion': {
    route: 'floor',
    detail: 'A hospital ward is common; a more extensive fusion or recovery needs may lead to closer monitoring.',
  },
  Prostatectomy: {
    route: 'floor',
    detail: 'A short ward stay is common, although the surgical approach and local pathway can allow earlier discharge.',
  },
  Nephrectomy: {
    route: 'floor',
    detail: 'A hospital ward stay is commonly planned; the approach and recovery can change the length or level of care.',
  },
  Cystectomy: {
    route: 'floor',
    detail: 'A hospital ward stay is commonly planned; more complex needs may call for closer monitoring.',
  },
  TURP: {
    route: 'floor',
    detail: 'A short ward stay or same-day discharge may be used, depending on the procedure and recovery.',
  },
  Ureteroscopy: {
    route: 'home',
    detail: 'Often planned as a same-day procedure, with discharge only after the care team’s criteria are met.',
  },
  Hysterectomy: {
    route: 'variable',
    detail: 'Some minimally invasive procedures use same-day discharge; other approaches or recovery needs involve a ward stay.',
  },
  Myomectomy: {
    route: 'variable',
    detail: 'The approach and extent vary; same-day discharge or a ward stay may be planned.',
  },
  Oophorectomy: {
    route: 'variable',
    detail: 'Same-day discharge may be planned for some minimally invasive procedures; other approaches may involve a ward stay.',
  },
  'Laparoscopic endometriosis excision': {
    route: 'variable',
    detail: 'Same-day discharge may be planned for some procedures; a longer or more extensive operation may involve a ward stay.',
  },
  'Pelvic organ prolapse repair': {
    route: 'variable',
    detail: 'Same-day discharge or a ward stay may be planned, depending on the repair and recovery.',
  },
  Mastectomy: {
    route: 'variable',
    detail: 'Some people go home the same day; others stay on a ward, depending on the operation, reconstruction, and recovery.',
  },
  Lumpectomy: {
    route: 'home',
    detail: 'Often planned as a same-day procedure, with discharge only after the care team’s criteria are met.',
  },
  'Colon cancer resection': {
    route: 'floor',
    detail: 'A hospital ward stay is commonly planned; ICU care may be considered for selected complex cases or recovery needs.',
  },
  'Lung lobectomy': {
    route: 'floor',
    detail: 'A hospital ward is common; closer monitoring may be planned depending on the operation and recovery.',
  },
  'Tumor debulking': {
    route: 'variable',
    detail: 'The operation can vary substantially; a ward stay is common, with ICU care considered for selected extensive procedures or recovery needs.',
  },
  'Carotid endarterectomy': {
    route: 'floor',
    detail: 'A monitored ward or step-down stay is common; some hospitals use ICU-level observation.',
  },
  'Aortic aneurysm repair': {
    route: 'variable',
    detail: 'Open and endovascular repairs have different pathways; a ward, step-down unit, or ICU may be planned.',
  },
  'Peripheral artery bypass': {
    route: 'floor',
    detail: 'A hospital ward is common; closer monitoring may be planned depending on the operation and recovery.',
  },
  Amputation: {
    route: 'floor',
    detail: 'A hospital ward stay is commonly planned for recovery and rehabilitation assessment; individual needs vary.',
  },
  'AV fistula creation': {
    route: 'home',
    detail: 'Often planned as a same-day procedure, with discharge only after the care team’s criteria are met.',
  },
};

const anesthesiaTypes = {
  unknown: {
    label: 'Not sure / not discussed',
    description: 'Anesthesia plans are specific to the procedure and person. Your anesthesiology team can explain what is planned and whether more than one type will be combined.',
    effects: 'It is okay not to know the planned type yet. Ask the anesthesia team what to expect and which instructions apply to you.',
  },
  general: {
    label: 'General anesthesia',
    description: 'Medicines make you unconscious and unable to feel the procedure. The anesthesia team monitors and supports breathing and circulation during anesthesia.',
    effects: 'You may feel sleepy, nauseated, chilled, or temporarily groggy afterward. A breathing device can leave a sore throat. Effects and recovery time vary.',
  },
  regional: {
    label: 'Regional anesthesia (spinal, epidural, or nerve block)',
    description: 'Medicine temporarily numbs a larger area, such as part of the body or a limb. You may be awake or receive sedation, and it can be combined with general anesthesia.',
    effects: 'Temporary numbness, heaviness, or weakness can occur while it wears off. The team will explain what to expect for your block and when to ask for help.',
  },
  local: {
    label: 'Local anesthesia',
    description: 'Medicine numbs a small, specific area. You are generally awake; local anesthesia may also be combined with sedation or another type.',
    effects: 'The area may remain numb for a while and sensation returns gradually. Ask what is expected for your procedure and when to protect the area.',
  },
  sedation: {
    label: 'Sedation / monitored anesthesia care (MAC)',
    description: 'Medicines help you relax or feel sleepy. The depth can vary; sedation is often combined with local or regional anesthesia, and monitoring is provided.',
    effects: 'Sleepiness, slowed coordination, or patchy memory can happen afterward. Ask whether you need an escort and what activities to avoid, and follow your team’s written instructions.',
  },
  combined: {
    label: 'Combined anesthesia',
    description: 'More than one approach may be used, such as general anesthesia with a nerve block or local anesthesia with sedation.',
    effects: 'What you feel afterward depends on the combination. Ask which effects to expect from each part and which recovery instructions apply.',
  },
};

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
  Prostatectomy: [
    'Ask how long the catheter stays in and how to care for it at home.',
    'Confirm pelvic floor exercise, lifting, and follow-up guidance with the team.',
  ],
  Nephrectomy: [
    'Ask which pain, activity, and hydration instructions apply with one kidney or a partial kidney.',
    'Confirm which medicines to avoid and when kidney function will be rechecked.',
  ],
  Cystectomy: [
    'Ask for teaching on urinary diversion or stoma care if it applies to your procedure.',
    'Confirm nutrition, supplies, and follow-up plans with the team.',
  ],
  TURP: [
    'Ask what to expect with blood in the urine and when to call.',
    'Confirm catheter, fluid, and activity instructions with the team.',
  ],
  Ureteroscopy: [
    'Ask whether a stent was placed and when it will be removed.',
    'Confirm which pain, urinary, and fever symptoms need urgent attention.',
  ],
  Hysterectomy: [
    'Ask which lifting, driving, and intimacy restrictions apply to your procedure.',
    'Confirm what vaginal bleeding or discharge is expected and when to call.',
  ],
  Myomectomy: [
    'Ask about activity limits, expected bleeding, and any future pregnancy planning guidance.',
    'Confirm follow-up timing and incision care instructions.',
  ],
  Oophorectomy: [
    'Ask how the procedure may affect hormones and what symptom support is available.',
    'Confirm incision care and follow-up plans with the team.',
  ],
  'Laparoscopic endometriosis excision': [
    'Ask what pain and shoulder discomfort are expected after laparoscopy.',
    'Confirm follow-up plans for symptom tracking and any pathology results.',
  ],
  'Pelvic organ prolapse repair': [
    'Ask about lifting, straining, and bowel care to protect the repair.',
    'Confirm bladder emptying checks and when to resume activity.',
  ],
  Mastectomy: [
    'Ask how to care for drains, the incision, and arm mobility exercises.',
    'Confirm lymphedema precautions, reconstruction plans, and pathology follow-up.',
  ],
  Lumpectomy: [
    'Ask about incision care, activity, and whether radiation or other treatment follows.',
    'Confirm when pathology results and follow-up visits are expected.',
  ],
  'Colon cancer resection': [
    'Ask about diet progression, bowel function, and incision or ostomy care.',
    'Confirm pathology follow-up and any planned additional treatment.',
  ],
  'Lung lobectomy': [
    'Ask about breathing exercises, chest tube care, and activity limits.',
    'Confirm which breathing or pain changes need urgent attention.',
  ],
  'Tumor debulking': [
    'Ask what recovery milestones and nutrition support to expect.',
    'Confirm how pathology results and next treatment steps will be shared with you.',
  ],
  'Carotid endarterectomy': [
    'Ask which stroke warning signs need emergency help and blood pressure targets to follow.',
    'Confirm neck incision care and antiplatelet medicine plans.',
  ],
  'Aortic aneurysm repair': [
    'Ask about activity and lifting limits, and long-term imaging follow-up.',
    'Confirm which abdominal, back, or leg symptoms need urgent attention.',
  ],
  'Peripheral artery bypass': [
    'Ask how to check your leg warmth, color, and pulses and when to call.',
    'Confirm walking, leg elevation, and medicine instructions with the team.',
  ],
  Amputation: [
    'Ask about residual limb care, positioning, and phantom pain management.',
    'Confirm rehabilitation, prosthetic timing, and emotional support options.',
  ],
  'AV fistula creation': [
    'Ask how to check for a thrill, and which arm precautions to follow.',
    'Confirm when the fistula can be used and what signs of clotting or infection to report.',
  ],
};

const healthHistoryLabels = Object.fromEntries(
  healthHistoryGroups.flatMap((group) => group.conditions.map(({ id, label }) => [id, label])),
);

function App() {
  const [profiles, setProfiles] = useState([]);
  const [nextProfileId, setNextProfileId] = useState(1);
  const [taskLabel, setTaskLabel] = useState('');
  const [taskTime, setTaskTime] = useState('');
  const [taskAnnouncement, setTaskAnnouncement] = useState('');
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [authMode, setAuthMode] = useState('signup');
  const [profileName, setProfileName] = useState('');
  const [loginProfileId, setLoginProfileId] = useState('');
  const [activePage, setActivePage] = useState('home');
  const taskListRef = useRef(null);
  const taskLabelInputRef = useRef(null);

  const activeProfile = profiles.find((profile) => profile.id === activeProfileId);
  const tasks = activeProfile?.tasks ?? initialTasks;
  const selectedService = activeProfile?.selectedService ?? 'Neuro';
  const selectedProcedure = activeProfile?.selectedProcedure ?? serviceLineBundles[0].procedures[0];
  const postoperativeRoute = postoperativeRoutes[selectedProcedure] ?? {
    route: 'variable',
    detail: 'The planned destination depends on the procedure, the person, and the local pathway.',
  };
  const selectedAnesthesiaType = activeProfile?.anesthesiaType ?? 'unknown';
  const anesthesiaInfo = anesthesiaTypes[selectedAnesthesiaType] ?? anesthesiaTypes.unknown;
  const procedureDate = activeProfile?.procedureDate ?? '';
  const procedureArrival = activeProfile?.procedureArrival ?? '';
  const checklistState = activeProfile?.procedureChecklistState ?? {};
  const completedCount = tasks.filter((task) => task.done).length;
  const percent = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  const selectedProcedureGroup =
    serviceLineBundles.find((bundle) => bundle.service === selectedService) ?? serviceLineBundles[0];

  const handleServiceChange = (event) => {
    const nextService = event.target.value;
    const nextBundle = serviceLineBundles.find((bundle) => bundle.service === nextService) ?? serviceLineBundles[0];
    updateActiveProfile('selectedService', nextService);
    updateActiveProfile('selectedProcedure', nextBundle.procedures[0]);
  };

  const updateActiveProfile = (key, update) => {
    setProfiles((currentProfiles) =>
      currentProfiles.map((profile) =>
        profile.id === activeProfileId
          ? {
              ...profile,
              [key]: typeof update === 'function' ? update(profile[key]) : update,
            }
          : profile,
      ),
    );
  };

  const createDemoProfile = (event) => {
    event.preventDefault();
    const name = profileName.trim();
    if (!name) return;
    const id = `demo-profile-${nextProfileId}`;
    const profile = {
      id,
      name,
      tasks: initialTasks.map((task) => ({ ...task })),
      checkIn: { pain: '', energy: '', sleep: '', mood: '', notes: '' },
      plannedHabits: { water: false, movement: false, medicine: false, rest: false },
      customHabits: [],
      checkInEntries: {},
      medications: [],
      selectedService: 'Neuro',
      selectedProcedure: serviceLineBundles[0].procedures[0],
      anesthesiaType: 'unknown',
      procedureDate: '',
      procedureArrival: '',
      procedureChecklistState: {},
      healthHistory: [],
      otherHealthHistory: '',
      healthHistoryUnknown: false,
    };
    setProfiles((currentProfiles) => [...currentProfiles, profile]);
    setNextProfileId((currentId) => currentId + 1);
    setActiveProfileId(id);
    setProfileName('');
    setActivePage('home');
  };

  const openDemoProfile = (event) => {
    event.preventDefault();
    if (!profiles.some((profile) => profile.id === loginProfileId)) return;
    setActiveProfileId(loginProfileId);
    setActivePage('home');
  };

  const toggleTask = (taskId) => {
    updateActiveProfile('tasks', (currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      ),
    );
  };

  const addTask = (event) => {
    event.preventDefault();
    const label = taskLabel.trim();
    if (!label) return;
    const time = taskTime.trim();
    updateActiveProfile('tasks', (currentTasks) => [
      ...currentTasks,
      {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        time,
        label,
        done: false,
      },
    ]);
    setTaskAnnouncement('Added reminder: ' + label + (time ? ', ' + time : '') + '.');
    setTaskLabel('');
    setTaskTime('');
  };

  const removeTask = (taskId) => {
    const taskIndex = tasks.findIndex((task) => task.id === taskId);
    const removedTask = tasks[taskIndex];
    updateActiveProfile('tasks', (currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId),
    );
    setTaskAnnouncement('Removed reminder: ' + removedTask.label + (removedTask.time ? ', ' + removedTask.time : '') + '.');
    requestAnimationFrame(() => {
      const removeButtons = taskListRef.current?.querySelectorAll('.task-remove-button') ?? [];
      (removeButtons[Math.min(taskIndex, removeButtons.length - 1)] ?? taskLabelInputRef.current)?.focus();
    });
  };

  const toggleChecklistItem = (item) => {
    updateActiveProfile('procedureChecklistState', (current) => ({
      ...current,
      [selectedProcedure]: {
        ...current[selectedProcedure],
        [item]: !current[selectedProcedure]?.[item],
      },
    }));
  };

  const toggleHealthHistory = (conditionId) => {
    updateActiveProfile('healthHistory', (currentConditions) =>
      currentConditions.includes(conditionId)
        ? currentConditions.filter((id) => id !== conditionId)
        : [...currentConditions, conditionId],
    );
  };

  useEffect(() => {
    if (!activeProfileId) {
      document.title = 'Recover Well';
      return;
    }
    document.title = `${pageTitles[activePage] ?? 'Recover Well'} – Recover Well`;
    document.documentElement.scrollTop = 0;
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [activePage, activeProfileId]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      const openMenu = [...document.querySelectorAll('.nav-dropdown[open]')]
        .find((menu) => menu.contains(event.target)) ?? document.querySelector('.nav-dropdown[open]');
      if (!openMenu) return;
      event.preventDefault();
      openMenu.removeAttribute('open');
      openMenu.querySelector('summary')?.focus();
    };
    const closeOnOutsideClick = (event) => {
      document.querySelectorAll('.nav-dropdown[open]').forEach((menu) => {
        if (!menu.contains(event.target)) menu.removeAttribute('open');
      });
    };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('click', closeOnOutsideClick);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('click', closeOnOutsideClick);
    };
  }, []);

  const navigateTo = (page, event) => {
    setActivePage(page);
    event.currentTarget.closest('details')?.removeAttribute('open');
  };

  if (!activeProfile) {
    const isSigningIn = authMode === 'signin';

    return (
      <main className="signup-page">
        <section className="signup-shell" aria-labelledby="signup-heading">
          <div className="signup-welcome">
            <div className="signup-brand">
              <span className="signup-brand-mark" aria-hidden="true">+</span>
              <span>Recover Well</span>
            </div>

            <div className="signup-welcome-copy">
              <p className="signup-eyebrow">A LITTLE MORE SUPPORT, EVERY DAY</p>
              <h1>Your recovery journey starts here.</h1>
              <p>
                Create a demo profile to keep your own checklist, notes, and medicine list separate
                from other profiles in this open page.
              </p>
            </div>

            <div className="signup-promise">
              <span className="signup-promise-icon" aria-hidden="true">✓</span>
              <p>
                <strong>Demo profiles only</strong>
                <span>No password, account, or secure sign-in is provided.</span>
              </p>
            </div>
            <span className="signup-decoration signup-decoration-one" aria-hidden="true" />
            <span className="signup-decoration signup-decoration-two" aria-hidden="true" />
          </div>

          <div className="signup-form-panel">
            <div className="signup-form-heading">
              <p className="signup-eyebrow">WELCOME TO RECOVER WELL</p>
              <h2 id="signup-heading">{isSigningIn ? 'Sign in to a demo profile' : 'Sign up for a demo profile'}</h2>
              <p>
                {isSigningIn
                  ? 'Choose a profile created during this open session.'
                  : 'Choose a display name. Avoid real names or other identifying details.'}
              </p>
            </div>

            {isSigningIn ? (
              <form className="signup-form signup-form-single" onSubmit={openDemoProfile}>
                {profiles.length > 0 ? (
                  <>
                    <label htmlFor="demo-profile-select">
                      Demo profile
                      <select
                        id="demo-profile-select"
                        value={loginProfileId}
                        onChange={(event) => setLoginProfileId(event.target.value)}
                        required
                      >
                        <option value="">Choose a profile</option>
                        {profiles.map((profile) => (
                          <option key={profile.id} value={profile.id}>{profile.name}</option>
                        ))}
                      </select>
                    </label>
                    <button className="signup-submit" type="submit">
                      Sign in <span aria-hidden="true">→</span>
                    </button>
                  </>
                ) : (
                  <p role="status">No demo profiles exist in this session yet. Create one to begin.</p>
                )}
              </form>
            ) : (
              <form className="signup-form signup-form-single" onSubmit={createDemoProfile}>
                <label htmlFor="demo-profile-name">
                  Display name
                  <input
                    id="demo-profile-name"
                    type="text"
                    autoComplete="off"
                    maxLength={48}
                    placeholder="For example, Alex"
                    value={profileName}
                    onChange={(event) => setProfileName(event.target.value)}
                    required
                  />
                </label>
                <button className="signup-submit" type="submit">
                  Create demo profile <span aria-hidden="true">→</span>
                </button>
              </form>
            )}

            <p className="signup-alternate">
              {isSigningIn ? 'Need a new demo profile?' : 'Already created one this session?'}{' '}
              <button
                type="button"
                onClick={() => setAuthMode(isSigningIn ? 'signup' : 'signin')}
              >
                {isSigningIn ? 'Create profile' : 'Sign in'}
              </button>
            </p>

            <p className="signup-privacy">
              Profiles and their checklist, self-care notes, and medicine list stay only in this
              browser tab’s memory. They are not protected accounts and disappear when the page is
              reloaded or closed. Do not enter real health or identifying information.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="recovery-app">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="topbar">
        <div className="brand-wrap">
          <span className="brand-badge" aria-hidden="true">RW</span>
          <div>
            <p className="eyebrow">RECOVERY APP</p>
            <h1>Recover Well</h1>
          </div>
        </div>
        <div className="profile-controls">
          <span className="header-pill">{activeProfile.name}'s profile</span>
          <button
            className="profile-switch-button"
            type="button"
            onClick={() => {
              setTaskLabel('');
              setTaskTime('');
              setLoginProfileId(activeProfile.id);
              setAuthMode('signin');
              setActiveProfileId(null);
            }}
          >
            Switch profile
          </button>
        </div>
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
        <button
          className="home-nav-button"
          type="button"
          aria-current={activePage === 'selfcare' ? 'page' : undefined}
          onClick={(event) => navigateTo('selfcare', event)}
        >
          Self-care
        </button>
        <button
          className="home-nav-button"
          type="button"
          aria-current={activePage === 'reference' ? 'page' : undefined}
          onClick={(event) => navigateTo('reference', event)}
        >
          Health reference
        </button>
        <details className="nav-dropdown">
          <summary
            className={['plan', 'medications', 'health-history', 'care'].includes(activePage) ? 'is-active' : undefined}
          >
            My recovery
          </summary>
          <div className="nav-dropdown-menu">
            <button
              type="button"
              aria-current={activePage === 'plan' ? 'page' : undefined}
              onClick={(event) => navigateTo('plan', event)}
            >
              Daily plan
            </button>
            <button
              type="button"
              aria-current={activePage === 'medications' ? 'page' : undefined}
              onClick={(event) => navigateTo('medications', event)}
            >
              Medicines
            </button>
            <button
              type="button"
              aria-current={activePage === 'health-history' ? 'page' : undefined}
              onClick={(event) => navigateTo('health-history', event)}
            >
              Health history
            </button>
            <button
              type="button"
              aria-current={activePage === 'care' ? 'page' : undefined}
              onClick={(event) => navigateTo('care', event)}
            >
              Prepare for your visit
            </button>
          </div>
        </details>
        <details className="nav-dropdown">
          <summary
            className={['guide', 'journey'].includes(activePage) ? 'is-active' : undefined}
          >
            Recovery information
          </summary>
          <div className="nav-dropdown-menu">
            <button
              type="button"
              aria-current={activePage === 'guide' ? 'page' : undefined}
              onClick={(event) => navigateTo('guide', event)}
            >
              Procedure planning
            </button>
            <button
              type="button"
              aria-current={activePage === 'journey' ? 'page' : undefined}
              onClick={(event) => navigateTo('journey', event)}
            >
              Recovery journey
            </button>
          </div>
        </details>
      </nav>

      <main className="page-content" id="main-content" tabIndex={-1}>
        <aside className="emergency-banner" role="note">
          <strong>Need urgent help?</strong>
          <span>
            If someone may be having an emergency, contact your local emergency number now. Do not
            wait for this website.
          </span>
        </aside>
        <aside className="prototype-disclaimer" role="note">
          <strong>Prototype only — not medical advice.</strong>
          <span>
            Recover Well does not diagnose, prescribe, or replace a licensed clinician or pharmacist.
            Verify medication names, doses, interactions, and recovery instructions with your care
            team. Do not enter identifying health information.
          </span>
        </aside>

        <section className="home-page" hidden={activePage !== 'home'}>
          <div className="hero-card">
            <div>
              <p className="eyebrow">WELCOME TO RECOVER WELL</p>
              <h2>{activeProfile.name}'s recovery, in one place.</h2>
              <p>
                Find general information, organize your questions, and choose what support would
                help you today.
              </p>
            </div>
          </div>

          <section className="summary-grid" aria-label="Recovery overview">
            <article className="summary-card" aria-label="Recovery progress overview">
              <p className="eyebrow">CHECKLIST PROGRESS</p>
              <h3>{percent}% complete</h3>
              <div
                className="mini-progress"
                role="progressbar"
                aria-label="Example checklist progress"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={percent}
              >
                <span style={{ width: `${percent}%` }} />
              </div>
            </article>
            <article className="summary-card">
              <p className="eyebrow">QUICK REMINDER</p>
              <h3>Follow your care team's guidance</h3>
              <p>Use these tools to organize questions and personal notes, not to make care decisions.</p>
            </article>
          </section>

          <section className="home-shortcuts" aria-labelledby="home-shortcuts-heading">
            <div className="section-heading">
              <p className="eyebrow">GET STARTED</p>
              <h3 id="home-shortcuts-heading">What would you like to do?</h3>
            </div>
            <div className="shortcut-grid">
              <button type="button" onClick={(event) => navigateTo('plan', event)}>
                <strong>View the example checklist</strong>
                <span>Use these sample reminders only if they are helpful to you.</span>
              </button>
              <button type="button" onClick={(event) => navigateTo('medications', event)}>
                <strong>Review medicines</strong>
                <span>Organize medicines and view limited interaction prompts.</span>
              </button>
              <button type="button" onClick={(event) => navigateTo('care', event)}>
                <strong>Prepare for your visit</strong>
                <span>Record symptoms, questions, and goals for your next check-in.</span>
              </button>
              <button type="button" onClick={(event) => navigateTo('selfcare', event)}>
                <strong>Open self-care toolkit</strong>
                <span>Track symptoms, energy, hydration, and daily recovery habits.</span>
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

        <section className="tools-page" hidden={activePage !== 'reference'}>
          <ErrorBoundary key={activeProfile.id} section="Health reference">
            <HealthReference />
          </ErrorBoundary>
        </section>

        <section className="tools-page" hidden={activePage !== 'selfcare'}>
          <ErrorBoundary key={activeProfile.id} section="Self-care toolkit">
            <SelfCare
              profileCheckIn={activeProfile.checkIn}
              onProfileCheckInChange={(update) => updateActiveProfile('checkIn', update)}
              profilePlannedHabits={activeProfile.plannedHabits}
              onProfilePlannedHabitsChange={(update) => updateActiveProfile('plannedHabits', update)}
              profileCustomHabits={activeProfile.customHabits}
              onProfileCustomHabitsChange={(update) => updateActiveProfile('customHabits', update)}
              profileCheckInEntries={activeProfile.checkInEntries}
              onProfileCheckInEntriesChange={(update) => updateActiveProfile('checkInEntries', update)}
            />
          </ErrorBoundary>
        </section>

        <div hidden={activePage !== 'guide'}>
        <section className="procedure-planner-section" aria-labelledby="procedure-planner-heading">
          <div className="section-heading">
            <p className="eyebrow">PROCEDURE PLANNING</p>
            <h2 id="procedure-planner-heading">Keep your procedure details together</h2>
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
                  onChange={(event) => updateActiveProfile('procedureDate', event.target.value)}
                />
              </label>
              <label htmlFor="procedure-arrival">
                Arrival time (optional; no names or location details)
                <input
                  id="procedure-arrival"
                  type="text"
                  maxLength={160}
                  placeholder="Optional"
                  value={procedureArrival}
                  onChange={(event) => updateActiveProfile('procedureArrival', event.target.value)}
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
                  onChange={(event) => updateActiveProfile('selectedProcedure', event.target.value)}
                >
                  {selectedProcedureGroup.procedures.map((procedure) => (
                    <option key={procedure} value={procedure}>
                      {procedure}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="planner-local-note">
              These details stay in this page while it is open. They are not sent to a clinic or
              saved as an appointment. Avoid entering names, addresses, or other identifying details.
            </p>
          </div>

          <div className="surgery-checklist-card">
            <h3>Checklist for {selectedProcedure}</h3>
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

        <section className="icu-model-section" aria-labelledby="procedure-care-modules-heading">
          <div className="section-heading">
            <p className="eyebrow">PROCEDURE-RELEVANT CARE TOPICS</p>
            <h2 id="procedure-care-modules-heading">ICU and recovery topics to discuss</h2>
            <p className="planner-disclaimer">
              Based on the {selectedService} procedure category and {selectedProcedure} selected
              above. These general prompts are not a description of your care or a personalized
              care plan. Confirm what applies with your care team.
            </p>
          </div>

          <div className="patient-profile-grid">
            <article className="icu-model-card">
              <h3>ICU care topics</h3>
              <ul>
                {selectedProcedureGroup.icuTopics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </article>
            <article className="icu-model-card">
              <h3>Recovery care topics</h3>
              <ul>
                {selectedProcedureGroup.recoveryTopics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="icu-model-section" aria-labelledby="postoperative-route-heading">
          <div className="section-heading">
            <p className="eyebrow">AFTER THE PROCEDURE</p>
            <h2 id="postoperative-route-heading">Possible next step after PACU</h2>
            <p className="planner-disclaimer">
              These are broad examples of planned pathways, not a rule about where anyone will go.
              The operation and approach, your health and recovery, local resources, and clinical
              assessment all matter. The responsible care team decides when PACU discharge criteria
              are met; an ICU may provide equivalent postanesthesia care.
            </p>
          </div>

          <article className="icu-model-card route-card">
            <p className="mini-label">Selected procedure: {selectedProcedure}</p>
            <h3>
              {postoperativeRoute.route === 'home' && 'PACU → home may be planned'}
              {postoperativeRoute.route === 'floor' && 'PACU → hospital floor is commonly planned'}
              {postoperativeRoute.route === 'icu' && 'PACU → ICU or monitored unit may be planned'}
              {postoperativeRoute.route === 'variable' && 'The planned route can vary'}
            </h3>
            <p>{postoperativeRoute.detail}</p>
            <p>
              Going home depends on meeting the care team’s discharge criteria; needing more
              monitoring or treatment can change the plan. Confirm your expected destination with
              your surgeon and anesthesia team.
            </p>
            <a
              href="https://www.asahq.org/standards-and-practice-parameters/standards-for-postanesthesia-care"
              target="_blank"
              rel="noopener noreferrer"
            >
              American Society of Anesthesiologists: Standards for Postanesthesia Care (opens in new tab)
            </a>
          </article>
        </section>

        <section className="icu-model-section" aria-labelledby="anesthesia-education-heading">
          <div className="section-heading">
            <p className="eyebrow">ANESTHESIA EDUCATION</p>
            <h2 id="anesthesia-education-heading">What anesthesia may feel like</h2>
            <p className="planner-disclaimer">
              This section is separate from the procedure-route examples: a procedure name does not
              tell you which anesthesia you will receive. Types can be combined, and your
              anesthesiology team can explain your actual plan.
            </p>
          </div>

          <div className="anesthesia-card">
            <label className="anesthesia-select" htmlFor="anesthesia-type">
              Anesthesia type
              <select
                id="anesthesia-type"
                value={selectedAnesthesiaType}
                onChange={(event) => updateActiveProfile('anesthesiaType', event.target.value)}
              >
                {Object.entries(anesthesiaTypes).map(([type, info]) => (
                  <option key={type} value={type}>{info.label}</option>
                ))}
              </select>
            </label>

            <article className="anesthesia-detail">
              <div aria-live="polite">
                <h3>{anesthesiaInfo.label}</h3>
                <p>{anesthesiaInfo.description}</p>
              </div>
              <h4>Possible effects and recovery</h4>
              <p>{anesthesiaInfo.effects}</p>
              <p>
                After anesthesia, people are monitored in PACU or an appropriate equivalent area.
                Staff may check alertness, breathing, oxygen level, circulation, and temperature;
                the exact monitoring and next destination depend on the care plan.
              </p>
            </article>

            <div className="anesthesia-questions">
              <h3>Questions for your anesthesiology team</h3>
              <ul>
                <li>Which type or combination is planned, and why?</li>
                <li>What might I notice as it wears off, and which symptoms should I report?</li>
                <li>What instructions apply to medicines, eating or drinking, transportation, and activities afterward?</li>
              </ul>
            </div>

            <p className="planner-local-note">
              General education only; do not use this to change medicines, fasting, or activity.
              Follow the instructions from your own care team.
            </p>
            <div className="anesthesia-sources">
              <a
                href="https://madeforthismoment.asahq.org/anesthesia-101/types-of-anesthesia/"
                target="_blank"
                rel="noopener noreferrer"
              >
                American Society of Anesthesiologists: Types of Anesthesia (opens in new tab)
              </a>
              <a
                href="https://madeforthismoment.asahq.org/preparing-for-surgery/recovery/"
                target="_blank"
                rel="noopener noreferrer"
              >
                American Society of Anesthesiologists: Anesthesia and Recovery (opens in new tab)
              </a>
            </div>
          </div>
        </section>

        </div>

        <section className="tools-page" hidden={activePage !== 'care'}>
          <ErrorBoundary key={activeProfile.id} section="Prepare for your visit">
            <CareSupport />
          </ErrorBoundary>
        </section>
        <section className="tools-page" hidden={activePage !== 'medications'}>
          <ErrorBoundary key={activeProfile.id} section="Medicines">
            <Pharmacy
              comorbidities={[
                ...activeProfile.healthHistory.map((id) => healthHistoryLabels[id]),
                activeProfile.otherHealthHistory,
              ].filter(Boolean).join(', ')}
              medications={activeProfile.medications}
              onMedicationsChange={(update) => updateActiveProfile('medications', update)}
            />
          </ErrorBoundary>
        </section>
        <section className="tools-page" hidden={activePage !== 'health-history'}>
          <div className="section-heading">
            <p className="eyebrow">MY PROFILE</p>
            <h2 id="health-history-heading">Health history to discuss</h2>
            <p className="planner-disclaimer">
              Optional organizer for conditions you report having been diagnosed with or told about
              by your care team. This list is not complete and does not assess risk or change your
              care. Confirm details with a health professional.
            </p>
          </div>

          <fieldset className="comorbidity-selector">
            <legend>Health conditions (optional)</legend>
            <p className="comorbidity-guidance">
              Select only what you know and want to note. If you are unsure, leave it unchecked or
              use the unsure option below.
            </p>
            {healthHistoryGroups.map((group) => (
              <fieldset className="comorbidity-group" key={group.category}>
                <legend>{group.category}</legend>
                <div className="comorbidity-options">
                  {group.conditions.map((condition) => (
                    <label className="comorbidity-option" key={condition.id}>
                      <input
                        type="checkbox"
                        checked={activeProfile.healthHistory.includes(condition.id)}
                        onChange={() => toggleHealthHistory(condition.id)}
                      />
                      <span>{condition.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <label className="comorbidity-option comorbidity-special-option">
              <input
                type="checkbox"
                checked={activeProfile.healthHistoryUnknown}
                onChange={(event) => updateActiveProfile('healthHistoryUnknown', event.target.checked)}
              />
              <span>Not sure / history not available</span>
            </label>
            <label className="field-row comorbidity-other" htmlFor="profile-other-health-history">
              Other condition(s) to discuss (optional)
              <input
                id="profile-other-health-history"
                type="text"
                maxLength={200}
                value={activeProfile.otherHealthHistory}
                onChange={(event) => updateActiveProfile('otherHealthHistory', event.target.value)}
                placeholder="Avoid names or identifying details"
              />
            </label>
          </fieldset>
          <p className="planner-local-note">
            This note is kept only in this demo profile's current browser session. Do not enter
            identifying or sensitive details.
          </p>
        </section>

        <section className="main-grid" hidden={activePage !== 'plan'}>
          <article className="plan-card">
            <div className="plan-header">
              <div>
                <p className="eyebrow">EXAMPLE DAILY CHECKLIST</p>
                <h2>Things you may want to remember</h2>
              </div>
              <span>{completedCount}/{tasks.length} done</span>
            </div>
            <p className="planner-disclaimer">
              These sample reminders are not a personal care plan. Follow your care team's
              instructions and do not change medicines or activity based on this checklist.
            </p>

            <p className="visually-hidden" role="status" aria-live="polite">{taskAnnouncement}</p>
            <ul className="task-list" ref={taskListRef}>
              {tasks.map((task) => (
                <li key={task.id} className={task.done ? 'task-item done' : 'task-item'}>
                  <label>
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task.id)}
                    />
                    <span className="task-time">{task.time}</span>
                    <span className="task-name">{task.label}</span>
                  </label>
                  <button
                    className="task-remove-button"
                    type="button"
                    aria-label={`Remove reminder ${task.label}`}
                    onClick={() => removeTask(task.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <form className="task-add-form" onSubmit={addTask}>
              <label htmlFor="new-task-label">
                Add a personal reminder
                <input
                  id="new-task-label"
                  ref={taskLabelInputRef}
                  type="text"
                  maxLength={100}
                  value={taskLabel}
                  onChange={(event) => setTaskLabel(event.target.value)}
                  placeholder="For example, write down a question"
                  required
                />
              </label>
              <label htmlFor="new-task-time">
                Time (optional)
                <input
                  id="new-task-time"
                  type="text"
                  maxLength={40}
                  value={taskTime}
                  onChange={(event) => setTaskTime(event.target.value)}
                  placeholder="For example, afternoon"
                />
              </label>
              <button className="task-add-button" type="submit">Add reminder</button>
            </form>
            <p className="planner-local-note">
              Your reminders stay in this demo profile in this page’s memory and are cleared when
              the page is reloaded or closed. Avoid names or other identifying details.
            </p>
          </article>

          <aside className="care-panel">
            <p className="eyebrow">YOUR FOCUS</p>
            <h2>Daily planning</h2>
            <p>Choose what feels helpful. Ask your care team what guidance applies to your activity, fluids, and medicines.</p>
          </aside>
        </section>

        <div hidden={activePage !== 'journey'}>
        <section className="timeline-section">
          <div className="section-heading">
            <p className="eyebrow">CONTINUUM OF CARE</p>
            <h2>From ICU care to at-home recovery</h2>
            <p className="planner-disclaimer">
              This is general education, not a schedule or care plan. Your experience and
              instructions may differ; ask your care team what applies to you.
            </p>
          </div>

          <div className="timeline-grid">
            {recoveryStages.map((stage) => (
              <article key={stage.phase} className="timeline-card">
                <span className="stage-badge">{stage.phase}</span>
                <h3>{stage.focus}</h3>
                <ul>
                  {stage.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="timeline-section" aria-labelledby="icu-day-one-heading">
          <div className="section-heading">
            <p className="eyebrow">WHAT TO EXPECT</p>
            <h2 id="icu-day-one-heading">Day one after surgery: ICU care</h2>
            <p className="planner-disclaimer">
              Every recovery is different. Your ICU team will tailor care to your operation and
              explain what applies to you; follow their instructions.
            </p>
          </div>

          <div className="timeline-grid">
            <article className="timeline-card">
              <span className="stage-badge">After surgery</span>
              <h3>Arrival and close monitoring</h3>
              <ul>
                <li>Your team checks breathing, circulation, alertness, and comfort.</li>
                <li>Monitors and any tubes or drains are reviewed as part of your care.</li>
                <li>The team shares a handoff and updates your recovery plan.</li>
              </ul>
            </article>
            <article className="timeline-card">
              <span className="stage-badge">Throughout day one</span>
              <h3>Support and reassessment</h3>
              <ul>
                <li>Nurses reassess you regularly and respond to changes.</li>
                <li>Pain, nausea, wound, and fluid needs are managed by your care team.</li>
                <li>Breathing exercises, drinks, food, or movement happen only when your team says they are appropriate.</li>
              </ul>
            </article>
            <article className="timeline-card">
              <span className="stage-badge">As recovery progresses</span>
              <h3>Small steps, guided by your team</h3>
              <ul>
                <li>Ask what the goals are for your next few hours and who to call with concerns.</li>
                <li>Your team decides when you are ready for less intensive monitoring or a different unit.</li>
                <li>Share new or worsening symptoms with your nurse right away.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="procedures-section">
          <div className="section-heading">
            <p className="eyebrow">COMMON SURGICAL TYPES</p>
            <h2>Procedure-specific recovery priorities</h2>
          </div>

          <div className="procedure-grid">
            {procedureOptions.map((procedure) => (
              <article key={procedure.name} className="procedure-card">
                <h3>{procedure.name}</h3>
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
