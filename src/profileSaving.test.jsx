import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { STORAGE_KEY } from './profileStorage';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function createDemoProfile(name = 'Alex') {
  fireEvent.change(screen.getByLabelText('Display name'), { target: { value: name } });
  fireEvent.click(screen.getByRole('button', { name: /create demo profile/i }));
}

function openSection(section, button) {
  fireEvent.click(screen.getByText(section));
  fireEvent.click(screen.getByRole('button', { name: button }));
}

describe('saving demo profiles on this device', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  test('does not save anything unless saving is turned on', () => {
    const { unmount } = render(<App />);
    expect(screen.getByLabelText('Save my demo profiles on this device')).not.toBeChecked();
    createDemoProfile('Riley');
    unmount();

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Sign up for a demo profile' })).toBeDefined();
  });

  test('keeps profiles and their reminders after a reload when saving is on', () => {
    const { unmount } = render(<App />);
    fireEvent.click(screen.getByLabelText('Save my demo profiles on this device'));
    expect(screen.getByText(/saved in this browser without encryption/i)).toBeDefined();
    createDemoProfile('Riley');
    openSection('My recovery', 'Daily plan');
    fireEvent.change(screen.getByLabelText('Add a personal reminder'), {
      target: { value: 'Walk to the mailbox' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add reminder' }));
    unmount();

    render(<App />);
    expect(screen.getByRole('heading', { name: 'Sign in to a demo profile' })).toBeDefined();
    fireEvent.change(screen.getByLabelText('Demo profile'), {
      target: { value: screen.getByRole('option', { name: 'Riley' }).value },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByRole('heading', { name: "Riley's recovery, in one place." })).toBeDefined();
    openSection('My recovery', 'Daily plan');
    expect(screen.getByText('Walk to the mailbox')).toBeDefined();
  });

  test('turning saving off erases the saved copy', () => {
    render(<App />);
    const toggle = screen.getByLabelText('Save my demo profiles on this device');
    fireEvent.click(toggle);
    createDemoProfile('Riley');
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Switch profile' }));
    fireEvent.click(screen.getByLabelText('Save my demo profiles on this device'));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.getByRole('option', { name: 'Riley' })).toBeDefined();
  });

  test('erase button removes every profile from the page and the device', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Save my demo profiles on this device'));
    createDemoProfile('Riley');
    fireEvent.click(screen.getByRole('button', { name: 'Switch profile' }));
    fireEvent.click(screen.getByRole('button', { name: 'Erase all demo profiles' }));

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.getByRole('heading', { name: 'Sign up for a demo profile' })).toBeDefined();
    expect(screen.getByLabelText('Save my demo profiles on this device')).not.toBeChecked();
    expect(screen.getByRole('status').textContent).toMatch(/erased/i);
  });

  test('ignores damaged saved data', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Sign up for a demo profile' })).toBeDefined();
    expect(screen.getByLabelText('Save my demo profiles on this device')).not.toBeChecked();
  });
});
