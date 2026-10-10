import { expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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

test('a section fallback keeps the rest of the page and can retry', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  let shouldThrow = true;
  function Flaky() {
    if (shouldThrow) throw new Error('boom');
    return <p>Recovered</p>;
  }
  render(
    <div>
      <p>Other page content</p>
      <ErrorBoundary section="Medicines">
        <Flaky />
      </ErrorBoundary>
    </div>,
  );

  expect(screen.getByText('Other page content')).toBeDefined();
  expect(screen.getByRole('heading', { name: "Medicines couldn't be shown" })).toBeDefined();

  shouldThrow = false;
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(screen.getByText('Recovered')).toBeDefined();
  vi.restoreAllMocks();
});
