import { useMemo, useState } from 'react';
import { referenceEntries, referenceSources } from './healthReferenceData';

const areas = [
  { id: 'all', label: 'All topics' },
  { id: 'medical', label: 'Medical issues' },
  { id: 'nursing', label: 'Nursing assistant' },
  { id: 'saved', label: 'Saved topics' },
];

const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const areaLabel = (area) => (area === 'medical' ? 'Medical issues' : 'Nursing assistant');

function entryToText(entry, sourceMap) {
  const sources = entry.sources.map((id) => sourceMap[id]?.label).filter(Boolean);
  return [
    `${entry.title} (${areaLabel(entry.area)})`,
    entry.summary,
    ...entry.points.map((point) => `- ${point}`),
    'Questions to ask my care team:',
    ...entry.questions.map((question) => `- ${question}`),
    `Sources: ${sources.join('; ')}`,
    'General education only; not medical advice.',
  ].join('\n');
}

function HealthReference() {
  const [area, setArea] = useState('all');
  const [query, setQuery] = useState('');
  const [savedIds, setSavedIds] = useState([]);
  const [message, setMessage] = useState('');
  const sourceMap = useMemo(
    () => Object.fromEntries(referenceSources.map((source) => [source.id, source])),
    [],
  );

  const visibleEntries = useMemo(() => {
    const needle = normalize(query);
    return referenceEntries.filter((entry) => {
      if (area === 'saved' && !savedIds.includes(entry.id)) return false;
      if (area !== 'all' && area !== 'saved' && entry.area !== area) return false;
      if (!needle) return true;
      const haystack = normalize(
        [entry.title, entry.topic, areaLabel(entry.area), entry.summary, ...entry.points, ...entry.questions].join(' '),
      );
      return haystack.includes(needle);
    });
  }, [area, query, savedIds]);

  const toggleSaved = (entry) => {
    const isSaved = savedIds.includes(entry.id);
    setSavedIds((current) => (isSaved ? current.filter((id) => id !== entry.id) : [...current, entry.id]));
    setMessage(`${isSaved ? 'Removed' : 'Saved'} “${entry.title}” ${isSaved ? 'from' : 'to'} saved topics for this page session.`);
  };

  const copyEntry = async (entry) => {
    try {
      await navigator.clipboard.writeText(entryToText(entry, sourceMap));
      setMessage(`Copied “${entry.title}”. Review before sharing.`);
    } catch {
      setMessage('Copy was not available in this browser.');
    }
  };

  const clearFilters = () => {
    setQuery('');
    setArea('all');
    setMessage('Search and filters cleared.');
  };

  return (
    <section className="selfcare-section reference-page" aria-labelledby="health-reference-heading">
      <div className="section-heading">
        <p className="eyebrow">HEALTH REFERENCE</p>
        <h2 id="health-reference-heading">Medical issues and nursing assistant</h2>
        <p>
          General education drawn from open science and health references. It does not diagnose,
          assess urgency, or replace your care team.
        </p>
        <p className="reference-emergency" role="note">
          <strong>In an emergency, call your local emergency number now.</strong> Examples include
          trouble breathing, chest pain, confusion, heavy bleeding, a severe allergic reaction, or
          immediate danger. If you may harm yourself, contact emergency services or a local crisis
          line right away. Do not use this page to decide whether symptoms are urgent.
        </p>
      </div>

      <form className="reference-controls" role="search" onSubmit={(event) => event.preventDefault()}>
        <div role="group" aria-label="Reference area" className="reference-filters">
          {areas.map((item) => (
            <button
              key={item.id}
              type="button"
              className="task-add-button"
              aria-pressed={area === item.id}
              onClick={() => setArea(item.id)}
            >
              {item.id === 'saved' ? `${item.label} (${savedIds.length})` : item.label}
            </button>
          ))}
        </div>
        <label htmlFor="reference-search">
          Search topics
          <input
            id="reference-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="For example, hand hygiene"
            aria-controls="reference-results"
          />
        </label>
        {query && (
          <button type="button" className="task-remove-button" onClick={() => setQuery('')}>
            Clear search
          </button>
        )}
        <button type="button" className="task-remove-button no-print" onClick={() => window.print()}>
          Print this reference
        </button>
      </form>
      <p className="planner-disclaimer">
        Do not type names, diagnoses, or other identifying details into search. Search text and saved
        topics stay in this page only and are cleared when you reload.
      </p>

      <p role="status">
        {message || `Showing ${visibleEntries.length} ${visibleEntries.length === 1 ? 'topic' : 'topics'}.`}
      </p>
      <p className="visually-hidden" aria-live="polite">
        {visibleEntries.length} {visibleEntries.length === 1 ? 'topic' : 'topics'} shown.
      </p>

      <div id="reference-results" className="selfcare-grid">
        {visibleEntries.length === 0 && (
          <article className="selfcare-card">
            <h3>No topics match</h3>
            <p>
              {area === 'saved' && !query
                ? 'You have not saved any topics yet.'
                : 'Try a different word or switch the area filter.'}
            </p>
            <button type="button" className="task-add-button" onClick={clearFilters}>
              Clear search and filters
            </button>
          </article>
        )}
        {visibleEntries.map((entry) => {
          const isSaved = savedIds.includes(entry.id);
          return (
            <article className="selfcare-card" key={entry.id}>
              <div className="selfcare-card-header">
                <p className="eyebrow">
                  {areaLabel(entry.area).toUpperCase()} · {entry.topic.toUpperCase()}
                </p>
                <h3>{entry.title}</h3>
              </div>
              <p>{entry.summary}</p>
              <details className="reference-details">
                <summary>
                  Details, questions, and sources<span className="visually-hidden">: {entry.title}</span>
                </summary>
                <ul>
                  {entry.points.map((point) => <li key={point}>{point}</li>)}
                </ul>
                <h4>Questions to ask your care team</h4>
                <ul>
                  {entry.questions.map((question) => <li key={question}>{question}</li>)}
                </ul>
                <p className="planner-disclaimer">
                  Sources (open in a new tab):{' '}
                  {entry.sources.map((id, index) => (
                    <span key={id}>
                      {index > 0 && '; '}
                      {sourceMap[id] ? (
                        <a href={sourceMap[id].url} target="_blank" rel="noopener noreferrer">
                          {sourceMap[id].label}
                        </a>
                      ) : (
                        'Unknown source'
                      )}
                    </span>
                  ))}
                </p>
                <p className="planner-disclaimer">
                  Last reviewed: {entry.lastReviewed ?? 'date not provided; not clinically reviewed'}.
                </p>
              </details>
              <div className="reference-card-actions no-print">
                <button
                  type="button"
                  className="task-add-button"
                  aria-pressed={isSaved}
                  aria-label={`${isSaved ? 'Unsave' : 'Save'} topic ${entry.title}`}
                  onClick={() => toggleSaved(entry)}
                >
                  {isSaved ? 'Saved ✓' : 'Save topic'}
                </button>
                <button
                  type="button"
                  className="task-remove-button"
                  aria-label={`Copy summary of ${entry.title}`}
                  onClick={() => copyEntry(entry)}
                >
                  Copy summary
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <article className="selfcare-card">
        <p className="planner-disclaimer">
          This compiled set is a paraphrased starting point and has not been clinically reviewed.
          Source links go to each site’s main page, not to the exact page supporting a statement.
          Reference ranges, doses, and guidelines vary by place and date; confirm with your
          clinician or the current source.
        </p>
      </article>
    </section>
  );
}

export default HealthReference;
