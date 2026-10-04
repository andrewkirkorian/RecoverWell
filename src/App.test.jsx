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

test('starts with clearly labeled demo sign-up and does not request credentials', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: 'Sign up for a demo profile' })).toBeDefined();
  expect(screen.getByLabelText('Display name')).toBeDefined();
  expect(screen.queryByLabelText(/date of birth|phone number|email address|password/i)).toBeNull();
  expect(screen.getByText(/not protected accounts and disappear when the page is reloaded/i)).toBeDefined();

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

  fireEvent.click(screen.getByRole('checkbox', { name: /mark walk to the window complete/i }));

  expect(screen.getByText(/25% complete/i)).toBeDefined();
  fireEvent.click(screen.getByText('Recovery information'));
  fireEvent.click(screen.getByRole('button', { name: 'Recovery journey' }));
  expect(screen.getByRole('heading', { name: /from icu care to at-home recovery/i })).toBeDefined();
  expect(screen.getByRole('heading', { name: 'Day one after surgery: ICU care' })).toBeDefined();
  expect(screen.getByText(/your ICU team will tailor care to your operation/i)).toBeDefined();
});

test('opens self-care from its own top-level navigation tab', () => {
  render(<App />);
  createDemoProfile('Avery');

  const selfCareTab = screen.getByRole('button', { name: 'Self-care' });
  fireEvent.click(selfCareTab);

  expect(selfCareTab.getAttribute('aria-current')).toBe('page');
  expect(screen.getByRole('heading', { name: /patient-first care that supports independence/i })).toBeDefined();

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

  fireEvent.click(screen.getByRole('checkbox', { name: /mark write down a question complete/i }));
  expect(screen.getByText(/20% complete/i)).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: 'Remove reminder Write down a question' }));
  expect(screen.queryByText('Write down a question')).toBeNull();
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

  expect(screen.getByRole('heading', { name: 'ICU and recovery topics to discuss' })).toBeDefined();
  expect(screen.getByText(/based on the neuro procedure category and craniotomy selected above/i)).toBeDefined();
  expect(screen.getByText(/ask what monitoring is planned after your procedure/i)).toBeDefined();
  expect(screen.getByText(/confirm which head, spine, wound, movement, and follow-up instructions/i)).toBeDefined();

  const serviceTopicExamples = [
    ['Cardiac', /heart monitors, breathing support, lines, or drains/i],
    ['General surgery', /eating or drinking, and wound or drain support/i],
    ['Orthopedic', /comfort, circulation, and movement checks/i],
    ['Urology', /whether a catheter, stent, or other equipment is part of your care/i],
    ['Gynecology', /what bleeding or other changes they want you to report/i],
    ['Oncology', /comfort, breathing, wound, or drain support/i],
    ['Vascular', /circulation or incision checks are part of your care/i],
  ];

  for (const [service, relevantTopic] of serviceTopicExamples) {
    fireEvent.change(screen.getByLabelText('Surgical service'), { target: { value: service } });
    const selectedProcedure = {
      Cardiac: 'CABG',
      'General surgery': 'Abdominal surgery',
      Orthopedic: 'Hip arthroplasty',
      Urology: 'Prostatectomy',
      Gynecology: 'Hysterectomy',
      Oncology: 'Mastectomy',
      Vascular: 'Carotid endarterectomy',
    }[service];
    expect(
      screen.getByText(new RegExp(`based on the ${service} procedure category and ${selectedProcedure} selected above`, 'i')),
    ).toBeDefined();
    expect(screen.getByText(relevantTopic)).toBeDefined();
  }

  expect(screen.queryByText(/confirm which head, spine, wound, movement, and follow-up instructions/i)).toBeNull();

  expect(screen.queryByText(/risk assessment/i)).toBeNull();
  expect(screen.queryByText(/discharge readiness/i)).toBeNull();
});

