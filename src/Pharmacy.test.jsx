import { expect, test } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Pharmacy from './Pharmacy';

test('shows a searchable medication list and potential interaction flags', () => {
  render(<Pharmacy comorbidities="Hypertension" />);

  expect(screen.getByRole('heading', { name: 'Pharmacy' })).toBeDefined();
  expect(screen.getByText(/Ibuprofen may increase bleeding risk/i)).toBeDefined();
  expect(
    screen.getByRole('heading', { name: 'Kidney function and blood pressure' }),
  ).toBeDefined();

  fireEvent.click(screen.getByRole('button', { name: 'Prescription' }));
  const medicationList = screen.getByRole('list', { name: 'Patient medication list' });
  expect(within(medicationList).getByText('Apixaban')).toBeDefined();
  expect(within(medicationList).getByText('Lisinopril')).toBeDefined();
  expect(within(medicationList).queryByText('Ibuprofen')).toBeNull();

  fireEvent.change(screen.getByRole('searchbox', { name: 'Search patient medicines' }), {
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

test('browses the medication catalog and checks interactions when a medicine is added', () => {
  render(<Pharmacy comorbidities="" />);

  expect(screen.getByText(/common examples across major medication classes/i)).toBeDefined();
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search medication catalog' }), {
    target: { value: 'aspirin' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Add to patient list' }));

  expect(screen.getByRole('button', { name: 'Added' })).toBeDefined();
  expect(screen.getByText(/Aspirin may add to apixaban’s blood-thinning effect/i)).toBeDefined();
  expect(
    within(screen.getByRole('list', { name: 'Patient medication list' })).getByText('Aspirin'),
  ).toBeDefined();
});
