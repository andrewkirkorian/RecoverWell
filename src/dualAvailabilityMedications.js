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
      'Ask a doctor first if you are pregnant (especially 20 weeks or more), are 65 or older, have kidney disease, stomach ulcers or bleeding problems, heart disease or high blood pressure, or take blood thinners, steroids, aspirin, or another NSAID pain reliever.',
    name: 'Ibuprofen',
    purpose: 'Pain and swelling (NSAID)',
    classes: ['nsaid'],
    aliases: ['advil', 'motrin'],
    otc: {
      strengths: '200 mg tablets or capsules',
      directions:
        '1 tablet every 4 to 6 hours while symptoms last; 2 tablets may be used if 1 does not help.',
      maxDaily: 'No more than 1,200 mg (6 tablets) in 24 hours unless a doctor directs otherwise.',
      limits: 'Ask a doctor if you need it for pain for more than 10 days, or for fever for more than 3 days.',
    },
    rx: {
      strengths: '400 mg, 600 mg and 800 mg tablets',
      directions:
        'Mild to moderate pain: 400 mg every 4 to 6 hours as needed. Arthritis: 1,200 to 3,200 mg a day split into 3 or 4 doses.',
      maxDaily: 'The prescription label allows up to 3,200 mg in 24 hours. Your doctor sets your limit.',
      limits: 'Take the smallest amount that works, for the shortest time your doctor says.',
    },
    sources: [{ label: 'FDA labeling on DailyMed: ibuprofen', url: dailyMed('ibuprofen') }],
  },
  {
    id: 'naproxen',
    cautions:
      'Do not take with ibuprofen or other NSAID pain relievers unless told to. Ask a doctor first if you are pregnant, are 65 or older, have kidney disease, stomach ulcers or bleeding problems, or heart disease, or take blood thinners.',
    name: 'Naproxen',
    purpose: 'Pain and swelling (NSAID)',
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
        'Arthritis: 250 to 500 mg twice a day. Sudden, short-term pain: 500 mg to start, then 500 mg every 12 hours or 250 mg every 6 to 8 hours.',
      maxDaily: 'Short-term pain: up to 1,250 mg on the first day, then usually no more than 1,000 mg a day unless your doctor says otherwise.',
      limits: 'Your doctor adjusts the dose based on your age and how well your kidneys and liver work.',
    },
    sources: [{ label: 'FDA labeling on DailyMed: naproxen', url: dailyMed('naproxen') }],
  },
  {
    id: 'omeprazole',
    cautions:
      'Do not take more of it, or take it for longer, without asking your doctor. Ask a doctor first if you are pregnant or breastfeeding, under 18, have liver disease, or take blood thinners or other medicines that may not mix with it.',
    name: 'Omeprazole',
    purpose: 'Lowers stomach acid (proton pump inhibitor)',
    classes: [],
    aliases: ['prilosec'],
    otc: {
      strengths: '20 mg delayed-release tablets',
      directions: '1 tablet a day with water before eating, for 14 days, for frequent heartburn.',
      maxDaily: '1 tablet in 24 hours.',
      limits: 'Do not use for more than 14 days in a row. You can repeat the 14 days no more than once every 4 months.',
    },
    rx: {
      strengths: '10 mg, 20 mg and 40 mg delayed-release capsules',
      directions:
        'Acid reflux (GERD): often 20 mg once a day. Damage to the food pipe from acid (erosive esophagitis): often 20 to 40 mg once a day for 4 to 8 weeks. Higher or twice-a-day doses depend on the condition.',
      maxDaily: 'Your doctor sets this based on what is being treated.',
      limits: 'Your doctor decides how long you take it and checks how it is going.',
    },
    sources: [{ label: 'FDA labeling on DailyMed: omeprazole', url: dailyMed('omeprazole') }],
  },
  {
    id: 'esomeprazole',
    cautions:
      'Do not take more of it, or take it for longer, without asking your doctor. Ask a doctor first if you are pregnant or breastfeeding, under 18, have liver disease, or take medicines that may not mix with it.',
    name: 'Esomeprazole',
    purpose: 'Lowers stomach acid (proton pump inhibitor)',
    classes: [],
    aliases: ['nexium'],
    otc: {
      strengths: '20 mg delayed-release capsules or tablets',
      directions: '1 capsule a day with water before eating, for 14 days.',
      maxDaily: '1 capsule in 24 hours.',
      limits: 'Do not use for more than 14 days in a row. You can repeat the 14 days no more than once every 4 months.',
    },
    rx: {
      strengths: '20 mg and 40 mg delayed-release capsules',
      directions: 'Acid reflux (GERD): often 20 mg once a day for 4 to 8 weeks. Damage to the food pipe from acid (erosive esophagitis) may need 20 or 40 mg.',
      maxDaily: 'Your doctor sets this based on what is being treated.',
      limits: 'Your doctor decides how long you take it and checks how it is going.',
    },
    sources: [{ label: 'FDA labeling on DailyMed: esomeprazole', url: dailyMed('esomeprazole') }],
  },
  {
    id: 'lansoprazole',
    cautions:
      'Do not take more of it, or take it for longer, without asking your doctor. Ask a doctor first if you are pregnant or breastfeeding, under 18, have liver disease, or take medicines that may not mix with it.',
    name: 'Lansoprazole',
    purpose: 'Lowers stomach acid (proton pump inhibitor)',
    classes: [],
    aliases: ['prevacid'],
    otc: {
      strengths: '15 mg delayed-release capsules',
      directions: '1 capsule a day with water before eating, for 14 days.',
      maxDaily: '1 capsule in 24 hours.',
      limits: 'Do not use for more than 14 days in a row. You can repeat the 14 days no more than once every 4 months.',
    },
    rx: {
      strengths: '15 mg and 30 mg delayed-release capsules',
      directions: 'Acid reflux (GERD): often 15 mg once a day. Damage to the food pipe from acid (erosive esophagitis): often 30 mg once a day, for up to 8 weeks.',
      maxDaily: 'Your doctor sets this based on what is being treated.',
      limits: 'Your doctor decides how long you take it and checks how it is going.',
    },
    sources: [{ label: 'FDA labeling on DailyMed: lansoprazole', url: dailyMed('lansoprazole') }],
  },
  {
    id: 'famotidine',
    cautions:
      'The right dose depends on the condition and how well your kidneys work. Ask a doctor first if you are 65 or older, pregnant or breastfeeding, or have kidney disease.',
    name: 'Famotidine',
    purpose: 'Lowers stomach acid (H2 blocker)',
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
        'Ulcer in the upper gut (duodenal ulcer): 40 mg once a day at bedtime or 20 mg twice a day. Acid reflux (GERD): 20 mg twice a day for up to 6 weeks.',
      maxDaily: 'Your doctor sets this. People whose kidneys do not work as well take less.',
      limits: 'Your doctor decides how long you take it.',
    },
    sources: [{ label: 'FDA labeling on DailyMed: famotidine', url: dailyMed('famotidine') }],
  },
  {
    id: 'loperamide',
    cautions:
      'Never take more than the label says. Higher doses can cause heart rhythm problems that can be deadly. Do not use it if your stool is bloody or black, or if you have a fever or bad belly pain or swelling. Ask a doctor first if you are pregnant, older, or take medicine for your heart rhythm.',
    name: 'Loperamide',
    purpose: 'Diarrhea',
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
      directions: 'Sudden diarrhea: 4 mg to start, then 2 mg after each loose stool.',
      maxDaily: 'The prescription label allows up to 16 mg in 24 hours. Your doctor sets your limit.',
      limits: 'Taking more than the label says can cause serious heart rhythm problems.',
    },
    sources: [{ label: 'FDA labeling on DailyMed: loperamide', url: dailyMed('loperamide') }],
  },
  {
    id: 'meclizine',
    cautions:
      'Can make you sleepy. Avoid alcohol, and do not drive until you know how it affects you. Ask a doctor first if you are older (it can raise the risk of falls), are pregnant, or have glaucoma, prostate problems, or trouble peeing.',
    name: 'Meclizine',
    purpose: 'Motion sickness and spinning dizziness (vertigo)',
    classes: ['sedative'],
    aliases: ['antivert', 'bonine', 'dramamine less drowsy'],
    otc: {
      strengths: '25 mg tablets',
      directions: 'Motion sickness: 25 to 50 mg once a day, starting 1 hour before travel.',
      maxDaily: 'Motion sickness: do not repeat more often than once every 24 hours.',
      limits: 'May make you sleepy. Ask a doctor before taking it with other medicines that make you sleepy.',
    },
    rx: {
      strengths: '12.5 mg, 25 mg and 50 mg tablets',
      directions: 'Spinning dizziness from the inner ear (vertigo): 25 to 100 mg a day, split into smaller doses, as your doctor directs.',
      maxDaily: 'Vertigo: up to 100 mg a day, split into smaller doses, as your doctor directs.',
      limits: 'It does not replace finding out what is causing the dizziness.',
    },
    sources: [{ label: 'FDA labeling on DailyMed: meclizine', url: dailyMed('meclizine') }],
  },
  {
    id: 'hydrocortisone',
    cautions:
      'Do not use on the face, groin, skin folds, broken or infected skin, or large areas unless a doctor tells you to.',
    name: 'Hydrocortisone (skin)',
    purpose: 'Itchy, red, or irritated skin (steroid cream)',
    classes: [],
    aliases: ['cortizone', 'hydrocortisone cream'],
    otc: {
      strengths: '0.5% and 1% cream, ointment or lotion',
      directions: 'Adults and children 2 and older: put a thin layer on the area 3 to 4 times a day. Children under 2: ask a doctor.',
      maxDaily: 'Follow the Drug Facts label on the package.',
      limits: 'Stop and ask a doctor if it lasts more than 7 days. Keep it out of your eyes.',
    },
    rx: {
      strengths: '2.5% cream, ointment or lotion, and prescription 1% products',
      directions: 'Put a thin layer on the area 2 to 4 times a day, as your doctor directs.',
      maxDaily: 'Your doctor tells you how much to use and where.',
      limits: 'Your doctor decides how long to use it and whether it can go on your face or skin folds.',
    },
    sources: [{ label: 'FDA labeling on DailyMed: hydrocortisone', url: dailyMed('hydrocortisone cream') }],
  },
  {
    id: 'lidocaine',
    cautions:
      'Do not use more than one lidocaine product at a time. Get help right away for numbness, dizziness, confusion, seizures, or an uneven heartbeat. Ask a doctor first if you are pregnant, older, or have liver disease.',
    name: 'Lidocaine (skin)',
    purpose: 'Numbs pain in one spot (numbing cream or patch)',
    classes: [],
    aliases: ['lidoderm', 'salonpas lidocaine'],
    otc: {
      strengths: '4% patch, cream or gel',
      directions: 'Use it only as your product’s Drug Facts label says. How often, how much, and how long to wear it are different for creams, gels, and patches.',
      maxDaily: 'Do not use more than the label says, use more patches, or wear it longer.',
      limits: 'Stop and ask a doctor if symptoms last more than 7 days. Do not use on broken skin.',
    },
    rx: {
      strengths: '5% patch or ointment, and higher-strength prescription products',
      directions: 'Patch: up to 3 patches at a time on the painful area, worn for up to 12 hours in each 24 hours.',
      maxDaily: 'Up to 3 patches on unbroken skin for up to 12 hours in each 24 hours, then take them off for at least 12 hours.',
      limits: 'Use only on unbroken skin. Do not put heat (like a heating pad) on the patch.',
    },
    sources: [{ label: 'FDA labeling on DailyMed: lidocaine', url: dailyMed('lidocaine patch') }],
  },
];

export const dualAvailabilityById = new Map(
  dualAvailabilityMedications.map((entry) => [entry.id, entry]),
);
