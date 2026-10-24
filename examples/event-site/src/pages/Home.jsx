import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const trackData = [
  { track: 'Works Anyway', teams: 18 },
  { track: 'Open', teams: 27 },
  { track: 'Education', teams: 9 },
];

export default function Home() {
  return (
    <div>
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1>DevDay Exchange Community Hackathon: Kochi</h1>
        <p>Build anything. Ship by morning. 10-11 October 2026.</p>
      </motion.section>

      <div className="hero-images">
        <img src="/img/hero-1.png" alt="Hackathon hall" width={1600} height={900} loading="eager" />
        <img src="/img/hero-2.png" alt="Teams at work" width={1600} height={900} loading="eager" />
        <img src="/img/hero-3.png" alt="Demo stage" width={1600} height={900} loading="eager" />
      </div>

      <section aria-labelledby="details">
        <h2 id="details">Event details</h2>
        <dl>
          <dt>Dates</dt>
          <dd>10-11 October 2026</dd>
          <dt>Venue</dt>
          <dd>JAIN University, Kochi - rooms 2008 and 2009</dd>
          <dt>Check-in</dt>
          <dd>10 October 2026, 6:00 PM IST</dd>
          <dt>Kick-off</dt>
          <dd>10 October 2026, 6:30 PM IST</dd>
          <dt>Registration closes</dt>
          <dd>9 October 2026, 11:59 PM IST</dd>
          <dt>Team size</dt>
          <dd>Solo or a team of up to 4</dd>
        </dl>
      </section>

      <p>
        <Link to="/register" className="cta">
          Register now
        </Link>
      </p>
      <p>
        <Link to="/schedule">See the schedule</Link>
      </p>

      <section aria-labelledby="tracks">
        <h2 id="tracks">Participants by track</h2>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trackData}>
              <XAxis dataKey="track" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="teams" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ul>
          <li>Works Anyway - 18 teams</li>
          <li>Open - 27 teams</li>
          <li>Education - 9 teams</li>
        </ul>
      </section>

      <section aria-labelledby="why">
        <h2 id="why">Why join</h2>
        <p>
          All checked-in participants receive platform credits, cloud access, and hands-on developer
          support to help build and test real-world software through the night.
        </p>
        <p>
          Experienced engineers and domain mentors are on site across both rooms to review
          architectures, debug edge cases, and share real-time feedback.
        </p>
        <p>
          Live demos begin promptly at 10:00 AM on Sunday morning, followed by community voting and
          award announcements before wrap-up.
        </p>
      </section>
    </div>
  );
}
