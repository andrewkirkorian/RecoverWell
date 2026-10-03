import { useState } from 'react';
import './App.css';

const initialTasks = [
  { id: 'meds', time: '8:00 AM', label: 'Morning medication', done: true },
  { id: 'water', time: '9:30 AM', label: 'Drink water', done: true },
  { id: 'walk', time: '11:00 AM', label: 'Walk to the window', done: false },
  { id: 'rest', time: '2:00 PM', label: 'Rest break', done: false },
];

function App() {
  const [tasks, setTasks] = useState(initialTasks);

  const completedCount = tasks.filter((task) => task.done).length;
  const percent = Math.round((completedCount / tasks.length) * 100);

  const toggleTask = (taskId) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      ),
    );
  };

  return (
    <div className="recovery-app">
      <header className="topbar">
        <div className="brand-wrap">
          <span className="brand-badge">RW</span>
          <div>
            <p className="eyebrow">RECOVERY APP</p>
            <h1>Recover Well</h1>
          </div>
        </div>
        <span className="header-pill">Day 4 after surgery</span>
      </header>

      <main className="main-grid">
        <section className="hero-card">
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Healing is a daily practice.</h2>
          <p>Keep your steps small, your routine steady, and your care team close.</p>
        </section>

        <aside className="progress-card" aria-label={`Recovery progress ${percent}% complete`}>
          <div className="progress-header">
            <p className="eyebrow">TODAY'S PROGRESS</p>
            <strong>{percent}% complete</strong>
          </div>
          <div className="progress-ring" style={{ '--percent': `${percent}%` }}>
            <span>{percent}%</span>
          </div>
        </aside>

        <section className="plan-card">
          <div className="plan-header">
            <h3>Today's recovery plan</h3>
            <span>
              {completedCount}/{tasks.length} done
            </span>
          </div>

          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id} className={task.done ? 'task-item done' : 'task-item'}>
                <label>
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(task.id)}
                    aria-label={`Mark ${task.label.toLowerCase()} complete`}
                  />
                  <span className="task-time">{task.time}</span>
                  <span className="task-name">{task.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <aside className="side-panel">
          <div className="tip-card">
            <p className="eyebrow">REMINDER</p>
            <h3>Rest is part of recovery.</h3>
            <p>Breaks, hydration, and stillness give your body time to heal.</p>
          </div>

          <div className="care-card">
            <p className="eyebrow">CARE TEAM</p>
            <h3>Dr. Nguyen</h3>
            <p>Call if pain increases or swelling worsens.</p>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
