import { expect, test } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';

test('shows a simple home page and opens the daily recovery plan from navigation', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /recover well/i })).toBeDefined();
  expect(screen.getByRole('heading', { name: /your recovery, in one place/i })).toBeDefined();
  expect(screen.getByRole('heading', { name: /what would you like to do/i })).toBeDefined();
  expect(screen.getByText(/if someone may be having an emergency/i)).toBeDefined();

  fireEvent.click(screen.getByText('My recovery'));
  fireEvent.click(screen.getByRole('button', { name: 'Daily plan' }));
  expect(screen.getByRole('heading', { name: /recovery checklist/i })).toBeDefined();

  fireEvent.click(screen.getByRole('checkbox', { name: /mark walk to the window complete/i }));

  expect(screen.getByText(/75% complete/i)).toBeDefined();
  fireEvent.click(screen.getByText('Recovery information'));
  fireEvent.click(screen.getByRole('button', { name: 'Recovery journey' }));
  expect(screen.getByRole('heading', { name: /from icu care to at-home recovery/i })).toBeDefined();
});

test('personalizes ICU follow-up based on service line and operative note', () => {
  render(<App />);

  fireEvent.click(screen.getByText('Recovery information'));
  fireEvent.click(screen.getByRole('button', { name: 'Procedure planning' }));
  fireEvent.change(screen.getByLabelText('Surgical service'), { target: { value: 'Cardiac' } });

  expect(screen.getByText(/cardiac operative note: CABG/i)).toBeDefined();
  expect(screen.getByText(/telemetry and rhythm review/i)).toBeDefined();
  expect(screen.getByText(/escalate chest pain, arrhythmia, or low output symptoms promptly/i)).toBeDefined();
});

test('adjusts ICU care and discharge readiness for patient risk factors', () => {
  render(<App />);

  fireEvent.click(screen.getByText('Recovery information'));
  fireEvent.click(screen.getByRole('button', { name: 'Procedure planning' }));
  fireEvent.change(screen.getByLabelText(/patient age/i), { target: { value: '72' } });
  fireEvent.change(screen.getByLabelText(/comorbidities/i), { target: { value: 'Heart failure, CKD' } });
  fireEvent.change(screen.getByLabelText('Surgical service'), { target: { value: 'Cardiac' } });

  expect(screen.getByText(/high risk patient profile/i)).toBeDefined();
  expect(screen.getByText(/step-down monitored transfer/i)).toBeDefined();
  expect(screen.getByText(/requires extended cardiac monitoring and slower mobility progression/i)).toBeDefined();
});

test('records procedure scheduling details and changes the checklist for each procedure', () => {
  render(<App />);

  fireEvent.click(screen.getByText('Recovery information'));
  fireEvent.click(screen.getByRole('button', { name: 'Procedure planning' }));

  fireEvent.change(screen.getByLabelText('Procedure date'), { target: { value: '2026-11-12' } });
  fireEvent.change(screen.getByLabelText(/arrival time or clinic details/i), {
    target: { value: 'Arrive at 7:00 AM, main entrance' },
  });
  expect(screen.getByLabelText('Procedure date').value).toBe('2026-11-12');
  expect(screen.getByLabelText(/arrival time or clinic details/i).value).toContain('7:00 AM');

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
});

test('creates a care-team message draft without sending it', () => {
  render(<App />);

  fireEvent.click(screen.getByText('My recovery'));
  fireEvent.click(screen.getByRole('button', { name: 'Message the care team' }));
  fireEvent.change(screen.getByLabelText('Topic'), { target: { value: 'Medication question' } });
  fireEvent.change(screen.getByLabelText(/what would you like your care team to know or answer/i), {
    target: { value: 'Could you clarify my written instructions?' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Create message draft' }));

  const draft = screen.getByRole('region', { name: 'Message draft' });
  expect(within(draft).getByRole('heading', { name: 'Draft only — not sent' })).toBeDefined();
  expect(draft.textContent).toContain('Subject: Medication question');
  expect(draft.textContent).toContain('Could you clarify my written instructions');
  expect(screen.getByText(/this page cannot send messages/i)).toBeDefined();
});
