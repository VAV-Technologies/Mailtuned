import React, { useState, useEffect } from 'react';
import { Mail, Clock, AlertCircle, Tag, Play, Plus, X, ChevronRight, ArrowLeft, Trash2, Edit2 } from 'lucide-react';

const GmailInboxManager = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Temporarily bypass login for UI preview
  const [emails, setEmails] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [sequences, setSequences] = useState([]);
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [customLabels, setCustomLabels] = useState([]);
  const [newLabel, setNewLabel] = useState({ name: '', color: '#3b82f6' });
  const [sequenceForm, setSequenceForm] = useState({
    prospectName: '',
    businessActivity: '',
    selectedTemplateId: null
  });
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyForm, setReplyForm] = useState({
    to: '',
    cc: '',
    subject: '',
    content: '',
    type: 'reply', // 'reply', 'replyAll', or 'forward'
    selectedTemplateId: null
  });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, emailId: null, emailSubject: '' });
  const [labelEmailId, setLabelEmailId] = useState(null);
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [editingLabel, setEditingLabel] = useState(null);
  const [showSequenceManager, setShowSequenceManager] = useState(false);
  const [editingSequence, setEditingSequence] = useState(null);
  const [timerFilter, setTimerFilter] = useState('all'); // 'all', 'urgent', 'now', 'please', 'none'
  const [filterType, setFilterType] = useState('all'); // 'all', 'timer', 'label'
  const [selectedLabelFilter, setSelectedLabelFilter] = useState(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState([
    {
      id: 1,
      name: 'Professional Introduction',
      subject: 'Introduction - {{Your Name}}',
      content: 'Dear {{Recipient Name}},\n\nI hope this email finds you well. My name is {{Your Name}} and I wanted to reach out regarding {{Topic}}.\n\nI look forward to connecting with you.\n\nBest regards,\n{{Your Name}}'
    },
    {
      id: 2,
      name: 'Follow-up',
      subject: 'Following up on our conversation',
      content: 'Hi {{Recipient Name}},\n\nI wanted to follow up on our recent conversation about {{Topic}}.\n\n{{Additional Details}}\n\nPlease let me know if you have any questions.\n\nBest,\n{{Your Name}}'
    }
  ]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showCRM, setShowCRM] = useState(false);
  const [crmColumns, setCrmColumns] = useState([
    { id: 'new', name: 'New Leads', cards: [] },
    { id: 'contacted', name: 'Contacted', cards: [] },
    { id: 'qualified', name: 'Qualified', cards: [] },
    { id: 'proposal', name: 'Proposal', cards: [] },
    { id: 'closed', name: 'Closed', cards: [] }
  ]);
  const [showCRMModal, setShowCRMModal] = useState(false);
  const [crmForm, setCrmForm] = useState({ emailId: null, prospectName: '', company: '', email: '', timerStatus: null });
  const [editingColumn, setEditingColumn] = useState(null);
  const [draggedCard, setDraggedCard] = useState(null);
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [showProspectModal, setShowProspectModal] = useState(false);
  const [sequenceTemplates, setSequenceTemplates] = useState([
    {
      id: 1,
      name: 'Follow-up Sequence',
      description: 'Standard follow-up for prospects',
      emails: [
        { delay: 24, subject: 'Following up on our conversation', template: 'Hi {{prospectName}},\n\nI wanted to follow up on our previous conversation about {{businessActivity}}...' },
        { delay: 48, subject: 'Quick check-in', template: 'Hi {{prospectName}},\n\nJust checking in to see if you had any questions about {{businessActivity}}...' },
        { delay: 96, subject: 'Final follow-up', template: 'Hi {{prospectName}},\n\nThis is my final follow-up regarding {{businessActivity}}...' }
      ]
    }
  ]);

  // Mock email data for demonstration
  useEffect(() => {
    const mockEmails = [
      {
        id: '1',
        threadId: 'thread1',
        from: 'john.doe@example.com',
        subject: 'Project Update',
        snippet: 'Here\'s the latest update on our project...',
        date: new Date(Date.now() - 13 * 60 * 60 * 1000), // 13 hours ago
        unread: true,
        labels: [],
        thread: [
          {
            id: 'm1',
            from: 'john.doe@example.com',
            to: 'you@example.com',
            date: new Date(Date.now() - 13 * 60 * 60 * 1000),
            content: 'Hi,\n\nHere\'s the latest update on our project. We\'ve completed the first phase and are moving into implementation.\n\nKey achievements:\n- Completed design phase\n- Got client approval\n- Team is ready to start development\n\nLet me know if you have any questions.\n\nBest regards,\nJohn'
          }
        ]
      },
      {
        id: '2',
        threadId: 'thread2',
        from: 'jane.smith@example.com',
        subject: 'Meeting Tomorrow',
        snippet: 'Just wanted to confirm our meeting...',
        date: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
        unread: false,
        labels: [],
        thread: [
          {
            id: 'm2',
            from: 'jane.smith@example.com',
            to: 'you@example.com',
            date: new Date(Date.now() - 25 * 60 * 60 * 1000),
            content: 'Hi,\n\nJust wanted to confirm our meeting tomorrow at 2 PM. We\'ll be discussing the Q4 strategy.\n\nAgenda:\n1. Review Q3 performance\n2. Q4 goals and targets\n3. Resource allocation\n\nSee you tomorrow!\n\nJane'
          }
        ]
      },
      {
        id: '3',
        threadId: 'thread3',
        from: 'client@company.com',
        subject: 'Contract Review',
        snippet: 'Please review the attached contract...',
        date: new Date(Date.now() - 50 * 60 * 60 * 1000), // 50 hours ago
        unread: true,
        labels: [],
        thread: [
          {
            id: 'm3',
            from: 'client@company.com',
            to: 'you@example.com',
            date: new Date(Date.now() - 50 * 60 * 60 * 1000),
            content: 'Hello,\n\nPlease review the attached contract for our upcoming project. We need your signature by end of week.\n\nKey terms:\n- Project duration: 6 months\n- Budget: $150,000\n- Deliverables as discussed\n\nPlease let me know if you have any questions or concerns.\n\nBest,\nClient Team'
          }
        ]
      }
    ];
    setEmails(mockEmails);
  }, []);

  // Calculate time since email
  const getTimeSince = (date) => {
    const hours = Math.floor((Date.now() - date) / (1000 * 60 * 60));
    return hours;
  };

  // Get reply urgency status
  const getReplyStatus = (date) => {
    const hours = getTimeSince(date);
    if (hours >= 48) return { text: 'Reply Urgently', color: 'text-red-600', bg: 'bg-red-100' };
    if (hours >= 24) return { text: 'Reply Now', color: 'text-orange-600', bg: 'bg-orange-100' };
    if (hours >= 12) return { text: 'Please Reply', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return null;
  };

  // Format date
  const formatDate = (date) => {
    const now = new Date();
    const emailDate = new Date(date);
    
    if (emailDate.toDateString() === now.toDateString()) {
      return emailDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    
    return emailDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };


  // Handle Gmail authentication
  const handleAuth = () => {
    // In a real implementation, this would use the Gmail API OAuth flow
    setIsAuthenticated(true);
    // Save authentication state
    sessionStorage.setItem('gmailAuthenticated', 'true');
    // In a real app, you'd also store the OAuth tokens securely
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('gmailAuthenticated');
    // In a real app, you'd also revoke OAuth tokens
    setSelectedThread(null);
    setShowLabelManager(false);
  };

  // Start sequence
  const startSequence = () => {
    if (sequenceForm.prospectName && sequenceForm.businessActivity && sequenceForm.selectedTemplateId) {
      const template = sequenceTemplates.find(t => t.id === sequenceForm.selectedTemplateId);
      const newSequence = {
        id: Date.now(),
        prospectName: sequenceForm.prospectName,
        businessActivity: sequenceForm.businessActivity,
        template: template,
        startedAt: new Date(),
        status: 'active',
        currentStep: 0
      };
      setSequences([...sequences, newSequence]);
      setShowSequenceModal(false);
      setSequenceForm({ prospectName: '', businessActivity: '', selectedTemplateId: null });
    }
  };

  // Add custom label
  const addLabel = () => {
    if (newLabel.name) {
      setCustomLabels([...customLabels, { ...newLabel, id: Date.now() }]);
      setNewLabel({ name: '', color: '#3b82f6' });
      setShowLabelModal(false);
    }
  };

  // Open label selector for specific email
  const openLabelSelector = (emailId, e) => {
    e.stopPropagation();
    setLabelEmailId(emailId);
  };

  // Push to CRM
  const pushToCRM = (emailId, e) => {
    e.stopPropagation();
    const email = emails.find(em => em.id === emailId);
    const timerStatus = getReplyStatus(email.date);
    setCrmForm({
      emailId: emailId,
      prospectName: '',
      company: '',
      email: email.from,
      timerStatus: timerStatus
    });
    setShowCRMModal(true);
  };

  // Add prospect to CRM
  const addProspectToCRM = () => {
    if (crmForm.prospectName && crmForm.company) {
      const newCard = {
        id: Date.now(),
        prospectName: crmForm.prospectName,
        company: crmForm.company,
        email: crmForm.email,
        addedDate: new Date(),
        emailThreadId: crmForm.emailId,
        timerStatus: crmForm.timerStatus,
        quality: 2, // Default to medium quality
        website: '',
        location: '',
        notes: ''
      };
      
      setCrmColumns(crmColumns.map(col => 
        col.id === 'new' 
          ? { ...col, cards: [...col.cards, newCard] }
          : col
      ));
      
      setShowCRMModal(false);
      setCrmForm({ emailId: null, prospectName: '', company: '', email: '', timerStatus: null });
    }
  };

  // Open prospect details
  const openProspectDetails = (card, e) => {
    if (e) e.stopPropagation();
    setSelectedProspect(card);
    setShowProspectModal(true);
  };

  // Update prospect details
  const updateProspectDetails = (updates) => {
    setCrmColumns(crmColumns.map(col => ({
      ...col,
      cards: col.cards.map(card => 
        card.id === selectedProspect.id 
          ? { ...card, ...updates }
          : card
      )
    })));
    setSelectedProspect({ ...selectedProspect, ...updates });
  };

  // Go to email thread
  const goToEmailThread = () => {
    const email = emails.find(e => e.id === selectedProspect.emailThreadId);
    if (email) {
      setShowCRM(false);
      setShowProspectModal(false);
      setSelectedThread(email);
    }
  };

  // Toggle label on email
  const toggleLabel = (emailId, labelId) => {
    setEmails(emails.map(email => {
      if (email.id === emailId) {
        const hasLabel = email.labels.includes(labelId);
        return {
          ...email,
          labels: hasLabel 
            ? email.labels.filter(l => l !== labelId)
            : [...email.labels, labelId]
        };
      }
      return email;
    }));
  };

  // Handle reply actions
  const handleReplyAction = (type) => {
    if (!selectedThread || !selectedThread.thread || selectedThread.thread.length === 0) {
      console.error('No thread data available');
      return;
    }
    
    const lastMessage = selectedThread.thread[selectedThread.thread.length - 1];
    setReplyForm({
      to: type === 'forward' ? '' : lastMessage.from,
      cc: '',
      subject: type === 'forward' 
        ? `Fwd: ${selectedThread.subject}`
        : `Re: ${selectedThread.subject}`,
      content: '',
      type: type,
      selectedTemplateId: null
    });
    setShowReplyBox(true);
  };

  // Send reply
  const sendReply = () => {
    if (replyForm.content.trim()) {
      // In a real implementation, this would send via Gmail API
      const newMessage = {
        id: `m${Date.now()}`,
        from: 'you@example.com',
        to: replyForm.to,
        date: new Date(),
        content: replyForm.content
      };
      
      // Update the thread with the new message
      setEmails(emails.map(email => {
        if (email.id === selectedThread.id) {
          return {
            ...email,
            thread: [...email.thread, newMessage],
            date: new Date() // Update thread date
          };
        }
        return email;
      }));
      
      // Update selected thread
      setSelectedThread({
        ...selectedThread,
        thread: [...selectedThread.thread, newMessage]
      });
      
      // Reset form
      setReplyForm({
        to: '',
        cc: '',
        subject: '',
        content: '',
        type: 'reply',
        selectedTemplateId: null
      });
      setShowReplyBox(false);
    }
  };

  // Delete email
  const deleteEmail = (emailId, e) => {
    e.stopPropagation(); // Prevent opening the thread
    const email = emails.find(em => em.id === emailId);
    setDeleteConfirm({ 
      show: true, 
      emailId: emailId, 
      emailSubject: email?.subject || '' 
    });
  };

  // Confirm delete
  const confirmDelete = () => {
    if (deleteConfirm.emailId) {
      setEmails(emails.filter(email => email.id !== deleteConfirm.emailId));
      // If the deleted email was currently selected, close the thread view
      if (selectedThread && selectedThread.id === deleteConfirm.emailId) {
        setSelectedThread(null);
      }
      setDeleteConfirm({ show: false, emailId: null, emailSubject: '' });
    }
  };

  // Update label
  const updateLabel = (labelId, updates) => {
    setCustomLabels(customLabels.map(label => 
      label.id === labelId ? { ...label, ...updates } : label
    ));
  };

  // Delete label
  const deleteLabel = (labelId) => {
    setCustomLabels(customLabels.filter(label => label.id !== labelId));
    // Remove this label from all emails
    setEmails(emails.map(email => ({
      ...email,
      labels: email.labels.filter(l => l !== labelId)
    })));
  };

  // Handle drag and drop for CRM
  const handleDragStart = (e, card, columnId) => {
    setDraggedCard({ card, sourceColumnId: columnId });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    if (!draggedCard) return;

    const { card, sourceColumnId } = draggedCard;
    
    if (sourceColumnId === targetColumnId) {
      setDraggedCard(null);
      return;
    }

    // Remove card from source column and add to target column
    setCrmColumns(crmColumns.map(col => {
      if (col.id === sourceColumnId) {
        return { ...col, cards: col.cards.filter(c => c.id !== card.id) };
      }
      if (col.id === targetColumnId) {
        return { ...col, cards: [...col.cards, card] };
      }
      return col;
    }));

    setDraggedCard(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Gmail Inbox Manager</h1>
          <p className="text-gray-600 mb-6">Connect your Gmail account to get started</p>
          <button
            onClick={handleAuth}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Connect Gmail Account
          </button>
        </div>
      </div>
    );
  }

  // CRM View
  if (showCRM) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCRM(false)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Inbox
              </button>
              <h1 className="text-xl font-semibold text-gray-800">CRM Pipeline</h1>
            </div>
            <button
              onClick={() => {
                const newColumn = {
                  id: `col-${Date.now()}`,
                  name: 'New Column',
                  cards: []
                };
                setCrmColumns([...crmColumns, newColumn]);
                setEditingColumn(newColumn.id);
              }}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Column
            </button>
          </div>
        </header>

        {/* Kanban Board */}
        <div className="flex-1 p-6 overflow-x-auto">
          <div className="flex gap-4 h-full" style={{ minWidth: 'max-content' }}>
            {crmColumns.map((column, columnIndex) => (
              <div
                key={column.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 w-80 flex flex-col"
                style={{ minHeight: 'calc(100vh - 180px)' }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {editingColumn === column.id ? (
                  <div className="mb-4">
                    <input
                      type="text"
                      value={column.name}
                      onChange={(e) => setCrmColumns(crmColumns.map(col => 
                        col.id === column.id ? { ...col, name: e.target.value } : col
                      ))}
                      onBlur={() => setEditingColumn(null)}
                      onKeyPress={(e) => e.key === 'Enter' && setEditingColumn(null)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800">{column.name}</h3>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-500 mr-2">{column.cards.length}</span>
                      <button
                        onClick={() => setEditingColumn(column.id)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {crmColumns.length > 1 && (
                        <button
                          onClick={() => setCrmColumns(crmColumns.filter(col => col.id !== column.id))}
                          className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-gray-100 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {column.cards.map(card => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card, column.id)}
                      onClick={(e) => openProspectDetails(card, e)}
                      className={`border p-3 rounded-lg cursor-pointer hover:shadow-md transition-all ${
                        card.timerStatus 
                          ? card.timerStatus.text === 'Reply Urgently' 
                            ? 'bg-red-50 border-red-300 hover:border-red-400' 
                            : card.timerStatus.text === 'Reply Now'
                            ? 'bg-orange-50 border-orange-300 hover:border-orange-400'
                            : card.timerStatus.text === 'Please Reply'
                            ? 'bg-yellow-50 border-yellow-300 hover:border-yellow-400'
                            : 'bg-gray-50 border-gray-200 hover:border-indigo-300'
                          : 'bg-gray-50 border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {card.timerStatus && (
                        <div className={`text-xs font-medium mb-2 flex items-center gap-1 ${
                          card.timerStatus.text === 'Reply Urgently' 
                            ? 'text-red-600' 
                            : card.timerStatus.text === 'Reply Now'
                            ? 'text-orange-600'
                            : 'text-yellow-600'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {card.timerStatus.text}
                        </div>
                      )}
                      <div className="font-medium text-gray-900">{card.prospectName}</div>
                      <div className="text-sm text-gray-600 mt-1">{card.company}</div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-gray-500">{card.email}</div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3].map(star => (
                            <span
                              key={star}
                              className={`text-xs ${
                                star <= card.quality 
                                  ? 'text-yellow-500' 
                                  : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {column.cards.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      Drop prospects here
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Template Manager View
  if (showTemplateManager) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowTemplateManager(false)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Inbox
              </button>
              <h1 className="text-xl font-semibold text-gray-800">Manage Email Templates</h1>
            </div>
            <button
              onClick={() => {
                const newTemplate = {
                  id: Date.now(),
                  name: 'New Template',
                  subject: '',
                  content: ''
                };
                setEmailTemplates([...emailTemplates, newTemplate]);
                setEditingTemplate(newTemplate.id);
              }}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create New Template
            </button>
          </div>
        </header>

        {/* Template List */}
        <div className="max-w-4xl mx-auto p-6">
          {emailTemplates.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
              <p className="text-gray-600 mb-4">Create email templates to save time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {emailTemplates.map(template => (
                <div key={template.id} className="bg-white rounded-lg shadow-sm">
                  {editingTemplate === template.id ? (
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                        <input
                          type="text"
                          value={template.name}
                          onChange={(e) => setEmailTemplates(emailTemplates.map(t => 
                            t.id === template.id ? { ...t, name: e.target.value } : t
                          ))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                        <input
                          type="text"
                          value={template.subject}
                          onChange={(e) => setEmailTemplates(emailTemplates.map(t => 
                            t.id === template.id ? { ...t, subject: e.target.value } : t
                          ))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Email subject (use {{variables}} for placeholders)"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Content</label>
                        <textarea
                          value={template.content}
                          onChange={(e) => setEmailTemplates(emailTemplates.map(t => 
                            t.id === template.id ? { ...t, content: e.target.value } : t
                          ))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 h-40 resize-none"
                          placeholder="Email content (use {{variables}} for placeholders)"
                        />
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        Tip: Use {`{{variables}}`} like {`{{Recipient Name}}`}, {`{{Your Name}}`}, {`{{Topic}}`} that can be filled in when using the template.
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => setEditingTemplate(null)}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                        >
                          Save Template
                        </button>
                        <button
                          onClick={() => {
                            setEmailTemplates(emailTemplates.filter(t => t.id !== template.id));
                            setEditingTemplate(null);
                          }}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                        >
                          Delete Template
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">Subject: {template.subject}</p>
                        </div>
                        <button
                          onClick={() => setEditingTemplate(template.id)}
                          className="text-purple-600 hover:text-purple-700 px-3 py-1 rounded hover:bg-purple-50"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded mt-3">
                        {template.content.split('\n').slice(0, 3).join('\n')}
                        {template.content.split('\n').length > 3 && '...'}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Sequence Manager View
  if (showSequenceManager) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSequenceManager(false)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Inbox
              </button>
              <h1 className="text-xl font-semibold text-gray-800">Manage Sequences</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const newSequence = {
                    id: Date.now(),
                    name: 'New Sequence',
                    description: '',
                    emails: [{ delay: 24, subject: '', template: '' }]
                  };
                  setSequenceTemplates([...sequenceTemplates, newSequence]);
                  setEditingSequence(newSequence.id);
                }}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create New Sequence
              </button>
            </div>
          </div>
        </header>

        {/* Sequence List */}
        <div className="max-w-6xl mx-auto p-6">
          {sequenceTemplates.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sequences yet</h3>
              <p className="text-gray-600 mb-4">Create sequences to automate your email follow-ups</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sequenceTemplates.map(sequence => (
                <div key={sequence.id} className="bg-white rounded-lg shadow-sm">
                  {editingSequence === sequence.id ? (
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sequence Name</label>
                        <input
                          type="text"
                          value={sequence.name}
                          onChange={(e) => setSequenceTemplates(sequenceTemplates.map(s => 
                            s.id === sequence.id ? { ...s, name: e.target.value } : s
                          ))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          value={sequence.description}
                          onChange={(e) => setSequenceTemplates(sequenceTemplates.map(s => 
                            s.id === sequence.id ? { ...s, description: e.target.value } : s
                          ))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Brief description of this sequence"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Steps</label>
                        {sequence.emails.map((email, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-sm font-medium">Step {index + 1}</span>
                              <input
                                type="number"
                                value={email.delay}
                                onChange={(e) => {
                                  const newEmails = [...sequence.emails];
                                  newEmails[index].delay = parseInt(e.target.value);
                                  setSequenceTemplates(sequenceTemplates.map(s => 
                                    s.id === sequence.id ? { ...s, emails: newEmails } : s
                                  ));
                                }}
                                className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                              />
                              <span className="text-sm text-gray-600">hours after start</span>
                              <button
                                onClick={() => {
                                  const newEmails = sequence.emails.filter((_, i) => i !== index);
                                  setSequenceTemplates(sequenceTemplates.map(s => 
                                    s.id === sequence.id ? { ...s, emails: newEmails } : s
                                  ));
                                }}
                                className="ml-auto text-red-600 hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                            <input
                              type="text"
                              value={email.subject}
                              onChange={(e) => {
                                const newEmails = [...sequence.emails];
                                newEmails[index].subject = e.target.value;
                                setSequenceTemplates(sequenceTemplates.map(s => 
                                  s.id === sequence.id ? { ...s, emails: newEmails } : s
                                ));
                              }}
                              className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
                              placeholder="Email subject"
                            />
                            <textarea
                              value={email.template}
                              onChange={(e) => {
                                const newEmails = [...sequence.emails];
                                newEmails[index].template = e.target.value;
                                setSequenceTemplates(sequenceTemplates.map(s => 
                                  s.id === sequence.id ? { ...s, emails: newEmails } : s
                                ));
                              }}
                              className="w-full border border-gray-300 rounded px-3 py-2 h-32 resize-none"
                              placeholder="Email template (use {{prospectName}} and {{businessActivity}} as variables)"
                            />
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newEmails = [...sequence.emails, { delay: 24, subject: '', template: '' }];
                            setSequenceTemplates(sequenceTemplates.map(s => 
                              s.id === sequence.id ? { ...s, emails: newEmails } : s
                            ));
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          + Add Email Step
                        </button>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => setEditingSequence(null)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          Save Sequence
                        </button>
                        <button
                          onClick={() => {
                            setSequenceTemplates(sequenceTemplates.filter(s => s.id !== sequence.id));
                            setEditingSequence(null);
                          }}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                        >
                          Delete Sequence
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{sequence.name}</h3>
                          <p className="text-gray-600">{sequence.description}</p>
                          <p className="text-sm text-gray-500 mt-1">{sequence.emails.length} email steps</p>
                        </div>
                        <button
                          onClick={() => setEditingSequence(sequence.id)}
                          className="text-blue-600 hover:text-blue-700 px-3 py-1 rounded hover:bg-blue-50"
                        >
                          Edit
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {sequence.emails.map((email, index) => (
                          <div key={index} className="flex items-center gap-3 text-sm">
                            <span className="text-gray-500">Step {index + 1}:</span>
                            <span className="font-medium">{email.subject || 'No subject'}</span>
                            <span className="text-gray-500">({email.delay}h delay)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Label Manager View
  if (showLabelManager) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowLabelManager(false)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Inbox
              </button>
              <h1 className="text-xl font-semibold text-gray-800">Manage Labels</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLabelModal(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create New Label
              </button>
            </div>
          </div>
        </header>

        {/* Label List */}
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm">
            {customLabels.length === 0 ? (
              <div className="p-12 text-center">
                <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No labels yet</h3>
                <p className="text-gray-600 mb-4">Create labels to organize your emails</p>
                <button
                  onClick={() => setShowLabelModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First Label
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {customLabels.map(label => (
                  <div key={label.id} className="p-4 flex items-center justify-between">
                    {editingLabel === label.id ? (
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="text"
                          value={label.name}
                          onChange={(e) => updateLabel(label.id, { name: e.target.value })}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                          autoFocus
                        />
                        <input
                          type="color"
                          value={label.color}
                          onChange={(e) => updateLabel(label.id, { color: e.target.value })}
                          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                        />
                        <button
                          onClick={() => setEditingLabel(null)}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <span 
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: label.color }}
                          />
                          <span className="font-medium">{label.name}</span>
                          <span className="text-sm text-gray-500">
                            {emails.filter(e => e.labels.includes(label.id)).length} emails
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingLabel(label.id)}
                            className="text-gray-600 hover:text-blue-600 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteLabel(label.id)}
                            className="text-gray-600 hover:text-red-600 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Label Modal - reused from main view */}
        {showLabelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">Create New Label</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label Name
                  </label>
                  <input
                    type="text"
                    value={newLabel.name}
                    onChange={(e) => setNewLabel({...newLabel, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Enter label name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label Color
                  </label>
                  <input
                    type="color"
                    value={newLabel.color}
                    onChange={(e) => setNewLabel({...newLabel, color: e.target.value})}
                    className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={addLabel}
                  disabled={!newLabel.name}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Create Label
                </button>
                <button
                  onClick={() => setShowLabelModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Thread View
  if (selectedThread) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Thread Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedThread(null)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Inbox
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSequenceModal(true)}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                Activate Sequence
              </button>
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2"
                onChange={(e) => e.target.value && toggleLabel(selectedThread.id, parseInt(e.target.value))}
                defaultValue=""
              >
                <option value="">Add Label</option>
                {customLabels.map(label => (
                  <option key={label.id} value={label.id}>{label.name}</option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Thread Content */}
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-2xl font-semibold mb-2">{selectedThread.subject}</h1>
              <div className="flex items-center gap-4">
                {getReplyStatus(selectedThread.date) && (
                  <span className={`text-sm px-3 py-1 rounded-full ${getReplyStatus(selectedThread.date).bg} ${getReplyStatus(selectedThread.date).color}`}>
                    <Clock className="w-4 h-4 inline mr-1" />
                    {getReplyStatus(selectedThread.date).text}
                  </span>
                )}
                {selectedThread.labels.map(labelId => {
                  const label = customLabels.find(l => l.id === labelId);
                  return label ? (
                    <span 
                      key={labelId}
                      className="text-sm px-3 py-1 rounded-full text-white"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {/* Email Messages */}
            <div className="divide-y divide-gray-200">
              {selectedThread.thread.map((message, index) => (
                <div key={message.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="font-medium">{message.from}</div>
                      <div className="text-sm text-gray-600">to {message.to}</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(message.date)}
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap text-gray-700">
                    {message.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Section */}
            <div className="p-6 border-t border-gray-200">
              {!showReplyBox ? (
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleReplyAction('reply')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Reply
                  </button>
                  <button 
                    onClick={() => handleReplyAction('replyAll')}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Reply All
                  </button>
                  <button 
                    onClick={() => handleReplyAction('forward')}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Forward
                  </button>
                  <button
                    onClick={() => setShowSequenceModal(true)}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Activate Sequence
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">
                      {replyForm.type === 'forward' ? 'Forward' : 'Reply'}
                    </h3>
                    <button
                      onClick={() => setShowReplyBox(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Template</label>
                    <select
                      value={replyForm.selectedTemplateId || ''}
                      onChange={(e) => {
                        const templateId = parseInt(e.target.value);
                        const template = emailTemplates.find(t => t.id === templateId);
                        if (template) {
                          setReplyForm({
                            ...replyForm,
                            selectedTemplateId: templateId,
                            subject: replyForm.type === 'forward' 
                              ? template.subject 
                              : replyForm.subject, // Keep Re: for replies
                            content: template.content
                          });
                        } else {
                          setReplyForm({
                            ...replyForm,
                            selectedTemplateId: null
                          });
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select a template (optional)</option>
                      {emailTemplates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                    <input
                      type="email"
                      value={replyForm.to}
                      onChange={(e) => setReplyForm({...replyForm, to: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Recipient email"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cc</label>
                    <input
                      type="email"
                      value={replyForm.cc}
                      onChange={(e) => setReplyForm({...replyForm, cc: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Cc recipients (optional)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={replyForm.subject}
                      onChange={(e) => setReplyForm({...replyForm, subject: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      readOnly={replyForm.type !== 'forward'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      value={replyForm.content}
                      onChange={(e) => setReplyForm({...replyForm, content: e.target.value})}
                      className={`w-full border border-gray-300 rounded-lg px-3 py-2 h-40 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        replyForm.selectedTemplateId && replyForm.content.includes('{{') 
                          ? 'placeholder-red-500' 
                          : ''
                      }`}
                      placeholder="Type your message here..."
                      autoFocus
                    />
                    {replyForm.selectedTemplateId && replyForm.content.includes('{{') && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-red-600">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          Variables to replace:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[...new Set(replyForm.content.match(/\{\{[^}]+\}\}/g) || [])].map((variable, index) => (
                            <span 
                              key={index} 
                              className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded font-medium"
                            >
                              {variable}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={sendReply}
                      disabled={!replyForm.content.trim() || !replyForm.to}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Send
                    </button>
                    <button
                      onClick={() => setShowReplyBox(false)}
                      className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sequence Modal */}
        {showSequenceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">Start Email Sequence</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Sequence Template
                  </label>
                  <select
                    value={sequenceForm.selectedTemplateId || ''}
                    onChange={(e) => setSequenceForm({...sequenceForm, selectedTemplateId: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Choose a sequence...</option>
                    {sequenceTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.emails.length} steps)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prospect Name
                  </label>
                  <input
                    type="text"
                    value={sequenceForm.prospectName}
                    onChange={(e) => setSequenceForm({...sequenceForm, prospectName: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Enter prospect name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Activity Classification
                  </label>
                  <input
                    type="text"
                    value={sequenceForm.businessActivity}
                    onChange={(e) => setSequenceForm({...sequenceForm, businessActivity: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., SaaS, E-commerce, Consulting"
                  />
                </div>
                
                {sequenceForm.selectedTemplateId && sequenceForm.prospectName && sequenceForm.businessActivity && (
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <p className="text-sm font-medium">Confirmation:</p>
                    <p className="text-sm">Template: {sequenceTemplates.find(t => t.id === sequenceForm.selectedTemplateId)?.name}</p>
                    <p className="text-sm">Prospect: {sequenceForm.prospectName}</p>
                    <p className="text-sm">Business: {sequenceForm.businessActivity}</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={startSequence}
                  disabled={!sequenceForm.prospectName || !sequenceForm.businessActivity || !sequenceForm.selectedTemplateId}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Start Sequence
                </button>
                <button
                  onClick={() => {
                    setShowSequenceModal(false);
                    setSequenceForm({ prospectName: '', businessActivity: '', selectedTemplateId: null });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Prospect Details Modal
  if (showProspectModal && selectedProspect) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold">Prospect Details</h2>
            <button
              onClick={() => setShowProspectModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prospect Name</label>
                <input
                  type="text"
                  value={selectedProspect.prospectName}
                  onChange={(e) => updateProspectDetails({ prospectName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={selectedProspect.company}
                  onChange={(e) => updateProspectDetails({ company: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={selectedProspect.email}
                  onChange={(e) => updateProspectDetails({ email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  value={selectedProspect.website || ''}
                  onChange={(e) => updateProspectDetails({ website: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="https://"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={selectedProspect.location || ''}
                  onChange={(e) => updateProspectDetails({ location: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="City, Country"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quality Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map(star => (
                    <button
                      key={star}
                      onClick={() => updateProspectDetails({ quality: star })}
                      className={`text-2xl ${
                        star <= selectedProspect.quality 
                          ? 'text-yellow-500' 
                          : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={selectedProspect.notes || ''}
                onChange={(e) => updateProspectDetails({ notes: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 h-32 resize-none"
                placeholder="Add notes about this prospect..."
              />
            </div>
            
            {selectedProspect.timerStatus && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Timer Status</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  {selectedProspect.timerStatus.text}
                </p>
              </div>
            )}
            
            <div className="text-sm text-gray-500">
              <p>Added: {formatDate(selectedProspect.addedDate)}</p>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={goToEmailThread}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Email Thread
            </button>
            <button
              onClick={() => setShowProspectModal(false)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Inbox View
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Inbox</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLabelManager(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Tag className="w-4 h-4" />
              Manage Labels
            </button>
            <button
              onClick={() => setShowTemplateManager(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Manage Templates
            </button>
            <button
              onClick={() => setShowSequenceManager(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Manage Sequences
            </button>
            <button
              onClick={() => setShowCRM(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              CRM
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              title="Logout"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Email List */}
      <div className="max-w-6xl mx-auto mt-6">
        {/* Filter Section */}
        <div className="bg-white shadow-sm px-6 py-4 mb-4 rounded-lg">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                // Reset specific filters when changing filter type
                if (e.target.value !== 'timer') setTimerFilter('all');
                if (e.target.value !== 'label') setSelectedLabelFilter(null);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em'
              }}
            >
              <option value="all">All Emails</option>
              <option value="timer">Filter by Timer</option>
              <option value="label">Filter by Label</option>
            </select>

            {/* Timer Filter Options */}
            {filterType === 'timer' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setTimerFilter('urgent')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                    timerFilter === 'urgent' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  Reply Urgently
                </button>
                <button
                  onClick={() => setTimerFilter('now')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                    timerFilter === 'now' 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  Reply Now
                </button>
                <button
                  onClick={() => setTimerFilter('please')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                    timerFilter === 'please' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  Please Reply
                </button>
                <button
                  onClick={() => setTimerFilter('none')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    timerFilter === 'none' 
                      ? 'bg-gray-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  No Timer
                </button>
              </div>
            )}

            {/* Label Filter Options */}
            {filterType === 'label' && (
              <div className="flex gap-2 items-center">
                {customLabels.length === 0 ? (
                  <span className="text-sm text-gray-500">No labels created yet</span>
                ) : (
                  <>
                    <span className="text-sm text-gray-600">Select label:</span>
                    <div className="flex gap-2">
                      {customLabels.map(label => (
                        <button
                          key={label.id}
                          onClick={() => setSelectedLabelFilter(
                            selectedLabelFilter === label.id ? null : label.id
                          )}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                            selectedLabelFilter === label.id
                              ? 'text-white'
                              : 'text-gray-700 hover:opacity-80'
                          }`}
                          style={{
                            backgroundColor: selectedLabelFilter === label.id 
                              ? label.color 
                              : `${label.color}20`,
                            borderWidth: '1px',
                            borderColor: label.color
                          }}
                        >
                          {label.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow-sm">
          <div className="divide-y divide-gray-200">
            {emails.filter(email => {
              // Apply filter based on filter type
              if (filterType === 'all') return true;
              
              if (filterType === 'timer') {
                if (timerFilter === 'all') return true;
                const status = getReplyStatus(email.date);
                if (timerFilter === 'urgent') return status?.text === 'Reply Urgently';
                if (timerFilter === 'now') return status?.text === 'Reply Now';
                if (timerFilter === 'please') return status?.text === 'Please Reply';
                if (timerFilter === 'none') return !status;
              }
              
              if (filterType === 'label') {
                if (!selectedLabelFilter) return true;
                return email.labels.includes(selectedLabelFilter);
              }
              
              return true;
            }).map(email => {
              const replyStatus = getReplyStatus(email.date);
              
              return (
                <div
                  key={email.id}
                  data-email-id={email.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${email.unread ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
                >
                  <div className="flex items-start">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => setSelectedThread(email)}
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`${email.unread ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                          {email.from}
                        </span>
                        {replyStatus && (
                          <span className={`text-xs px-2 py-1 rounded-full ${replyStatus.bg} ${replyStatus.color} flex items-center gap-1`}>
                            <Clock className="w-3 h-3" />
                            {replyStatus.text}
                          </span>
                        )}
                        {email.labels.map(labelId => {
                          const label = customLabels.find(l => l.id === labelId);
                          return label ? (
                            <span 
                              key={labelId}
                              className="text-xs px-2 py-1 rounded-full text-white"
                              style={{ backgroundColor: label.color }}
                            >
                              {label.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                      <div className={`${email.unread ? 'font-semibold' : ''} text-gray-900 mb-1`}>
                        {email.subject}
                      </div>
                      <div className="text-sm text-gray-600">
                        {email.snippet}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={(e) => pushToCRM(email.id, e)}
                        className="text-gray-400 hover:text-indigo-600 transition-colors p-1 rounded hover:bg-indigo-50"
                        title="Push to CRM"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => openLabelSelector(email.id, e)}
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50"
                        title="Add label"
                      >
                        <Tag className="w-4 h-4" />
                      </button>
                      <div className="text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(email.date)}
                      </div>
                      <button
                        onClick={(e) => deleteEmail(email.id, e)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                        title="Delete email"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sequence Modal */}
      {showSequenceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Start Email Sequence</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Sequence Template
                </label>
                <select
                  value={sequenceForm.selectedTemplateId || ''}
                  onChange={(e) => setSequenceForm({...sequenceForm, selectedTemplateId: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Choose a sequence...</option>
                  {sequenceTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.emails.length} steps)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prospect Name
                </label>
                <input
                  type="text"
                  value={sequenceForm.prospectName}
                  onChange={(e) => setSequenceForm({...sequenceForm, prospectName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter prospect name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Activity Classification
                </label>
                <input
                  type="text"
                  value={sequenceForm.businessActivity}
                  onChange={(e) => setSequenceForm({...sequenceForm, businessActivity: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., SaaS, E-commerce, Consulting"
                />
              </div>
              
              {sequenceForm.selectedTemplateId && sequenceForm.prospectName && sequenceForm.businessActivity && (
                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-sm font-medium">Confirmation:</p>
                  <p className="text-sm">Template: {sequenceTemplates.find(t => t.id === sequenceForm.selectedTemplateId)?.name}</p>
                  <p className="text-sm">Prospect: {sequenceForm.prospectName}</p>
                  <p className="text-sm">Business: {sequenceForm.businessActivity}</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={startSequence}
                disabled={!sequenceForm.prospectName || !sequenceForm.businessActivity || !sequenceForm.selectedTemplateId}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Start Sequence
              </button>
              <button
                onClick={() => setShowSequenceModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Label Modal */}
      {showLabelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Add Custom Label</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label Name
                </label>
                <input
                  type="text"
                  value={newLabel.name}
                  onChange={(e) => setNewLabel({...newLabel, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter label name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label Color
                </label>
                <input
                  type="color"
                  value={newLabel.color}
                  onChange={(e) => setNewLabel({...newLabel, color: e.target.value})}
                  className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
              
              {customLabels.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Existing Labels:</p>
                  <div className="flex flex-wrap gap-2">
                    {customLabels.map(label => (
                      <span 
                        key={label.id}
                        className="text-xs px-2 py-1 rounded-full text-white"
                        style={{ backgroundColor: label.color }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={addLabel}
                disabled={!newLabel.name}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add Label
              </button>
              <button
                onClick={() => setShowLabelModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Label Selector Popup */}
      {labelEmailId && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-40" 
          onClick={() => setLabelEmailId(null)}
        >
          <div 
            className="fixed bg-white rounded-lg shadow-lg p-3 min-w-[200px] z-50"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-sm font-medium text-gray-700 mb-2">Select Label for Email</h4>
            {customLabels.length === 0 ? (
              <p className="text-sm text-gray-500 mb-3">No labels created yet</p>
            ) : (
              <div className="space-y-1 mb-3">
                {customLabels.map(label => {
                  const email = emails.find(e => e.id === labelEmailId);
                  const hasLabel = email?.labels.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      onClick={() => {
                        toggleLabel(labelEmailId, label.id);
                        setLabelEmailId(null);
                      }}
                      className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 flex items-center gap-2"
                    >
                      <span 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="text-sm">{label.name}</span>
                      {hasLabel && <span className="text-xs text-gray-500 ml-auto">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => {
                setLabelEmailId(null);
                setShowLabelModal(true);
              }}
              className="w-full text-sm text-blue-600 hover:text-blue-700 py-1 border-t pt-2"
            >
              + Create New Label
            </button>
          </div>
        </div>
      )}

      {/* CRM Modal */}
      {showCRMModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Add Prospect to CRM</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prospect Name
                </label>
                <input
                  type="text"
                  value={crmForm.prospectName}
                  onChange={(e) => setCrmForm({...crmForm, prospectName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter prospect's full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={crmForm.company}
                  onChange={(e) => setCrmForm({...crmForm, company: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter company name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={crmForm.email}
                  readOnly
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={addProspectToCRM}
                disabled={!crmForm.prospectName || !crmForm.company}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add to CRM
              </button>
              <button
                onClick={() => {
                  setShowCRMModal(false);
                  setCrmForm({ emailId: null, prospectName: '', company: '', email: '' });
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 bg-red-100 rounded-full p-2 mr-3">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Email</h3>
                <p className="text-gray-600 mt-1">
                  Are you sure you want to delete this email?
                </p>
                {deleteConfirm.emailSubject && (
                  <p className="text-sm text-gray-500 mt-2">
                    <span className="font-medium">Subject:</span> {deleteConfirm.emailSubject}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm({ show: false, emailId: null, emailSubject: '' })}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GmailInboxManager;