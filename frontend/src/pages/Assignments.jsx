import React, { useState, useEffect } from 'react';
import {
  ListTodo,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Calendar,
  AlertCircle,
  BotMessageSquare,
  X,
  RefreshCw,
} from 'lucide-react';
import { studentApi } from '../services/api';

const Assignments = ({ setActiveTab, refreshKey }) => {
  const [assignments, setAssignments] = useState([]);
  const [filter, setFilter] = useState('All'); // 'All', 'Pending', 'Completed'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [courseCode, setCourseCode] = useState('DBMS');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');

  useEffect(() => {
    loadAssignments();
  }, [refreshKey]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await studentApi.getAssignments();
      setAssignments(res);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError('Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const updated = await studentApi.toggleAssignment(id);
      setAssignments((prev) =>
        prev.map((a) => (a.id === id ? updated : a))
      );
    } catch (err) {
      console.error('Error toggling assignment:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await studentApi.deleteAssignment(id);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Error deleting assignment:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !dueDate.trim()) return;

    try {
      const newA = await studentApi.createAssignment({
        course_code: courseCode,
        course_name: courseCode,
        title,
        description,
        due_date: dueDate,
        priority,
      });
      setAssignments((prev) => [newA, ...prev]);
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setDueDate('');
    } catch (err) {
      console.error('Error adding assignment:', err);
    }
  };

  const filtered = assignments.filter((a) => {
    if (filter === 'Pending') return a.status === 'Pending';
    if (filter === 'Completed') return a.status === 'Completed';
    return true;
  });

  return (
    <div className="page-wrapper">
      {/* Header with actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['All', 'Pending', 'Completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="btn-secondary"
              style={{
                backgroundColor: filter === f ? 'var(--accent-indigo-bg)' : 'var(--bg-card)',
                color: filter === f ? '#60a5fa' : 'var(--text-secondary)',
                borderColor: filter === f ? 'var(--accent-primary)' : 'var(--border-subtle)',
                fontWeight: filter === f ? 700 : 500
              }}
            >
              <span>{f} ({assignments.filter((a) => f === 'All' ? true : (f === 'Pending' ? a.status === 'Pending' : a.status === 'Completed')).length})</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={loadAssignments} title="Refresh tasks">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span>New Assignment</span>
          </button>
        </div>
      </div>

      {/* Assignment List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)'
          }}>
            <ListTodo size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <p>No assignments found in this category.</p>
          </div>
        ) : (
          filtered.map((item) => {
            const isCompleted = item.status === 'Completed';
            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  opacity: isCompleted ? 0.75 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                <button
                  onClick={() => handleToggle(item.id)}
                  style={{ color: isCompleted ? '#10b981' : 'var(--text-muted)' }}
                >
                  {isCompleted ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                </button>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: 'var(--bg-subtle)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: '#60a5fa'
                    }}>
                      {item.course_code}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: item.priority === 'High' ? '#f87171' : (item.priority === 'Medium' ? '#f59e0b' : '#34d399')
                    }}>
                      {item.priority} Priority
                    </span>
                  </div>

                  <h4 style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    textDecoration: isCompleted ? 'line-through' : 'none',
                    color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)'
                  }}>
                    {item.title}
                  </h4>

                  {item.description && (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {item.description}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} />
                    <span>Due: {item.due_date}</span>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="btn-danger"
                    style={{ padding: '6px 8px' }}
                    title="Delete task"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal for Creating Assignment */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Add Course Assignment</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Course / Subject
                </label>
                <select
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="DBMS">DBMS (MCA201)</option>
                  <option value="DSA">DSA (MCA202)</option>
                  <option value="Java">Java (MCA203)</option>
                  <option value="IoT">IoT (MCA204)</option>
                  <option value="Project">Minor Project</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Assignment Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Normalization Case Study"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Due Date
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026-08-25 or Friday"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Additional notes, submission link, instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;
