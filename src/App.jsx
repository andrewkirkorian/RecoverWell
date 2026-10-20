import { useEffect, useRef, useState } from 'react';
import {
  clearSavedProfiles,
  isStorageAvailable,
  loadSavedProfiles,
  saveProfiles,
} from './profileStorage';
import ErrorBoundary from './ErrorBoundary';
import CareSupport from './CareSupport';
import Pharmacy from './Pharmacy';
import SelfCare from './SelfCare';
import HealthReference from './HealthReference';
import './App.css';
import './ProfileSaving.css';

const pageTitles = {
  home: 'Home',
  plan: 'Daily plan',
  medications: 'Pharmacy',
  'health-history': 'Health history',
  care: 'Prepare for your visit',
  selfcare: 'Self-care toolkit',
  guide: 'Procedure planning',
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
    category: 'Heart and blood vessels',
    conditions: [
      { id: 'hypertension', label: 'High blood pressure' },
      { id: 'heart-disease', label: 'Heart disease or blocked heart arteries' },
      { id: 'heart-failure', label: 'Heart failure (heart does not pump as well as it should)' },
      { id: 'arrhythmia', label: 'Irregular heartbeat' },
      { id: 'stroke-tia', label: 'Past stroke or mini-stroke (TIA)' },
      { id: 'vascular-disease', label: 'Poor blood flow in the legs or arms' },
    ],
  },
  {
    category: 'Lungs and sleep',
    conditions: [
      { id: 'asthma', label: 'Asthma' },
      { id: 'copd', label: 'COPD or emphysema (long-term lung disease)' },
      { id: 'sleep-apnea', label: 'Sleep apnea (breathing stops and starts during sleep)' },
    ],
  },
  {
    category: 'Hormones, blood sugar, and weight',
    conditions: [
      { id: 'diabetes-type-1', label: 'Type 1 diabetes' },
      { id: 'diabetes-type-2', label: 'Type 2 diabetes' },
      { id: 'obesity', label: 'Obesity' },
      { id: 'thyroid-disease', label: 'Thyroid problem' },
    ],
  },
  {
    category: 'Kidneys, liver, and stomach',
    conditions: [
      { id: 'ckd', label: 'Long-term kidney disease (CKD)' },
      { id: 'liver-disease', label: 'Long-term liver disease' },
      { id: 'inflammatory-bowel-disease', label: "Crohn's disease or ulcerative colitis" },
    ],
  },
  {
    category: 'Brain and nerves',
    conditions: [
      { id: 'seizure-disorder', label: 'Seizures or epilepsy' },
      { id: 'cognitive-condition', label: 'Dementia or memory problems' },
      { id: 'parkinsons', label: "Parkinson's disease" },
    ],
  },
  {
    category: 'Blood, immune system, and cancer',
    conditions: [
      { id: 'anemia', label: 'Anemia (low red blood cells)' },
      { id: 'clotting-condition', label: 'Bleeding or blood clot problem' },
      { id: 'autoimmune-condition', label: 'Autoimmune disease (immune system attacks the body)' },
      { id: 'immunocompromised', label: 'Weak immune system' },
      { id: 'cancer', label: 'Cancer' },
    ],
  },
  {
    category: 'Mental health',
    conditions: [
      { id: 'depression', label: 'Depression' },
      { id: 'anxiety', label: 'Anxiety' },
    ],
  },
];

const recoveryStages = [
  {
    phase: 'ICU or recovery room',
    focus: 'Close watch right after surgery',
    items: ['Staff check your heart rate, breathing, and blood pressure all the time', 'Pain and sleepiness are kept under control', 'Help with breathing and first small movements'],
  },
  {
    phase: 'Hospital room',
    focus: 'Getting moving again',
    items: ['Turning in bed and walking often', 'Checks on your wound and any drains (tubes that remove fluid)', 'Fluids, food, and medicines on a schedule'],
  },
  {
    phase: 'Leaving the hospital',
    focus: 'Getting ready to go home',
    items: ['Learning about your medicines and follow-up visits', 'Making your home safe and setting movement goals', 'Knowing which symptoms mean you should call your care team'],
  },
  {
    phase: 'At home',
    focus: 'Healing day by day',
    items: ['Short walks that slowly get longer', 'Sleep, fluids, and good food', 'Keeping track of your wound, swelling, and pain'],
  },
];

const procedureOptions = [
  {
    name: 'General surgery',
    recovery: 'Do breathing exercises, walk early, slowly go back to normal food, and keep an eye on your wound.',
  },
  {
    name: 'Bone and joint surgery (orthopedic)',
    recovery: 'Protect the joint, keep swelling down, and follow your physical therapy plan.',
  },
  {
    name: 'Heart surgery (cardiac)',
    recovery: 'Slowly move more each day, have your heartbeat checked, get help with breathing, and take medicines exactly as told.',
  },
  {
    name: 'Brain surgery (neurosurgery)',
    recovery: 'Watch how alert you feel, head pain, and nausea. Follow all brain checks and activity limits.',
  },
  {
    name: 'Belly surgery (abdominal)',
    recovery: 'Help your digestion, rest, drink fluids, and do not lift things until your team says it is okay.',
  },
  {
    name: 'Back surgery (spine)',
    recovery: 'Move carefully, protect your back and stomach muscles, and move the way your therapist shows you.',
  },
  {
    name: 'Bladder, kidney, or prostate surgery (urologic)',
    recovery: 'Care for any catheter (a tube that drains urine), drink fluids, watch the color of your urine, and follow lifting limits.',
  },
  {
    name: "Women's health surgery (gynecologic)",
    recovery: 'Keep track of bleeding and pain, walk a little more each day, and avoid heavy lifting until your team says it is okay.',
  },
  {
    name: 'Cancer surgery (oncologic)',
    recovery: 'Protect your wounds, eat well, and go to follow-up visits about test results and treatment.',
  },
  {
    name: 'Blood vessel surgery (vascular)',
    recovery: 'Check the color, warmth, and pulse of your arm or leg, and follow your walking and medicine plans closely.',
  },
];

