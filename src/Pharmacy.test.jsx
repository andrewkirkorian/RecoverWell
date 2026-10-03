import { afterEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Pharmacy from './Pharmacy';

afterEach(() => {
  vi.unstubAllGlobals();
});

test('shows a searchable medication list and potential interaction flags', () => {
  render(<Pharmacy comorbidities="Hypertension" />);

  expect(screen.getByRole('heading', { name: 'Pharmacy' })).toBeDefined();
  expect(screen.getByText(/Ibuprofen may increase bleeding risk/i)).toBeDefined();
  expect(
    screen.getByRole('link', { name: 'DailyMed labeling: apixaban' }).getAttribute('href'),
  ).toContain('dailymed.nlm.nih.gov');
  expect(
    screen.getByRole('heading', { name: 'Kidney function and blood pressure' }),
  ).toBeDefined();
  expect(screen.getByText(/independently written prompts link to public DailyMed drug labeling/i)).toBeDefined();

  fireEvent.click(screen.getByRole('button', { name: 'Prescription' }));
  const medicationList = screen.getByRole('list', { name: 'Patient medication list' });
  expect(within(medicationList).getByText('Apixaban')).toBeDefined();
  expect(within(medicationList).getByText('Lisinopril')).toBeDefined();
  expect(within(medicationList).queryByText('Ibuprofen')).toBeNull();

  fireEvent.change(screen.getByRole('combobox', { name: 'Search patient medicines' }), {
    target: { value: 'lisinopril' },
  });
  expect(within(medicationList).getByText('Lisinopril')).toBeDefined();
  expect(within(medicationList).queryByText('Apixaban')).toBeNull();
});

test('flags an NSAID when kidney disease is in the patient profile', () => {
  render(<Pharmacy comorbidities="Hypertension, CKD" />);

  expect(screen.getByText(/kidney disease noted in patient profile/i)).toBeDefined();
  expect(screen.getByText(/NSAIDs such as ibuprofen may worsen kidney function/i)).toBeDefined();
});

test('searches RxNorm and adds a selected term without inventing dose or interaction data', async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      approximateGroup: {
        candidate: [
          { rxcui: '123', name: 'Aspirin', source: 'VANDF' },
          { rxcui: '123', name: 'aspirin', source: 'RXNORM' },
          { rxcui: '456', name: 'Aspirin Oral Tablet', source: 'RXNORM' },
          { rxcui: '789', name: 'Aspirin', source: 'DRUGBANK' },
        ],
      },
    }),
  });
  vi.stubGlobal('fetch', fetchMock);
  render(<Pharmacy comorbidities="" />);

  expect(screen.getByText(/Search terms are sent to the U\.S\. National Library of Medicine/i)).toBeDefined();
  expect(screen.getByText(/historical or discontinued drug coverage is not guaranteed/i)).toBeDefined();

  const catalogSearch = screen.getByRole('combobox', { name: 'Search medication catalog' });
  expect(catalogSearch.getAttribute('list')).toBe('rxnorm-medication-suggestions');
  fireEvent.change(catalogSearch, { target: { value: 'aspirin' } });

  await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
  const [url] = fetchMock.mock.calls[0];
  expect(String(url)).toContain('term=aspirin');

  const catalogList = screen.getByRole('list', { name: 'Medication catalog' });
  await waitFor(() => expect(within(catalogList).getByText('aspirin', { exact: true })).toBeDefined());
  expect(within(catalogList).getByText(/aspirin oral tablet/i)).toBeDefined();
  expect(document.querySelectorAll('#rxnorm-medication-suggestions option')).toHaveLength(2);

  fireEvent.click(within(catalogList).getAllByRole('button', { name: 'Mark patient-reported' })[0]);
  const medicationList = screen.getByRole('list', { name: 'Patient medication list' });
  expect(within(medicationList).getByText('aspirin', { exact: true })).toBeDefined();
  expect(within(medicationList).getByText(/Dose and schedule not provided/i)).toBeDefined();
  expect(screen.getByText(/does not check it for interactions/i)).toBeDefined();
  expect(screen.queryByText(/Aspirin may add to apixaban/i)).toBeNull();
});

test('shows a search error rather than presenting an empty catalog on API failure', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
  render(<Pharmacy comorbidities="" />);

  fireEvent.change(screen.getByRole('combobox', { name: 'Search medication catalog' }), {
    target: { value: 'metformin' },
  });

  expect((await screen.findByRole('alert')).textContent).toMatch(/RxNorm search failed \(HTTP 503\)/i);
  expect(screen.queryByText(/No active RxNorm matches found/i)).toBeNull();
});

test('offers patient-list names as local autocomplete suggestions', () => {
  render(<Pharmacy comorbidities="" />);

  const patientSearch = screen.getByRole('combobox', { name: 'Search patient medicines' });
  expect(patientSearch.getAttribute('list')).toBe('patient-medication-suggestions');
  expect(document.querySelector('#patient-medication-suggestions option[value="Apixaban"]')).not.toBeNull();

  fireEvent.change(patientSearch, { target: { value: 'apixaban' } });
  expect(
    within(screen.getByRole('list', { name: 'Patient medication list' })).getByText('Apixaban'),
  ).toBeDefined();
});
