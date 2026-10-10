import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

function Broken() {
  throw new Error('boom');
}

test('shows a fallback instead of a blank page when a child crashes', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  render(
    <ErrorBoundary>
      <Broken />
    </ErrorBoundary>,
  );

  expect(screen.getByRole('alert')).toBeDefined();
  expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeDefined();
  expect(screen.getByRole('button', { name: 'Reload the page' })).toBeDefined();
  vi.restoreAllMocks();
});

test('renders children when nothing fails', () => {
  render(
    <ErrorBoundary>
      <p>All good</p>
    </ErrorBoundary>,
  );
  expect(screen.getByText('All good')).toBeDefined();
});
