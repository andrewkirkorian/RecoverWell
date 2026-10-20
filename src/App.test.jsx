import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function createDemoProfile(name = 'Alex') {
  fireEvent.change(screen.getByLabelText('Display name'), { target: { value: name } });
  fireEvent.click(screen.getByRole('button', { name: /create demo profile/i }));
}

function openSection(section, button) {
  fireEvent.click(screen.getByText(section));
  fireEvent.click(screen.getByRole('button', { name: button }));
}

const textPattern = (text) => new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+'), 'i');

test('starts with clearly labeled demo sign-up and does not request credentials', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: 'Sign up for a demo profile' })).toBeDefined();
  expect(screen.getByLabelText('Display name')).toBeDefined();
  expect(screen.queryByLabelText(/date of birth|phone number|email address|password/i)).toBeNull();
  expect(screen.getByText(/not private or protected, and they are erased when you refresh/i)).toBeDefined();

  createDemoProfile('Avery');
  expect(screen.getByRole('heading', { name: "Avery's recovery, in one place." })).toBeDefined();
});

test('does not display a MyChart shortcut', () => {
  render(<App />);
  createDemoProfile();

  expect(screen.queryByRole('link', { name: /open mychart/i })).toBeNull();
});

test('shows a simple home page and opens the daily recovery plan from navigation', () => {
  render(<App />);
  createDemoProfile('Avery');

  expect(screen.getByRole('heading', { name: /recover well/i })).toBeDefined();
  expect(screen.getByRole('heading', { name: /what would you like to do/i })).toBeDefined();
  expect(screen.getByText(/if someone may be having an emergency/i)).toBeDefined();

  fireEvent.click(screen.getByText('My recovery'));
  fireEvent.click(screen.getByRole('button', { name: 'Daily plan' }));
  expect(screen.getByRole('heading', { name: /things you may want to remember/i })).toBeDefined();

  fireEvent.click(screen.getByRole('checkbox', { name: /11:00 AM Walk to the window/i }));

  expect(screen.getByText(/25% complete/i)).toBeDefined();
  fireEvent.click(screen.getByText('Recovery information'));
  fireEvent.click(screen.getByRole('button', { name: 'Recovery journey' }));
  expect(screen.getByRole('heading', { name: /from icu care to at-home recovery/i })).toBeDefined();
  expect(screen.getByRole('heading', { name: 'Day one after surgery: ICU care' })).toBeDefined();
  expect(screen.getByText(/your ICU team will tailor care to your surgery/i)).toBeDefined();
});

test('marks the active dropdown page and closes menus accessibly', () => {
  render(<App />);
  createDemoProfile('Avery');

  const summary = screen.getByText('My recovery');
  fireEvent.click(summary);
  fireEvent.click(screen.getByRole('button', { name: 'Daily plan' }));
  const details = summary.parentElement;
  expect(details.open).toBe(false);
  expect(summary.classList.contains('is-active')).toBe(true);

  fireEvent.click(summary);
  const activePageButton = screen.getByRole('button', { name: 'Daily plan' });
  expect(activePageButton.getAttribute('aria-current')).toBe('page');
  fireEvent.keyDown(activePageButton, { key: 'Escape' });
  expect(details.open).toBe(false);
  expect(document.activeElement).toBe(summary);

  fireEvent.click(summary);
  fireEvent.click(screen.getByRole('button', { name: 'Home' }));
  expect(details.open).toBe(false);
});

test('opens self-care from its own top-level navigation tab', () => {
  render(<App />);
  createDemoProfile('Avery');

  const selfCareTab = screen.getByRole('button', { name: 'Self-care' });
  fireEvent.click(selfCareTab);

  expect(selfCareTab.getAttribute('aria-current')).toBe('page');
  expect(screen.getByRole('heading', { name: /simple ways to take care of yourself/i })).toBeDefined();

  fireEvent.click(screen.getByRole('button', { name: 'Home' }));
  expect(selfCareTab.getAttribute('aria-current')).toBeNull();
  expect(screen.getByRole('button', { name: 'Home' }).getAttribute('aria-current')).toBe('page');
});

