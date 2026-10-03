import { expect, test } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

test('renders Recover Well and updates recovery progress', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /recover well/i })).toBeDefined();
  expect(screen.getByText(/today's recovery plan/i)).toBeDefined();
  expect(screen.getByRole('heading', { name: /prepare for a care conversation/i })).toBeDefined();

  fireEvent.click(screen.getByRole('checkbox', { name: /mark walk to the window complete/i }));

  expect(screen.getByText(/75% complete/i)).toBeDefined();
});

test('personalizes ICU follow-up based on service line and operative note', () => {
  render(<App />);

  fireEvent.change(screen.getByLabelText(/operative service/i), { target: { value: 'Cardiac' } });

  expect(screen.getByText(/cardiac operative note: CABG/i)).toBeDefined();
  expect(screen.getByText(/telemetry and rhythm review/i)).toBeDefined();
  expect(screen.getByText(/escalate chest pain, arrhythmia, or low output symptoms promptly/i)).toBeDefined();
});

test('adjusts ICU care and discharge readiness for patient risk factors', () => {
  render(<App />);

  fireEvent.change(screen.getByLabelText(/patient age/i), { target: { value: '72' } });
  fireEvent.change(screen.getByLabelText(/comorbidities/i), { target: { value: 'Heart failure, CKD' } });
  fireEvent.change(screen.getByLabelText(/operative service/i), { target: { value: 'Cardiac' } });

  expect(screen.getByText(/high risk patient profile/i)).toBeDefined();
  expect(screen.getByText(/step-down monitored transfer/i)).toBeDefined();
  expect(screen.getByText(/requires extended cardiac monitoring and slower mobility progression/i)).toBeDefined();
});
