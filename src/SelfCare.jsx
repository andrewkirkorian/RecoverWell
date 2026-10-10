import { useMemo, useState } from 'react';

const selfCareGoals = [
  { id: 'water', label: 'Drinks', hint: 'Follow any fluid guidance your care team gave you.' },
  { id: 'movement', label: 'Move a little each day', hint: 'Follow your clinician-approved movement plan, even in short sessions.' },
  { id: 'rest', label: 'Protect your energy', hint: 'Build rest into your routine and pace activities realistically.' },
  { id: 'meds', label: 'Medicine questions', hint: 'Take medicines only as directed; ask your care team or pharmacist if unsure.' },
];

const selfCareReminders = [
  'If it helps, note when symptoms change or what makes you more comfortable.',
  'Keep a note of which habits feel easiest and which ones feel tiring.',
  'Call your care team if a symptom worsens, new symptoms appear, or you feel unsure.',
];

const generalHealthTips = [
  {
    title: 'Nourish yourself in ways that work for you',
    detail:
      'When you can, choose a variety of nourishing foods that fit your culture, preferences, budget, and access. There is no single eating pattern that works for everyone.',
  },
  {
    title: 'Find movement that fits your circumstances',
    detail:
      'Everyday movement can support physical and mental well-being. Choose an activity that suits your abilities, and follow your care team’s instructions about activity, especially during recovery.',
  },
  {
    title: 'Make room for rest',
    detail:
      'A regular wind-down routine and a comfortable sleep environment may support rest. If sleep problems persist or affect daily life, consider raising them with a health professional.',
  },
  {
    title: 'Care for emotional well-being',
    detail:
      'If it feels comfortable, try a brief pause, slow breathing, or a relaxation practice. These are optional ways to support well-being, not a substitute for mental health care.',
  },
  {
    title: 'Stay connected and ask for practical support',
    detail:
      'If you wish, share what would help with someone you trust—such as company, help with everyday tasks, or support preparing questions for a care visit.',
  },
  {
    title: 'Be thoughtful about complementary products and practices',
    detail:
      '“Natural” does not always mean safe. Herbs and supplements can have risks or interact with medicines; discuss them with a pharmacist or care professional before use.',
  },
];

