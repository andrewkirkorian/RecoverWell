import { resolveIngredients } from './medicationFormulary';

// Rules match an ingredient id or class tag. The first matching rule per pair wins,
// so specific rules come before general ones. Wording is independently written.
const rules = [
  {
    a: 'apixaban',
    b: 'ibuprofen',
    level: 'High',
    title: 'Bleeding risk',
    description:
      'Ibuprofen may increase bleeding risk when taken with apixaban. Confirm this combination with the prescribing clinician or pharmacist.',
  },
  {
    a: 'apixaban',
    b: 'aspirin',
    level: 'High',
    title: 'Bleeding risk',
    description:
      'Aspirin may add to apixaban’s blood-thinning effect and increase bleeding risk. Confirm the combination with the care team.',
  },
  {
    a: 'warfarin',
    b: 'ibuprofen',
    level: 'High',
    title: 'Bleeding risk',
    description:
      'Ibuprofen can increase bleeding risk with warfarin. Ask the prescriber or pharmacist before using them together.',
  },
  {
    a: 'warfarin',
    b: 'warfarin-potentiator',
    level: 'High',
    title: 'Warfarin effect may increase',
    description: (a, b) =>
      `${b} may raise warfarin effect and bleeding risk. Prompt prescriber review and INR monitoring may be needed.`,
  },
  {
    a: 'warfarin',
    b: 'acetaminophen',
    level: 'Moderate',
    title: 'Warfarin effect may increase',
    description:
      'Regular, repeated acetaminophen use may raise INR in people taking warfarin. Tell the prescriber how much is taken.',
  },
  {
    a: 'warfarin',
    b: 'inducer',
    level: 'High',
    title: 'Blood thinner may work less well',
    description: (a, b) =>
      `${b} can lower the effect of anticoagulants. Do not start or stop it without prescriber or pharmacist advice.`,
  },
  {
    a: 'anticoagulant',
    b: 'inducer',
    level: 'High',
    title: 'Blood thinner may work less well',
    description: (a, b) =>
      `${b} can lower the effect of ${a}. Ask the prescriber or pharmacist before combining them.`,
  },
  {
    a: 'anticoagulant',
    b: 'anticoagulant',
    level: 'High',
    title: 'Multiple blood thinners',
    description: (a, b) =>
      `${a} and ${b} are both anticoagulants. Using two together greatly raises bleeding risk and is usually only done under close clinical direction.`,
  },
  {
    a: 'anticoagulant',
    b: 'antiplatelet',
    level: 'High',
    title: 'Bleeding risk',
    description: (a, b) =>
      `${b} may add to the blood-thinning effect of ${a} and increase bleeding risk. Confirm the combination with the care team.`,
  },
  {
    a: 'antiplatelet',
    b: 'antiplatelet',
    level: 'High',
    title: 'Multiple blood thinners',
    description: (a, b) =>
      `${a} and ${b} both reduce clotting. Some combinations are intentional, but bleeding risk rises; confirm with the prescriber.`,
  },
  {
    a: 'anticoagulant',
    b: 'nsaid',
    level: 'High',
    title: 'Bleeding risk',
    description: (a, b) =>
      `${b} may increase bleeding risk when taken with ${a}. Confirm this combination with the prescribing clinician or pharmacist.`,
  },
  {
    a: 'anticoagulant',
    b: 'bleeding-supplement',
    level: 'Moderate',
    title: 'Bleeding risk',
    description: (a, b) =>
      `${b} may affect clotting and add to the bleeding risk of ${a}. Ask a pharmacist before using it.`,
  },
  {
    a: 'anticoagulant',
    b: 'ssri',
    level: 'Moderate',
    title: 'Bleeding risk',
    description: (a, b) =>
      `${b} can modestly increase bleeding risk when combined with ${a}. Mention it to the prescriber.`,
  },
  {
    a: 'antiplatelet',
    b: 'nsaid',
    level: 'Moderate',
    title: 'Bleeding and stomach risk',
    description: (a, b) =>
      `${b} with ${a} may increase bleeding, especially in the stomach. Some NSAIDs can also interfere with aspirin’s heart-protective effect; ask a pharmacist.`,
  },
  {
    a: 'salicylate',
    b: 'nsaid',
    level: 'Moderate',
    title: 'Bleeding and stomach risk',
    description: (a, b) => `${a} with ${b} may increase stomach bleeding risk. Ask a pharmacist about timing and need.`,
  },
  {
    a: 'antiplatelet',
    b: 'bleeding-supplement',
    level: 'Moderate',
    title: 'Bleeding risk',
    description: (a, b) => `${b} may add to the bleeding risk of ${a}. Ask a pharmacist before using it.`,
  },
  {
    a: 'ssri',
    b: 'nsaid',
    level: 'Moderate',
    title: 'Bleeding risk',
    description: (a, b) =>
      `Combining an SSRI or SNRI such as ${a} with an NSAID such as ${b} may increase bleeding risk.`,
  },
  {
    a: 'ssri',
    b: 'antiplatelet',
    level: 'Moderate',
    title: 'Bleeding risk',
    description: (a, b) => `${a} with ${b} may increase bleeding risk.`,
  },
  {
    a: 'ssri',
    b: 'tramadol',
    level: 'High',
    title: 'Serotonin and seizure risks',
    description: (a) =>
      `Taking tramadol with ${a} may increase the risk of serotonin syndrome and seizures. Contact the prescriber or pharmacist for review.`,
  },
  {
    a: 'serotonergic',
    b: 'serotonergic',
    level: 'Moderate',
    title: 'Serotonin syndrome risk',
    description: (a, b) =>
      `${a} and ${b} can each raise serotonin. Together they may increase the risk of serotonin syndrome; ask the prescriber or pharmacist.`,
  },
  {
    a: 'opioid',
    b: 'benzodiazepine',
    level: 'High',
    title: 'Excess sedation and breathing risk',
    description: (a, b) =>
      `Combining an opioid such as ${a} with ${b} can cause dangerous sedation and slowed breathing. Use together only under explicit prescriber direction.`,
  },
  {
    a: 'opioid',
    b: 'sedative',
    level: 'Moderate',
    title: 'Extra drowsiness and slowed breathing',
    description: (a, b) =>
      `${b} may add to the sedation of ${a}. Avoid alcohol and ask the prescriber or pharmacist about the combination.`,
  },
  {
    a: 'opioid',
    b: 'opioid',
    level: 'High',
    title: 'Multiple opioids',
    description: (a, b) =>
      `${a} and ${b} are both opioids. Taking more than one raises overdose and breathing risk; confirm with the prescriber.`,
  },
  {
    a: 'lisinopril',
    b: 'ibuprofen',
    level: 'Moderate',
    title: 'Kidney function and blood pressure',
    description:
      'Ibuprofen can affect kidney function and blood pressure when combined with lisinopril. The risk may be higher with dehydration or kidney disease.',
  },
  {
    a: 'raas',
    b: 'nsaid',
    level: 'Moderate',
    title: 'Kidney function and blood pressure',
    description: (a, b) =>
      `${b} can affect kidney function and blood pressure when combined with ${a}. The risk may be higher with dehydration or kidney disease.`,
  },
  {
    a: 'diuretic',
    b: 'nsaid',
    level: 'Moderate',
    title: 'Kidney strain and reduced diuretic effect',
    description: (a, b) =>
      `${b} may blunt the effect of ${a} and strain the kidneys, especially with dehydration.`,
  },
  {
    a: 'raas',
    b: 'potassium-supplement',
    level: 'Moderate',
    title: 'High potassium',
    description: (a, b) =>
      `${a} and ${b} together may raise blood potassium. Confirm the combination and any monitoring plan with the care team.`,
  },
  {
    a: 'raas',
    b: 'k-sparing',
    level: 'High',
    title: 'High potassium',
    description: (a, b) =>
      `${a} and ${b} can both raise blood potassium. The combination may be prescribed, but requires clinician review and appropriate monitoring.`,
  },
  {
    a: 'k-sparing',
    b: 'potassium-supplement',
    level: 'High',
    title: 'High potassium',
    description: (a, b) => `${a} with ${b} may raise blood potassium too far. Clinician review is needed.`,
  },
  {
    a: 'statin-3a4',
    b: 'cyp3a4-inhibitor',
    level: 'High',
    title: 'Muscle injury risk',
    description: (a, b) =>
      `${b} can raise ${a} levels and the risk of muscle injury. The prescriber may need to adjust treatment.`,
  },
  {
    a: 'nitrate',
    b: 'pde5',
    level: 'High',
    title: 'Dangerously low blood pressure',
    description: (a, b) =>
      `Nitrates such as ${a} must not be combined with ${b} because blood pressure can drop dangerously. Seek urgent clinical guidance.`,
  },
  {
    a: 'levothyroxine',
    b: 'binding-mineral',
    level: 'Moderate',
    title: 'Reduced thyroid medicine absorption',
    description: (a, b) =>
      `${b} can reduce levothyroxine absorption. Ask a pharmacist about dose timing and separation.`,
  },
  {
    a: 'corticosteroid',
    b: 'nsaid',
    level: 'Moderate',
    title: 'Stomach bleeding risk',
    description: (a, b) => `${a} with ${b} may increase the risk of stomach irritation and bleeding.`,
  },
  {
    a: 'nsaid',
    b: 'nsaid',
    level: 'Moderate',
    title: 'Duplicate pain relievers (NSAIDs)',
    description: (a, b) =>
      `${a} and ${b} are both NSAIDs. Taking two adds side-effect risk without extra benefit; ask a pharmacist.`,
  },
];

