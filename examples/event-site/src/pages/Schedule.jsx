import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import { Link } from 'react-router';

const schedule = [
  { time: '18:00', session: 'Check-in', room: 'Lobby' },
  { time: '18:30', session: 'Kick-off', room: '2008' },
  { time: '19:00', session: 'Team formation', room: '2009' },
  { time: '20:30', session: 'Dinner', room: 'Lobby' },
  { time: '00:00', session: 'Midnight check-in', room: '2008' },
  { time: '07:30', session: 'Breakfast', room: 'Lobby' },
  { time: '09:30', session: 'Submissions close', room: '2008' },
  { time: '10:00', session: 'Demos and wrap-up', room: '2008' },
];

export default function Schedule() {
  const kickOffTime = dayjs('2026-10-10T18:30:00+05:30');
  const now = dayjs();
  const diffHours = kickOffTime.diff(now, 'hour');
  const diffDays = kickOffTime.diff(now, 'day');
  const startsInText =
    diffDays > 0 ? `${diffDays} days` : diffHours > 0 ? `${diffHours} hours` : 'soon';

  return (
    <div>
      <p className="section-eyebrow">Schedule</p>
      <h1>Schedule</h1>
      <p className="text-muted">All times IST. Kick-off at 18:30 on 10 October 2026.</p>

      <div className="countdown-banner">
        <div className="countdown-text">
          Starts in <strong>{startsInText}</strong> (Kick-off at 18:30, 10 October 2026).
        </div>
        <Link to="/register" className="cta">
          Register now
        </Link>
      </div>

      <div className="schedule-container">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Session</th>
              <th>Room</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((item, index) => {
              const isLobby = item.room === 'Lobby';
              const isKickoff = item.session === 'Kick-off';
              return (
                <motion.tr
                  key={item.time + item.session}
                  className={isKickoff ? 'session-highlight' : ''}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <td className="schedule-time">{item.time}</td>
                  <td>{item.session}</td>
                  <td>
                    <span className={`room-badge${isLobby ? ' lobby' : ''}`}>{item.room}</span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
