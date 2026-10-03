import { expect, test } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

test('renders Recover Well and updates recovery progress', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /recover well/i })).toBeDefined();
  expect(screen.getByText(/today's recovery plan/i)).toBeDefined();

  fireEvent.click(screen.getByRole('checkbox', { name: /mark walk to the window complete/i }));

  expect(screen.getByText(/75% complete/i)).toBeDefined();
});