const initialCheckIn = {
    pain: '',
    energy: '',
    sleep: '',
    mood: '',
    notes: '',
};
const initialPlannedHabits = {
    water: false,
    movement: false,
    medicine: false,
    rest: false,
};
const initialCustomHabits = [];
const initialCheckInEntries = {};
const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (value) => String(value).padStart(2, '0');
const toDateKey = (year, monthIndex, day) => `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
const getTodayKey = () => {
  const now = new Date();
  return toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
};
const formatDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return `${monthNames[month - 1]} ${day}, ${year}`;
};

function hasCheckInDetails(checkIn) {
  return (
    checkIn.pain !== '' ||
    checkIn.energy !== '' ||
    checkIn.sleep !== '' ||
    Boolean(checkIn.mood) ||
    Boolean(checkIn.notes.trim())
  );
}

function summarizeCheckIn(checkIn) {
  const entries = [];
  if (checkIn.pain !== '') entries.push(`Pain level you entered: ${checkIn.pain}/10`);
  if (checkIn.energy !== '') entries.push(`Energy you entered: ${checkIn.energy}/10`);
  if (checkIn.sleep !== '') entries.push(`Sleep you entered: ${checkIn.sleep} hours`);
  if (checkIn.mood) entries.push(`Mood you selected: ${checkIn.mood}`);
  if (checkIn.notes.trim()) entries.push(`Your note: ${checkIn.notes.trim()}`);
  return entries.length ? entries.join('. ') : 'No check-in details entered.';
}

const numericValue = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

// Deterministic, general wellness ideas keyed to entered values only. Not an assessment.
function getSuggestedTips(checkIn) {
  const pain = numericValue(checkIn.pain);
  const energy = numericValue(checkIn.energy);
  const sleep = numericValue(checkIn.sleep);
  const tips = [];
  const add = (tip) => { if (!tips.includes(tip)) tips.push(tip); };

  if (pain !== null && pain >= 0 && pain <= 10) {
    if (pain >= 7) {
      add('Pace yourself, take comfortable pauses, and use comfort measures your care team has approved.');
      add('Write down what changed, what helped, and any questions for your care team.');
    } else if (pain >= 4) {
      add('Break activities into shorter steps and build in comfortable rest.');
    }
  }
  if (energy !== null && energy >= 0 && energy <= 10) {
    if (energy <= 3) {
      add('Try one small task, then pause. Consider telling someone you trust what practical help would support you.');
    } else if (energy <= 6) {
      add('Alternate activity with rest. Choose gentle movement only when it fits your care team’s guidance.');
    }
  }
  if (sleep !== null && sleep >= 0 && sleep <= 24) {
    if (sleep < 6) {
      add('Try a calm wind-down routine and keep your sleep space comfortable. Mention ongoing sleep changes to your care team.');
    } else if (sleep >= 9) {
      add('Notice whether this sleep pattern continues, and note it for your next care visit if useful.');
    }
  }
  if (checkIn.mood === 'Low' || checkIn.mood === 'Anxious') {
    add('A brief pause, slow breathing, or a grounding exercise may help. Consider reaching out to someone you trust.');
  } else if (checkIn.mood === 'Tired') {
    add('Reduce demands where you can, and keep easy food and fluid options nearby that fit your needs.');
  } else if (checkIn.mood === 'Hopeful' || checkIn.mood === 'Steady') {
    add('Pick one enjoyable or connecting activity that feels manageable today.');
  }
  return tips.slice(0, 4);
}

function SelfCare({
    profileCheckIn,
    onProfileCheckInChange,
    profilePlannedHabits,
    onProfilePlannedHabitsChange,
    profileCustomHabits,
    onProfileCustomHabitsChange,
    profileCheckInEntries,
    onProfileCheckInEntriesChange,
}) {
    const [localCheckIn, setLocalCheckIn] = useState(initialCheckIn);
    const [localPlannedHabits, setLocalPlannedHabits] = useState(initialPlannedHabits);
    const [localCustomHabits, setLocalCustomHabits] = useState(initialCustomHabits);
    const [localCheckInEntries, setLocalCheckInEntries] = useState(initialCheckInEntries);
    const [customHabitName, setCustomHabitName] = useState('');
    const [selectedDate, setSelectedDate] = useState(getTodayKey);
    const [viewedMonth, setViewedMonth] = useState(() => getTodayKey().slice(0, 7));
    const [saveMessage, setSaveMessage] = useState('');
    const [tipsHidden, setTipsHidden] = useState(false);
    const checkIn = profileCheckIn ?? localCheckIn;
    const plannedHabits = profilePlannedHabits ?? localPlannedHabits;
    const customHabits = profileCustomHabits ?? localCustomHabits;
    const savedEntries = profileCheckInEntries ?? localCheckInEntries;
    const updateCheckIn = onProfileCheckInChange ?? setLocalCheckIn;
    const updatePlannedHabits = onProfilePlannedHabitsChange ?? setLocalPlannedHabits;
    const updateCustomHabits = onProfileCustomHabitsChange ?? setLocalCustomHabits;
    const updateSavedEntries = onProfileCheckInEntriesChange ?? setLocalCheckInEntries;

    const completedHabits =
      Object.values(plannedHabits).filter(Boolean).length +
      customHabits.filter((habit) => habit.done).length;
    const totalHabits = Object.keys(plannedHabits).length + customHabits.length;

  const summary = useMemo(() => summarizeCheckIn(checkIn), [checkIn]);
  const suggestedTips = useMemo(() => getSuggestedTips(checkIn), [checkIn]);

  const [viewedYear, viewedMonthNumber] = viewedMonth.split('-').map(Number);
  const calendarCells = useMemo(() => {
    const monthIndex = viewedMonthNumber - 1;
    const leadingBlanks = new Date(viewedYear, monthIndex, 1).getDay();
    const daysInMonth = new Date(viewedYear, monthIndex + 1, 0).getDate();
    return [
      ...Array.from({ length: leadingBlanks }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => toDateKey(viewedYear, monthIndex, index + 1)),
    ];
  }, [viewedYear, viewedMonthNumber]);

  const selectedEntry = savedEntries[selectedDate];
  const savedCount = Object.keys(savedEntries).length;
  const todayKey = getTodayKey();

  const selectDate = (dateKey) => {
    setSelectedDate(dateKey);
    setViewedMonth(dateKey.slice(0, 7));
    setSaveMessage('');
  };

  const changeMonth = (offset) => {
    const next = new Date(viewedYear, viewedMonthNumber - 1 + offset, 1);
    setViewedMonth(`${next.getFullYear()}-${pad(next.getMonth() + 1)}`);
  };

  const saveCheckIn = () => {
    if (!selectedDate) return;
    if (!hasCheckInDetails(checkIn)) {
      setSaveMessage('Enter at least one check-in detail before saving.');
      return;
    }
    const isUpdate = Boolean(savedEntries[selectedDate]);
    updateSavedEntries((current) => ({ ...current, [selectedDate]: { ...checkIn } }));
    setSaveMessage(`Check-in ${isUpdate ? 'updated' : 'saved'} for ${formatDateKey(selectedDate)}.`);
  };

  const loadSavedEntry = () => {
    if (!selectedEntry) return;
    updateCheckIn({ ...selectedEntry });
    setSaveMessage(`Loaded the ${formatDateKey(selectedDate)} check-in into the form.`);
  };

  const deleteSavedEntry = () => {
    updateSavedEntries((current) => {
      const rest = { ...current };
      delete rest[selectedDate];
      return rest;
    });
    setSaveMessage(`Deleted the saved check-in for ${formatDateKey(selectedDate)}.`);
  };

  const toggleHabit = (habitKey) => {
    updatePlannedHabits((current) => ({
      ...current,
      [habitKey]: !current[habitKey],
    }));
  };

  const addCustomHabit = (event) => {
    event.preventDefault();
    const label = customHabitName.trim();
    if (!label) return;
    updateCustomHabits((current) => [
      ...current,
      {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        label,
        done: false,
      },
    ]);
    setCustomHabitName('');
  };

  const toggleCustomHabit = (habitId) => {
    updateCustomHabits((current) =>
      current.map((habit) =>
        habit.id === habitId ? { ...habit, done: !habit.done } : habit,
      ),
    );
  };

  const removeCustomHabit = (habitId) => {
    updateCustomHabits((current) => current.filter((habit) => habit.id !== habitId));
  };

  return (
    <section className="selfcare-section" aria-labelledby="selfcare-heading">
      <div className="section-heading">
        <p className="eyebrow">SELF-CARE TOOLKIT</p>
        <h3 id="selfcare-heading">Patient-first care that supports independence</h3>
        <p className="planner-disclaimer">
          Use only the parts that feel helpful. This is a personal note, not a medical assessment
          or a measure of recovery. Follow the instructions from your own care team.
        </p>
      </div>

      <div className="selfcare-overview-grid">
        <article className="selfcare-card selfcare-highlight">
          <p className="eyebrow">MY CHECKLIST</p>
          <h4>{completedHabits} of {totalHabits} choices checked off</h4>
          <p>This only tracks boxes you choose to check; it does not measure your health or recovery.</p>
        </article>

        <article className="selfcare-card">
          <p className="eyebrow">MY ROUTINE</p>
          <ul className="selfcare-list">
            {selfCareGoals.map((goal) => (
              <li key={goal.id}>
                <strong>{goal.label}</strong>
                <span>{goal.hint}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="selfcare-grid">
        <article className="selfcare-card">
          <div className="selfcare-card-header">
            <p className="eyebrow">CHECK-IN</p>
            <h4>How I feel today</h4>
          </div>

          <div className="selfcare-form-grid">
            <label>
              Pain level
              <input
                type="number"
                min="0"
                max="10"
                value={checkIn.pain}
                placeholder="Optional"
                aria-label="Pain level from 0 to 10"
                onChange={(event) => updateCheckIn((current) => ({ ...current, pain: event.target.value }))}
              />
              <span>Optional, from 0 to 10</span>
            </label>

            <label>
              Energy
              <input
                type="number"
                min="0"
                max="10"
                value={checkIn.energy}
                placeholder="Optional"
                aria-label="Energy level from 0 to 10"
                onChange={(event) => updateCheckIn((current) => ({ ...current, energy: event.target.value }))}
              />
              <span>Optional, from 0 to 10</span>
            </label>

            <label>
              Sleep
              <input
                type="number"
                min="0"
                max="24"
                value={checkIn.sleep}
                placeholder="Optional"
                onChange={(event) => updateCheckIn((current) => ({ ...current, sleep: event.target.value }))}
              />
              <span>hours</span>
            </label>

            <label>
              Mood
              <select
                value={checkIn.mood}
                onChange={(event) => updateCheckIn((current) => ({ ...current, mood: event.target.value }))}
              >
                <option value="">Choose if you want</option>
                <option value="Steady">Steady</option>
                <option value="Low">Low</option>
                <option value="Tired">Tired</option>
                <option value="Hopeful">Hopeful</option>
                <option value="Anxious">Anxious</option>
              </select>
            </label>

            <label className="selfcare-full-width">
              Recovery note
              <textarea
                rows="3"
                value={checkIn.notes}
                onChange={(event) => updateCheckIn((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Write what feels different today, any symptom changes, or what helped most."
              />
            </label>
          </div>

          <div className="checkin-save">
            <label htmlFor="checkin-date">
              Check-in date
              <input
                id="checkin-date"
                type="date"
                value={selectedDate}
                onChange={(event) => event.target.value && selectDate(event.target.value)}
              />
            </label>
            <button className="task-add-button" type="button" onClick={saveCheckIn}>
              Save check-in
            </button>
          </div>
          <p className="checkin-status" role="status">{saveMessage}</p>

          <div className="checkin-calendar" role="group" aria-label="Check-in calendar">
            <div className="checkin-calendar-header">
              <button type="button" className="task-remove-button" onClick={() => changeMonth(-1)}>
                Previous month
              </button>
              <strong aria-live="polite">{monthNames[viewedMonthNumber - 1]} {viewedYear}</strong>
              <button type="button" className="task-remove-button" onClick={() => changeMonth(1)}>
                Next month
              </button>
            </div>
            <div className="checkin-calendar-grid">
              {weekdayLabels.map((label) => (
                <span key={label} className="checkin-weekday" aria-hidden="true">{label}</span>
              ))}
              {calendarCells.map((dateKey, index) => {
                if (!dateKey) return <span key={`blank-${index}`} />;
                const hasEntry = Boolean(savedEntries[dateKey]);
                const classes = [
                  'checkin-day',
                  hasEntry ? 'has-entry' : '',
                  dateKey === selectedDate ? 'is-selected' : '',
                  dateKey === todayKey ? 'is-today' : '',
                ].filter(Boolean).join(' ');
                return (
                  <button
                    key={dateKey}
                    type="button"
                    className={classes}
                    aria-pressed={dateKey === selectedDate}
                    aria-label={`${formatDateKey(dateKey)}, ${hasEntry ? 'check-in saved' : 'no check-in saved'}`}
                    onClick={() => selectDate(dateKey)}
                  >
                    {Number(dateKey.slice(8))}
                  </button>
                );
              })}
            </div>
            <p className="planner-disclaimer">
              {savedCount} saved {savedCount === 1 ? 'check-in' : 'check-ins'}. Dates with a dot have
              a saved check-in. Saved check-ins stay in this page only and are cleared when you
              reload. This is a personal log, not a medical assessment.
            </p>
          </div>

          <div className="checkin-selected">
            <h5>{formatDateKey(selectedDate)}</h5>
            {selectedEntry ? (
              <>
                <p>{summarizeCheckIn(selectedEntry)}</p>
                <div className="checkin-selected-actions">
                  <button type="button" className="task-add-button" onClick={loadSavedEntry}>
                    Edit saved check-in
                  </button>
                  <button type="button" className="task-remove-button" onClick={deleteSavedEntry}>
                    Delete saved check-in
                  </button>
                </div>
              </>
            ) : (
              <p>No check-in saved for this date.</p>
            )}
          </div>
        </article>

        <article className="selfcare-card">
          <div className="selfcare-card-header">
            <p className="eyebrow">SELF-CARE PLAN</p>
            <h4>What I want to do today</h4>
          </div>

          <div className="habit-list">
            {Object.entries(plannedHabits).map(([habit, isDone]) => (
              <label key={habit} className="habit-row">
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggleHabit(habit)}
                />
                <span>
                  {habit === 'water' && 'Drink water regularly'}
                  {habit === 'movement' && 'Move gently'}
                  {habit === 'medicine' && 'Take medicines as planned'}
                  {habit === 'rest' && 'Rest and recover'}
                </span>
              </label>
            ))}
            {customHabits.map((habit) => (
              <div className="custom-habit-row" key={habit.id}>
                <label className="habit-row">
                  <input
                    type="checkbox"
                    checked={habit.done}
                    onChange={() => toggleCustomHabit(habit.id)}
                  />
                  <span>{habit.label}</span>
                </label>
                <button
                  className="task-remove-button"
                  type="button"
                  aria-label={`Remove personal habit ${habit.label}`}
                  onClick={() => removeCustomHabit(habit.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <form className="task-add-form selfcare-add-form" onSubmit={addCustomHabit}>
            <label htmlFor="new-selfcare-habit">
              Add a personal choice
              <input
                id="new-selfcare-habit"
                type="text"
                maxLength={100}
                value={customHabitName}
                onChange={(event) => setCustomHabitName(event.target.value)}
                placeholder="For example, ask someone for help"
                required
              />
            </label>
            <button className="task-add-button" type="submit">Add choice</button>
          </form>
          <p className="planner-disclaimer">
            Personal choices are optional reminders, not care instructions. Follow your care
            team’s guidance.
          </p>

          <p className="planner-disclaimer">
            Checklist items are optional examples. Follow your clinician's advice about activity,
            fluids, and medicines.
          </p>
        </article>
      </div>

      <article className="selfcare-card selfcare-summary-panel">
        <div className="selfcare-card-header">
          <p className="eyebrow">MY SUMMARY</p>
          <h4>Your check-in notes</h4>
        </div>
        <p>{summary}</p>
        <p>
          This draft contains only the details you entered and stays in this page while it is open.
          Avoid adding names or other identifying details.
        </p>
      </article>

      <section className="selfcare-card selfcare-suggestions" aria-labelledby="checkin-suggestions-heading">
        <div className="selfcare-card-header">
          <p className="eyebrow">OPTIONAL IDEAS</p>
          <h4 id="checkin-suggestions-heading">Suggestions based on this check-in</h4>
        </div>
        <div aria-live="polite">
          {tipsHidden ? (
            <p>Suggestions are hidden.</p>
          ) : suggestedTips.length ? (
            <ul>
              {suggestedTips.map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
          ) : (
            <p>Enter a check-in detail to see optional wellness suggestions.</p>
          )}
        </div>
        <button type="button" className="task-remove-button" onClick={() => setTipsHidden((hidden) => !hidden)}>
          {tipsHidden ? 'Show suggestions' : 'Hide suggestions'}
        </button>
        <p className="planner-disclaimer">
          These suggestions are general wellness ideas based only on what you entered. They are not
          medical advice, diagnosis, or an assessment of urgency, and they are not included in
          exported drafts. Follow your care team’s instructions. For severe or worsening symptoms,
          trouble breathing, chest pain, confusion, heavy bleeding, or immediate danger, contact
          your care team or local emergency services.
        </p>
      </section>

      <section className="selfcare-health-tips" aria-labelledby="general-health-tips-heading">
        <div className="section-heading">
          <p className="eyebrow">WHOLE-PERSON WELL-BEING</p>
          <h4 id="general-health-tips-heading">General health tips</h4>
          <p>
            Small, realistic choices can support well-being across different parts of life. Pick
            what feels useful; these general ideas are not personal medical advice.
          </p>
        </div>
        <div className="selfcare-overview-grid">
          {generalHealthTips.map((tip) => (
            <article className="selfcare-card" key={tip.title}>
              <h5>{tip.title}</h5>
              <p>{tip.detail}</p>
            </article>
          ))}
        </div>
        <p className="planner-disclaimer">
          If you have a health condition, are recovering from a procedure, or are unsure what is
          appropriate, ask your care team before changing your activity, diet, or medicines.
        </p>
        <ul className="health-tip-sources" aria-label="Health tip sources">
          <li>
            <a
              href="https://www.who.int/news-room/fact-sheets/detail/healthy-diet"
              target="_blank"
              rel="noreferrer"
            >
              WHO: Healthy diet
            </a>
          </li>
          <li>
            <a
              href="https://www.who.int/news-room/fact-sheets/detail/physical-activity"
              target="_blank"
              rel="noreferrer"
            >
              WHO: Physical activity
            </a>
          </li>
          <li>
            <a
              href="https://www.nccih.nih.gov/health/whole-person-health-what-it-is-and-why-its-important"
              target="_blank"
              rel="noreferrer"
            >
              NCCIH: Whole person health
            </a>
          </li>
          <li>
            <a
              href="https://www.nccih.nih.gov/health/safety"
              target="_blank"
              rel="noreferrer"
            >
              NCCIH: Safe use of complementary health products and practices
            </a>
          </li>
        </ul>
        <p className="health-tip-source-date">Sources last checked on 10 October 2026.</p>
      </section>

      <article className="selfcare-card">
        <div className="selfcare-card-header">
          <p className="eyebrow">SELF CARE REMINDERS</p>
          <h4>Helpful reminders</h4>
        </div>
        <ul className="reminder-list">
          {selfCareReminders.map((reminder) => (
            <li key={reminder}>{reminder}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}

export default SelfCare;
