'use client';
import { useState, useRef, useEffect } from 'react';
import { useUser, SignIn, SignOutButton } from '@clerk/nextjs';

// ============ USERS ============
const mockUsers = [
  { id: 1, email: 'patrick@santi.com', username: 'Patrick', avatar: 'https://ui-avatars.com/api/?name=Patrick&background=059669&color=fff', role: 'manager', isAdmin: true, managerId: null },
  { id: 2, email: 'david@santi.com', username: 'David', avatar: 'https://ui-avatars.com/api/?name=David&background=0ea5e9&color=fff', role: 'manager', isAdmin: false, managerId: 1 },
  { id: 3, email: 'jean@santi.com', username: 'Jean', avatar: 'https://ui-avatars.com/api/?name=Jean&background=8b5cf6&color=fff', role: 'supply/back end manager', isAdmin: false, managerId: 2 },
  { id: 4, email: 'ball@santi.com', username: 'Ball', avatar: 'https://ui-avatars.com/api/?name=Ball&background=f59e0b&color=fff', role: 'supply/back end manager', isAdmin: false, managerId: 1 },
];

const PROCUREMENT_USER_ID = 4;
const TODAY = '2026-01-06';

// ============ INITIAL DATA ============
const initialKanbanTasks = [
  { id: 'k1', title: 'Review site safety protocols', assignedTo: 3, column: 'today', dueDate: '2026-01-06', type: 'manual', createdAt: '2026-01-04' },
  { id: 'k2', title: 'Coordinate with architect', assignedTo: 2, column: 'thisWeek', dueDate: '2026-01-08', type: 'manual', createdAt: '2026-01-03' },
  { id: 'k3', title: 'Order safety gear', assignedTo: 4, column: 'later', dueDate: '2026-01-15', type: 'manual', createdAt: '2026-01-02' },
  { id: 'k4', title: 'Weekly progress report', assignedTo: 1, column: 'thisWeek', dueDate: '2026-01-10', type: 'manual', createdAt: '2026-01-01' },
];

const initialRecurringTasks = [
  { id: 'r1', title: 'Daily safety inspection', assignedTo: 3, frequency: 'daily', days: [], specificDates: [], createdAt: '2026-01-01' },
  { id: 'r2', title: 'Weekly team standup', assignedTo: 1, frequency: 'weekly', days: ['Monday'], specificDates: [], createdAt: '2026-01-01' },
  { id: 'r3', title: 'Monthly inventory check', assignedTo: 4, frequency: 'monthly', days: ['1'], specificDates: [], createdAt: '2026-01-01' },
  { id: 'r4', title: 'Quarterly safety audit', assignedTo: 2, frequency: 'specific', days: [], specificDates: ['2026-03-01', '2026-06-01', '2026-09-01', '2026-12-01'], createdAt: '2026-01-01' },
  { id: 'r5', title: 'Check tool inventory', assignedTo: 3, frequency: 'weekly', days: ['Friday'], specificDates: [], createdAt: '2026-01-01' },
];

const initialComments = {
  1: [{ id: 1, taskId: 1, userId: 4, text: 'Re-bar delivery confirmed', timestamp: '2026-01-04T09:30:00', mentions: [] }, { id: 2, taskId: 1, userId: 1, text: 'Great, crew ready by 7am', timestamp: '2026-01-04T10:15:00', mentions: [] }],
  5: [{ id: 3, taskId: 5, userId: 2, text: 'Need concrete mix specs', timestamp: '2026-01-03T14:00:00', mentions: [] }],
  8: [{ id: 4, taskId: 8, userId: 3, text: 'Waiting on brick supplier', timestamp: '2026-01-02T11:00:00', mentions: [] }, { id: 5, taskId: 8, userId: 4, text: '@Patrick backup supplier contact', timestamp: '2026-01-02T14:30:00', mentions: [1] }],
};

const initialNotifications = [{ id: 1, userId: 1, fromUserId: 4, taskId: 8, text: 'Ball mentioned you in a comment', timestamp: '2026-01-02T14:30:00', read: false }];

const initialBuildingTasks = [
  { id: 1, order: 1, villa: 'Villa 3', mainCategory: '2 Foundation', subCategory: 'Base Foundation (incl columns)', task: 'Re-Bar', step: 'Prefab Re-Bar', notes: '', status: 'Done', expectedArrival: '', earliestStart: '2026-01-01', skilledWorkers: ['zin'], unskilledWorkers: ['Tun Sein Maung'], duration: '' },
  { id: 2, order: 2, villa: 'Villa 3', mainCategory: '2 Foundation', subCategory: 'Base Foundation (incl columns)', task: 'Formwork', step: 'Set up Formwork', notes: '', status: 'In Progress', expectedArrival: '', earliestStart: '', skilledWorkers: ['Joshua'], unskilledWorkers: ['Sone'], duration: '8:00' },
  { id: 3, order: 3, villa: 'Villa 3', mainCategory: '2 Foundation', subCategory: 'Base Foundation (incl columns)', task: 'Formwork', step: 'Set Re-Bar Inside Formwork', notes: '', status: 'Ready to start (Supply Chain confirmed on-site)', expectedArrival: '', earliestStart: '', skilledWorkers: ['zaw'], unskilledWorkers: ['Min Pyea'], duration: '8:00' },
  { id: 4, order: 4, villa: 'Villa 3', mainCategory: '2 Foundation', subCategory: 'Base Foundation (incl columns)', task: 'Formwork', step: 'Brace Formwork', notes: 'Step in-between', status: 'Ready to start (Supply Chain confirmed on-site)', expectedArrival: '', earliestStart: '', skilledWorkers: ['diesel'], unskilledWorkers: ['Thein Win'], duration: '8:00' },
  { id: 5, order: 5, villa: 'Villa 3', mainCategory: '2 Foundation', subCategory: 'Base Foundation (incl columns)', task: 'Concrete', step: 'Concrete Pour', notes: '', status: 'Supply Chain Pending Order', expectedArrival: '', earliestStart: '2026-01-15', skilledWorkers: ['San Shwe'], unskilledWorkers: ['Tun Sein Maung'], duration: '' },
  { id: 6, order: 6, villa: 'Villa 3', mainCategory: '2 Foundation', subCategory: 'Base Foundation (incl columns)', task: 'Concrete', step: 'Concrete Dry', notes: '', status: 'Ready to start (Supply Chain confirmed on-site)', expectedArrival: '', earliestStart: '', skilledWorkers: [], unskilledWorkers: [], duration: '16:00' },
  { id: 7, order: 7, villa: 'Villa 3', mainCategory: '2 Foundation', subCategory: 'Base Foundation (incl columns)', task: 'Formwork', step: 'Formwork removal', notes: '', status: 'Ready to start (Supply Chain confirmed on-site)', expectedArrival: '', earliestStart: '', skilledWorkers: ['zaw'], unskilledWorkers: ['Sone'], duration: '' },
  { id: 8, order: 1, villa: 'Villa 3', mainCategory: '2 Foundation', subCategory: 'Strip Foundation', task: 'Brick Work', step: 'Brick Laying', notes: '', status: 'Supply Chain Pending Order', expectedArrival: '2026-01-06', earliestStart: '2026-01-20', skilledWorkers: ['zaw'], unskilledWorkers: ['Sone'], duration: '' },
  { id: 9, order: 2, villa: 'Villa 3', mainCategory: '2 Foundation', subCategory: 'Strip Foundation', task: 'Concrete', step: 'Concrete Pouring', notes: '', status: 'Supply Chain Pending Order', expectedArrival: '', earliestStart: '2026-01-25', skilledWorkers: ['diesel'], unskilledWorkers: ['Min Pyea'], duration: '' },
  { id: 10, order: 3, villa: 'Villa 3', mainCategory: '2 Foundation', subCategory: 'Strip Foundation', task: 'Concrete', step: 'Strip wall pour', notes: '', status: 'Ready to start (Supply Chain confirmed on-site)', expectedArrival: '', earliestStart: '', skilledWorkers: ['diesel'], unskilledWorkers: ['Min Pyea'], duration: '' },
  { id: 11, order: 1, villa: 'Villa 2', mainCategory: '2 Foundation', subCategory: 'Base Foundation (incl columns)', task: 'Formwork', step: 'Set up Formwork', notes: '', status: 'Done', expectedArrival: '', earliestStart: '2025-12-15', skilledWorkers: ['Joshua'], unskilledWorkers: ['Sone'], duration: '8:00' },
  { id: 12, order: 2, villa: 'Villa 2', mainCategory: '2 Foundation', subCategory: 'Base Foundation (incl columns)', task: 'Concrete', step: 'Concrete Pour', notes: '', status: 'Done', expectedArrival: '', earliestStart: '', skilledWorkers: ['San Shwe'], unskilledWorkers: ['Tun Sein Maung'], duration: '' },
  { id: 13, order: 1, villa: 'Villa 1', mainCategory: '2 Foundation', subCategory: 'Base Foundation (incl columns)', task: 'Concrete', step: 'Concrete Pour', notes: '', status: 'Done', expectedArrival: '', earliestStart: '', skilledWorkers: ['San Shwe'], unskilledWorkers: ['Tun Sein Maung'], duration: '' },
  { id: 14, order: 1, villa: 'Landscaping', mainCategory: 'Landscaping', subCategory: 'Garden', task: 'Preparation', step: 'Clear vegetation', notes: '', status: 'Done', expectedArrival: '', earliestStart: '2025-12-10', skilledWorkers: [], unskilledWorkers: ['Sone', 'Min Pyea'], duration: '24:00' },
  { id: 15, order: 2, villa: 'Landscaping', mainCategory: 'Landscaping', subCategory: 'Garden', task: 'Preparation', step: 'Soil preparation', notes: '', status: 'In Progress', expectedArrival: '', earliestStart: '', skilledWorkers: [], unskilledWorkers: ['Sone'], duration: '16:00' },
];

