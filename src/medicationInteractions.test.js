import { expect, test } from 'vitest';
import { screenMedications } from './medicationInteractions';

const med = (id, name) => ({ id, name });

test.each([
  ['omeprazole', 'Omeprazole'],
  ['esomeprazole', 'Esomeprazole'],
])('flags clopidogrel with %s as High', (id, name) => {
  const { interactions } = screenMedications([med('clopidogrel', 'Clopidogrel'), med(id, name)]);
  expect(interactions).toHaveLength(1);
  expect(interactions[0]).toMatchObject({
    level: 'High',
    title: 'Blood thinner may not work as well',
    sourceDrug: 'clopidogrel',
  });
  expect(interactions[0].description).toContain(`${name} can make Clopidogrel work less well`);
});

test('does not flag clopidogrel with other acid reducers', () => {
  for (const [id, name] of [['lansoprazole', 'Lansoprazole'], ['famotidine', 'Famotidine']]) {
    const { interactions } = screenMedications([med('clopidogrel', 'Clopidogrel'), med(id, name)]);
    expect(interactions).toHaveLength(0);
  }
});
