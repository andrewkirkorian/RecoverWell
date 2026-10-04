import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Pharmacy from './Pharmacy';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test('shows a searchable medication list and potential interaction flags', () => {
  render(<Pharmacy comorbidities="Hypertension" />);

  expect(screen.getByRole('heading', { name: 'Pharmacy' })).toBeDefined();
  expect(screen.getByText(/Ibuprofen may increase bleeding risk/i)).toBeDefined();
  expect(
    screen.getByRole('link', { name: 'DailyMed labeling: apixaban (opens in new tab)' }).getAttribute('href'),
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

test('adds a single-availability medicine from the local reference without inventing a dose', () => {
  render(<Pharmacy comorbidities="" />);

  fireEvent.change(screen.getByRole('combobox', { name: 'Search medication reference' }), {
    target: { value: 'aspirin' },
  });
  const results = screen.getByRole('list', { name: 'Medication search results' });
  fireEvent.click(within(results).getByRole('button', { name: /Add Aspirin/ }));

  const medicationList = screen.getByRole('list', { name: 'Patient medication list' });
  expect(within(medicationList).getByText('Aspirin')).toBeDefined();
  expect(within(medicationList).getByText(/Dose or schedule not entered/i)).toBeDefined();
  const aspirinDose = within(medicationList).getByLabelText('Dose for Aspirin');
  expect(within(aspirinDose).getAllByRole('option').map((o) => o.textContent)).toEqual(
    expect.arrayContaining(['81 mg', '325 mg', 'Other (type it in)']),
  );
  fireEvent.change(aspirinDose, { target: { value: '81 mg' } });
  fireEvent.change(within(medicationList).getByLabelText('How often for Aspirin'), { target: { value: 'Once daily' } });
  expect((within(medicationList).getByLabelText('Dose for Aspirin')).value).toBe('81 mg');
  expect((within(medicationList).getByLabelText('How often for Aspirin')).value).toBe('Once daily');
  expect((within(medicationList).getByLabelText('Dose for Apixaban')).value).toBe('5 mg');
  expect(screen.getByText(/Aspirin may add to apixaban/i)).toBeDefined();
});

test('adds the over-the-counter or prescription form of a dual-availability medicine', () => {
  render(<Pharmacy comorbidities="" />);

  const guide = screen.getByRole('heading', { name: /Sold both over the counter and by prescription/i });
  expect(guide).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: /Add Naproxen Prescription version/ }));
  fireEvent.click(screen.getByRole('button', { name: /Add Naproxen Over the counter version/ }));

  const list = screen.getByRole('list', { name: 'Patient medication list' });
  expect(within(list).getAllByText('Naproxen')).toHaveLength(2);
  expect(within(list).getByText(/^Prescription · 3$/)).toBeDefined();
  expect(within(list).getByText(/^Over the counter · 3$/)).toBeDefined();
  expect(screen.getByRole('button', { name: /Naproxen Prescription is on the patient list|Naproxen Prescription is on/ })).toBeDefined();
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

test('catches interactions among four blood thinners including an over-the-counter aspirin', () => {
  const medications = ['warfarin', 'clopidogrel', 'rivaroxaban', 'aspirin'].map((id) => ({
    id: id === 'aspirin' ? 'aspirin-81' : id,
    ingredientId: id,
    name: id === 'aspirin' ? 'Aspirin 81 MG Oral Tablet' : id,
    detail: '',
    category: id === 'aspirin' ? 'Over the counter' : 'Prescription',
    purpose: '',
  }));
  render(<Pharmacy comorbidities="" medications={medications} onMedicationsChange={() => {}} />);

  expect(screen.getByRole('heading', { name: 'Several medicines that affect bleeding' })).toBeDefined();
  expect(screen.getAllByRole('heading', { name: 'Multiple blood thinners' }).length).toBe(2);
  expect(screen.getAllByRole('heading', { name: 'Bleeding risk' }).length).toBe(4);
  expect(screen.queryByText(/Not screened \(/)).toBeNull();
});

test('groups the patient list by prescription and over-the-counter availability', () => {
  render(<Pharmacy comorbidities="" />);

  const list = screen.getByRole('list', { name: 'Patient medication list' });
  expect(within(list).getByText(/^Prescription · 2$/)).toBeDefined();
  expect(within(list).getByText(/^Over the counter · 2$/)).toBeDefined();
  expect(screen.queryByRole('button', { name: /varies/i })).toBeNull();
});

test('adds from the built-in reference list and screens it immediately', () => {
  render(<Pharmacy comorbidities="" />);

  fireEvent.change(screen.getByRole('combobox', { name: 'Search medication reference' }), {
    target: { value: 'warfarin' },
  });
  const reference = screen.getByRole('list', { name: 'Medication search results' });
  fireEvent.click(within(reference).getByRole('button', { name: /Add Warfarin/ }));

  expect(screen.getAllByRole('heading', { name: 'Multiple blood thinners' }).length).toBe(1);
  expect(screen.getAllByText(/Warfarin/).length).toBeGreaterThan(0);
});

function mockRxNormAndFda({ rxnorm, fda }) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url) => {
      const text = decodeURIComponent(String(url));
      if (text.includes('approximateTerm')) return { ok: true, status: 200, json: async () => ({ approximateGroup: { candidate: rxnorm } }) };
      const key = Object.keys(fda).find((code) => text.includes('"' + code + '"'));
      if (!key) return { ok: false, status: 404, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => ({ results: fda[key].map((term) => ({ term, count: 5 })) }) };
    }),
  );
}

