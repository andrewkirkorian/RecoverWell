import { resolveIngredients } from './medicationFormulary';

// Rules match an ingredient id or class tag. The first matching rule per pair wins,
// so specific rules come before general ones. Wording is independently written.
const rules = [
  {
    a: 'apixaban',
    b: 'ibuprofen',
    level: 'High',
    title: 'Higher risk of bleeding',
    description:
      'Ibuprofen may raise the risk of bleeding when taken with apixaban. Check with the doctor who prescribed it or a pharmacist before taking them together.',
  },
  {
    a: 'apixaban',
    b: 'aspirin',
    level: 'High',
    title: 'Higher risk of bleeding',
    description:
      'Aspirin may add to apixaban’s blood-thinning effect and raise the risk of bleeding. Check with your care team before taking them together.',
  },
  {
    a: 'warfarin',
    b: 'ibuprofen',
    level: 'High',
    title: 'Higher risk of bleeding',
    description:
      'Ibuprofen can raise the risk of bleeding when taken with warfarin. Ask your doctor or pharmacist before taking them together.',
  },
  {
    a: 'warfarin',
    b: 'warfarin-potentiator',
    level: 'High',
    title: 'Warfarin may get too strong',
    description: (a, b) =>
      `${b} may make warfarin stronger and raise the risk of bleeding. Talk to your doctor soon. You may need extra blood clotting tests (INR).`,
  },
  {
    a: 'warfarin',
    b: 'acetaminophen',
    level: 'Moderate',
    title: 'Warfarin may get too strong',
    description:
      'Taking acetaminophen often, day after day, may make warfarin stronger and change your blood clotting test (INR). Tell your doctor how much you take.',
  },
  {
    a: 'warfarin',
    b: 'inducer',
    level: 'High',
    title: 'Blood thinner may not work as well',
    description: (a, b) =>
      `${b} can make blood thinners work less well. Do not start or stop it without asking your doctor or pharmacist.`,
  },
  {
    a: 'anticoagulant',
    b: 'inducer',
    level: 'High',
    title: 'Blood thinner may not work as well',
    description: (a, b) =>
      `${b} can make ${a} work less well. Ask your doctor or pharmacist before taking them together.`,
  },
  {
    a: 'anticoagulant',
    b: 'anticoagulant',
    level: 'High',
    title: 'More than one blood thinner',
    description: (a, b) =>
      `${a} and ${b} are both blood thinners. Taking two together greatly raises the risk of bleeding. This is usually only done when a doctor is watching closely.`,
  },
  {
    a: 'anticoagulant',
    b: 'antiplatelet',
    level: 'High',
    title: 'Higher risk of bleeding',
    description: (a, b) =>
      `${b} may add to the blood-thinning effect of ${a} and raise the risk of bleeding. Check with your care team before taking them together.`,
  },
  {
    a: 'antiplatelet',
    b: 'antiplatelet',
    level: 'High',
    title: 'More than one blood thinner',
    description: (a, b) =>
      `${a} and ${b} both make it harder for blood to clot. Doctors sometimes use them together on purpose, but the risk of bleeding goes up. Check with your doctor.`,
  },
  {
    a: 'anticoagulant',
    b: 'nsaid',
    level: 'High',
    title: 'Higher risk of bleeding',
    description: (a, b) =>
      `${b} may raise the risk of bleeding when taken with ${a}. Check with the doctor who prescribed it or a pharmacist before taking them together.`,
  },
  {
    a: 'anticoagulant',
    b: 'bleeding-supplement',
    level: 'Moderate',
    title: 'Higher risk of bleeding',
    description: (a, b) =>
      `${b} may affect blood clotting and add to the bleeding risk of ${a}. Ask a pharmacist before taking it.`,
  },
  {
    a: 'anticoagulant',
    b: 'ssri',
    level: 'Moderate',
    title: 'Higher risk of bleeding',
    description: (a, b) =>
      `${b} can slightly raise the risk of bleeding when taken with ${a}. Tell your doctor you take both.`,
  },
  {
    a: 'antiplatelet',
    b: 'nsaid',
    level: 'Moderate',
    title: 'Risk of bleeding and stomach problems',
    description: (a, b) =>
      `${b} with ${a} may raise the risk of bleeding, especially in the stomach. Some pain relievers like ibuprofen can also make aspirin less able to protect your heart. Ask a pharmacist.`,
  },
  {
    a: 'salicylate',
    b: 'nsaid',
    level: 'Moderate',
    title: 'Risk of bleeding and stomach problems',
    description: (a, b) => `${a} with ${b} may raise the risk of bleeding in the stomach. Ask a pharmacist when to take each one, and if you need both.`,
  },
  {
    a: 'antiplatelet',
    b: 'bleeding-supplement',
    level: 'Moderate',
    title: 'Higher risk of bleeding',
    description: (a, b) => `${b} may add to the bleeding risk of ${a}. Ask a pharmacist before taking it.`,
  },
  {
    a: 'ssri',
    b: 'nsaid',
    level: 'Moderate',
    title: 'Higher risk of bleeding',
    description: (a, b) =>
      `Taking an antidepressant like ${a} with a pain reliever like ${b} may raise the risk of bleeding.`,
  },
  {
    a: 'ssri',
    b: 'antiplatelet',
    level: 'Moderate',
    title: 'Higher risk of bleeding',
    description: (a, b) => `${a} with ${b} may raise the risk of bleeding.`,
  },
  {
    a: 'ssri',
    b: 'tramadol',
    level: 'High',
    title: 'Risk of a serious reaction and seizures',
    description: (a) =>
      `Taking tramadol with ${a} may raise the risk of seizures and of serotonin syndrome (a serious reaction that can cause shaking, fever, and a racing heart). Contact your doctor or pharmacist.`,
  },
  {
    a: 'serotonergic',
    b: 'serotonergic',
    level: 'Moderate',
    title: 'Risk of a serious reaction (serotonin syndrome)',
    description: (a, b) =>
      `${a} and ${b} both raise serotonin, a chemical in the brain. Together they may cause serotonin syndrome (a serious reaction that can cause shaking, fever, and a racing heart). Ask your doctor or pharmacist.`,
  },
  {
    a: 'opioid',
    b: 'benzodiazepine',
    level: 'High',
    title: 'Too sleepy and slowed breathing',
    description: (a, b) =>
      `Taking a strong pain medicine (opioid) like ${a} with ${b} can make you dangerously sleepy and slow your breathing. Only take them together if your doctor has clearly told you to.`,
  },
  {
    a: 'opioid',
    b: 'sedative',
    level: 'Moderate',
    title: 'Extra sleepiness and slowed breathing',
    description: (a, b) =>
      `${b} may make ${a} cause more sleepiness. Do not drink alcohol, and ask your doctor or pharmacist about taking them together.`,
  },
  {
    a: 'opioid',
    b: 'opioid',
    level: 'High',
    title: 'More than one strong pain medicine (opioid)',
    description: (a, b) =>
      `${a} and ${b} are both opioids. Taking more than one raises the risk of overdose and slowed breathing. Check with your doctor.`,
  },
  {
    a: 'lisinopril',
    b: 'ibuprofen',
    level: 'Moderate',
    title: 'Kidneys and blood pressure',
    description:
      'Ibuprofen with lisinopril can affect your kidneys and blood pressure. The risk may be higher if you are dehydrated (low on fluids) or have kidney disease.',
  },
  {
    a: 'raas',
    b: 'nsaid',
    level: 'Moderate',
    title: 'Kidneys and blood pressure',
    description: (a, b) =>
      `${b} with ${a} can affect your kidneys and blood pressure. The risk may be higher if you are dehydrated (low on fluids) or have kidney disease.`,
  },
  {
    a: 'diuretic',
    b: 'nsaid',
    level: 'Moderate',
    title: 'Strain on kidneys, and water pill may work less well',
    description: (a, b) =>
      `${b} may make ${a} (a water pill) work less well and strain the kidneys, especially if you are dehydrated.`,
  },
  {
    a: 'raas',
    b: 'potassium-supplement',
    level: 'Moderate',
    title: 'Potassium may get too high',
    description: (a, b) =>
      `${a} and ${b} together may raise the potassium in your blood. Check with your care team about taking both and about any blood tests you need.`,
  },
  {
    a: 'raas',
    b: 'k-sparing',
    level: 'High',
    title: 'Potassium may get too high',
    description: (a, b) =>
      `${a} and ${b} can both raise the potassium in your blood. Doctors sometimes prescribe them together, but you need a doctor to check and regular blood tests.`,
  },
  {
    a: 'k-sparing',
    b: 'potassium-supplement',
    level: 'High',
    title: 'Potassium may get too high',
    description: (a, b) => `${a} with ${b} may raise the potassium in your blood too much. Have a doctor check this.`,
  },
  {
    a: 'statin-3a4',
    b: 'cyp3a4-inhibitor',
    level: 'High',
    title: 'Risk of muscle damage',
    description: (a, b) =>
      `${b} can raise the amount of ${a} in your body and the risk of muscle damage. Your doctor may need to change your medicines.`,
  },
  {
    a: 'nitrate',
    b: 'pde5',
    level: 'High',
    title: 'Blood pressure can drop dangerously low',
    description: (a, b) =>
      `Chest pain medicines like ${a} must never be taken with ${b}, because blood pressure can drop dangerously low. Get medical advice right away.`,
  },
  {
    a: 'levothyroxine',
    b: 'binding-mineral',
    level: 'Moderate',
    title: 'Thyroid medicine may not absorb well',
    description: (a, b) =>
      `${b} can stop your body from absorbing levothyroxine well. Ask a pharmacist how far apart to take them.`,
  },
  {
    a: 'corticosteroid',
    b: 'nsaid',
    level: 'Moderate',
    title: 'Risk of stomach bleeding',
    description: (a, b) => `${a} with ${b} may raise the risk of an upset stomach and stomach bleeding.`,
  },
  {
    a: 'nsaid',
    b: 'nsaid',
    level: 'Moderate',
    title: 'Two of the same kind of pain reliever (NSAIDs)',
    description: (a, b) =>
      `${a} and ${b} are the same kind of pain reliever (NSAIDs). Taking two adds side effects without helping more. Ask a pharmacist.`,
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
      description: `${bleeders.map((entry) => entry.name).join(', ')} can each raise the risk of bleeding. Together the risk is higher. Ask a pharmacist or your doctor to look over your full list soon.`,
      sourceDrug: bleeders[0].id,
    });
  }

  const hasKidneyDisease = /\b(ckd|chronic kidney disease|kidney disease)\b/i.test(comorbidities);
  const contraindications = hasKidneyDisease
    ? list
        .filter((entry) => entry.classes.includes('nsaid'))
        .map((entry) => ({
          title: 'You noted kidney disease in your health history',
          medication: entry.name,
          description: `Pain relievers called NSAIDs, like ${entry.name.toLowerCase()}, may make kidney disease worse. Do not take it unless your doctor says it is okay.`,
        }))
    : [];

  return { interactions, contraindications, unscreened };
}