const serviceLineBundles = [
  {
    service: 'Neuro',
    label: 'Brain and spine (neuro)',
    procedures: ['Craniotomy', 'Spine surgery', 'Cerebral aneurysm repair'],
    icuTopics: [
      'Ask what checks are planned after your surgery and which changes your team wants to hear about right away.',
      'Ask the team to explain any machines, checks, or activity limits for your surgery.',
    ],
    recoveryTopics: [
      'Ask which instructions apply to you for your head, back, wound, movement, and follow-up visits.',
      'Ask who to call if a symptom is new or getting worse after you leave.',
    ],
  },
  {
    service: 'Cardiac',
    label: 'Heart (cardiac)',
    procedures: ['CABG', 'Valve repair', 'Heart failure surgery'],
    icuTopics: [
      'Ask the team to explain any heart monitors, breathing help, IV lines, or drains used in your care.',
      'Ask which changes or symptoms your team wants to hear about right away.',
    ],
    recoveryTopics: [
      'Ask your heart team which activity, wound care, and follow-up instructions apply to your surgery.',
      'Ask who to call if a symptom is new or getting worse after you go home.',
    ],
  },
  {
    service: 'General surgery',
    label: 'Belly and digestion (general surgery)',
    procedures: ['Abdominal surgery', 'Bariatric surgery', 'GI resections'],
    icuTopics: [
      'Ask what help you will get with comfort, breathing, eating and drinking, and your wound or drain.',
      'Ask which changes your team wants to hear about right away.',
    ],
    recoveryTopics: [
      'Ask your team what to eat and drink, what to expect with bowel movements, and how to care for your wound and stay active.',
      'Ask if you need to learn how to care for a drain, an ostomy (an opening for waste on the belly), or special nutrition, and where to get help.',
    ],
  },
  {
    service: 'Orthopedic',
    label: 'Bones and joints (orthopedic)',
    procedures: ['Hip arthroplasty', 'Knee replacement', 'Spine fusion'],
    icuTopics: [
      'Ask which comfort, blood flow, and movement checks are part of your care and what they mean.',
      'Ask what help you can get to move safely while you are in the hospital.',
    ],
    recoveryTopics: [
      'Ask how you can move, how much weight you can put on the joint, what equipment you need, and what therapy is planned.',
      'Ask what help at home might be useful and who to call with concerns.',
    ],
  },
  {
    service: 'Urology',
    label: 'Bladder, kidneys, and prostate (urology)',
    procedures: ['Prostatectomy', 'Nephrectomy', 'Cystectomy', 'TURP', 'Ureteroscopy'],
    icuTopics: [
      'Ask if you will have a catheter (tube that drains urine), a stent (small tube that keeps urine flowing), or other equipment, and who can explain it.',
      'Ask what changes in peeing, comfort, or symptoms you should tell your team about.',
    ],
    recoveryTopics: [
      'Ask your team about any catheter, stent, how much to drink, wound care, activity, and follow-up visits.',
      'Ask how and when to get help if you have a concern after you leave.',
    ],
  },
  {
    service: 'Gynecology',
    label: "Women's health (gynecology)",
    procedures: ['Hysterectomy', 'Myomectomy', 'Oophorectomy', 'Laparoscopic endometriosis excision', 'Pelvic organ prolapse repair'],
    icuTopics: [
      'Ask how your team will keep you comfortable and what bleeding or other changes they want to hear about.',
      'Ask which checks, equipment, or activity limits apply to your surgery.',
    ],
    recoveryTopics: [
      'Ask about wound care, bleeding, activity, and follow-up visits for your surgery.',
      'Ask who to call if your symptoms change or you are not sure about an instruction.',
    ],
  },
  {
    service: 'Oncology',
    label: 'Cancer (oncology)',
    procedures: ['Mastectomy', 'Lumpectomy', 'Colon cancer resection', 'Lung lobectomy', 'Tumor debulking'],
    icuTopics: [
      'Ask what help you will get with comfort, breathing, your wound, or drains.',
      'Ask which changes your team wants to hear about and how they will share test results.',
    ],
    recoveryTopics: [
      'Ask your team about wound and drain care, eating, movement, and follow-up visits.',
      'Ask who will go over your results and plan any next steps.',
    ],
  },
  {
    service: 'Vascular',
    label: 'Blood vessels (vascular)',
    procedures: ['Carotid endarterectomy', 'Aortic aneurysm repair', 'Peripheral artery bypass', 'Amputation', 'AV fistula creation'],
    icuTopics: [
      'Ask what blood flow or wound checks are part of your care and what they mean.',
      'Ask which changes need quick attention and how to reach your team.',
    ],
    recoveryTopics: [
      'Ask about activity, wound care, care of your arm or leg, and follow-up visits for your surgery.',
      'Ask which changes mean you should call or get checked right away after you leave.',
    ],
  },
];

