import React, { useState, useEffect } from 'react';
import { CalendarCheck2, AlertTriangle, CheckCircle2, Info, Calculator, Sparkles, RefreshCw } from 'lucide-react';
import { studentApi } from '../services/api';

const Attendance = ({ setActiveTab, refreshKey }) => {
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAttendance();
  }, [refreshKey]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await studentApi.getAttendance();
      setAttendanceList(res);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  };

  const totalClasses = attendanceList.reduce((acc, curr) => acc + curr.total_classes, 0);
  const attendedClasses = attendanceList.reduce((acc, curr) => acc + curr.attended_classes, 0);
  const overallPercentage = totalClasses > 0 ? ((attendedClasses / totalClasses) * 100).toFixed(1) : 0;
  const isOverallWarning = overallPercentage < 75;

  return (
    <div className="page-wrapper">
      {/* Header Summary Banner */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Overall Academic Attendance</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Semester 2 • Minimum 75% required for End-Semester Exam Hall Ticket
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '32px',
              fontWeight: 800,
              color: isOverallWarning ? 'var(--accent-amber)' : 'var(--accent-emerald)'
            }}>
              {overallPercentage}%
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {attendedClasses} of {totalClasses} classes attended
            </div>
          </div>

          <div style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: isOverallWarning ? 'var(--accent-amber-bg)' : 'var(--accent-emerald-bg)',
            color: isOverallWarning ? 'var(--accent-amber)' : 'var(--accent-emerald)',
            fontWeight: 700,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {isOverallWarning ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            <span>{isOverallWarning ? 'Attendance Warning' : 'Exam Eligible'}</span>
          </div>

          <button className="btn-secondary" onClick={loadAttendance} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Subject-Wise Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr)) ',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {attendanceList.map((item) => {
          const isWarning = item.percentage < 75;
          const isCritical = item.percentage < 70;
          const neededTo75 = Math.max(0, Math.ceil((0.75 * item.total_classes - item.attended_classes) / 0.25));

          return (
            <div
              key={item.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: 'var(--bg-subtle)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      color: '#60a5fa'
                    }}>
                      {item.course_code}
                    </span>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, marginTop: '6px' }}>{item.course_name}</h4>
                  </div>

                  <span style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: isWarning ? 'var(--accent-amber)' : 'var(--accent-emerald)'
                  }}>
                    {item.percentage}%
                  </span>
                </div>

                <div className="progress-bar-bg" style={{ marginBottom: '12px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: isWarning ? (isCritical ? '#ef4444' : '#f59e0b') : '#10b981'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>Attended: <strong>{item.attended_classes}</strong></span>
                  <span>Total Lectures: <strong>{item.total_classes}</strong></span>
                  <span>Missed: <strong>{item.total_classes - item.attended_classes}</strong></span>
                </div>
              </div>

              <div style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '12px'
              }}>
                {isWarning ? (
                  <div style={{ color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={14} />
                    <span>Must attend next <strong>{neededTo75}</strong> class(es) to cross 75%.</span>
                  </div>
                ) : (
                  <div style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} />
                    <span>Attendance in safe zone.</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Academic Regulations Note */}
      <div style={{
        backgroundColor: 'var(--bg-subtle)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '18px 22px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px'
      }}>
        <Info size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-primary)' }}>College Attendance Regulation Code AR-2026-V1:</strong> Students must maintain a minimum 75% attendance in each course to sit for end-semester exams. Condonation up to 65% is permissible on verified medical grounds upon submitting doctor’s certificate within 7 days.
        </div>
      </div>
    </div>
  );
};

export default Attendance;