test('lets a demo profile add and remove personal daily reminders', () => {
  render(<App />);
  createDemoProfile('Avery');
  openSection('My recovery', 'Daily plan');

  fireEvent.change(screen.getByLabelText('Add a personal reminder'), {
    target: { value: 'Write down a question' },
  });
  fireEvent.change(screen.getByLabelText('Time (optional)'), {
    target: { value: 'Afternoon' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Add reminder' }));
  expect(screen.getByText('0/5 done')).toBeDefined();
  expect(screen.getByText('Afternoon')).toBeDefined();
  expect(screen.getByText('Write down a question')).toBeDefined();
  expect(screen.getByText('Added reminder: Write down a question, Afternoon.')).toBeDefined();

  fireEvent.click(screen.getByRole('checkbox', { name: /Afternoon Write down a question/i }));
  expect(screen.getByText(/20% complete/i)).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: 'Remove reminder Write down a question' }));
  expect(screen.queryByText('Write down a question')).toBeNull();
  expect(screen.getByText('Removed reminder: Write down a question, Afternoon.')).toBeDefined();
  expect(screen.getByText('0/4 done')).toBeDefined();
});

test('keeps custom reminders with their profile and clears visit drafts when switching profiles', () => {
  render(<App />);
  createDemoProfile('Avery');
  openSection('My recovery', 'Daily plan');
  fireEvent.change(screen.getByLabelText('Add a personal reminder'), {
    target: { value: 'Avery reminder' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Add reminder' }));

  openSection('My recovery', 'Prepare for your visit');
  fireEvent.change(screen.getByLabelText(/what symptoms or changes have you noticed/i), {
    target: { value: 'Avery draft detail' },
  });
  fireEvent.click(screen.getByRole('button', { name: /create visit summary/i }));
  expect(
    within(screen.getByRole('region', { name: /draft to review/i })).getByText(/Avery draft detail/),
  ).toBeDefined();

  fireEvent.click(screen.getByRole('button', { name: 'Switch profile' }));
  fireEvent.click(screen.getByRole('button', { name: 'Create profile' }));
  createDemoProfile('Jordan');
  openSection('My recovery', 'Daily plan');
  expect(screen.queryByText('Avery reminder')).toBeNull();
  expect(screen.getByText('0/4 done')).toBeDefined();

  openSection('My recovery', 'Prepare for your visit');
  expect(screen.queryByText(/Avery draft detail/)).toBeNull();
  expect(screen.queryByRole('region', { name: /draft to review/i })).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Switch profile' }));
  fireEvent.change(screen.getByLabelText('Demo profile'), { target: { value: 'demo-profile-1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  openSection('My recovery', 'Daily plan');
  expect(screen.getByText('Avery reminder')).toBeDefined();
});

test('shows ICU and recovery modules relevant to the selected procedure category', () => {
  render(<App />);
  createDemoProfile();

  openSection('Recovery information', 'Procedure planning');

  expect(screen.getByRole('heading', { name: 'Hospital and recovery questions to ask' })).toBeDefined();
  expect(
    screen.getByText(
      textPattern('Based on the Brain and spine (neuro) surgery type and Craniotomy (opening the skull for brain surgery) you picked above.'),
    ),
  ).toBeDefined();
  expect(screen.getByText(/ask what checks are planned after your surgery/i)).toBeDefined();
  expect(screen.getByText(/instructions apply to you for your head, back, wound, movement, and follow-up visits/i)).toBeDefined();

  const serviceTopicExamples = [
    ['Cardiac', 'Heart (cardiac)', 'Heart bypass surgery (CABG)', /heart monitors, breathing help, IV lines, or drains/i],
    ['General surgery', 'Belly and digestion (general surgery)', 'Belly (abdominal) surgery', /comfort, breathing, eating and drinking, and your wound or drain/i],
    ['Orthopedic', 'Bones and joints (orthopedic)', 'Hip replacement (hip arthroplasty)', /comfort, blood flow, and movement checks/i],
    ['Urology', 'Bladder, kidneys, and prostate (urology)', 'Prostate removal (prostatectomy)', /ask if you will have a catheter/i],
    ['Gynecology', "Women's health (gynecology)", 'Removing the uterus (hysterectomy)', /what bleeding or other changes they want to hear about/i],
    ['Oncology', 'Cancer (oncology)', 'Breast removal (mastectomy)', /help you will get with comfort, breathing, your wound, or drains/i],
    ['Vascular', 'Blood vessels (vascular)', 'Clearing a blocked neck artery (carotid endarterectomy)', /blood flow or wound checks are part of your care/i],
  ];

  for (const [service, serviceLabel, procedureLabel, relevantTopic] of serviceTopicExamples) {
    fireEvent.change(screen.getByLabelText('Type of surgery'), { target: { value: service } });
    expect(
      screen.getByText(textPattern(`Based on the ${serviceLabel} surgery type and ${procedureLabel} you picked above.`)),
    ).toBeDefined();
    expect(screen.getByText(relevantTopic)).toBeDefined();
  }

  expect(screen.queryByText(/instructions apply to you for your head, back, wound, movement, and follow-up visits/i)).toBeNull();

  expect(screen.queryByText(/risk assessment/i)).toBeNull();
  expect(screen.queryByText(/discharge readiness/i)).toBeNull();
});

test('updates the illustrative PACU route by procedure and keeps anesthesia education separate', () => {
  render(<App />);
  createDemoProfile('Avery');
  openSection('Recovery information', 'Procedure planning');

  expect(screen.getByRole('heading', { name: 'Recovery room → ICU or a closely watched unit is possible' })).toBeDefined();
  expect(screen.getByText(/these\s+are common examples of where people go next, not a rule/i)).toBeDefined();
  expect(screen.getByRole('heading', { name: 'What anesthesia may feel like' })).toBeDefined();
  expect(screen.getByText(/the name of\s+your surgery does not tell you which kind you will get/i)).toBeDefined();

  fireEvent.change(screen.getByLabelText('Type of surgery'), { target: { value: 'Urology' } });
  expect(screen.getByRole('heading', { name: 'Recovery room → regular hospital room is common' })).toBeDefined();
  fireEvent.change(screen.getByLabelText('Surgery'), { target: { value: 'Ureteroscopy' } });
  expect(screen.getByRole('heading', { name: 'Recovery room → home the same day is possible' })).toBeDefined();

  const anesthesiaSelect = screen.getByLabelText('Type of anesthesia');
  expect(screen.getByText(/it is okay not to know yet/i)).toBeDefined();
  fireEvent.change(anesthesiaSelect, { target: { value: 'regional' } });
  expect(
    screen.getByRole('heading', { name: 'Regional anesthesia (numbing a large area, like a spinal, epidural, or nerve block)' }),
  ).toBeDefined();
  expect(screen.getByText(/may feel numb, heavy, or weak/i)).toBeDefined();

  fireEvent.click(screen.getByRole('button', { name: 'Switch profile' }));
  fireEvent.click(screen.getByRole('button', { name: 'Create profile' }));
  createDemoProfile('Jordan');
  openSection('Recovery information', 'Procedure planning');
  expect(screen.getByLabelText('Type of anesthesia').value).toBe('unknown');

  fireEvent.click(screen.getByRole('button', { name: 'Switch profile' }));
  fireEvent.change(screen.getByLabelText('Demo profile'), { target: { value: 'demo-profile-1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  openSection('Recovery information', 'Procedure planning');
  expect(screen.getByLabelText('Type of anesthesia').value).toBe('regional');
  expect(screen.getByRole('heading', { name: 'Recovery room → home the same day is possible' })).toBeDefined();
});

test('records procedure scheduling details and changes the checklist for each procedure', () => {
  render(<App />);
  createDemoProfile();

  openSection('Recovery information', 'Procedure planning');

  fireEvent.change(screen.getByLabelText('Surgery date'), { target: { value: '2026-11-12' } });
  fireEvent.change(screen.getByLabelText(/arrival time \(optional/i), {
    target: { value: '7:00 AM' },
  });
  expect(screen.getByLabelText('Surgery date').value).toBe('2026-11-12');
  expect(screen.getByLabelText(/arrival time \(optional/i).value).toContain('7:00 AM');

  const examples = [
    ['Neuro', 'Craniotomy', 'Craniotomy (opening the skull for brain surgery)', /changes in thinking, speech, movement, or alertness need help right away/i],
    ['Neuro', 'Spine surgery', 'Spine surgery', /movement, lifting, and wound care instructions/i],
    ['Neuro', 'Cerebral aneurysm repair', 'Brain aneurysm repair (fixing a bulging blood vessel in the brain)', /checkups and follow-up plan/i],
    ['Cardiac', 'CABG', 'Heart bypass surgery (CABG)', /instructions apply after bypass surgery/i],
    ['Cardiac', 'Valve repair', 'Heart valve repair', /follow-up visits and checkups are planned/i],
    ['Cardiac', 'Heart failure surgery', 'Heart failure surgery', /with your heart doctor/i],
    ['General surgery', 'Abdominal surgery', 'Belly (abdominal) surgery', /what you can eat and drink and how active you can be/i],
    ['General surgery', 'Bariatric surgery', 'Weight-loss (bariatric) surgery', /eating and drinking plan/i],
    ['General surgery', 'GI resections', 'Removing part of the stomach or bowel (GI resection)', /bowel movements, food, and activity/i],
    ['Orthopedic', 'Hip arthroplasty', 'Hip replacement (hip arthroplasty)', /how much weight you can put on your leg/i],
    ['Orthopedic', 'Knee replacement', 'Knee replacement', /walker or cane, setting up your home/i],
    ['Orthopedic', 'Spine fusion', 'Spine fusion (joining bones in the back)', /back brace instructions/i],
  ];

  for (const [service, procedure, procedureLabel, checklistPrompt] of examples) {
    fireEvent.change(screen.getByLabelText('Type of surgery'), { target: { value: service } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Surgery' }), {
      target: { value: procedure },
    });
    expect(screen.getByRole('heading', { name: `Checklist for ${procedureLabel}` })).toBeDefined();
    expect(screen.getByText(checklistPrompt)).toBeDefined();
  }
}, 20000);

test('keeps checklist, self-care notes, and medicines separate between demo profiles', async () => {
  render(<App />);
  createDemoProfile('Avery');

  openSection('My recovery', 'Daily plan');
  fireEvent.click(screen.getByRole('checkbox', { name: /11:00 AM Walk to the window/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Self-care' }));
  fireEvent.change(screen.getByLabelText('Recovery note'), {
    target: { value: 'Avery personal note' },
  });
  openSection('My recovery', 'Medicines');
  fireEvent.change(screen.getByRole('combobox', { name: 'Search all medicines' }), {
    target: { value: 'aspirin' },
  });
  const catalog = screen.getByRole('list', { name: 'Medication search results' });
  fireEvent.click(within(catalog).getByRole('button', { name: /Add Aspirin/ }));
  expect(within(screen.getByRole('list', { name: 'Your medicine list' })).getByText('Aspirin')).toBeDefined();

  fireEvent.click(screen.getByRole('button', { name: 'Switch profile' }));
  fireEvent.click(screen.getByRole('button', { name: 'Create profile' }));
  createDemoProfile('Jordan');
  expect(screen.getByRole('heading', { name: "Jordan's recovery, in one place." })).toBeDefined();

  openSection('My recovery', 'Daily plan');
  expect(screen.getByText(/0% complete/i)).toBeDefined();
  fireEvent.click(screen.getByRole('checkbox', { name: /11:00 AM Walk to the window/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Self-care' }));
  expect(screen.queryByText('Avery personal note')).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Switch profile' }));
  fireEvent.change(screen.getByLabelText('Demo profile'), { target: { value: 'demo-profile-1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  expect(screen.getByRole('heading', { name: "Avery's recovery, in one place." })).toBeDefined();

  openSection('My recovery', 'Daily plan');
  expect(screen.getByText(/25% complete/i)).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: 'Self-care' }));
  expect(screen.getByDisplayValue('Avery personal note')).toBeDefined();
  openSection('My recovery', 'Medicines');
  expect(within(screen.getByRole('list', { name: 'Your medicine list' })).getByText('Aspirin')).toBeDefined();

  fireEvent.click(screen.getByRole('button', { name: 'Switch profile' }));
  fireEvent.change(screen.getByLabelText('Demo profile'), { target: { value: 'demo-profile-2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  openSection('My recovery', 'Medicines');
  expect(screen.getByText('No medicines have been added to this profile.')).toBeDefined();
  expect(screen.queryByText('Aspirin')).toBeNull();
});

test('keeps reported health-history selections separate between demo profiles', () => {
  render(<App />);
  createDemoProfile('Avery');

  openSection('My recovery', 'Health history');
  expect(screen.getByRole('heading', { name: 'Health history to talk about' })).toBeDefined();
  expect(screen.getByText(/does not judge your risk or change\s+your care/i)).toBeDefined();
  fireEvent.click(screen.getByRole('checkbox', { name: 'High blood pressure' }));
  fireEvent.click(screen.getByRole('checkbox', { name: "Not sure / I don't know my history" }));
  fireEvent.change(screen.getByLabelText(/other health problems/i), {
    target: { value: 'Avery reported note' },
  });

  fireEvent.click(screen.getByRole('button', { name: 'Switch profile' }));
  fireEvent.click(screen.getByRole('button', { name: 'Create profile' }));
  createDemoProfile('Jordan');
  openSection('My recovery', 'Health history');
  expect(screen.getByRole('checkbox', { name: 'High blood pressure' }).checked).toBe(false);
  expect(screen.getByRole('checkbox', { name: "Not sure / I don't know my history" }).checked).toBe(false);
  expect(screen.getByLabelText(/other health problems/i).value).toBe('');

  fireEvent.click(screen.getByRole('button', { name: 'Switch profile' }));
  fireEvent.change(screen.getByLabelText('Demo profile'), { target: { value: 'demo-profile-1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  openSection('My recovery', 'Health history');
  expect(screen.getByRole('checkbox', { name: 'High blood pressure' }).checked).toBe(true);
  expect(screen.getByRole('checkbox', { name: "Not sure / I don't know my history" }).checked).toBe(true);
  expect(screen.getByLabelText(/other health problems/i).value).toBe('Avery reported note');
});

test('opens the health reference from its own top-level tab', () => {
  render(<App />);
  createDemoProfile('Avery');
  fireEvent.click(screen.getByRole('button', { name: 'Health reference' }));
  expect(screen.getByRole('heading', { name: /learn about your body and your care/i })).toBeDefined();
});

test('passes reported kidney disease from health history to the Pharmacy screening', () => {
  render(<App />);
  createDemoProfile('Avery');

  openSection('My recovery', 'Medicines');
  fireEvent.change(screen.getByRole('combobox', { name: 'Search all medicines' }), {
    target: { value: 'ibuprofen' },
  });
  const reference = screen.getByRole('list', { name: 'Medication search results' });
  fireEvent.click(within(reference).getAllByRole('button', { name: /Add Ibuprofen/ })[0]);
  expect(screen.queryByText(/you noted kidney disease in your health history/i)).toBeNull();

  openSection('My recovery', 'Health history');
  fireEvent.click(screen.getByRole('checkbox', { name: 'Long-term kidney disease (CKD)' }));

  openSection('My recovery', 'Medicines');
  expect(screen.getByText(/you noted kidney disease in your health history/i)).toBeDefined();
});

test('sets the browser tab title to match the page chosen in navigation', () => {
  render(<App />);
  createDemoProfile();
  expect(document.title).toBe('Home – Recover Well');

  openSection('My recovery', 'Daily plan');
  expect(document.title).toBe('Daily plan – Recover Well');

  openSection('Recovery information', 'Procedure planning');
  expect(document.title).toBe('Procedure planning – Recover Well');
});
