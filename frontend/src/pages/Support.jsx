import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  X,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { ticketApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Support = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Create form state
  const [category, setCategory] = useState('ID card');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');

  // Admin resolution state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState('Resolved');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const categories = [
    'ID card',
    'Examination',
    'IT support',
    'Library',
    'Hostel',
    'Fees',
    'Classroom',
    'Administration',
  ];

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await ticketApi.getTickets();
      setTickets(res);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    try {
      const newT = await ticketApi.createTicket({
        category,
        subject,
        description,
        priority,
      });
      setTickets((prev) => [newT, ...prev]);
      setIsModalOpen(false);
      setSubject('');
      setDescription('');
    } catch (err) {
      console.error('Error creating ticket:', err);
    }
  };

  const handleAdminUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      const updated = await ticketApi.updateTicket(selectedTicket.id, {
        status: resolutionStatus,
        resolution_notes: resolutionNotes,
      });
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? updated : t))
      );
      setSelectedTicket(null);
      setResolutionNotes('');
    } catch (err) {
      console.error('Error updating ticket:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return { bg: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa' };
      case 'In Progress':
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' };
      case 'Resolved':
        return { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981' };
      default:
        return { bg: 'var(--bg-subtle)', color: 'var(--text-secondary)' };
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header and New Ticket Trigger */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Campus Helpdesk & Support Requests</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {isAdmin ? 'Review and resolve student service tickets' : 'Submit inquiries for ID cards, examination queries, IT setup, hostel or library'}
          </p>
        </div>

        {!isAdmin && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span>Create New Ticket</span>
          </button>
        )}
      </div>

      {/* Ticket List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {tickets.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)'
          }}>
            <LifeBuoy size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <p>No support tickets raised yet.</p>
          </div>
        ) : (
          tickets.map((ticket) => {
            const statusStyle = getStatusColor(ticket.status);
            return (
              <div
                key={ticket.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: 'var(--bg-subtle)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      color: '#93c5fd'
                    }}>
                      {ticket.ticket_number}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Tag size={12} />
                      <span>{ticket.category}</span>
                    </span>
                    {isAdmin && (
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        From: <strong>{ticket.student_name}</strong> ({ticket.student_email})
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color
                    }}>
                      {ticket.status}
                    </span>

                    {isAdmin && (
                      <button
                        className="btn-secondary"
                        style={{ fontSize: '11px', padding: '4px 10px' }}
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setResolutionStatus(ticket.status);
                          setResolutionNotes(ticket.resolution_notes || '');
                        }}
                      >
                        <span>Update Status</span>
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700 }}>{ticket.subject}</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {ticket.description}
                  </p>
                </div>

                {ticket.resolution_notes && (
                  <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '12px'
                  }}>
                    <div style={{ color: 'var(--accent-emerald)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} />
                      <span>Administration Resolution Notes:</span>
                    </div>
                    <p style={{ color: 'var(--text-primary)', marginTop: '4px' }}>{ticket.resolution_notes}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create Ticket */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Raise Campus Support Ticket</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Issue Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%' }}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lost ID card / RFID scanner error"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Description & Details
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain the issue in detail, include device details, location or roll number..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Admin Resolution */}
      {selectedTicket && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Update Ticket #{selectedTicket.ticket_number}</h3>
              <button onClick={() => setSelectedTicket(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAdminUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Status
                </label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Resolution Notes / Action Taken
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide resolution details for the student..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setSelectedTicket(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
