import React, { useState, useEffect } from 'react';
import {
  FileText,
  UploadCloud,
  Database,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { adminApi } from '../services/api';

const AdminKnowledge = ({ refreshKey }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Form State
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Academic Regulations');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadDocuments();
  }, [refreshKey]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getDocuments();
      setDocuments(res);
    } catch (err) {
      console.error('Error fetching admin documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) return;

    setUploading(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('category', category);
    formData.append('description', description);

    try {
      const res = await adminApi.uploadDocument(formData);
      setStatusMessage({
        type: 'success',
        text: `Indexed "${title}" into Qdrant Vector Store (${res.indexed_chunks} chunks).`,
      });
      setFile(null);
      setTitle('');
      setDescription('');
      loadDocuments();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to upload and index document.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, docTitle) => {
    if (!window.confirm(`Delete document "${docTitle}"? This will also purge its vector points from Qdrant and BM25 index.`)) return;
    try {
      await adminApi.deleteDocument(id);
      setStatusMessage({
        type: 'success',
        text: `Document "${docTitle}" successfully removed from Qdrant and BM25 index.`,
      });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error('Error deleting document:', err);
      setStatusMessage({
        type: 'error',
        text: 'Failed to delete document from database and vector store.',
      });
    }
  };

  const totalChunks = documents.reduce((acc, curr) => acc + curr.total_chunks, 0);

  return (
    <div className="page-wrapper">
      {/* Overview Metric Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box" style={{ backgroundColor: 'var(--accent-indigo-bg)' }}>
              <Database size={20} color="#818cf8" />
            </div>
            <span className="stat-badge" style={{ backgroundColor: 'var(--accent-indigo-bg)', color: '#818cf8' }}>
              Qdrant Vector DB
            </span>
          </div>
          <div className="stat-value">{totalChunks}</div>
          <div className="stat-label">Total Indexed Chunks in Storage</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box" style={{ backgroundColor: 'var(--accent-emerald-bg)' }}>
              <FileText size={20} color="#10b981" />
            </div>
            <span className="stat-badge" style={{ backgroundColor: 'var(--accent-emerald-bg)', color: '#10b981' }}>
              Knowledge Base
            </span>
          </div>
          <div className="stat-value">{documents.length}</div>
          <div className="stat-label">Active College Documents</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon-box" style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)' }}>
              <Layers size={20} color="#3b82f6" />
            </div>
            <span className="stat-badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
              Dual Search
            </span>
          </div>
          <div className="stat-value">Dense + BM25</div>
          <div className="stat-label">Hybrid RAG Retrieval Engine</div>
        </div>
      </div>

      {/* Upload Document Panel */}
      <div className="card-panel" style={{ marginBottom: '32px' }}>
        <div className="panel-header">
          <h3>
            <UploadCloud size={18} color="#3b82f6" />
            <span>Upload & Index New College Document</span>
          </h3>
        </div>

        {statusMessage && (
          <div style={{
            backgroundColor: statusMessage.type === 'success' ? 'var(--accent-emerald-bg)' : 'var(--accent-rose-bg)',
            color: statusMessage.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            marginBottom: '18px',
            border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Document Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Scholarship & Financial Aid Guidelines 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="Academic Regulations">Academic Regulations</option>
                <option value="Curriculum & Syllabus">Curriculum & Syllabus</option>
                <option value="Examinations">Examinations & Grading</option>
                <option value="Campus Services">Campus Services & Facilities</option>
                <option value="Placement & Internships">Placement & Internships</option>
                <option value="Scholarships">Scholarships & Aid</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Select File (PDF, TXT, or MD)
            </label>
            <input
              type="file"
              required
              accept=".pdf,.txt,.md"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="Brief description of the policy or course syllabus contents..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button type="submit" disabled={uploading || !file} className="btn-primary">
              <UploadCloud size={16} />
              <span>{uploading ? 'Extracting, Chunking & Indexing...' : 'Upload & Index to Qdrant'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Indexed Documents Table */}
      <div className="card-panel">
        <div className="panel-header">
          <h3>
            <FileText size={18} color="#10b981" />
            <span>Currently Ingested Knowledge Base Documents</span>
          </h3>
          <button className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={loadDocuments}>
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 14px' }}>Document Title</th>
                <th style={{ padding: '12px 14px' }}>Category</th>
                <th style={{ padding: '12px 14px' }}>Type</th>
                <th style={{ padding: '12px 14px' }}>Chunks Indexed</th>
                <th style={{ padding: '12px 14px' }}>Size</th>
                <th style={{ padding: '12px 14px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{doc.title}</td>
                  <td style={{ padding: '12px 14px', color: '#93c5fd' }}>{doc.category}</td>
                  <td style={{ padding: '12px 14px', textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {doc.file_type}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#34d399' }}>
                    {doc.total_chunks} chunks
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                    {(doc.file_size_bytes / 1024).toFixed(1)} KB
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button
                      onClick={() => handleDelete(doc.id, doc.title)}
                      className="btn-danger"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      title="Delete document"
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminKnowledge;