const initialSCTasks = [
  { id: 'sc1', buildingTaskId: 5, title: 'SC for Concrete Pour - Concrete - Base Foundation - Villa 3', assignedTo: PROCUREMENT_USER_ID, column: 'thisWeek', scStatus: 'research', dueDate: '2026-01-08', deadlineOnSite: '2026-01-08', expectedArrival: '', type: 'sc', createdAt: '2026-01-04' },
  { id: 'sc2', buildingTaskId: 8, title: 'SC for Brick Laying - Brick Work - Strip Foundation - Villa 3', assignedTo: PROCUREMENT_USER_ID, column: 'later', scStatus: 'research', dueDate: '2026-01-13', deadlineOnSite: '2026-01-13', expectedArrival: '', type: 'sc', createdAt: '2026-01-04' },
  { id: 'sc3', buildingTaskId: 9, title: 'SC for Concrete Pouring - Concrete - Strip Foundation - Villa 3', assignedTo: PROCUREMENT_USER_ID, column: 'later', scStatus: 'research', dueDate: '2026-01-18', deadlineOnSite: '2026-01-18', expectedArrival: '', type: 'sc', createdAt: '2026-01-04' },
];

const initialOptions = {
  status: ['Done', 'In Progress', 'Ready to start (Supply Chain confirmed on-site)', 'Supply Chain Pending Order', 'Supply Chain Pending Arrival', 'Blocked', 'On Hold'],
  mainCategory: ['1 Site Prep', '2 Foundation', '3 Structure', '4 Roofing', '5 MEP', '6 Finishes', 'Landscaping', 'Infrastructure'],
  subCategory: { '2 Foundation': ['Base Foundation (incl columns)', 'Strip Foundation', 'Plumbing', 'Main Slab Foundation'], '3 Structure': ['Columns', 'Beams', 'Walls', 'Slabs'], 'Landscaping': ['Garden', 'Trees', 'Irrigation'], 'Infrastructure': ['Pathways', 'Drainage', 'Lighting'] },
  task: { 'Base Foundation (incl columns)': ['Formwork', 'Re-Bar', 'Concrete'], 'Strip Foundation': ['Brick Work', 'Concrete', 'Plinch-Beam', 'Formwork'], 'Plumbing': ['Rough-in', 'Connections', 'Testing'], 'Garden': ['Preparation', 'Planting', 'Mulching'], 'Pathways': ['Groundwork', 'Base Layer', 'Surface'], 'Drainage': ['Main Drains', 'Connections', 'Testing'] },
  skilledWorker: ['zin', 'Joshua', 'zaw', 'diesel', 'San Shwe'],
  unskilledWorker: ['Tun Sein Maung', 'Sone', 'Min Pyea', 'Thein Win']
};

// ============ UTILITIES ============
const getReadiness = (task, categoryTasks, index) => {
  const status = task.status || '';
  if (status === 'Done') return { type: 'done', label: 'Done', color: '#6b7280', bg: '#f3f4f6', icon: '✓' };
  if (status === 'In Progress') return { type: 'in-progress', label: 'In Progress', color: '#7c3aed', bg: '#f3e8ff', icon: '◐' };
  if (status.includes('Supply Chain Pending')) return { type: 'blocked-supply', label: 'Supply Chain', color: '#dc2626', bg: '#fef2f2', icon: '!' };
  if (status === 'On Hold' || status === 'Blocked') return { type: 'on-hold', label: status, color: '#9ca3af', bg: '#f9fafb', icon: '⏸' };
  if (index > 0) {
    const pred = categoryTasks[index - 1];
    const predStatus = pred?.status || '';
    if (predStatus === 'Done') return { type: 'ready', label: 'Ready Now', color: '#16a34a', bg: '#f0fdf4', icon: '●' };
    if (predStatus === 'In Progress') return { type: 'unlocking', label: 'Unlocking Soon', color: '#d97706', bg: '#fffbeb', icon: '◔' };
    if (predStatus.includes('Supply Chain Pending')) return { type: 'blocked-upstream', label: 'Upstream Blocked', color: '#f97316', bg: '#fff7ed', icon: '↑' };
    return { type: 'sequenced', label: '', color: '#9ca3af', bg: 'transparent', icon: '' };
  }
  if (status === 'Ready to start (Supply Chain confirmed on-site)') return { type: 'ready', label: 'Ready Now', color: '#16a34a', bg: '#f0fdf4', icon: '●' };
  return { type: 'sequenced', label: '', color: '#9ca3af', bg: 'transparent', icon: '' };
};

