// Compact, independently written reference list. Not a complete drug database.
// availability: Prescription | Over the counter. Medicines sold both ways live in
// dualAvailabilityMedications.js and appear here with availability 'Both'.
import { dualAvailabilityMedications } from './dualAvailabilityMedications';

const rows = [
  { id: "apixaban", name: "Apixaban", availability: "Prescription", classes: ["anticoagulant"], purpose: "Blood thinner (anticoagulant)", aliases: ["eliquis"] },
  { id: "rivaroxaban", name: "Rivaroxaban", availability: "Prescription", classes: ["anticoagulant"], purpose: "Blood thinner (anticoagulant)", aliases: ["xarelto"] },
  { id: "dabigatran", name: "Dabigatran", availability: "Prescription", classes: ["anticoagulant"], purpose: "Blood thinner (anticoagulant)", aliases: ["pradaxa"] },
  { id: "edoxaban", name: "Edoxaban", availability: "Prescription", classes: ["anticoagulant"], purpose: "Blood thinner (anticoagulant)", aliases: ["savaysa"] },
  { id: "warfarin", name: "Warfarin", availability: "Prescription", classes: ["anticoagulant", "warfarin"], purpose: "Blood thinner (anticoagulant)", aliases: ["coumadin", "jantoven"] },
  { id: "heparin", name: "Heparin", availability: "Prescription", classes: ["anticoagulant"], purpose: "Blood thinner (anticoagulant)", aliases: [] },
  { id: "enoxaparin", name: "Enoxaparin", availability: "Prescription", classes: ["anticoagulant"], purpose: "Blood thinner (anticoagulant)", aliases: ["lovenox"] },
  { id: "fondaparinux", name: "Fondaparinux", availability: "Prescription", classes: ["anticoagulant"], purpose: "Blood thinner (anticoagulant)", aliases: ["arixtra"] },
  { id: "aspirin", name: "Aspirin", availability: "Over the counter", classes: ["antiplatelet", "salicylate"], purpose: "Pain relief, or blood thinner (antiplatelet)", aliases: ["bayer", "ecotrin", "acetylsalicylic acid"] },
  { id: "clopidogrel", name: "Clopidogrel", availability: "Prescription", classes: ["antiplatelet"], purpose: "Blood thinner (antiplatelet)", aliases: ["plavix"] },
  { id: "prasugrel", name: "Prasugrel", availability: "Prescription", classes: ["antiplatelet"], purpose: "Blood thinner (antiplatelet)", aliases: ["effient"] },
  { id: "ticagrelor", name: "Ticagrelor", availability: "Prescription", classes: ["antiplatelet"], purpose: "Blood thinner (antiplatelet)", aliases: ["brilinta"] },
  { id: "cilostazol", name: "Cilostazol", availability: "Prescription", classes: ["antiplatelet"], purpose: "Blood thinner (antiplatelet)", aliases: ["pletal"] },
  { id: "dipyridamole", name: "Dipyridamole", availability: "Prescription", classes: ["antiplatelet"], purpose: "Blood thinner (antiplatelet)", aliases: ["persantine"] },
  { id: "diclofenac", name: "Diclofenac", availability: "Prescription", classes: ["nsaid"], purpose: "Pain and swelling (NSAID)", aliases: ["voltaren", "cataflam"] },
  { id: "meloxicam", name: "Meloxicam", availability: "Prescription", classes: ["nsaid"], purpose: "Pain and swelling (NSAID)", aliases: ["mobic"] },
  { id: "celecoxib", name: "Celecoxib", availability: "Prescription", classes: ["nsaid"], purpose: "Pain and swelling (NSAID)", aliases: ["celebrex"] },
  { id: "ketorolac", name: "Ketorolac", availability: "Prescription", classes: ["nsaid"], purpose: "Short-term pain relief (NSAID)", aliases: ["toradol"] },
  { id: "indomethacin", name: "Indomethacin", availability: "Prescription", classes: ["nsaid"], purpose: "Pain and swelling (NSAID)", aliases: ["indocin"] },
  { id: "etodolac", name: "Etodolac", availability: "Prescription", classes: ["nsaid"], purpose: "Pain and swelling (NSAID)", aliases: ["lodine"] },
  { id: "acetaminophen", name: "Acetaminophen", availability: "Over the counter", classes: ["acetaminophen"], purpose: "Pain relief and fever", aliases: ["tylenol", "paracetamol"] },
  { id: "fish-oil", name: "Fish oil (omega-3)", availability: "Over the counter", classes: ["bleeding-supplement"], purpose: "Supplement", aliases: ["omega 3", "fish oil"] },
  { id: "ginkgo", name: "Ginkgo biloba", availability: "Over the counter", classes: ["bleeding-supplement"], purpose: "Herbal supplement", aliases: ["ginkgo"] },
  { id: "vitamin-e", name: "Vitamin E", availability: "Over the counter", classes: ["bleeding-supplement"], purpose: "Supplement", aliases: ["alpha tocopherol", "vitamin e"] },
  { id: "st-johns-wort", name: 'St John’s wort', availability: "Over the counter", classes: ["serotonergic", "inducer"], purpose: "Herbal supplement", aliases: ["st johns wort", "st john s wort", "hypericum"] },
  { id: "sertraline", name: "Sertraline", availability: "Prescription", classes: ["ssri", "serotonergic"], purpose: "Depression and anxiety (SSRI antidepressant)", aliases: ["zoloft"] },
  { id: "fluoxetine", name: "Fluoxetine", availability: "Prescription", classes: ["ssri", "serotonergic"], purpose: "Depression and anxiety (SSRI antidepressant)", aliases: ["prozac"] },
  { id: "escitalopram", name: "Escitalopram", availability: "Prescription", classes: ["ssri", "serotonergic"], purpose: "Depression and anxiety (SSRI antidepressant)", aliases: ["lexapro"] },
  { id: "citalopram", name: "Citalopram", availability: "Prescription", classes: ["ssri", "serotonergic"], purpose: "Depression and anxiety (SSRI antidepressant)", aliases: ["celexa"] },
  { id: "paroxetine", name: "Paroxetine", availability: "Prescription", classes: ["ssri", "serotonergic"], purpose: "Depression and anxiety (SSRI antidepressant)", aliases: ["paxil"] },
  { id: "venlafaxine", name: "Venlafaxine", availability: "Prescription", classes: ["ssri", "serotonergic"], purpose: "Depression, anxiety, or nerve pain (SNRI antidepressant)", aliases: ["effexor"] },
  { id: "duloxetine", name: "Duloxetine", availability: "Prescription", classes: ["ssri", "serotonergic"], purpose: "Depression, anxiety, or nerve pain (SNRI antidepressant)", aliases: ["cymbalta"] },
  { id: "trazodone", name: "Trazodone", availability: "Prescription", classes: ["serotonergic", "sedative"], purpose: "Depression or sleep (antidepressant)", aliases: ["desyrel"] },
  { id: "dextromethorphan", name: "Dextromethorphan", availability: "Over the counter", classes: ["serotonergic"], purpose: "Cough", aliases: ["delsym"] },
  { id: "tramadol", name: "Tramadol", availability: "Prescription", classes: ["opioid", "serotonergic"], purpose: "Strong pain medicine (opioid)", aliases: ["ultram"] },
  { id: "oxycodone", name: "Oxycodone", availability: "Prescription", classes: ["opioid"], purpose: "Strong pain medicine (opioid)", aliases: ["oxycontin", "roxicodone", "percocet"] },
  { id: "hydrocodone", name: "Hydrocodone", availability: "Prescription", classes: ["opioid"], purpose: "Strong pain medicine (opioid)", aliases: ["vicodin", "norco"] },
  { id: "morphine", name: "Morphine", availability: "Prescription", classes: ["opioid"], purpose: "Strong pain medicine (opioid)", aliases: ["ms contin"] },
  { id: "hydromorphone", name: "Hydromorphone", availability: "Prescription", classes: ["opioid"], purpose: "Strong pain medicine (opioid)", aliases: ["dilaudid"] },
  { id: "codeine", name: "Codeine", availability: "Prescription", classes: ["opioid"], purpose: "Strong pain medicine or cough (opioid)", aliases: [] },
  { id: "tapentadol", name: "Tapentadol", availability: "Prescription", classes: ["opioid"], purpose: "Strong pain medicine (opioid)", aliases: ["nucynta"] },
  { id: "lorazepam", name: "Lorazepam", availability: "Prescription", classes: ["benzodiazepine", "sedative"], purpose: "Anxiety or sleep (benzodiazepine)", aliases: ["ativan"] },
  { id: "alprazolam", name: "Alprazolam", availability: "Prescription", classes: ["benzodiazepine", "sedative"], purpose: "Anxiety (benzodiazepine)", aliases: ["xanax"] },
  { id: "diazepam", name: "Diazepam", availability: "Prescription", classes: ["benzodiazepine", "sedative"], purpose: "Anxiety or muscle spasms (benzodiazepine)", aliases: ["valium"] },
  { id: "clonazepam", name: "Clonazepam", availability: "Prescription", classes: ["benzodiazepine", "sedative"], purpose: "Anxiety or seizures (benzodiazepine)", aliases: ["klonopin"] },
  { id: "zolpidem", name: "Zolpidem", availability: "Prescription", classes: ["sedative"], purpose: "Sleep aid", aliases: ["ambien"] },
  { id: "gabapentin", name: "Gabapentin", availability: "Prescription", classes: ["sedative"], purpose: "Nerve pain or seizures", aliases: ["neurontin"] },
  { id: "pregabalin", name: "Pregabalin", availability: "Prescription", classes: ["sedative"], purpose: "Nerve pain", aliases: ["lyrica"] },
  { id: "cyclobenzaprine", name: "Cyclobenzaprine", availability: "Prescription", classes: ["sedative"], purpose: "Muscle spasms (muscle relaxant)", aliases: ["flexeril"] },
  { id: "methocarbamol", name: "Methocarbamol", availability: "Prescription", classes: ["sedative"], purpose: "Muscle spasms (muscle relaxant)", aliases: ["robaxin"] },
  { id: "diphenhydramine", name: "Diphenhydramine", availability: "Over the counter", classes: ["sedative"], purpose: "Allergies or sleep (makes you drowsy)", aliases: ["benadryl"] },
  { id: "lisinopril", name: "Lisinopril", availability: "Prescription", classes: ["raas"], purpose: "Blood pressure (ACE inhibitor)", aliases: ["zestril", "prinivil"] },
  { id: "enalapril", name: "Enalapril", availability: "Prescription", classes: ["raas"], purpose: "Blood pressure (ACE inhibitor)", aliases: ["vasotec"] },
  { id: "ramipril", name: "Ramipril", availability: "Prescription", classes: ["raas"], purpose: "Blood pressure (ACE inhibitor)", aliases: ["altace"] },
  { id: "benazepril", name: "Benazepril", availability: "Prescription", classes: ["raas"], purpose: "Blood pressure (ACE inhibitor)", aliases: ["lotensin"] },
  { id: "losartan", name: "Losartan", availability: "Prescription", classes: ["raas"], purpose: "Blood pressure (ARB)", aliases: ["cozaar"] },
  { id: "valsartan", name: "Valsartan", availability: "Prescription", classes: ["raas"], purpose: "Blood pressure (ARB)", aliases: ["diovan"] },
  { id: "spironolactone", name: "Spironolactone", availability: "Prescription", classes: ["k-sparing"], purpose: "Water pill for heart failure (diuretic)", aliases: ["aldactone"] },
  { id: "eplerenone", name: "Eplerenone", availability: "Prescription", classes: ["k-sparing"], purpose: "Water pill for heart failure (diuretic)", aliases: ["inspra"] },
  { id: "potassium-chloride", name: "Potassium chloride", availability: "Prescription", classes: ["potassium-supplement"], purpose: "Potassium supplement", aliases: ["klor con", "k dur"] },
  { id: "furosemide", name: "Furosemide", availability: "Prescription", classes: ["diuretic"], purpose: "Water pill (diuretic)", aliases: ["lasix"] },
  { id: "hydrochlorothiazide", name: "Hydrochlorothiazide", availability: "Prescription", classes: ["diuretic"], purpose: "Water pill (diuretic)", aliases: ["hctz"] },
  { id: "amlodipine", name: "Amlodipine", availability: "Prescription", classes: [], purpose: "Blood pressure", aliases: ["norvasc"] },
  { id: "metoprolol", name: "Metoprolol", availability: "Prescription", classes: [], purpose: "Blood pressure and heart rate", aliases: ["lopressor", "toprol"] },
  { id: "atorvastatin", name: "Atorvastatin", availability: "Prescription", classes: ["statin-3a4"], purpose: "Cholesterol (statin)", aliases: ["lipitor"] },
  { id: "simvastatin", name: "Simvastatin", availability: "Prescription", classes: ["statin-3a4"], purpose: "Cholesterol (statin)", aliases: ["zocor"] },
  { id: "rosuvastatin", name: "Rosuvastatin", availability: "Prescription", classes: [], purpose: "Cholesterol (statin)", aliases: ["crestor"] },
  { id: "pravastatin", name: "Pravastatin", availability: "Prescription", classes: [], purpose: "Cholesterol (statin)", aliases: ["pravachol"] },
  { id: "clarithromycin", name: "Clarithromycin", availability: "Prescription", classes: ["cyp3a4-inhibitor", "warfarin-potentiator"], purpose: "Bacterial infections (antibiotic)", aliases: ["biaxin"] },
  { id: "erythromycin", name: "Erythromycin", availability: "Prescription", classes: ["cyp3a4-inhibitor", "warfarin-potentiator"], purpose: "Bacterial infections (antibiotic)", aliases: [] },
  { id: "fluconazole", name: "Fluconazole", availability: "Prescription", classes: ["cyp3a4-inhibitor", "warfarin-potentiator"], purpose: "Fungal infections (antifungal)", aliases: ["diflucan"] },
  { id: "trimethoprim-sulfamethoxazole", name: "Trimethoprim-sulfamethoxazole", availability: "Prescription", classes: ["warfarin-potentiator"], purpose: "Bacterial infections (antibiotic)", aliases: ["bactrim", "septra", "sulfamethoxazole", "trimethoprim"] },
  { id: "metronidazole", name: "Metronidazole", availability: "Prescription", classes: ["warfarin-potentiator"], purpose: "Bacterial infections (antibiotic)", aliases: ["flagyl"] },
  { id: "ciprofloxacin", name: "Ciprofloxacin", availability: "Prescription", classes: ["warfarin-potentiator"], purpose: "Bacterial infections (antibiotic)", aliases: ["cipro"] },
  { id: "levofloxacin", name: "Levofloxacin", availability: "Prescription", classes: ["warfarin-potentiator"], purpose: "Bacterial infections (antibiotic)", aliases: ["levaquin"] },
  { id: "amiodarone", name: "Amiodarone", availability: "Prescription", classes: ["warfarin-potentiator"], purpose: "Irregular heartbeat", aliases: ["pacerone"] },
  { id: "amoxicillin", name: "Amoxicillin", availability: "Prescription", classes: [], purpose: "Bacterial infections (antibiotic)", aliases: [] },
  { id: "cephalexin", name: "Cephalexin", availability: "Prescription", classes: [], purpose: "Bacterial infections (antibiotic)", aliases: ["keflex"] },
  { id: "doxycycline", name: "Doxycycline", availability: "Prescription", classes: [], purpose: "Bacterial infections (antibiotic)", aliases: [] },
  { id: "nitroglycerin", name: "Nitroglycerin", availability: "Prescription", classes: ["nitrate"], purpose: "Chest pain (nitrate)", aliases: ["nitrostat"] },
  { id: "isosorbide-mononitrate", name: "Isosorbide mononitrate", availability: "Prescription", classes: ["nitrate"], purpose: "Chest pain (nitrate)", aliases: ["imdur"] },
  { id: "sildenafil", name: "Sildenafil", availability: "Prescription", classes: ["pde5"], purpose: "Erection problems, or high blood pressure in the lungs", aliases: ["viagra", "revatio"] },
  { id: "tadalafil", name: "Tadalafil", availability: "Prescription", classes: ["pde5"], purpose: "Erection problems or enlarged prostate", aliases: ["cialis"] },
  { id: "levothyroxine", name: "Levothyroxine", availability: "Prescription", classes: ["levothyroxine"], purpose: "Low thyroid (thyroid hormone)", aliases: ["synthroid"] },
  { id: "calcium-carbonate", name: "Calcium carbonate", availability: "Over the counter", classes: ["binding-mineral"], purpose: "Heartburn (antacid) or calcium supplement", aliases: ["tums", "os cal"] },
  { id: "ferrous-sulfate", name: "Ferrous sulfate (iron)", availability: "Over the counter", classes: ["binding-mineral"], purpose: "Iron supplement", aliases: ["ferrous gluconate"] },
  { id: "prednisone", name: "Prednisone", availability: "Prescription", classes: ["corticosteroid"], purpose: "Swelling and inflammation (steroid)", aliases: ["deltasone"] },
  { id: "methylprednisolone", name: "Methylprednisolone", availability: "Prescription", classes: ["corticosteroid"], purpose: "Swelling and inflammation (steroid)", aliases: ["medrol"] },
  { id: "metformin", name: "Metformin", availability: "Prescription", classes: [], purpose: "Diabetes", aliases: ["glucophage"] },
  { id: "ondansetron", name: "Ondansetron", availability: "Prescription", classes: [], purpose: "Nausea", aliases: ["zofran"] },
  { id: "loratadine", name: "Loratadine", availability: "Over the counter", classes: [], purpose: "Allergies", aliases: ["claritin"] },
  { id: "cetirizine", name: "Cetirizine", availability: "Over the counter", classes: [], purpose: "Allergies", aliases: ["zyrtec"] },
  { id: "guaifenesin", name: "Guaifenesin", availability: "Over the counter", classes: [], purpose: "Chest congestion (loosens mucus)", aliases: ["mucinex"] },
  { id: "docusate", name: "Docusate", availability: "Over the counter", classes: [], purpose: "Stool softener", aliases: ["colace"] },
  { id: "senna", name: "Senna", availability: "Over the counter", classes: [], purpose: "Constipation", aliases: ["senokot"] },
  { id: "polyethylene-glycol", name: "Polyethylene glycol", availability: "Over the counter", classes: [], purpose: "Constipation", aliases: ["miralax"] },
];

