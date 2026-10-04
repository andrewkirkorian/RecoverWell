import { afterEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import HealthReference from './HealthReference';
import { referenceEntries, referenceSources } from './healthReferenceData';

afterEach(() => vi.unstubAllGlobals());

test('every entry cites known sources over https and has questions', () => {
  const ids = new Set(referenceSources.map((source) => source.id));
  referenceSources.forEach((source) => expect(source.url.startsWith('https://')).toBe(true));
  referenceEntries.forEach((entry) => {
    expect(entry.sources.length).toBeGreaterThan(0);
    expect(entry.questions.length).toBeGreaterThan(0);
    entry.sources.forEach((id) => expect(ids.has(id)).toBe(true));
  });
});

test('shows emergency wording, filters, normalized search, and a recoverable empty state', () => {
  render(<HealthReference />);
  expect(screen.getByText(/does not diagnose/i)).toBeDefined();
  expect(screen.getByRole('note').textContent).toMatch(/call your local emergency number now/i);

  fireEvent.click(screen.getByRole('button', { name: 'Nursing assistant' }));
  expect(screen.getByRole('heading', { name: 'The nursing process' })).toBeDefined();
  expect(screen.queryByRole('heading', { name: 'Homeostasis and feedback' })).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'All topics' }));
  fireEvent.change(screen.getByLabelText('Search topics'), { target: { value: '  HAND   Hygiene! ' } });
  expect(screen.getByRole('heading', { name: 'Infection basics and hand hygiene' })).toBeDefined();
  expect(screen.getByRole('status').textContent).toMatch(/Showing 1 topic\./);

  fireEvent.change(screen.getByLabelText('Search topics'), { target: { value: 'zzzz' } });
  expect(screen.getByRole('heading', { name: 'No topics match' })).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: 'Clear search and filters' }));
  expect(screen.getByLabelText('Search topics').value).toBe('');
  expect(screen.getByRole('heading', { name: 'The nursing process' })).toBeDefined();
});

test('saves topics for the session and filters to saved topics', () => {
  render(<HealthReference />);
  fireEvent.click(screen.getByRole('button', { name: 'Save topic The nursing process' }));
  expect(screen.getByRole('status').textContent).toMatch(/Saved “The nursing process”/);
  fireEvent.click(screen.getByRole('button', { name: 'Saved topics (1)' }));
  expect(screen.getByRole('heading', { name: 'The nursing process' })).toBeDefined();
  expect(screen.queryByRole('heading', { name: 'Homeostasis and feedback' })).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Unsave topic The nursing process' }));
  expect(screen.getByText('You have not saved any topics yet.')).toBeDefined();
});

test('external links open safely and cards list questions and review status', () => {
  render(<HealthReference />);
  const link = screen.getAllByRole('link', { name: /OpenStax/i })[0];
  expect(link.getAttribute('target')).toBe('_blank');
  expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  expect(screen.getAllByText(/Questions to ask your care team/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/date not provided; not clinically reviewed/i).length).toBeGreaterThan(0);
});

test('copies a topic summary and reports clipboard failure', async () => {
  const writeText = vi.fn().mockResolvedValue();
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  render(<HealthReference />);
  fireEvent.click(screen.getByRole('button', { name: 'Copy summary of The nursing process' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/Copied/));
  expect(writeText.mock.calls[0][0]).toMatch(/not medical advice/);

  writeText.mockRejectedValueOnce(new Error('no'));
  fireEvent.click(screen.getByRole('button', { name: 'Copy summary of The nursing process' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/not available/));
});

test('print button calls window.print', () => {
  const print = vi.spyOn(window, 'print').mockImplementation(() => {});
  render(<HealthReference />);
  fireEvent.click(within(screen.getByRole('search')).getByRole('button', { name: 'Print this reference' }));
  expect(print).toHaveBeenCalled();
  print.mockRestore();
});
