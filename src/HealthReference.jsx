import { useMemo, useState } from 'react';
import { referenceEntries, referenceSources } from './healthReferenceData';

const areas = [
  { id: 'all', label: 'All topics' },
  { id: 'medical', label: 'Your body and health' },
  { id: 'nursing', label: 'Nursing basics' },
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

const areaLabel = (area) => (area === 'medical' ? 'Your body and health' : 'Nursing basics');

function entryToText(entry, sourceMap) {
  const sources = entry.sources.map((id) => sourceMap[id]?.label).filter(Boolean);
  return [
    `${entry.title} (${areaLabel(entry.area)})`,
    entry.summary,
    ...entry.points.map((point) => `- ${point}`),
    'Questions to ask my care team:',
    ...entry.questions.map((question) => `- ${question}`),
    `Sources: ${sources.join('; ')}`,
    'General information only, not medical advice.',
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
    setMessage(`${isSaved ? 'Removed' : 'Saved'} “${entry.title}” ${isSaved ? 'from' : 'to'} your saved topics while this page is open.`);
  };

  const copyEntry = async (entry) => {
    try {
      await navigator.clipboard.writeText(entryToText(entry, sourceMap));
      setMessage(`Copied “${entry.title}”. Read it over before you share it.`);
    } catch {
      setMessage('Copying does not work in this browser.');
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
        <h2 id="health-reference-heading">Learn about your body and your care</h2>
        <p>
          Basic health facts from trusted, free sources. This page cannot tell you what is wrong
          or how urgent it is, and it does not take the place of your care team.
        </p>
        <p className="reference-emergency" role="note">
          <strong>In an emergency, call your local emergency number now.</strong> For example:
          trouble breathing, chest pain, confusion, heavy bleeding, a bad allergic reaction, or
          danger right now. If you might hurt yourself, call emergency services or a crisis line
          (such as 988 in the U.S.) right away. Do not use this page to decide if symptoms are
          urgent.
        </p>
      </div>

      <form className="reference-controls" role="search" onSubmit={(event) => event.preventDefault()}>
        <div role="group" aria-label="Topic area" className="reference-filters">
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
            placeholder="For example, handwashing"
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
        Do not type names, health conditions, or other personal details into the search. Your
        searches and saved topics are only kept on this page and are erased when you refresh it.
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
                : 'Try a different word or pick a different topic area.'}
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
                  Last checked: {entry.lastReviewed ?? 'no date yet; not checked by a doctor or nurse'}.
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
          These topics are a starting point, written in our own words. A doctor or nurse has not
          checked them yet. Source links go to each website’s home page, not to the exact page for
          each fact. Normal ranges, doses, and advice can be different from place to place and
          change over time, so check with your care team or the latest source.
        </p>
      </article>
    </section>
  );
}

export default HealthReference;
