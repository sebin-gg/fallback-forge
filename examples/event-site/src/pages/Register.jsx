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

  return (
    <div>
      <h1>Register</h1>
      <p>Registration closes 9 October 2026, 11:59 PM IST.</p>

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
          />
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>

        {statusMessage && (
          <p role="status" aria-live="polite">
            {statusMessage}
          </p>
        )}
      </form>
    </div>
  );
}
