import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { fetchAnalyticsSummary } from '../services/api';
import './AnalyticsPage.css';

const formatEventType = (eventType) =>
  eventType
    .replace('.', ' · ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const todayISO = new Date().toISOString().slice(0, 10);

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [date, setDate] = useState(todayISO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const loadAnalytics = useCallback(async (selectedDate) => {
    if (!user?.token) return;

    try {
      setLoading(true);
      setError('');
      const response = await fetchAnalyticsSummary(selectedDate, user.token);
      setData(response);
    } catch (err) {
      setError(err?.message || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    loadAnalytics(date);
  }, [date, loadAnalytics]);

  const bars = useMemo(() => {
    const byType = data?.summary?.byType || {};
    const entries = Object.entries(byType).map(([eventType, count]) => ({
      eventType,
      label: formatEventType(eventType),
      count: Number(count || 0),
    }));

    const max = entries.reduce((acc, item) => Math.max(acc, item.count), 0);

    return entries.map((item) => ({
      ...item,
      width: max > 0 ? Math.max((item.count / max) * 100, item.count > 0 ? 12 : 0) : 0,
    }));
  }, [data]);

  const cards = [
    {
      label: 'All-Time Events',
      value: data?.summary?.total || 0,
    },
    {
      label: `Daily Events (${data?.daily?.date || date})`,
      value: data?.daily?.total || 0,
    },
    {
      label: 'Known Event Types',
      value: bars.filter((item) => item.count > 0).length,
    },
  ];

  return (
    <>
      <Helmet>
        <title>Analytics | Blogsy</title>
      </Helmet>

      <div className="analytics-page">
        <div className="analytics-header">
          <h1>Event Analytics</h1>
          <p>Live Kafka-derived counters from backend event processing.</p>
        </div>

        <div className="analytics-controls">
          <label htmlFor="analytics-date">Date</label>
          <input
            id="analytics-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={todayISO}
          />
          <button type="button" onClick={() => loadAnalytics(date)} disabled={loading}>
            Refresh
          </button>
        </div>

        {error && <p className="analytics-error">{error}</p>}

        <div className="analytics-cards">
          {cards.map((card) => (
            <article key={card.label} className="analytics-card">
              <p>{card.label}</p>
              <h2>{card.value}</h2>
            </article>
          ))}
        </div>

        <section className="analytics-chart">
          <h3>Events By Type</h3>
          {loading ? (
            <p className="analytics-muted">Loading chart data...</p>
          ) : bars.length === 0 ? (
            <p className="analytics-muted">No event type data available yet.</p>
          ) : (
            <div className="analytics-bars">
              {bars.map((item) => (
                <div key={item.eventType} className="analytics-bar-row">
                  <div className="analytics-bar-label">{item.label}</div>
                  <div className="analytics-bar-track">
                    <div className="analytics-bar-fill" style={{ width: `${item.width}%` }} />
                  </div>
                  <div className="analytics-bar-value">{item.count}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="analytics-meta">
          <h3>System Notes</h3>
          <p>{data?.meta?.note || 'No metadata available.'}</p>
        </section>
      </div>
    </>
  );
};

export default AnalyticsPage;