const procedureLabels = {
  Craniotomy: 'Craniotomy (opening the skull for brain surgery)',
  'Spine surgery': 'Spine surgery',
  'Cerebral aneurysm repair': 'Brain aneurysm repair (fixing a bulging blood vessel in the brain)',
  CABG: 'Heart bypass surgery (CABG)',
  'Valve repair': 'Heart valve repair',
  'Heart failure surgery': 'Heart failure surgery',
  'Abdominal surgery': 'Belly (abdominal) surgery',
  'Bariatric surgery': 'Weight-loss (bariatric) surgery',
  'GI resections': 'Removing part of the stomach or bowel (GI resection)',
  'Hip arthroplasty': 'Hip replacement (hip arthroplasty)',
  'Knee replacement': 'Knee replacement',
  'Spine fusion': 'Spine fusion (joining bones in the back)',
  Prostatectomy: 'Prostate removal (prostatectomy)',
  Nephrectomy: 'Kidney removal (nephrectomy)',
  Cystectomy: 'Bladder removal (cystectomy)',
  TURP: 'Prostate trimming through the urethra (TURP)',
  Ureteroscopy: 'Kidney stone procedure with a small scope (ureteroscopy)',
  Hysterectomy: 'Removing the uterus (hysterectomy)',
  Myomectomy: 'Removing fibroids from the uterus (myomectomy)',
  Oophorectomy: 'Removing one or both ovaries (oophorectomy)',
  'Laparoscopic endometriosis excision': 'Keyhole surgery to remove endometriosis',
  'Pelvic organ prolapse repair': 'Repair of a dropped bladder, uterus, or bowel (prolapse repair)',
  Mastectomy: 'Breast removal (mastectomy)',
  Lumpectomy: 'Removing a breast lump (lumpectomy)',
  'Colon cancer resection': 'Removing part of the colon for cancer',
  'Lung lobectomy': 'Removing part of a lung (lobectomy)',
  'Tumor debulking': 'Removing as much of a tumor as possible (debulking)',
  'Carotid endarterectomy': 'Clearing a blocked neck artery (carotid endarterectomy)',
  'Aortic aneurysm repair': 'Repair of a bulging main artery (aortic aneurysm repair)',
  'Peripheral artery bypass': 'Leg or arm artery bypass',
  Amputation: 'Amputation (removing a limb or part of a limb)',
  'AV fistula creation': 'Dialysis access in the arm (AV fistula)',
};

const procedureLabel = (procedure) => procedureLabels[procedure] ?? procedure;