const getStatusStyle = (status) => {
  const styles = { 'Done': { bg: 'rgba(22,163,74,0.1)', color: '#16a34a', dot: '#16a34a' }, 'In Progress': { bg: 'rgba(124,58,237,0.1)', color: '#7c3aed', dot: '#7c3aed' }, 'Ready to start (Supply Chain confirmed on-site)': { bg: 'rgba(5,150,105,0.1)', color: '#059669', dot: '#059669' }, 'Supply Chain Pending Order': { bg: 'rgba(220,38,38,0.1)', color: '#dc2626', dot: '#dc2626' }, 'Supply Chain Pending Arrival': { bg: 'rgba(217,119,6,0.1)', color: '#d97706', dot: '#d97706' }, 'Blocked': { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', dot: '#6b7280' }, 'On Hold': { bg: 'rgba(156,163,175,0.1)', color: '#9ca3af', dot: '#9ca3af' } };
  return styles[status] || { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' };
};

const formatTime = (ts) => { if (!ts) return ''; const d = new Date(ts); const diff = Date.now() - d.getTime(); if (diff < 60000) return 'Just now'; if (diff < 3600000) return Math.floor(diff/60000) + 'm ago'; if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago'; return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date(TODAY);
const calculateDeadlineOnSite = (earliestStart) => { if (!earliestStart) return ''; const d = new Date(earliestStart); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0]; };

// ============ ICONS ============
const Icon = ({ name, size = 20 }) => {
  const icons = {
    leaf: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>,
    calendar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
    package: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    chart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    list: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    kanban: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="8" rx="1"/></svg>,
    repeat: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>,
    message: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>,
    send: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    logout: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    grip: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/><circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/></svg>,
    bell: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    chevronDown: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
    chevronRight: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
    link: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
    menu: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  };
  return icons[name] || null;
};

// ============ COMPONENTS ============
const LoginScreen = () => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', padding: '20px' }}>
    <div style={{ textAlign: 'center', width: '100%', maxWidth: '400px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fff' }}><Icon name="leaf" size={32} /></div>
        <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0, color: '#fff' }}>Santi Management</h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>Sustainable Development</p>
      </div>
      <SignIn routing="hash" />
    </div>
  </div>
);

// ============ COMMENTS PANEL ============
const CommentsPanel = ({ taskId, task, comments, setComments, currentUser, users, onClose, setNotifications }) => {
  const [text, setText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const inputRef = useRef(null);
  const taskComments = comments[taskId] || [];

  const handleSend = () => {
    if (!text.trim()) return;
    const mentionMatches = text.match(/@(\w+)/g) || [];
    const mentionedUsers = mentionMatches.map(m => users.find(u => u.username.toLowerCase().startsWith(m.slice(1).toLowerCase()))).filter(Boolean);
    const newComment = { id: Date.now(), taskId, userId: currentUser.id, text, timestamp: new Date().toISOString(), mentions: mentionedUsers.map(u => u.id) };
    setComments(prev => ({ ...prev, [taskId]: [...(prev[taskId] || []), newComment] }));
    mentionedUsers.forEach(u => { if (u.id !== currentUser.id) setNotifications(prev => [...prev, { id: Date.now() + u.id, userId: u.id, fromUserId: currentUser.id, taskId, text: `${currentUser.username} mentioned you`, timestamp: new Date().toISOString(), read: false }]); });
    setText('');
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    const lastAt = val.lastIndexOf('@');
    if (lastAt !== -1 && (lastAt === val.length - 1 || !val.slice(lastAt + 1).includes(' '))) { setShowMentions(true); setMentionFilter(val.slice(lastAt + 1)); } else { setShowMentions(false); }
  };

  const insertMention = (user) => { const lastAt = text.lastIndexOf('@'); setText(text.slice(0, lastAt) + '@' + user.username + ' '); setShowMentions(false); inputRef.current?.focus(); };
  const filteredUsers = users.filter(u => u.id !== currentUser.id && u.username.toLowerCase().includes(mentionFilter.toLowerCase()));

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '400px', background: '#fff', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', zIndex: 1100, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Comments</h3>{task && <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>{task.step}</p>}</div>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '8px' }}><Icon name="x" size={20} /></button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {taskComments.length === 0 ? <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}><Icon name="message" size={32} /><p>No comments yet</p></div> : taskComments.map(c => {
          const author = users.find(u => u.id === c.userId);
          return <div key={c.id} style={{ marginBottom: '16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}><img src={author?.avatar} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} /><span style={{ fontSize: '13px', fontWeight: '600' }}>{author?.username}</span><span style={{ fontSize: '11px', color: '#9ca3af' }}>{formatTime(c.timestamp)}</span></div><p style={{ margin: '0 0 0 36px', fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>{c.text.split(/(@\w+)/g).map((part, i) => part.startsWith('@') ? <span key={i} style={{ color: '#059669', fontWeight: '500' }}>{part}</span> : part)}</p></div>;
        })}
      </div>
      <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', position: 'relative' }}>
        {showMentions && filteredUsers.length > 0 && <div style={{ position: 'absolute', bottom: '100%', left: '16px', right: '16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' }}>{filteredUsers.map(u => <div key={u.id} onClick={() => insertMention(u)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}><img src={u.avatar} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} /><span style={{ fontSize: '13px', fontWeight: '500' }}>{u.username}</span></div>)}</div>}
        <div style={{ display: 'flex', gap: '8px' }}><input ref={inputRef} value={text} onChange={handleTextChange} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="Type @ to mention..." style={{ flex: 1, padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} /><button type="button" onClick={handleSend} style={{ padding: '10px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><Icon name="send" size={16} /></button></div>
      </div>
    </div>
  );
};

// ============ NOTIFICATIONS PANEL ============
const NotificationsPanel = ({ notifications, setNotifications, users, onClose, onGoToTask }) => (
  <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '360px', background: '#fff', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', zIndex: 1100, display: 'flex', flexDirection: 'column' }}>
    <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Notifications</h3><button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '8px' }}><Icon name="x" size={20} /></button></div>
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {notifications.length === 0 ? <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0' }}><Icon name="bell" size={32} /><p>No notifications</p></div> : notifications.map(n => {
        const from = users.find(u => u.id === n.fromUserId);
        return <div key={n.id} onClick={() => { setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x)); onGoToTask(n.taskId); }} style={{ padding: '16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: n.read ? '#fff' : 'rgba(5,150,105,0.05)' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><img src={from?.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} /><div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: '13px', color: '#374151' }}>{n.text}</p><span style={{ fontSize: '11px', color: '#9ca3af' }}>{formatTime(n.timestamp)}</span></div>{!n.read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />}</div></div>;
      })}
    </div>
  </div>
);