test('RxNorm search results are each marked Prescription or Over the counter from FDA labeling', async () => {
  mockRxNormAndFda({
    rxnorm: [
      { rxcui: '310965', name: 'Ibuprofen 200 MG Oral Tablet', source: 'RXNORM' },
      { rxcui: '197884', name: 'Zolpidem 10 MG Oral Tablet', source: 'RXNORM' },
      { rxcui: '555', name: 'Mystery 5 MG Oral Tablet', source: 'RXNORM' },
      { rxcui: '555', name: 'Mystery 5 MG Oral Tablet', source: 'RXNORM' },
    ],
    fda: { 310965: ['HUMAN OTC DRUG'], 197884: ['HUMAN PRESCRIPTION DRUG'] },
  });
  render(<Pharmacy comorbidities="" />);

  fireEvent.change(screen.getByRole('combobox', { name: 'Search medication reference' }), {
    target: { value: 'zolpidem' },
  });
  const results = screen.getByRole('list', { name: 'Medication search results' });
  await waitFor(() => expect(within(results).getByText('Zolpidem 10 MG Oral Tablet')).toBeDefined());
  expect(within(results).getAllByText('Prescription').length).toBeGreaterThan(0);
  expect(within(results).getAllByText('Over the counter').length).toBeGreaterThan(0);
  expect(within(results).getByText(/Prescription status not confirmed/)).toBeDefined();
  expect(within(results).getAllByText('Mystery 5 MG Oral Tablet')).toHaveLength(1);
  expect(within(results).queryByRole('button', { name: /Mystery/ })).toBeNull();

  fireEvent.click(within(results).getByRole('button', { name: /Add Zolpidem 10 MG Oral Tablet/ }));
  const list = screen.getByRole('list', { name: 'Patient medication list' });
  expect(within(list).getByText('Zolpidem 10 MG Oral Tablet')).toBeDefined();
  expect(within(list).getByText(/^Prescription · 3$/)).toBeDefined();
});

test('an RxNorm result sold both ways offers an Rx and an OTC add button', async () => {
  mockRxNormAndFda({
    rxnorm: [{ rxcui: '777', name: 'Examplamine', source: 'RXNORM' }],
    fda: { 777: ['HUMAN OTC DRUG', 'HUMAN PRESCRIPTION DRUG'] },
  });
  render(<Pharmacy comorbidities="" />);
  fireEvent.change(screen.getByRole('combobox', { name: 'Search medication reference' }), {
    target: { value: 'examplamine' },
  });
  const results = await screen.findByRole('list', { name: 'Medication search results' });
  await waitFor(() => expect(within(results).getByRole('button', { name: /Add Examplamine Prescription version/ })).toBeDefined());
  fireEvent.click(within(results).getByRole('button', { name: /Add Examplamine Over the counter version/ }));
  const list = screen.getByRole('list', { name: 'Patient medication list' });
  expect(within(list).getByText(/^Over the counter · 3$/)).toBeDefined();
});

test('falls back to the built-in list with a notice when RxNorm is unavailable', async () => {
  render(<Pharmacy comorbidities="" />);
  fireEvent.change(screen.getByRole('combobox', { name: 'Search medication reference' }), {
    target: { value: 'warfarin' },
  });
  expect((await screen.findByRole('alert')).textContent).toMatch(/Showing the built-in list only/i);
  expect(within(screen.getByRole('list', { name: 'Medication search results' })).getByText('Warfarin')).toBeDefined();
});

test('dose menus list strengths by form and allow a custom dose', () => {
  render(<Pharmacy comorbidities="" />);
  const list = screen.getByRole('list', { name: 'Patient medication list' });

  const ibuprofen = within(list).getByLabelText('Dose for Ibuprofen');
  const labels = within(ibuprofen).getAllByRole('option').map((o) => o.textContent);
  expect(labels).toContain('200 mg');
  expect(labels).not.toContain('800 mg');
  expect(ibuprofen.value).toBe('__other__');
  expect(within(list).getByLabelText('Other dose for Ibuprofen').value).toBe('400 mg');

  const apixaban = within(list).getByLabelText('Dose for Apixaban');
  expect(apixaban.value).toBe('5 mg');
  fireEvent.change(apixaban, { target: { value: '__other__' } });
  fireEvent.change(within(list).getByLabelText('Other dose for Apixaban'), { target: { value: '7.5 mg' } });
  expect(within(list).getByLabelText('Other dose for Apixaban').value).toBe('7.5 mg');
});
