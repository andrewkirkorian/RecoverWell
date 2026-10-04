// Medicines sold both over the counter (OTC) and by prescription (Rx).
// Dosing is a short, paraphrased summary of typical ADULT directions from FDA-authorized
// labeling (OTC Drug Facts and prescribing information on DailyMed / Drugs@FDA).
// It is educational only. Labels differ by product, age, kidney/liver function and
// condition; always follow the product label and the prescriber or pharmacist.

const dailyMed = (query) =>
  `https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=${encodeURIComponent(query)}`;

export const dualAvailabilityMedications = [
  {
    id: 'ibuprofen',
    cautions:
      'Ask a clinician first if pregnant (especially 20+ weeks), age 65+, or with kidney disease, ulcers or bleeding, heart disease or high blood pressure, or taking blood thinners, steroids, aspirin or another NSAID.',
    name: 'Ibuprofen',
    purpose: 'Pain and inflammation (NSAID)',
    classes: ['nsaid'],
    aliases: ['advil', 'motrin'],
    otc: {
      strengths: '200 mg tablets or capsules',
      directions:
        '1 tablet every 4 to 6 hours while symptoms last; 2 tablets may be used if 1 does not help.',
      maxDaily: 'No more than 1,200 mg (6 tablets) in 24 hours unless a doctor directs otherwise.',
      limits: 'Pain: ask a doctor if needed for more than 10 days. Fever: more than 3 days.',
    },
    rx: {
      strengths: '400 mg, 600 mg and 800 mg tablets',
      directions:
        'Mild to moderate pain: 400 mg every 4 to 6 hours as needed. Arthritis: 1,200 to 3,200 mg a day split into 3 or 4 doses.',
      maxDaily: 'Prescription label ceiling is 3,200 mg in 24 hours, set by the prescriber.',
      limits: 'Use the lowest effective dose for the shortest time the prescriber directs.',
    },
    sources: [{ label: 'FDA labeling on DailyMed: ibuprofen', url: dailyMed('ibuprofen') }],
  },
  {
    id: 'naproxen',
    cautions:
      'Do not combine with ibuprofen or other NSAIDs unless instructed. Ask a clinician first if pregnant, age 65+, or with kidney disease, ulcers or bleeding, heart disease, or taking blood thinners.',
    name: 'Naproxen',
    purpose: 'Pain and inflammation (NSAID)',
    classes: ['nsaid'],
    aliases: ['aleve', 'naprosyn', 'naproxen sodium'],
    otc: {
      strengths: '220 mg naproxen sodium tablets or capsules',
      directions:
        '1 tablet every 8 to 12 hours; 2 tablets may be used for the first dose.',
      maxDaily: 'No more than 3 tablets (660 mg naproxen sodium) in 24 hours.',
      limits: 'Ask a doctor if pain lasts more than 10 days or fever more than 3 days.',
    },
    rx: {
      strengths: 'Naproxen 250, 375 and 500 mg tablets; naproxen sodium 275 and 550 mg tablets',
      directions:
        'Arthritis: 250 to 500 mg twice a day. Acute pain: 500 mg to start, then 500 mg every 12 hours or 250 mg every 6 to 8 hours.',
      maxDaily: 'Acute pain: up to 1,250 mg on day one, then generally no more than 1,000 mg a day unless the prescriber directs otherwise.',
      limits: 'Dose is adjusted for age, kidney and liver function.',
    },
    sources: [{ label: 'FDA labeling on DailyMed: naproxen', url: dailyMed('naproxen') }],
  },
  {
    id: 'omeprazole',
    cautions:
      'Do not increase or extend treatment without the prescriber. Ask a clinician if pregnant or breastfeeding, under 18, with liver disease, or taking blood thinners or other interacting medicines.',
    name: 'Omeprazole',
    purpose: 'Stomach acid reducer (proton pump inhibitor)',
    classes: [],
    aliases: ['prilosec'],
    otc: {
      strengths: '20 mg delayed-release tablets',
      directions: '1 tablet a day with water, before eating, for a 14-day course for frequent heartburn.',
      maxDaily: '1 tablet in 24 hours.',
      limits: 'Not for more than 14 days; a course may be repeated no sooner than every 4 months.',
    },
    rx: {
      strengths: '10 mg, 20 mg and 40 mg delayed-release capsules',
      directions:
        'Reflux disease: commonly 20 mg once a day. Erosive esophagitis: commonly 20 to 40 mg once a day for 4 to 8 weeks. Higher or twice-daily doses depend on the diagnosis.',
      maxDaily: 'Set by the prescriber for the condition being treated.',
      limits: 'Length of treatment is set and reviewed by the prescriber.',
    },
    sources: [{ label: 'FDA labeling on DailyMed: omeprazole', url: dailyMed('omeprazole') }],
  },
  {
    id: 'esomeprazole',
    cautions:
      'Do not increase or extend treatment without the prescriber. Ask a clinician if pregnant or breastfeeding, under 18, with liver disease, or taking interacting medicines.',
    name: 'Esomeprazole',
    purpose: 'Stomach acid reducer (proton pump inhibitor)',
    classes: [],
    aliases: ['nexium'],
    otc: {
      strengths: '20 mg delayed-release capsules or tablets',
      directions: '1 capsule a day with water before eating, for a 14-day course.',
      maxDaily: '1 capsule in 24 hours.',
      limits: 'Not for more than 14 days; a course may be repeated no sooner than every 4 months.',
    },
    rx: {
      strengths: '20 mg and 40 mg delayed-release capsules',
      directions: 'Reflux disease: commonly 20 mg once a day for 4 to 8 weeks; erosive esophagitis may use 20 or 40 mg.',
      maxDaily: 'Set by the prescriber for the condition being treated.',
      limits: 'Length of treatment is set and reviewed by the prescriber.',
    },
    sources: [{ label: 'FDA labeling on DailyMed: esomeprazole', url: dailyMed('esomeprazole') }],
  },
  {
    id: 'lansoprazole',
    cautions:
      'Do not increase or extend treatment without the prescriber. Ask a clinician if pregnant or breastfeeding, under 18, with liver disease, or taking interacting medicines.',
    name: 'Lansoprazole',
    purpose: 'Stomach acid reducer (proton pump inhibitor)',
    classes: [],
    aliases: ['prevacid'],
    otc: {
      strengths: '15 mg delayed-release capsules',
      directions: '1 capsule a day with water before eating, for a 14-day course.',
      maxDaily: '1 capsule in 24 hours.',
      limits: 'Not for more than 14 days; a course may be repeated no sooner than every 4 months.',
    },
    rx: {
      strengths: '15 mg and 30 mg delayed-release capsules',
      directions: 'Reflux disease: commonly 15 mg once a day; erosive esophagitis commonly 30 mg once a day, up to 8 weeks.',
      maxDaily: 'Set by the prescriber for the condition being treated.',
      limits: 'Length of treatment is set and reviewed by the prescriber.',
    },
    sources: [{ label: 'FDA labeling on DailyMed: lansoprazole', url: dailyMed('lansoprazole') }],
  },
  {
    id: 'famotidine',
    cautions:
      'Dosing depends on the diagnosis and kidney function. Ask a clinician if age 65+, pregnant or breastfeeding, or with kidney disease.',
    name: 'Famotidine',
    purpose: 'Stomach acid reducer (H2 blocker)',
    classes: [],
    aliases: ['pepcid'],
    otc: {
      strengths: '10 mg and 20 mg tablets',
      directions:
        '1 tablet with water for heartburn symptoms, or 15 to 60 minutes before foods that cause heartburn.',
      maxDaily: 'No more than 2 tablets of the 10 mg strength, or 1 tablet of the 20 mg strength, in 24 hours.',
      limits: 'Do not use for more than 14 days in a row without asking a doctor.',
    },
    rx: {
      strengths: '20 mg and 40 mg tablets',
      directions:
        'Active duodenal ulcer: 40 mg once a day at bedtime or 20 mg twice a day. Reflux disease: 20 mg twice a day for up to 6 weeks.',
      maxDaily: 'Set by the prescriber; lower doses are used with reduced kidney function.',
      limits: 'Length of treatment is set by the prescriber.',
    },
    sources: [{ label: 'FDA labeling on DailyMed: famotidine', url: dailyMed('famotidine') }],
  },
  {
    id: 'loperamide',
    cautions:
      'Do not exceed the label: higher doses can cause life-threatening heart rhythm problems. Do not use with bloody or black stool, fever, or severe belly pain or swelling; ask a clinician if pregnant, older, or taking heart-rhythm medicines.',
    name: 'Loperamide',
    purpose: 'Anti-diarrheal',
    classes: [],
    aliases: ['imodium'],
    otc: {
      strengths: '2 mg capsules or tablets',
      directions: '2 capsules (4 mg) after the first loose stool, then 1 capsule (2 mg) after each loose stool.',
      maxDaily: 'No more than 4 capsules (8 mg) in 24 hours.',
      limits: 'Stop and call a doctor if diarrhea lasts more than 2 days.',
    },
    rx: {
      strengths: '2 mg capsules',
      directions: 'Acute diarrhea: 4 mg to start, then 2 mg after each loose stool.',
      maxDaily: 'Prescription label limit is 16 mg in 24 hours, set by the prescriber.',
      limits: 'Higher than labeled doses can cause serious heart rhythm problems.',
    },
    sources: [{ label: 'FDA labeling on DailyMed: loperamide', url: dailyMed('loperamide') }],
  },
  {
    id: 'meclizine',
    cautions:
      'Can cause drowsiness; avoid alcohol and driving until effects are known. Ask a clinician if older (fall risk), or with glaucoma, prostate or urinary retention problems, or pregnant.',
    name: 'Meclizine',
    purpose: 'Motion sickness and vertigo',
    classes: ['sedative'],
    aliases: ['antivert', 'bonine', 'dramamine less drowsy'],
    otc: {
      strengths: '25 mg tablets',
      directions: 'Motion sickness: 25 to 50 mg once a day, starting 1 hour before travel.',
      maxDaily: 'Motion sickness: do not repeat more often than once every 24 hours.',
      limits: 'May cause drowsiness. Ask a doctor before use with other sedating medicines.',
    },
    rx: {
      strengths: '12.5 mg, 25 mg and 50 mg tablets',
      directions: 'Vertigo from the inner ear: 25 to 100 mg a day in divided doses, as the prescriber directs.',
      maxDaily: 'Vertigo: up to 100 mg a day in divided doses, as the prescriber directs.',
      limits: 'Not a substitute for finding the cause of dizziness.',
    },
    sources: [{ label: 'FDA labeling on DailyMed: meclizine', url: dailyMed('meclizine') }],
  },
  {
    id: 'hydrocortisone',
    cautions:
      'Do not use on the face, groin, skin folds, broken or infected skin, or large areas unless directed.',
    name: 'Hydrocortisone (skin)',
    purpose: 'Itchy or inflamed skin (topical steroid)',
    classes: [],
    aliases: ['cortizone', 'hydrocortisone cream'],
    otc: {
      strengths: '0.5% and 1% cream, ointment or lotion',
      directions: 'Adults and children 2 years and over: thin layer on the affected area 3 to 4 times a day. Children under 2: ask a doctor.',
      maxDaily: 'Follow the Drug Facts label.',
      limits: 'Stop and ask a doctor if the condition lasts more than 7 days. Not for the eyes.',
    },
    rx: {
      strengths: '2.5% cream, ointment or lotion, and prescription 1% products',
      directions: 'Thin layer on the affected area 2 to 4 times a day, as the prescriber directs.',
      maxDaily: 'Amount and area are set by the prescriber.',
      limits: 'Duration and use on the face or skin folds are set by the prescriber.',
    },
    sources: [{ label: 'FDA labeling on DailyMed: hydrocortisone', url: dailyMed('hydrocortisone cream') }],
  },
  {
    id: 'lidocaine',
    cautions:
      'Do not combine lidocaine products. Seek help for numbness, dizziness, confusion, seizures or an irregular heartbeat. Ask a clinician if pregnant, older, or with liver disease.',
    name: 'Lidocaine (skin)',
    purpose: 'Local pain relief (topical anesthetic)',
    classes: [],
    aliases: ['lidoderm', 'salonpas lidocaine'],
    otc: {
      strengths: '4% patch, cream or gel',
      directions: 'Use only as the specific product’s Drug Facts say; frequency, amount and wear time differ by cream, gel or patch.',
      maxDaily: 'Do not exceed the labeled amount, number of patches or wear time for that product.',
      limits: 'Stop and ask a doctor if symptoms last more than 7 days. Do not use on broken skin.',
    },
    rx: {
      strengths: '5% patch or ointment, and higher-strength prescription products',
      directions: 'Patch: up to 3 patches at once on the painful area for up to 12 hours within 24 hours.',
      maxDaily: 'Up to 3 patches on intact skin for up to 12 hours in each 24-hour period, then off for at least 12 hours.',
      limits: 'Use only on intact skin; avoid heat on the patch.',
    },
    sources: [{ label: 'FDA labeling on DailyMed: lidocaine', url: dailyMed('lidocaine patch') }],
  },
];

export const dualAvailabilityById = new Map(
  dualAvailabilityMedications.map((entry) => [entry.id, entry]),
);