const postoperativeRoutes = {
  Craniotomy: {
    route: 'icu',
    detail: 'You may go to the ICU or another unit where staff watch you closely. It depends on the surgery and the hospital.',
  },
  'Spine surgery': {
    route: 'floor',
    detail: 'A regular hospital room is common. The type and size of the surgery, and how you recover, can change this.',
  },
  'Cerebral aneurysm repair': {
    route: 'icu',
    detail: 'You may be watched closely in the ICU or a step-down unit (one level below the ICU). It depends on the repair and how you are doing.',
  },
  CABG: {
    route: 'icu',
    detail: 'Most people stay in a heart ICU first so staff can watch them closely, then move to a regular heart unit when ready.',
  },
  'Valve repair': {
    route: 'icu',
    detail: 'Most people stay in the ICU after open heart surgery so staff can watch them closely, then move to a regular heart unit when ready.',
  },
  'Heart failure surgery': {
    route: 'icu',
    detail: 'Most people stay in the ICU after major heart surgery so staff can watch them closely. The exact plan depends on the surgery.',
  },
  'Abdominal surgery': {
    route: 'variable',
    detail: 'This covers many kinds of surgery. After some smaller ones you go home the same day. After bigger ones you usually stay in a hospital room.',
  },
  'Bariatric surgery': {
    route: 'floor',
    detail: 'A stay in a regular hospital room is common, though some hospitals send certain people home the same day.',
  },
  'GI resections': {
    route: 'floor',
    detail: 'A stay in a regular hospital room is common. The ICU may be used after more complex surgery.',
  },
  'Hip arthroplasty': {
    route: 'floor',
    detail: 'You may stay in a hospital room or go home the same day. It depends on you, the surgery, and the hospital.',
  },
  'Knee replacement': {
    route: 'floor',
    detail: 'You may stay in a hospital room or go home the same day. It depends on you, the surgery, and the hospital.',
  },
  'Spine fusion': {
    route: 'floor',
    detail: 'A regular hospital room is common. A bigger fusion or slower recovery may mean closer watching.',
  },
  Prostatectomy: {
    route: 'floor',
    detail: 'A short stay in a hospital room is common. Depending on how the surgery is done, you may go home sooner.',
  },
  Nephrectomy: {
    route: 'floor',
    detail: 'A stay in a regular hospital room is common. How the surgery is done and how you recover can change how long you stay.',
  },
  Cystectomy: {
    route: 'floor',
    detail: 'A stay in a regular hospital room is common. If you need more care, you may be watched more closely.',
  },
  TURP: {
    route: 'floor',
    detail: 'You may have a short hospital stay or go home the same day. It depends on the surgery and how you recover.',
  },
  Ureteroscopy: {
    route: 'home',
    detail: 'Usually you go home the same day, once your care team says you are ready.',
  },
  Hysterectomy: {
    route: 'variable',
    detail: 'After some keyhole surgeries you go home the same day. Other types of surgery may need a hospital stay.',
  },
  Myomectomy: {
    route: 'variable',
    detail: 'This surgery can be done in different ways. You may go home the same day or stay in the hospital.',
  },
  Oophorectomy: {
    route: 'variable',
    detail: 'After some keyhole surgeries you go home the same day. Other types of surgery may need a hospital stay.',
  },
  'Laparoscopic endometriosis excision': {
    route: 'variable',
    detail: 'You may go home the same day. A longer or bigger surgery may need a hospital stay.',
  },
  'Pelvic organ prolapse repair': {
    route: 'variable',
    detail: 'You may go home the same day or stay in the hospital. It depends on the repair and how you recover.',
  },
  Mastectomy: {
    route: 'variable',
    detail: 'Some people go home the same day. Others stay in the hospital, depending on the surgery, any breast rebuilding, and recovery.',
  },
  Lumpectomy: {
    route: 'home',
    detail: 'Usually you go home the same day, once your care team says you are ready.',
  },
  'Colon cancer resection': {
    route: 'floor',
    detail: 'A stay in a regular hospital room is common. The ICU may be used after some complex surgeries.',
  },
  'Lung lobectomy': {
    route: 'floor',
    detail: 'A regular hospital room is common. You may be watched more closely depending on the surgery and how you recover.',
  },
  'Tumor debulking': {
    route: 'variable',
    detail: 'This surgery can be very different from person to person. A hospital room is common, and the ICU may be used after bigger surgeries.',
  },
  'Carotid endarterectomy': {
    route: 'floor',
    detail: 'A stay in a closely watched hospital room is common. Some hospitals use the ICU.',
  },
  'Aortic aneurysm repair': {
    route: 'variable',
    detail: 'Open surgery and repair through a small tube in the blood vessel have different plans. You may go to a regular room, a step-down unit, or the ICU.',
  },
  'Peripheral artery bypass': {
    route: 'floor',
    detail: 'A regular hospital room is common. You may be watched more closely depending on the surgery and how you recover.',
  },
  Amputation: {
    route: 'floor',
    detail: 'A stay in a hospital room is common so you can recover and be checked for rehab. Needs are different for each person.',
  },
  'AV fistula creation': {
    route: 'home',
    detail: 'Usually you go home the same day, once your care team says you are ready.',
  },
};

const anesthesiaTypes = {
  unknown: {
    label: 'Not sure / not talked about yet',
    description: 'The type of anesthesia (medicine that blocks pain during surgery) depends on the surgery and on you. Your anesthesia team can explain what is planned and whether they will use more than one type.',
    effects: 'It is okay not to know yet. Ask the anesthesia team what to expect and which instructions apply to you.',
  },
  general: {
    label: 'General anesthesia (fully asleep)',
    description: 'Medicine puts you in a deep sleep so you do not feel the surgery. The anesthesia team watches and supports your breathing and heart the whole time.',
    effects: 'Afterward you may feel sleepy, sick to your stomach, cold, or foggy for a while. A breathing tube can leave a sore throat. How you feel and how long it lasts is different for everyone.',
  },
  regional: {
    label: 'Regional anesthesia (numbing a large area, like a spinal, epidural, or nerve block)',
    description: 'Medicine numbs a large part of your body, such as from the waist down or one arm or leg. You may be awake or get medicine to relax you. It can also be used along with general anesthesia.',
    effects: 'As it wears off, the area may feel numb, heavy, or weak for a while. The team will tell you what to expect and when to ask for help.',
  },
  local: {
    label: 'Local anesthesia (numbing a small area)',
    description: 'Medicine numbs one small area. You are usually awake. It may also be used with medicine to relax you or with another type.',
    effects: 'The area may stay numb for a while, and feeling comes back slowly. Ask what to expect and how to protect the area while it is numb.',
  },
  sedation: {
    label: 'Sedation (medicine to relax you or make you sleepy)',
    description: 'Medicine helps you relax or feel sleepy. You may be lightly or deeply sleepy. It is often used with numbing medicine, and staff watch you the whole time. Your team may call this MAC (monitored anesthesia care).',
    effects: 'Afterward you may feel sleepy, a bit clumsy, or not remember parts of the day. Ask if someone needs to take you home and what to avoid, and follow your written instructions.',
  },
  combined: {
    label: 'More than one type',
    description: 'Your team may use more than one kind, such as general anesthesia plus a nerve block, or numbing medicine plus sedation.',
    effects: 'How you feel afterward depends on the mix. Ask what each part may cause and which recovery instructions apply.',
  },
};