const bleedingTags = ['anticoagulant', 'antiplatelet', 'nsaid', 'bleeding-supplement'];

const tokensFor = (entry) => new Set([entry.id, ...entry.classes]);

export function screenMedications(medications, comorbidities = '') {
  const entries = new Map();
  const unscreened = [];
  medications.forEach((medication) => {
    const resolved = resolveIngredients(medication);
    if (resolved.length === 0) unscreened.push(medication.name);
    resolved.forEach((entry) => entries.set(entry.id, entry));
  });

  const list = [...entries.values()];
  const interactions = [];

  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) {
      const first = list[i];
      const second = list[j];
      const firstTokens = tokensFor(first);
      const secondTokens = tokensFor(second);

      for (const rule of rules) {
        let a = null;
        let b = null;
        if (firstTokens.has(rule.a) && secondTokens.has(rule.b)) {
          a = first;
          b = second;
        } else if (secondTokens.has(rule.a) && firstTokens.has(rule.b)) {
          a = second;
          b = first;
        }
        if (!a) continue;

        interactions.push({
          key: `${a.id}-${b.id}`,
          level: rule.level,
          title: rule.title,
          description:
            typeof rule.description === 'function'
              ? rule.description(a.name, b.name)
              : rule.description,
          sourceDrug: a.id,
        });
        break;
      }
    }
  }

  const bleeders = list.filter((entry) => bleedingTags.some((tag) => entry.classes.includes(tag)));
  if (bleeders.length >= 3) {
    interactions.unshift({
      key: 'bleeding-stack',
      level: 'High',
      title: 'Several medicines that affect bleeding',
      description: `${bleeders.map((entry) => entry.name).join(', ')} can each raise bleeding risk. Together the risk is higher; ask a pharmacist or prescriber to review the full list promptly.`,
      sourceDrug: bleeders[0].id,
    });
  }

  const hasKidneyDisease = /\b(ckd|chronic kidney disease|kidney disease)\b/i.test(comorbidities);
  const contraindications = hasKidneyDisease
    ? list
        .filter((entry) => entry.classes.includes('nsaid'))
        .map((entry) => ({
          title: 'Kidney disease noted in patient profile',
          medication: entry.name,
          description: `NSAIDs such as ${entry.name.toLowerCase()} may worsen kidney function. Avoid use unless the patient’s clinician specifically approves it.`,
        }))
    : [];

  return { interactions, contraindications, unscreened };
}
