import { expect, test } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import CareSupport from './CareSupport';

test('creates an editable patient-reported summary for a care visit', () => {
  render(<CareSupport />);

  fireEvent.change(screen.getByLabelText(/what symptoms or changes have you noticed/i), {
    target: { value: 'My incision has been more sore since yesterday.' },
  });
  fireEvent.change(screen.getByLabelText(/when did they start/i), {
    target: { value: 'Yesterday afternoon' },
  });
  fireEvent.change(screen.getByLabelText(/how severe do they feel/i), {
    target: { value: 'Moderate' },
  });
  fireEvent.change(screen.getByLabelText(/what would you like to ask the care team/i), {
    target: { value: 'Should I arrange a follow-up?' },
  });
  fireEvent.click(screen.getByRole('button', { name: /create visit summary/i }));

  const summary = within(screen.getByRole('region', { name: /draft to review with your care team/i }));
  expect(summary.getByText(/Patient-reported visit preparation summary \(not a diagnosis\)/i)).toBeDefined();
  expect(summary.getByText(/My incision has been more sore since yesterday/i)).toBeDefined();
  expect(summary.getByText(/Yesterday afternoon/)).toBeDefined();
  expect(summary.getByText(/Should I arrange a follow-up/)).toBeDefined();
  expect(summary.getByText(/Nothing is sent or saved by this page/i)).toBeDefined();
});

test('shows emergency directions immediately when a warning sign is selected', () => {
  render(<CareSupport />);

  fireEvent.click(
    screen.getByRole('checkbox', { name: /severe difficulty breathing/i }),
  );

  expect(screen.getByRole('alert')).toBeDefined();
  expect(screen.getByRole('alert').textContent).toMatch(/contact your local emergency number now/i);

  fireEvent.click(screen.getByRole('button', { name: /clear entries/i }));
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByRole('checkbox', { name: /severe difficulty breathing/i }).checked).toBe(false);
});
