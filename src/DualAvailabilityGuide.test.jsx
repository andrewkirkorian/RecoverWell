import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import DualAvailabilityGuide from './DualAvailabilityGuide';
import { dualAvailabilityMedications } from './dualAvailabilityMedications';

describe('DualAvailabilityGuide', () => {
  test('shows the unreviewed disclosure and one card per medicine', () => {
    const { container } = render(<DualAvailabilityGuide isListed={() => false} onAdd={() => {}} />);
    expect(screen.getByRole('note').textContent).toMatch(/A doctor or pharmacist has not checked\s+these doses/);
    expect(container.querySelectorAll('details.dual-card')).toHaveLength(dualAvailabilityMedications.length);
  });

  test('adds the chosen availability version', () => {
    const onAdd = vi.fn();
    render(<DualAvailabilityGuide isListed={() => false} onAdd={onAdd} />);
    const column = screen.getByRole('region', { name: 'Naproxen Prescription', hidden: true });
    fireEvent.click(within(column).getByRole('button', { hidden: true }));
    const entry = dualAvailabilityMedications.find((m) => m.name === 'Naproxen');
    expect(onAdd).toHaveBeenCalledWith(entry.id, 'Prescription');
  });

  test('disables a version already on your list', () => {
    render(
      <DualAvailabilityGuide
        isListed={(id, availability) => id === 'ibuprofen' && availability === 'Over the counter'}
        onAdd={() => {}}
      />,
    );
    const column = screen.getByRole('region', { name: 'Ibuprofen Over the counter', hidden: true });
    const button = within(column).getByRole('button', { hidden: true });
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain('On your list');
  });

  test('links sources to external pages that open in a new tab', () => {
    render(<DualAvailabilityGuide isListed={() => false} onAdd={() => {}} />);
    const links = screen.getAllByRole('link', { hidden: true });
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => {
      expect(link.getAttribute('href')).toMatch(/^https:\/\//);
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
    });
  });
});
