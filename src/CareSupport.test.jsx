import { afterEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import CareSupport from './CareSupport';

afterEach(() => {
  vi.unstubAllGlobals();
});

test('creates an editable patient-reported summary for a visit', () => {
  render(<CareSupport />);

  fireEvent.change(screen.getByLabelText(/what symptoms or changes have you noticed/i), {
    target: { value: 'My incision has been more sore since yesterday.' },
  });
  fireEvent.change(screen.getByLabelText(/when did they start/i), {
    target: { value: 'Yesterday afternoon' },
  });
  fireEvent.change(screen.getByLabelText(/how bad are they/i), {
    target: { value: 'Moderate' },
  });
  fireEvent.change(screen.getByLabelText(/what would you like to remember or ask/i), {
    target: { value: 'Should I arrange a follow-up?' },
  });
  fireEvent.click(screen.getByRole('button', { name: /create visit summary/i }));

  const summary = within(screen.getByRole('region', { name: /draft to review/i }));
  expect(summary.getByText(/Notes for my visit \(for my own use\)/i)).toBeDefined();
  expect(summary.getByText(/My incision has been more sore since yesterday/i)).toBeDefined();
  expect(summary.getByText(/Yesterday afternoon/)).toBeDefined();
  expect(summary.getByText(/Should I arrange a follow-up/)).toBeDefined();
  expect(summary.getByText(/This page does not send or save anything/i)).toBeDefined();
});

test('copies the user-created visit draft only after an explicit action', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
  render(<CareSupport />);

  fireEvent.change(screen.getByLabelText(/what symptoms or changes have you noticed/i), {
    target: { value: 'A symptom I want to discuss' },
  });
  fireEvent.click(screen.getByRole('button', { name: /create visit summary/i }));
  expect(writeText).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: /copy draft/i }));
  await screen.findByRole('status');
  expect(writeText).toHaveBeenCalledWith(expect.stringContaining('A symptom I want to discuss'));
  expect(screen.getByRole('status').textContent).toMatch(/draft copied/i);
});

test('shows a manual-copy instruction when clipboard access fails', async () => {
  vi.stubGlobal('navigator', {
    ...navigator,
    clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Permission denied')) },
  });
  render(<CareSupport />);
  fireEvent.click(screen.getByRole('button', { name: /create visit summary/i }));
  fireEvent.click(screen.getByRole('button', { name: /copy draft/i }));

  expect((await screen.findByRole('alert')).textContent).toMatch(/highlight the text above and copy it yourself/i);
});

test('downloads the generated visit draft only after an explicit action', () => {
  const createObjectURL = vi.fn(() => 'blob:visit-draft');
  const revokeObjectURL = vi.fn();
  vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  render(<CareSupport />);
  fireEvent.change(screen.getByLabelText(/what symptoms or changes have you noticed/i), {
    target: { value: 'Downloadable draft detail' },
  });
  fireEvent.click(screen.getByRole('button', { name: /create visit summary/i }));

  expect(createObjectURL).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: /download draft/i }));
  expect(createObjectURL).toHaveBeenCalledOnce();
  expect(createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob);
  expect(click).toHaveBeenCalledOnce();
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:visit-draft');
  expect(screen.getByRole('status').textContent).toMatch(/draft downloaded/i);
});

test('opens the browser print dialog only after the print action is selected', () => {
  const print = vi.spyOn(window, 'print').mockImplementation(() => {});
  render(<CareSupport />);
  fireEvent.click(screen.getByRole('button', { name: /create visit summary/i }));
  expect(print).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: /print draft/i }));
  expect(print).toHaveBeenCalledOnce();
});

test('shows emergency directions immediately when a warning sign is selected', () => {
  render(<CareSupport />);

  fireEvent.click(
    screen.getByRole('checkbox', { name: /severe difficulty breathing/i }),
  );

  expect(screen.getByRole('alert')).toBeDefined();
  expect(screen.getByRole('alert').textContent).toMatch(/call your local emergency number now/i);

  fireEvent.click(screen.getByRole('button', { name: /clear entries/i }));
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByRole('checkbox', { name: /severe difficulty breathing/i }).checked).toBe(false);
});
