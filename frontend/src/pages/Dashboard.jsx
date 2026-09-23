import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  ListTodo,
  CalendarDays,
  LifeBuoy,
  BotMessageSquare,
  ArrowUpRight,
  AlertTriangle,
  Clock,
  Sparkles,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import { studentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = ({ setActiveTab, refreshKey }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, [refreshKey]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await studentApi.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to fetch dashboard data. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading campus student data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{
          maxWidth: '460px',
          margin: '0 auto',
          padding: '24px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)'
        }}>
          <AlertTriangle size={36} color="#ef4444" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>{error}</p>
          <button className="btn-primary" onClick={loadDashboard}>
            <RefreshCw size={14} />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const overallAtt = data?.overall_attendance || 0;
  const isAttendanceWarning = overallAtt < 75;

  return (
    <div className="page-wrapper">
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.1))',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800 }}>Welcome back, {user?.name || 'Student'} 👋</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {data?.student?.program || 'MCA'} (Semester {data?.student?.semester || '2'}) • Department of {data?.student?.department || 'Computer Applications'}
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setActiveTab('assistant')}
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
        >
          <BotMessageSquare size={16} />
          <span>Ask Campus AI Assistant</span>
        </button>
      </div>

      {/* Top 4 Stat Widgets */}
      <div className="stats-grid">
        {/* Attendance Stat */}
        <div className="stat-card" onClick={() => setActiveTab('attendance')} style={{ cursor: 'pointer' }}>
          <div className="stat-top">
            <div className="stat-icon-box" style={{ backgroundColor: isAttendanceWarning ? 'var(--accent-amber-bg)' : 'var(--accent-emerald-bg)' }}>
              <CalendarCheck2 size={20} color={isAttendanceWarning ? '#f59e0b' : '#10b981'} />
            </div>
            <span className="stat-badge" style={{
              backgroundColor: isAttendanceWarning ? 'var(--accent-amber-bg)' : 'var(--accent-emerald-bg)',
              color: isAttendanceWarning ? 'var(--accent-amber)' : 'var(--accent-emerald)'
            }}>
              {isAttendanceWarning ? 'Action Required' : 'Eligible'}
            </span>
          </div>
          <div className="stat-value" style={{ color: isAttendanceWarning ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
            {overallAtt}%
          </div>
          <div className="stat-label">Overall Attendance</div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{
                width: `${overallAtt}%`,
                backgroundColor: isAttendanceWarning ? '#f59e0b' : '#10b981'
              }}
            />
          </div>
        </div>

        {/* Pending Assignments */}
        <div className="stat-card" onClick={() => setActiveTab('assignments')} style={{ cursor: 'pointer' }}>
          <div className="stat-top">
            <div className="stat-icon-box" style={{ backgroundColor: 'var(--accent-indigo-bg)' }}>
              <ListTodo size={20} color="#818cf8" />
            </div>
            <span className="stat-badge" style={{ backgroundColor: 'var(--accent-indigo-bg)', color: '#818cf8' }}>
              Pending Tasks
            </span>
          </div>
          <div className="stat-value">{data?.pending_assignments_count || 0}</div>
          <div className="stat-label">Assignments Due Soon</div>
        </div>

        {/* Upcoming Exams */}
        <div className="stat-card" onClick={() => setActiveTab('timetable')} style={{ cursor: 'pointer' }}>
          <div className="stat-top">
            <div className="stat-icon-box" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)' }}>
              <CalendarDays size={20} color="#ef4444" />
            </div>
            <span className="stat-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              End-Sem
            </span>
          </div>
          <div className="stat-value">{data?.upcoming_exams_count || 0}</div>
          <div className="stat-label">Upcoming Exams (Sep 2026)</div>
        </div>

        {/* Support Tickets */}
        <div className="stat-card" onClick={() => setActiveTab('support')} style={{ cursor: 'pointer' }}>
          <div className="stat-top">
            <div className="stat-icon-box" style={{ backgroundColor: 'rgba(14, 165, 233, 0.12)' }}>
              <LifeBuoy size={20} color="#0ea5e9" />
            </div>
            <span className="stat-badge" style={{ backgroundColor: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9' }}>
              Services
            </span>
          </div>
          <div className="stat-value">{data?.active_tickets_count || 0}</div>
          <div className="stat-label">Active Campus Tickets</div>
        </div>
      </div>

      {/* Main Sections Grid */}
      <div className="section-grid">
        {/* Left Column: Subject-wise Attendance & Today's Classes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Subject Attendance Breakdown */}
          <div className="card-panel">
            <div className="panel-header">
              <h3>
                <CalendarCheck2 size={18} color="#3b82f6" />
                <span>Subject Attendance Breakdown</span>
              </h3>
              <button
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
                onClick={() => setActiveTab('attendance')}
              >
                <span>View Details</span>
                <ArrowUpRight size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {data?.attendance_breakdown?.map((att) => {
                const isUnder = att.percentage < 75;
                return (
                  <div key={att.id} style={{
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '13px' }}>{att.course_code}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px', marginLeft: '8px' }}>
                          {att.course_name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {att.attended_classes}/{att.total_classes} classes
                        </span>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '13px',
                          color: isUnder ? 'var(--accent-amber)' : 'var(--accent-emerald)'
                        }}>
                          {att.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${att.percentage}%`,
                          backgroundColor: isUnder ? '#f59e0b' : '#10b981'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Schedule Timeline */}
          <div className="card-panel">
            <div className="panel-header">
              <h3>
                <Clock size={18} color="#6366f1" />
                <span>Today's Classes</span>
              </h3>
              <button
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
                onClick={() => setActiveTab('timetable')}
              >
                <span>Full Timetable</span>
                <ArrowUpRight size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data?.today_classes?.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No classes scheduled for today.</p>
              ) : (
                data?.today_classes?.map((slot) => (
                  <div key={slot.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '4px solid var(--accent-primary)'
                  }}>
                    <div style={{ minWidth: '130px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {slot.start_time} - {slot.end_time}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{slot.course_code} - {slot.course_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Room: {slot.room} • Instructor: {slot.instructor}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Pending Tasks & Upcoming Exams */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Pending Tasks Panel */}
          <div className="card-panel">
            <div className="panel-header">
              <h3>
                <ListTodo size={18} color="#818cf8" />
                <span>Pending Tasks</span>
              </h3>
              <button
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
                onClick={() => setActiveTab('assignments')}
              >
                <span>Manage</span>
              </button>
            </div>

            {data?.pending_assignments?.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No pending assignments! 🎉</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data?.pending_assignments?.slice(0, 3).map((task) => (
                  <div key={task.id} style={{
                    padding: '12px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-card)',
                        color: '#60a5fa',
                        fontWeight: 600
                      }}>
                        {task.course_code}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Due: {task.due_date}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '13px', marginTop: '6px' }}>{task.title}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Next Upcoming Exam Panel */}
          <div className="card-panel">
            <div className="panel-header">
              <h3>
                <BookOpen size={18} color="#ef4444" />
                <span>Next Upcoming Exam</span>
              </h3>
            </div>

            {data?.upcoming_exams && data.upcoming_exams.length > 0 && (
              <div style={{
                padding: '14px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ fontSize: '11px', color: '#f87171', fontWeight: 700, textTransform: 'uppercase' }}>
                  {data.upcoming_exams[0].course_code}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '2px' }}>
                  {data.upcoming_exams[0].course_name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  📅 Date: <strong>{data.upcoming_exams[0].exam_date}</strong>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  ⏰ Time: {data.upcoming_exams[0].time_slot}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  📍 Venue: {data.upcoming_exams[0].venue}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