test('updates the illustrative PACU route by procedure and keeps anesthesia education separate', () => {
  render(<App />);
  createDemoProfile('Avery');
  openSection('Recovery information', 'Procedure planning');

  expect(screen.getByRole('heading', { name: 'PACU → ICU or monitored unit may be planned' })).toBeDefined();
  expect(screen.getByText(/these are broad examples of planned pathways, not a rule/i)).toBeDefined();
  expect(screen.getByRole('heading', { name: 'What anesthesia may feel like' })).toBeDefined();
  expect(screen.getByText(/a procedure name does not tell you which anesthesia you will receive/i)).toBeDefined();

  fireEvent.change(screen.getByLabelText('Surgical service'), { target: { value: 'Urology' } });
  expect(screen.getByRole('heading', { name: 'PACU → hospital floor is commonly planned' })).toBeDefined();
  fireEvent.change(screen.getByLabelText('Procedure'), { target: { value: 'Ureteroscopy' } });
  expect(screen.getByRole('heading', { name: 'PACU → home may be planned' })).toBeDefined();

  const anesthesiaSelect = screen.getByLabelText('Anesthesia type');
  expect(screen.getByText(/it is okay not to know the planned type yet/i)).toBeDefined();
  fireEvent.change(anesthesiaSelect, { target: { value: 'regional' } });
  expect(screen.getByRole('heading', { name: 'Regional anesthesia (spinal, epidural, or nerve block)' })).toBeDefined();
  expect(screen.getByText(/temporary numbness, heaviness, or weakness/i)).toBeDefined();

  fireEvent.click(screen.getByRole('button', { name: 'Switch profile' }));
  fireEvent.click(screen.getByRole('button', { name: 'Create profile' }));
  createDemoProfile('Jordan');
  openSection('Recovery information', 'Procedure planning');
  expect(screen.getByLabelText('Anesthesia type').value).toBe('unknown');

  fireEvent.click(screen.getByRole('button', { name: 'Switch profile' }));
  fireEvent.change(screen.getByLabelText('Demo profile'), { target: { value: 'demo-profile-1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  openSection('Recovery information', 'Procedure planning');
  expect(screen.getByLabelText('Anesthesia type').value).toBe('regional');
  expect(screen.getByRole('heading', { name: 'PACU → home may be planned' })).toBeDefined();
});

test('records procedure scheduling details and changes the checklist for each procedure', () => {
  render(<App />);
  createDemoProfile();

  openSection('Recovery information', 'Procedure planning');

  fireEvent.change(screen.getByLabelText('Procedure date'), { target: { value: '2026-11-12' } });
  fireEvent.change(screen.getByLabelText(/arrival time \(optional/i), {
    target: { value: '7:00 AM' },
  });
  expect(screen.getByLabelText('Procedure date').value).toBe('2026-11-12');
  expect(screen.getByLabelText(/arrival time \(optional/i).value).toContain('7:00 AM');

  const examples = [
    ['Neuro', 'Craniotomy', /neurologic changes need urgent attention/i],
    ['Neuro', 'Spine surgery', /movement, lifting, and wound-care instructions/i],
    ['Neuro', 'Cerebral aneurysm repair', /monitoring and follow-up plan/i],
    ['Cardiac', 'CABG', /bypass surgery/i],
    ['Cardiac', 'Valve repair', /follow-up and monitoring/i],
    ['Cardiac', 'Heart failure surgery', /heart-care team/i],
    ['General surgery', 'Abdominal surgery', /eating, drinking, and activity guidance/i],
    ['General surgery', 'Bariatric surgery', /eating and drinking plan/i],
    ['General surgery', 'GI resections', /bowel, diet, and activity changes/i],
    ['Orthopedic', 'Hip arthroplasty', /weight-bearing guidance/i],
    ['Orthopedic', 'Knee replacement', /physical therapy plan/i],
    ['Orthopedic', 'Spine fusion', /brace instructions/i],
  ];

  for (const [service, procedure, checklistPrompt] of examples) {
    fireEvent.change(screen.getByLabelText('Surgical service'), { target: { value: service } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Procedure' }), {
      target: { value: procedure },
    });
    expect(screen.getByRole('heading', { name: `Checklist for ${procedure}` })).toBeDefined();
    expect(screen.getByText(checklistPrompt)).toBeDefined();
  }
}, 20000);

test('keeps checklist, self-care notes, and medicines separate between demo profiles', async () => {
  render(<App />);
  createDemoProfile('Avery');

  openSection('My recovery', 'Daily plan');
  fireEvent.click(screen.getByRole('checkbox', { name: /mark walk to the window complete/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Self-care' }));
  fireEvent.change(screen.getByLabelText('Recovery note'), {
    target: { value: 'Avery personal note' },
  });
  openSection('My recovery', 'Medicines');
  fireEvent.change(screen.getByRole('combobox', { name: 'Search medication reference' }), {
    target: { value: 'aspirin' },
  });
  const catalog = screen.getByRole('list', { name: 'Medication search results' });
  fireEvent.click(within(catalog).getByRole('button', { name: /Add Aspirin/ }));
  expect(within(screen.getByRole('list', { name: 'Patient medication list' })).getByText('Aspirin')).toBeDefined();

  fireEvent.click(screen.getByRole('button', { name: 'Switch profile' }));
  fireEvent.click(screen.getByRole('button', { name: 'Create profile' }));
  createDemoProfile('Jordan');
  expect(screen.getByRole('heading', { name: "Jordan's recovery, in one place." })).toBeDefined();

  openSection('My recovery', 'Daily plan');
  expect(screen.getByText(/0% complete/i)).toBeDefined();
  fireEvent.click(screen.getByRole('checkbox', { name: /mark walk to the window complete/i }));
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
  expect(within(screen.getByRole('list', { name: 'Patient medication list' })).getByText('Aspirin')).toBeDefined();

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
  expect(screen.getByRole('heading', { name: 'Health history to discuss' })).toBeDefined();
  expect(screen.getByText(/does not assess risk or change your care/i)).toBeDefined();
  fireEvent.click(screen.getByRole('checkbox', { name: 'High blood pressure' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Not sure / history not available' }));
  fireEvent.change(screen.getByLabelText(/other condition/i), {
    target: { value: 'Avery reported note' },
  });

  fireEvent.click(screen.getByRole('button', { name: 'Switch profile' }));
  fireEvent.click(screen.getByRole('button', { name: 'Create profile' }));
  createDemoProfile('Jordan');
  openSection('My recovery', 'Health history');
  expect(screen.getByRole('checkbox', { name: 'High blood pressure' }).checked).toBe(false);
  expect(screen.getByRole('checkbox', { name: 'Not sure / history not available' }).checked).toBe(false);
  expect(screen.getByLabelText(/other condition/i).value).toBe('');

  fireEvent.click(screen.getByRole('button', { name: 'Switch profile' }));
  fireEvent.change(screen.getByLabelText('Demo profile'), { target: { value: 'demo-profile-1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  openSection('My recovery', 'Health history');
  expect(screen.getByRole('checkbox', { name: 'High blood pressure' }).checked).toBe(true);
  expect(screen.getByRole('checkbox', { name: 'Not sure / history not available' }).checked).toBe(true);
  expect(screen.getByLabelText(/other condition/i).value).toBe('Avery reported note');
});

test('opens the health reference from its own top-level tab', () => {
  render(<App />);
  createDemoProfile('Avery');
  fireEvent.click(screen.getByRole('button', { name: 'Health reference' }));
  expect(screen.getByRole('heading', { name: /medical issues and nursing assistant/i })).toBeDefined();
});