const surgeryChecklists = {
  Craniotomy: [
    'Ask the surgery team which changes in thinking, speech, movement, or alertness need help right away, and who to call.',
    'Ask about head care, activity, and follow-up visits.',
  ],
  'Spine surgery': [
    'Ask which movement, lifting, and wound care instructions apply to your surgery.',
    'Ask if you will need equipment or help at home.',
  ],
  'Cerebral aneurysm repair': [
    'Ask the team which symptoms after this surgery need help right away.',
    'Ask about your checkups and follow-up plan before you leave the hospital.',
  ],
  CABG: [
    'Ask which activity and wound care instructions apply after bypass surgery.',
    'Ask about your heart follow-up visits and who to call with concerns.',
  ],
  'Valve repair': [
    'Ask what follow-up visits and checkups are planned after valve repair.',
    'Ask which activity and wound care instructions apply to you.',
  ],
  'Heart failure surgery': [
    'Ask how your follow-up will be planned with your heart doctor.',
    'Ask which symptoms or changes mean you should call or get checked right away.',
  ],
  'Abdominal surgery': [
    'Ask what you can eat and drink and how active you can be after surgery.',
    'Ask how to care for your wound or drain and who to call with concerns.',
  ],
  'Bariatric surgery': [
    'Ask for your eating and drinking plan after surgery.',
    'Ask about nutrition follow-up and any support groups or resources.',
  ],
  'GI resections': [
    'Ask what changes to expect with bowel movements, food, and activity, and which to report.',
    'Ask how to care for your wound or ostomy (an opening for waste on the belly), if you have one.',
  ],
  'Hip arthroplasty': [
    'Ask your surgeon or physical therapist how you can move and how much weight you can put on your leg.',
    'Ask about a walker or cane, setting up your home, and your physical therapy plan.',
  ],
  'Knee replacement': [
    'Ask your surgeon or physical therapist how you can move and how much weight you can put on your leg.',
    'Ask about a walker or cane, setting up your home, and your physical therapy plan.',
  ],
  'Spine fusion': [
    'Ask which movement, lifting, and back brace instructions apply to you.',
    'Ask if you will need equipment or help at home.',
  ],
  Prostatectomy: [
    'Ask how long the catheter (tube that drains urine) stays in and how to care for it at home.',
    'Ask about pelvic floor exercises (exercises to help control your bladder), lifting, and follow-up visits.',
  ],
  Nephrectomy: [
    'Ask about pain, activity, and how much to drink now that you have one kidney or part of a kidney.',
    'Ask which medicines to avoid and when your kidneys will be checked again.',
  ],
  Cystectomy: [
    'Ask to be taught how urine will leave your body now, and how to care for a stoma (an opening on the belly) if you have one.',
    'Ask about nutrition, supplies, and follow-up visits.',
  ],
  TURP: [
    'Ask how much blood in your urine is normal and when to call.',
    'Ask about the catheter (tube that drains urine), how much to drink, and activity.',
  ],
  Ureteroscopy: [
    'Ask if a stent (small tube) was placed and when it will come out.',
    'Ask which pain, peeing, or fever symptoms need help right away.',
  ],
  Hysterectomy: [
    'Ask when you can lift things, drive, and have sex again.',
    'Ask what vaginal bleeding or discharge is normal and when to call.',
  ],
  Myomectomy: [
    'Ask about activity limits, what bleeding is normal, and any advice about future pregnancy.',
    'Ask about wound care and when your follow-up visit is.',
  ],
  Oophorectomy: [
    'Ask how surgery may change your hormones and what help is available for symptoms.',
    'Ask about wound care and follow-up visits.',
  ],
  'Laparoscopic endometriosis excision': [
    'Ask what pain is normal after keyhole surgery, including shoulder pain (which is common).',
    'Ask about follow-up for your symptoms and any lab test results.',
  ],
  'Pelvic organ prolapse repair': [
    'Ask about lifting, straining, and keeping bowel movements soft to protect the repair.',
    'Ask how staff will check that your bladder empties and when you can get back to activities.',
  ],
  Mastectomy: [
    'Ask how to care for drains, your wound, and arm exercises.',
    'Ask how to lower your risk of arm swelling (lymphedema), about any breast rebuilding, and about lab test results.',
  ],
  Lumpectomy: [
    'Ask about wound care, activity, and whether radiation or other treatment comes next.',
    'Ask when you will get lab test results and follow-up visits.',
  ],
  'Colon cancer resection': [
    'Ask how to slowly return to normal food, what to expect with bowel movements, and how to care for your wound or ostomy.',
    'Ask about lab test results and any more treatment that is planned.',
  ],
  'Lung lobectomy': [
    'Ask about breathing exercises, chest tube care, and activity limits.',
    'Ask which breathing or pain changes need help right away.',
  ],
  'Tumor debulking': [
    'Ask what recovery steps to expect and what nutrition help is available.',
    'Ask how you will get lab test results and hear about next treatment steps.',
  ],
  'Carotid endarterectomy': [
    'Ask which stroke warning signs need emergency help, and what blood pressure numbers to aim for.',
    'Ask about neck wound care and any blood-thinning medicine (antiplatelet) you should take.',
  ],
  'Aortic aneurysm repair': [
    'Ask about activity and lifting limits, and how often you will need scans.',
    'Ask which belly, back, or leg symptoms need help right away.',
  ],
  'Peripheral artery bypass': [
    'Ask how to check the warmth, color, and pulse in your leg, and when to call.',
    'Ask about walking, raising your leg, and medicines.',
  ],
  Amputation: [
    'Ask how to care for the remaining part of your limb, how to position it, and how to manage phantom pain (pain that feels like it is in the missing part).',
    'Ask about rehab, when you might get an artificial limb, and emotional support.',
  ],
  'AV fistula creation': [
    'Ask how to feel for the buzzing (called a thrill) in your arm, and how to protect that arm.',
    'Ask when the fistula can be used for dialysis and what signs of a clot or infection to report.',
  ],
};

