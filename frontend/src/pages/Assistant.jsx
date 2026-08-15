import React, { useState, useRef, useEffect } from 'react';
import {
  BotMessageSquare,
  Send,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { chatApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Assistant = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello **${user?.name || 'Student'}**! 👋 I am your **Campus AI Assistant**.\n\nI have access to your live **MCA Semester 2** academic records (attendance, timetable, assignments) and the official college knowledge base (regulations, syllabus, examination rules).\n\nHow can I assist you today?`,
      sources: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    "What's my attendance in DBMS?",
    "What is the minimum attendance rule?",
    "Add DBMS assignment: BCNF Practice due Friday",
    "What are the rules and fees for re-examination?",
    "What topics are included in DBMS Unit 2?",
    "What classes do I have tomorrow?",
    "Create ticket: ID card RFID not working",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMessage = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Pass previous 6 messages as history
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await chatApi.sendMessage(query, historyPayload);
      
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          sources: res.sources || [],
          intent: res.intent,
          action: res.action_performed,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Unable to connect to the assistant backend. Please ensure the FastAPI server and Ollama are running.',
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ height: 'calc(100vh - 70px)', padding: '16px 36px 24px 36px', display: 'flex', flexDirection: 'column' }}>
      <div className="chat-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Context Awareness Banner */}
        <div className="chat-context-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }} />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Active Context: {user?.name || 'Student'} ({user?.student_id || 'MCA2025-042'})
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {user?.program || 'MCA'} Sem {user?.semester || 2} • 4 Enrolled Courses
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#93c5fd', backgroundColor: 'rgba(59,130,246,0.1)', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>
            <Layers size={13} />
            <span>Hybrid RAG (Qdrant + BM25) • Llama 3.2</span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="chat-messages">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div key={index} className={`message-row ${isUser ? 'user' : 'assistant'}`}>
                <div className={`msg-avatar ${isUser ? 'user-avatar' : 'assistant-avatar'}`}>
                  {isUser ? <User size={16} /> : <BotMessageSquare size={16} />}
                </div>

                <div style={{ maxWidth: '85%' }}>
                  <div className="msg-bubble">
                    <div style={{ whiteSpace: 'pre-line' }}>{msg.content}</div>

                    {/* Action Confirmation Pill */}
                    {msg.action && (
                      <div className="action-pill-card">
                        <CheckCircle2 size={16} />
                        <span>
                          Action Executed: {msg.action.type === 'assignment_created' ? `Assignment added for ${msg.action.course}` : 'Record updated'}
                        </span>
                      </div>
                    )}

                    {/* Cited Source Documents */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="citations-box">
                        <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px', color: '#93c5fd' }}>
                          <BookOpen size={13} />
                          <span>Knowledge Base Citations ({msg.sources.length} sources):</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {msg.sources.map((src, sIdx) => (
                            <span key={sIdx} className="citation-tag" title={src.snippet}>
                              <FileText size={11} />
                              <span>{src.document_title} (p. {src.page || 1})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="message-row assistant">
              <div className="msg-avatar assistant-avatar">
                <BotMessageSquare size={16} />
              </div>
              <div className="msg-bubble" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} className="animate-spin" color="#3b82f6" />
                <span>Thinking & retrieving college documents via Qdrant...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="suggestion-chips">
          {quickPrompts.map((prompt, pIdx) => (
            <button key={pIdx} className="chip-btn" onClick={() => handleSend(prompt)}>
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          className="chat-input-bar"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            className="chat-input-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about attendance, courses, exams, syllabus, or say 'Add assignment for DBMS'..."
          />
          <button type="submit" className="chat-send-btn" disabled={loading || !input.trim()}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Assistant;
