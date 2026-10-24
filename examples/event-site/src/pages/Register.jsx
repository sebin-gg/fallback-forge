import { useState } from 'react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    team: '1',
    track: 'works-anyway',
    notes: '',
  });
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setStatusMessage(data.message || (res.ok ? 'Success' : 'An error occurred.'));
    } catch {
      setStatusMessage('Could not send. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const isSuccess = statusMessage.toLowerCase().includes('registered');

  return (
    <div>
      <p className="section-eyebrow">Register</p>
      <h1>Register for DevDay Exchange</h1>
      <p className="text-muted">Registration closes 9 October 2026, 11:59 PM IST.</p>

      <div className="register-layout">
        <div className="form-card">
          <form id="register" aria-label="Registration" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="team">Team size</label>
              <select id="team" name="team" value={formData.team} onChange={handleChange}>
                <option value="1">Solo</option>
                <option value="2">Team of 2</option>
                <option value="3">Team of 3</option>
                <option value="4">Team of 4</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="track">Track</label>
              <select id="track" name="track" value={formData.track} onChange={handleChange}>
                <option value="works-anyway">BLW - Works Anyway</option>
                <option value="open">Open</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Anything the organisers should know?"
              />
            </div>

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>

            {statusMessage && (
              <div
                className={isSuccess ? 'status-success' : 'status-error'}
                role="status"
                aria-live="polite"
              >
                {statusMessage}
              </div>
            )}
          </form>
        </div>

        <aside className="info-sidebar">
          <div className="info-block">
            <h3>What you get</h3>
            <ul>
              <li>Platform credits &amp; cloud access</li>
              <li>On-site mentors across both rooms</li>
              <li>Live demos &amp; community voting</li>
              <li>Prizes up to ₹1,00,000</li>
            </ul>
          </div>
          <div className="info-block">
            <h3>Tracks</h3>
            <ul>
              <li>BLW — Works Anyway</li>
              <li>Open</li>
              <li>Education</li>
            </ul>
          </div>
          <div className="info-block">
            <h3>Need help?</h3>
            <p className="text-muted" style={{ margin: 0, fontSize: '0.875rem' }}>
              Email hello@example.com and we&apos;ll get back to you.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
