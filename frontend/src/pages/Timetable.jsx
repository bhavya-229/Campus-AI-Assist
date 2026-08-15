import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, MapPin, User, BookOpen, AlertCircle } from 'lucide-react';
import { studentApi } from '../services/api';

const Timetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tRes, eRes] = await Promise.all([
        studentApi.getTimetable(),
        studentApi.getExams(),
      ]);
      setTimetable(tRes);
      setExams(eRes);
    } catch (err) {
      console.error('Error fetching timetable/exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const daySlots = timetable.filter((t) => t.day_of_week === selectedDay);

  return (
    <div className="page-wrapper">
      {/* Day Selector Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '24px',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {days.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className="btn-secondary"
            style={{
              backgroundColor: selectedDay === d ? 'var(--accent-indigo-bg)' : 'var(--bg-card)',
              color: selectedDay === d ? '#60a5fa' : 'var(--text-secondary)',
              borderColor: selectedDay === d ? 'var(--accent-primary)' : 'var(--border-subtle)',
              fontWeight: selectedDay === d ? 700 : 500,
              padding: '10px 18px'
            }}
          >
            <span>{d}</span>
          </button>
        ))}
      </div>

      {/* Timetable Schedule Grid */}
      <div className="card-panel" style={{ marginBottom: '36px' }}>
        <div className="panel-header">
          <h3>
            <Clock size={18} color="#3b82f6" />
            <span>Class Schedule for {selectedDay} (MCA Semester 2)</span>
          </h3>
        </div>

        {daySlots.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No lectures scheduled for {selectedDay}.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {daySlots.map((slot) => (
              <div
                key={slot.id}
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  borderLeft: '4px solid #3b82f6'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: 'var(--bg-card)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    color: '#93c5fd'
                  }}>
                    {slot.course_code}
                  </span>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} />
                    <span>{slot.start_time} - {slot.end_time}</span>
                  </div>
                </div>

                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>{slot.course_name}</h4>

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={13} />
                    <span>Venue: {slot.room}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={13} />
                    <span>Instructor: {slot.instructor}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* End-Semester Exam Schedule Table */}
      <div className="card-panel">
        <div className="panel-header">
          <h3>
            <BookOpen size={18} color="#ef4444" />
            <span>End-Semester Examination Schedule (September 2026)</span>
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Session: Morning (10:00 AM - 01:00 PM)</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 14px' }}>Course Code</th>
                <th style={{ padding: '12px 14px' }}>Course Title</th>
                <th style={{ padding: '12px 14px' }}>Exam Date</th>
                <th style={{ padding: '12px 14px' }}>Timing</th>
                <th style={{ padding: '12px 14px' }}>Venue</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr
                  key={exam.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#60a5fa' }}>{exam.course_code}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{exam.course_name}</td>
                  <td style={{ padding: '12px 14px', color: '#f87171', fontWeight: 600 }}>{exam.exam_date}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{exam.time_slot}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{exam.venue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Timetable;