const healthHistoryLabels = Object.fromEntries(
  healthHistoryGroups.flatMap((group) => group.conditions.map(({ id, label }) => [id, label])),
);

function App() {
  const [savedData] = useState(loadSavedProfiles);
  const [profiles, setProfiles] = useState(() => savedData?.profiles ?? []);
  const [nextProfileId, setNextProfileId] = useState(() => savedData?.nextProfileId ?? 1);
  const [saveOnDevice, setSaveOnDevice] = useState(() => savedData !== null);
  const [storageAvailable] = useState(isStorageAvailable);
  const [storageMessage, setStorageMessage] = useState('');
  const [taskLabel, setTaskLabel] = useState('');
  const [taskTime, setTaskTime] = useState('');
  const [taskAnnouncement, setTaskAnnouncement] = useState('');
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [authMode, setAuthMode] = useState(() => (savedData?.profiles.length ? 'signin' : 'signup'));
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
    detail: 'Where you go next depends on the surgery, on you, and on the hospital.',
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
    if (saveOnDevice) saveProfiles(profiles, nextProfileId);
  }, [saveOnDevice, profiles, nextProfileId]);

  const handleSaveOnDeviceChange = (event) => {
    const enabled = event.target.checked;
    setSaveOnDevice(enabled);
    if (enabled) {
      setStorageMessage(
        saveProfiles(profiles, nextProfileId)
          ? 'Saving is on. Your profiles will still be here after you refresh or close this page.'
          : 'This browser would not let us save. Your profiles will be erased when you close the page.',
      );
    } else {
      clearSavedProfiles();
      setStorageMessage('Saving is off. The saved copy was erased from this device.');
    }
  };

  const eraseAllProfiles = () => {
    clearSavedProfiles();
    setProfiles([]);
    setNextProfileId(1);
    setLoginProfileId('');
    setSaveOnDevice(false);
    setAuthMode('signup');
    setStorageMessage('All demo profiles were erased from this page and this device.');
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
                Make a demo profile to keep your own checklist, notes, and medicine list in one place.
              </p>
            </div>

            <div className="signup-promise">
              <span className="signup-promise-icon" aria-hidden="true">✓</span>
              <p>
                <strong>Demo profiles only</strong>
                <span>There is no password or real account.</span>
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
                  ? saveOnDevice
                    ? 'Pick one of your saved demo profiles.'
                    : 'Pick a profile you made since you opened this page.'
                  : 'Pick a name to show. Use a nickname, not your real name.'}
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
                  <p role="status">You have not made a demo profile yet. Make one to get started.</p>
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
              {isSigningIn ? 'Need a new demo profile?' : 'Already made one?'}{' '}
              <button
                type="button"
                onClick={() => setAuthMode(isSigningIn ? 'signup' : 'signin')}
              >
                {isSigningIn ? 'Create profile' : 'Sign in'}
              </button>
            </p>

            <div className="signup-storage">
              {storageAvailable ? (
                <label className="signup-storage-toggle" htmlFor="save-on-device">
                  <input
                    id="save-on-device"
                    type="checkbox"
                    checked={saveOnDevice}
                    onChange={handleSaveOnDeviceChange}
                    aria-describedby="save-on-device-help"
                  />
                  Save my demo profiles on this device
                </label>
              ) : null}
              <p id="save-on-device-help" className="signup-privacy">
                {saveOnDevice
                  ? 'Your profiles, checklist, notes, and medicine list are saved in this browser without encryption. They are not private or protected: anyone who uses this browser can see them. Turn saving off or erase them when you are done.'
                  : 'Your profile, checklist, notes, and medicine list are only kept in this browser tab. They are not private or protected, and they are erased when you refresh or close the page.'}{' '}
                Do not enter real health details or anything that could identify you.
              </p>
              {profiles.length > 0 || saveOnDevice ? (
                <button type="button" className="signup-erase-button" onClick={eraseAllProfiles}>
                  Erase all demo profiles
                </button>
              ) : null}
              <p className="visually-hidden" role="status" aria-live="polite">{storageMessage}</p>
            </div>
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
            If someone may be having an emergency, call your local emergency number (such as 911)
            now. Do not wait for this website.
          </span>
        </aside>
        <aside className="prototype-disclaimer" role="note">
          <strong>This is a test version. It is not medical advice.</strong>
          <span>
            Recover Well cannot tell you what is wrong, prescribe medicine, or take the place of your
            doctor, nurse, or pharmacist. Check medicine names, doses, and recovery instructions with
            your care team. Do not enter anything that could identify you.
          </span>
        </aside>

        <section className="home-page" hidden={activePage !== 'home'}>
          <div className="hero-card">
            <div>
              <p className="eyebrow">WELCOME TO RECOVER WELL</p>
              <h2>{activeProfile.name}'s recovery, in one place.</h2>
              <p>
                Learn the basics, keep track of your questions, and pick what would help you today.
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
              <p>Use these tools to keep track of questions and notes, not to make health decisions.</p>
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
                <span>List your medicines and see some that may not mix well.</span>
              </button>
              <button type="button" onClick={(event) => navigateTo('care', event)}>
                <strong>Prepare for your visit</strong>
                <span>Write down symptoms and questions for your next visit.</span>
              </button>
              <button type="button" onClick={(event) => navigateTo('selfcare', event)}>
                <strong>Open self-care toolkit</strong>
                <span>Track how you feel, your energy, drinking water, and daily habits.</span>
              </button>
              <button type="button" onClick={(event) => navigateTo('guide', event)}>
                <strong>Plan for surgery</strong>
                <span>Save your surgery details and see a checklist for your surgery.</span>
              </button>
              <button type="button" onClick={(event) => navigateTo('journey', event)}>
                <strong>Learn about recovery</strong>
                <span>See what recovery usually looks like, step by step.</span>
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
            <h2 id="procedure-planner-heading">Keep your surgery details in one place</h2>
            <p className="planner-disclaimer">
              This is only for your own planning. It does not book or confirm your surgery. Follow
              the instructions from your surgery team.
            </p>
          </div>

          <div className="procedure-planner-card">
            <div className="planner-fields">
              <label htmlFor="procedure-date">
                Surgery date
                <input
                  id="procedure-date"
                  type="date"
                  value={procedureDate}
                  onChange={(event) => updateActiveProfile('procedureDate', event.target.value)}
                />
              </label>
              <label htmlFor="procedure-arrival">
                Arrival time (optional; do not add names or places)
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
                Type of surgery
                <select
                  id="operative-service"
                  value={selectedService}
                  onChange={handleServiceChange}
                >
                  {serviceLineBundles.map((bundle) => (
                    <option key={bundle.service} value={bundle.service}>
                      {bundle.label}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor="operative-procedure">
                Surgery
                <select
                  id="operative-procedure"
                  value={selectedProcedure}
                  onChange={(event) => updateActiveProfile('selectedProcedure', event.target.value)}
                >
                  {selectedProcedureGroup.procedures.map((procedure) => (
                    <option key={procedure} value={procedure}>
                      {procedureLabel(procedure)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="planner-local-note">
              {saveOnDevice
                ? 'These details are saved in this browser because you turned on saving.'
                : 'These details are only kept on this page while it is open.'}{' '}
              They are not sent to a clinic or saved as an appointment. Do not enter names,
              addresses, or anything that could identify you.
            </p>
          </div>

          <div className="surgery-checklist-card">
            <h3>Checklist for {procedureLabel(selectedProcedure)}</h3>
            <p>Things to ask your care team about. These are not instructions made for you.</p>
            <ul className="surgery-checklist">
              {[
                'Check the name of the surgery, the date, the arrival time, and the place with your surgery team.',
                'Ask your team when to stop eating and drinking, and what to do about your medicines. Do not change medicines unless your team tells you to.',
                'Make sure your team knows about all your medicines, vitamins, supplements, and allergies.',
                ...(surgeryChecklists[selectedProcedure] ?? []),
                'Ask how you will get home, what help you will need at home, and when your follow-up visits are.',
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
            <p className="eyebrow">QUESTIONS FOR YOUR TEAM</p>
            <h2 id="procedure-care-modules-heading">Hospital and recovery questions to ask</h2>
            <p className="planner-disclaimer">
              Based on the {selectedProcedureGroup.label} surgery type and{' '}
              {procedureLabel(selectedProcedure)} you picked above. These are general questions, not
              a plan made for you. Check with your care team about what applies to you.
            </p>
          </div>

          <div className="patient-profile-grid">
            <article className="icu-model-card">
              <h3>In the hospital or ICU (intensive care unit)</h3>
              <ul>
                {selectedProcedureGroup.icuTopics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
            </article>
            <article className="icu-model-card">
              <h3>During recovery</h3>
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
            <p className="eyebrow">AFTER SURGERY</p>
            <h2 id="postoperative-route-heading">Where you might go after the recovery room</h2>
            <p className="planner-disclaimer">
              Right after surgery, most people wake up in a recovery room (also called PACU). These
              are common examples of where people go next, not a rule. It depends on the surgery,
              your health, how you recover, and the hospital. Your care team decides when you are
              ready to leave the recovery room. Some people go straight to the ICU instead.
            </p>
          </div>

          <article className="icu-model-card route-card">
            <p className="mini-label">Your surgery: {procedureLabel(selectedProcedure)}</p>
            <h3>
              {postoperativeRoute.route === 'home' && 'Recovery room → home the same day is possible'}
              {postoperativeRoute.route === 'floor' && 'Recovery room → regular hospital room is common'}
              {postoperativeRoute.route === 'icu' && 'Recovery room → ICU or a closely watched unit is possible'}
              {postoperativeRoute.route === 'variable' && 'Where you go next can vary'}
            </h3>
            <p>{postoperativeRoute.detail}</p>
            <p>
              You go home only when your care team says you are ready. If you need more watching or
              treatment, the plan can change. Ask your surgeon and anesthesia team where you will
              likely go.
            </p>
            <a
              href="https://www.asahq.org/standards-and-practice-parameters/standards-for-postanesthesia-care"
              target="_blank"
              rel="noopener noreferrer"
            >
              American Society of Anesthesiologists: rules for recovery room care (opens in new tab)
            </a>
          </article>
        </section>

        <section className="icu-model-section" aria-labelledby="anesthesia-education-heading">
          <div className="section-heading">
            <p className="eyebrow">ANESTHESIA BASICS</p>
            <h2 id="anesthesia-education-heading">What anesthesia may feel like</h2>
            <p className="planner-disclaimer">
              Anesthesia is medicine that keeps you from feeling pain during surgery. The name of
              your surgery does not tell you which kind you will get. More than one kind can be
              used, and your anesthesia team can explain your plan.
            </p>
          </div>

          <div className="anesthesia-card">
            <label className="anesthesia-select" htmlFor="anesthesia-type">
              Type of anesthesia
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
              <h4>How you may feel afterward</h4>
              <p>{anesthesiaInfo.effects}</p>
              <p>
                After anesthesia, staff watch you in the recovery room or a similar area. They may
                check how awake you are, your breathing, oxygen level, heart, and temperature. What
                they check and where you go next depends on your care plan.
              </p>
            </article>

            <div className="anesthesia-questions">
              <h3>Questions for your anesthesia team</h3>
              <ul>
                <li>Which kind of anesthesia will I get, and why?</li>
                <li>What might I feel as it wears off, and which symptoms should I tell you about?</li>
                <li>What should I know about my medicines, eating and drinking, getting home, and activities afterward?</li>
              </ul>
            </div>

            <p className="planner-local-note">
              This is general information only. Do not use it to change your medicines, when you
              stop eating, or your activity. Follow the instructions from your own care team.
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
            <h2 id="health-history-heading">Health history to talk about</h2>
            <p className="planner-disclaimer">
              If you want, note health problems a doctor or nurse has told you that you have. This
              list does not include every condition, and it does not judge your risk or change your
              care. Check the details with your care team.
            </p>
          </div>

          <fieldset className="comorbidity-selector">
            <legend>Health conditions (optional)</legend>
            <p className="comorbidity-guidance">
              Only check what you know and want to note. If you are not sure, leave it blank or
              check the "Not sure" box below.
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
              <span>Not sure / I don't know my history</span>
            </label>
            <label className="field-row comorbidity-other" htmlFor="profile-other-health-history">
              Other health problems to talk about (optional)
              <input
                id="profile-other-health-history"
                type="text"
                maxLength={200}
                value={activeProfile.otherHealthHistory}
                onChange={(event) => updateActiveProfile('otherHealthHistory', event.target.value)}
                placeholder="Do not include names or personal details"
              />
            </label>
          </fieldset>
          <p className="planner-local-note">
            {saveOnDevice
              ? 'This is saved with this demo profile in this browser because you turned on saving.'
              : 'This is only kept in this demo profile while this page is open.'}{' '}
            Do not enter anything that could identify you or that you want to keep private.
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
              These are sample reminders, not a care plan made for you. Follow your care team's
              instructions. Do not change your medicines or activity because of this list.
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
              {saveOnDevice
                ? 'Your reminders are saved in this browser because you turned on saving.'
                : 'Your reminders are only kept on this page and are erased when you refresh or close it.'}{' '}
              Do not include names or other personal details.
            </p>
          </article>

          <aside className="care-panel">
            <p className="eyebrow">YOUR FOCUS</p>
            <h2>Daily planning</h2>
            <p>Pick what helps you. Ask your care team what is right for you about activity, drinking fluids, and medicines.</p>
          </aside>
        </section>

        <div hidden={activePage !== 'journey'}>
        <section className="timeline-section">
          <div className="section-heading">
            <p className="eyebrow">STEPS OF RECOVERY</p>
            <h2>From ICU care to at-home recovery</h2>
            <p className="planner-disclaimer">
              This is general information, not a schedule or a plan made for you. Your recovery may
              be different. Ask your care team what applies to you.
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
              The ICU (intensive care unit) is where staff watch you very closely. Every recovery is
              different. Your ICU team will tailor care to your surgery and explain what applies to
              you. Follow their instructions.
            </p>
          </div>

          <div className="timeline-grid">
            <article className="timeline-card">
              <span className="stage-badge">After surgery</span>
              <h3>Arriving and being watched closely</h3>
              <ul>
                <li>Your team checks your breathing, heart, how awake you are, and how comfortable you are.</li>
                <li>Staff check the machines and any tubes or drains attached to you.</li>
                <li>The surgery team tells the ICU team about your surgery and updates your recovery plan.</li>
              </ul>
            </article>
            <article className="timeline-card">
              <span className="stage-badge">Throughout day one</span>
              <h3>Care and regular checks</h3>
              <ul>
                <li>Nurses check on you often and act if anything changes.</li>
                <li>Your care team handles your pain, nausea, wound, and fluids.</li>
                <li>You start breathing exercises, drinking, eating, or moving only when your team says it is okay.</li>
              </ul>
            </article>
            <article className="timeline-card">
              <span className="stage-badge">As recovery progresses</span>
              <h3>Small steps, guided by your team</h3>
              <ul>
                <li>Ask what the goals are for the next few hours and who to ask if you are worried.</li>
                <li>Your team decides when you are ready for less watching or to move to another unit.</li>
                <li>Tell your nurse right away about any new symptoms or ones getting worse.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="procedures-section">
          <div className="section-heading">
            <p className="eyebrow">COMMON TYPES OF SURGERY</p>
            <h2>What to focus on after each type of surgery</h2>
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
