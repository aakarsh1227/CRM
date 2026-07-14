import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleView, updateFormField, sendMessageToAgent, clearForm } from './store/crmSlice';
import axios from 'axios';

function App() {
  const dispatch = useDispatch();
  const { isChatView, chatHistory, formFields, loading } = useSelector((state) => state.crm);
  const [userInput, setUserInput] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    dispatch(sendMessageToAgent(userInput));
    setUserInput('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('Logging interaction details...');
    try {
      const promptText = `Direct structured form log: Log interaction for HCP ${formFields.hcpName} on date ${formFields.interactionDate}. Topics discussed: ${formFields.discussionTopics}. Next steps: ${formFields.nextSteps}. Summary: ${formFields.summary}`;
      const response = await axios.post('http://localhost:8080/api/chat', { message: promptText });
      setSubmitStatus(`✅ Success: ${response.data.response}`);
      dispatch(clearForm());
    } catch (err) {
      setSubmitStatus('❌ Failed to save form data natively.');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#F4F6F9', color: '#1A202C' }}>
      {/* Side Brand panel */}
      <div style={{ width: '280px', backgroundColor: '#1E293B', color: '#FFF', padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '5px' }}>PulseCRM</h2>
          <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: 0 }}>HCP Module • AI-First Framework</p>
          <hr style={{ border: '0.5px solid #334155', margin: '20px 0' }} />
          <button 
            onClick={() => dispatch(toggleView())}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#3B82F6', color: '#FFF', fontWeight: 600, cursor: 'pointer' }}
          >
            Switch to {isChatView ? "Structured Form" : "Conversational Chat"}
          </button>
        </div>
        <div style={{ fontSize: '11px', color: '#64748B' }}>Logged in as Field Rep</div>
      </div>

      {/* Main Container workspace */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#3B82F6', textTransform: 'uppercase' }}>HCP Interaction Management</span>
          <h1 style={{ fontWeight: 700, marginTop: '4px' }}>Log Interaction Screen</h1>
        </div>

        {isChatView ? (
          /* CONVERSATIONAL CHAT INTERFACE */
          <div style={{ flex: 1, backgroundColor: '#FFF', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {chatHistory.map((msg, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ 
                    maxWidth: '70%', 
                    padding: '14px 18px', 
                    borderRadius: '12px', 
                    fontSize: '14px',
                    backgroundColor: msg.sender === 'user' ? '#3B82F6' : '#F1F5F9', 
                    color: msg.sender === 'user' ? '#FFF' : '#1E293B' 
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && <div style={{ color: '#64748B', fontSize: '13px', fontStyle: 'italic' }}>AI Agent is invoking tools...</div>}
            </div>
            <form onSubmit={handleChatSubmit} style={{ display: 'flex', borderTop: '1px solid #E2E8F0', padding: '16px' }}>
              <input 
                type="text" 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your note (e.g., 'Log meeting with Dr. Smith today...')" 
                style={{ flex: 1, padding: '14px', border: '1px solid #CBD5E1', borderRadius: '8px', marginRight: '12px', outline: 'none' }}
              />
              <button type="submit" style={{ padding: '0 24px', backgroundColor: '#1E293B', color: '#FFF', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                Send
              </button>
            </form>
          </div>
        ) : (
          /* STRUCTURED FORM INTERFACE */
          <form onSubmit={handleFormSubmit} style={{ backgroundColor: '#FFF', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>HCP Full Name</label>
                <input type="text" required value={formFields.hcpName} onChange={(e) => dispatch(updateFormField({ field: 'hcpName', value: e.target.value }))} style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} placeholder="Dr. Jane Doe" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Interaction Date</label>
                <input type="date" required value={formFields.interactionDate} onChange={(e) => dispatch(updateFormField({ field: 'interactionDate', value: e.target.value }))} style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Discussion Topics</label>
              <textarea rows="3" value={formFields.discussionTopics} onChange={(e) => dispatch(updateFormField({ field: 'discussionTopics', value: e.target.value }))} style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} placeholder="Detail specific therapies covered..." />
            </div>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Next Action Steps</label>
                <input type="text" value={formFields.nextSteps} onChange={(e) => dispatch(updateFormField({ field: 'nextSteps', value: e.target.value }))} style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} placeholder="e.g., Follow up with samples" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Core Summary</label>
                <input type="text" value={formFields.summary} onChange={(e) => dispatch(updateFormField({ field: 'summary', value: e.target.value }))} style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} placeholder="Brief overall takeaway..." />
              </div>
            </div>
            <button type="submit" style={{ padding: '14px', backgroundColor: '#1E293B', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              Submit Interaction Log
            </button>
            {submitStatus && <div style={{ fontSize: '14px', marginTop: '10px', fontWeight: 500 }}>{submitStatus}</div>}
          </form>
        )}
      </div>
    </div>
  );
}

export default App;
