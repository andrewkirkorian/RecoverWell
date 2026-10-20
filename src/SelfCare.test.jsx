import { expect, test } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import SelfCare from './SelfCare';

test('starts without invented check-in values and summarizes only user-entered details', () => {
  render(<SelfCare />);

  expect(screen.getByText('No check-in details entered.')).toBeDefined();
  expect(screen.getByRole('spinbutton', { name: /pain level/i }).value).toBe('');
  expect(screen.getByRole('checkbox', { name: /drink water regularly/i }).checked).toBe(false);
  expect(screen.getByText(/not a medical checkup or a\s+measure of how well you are recovering/i)).toBeDefined();

  fireEvent.change(screen.getByRole('spinbutton', { name: /pain level/i }), {
    target: { value: '4' },
  });
  fireEvent.change(screen.getByLabelText('Recovery note'), {
    target: { value: 'Slept poorly and would like help with a follow-up question.' },
  });

  expect(screen.getByText(/Pain level you entered: 4\/10/)).toBeDefined();
  expect(screen.getByText(/Your note: Slept poorly and would like help with a follow-up question/i)).toBeDefined();
  expect(screen.queryByText(/moderate discomfort|good energy/i)).toBeNull();
});

test('lets the user add, check, and remove personal self-care reminders', () => {
  render(<SelfCare />);

  fireEvent.change(screen.getByLabelText('Add a personal choice'), {
    target: { value: 'Call a friend' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Add choice' }));
  expect(screen.getByRole('heading', { name: '0 of 5 choices checked off' })).toBeDefined();

  fireEvent.click(screen.getByRole('checkbox', { name: 'Call a friend' }));
  expect(screen.getByRole('heading', { name: '1 of 5 choices checked off' })).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: 'Remove personal habit Call a friend' }));
  expect(screen.queryByRole('checkbox', { name: 'Call a friend' })).toBeNull();
  expect(screen.getByRole('heading', { name: '0 of 4 choices checked off' })).toBeDefined();
});

test('shows optional whole-person health tips with reputable sources and care-team caveats', () => {
  render(<SelfCare />);

  expect(screen.getByRole('heading', { name: /general health tips/i })).toBeDefined();
  expect(screen.getByText(/nourish yourself in ways that work for you/i)).toBeDefined();
  expect(screen.getByText(/care for emotional well-being/i)).toBeDefined();
  expect(screen.getByText(/stay connected and ask for practical support/i)).toBeDefined();
  expect(screen.getByText(/ask your care team before changing your activity, diet, or medicines/i)).toBeDefined();

  const whoDietLink = screen.getByRole('link', { name: 'WHO: Healthy diet' });
  expect(whoDietLink.href).toBe('https://www.who.int/news-room/fact-sheets/detail/healthy-diet');
  expect(whoDietLink.target).toBe('_blank');
  expect(whoDietLink.rel).toContain('noreferrer');
  expect(screen.getByRole('link', { name: /NCCIH: Safe use of complementary/i })).toBeDefined();
});

test('saves, views, edits and deletes dated check-ins on the calendar', () => {
  render(<SelfCare />);

  fireEvent.click(screen.getByRole('button', { name: 'Save check-in' }));
  expect(screen.getByRole('status').textContent).toMatch(/at least one check-in detail/i);

  fireEvent.change(screen.getByLabelText('Check-in date'), { target: { value: '2026-10-04' } });
  fireEvent.change(screen.getByRole('spinbutton', { name: /pain level/i }), { target: { value: '4' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save check-in' }));

  expect(screen.getByRole('status').textContent).toMatch(/saved for October 4, 2026/);
  expect(screen.getByRole('button', { name: 'October 4, 2026, check-in saved' })).toBeDefined();
  expect(screen.getByRole('button', { name: 'October 5, 2026, no check-in saved' })).toBeDefined();

  fireEvent.change(screen.getByRole('spinbutton', { name: /pain level/i }), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'Edit saved check-in' }));
  expect(screen.getByRole('spinbutton', { name: /pain level/i }).value).toBe('4');

  fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
  expect(screen.getByRole('button', { name: 'November 1, 2026, no check-in saved' })).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));

  fireEvent.click(screen.getByRole('button', { name: 'Delete saved check-in' }));
  expect(screen.getByRole('button', { name: 'October 4, 2026, no check-in saved' })).toBeDefined();
});

test('shows optional check-in-based suggestions with boundaries and a hide control', () => {
  render(<SelfCare />);
  expect(screen.getByText(/enter a check-in detail to see optional wellness suggestions/i)).toBeDefined();

  const pain = screen.getByRole('spinbutton', { name: /pain level/i });
  fireEvent.change(pain, { target: { value: '3' } });
  expect(screen.queryByText(/break activities into shorter steps/i)).toBeNull();
  fireEvent.change(pain, { target: { value: '4' } });
  expect(screen.getByText(/break activities into shorter steps/i)).toBeDefined();
  fireEvent.change(pain, { target: { value: '7' } });
  expect(screen.getByText(/write down what changed/i)).toBeDefined();
  fireEvent.change(pain, { target: { value: '99' } });
  expect(screen.queryByText(/write down what changed/i)).toBeNull();

  fireEvent.change(screen.getByRole('spinbutton', { name: /energy level/i }), { target: { value: '2' } });
  expect(screen.getByText(/try one small task/i)).toBeDefined();
  fireEvent.change(screen.getByLabelText(/^Mood/), { target: { value: 'Anxious' } });
  const panel = within(screen.getByRole('region', { name: /suggestions based on this check-in/i }));
  expect(panel.getByText(/slow breathing/i)).toBeDefined();
  expect(panel.getByText(/not medical advice, and\s+they cannot tell you what is wrong/i)).toBeDefined();

  fireEvent.click(screen.getByRole('button', { name: 'Hide suggestions' }));
  expect(panel.queryByText(/slow breathing/i)).toBeNull();
  expect(screen.getByText('Suggestions are hidden.')).toBeDefined();
});
