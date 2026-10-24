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
      <section className="hero">
        <div className="hero-badge">⚡ BLW — Works Anyway</div>
        <h1>DevDay Exchange Community Hackathon: Kochi</h1>
        <p className="hero-subtitle">
          Build anything. Ship by morning. 10-11 October 2026 at JAIN University, Kochi.
        </p>
        <div className="hero-ctas">
          <Link to="/register" className="cta">
            Register now →
          </Link>
          <Link to="/schedule" className="cta-secondary">
            See the schedule
          </Link>
        </div>
      </section>

      <div className="hero-images">
        <img src="/img/hero-1.png" alt="Hackathon hall" width={1600} height={900} loading="eager" />
        <img src="/img/hero-2.png" alt="Teams at work" width={1600} height={900} loading="eager" />
        <img src="/img/hero-3.png" alt="Demo stage" width={1600} height={900} loading="eager" />
      </div>

      <div className="stats-strip">
        <div className="stat-card">
          <span className="stat-number">54</span>
          <span className="stat-label">Teams registered</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">36h</span>
          <span className="stat-label">Build window</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">3</span>
          <span className="stat-label">Tracks</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">2</span>
          <span className="stat-label">Rooms</span>
        </div>
      </div>

      <section aria-labelledby="details">
        <p className="section-eyebrow">Event details</p>
        <h2 id="details">When &amp; where</h2>
        <div className="event-details-card">
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
        </div>
      </section>

      <div className="countdown-banner">
        <div className="countdown-text">
          Registration closes <strong>9 October 2026, 11:59 PM IST</strong> — don&apos;t miss it.
        </div>
        <Link to="/register" className="cta">
          Register now
        </Link>
      </div>

      <section aria-labelledby="tracks">
        <p className="section-eyebrow">Participants</p>
        <h2 id="tracks">Teams by track</h2>
        <div className="chart-section">
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trackData}>
                <XAxis dataKey="track" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a2e',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="teams" fill="#818cf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul>
            <li>Works Anyway - 18 teams</li>
            <li>Open - 27 teams</li>
            <li>Education - 9 teams</li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="prizes">
        <p className="section-eyebrow">Prizes</p>
        <h2 id="prizes">What you can win</h2>
        <div className="prizes-grid">
          <div className="prize-card gold">
            <span className="prize-medal">🥇</span>
            <p className="prize-label">First place</p>
            <p className="prize-amount">₹1,00,000</p>
            <p className="prize-perks">Cloud credits + mentorship</p>
          </div>
          <div className="prize-card silver">
            <span className="prize-medal">🥈</span>
            <p className="prize-label">Second place</p>
            <p className="prize-amount">₹50,000</p>
            <p className="prize-perks">Cloud credits + swag</p>
          </div>
          <div className="prize-card bronze">
            <span className="prize-medal">🥉</span>
            <p className="prize-label">Third place</p>
            <p className="prize-amount">₹25,000</p>
            <p className="prize-perks">Cloud credits + swag</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="why">
        <p className="section-eyebrow">Why join</p>
        <h2 id="why">Build something real</h2>
        <div className="card-grid">
          <div className="card">
            <div className="card-icon">🛠️</div>
            <p className="card-title">Hands-on support</p>
            <p className="card-body">
              Experienced engineers and domain mentors are on site across both rooms to review
              architectures, debug edge cases, and share real-time feedback.
            </p>
          </div>
          <div className="card">
            <div className="card-icon">☁️</div>
            <p className="card-title">Platform credits</p>
            <p className="card-body">
              All checked-in participants receive platform credits, cloud access, and developer
              support to build and test real-world software through the night.
            </p>
          </div>
          <div className="card">
            <div className="card-icon">🎤</div>
            <p className="card-title">Live demos</p>
            <p className="card-body">
              Live demos begin promptly at 10:00 AM on Sunday morning, followed by community voting
              and award announcements before wrap-up.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