// ============ KANBAN ============
const KanbanColumn = ({ id, title, tasks, onDrop, onDragOver, users, onTaskClick, onDragStart, dragOverColumn, dragOverTaskId, setDragOverTaskId }) => (
  <div onDragOver={(e) => { e.preventDefault(); onDragOver(id); }} onDrop={(e) => { e.preventDefault(); onDrop(id); }} style={{ flex: '0 0 280px', minWidth: '280px', background: dragOverColumn === id ? 'rgba(5,150,105,0.05)' : '#f9fafb', borderRadius: '12px', padding: '12px', border: dragOverColumn === id ? '2px dashed #059669' : '2px solid transparent' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}><h3 style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', margin: 0 }}>{title}</h3><span style={{ fontSize: '12px', color: '#9ca3af', background: '#fff', padding: '2px 8px', borderRadius: '10px' }}>{tasks.length}</span></div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '100px' }}>
      {tasks.map(task => { const assignee = users.find(u => u.id === task.assignedTo); const overdue = isOverdue(task.dueDate); return (
        <div key={task.id} draggable onDragStart={(e) => onDragStart(e, task)} onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverTaskId(task.id); }} onClick={() => onTaskClick(task)} style={{ background: '#fff', borderRadius: '8px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'grab', border: dragOverTaskId === task.id ? '2px solid #059669' : '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#1f2937' }}>{task.title}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {task.type === 'sc' && <span style={{ fontSize: '10px', padding: '2px 6px', background: '#dbeafe', color: '#2563eb', borderRadius: '4px', fontWeight: '600' }}>SC</span>}
              {task.type === 'recurring' && <span style={{ fontSize: '10px', padding: '2px 6px', background: '#f3e8ff', color: '#7c3aed', borderRadius: '4px', fontWeight: '600' }}>↻</span>}
              {task.dueDate && <span style={{ fontSize: '11px', color: overdue ? '#dc2626' : '#6b7280', fontWeight: overdue ? '600' : '400' }}>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
            </div>
            {assignee && <img src={assignee.avatar} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />}
          </div>
        </div>
      ); })}
    </div>
  </div>
);

const TaskModal = ({ task, onClose, onUpdate, onDelete, users, buildingTasks }) => {
  const [form, setForm] = useState({ ...task });
  const isSC = task?.type === 'sc';
  const linkedBT = isSC ? buildingTasks.find(bt => bt.id === task.buildingTaskId) : null;
  const scStatuses = ['research', 'researchApproval', 'pendingArrival', 'readyToStart'];
  const scLabels = { research: 'Research', researchApproval: 'Research Approval', pendingArrival: 'Pending Arrival', readyToStart: 'Ready to Start' };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '500px', background: '#fff', borderRadius: '16px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Edit Task</h2><button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><Icon name="x" /></button></div>
        {isSC && linkedBT && <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}><div style={{ fontSize: '12px', fontWeight: '600', color: '#0369a1', marginBottom: '4px' }}>Linked to Building Sequence</div><div style={{ fontSize: '13px', color: '#0c4a6e' }}>{linkedBT.step} - {linkedBT.task} - {linkedBT.subCategory}</div></div>}
        <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Title</label><input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Due Date</label><input type="date" value={form.dueDate || ''} onChange={e => setForm({ ...form, dueDate: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} /></div>
          <div><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Assigned To</label><select value={form.assignedTo || ''} onChange={e => setForm({ ...form, assignedTo: Number(e.target.value) })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}>{users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}</select></div>
        </div>
        {isSC && <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>SC Status</label><div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{scStatuses.map(s => <button key={s} type="button" onClick={() => setForm({ ...form, scStatus: s })} style={{ padding: '6px 12px', fontSize: '12px', border: form.scStatus === s ? '2px solid #059669' : '1px solid #e5e7eb', borderRadius: '6px', background: form.scStatus === s ? '#ecfdf5' : '#fff', color: form.scStatus === s ? '#059669' : '#6b7280', cursor: 'pointer' }}>{scLabels[s]}</button>)}</div></div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>{task && !isSC ? <button type="button" onClick={() => { onDelete(task.id); onClose(); }} style={{ padding: '10px 20px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Delete</button> : <div />}<div style={{ display: 'flex', gap: '8px' }}><button type="button" onClick={onClose} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button><button type="button" onClick={() => { onUpdate(form); onClose(); }} style={{ padding: '10px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Save</button></div></div>
      </div>
    </div>
  );
};

const RecurringTaskModal = ({ task, onClose, onSave, onDelete, users }) => {
  const [form, setForm] = useState(task || { title: '', assignedTo: 1, frequency: 'daily', days: [], specificDates: [] });
  const toggleDay = (day) => setForm(f => ({ ...f, days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day] }));
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '450px', background: '#fff', borderRadius: '16px', padding: '24px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{task ? 'Edit' : 'New'} Recurring Task</h2><button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><Icon name="x" /></button></div>
        <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} /></div>
        <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Assigned To</label><select value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: Number(e.target.value) })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}>{users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}</select></div>
        <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Frequency</label><div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{['daily', 'weekly', 'monthly', 'specific'].map(f => <button key={f} type="button" onClick={() => setForm({ ...form, frequency: f, days: [], specificDates: [] })} style={{ padding: '8px 16px', fontSize: '13px', border: form.frequency === f ? '2px solid #059669' : '1px solid #e5e7eb', borderRadius: '8px', background: form.frequency === f ? '#ecfdf5' : '#fff', color: form.frequency === f ? '#059669' : '#6b7280', cursor: 'pointer', textTransform: 'capitalize' }}>{f}</button>)}</div></div>
        {form.frequency === 'weekly' && <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Days</label><div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <button key={d} type="button" onClick={() => toggleDay(d)} style={{ padding: '6px 10px', fontSize: '12px', border: form.days.includes(d) ? '2px solid #059669' : '1px solid #e5e7eb', borderRadius: '6px', background: form.days.includes(d) ? '#ecfdf5' : '#fff', color: form.days.includes(d) ? '#059669' : '#6b7280', cursor: 'pointer' }}>{d}</button>)}</div></div>}
        {form.frequency === 'monthly' && <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Day of Month</label><select value={form.days[0] || '1'} onChange={e => setForm({ ...form, days: [e.target.value] })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}>{Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{i + 1}</option>)}</select></div>}
        {form.frequency === 'specific' && <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Dates (comma-separated)</label><input value={form.specificDates.join(', ')} onChange={e => setForm({ ...form, specificDates: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="2026-03-01, 2026-06-01" style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} /></div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>{task ? <button type="button" onClick={() => { onDelete(task.id); onClose(); }} style={{ padding: '10px 20px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Delete</button> : <div />}<div style={{ display: 'flex', gap: '8px' }}><button type="button" onClick={onClose} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button><button type="button" onClick={() => { onSave(form); onClose(); }} style={{ padding: '10px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Save</button></div></div>
      </div>
    </div>
  );
};

// ============ ADD STEP MODAL ============
const AddStepModal = ({ isOpen, onClose, onAdd, subCategory, options, setOptions }) => {
  const [task, setTask] = useState('');
  const [step, setStep] = useState('');
  const [newTask, setNewTask] = useState('');
  const [showNewTask, setShowNewTask] = useState(false);
  if (!isOpen) return null;
  const taskOptions = options.task[subCategory] || [];
  const handleAddNewTask = () => { if (newTask.trim()) { setOptions(prev => ({ ...prev, task: { ...prev.task, [subCategory]: [...(prev.task[subCategory] || []), newTask.trim()] } })); setTask(newTask.trim()); setNewTask(''); setShowNewTask(false); } };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '16px', padding: '24px' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600' }}>Add Step to {subCategory}</h2>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Task</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select value={task} onChange={e => setTask(e.target.value)} style={{ flex: 1, padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}><option value="">Select task...</option>{taskOptions.map(t => <option key={t} value={t}>{t}</option>)}</select>
            <button type="button" onClick={() => setShowNewTask(!showNewTask)} style={{ padding: '10px 14px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#059669' }}>+ New</button>
          </div>
          {showNewTask && <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}><input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="New task name..." style={{ flex: 1, padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} /><button type="button" onClick={handleAddNewTask} style={{ padding: '10px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Add</button></div>}
        </div>
        <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Step Name</label><input value={step} onChange={e => setStep(e.target.value)} placeholder="Enter step name..." style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} /></div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}><button type="button" onClick={onClose} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button><button type="button" onClick={() => { if (task && step) { onAdd({ task, step }); onClose(); setTask(''); setStep(''); } }} style={{ padding: '10px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Add Step</button></div>
      </div>
    </div>
  );
};

// ============ ADD PHASE MODAL ============
const AddPhaseModal = ({ isOpen, onClose, onAdd, villa, options }) => {
  const [mainCat, setMainCat] = useState('');
  const [subCat, setSubCat] = useState('');
  if (!isOpen) return null;
  const subCatOptions = options.subCategory[mainCat] || [];
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '16px', padding: '24px' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600' }}>Add Phase to {villa}</h2>
        <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Main Category</label><select value={mainCat} onChange={e => { setMainCat(e.target.value); setSubCat(''); }} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}><option value="">Select...</option>{options.mainCategory.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
        <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Sub-Category (Phase)</label><select value={subCat} onChange={e => setSubCat(e.target.value)} disabled={!mainCat} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}><option value="">Select...</option>{subCatOptions.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}><button type="button" onClick={onClose} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button><button type="button" onClick={() => { if (mainCat && subCat) { onAdd({ mainCat, subCat }); onClose(); setMainCat(''); setSubCat(''); } }} style={{ padding: '10px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Add Phase</button></div>
      </div>
    </div>
  );
};

// ============ BUILDING SEQUENCE COMPONENTS ============
const Dropdown = ({ value, options, onChange, placeholder }) => { const [open, setOpen] = useState(false); const ref = useRef(null); useEffect(() => { const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []); return (<div ref={ref} style={{ position: 'relative' }}><button type="button" onClick={() => setOpen(!open)} style={{ width: '100%', padding: '6px 10px', fontSize: '13px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', textAlign: 'left', cursor: 'pointer', color: value ? '#1f2937' : '#9ca3af' }}>{value || placeholder}</button>{open && <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '180px', overflowY: 'auto' }}>{options.map((o,i) => <div key={i} onClick={() => { onChange(o); setOpen(false); }} style={{ padding: '8px 12px', cursor: 'pointer', background: o === value ? '#f3f4f6' : 'transparent' }}>{o}</div>)}</div>}</div>); };

const StatusDropdown = ({ value, options, onChange }) => { const [open, setOpen] = useState(false); const ref = useRef(null); const style = getStatusStyle(value); useEffect(() => { const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []); const short = s => s === 'Ready to start (Supply Chain confirmed on-site)' ? 'Ready' : (s || 'Set status').replace('Supply Chain Pending', 'SC'); return (<div ref={ref} style={{ position: 'relative' }}><button type="button" onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', fontSize: '12px', fontWeight: '500', background: style.bg, border: 'none', borderRadius: '6px', color: style.color, cursor: 'pointer', whiteSpace: 'nowrap' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: style.dot }} />{short(value)}</button>{open && <div style={{ position: 'absolute', top: '100%', left: 0, minWidth: '220px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 100 }}>{options.map((o,i) => { const s = getStatusStyle(o); return <div key={i} onClick={() => { onChange(o); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', cursor: 'pointer' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.dot }} />{o}</div>; })}</div>}</div>); };

const EditableCell = ({ value, onChange, placeholder }) => { const [editing, setEditing] = useState(false); const [temp, setTemp] = useState(value); const ref = useRef(null); useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]); if (editing) return <input ref={ref} value={temp} onChange={e => setTemp(e.target.value)} onBlur={() => { setEditing(false); onChange(temp); }} onKeyDown={e => e.key === 'Enter' && (setEditing(false), onChange(temp))} style={{ width: '100%', padding: '6px', fontSize: '13px', border: '1px solid #059669', borderRadius: '6px', boxSizing: 'border-box' }} />; return <div onClick={() => { setTemp(value); setEditing(true); }} style={{ padding: '6px', fontSize: '13px', color: value ? '#1f2937' : '#9ca3af', cursor: 'text', minHeight: '28px' }}>{value || placeholder}</div>; };

const MultiSelect = ({ values = [], options, onChange, placeholder }) => { const [open, setOpen] = useState(false); const ref = useRef(null); useEffect(() => { const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []); const toggle = (opt) => onChange(values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt]); return (<div ref={ref} style={{ position: 'relative' }}><button type="button" onClick={() => setOpen(!open)} style={{ width: '100%', padding: '6px 10px', fontSize: '12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', color: values.length ? '#1f2937' : '#9ca3af', minHeight: '32px' }}>{values.length ? values.join(', ') : placeholder}</button>{open && <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '200px', overflowY: 'auto' }}><div onClick={() => onChange([])} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #e5e7eb', color: '#dc2626', fontSize: '12px' }}>Clear all</div>{options.map((o, i) => <div key={i} onClick={() => toggle(o)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', cursor: 'pointer', background: values.includes(o) ? '#ecfdf5' : 'transparent' }}><span style={{ width: '16px', height: '16px', border: values.includes(o) ? '2px solid #059669' : '1px solid #d1d5db', borderRadius: '4px', background: values.includes(o) ? '#059669' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px' }}>{values.includes(o) && '✓'}</span>{o}</div>)}</div>}</div>); };

// ============ MAIN APP ============
export default function Home() {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const [users] = useState(mockUsers);
  const [buildingTasks, setBuildingTasks] = useState(initialBuildingTasks);
  const [kanbanTasks, setKanbanTasks] = useState([...initialKanbanTasks, ...initialSCTasks]);
  const [recurringTasks, setRecurringTasks] = useState(initialRecurringTasks);
  const [comments, setComments] = useState(initialComments);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [options, setOptions] = useState(initialOptions);
  const [activeNav, setActiveNav] = useState('taskBoard');
  const [expandedNav, setExpandedNav] = useState(['sequence']);
  const [selectedTaskUser, setSelectedTaskUser] = useState(null);
  const [recurringFilter, setRecurringFilter] = useState('all');
  const [taskModal, setTaskModal] = useState(null);
  const [recurringModal, setRecurringModal] = useState(null);
  const [addStepModal, setAddStepModal] = useState(null);
  const [addPhaseModal, setAddPhaseModal] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragOverTaskId, setDragOverTaskId] = useState(null);
  const [search, setSearch] = useState('');
  const [activeComments, setActiveComments] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [draggedRow, setDraggedRow] = useState(null);
  const [dragOverRow, setDragOverRow] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentUser = clerkUser ? users.find(u => u.email === clerkUser.primaryEmailAddress?.emailAddress) || { id: 999, email: clerkUser.primaryEmailAddress?.emailAddress || 'unknown', username: clerkUser.firstName || 'User', avatar: clerkUser.imageUrl || 'https://ui-avatars.com/api/?name=User&background=059669&color=fff', role: 'worker', isAdmin: false, managerId: 1 } : null;

  // Close sidebar on mobile by default
  useEffect(() => { if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); }, []);

  if (!isLoaded) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)' }}><div style={{ color: '#fff', fontSize: '18px' }}>Loading...</div></div>;
  if (!isSignedIn) return <LoginScreen />;

  const isManager = currentUser.role === 'manager';
  const handleBuildingStatusChange = (taskId, newStatus, oldStatus) => { setBuildingTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t)); if (newStatus === 'Supply Chain Pending Order' && oldStatus !== 'Supply Chain Pending Order') { const task = buildingTasks.find(t => t.id === taskId); if (task && !kanbanTasks.find(kt => kt.type === 'sc' && kt.buildingTaskId === taskId)) { setKanbanTasks(prev => [...prev, { id: 'sc' + Date.now(), buildingTaskId: taskId, title: `SC for ${task.step} - ${task.task} - ${task.subCategory} - ${task.villa}`, assignedTo: PROCUREMENT_USER_ID, column: 'thisWeek', scStatus: 'research', dueDate: calculateDeadlineOnSite(task.earliestStart), deadlineOnSite: calculateDeadlineOnSite(task.earliestStart), expectedArrival: '', type: 'sc', createdAt: TODAY }]); } } };

  const getVisibleTasks = () => { let tasks = kanbanTasks; if (isManager && selectedTaskUser === null) { } else if (selectedTaskUser === 'all') { } else if (selectedTaskUser) { tasks = tasks.filter(t => t.assignedTo === selectedTaskUser); } else { tasks = tasks.filter(t => t.assignedTo === currentUser.id); } return tasks; };
  const visibleTasks = getVisibleTasks();
  const columns = [{ id: 'today', title: 'Today' }, { id: 'thisWeek', title: 'This Week' }, { id: 'waiting', title: 'Waiting' }, { id: 'review', title: 'Review' }, { id: 'later', title: 'Later' }, { id: 'done', title: 'Done' }];

  const handleDrop = (columnId) => { if (draggedTask) { setKanbanTasks(prev => prev.map(t => t.id === draggedTask.id ? { ...t, column: columnId } : t)); setDraggedTask(null); setDragOverColumn(null); setDragOverTaskId(null); } };
  const handleTaskUpdate = (updated) => { setKanbanTasks(prev => prev.map(t => t.id === updated.id ? updated : t)); if (updated.type === 'sc' && updated.buildingTaskId) { if (updated.scStatus === 'pendingArrival') setBuildingTasks(prev => prev.map(t => t.id === updated.buildingTaskId ? { ...t, status: 'Supply Chain Pending Arrival', expectedArrival: updated.expectedArrival } : t)); if (updated.scStatus === 'readyToStart' || updated.column === 'done') setBuildingTasks(prev => prev.map(t => t.id === updated.buildingTaskId ? { ...t, status: 'Ready to start (Supply Chain confirmed on-site)' } : t)); } };
  const handleTaskDelete = (id) => setKanbanTasks(prev => prev.filter(t => t.id !== id));
  const handleAddTask = () => { const newTask = { id: 'k' + Date.now(), title: 'New Task', assignedTo: currentUser.id, column: 'today', dueDate: TODAY, type: 'manual', createdAt: TODAY }; setKanbanTasks(prev => [...prev, newTask]); setTaskModal(newTask); };
  const handleRecurringSave = (task) => { if (task.id) { setRecurringTasks(prev => prev.map(t => t.id === task.id ? task : t)); } else { setRecurringTasks(prev => [...prev, { ...task, id: 'r' + Date.now(), createdAt: TODAY }]); } };
  const handleRecurringDelete = (id) => setRecurringTasks(prev => prev.filter(t => t.id !== id));

  const handleRowDragStart = (e, task, subCat) => { setDraggedRow({ ...task, subCategory: subCat }); e.dataTransfer.effectAllowed = 'move'; };
  const handleRowDragOver = (e, task) => { e.preventDefault(); if (draggedRow && task.id !== draggedRow.id) setDragOverRow(task.id); };
  const handleRowDrop = (e, targetTask, catTasks) => { e.preventDefault(); if (!draggedRow || draggedRow.subCategory !== targetTask.subCategory) { setDraggedRow(null); setDragOverRow(null); return; } const fromIndex = catTasks.findIndex(t => t.id === draggedRow.id); const toIndex = catTasks.findIndex(t => t.id === targetTask.id); if (fromIndex !== -1 && toIndex !== -1) { const newOrder = [...catTasks]; const [moved] = newOrder.splice(fromIndex, 1); newOrder.splice(toIndex, 0, moved); setBuildingTasks(prev => { const updated = [...prev]; newOrder.forEach((t, i) => { const idx = updated.findIndex(x => x.id === t.id); if (idx !== -1) updated[idx] = { ...updated[idx], order: i + 1 }; }); return updated; }); } setDraggedRow(null); setDragOverRow(null); };
  const handleDeleteBuildingTask = (id) => setBuildingTasks(prev => prev.filter(t => t.id !== id));
  const handleAddStep = (subCat, data) => { const maxOrder = Math.max(0, ...buildingTasks.filter(t => t.subCategory === subCat).map(t => t.order)); setBuildingTasks(prev => [...prev, { id: Date.now(), order: maxOrder + 1, villa: currentVilla, mainCategory: '2 Foundation', subCategory: subCat, task: data.task, step: data.step, notes: '', status: 'Ready to start (Supply Chain confirmed on-site)', expectedArrival: '', earliestStart: '', skilledWorkers: [], unskilledWorkers: [], duration: '' }]); };
  const handleAddPhase = (data) => { setBuildingTasks(prev => [...prev, { id: Date.now(), order: 1, villa: currentVilla, mainCategory: data.mainCat, subCategory: data.subCat, task: '', step: 'New step', notes: '', status: 'Ready to start (Supply Chain confirmed on-site)', expectedArrival: '', earliestStart: '', skilledWorkers: [], unskilledWorkers: [], duration: '' }]); };

  const navItems = [{ id: 'taskBoard', label: 'Task Board', icon: 'kanban' }, { id: 'recurring', label: 'Recurring Tasks', icon: 'repeat' }, { id: 'sequence', label: 'Building Sequence', icon: 'list', subItems: [{ id: 'sequence-villa3', label: 'Villa 3' }, { id: 'sequence-villa2', label: 'Villa 2' }, { id: 'sequence-villa1', label: 'Villa 1' }, { id: 'sequence-landscaping', label: 'Landscaping' }] }, { id: 'schedule', label: 'Schedule', icon: 'calendar' }, { id: 'workers', label: 'Workforce', icon: 'users' }, { id: 'materials', label: 'Materials', icon: 'package' }, { id: 'reports', label: 'Reports', icon: 'chart' }];

  const currentVilla = activeNav === 'sequence-villa3' ? 'Villa 3' : activeNav === 'sequence-villa2' ? 'Villa 2' : activeNav === 'sequence-villa1' ? 'Villa 1' : activeNav === 'sequence-landscaping' ? 'Landscaping' : null;
  const filteredBuildingTasks = currentVilla ? buildingTasks.filter(t => t.villa === currentVilla).filter(t => !search || t.step.toLowerCase().includes(search.toLowerCase()) || t.task.toLowerCase().includes(search.toLowerCase())) : [];
  const grouped = filteredBuildingTasks.reduce((acc, t) => { (acc[t.subCategory] = acc[t.subCategory] || []).push(t); return acc; }, {});
  Object.keys(grouped).forEach(k => grouped[k].sort((a, b) => a.order - b.order));

  const unreadCount = notifications.filter(n => n.userId === currentUser.id && !n.read).length;
  const activeTask = activeComments ? buildingTasks.find(t => t.id === activeComments) : null;
  const filteredRecurring = recurringFilter === 'all' ? recurringTasks : recurringTasks.filter(rt => rt.assignedTo === Number(recurringFilter));

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', background: '#f3f4f6' }}>
      {/* Mobile Header */}
      <div style={{ display: sidebarOpen ? 'none' : 'flex', position: 'fixed', top: 0, left: 0, right: 0, height: '60px', background: '#fff', borderBottom: '1px solid #e5e7eb', alignItems: 'center', padding: '0 16px', zIndex: 900, gap: '12px' }}>
        <button type="button" onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}><Icon name="menu" size={24} /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #065f46, #10b981)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Icon name="leaf" size={16} /></div><span style={{ fontWeight: '600', fontSize: '15px' }}>Santi</span></div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ display: 'none', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 999, '@media (max-width: 768px)': { display: 'block' } }} />}

      {/* Sidebar */}
      <aside style={{ width: '260px', minWidth: '260px', background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: sidebarOpen ? 0 : '-260px', bottom: 0, zIndex: 1000, transition: 'left 0.3s ease' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #065f46, #10b981)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Icon name="leaf" size={20} /></div><div><div style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937' }}>Santi</div><div style={{ fontSize: '11px', color: '#6b7280' }}>Sustainable Dev</div></div></div>
          <button type="button" onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}><Icon name="x" size={20} /></button>
        </div>
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#f9fafb', borderRadius: '10px' }}><img src={currentUser.avatar} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%' }} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: '13px', fontWeight: '600' }}>{currentUser.username}</div><div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'capitalize' }}>{currentUser.role}</div></div><button type="button" onClick={() => setShowNotifications(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', position: 'relative', padding: '4px' }}><Icon name="bell" size={18} />{unreadCount > 0 && <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '16px', height: '16px', background: '#dc2626', color: '#fff', borderRadius: '50%', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' }}>{unreadCount}</span>}</button><SignOutButton><button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><Icon name="logout" size={18} /></button></SignOutButton></div></div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>{navItems.map(item => (<div key={item.id}><button type="button" onClick={() => { if (item.subItems) { setExpandedNav(p => p.includes(item.id) ? p.filter(x => x !== item.id) : [...p, item.id]); } else { setActiveNav(item.id); if (window.innerWidth < 768) setSidebarOpen(false); } }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: activeNav === item.id ? '#ecfdf5' : 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: activeNav === item.id ? '#059669' : '#4b5563', marginBottom: '4px' }}><Icon name={item.icon} size={18} /><span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: '500' }}>{item.label}</span>{item.subItems && <Icon name={expandedNav.includes(item.id) ? 'chevronDown' : 'chevronRight'} size={16} />}</button>{item.subItems && expandedNav.includes(item.id) && <div style={{ marginLeft: '28px', marginBottom: '8px' }}>{item.subItems.map(sub => <button key={sub.id} type="button" onClick={() => { setActiveNav(sub.id); if (window.innerWidth < 768) setSidebarOpen(false); }} style={{ width: '100%', padding: '8px 12px', background: activeNav === sub.id ? '#ecfdf5' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', color: activeNav === sub.id ? '#059669' : '#6b7280', fontSize: '13px', textAlign: 'left', marginBottom: '2px' }}>{sub.label}</button>)}</div>}</div>))}</div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px', marginLeft: sidebarOpen ? '260px' : '0', paddingTop: sidebarOpen ? '24px' : '84px', transition: 'margin-left 0.3s ease' }}>
        {/* Task Board */}
        {activeNav === 'taskBoard' && (<><div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}><div><h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Task Board</h1><p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{isManager && !selectedTaskUser ? 'All Tasks' : 'My Tasks'}</p></div><select value={selectedTaskUser || (isManager ? 'all' : '')} onChange={e => setSelectedTaskUser(e.target.value === 'all' ? 'all' : e.target.value ? Number(e.target.value) : null)} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', background: '#fff' }}><option value="">My Tasks</option>{isManager && <option value="all">All Tasks</option>}{users.filter(u => u.id !== currentUser.id).map(u => <option key={u.id} value={u.id}>{u.username}</option>)}</select></div><button type="button" onClick={handleAddTask} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}><Icon name="plus" size={18} /> Add Task</button></div><div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>{columns.map(col => <KanbanColumn key={col.id} id={col.id} title={col.title} tasks={visibleTasks.filter(t => t.column === col.id)} onDrop={handleDrop} onDragOver={setDragOverColumn} users={users} onTaskClick={setTaskModal} onDragStart={(e, task) => setDraggedTask(task)} dragOverColumn={dragOverColumn} dragOverTaskId={dragOverTaskId} setDragOverTaskId={setDragOverTaskId} />)}</div></>)}

        {/* Recurring Tasks */}
        {activeNav === 'recurring' && (<><div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}><div><h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Recurring Tasks</h1><p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{filteredRecurring.length} tasks</p></div><select value={recurringFilter} onChange={e => setRecurringFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', background: '#fff' }}><option value="all">All People</option>{users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}</select></div><button type="button" onClick={() => setRecurringModal({})} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}><Icon name="plus" size={18} /> Add</button></div>
          {['daily', 'weekly', 'monthly', 'specific'].map(freq => { const freqTasks = filteredRecurring.filter(rt => rt.frequency === freq); if (freqTasks.length === 0) return null; return (<div key={freq} style={{ marginBottom: '24px' }}><h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '12px', textTransform: 'capitalize' }}>{freq}</h3><div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>{freqTasks.map(rt => { const assignee = users.find(u => u.id === rt.assignedTo); return (<div key={rt.id} onClick={() => setRecurringModal(rt)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}><img src={assignee?.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} /><div style={{ flex: 1 }}><div style={{ fontSize: '14px', fontWeight: '500' }}>{rt.title}</div><div style={{ fontSize: '12px', color: '#6b7280' }}>{freq === 'weekly' && rt.days.join(', ')}{freq === 'monthly' && `Day ${rt.days[0]}`}{freq === 'specific' && rt.specificDates.slice(0, 2).join(', ')}{freq === 'daily' && 'Every day'}</div></div><span style={{ fontSize: '12px', color: '#9ca3af' }}>{assignee?.username}</span></div>); })}</div></div>); })}
        </>)}

        {/* Building Sequence */}
        {activeNav.startsWith('sequence-') && (<><div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}><div><h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>{currentVilla}</h1><p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{filteredBuildingTasks.length} steps</p></div><div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '160px', padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '10px' }} /><button type="button" onClick={() => setAddPhaseModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}><Icon name="plus" size={16} /> Add Phase</button></div></div>
          {Object.entries(grouped).map(([subCat, catTasks]) => (<div key={subCat} style={{ marginBottom: '32px', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}><div style={{ padding: '16px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>{subCat}</h3><span style={{ fontSize: '12px', color: '#6b7280' }}>{catTasks.length} steps</span></div><button type="button" onClick={() => setAddStepModal(subCat)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#ecfdf5', color: '#059669', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}><Icon name="plus" size={14} /> Add Step</button></div><div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1400px' }}><thead><tr style={{ background: '#fafafa' }}>{['', 'Readiness', 'Status', 'Task', 'Step', 'Notes', 'Earliest Start', 'Expected Arrival', 'Est. Duration', 'Skilled', 'Unskilled', 'Comments', ''].map((h, i) => <th key={i} style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '600', color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>{h}</th>)}</tr></thead><tbody>{catTasks.map((t, i) => { const r = getReadiness(t, catTasks, i); const hasSCTask = kanbanTasks.some(kt => kt.type === 'sc' && kt.buildingTaskId === t.id); const commentCount = (comments[t.id] || []).length; const isDragOver = dragOverRow === t.id; return (<tr key={t.id} draggable onDragStart={(e) => handleRowDragStart(e, t, subCat)} onDragOver={(e) => handleRowDragOver(e, t)} onDrop={(e) => handleRowDrop(e, t, catTasks)} onDragEnd={() => { setDraggedRow(null); setDragOverRow(null); }} style={{ borderBottom: '1px solid #f3f4f6', background: isDragOver ? 'rgba(5,150,105,0.1)' : r.type === 'ready' ? 'rgba(22,163,74,0.04)' : 'transparent', cursor: 'grab', opacity: draggedRow?.id === t.id ? 0.5 : 1 }}><td style={{ padding: '8px 4px', width: '30px' }}><div style={{ color: '#d1d5db', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="grip" size={16} /></div></td><td style={{ padding: '8px' }}>{r.type !== 'sequenced' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: '600', background: r.bg, color: r.color, borderRadius: '4px', whiteSpace: 'nowrap' }}>{r.icon} {r.label}</span>}</td><td style={{ padding: '8px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><StatusDropdown value={t.status} options={options.status} onChange={v => handleBuildingStatusChange(t.id, v, t.status)} />{hasSCTask && <span title="Has SC Task" style={{ color: '#2563eb' }}><Icon name="link" size={14} /></span>}</div></td><td style={{ padding: '8px' }}><Dropdown value={t.task} options={options.task[subCat] || []} onChange={v => setBuildingTasks(p => p.map(x => x.id === t.id ? { ...x, task: v } : x))} placeholder="Task" /></td><td style={{ padding: '8px' }}><EditableCell value={t.step} onChange={v => setBuildingTasks(p => p.map(x => x.id === t.id ? { ...x, step: v } : x))} placeholder="Step" /></td><td style={{ padding: '8px' }}><EditableCell value={t.notes} onChange={v => setBuildingTasks(p => p.map(x => x.id === t.id ? { ...x, notes: v } : x))} placeholder="Notes" /></td><td style={{ padding: '8px' }}><input type="date" value={t.earliestStart || ''} onChange={e => setBuildingTasks(p => p.map(x => x.id === t.id ? { ...x, earliestStart: e.target.value } : x))} style={{ padding: '6px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }} /></td><td style={{ padding: '8px' }}><input type="date" value={t.expectedArrival || ''} onChange={e => setBuildingTasks(p => p.map(x => x.id === t.id ? { ...x, expectedArrival: e.target.value } : x))} style={{ padding: '6px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }} /></td><td style={{ padding: '8px' }}><EditableCell value={t.duration} onChange={v => setBuildingTasks(p => p.map(x => x.id === t.id ? { ...x, duration: v } : x))} placeholder="0:00" /></td><td style={{ padding: '8px' }}><MultiSelect values={t.skilledWorkers} options={options.skilledWorker} onChange={v => setBuildingTasks(p => p.map(x => x.id === t.id ? { ...x, skilledWorkers: v } : x))} placeholder="Select..." /></td><td style={{ padding: '8px' }}><MultiSelect values={t.unskilledWorkers} options={options.unskilledWorker} onChange={v => setBuildingTasks(p => p.map(x => x.id === t.id ? { ...x, unskilledWorkers: v } : x))} placeholder="Select..." /></td><td style={{ padding: '8px' }}><button type="button" onClick={() => setActiveComments(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '12px', background: commentCount > 0 ? '#ecfdf5' : '#f3f4f6', border: 'none', borderRadius: '6px', color: commentCount > 0 ? '#059669' : '#6b7280', cursor: 'pointer' }}><Icon name="message" size={14} />{commentCount > 0 && commentCount}</button></td><td style={{ padding: '8px' }}><button type="button" onClick={() => handleDeleteBuildingTask(t.id)} style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', padding: '6px' }}><Icon name="trash" size={16} /></button></td></tr>); })}</tbody></table></div></div>))}
        </>)}

        {/* Placeholder pages */}
        {['schedule', 'workers', 'materials', 'reports'].includes(activeNav) && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#9ca3af' }}><h2 style={{ fontSize: '24px', fontWeight: '600', color: '#6b7280' }}>{navItems.find(n => n.id === activeNav)?.label}</h2><p>Coming soon</p></div>}
      </main>

      {/* Modals & Panels */}
      {taskModal && <TaskModal task={taskModal} onClose={() => setTaskModal(null)} onUpdate={handleTaskUpdate} onDelete={handleTaskDelete} users={users} buildingTasks={buildingTasks} />}
      {recurringModal && <RecurringTaskModal task={recurringModal.id ? recurringModal : null} onClose={() => setRecurringModal(null)} onSave={handleRecurringSave} onDelete={handleRecurringDelete} users={users} />}
      {addStepModal && <AddStepModal isOpen={!!addStepModal} onClose={() => setAddStepModal(null)} onAdd={(data) => handleAddStep(addStepModal, data)} subCategory={addStepModal} options={options} setOptions={setOptions} />}
      {addPhaseModal && <AddPhaseModal isOpen={addPhaseModal} onClose={() => setAddPhaseModal(false)} onAdd={handleAddPhase} villa={currentVilla} options={options} />}
      {activeComments && <CommentsPanel taskId={activeComments} task={activeTask} comments={comments} setComments={setComments} currentUser={currentUser} users={users} onClose={() => setActiveComments(null)} setNotifications={setNotifications} />}
      {showNotifications && <NotificationsPanel notifications={notifications.filter(n => n.userId === currentUser.id)} setNotifications={setNotifications} users={users} onClose={() => setShowNotifications(false)} onGoToTask={(id) => { setActiveComments(id); setShowNotifications(false); }} />}
    </div>
  );
}