const normalize = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const dualRows = dualAvailabilityMedications.map((entry) => ({
  id: entry.id,
  name: entry.name,
  availability: 'Both',
  classes: entry.classes,
  purpose: entry.purpose,
  aliases: entry.aliases,
}));

export const formulary = [...rows, ...dualRows].map((row) => ({
  ...row,
  terms: [row.id.replace(/-/g, ' '), row.name, ...row.aliases].map(normalize),
}));

const formularyById = new Map(formulary.map((entry) => [entry.id, entry]));

export const availabilityOrder = ['Prescription', 'Over the counter'];

export function resolveIngredients(medication) {
  const found = new Map();
  const byId = formularyById.get(medication?.ingredientId ?? medication?.id);
  if (byId) found.set(byId.id, byId);

  const text = ` ${normalize(medication?.name)} `;
  formulary.forEach((entry) => {
    if (entry.terms.some((term) => term && text.includes(` ${term} `))) found.set(entry.id, entry);
  });
  return [...found.values()];
}

export function searchFormulary(query, limit = 20) {
  const term = normalize(query);
  if (term.length < 2) return [];
  return formulary
    .filter(
      (entry) =>
        entry.terms.some((candidate) => candidate.includes(term)) ||
        normalize(entry.purpose).includes(term),
    )
    .slice(0, limit);
}
