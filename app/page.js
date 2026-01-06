'use client';
import { useState, useRef, useEffect } from 'react';
import { useUser, SignIn, SignOutButton } from '@clerk/nextjs';

// ============ USERS ============
const mockUsers = [
  { id: 1, email: 'patrick@santi.com', password: 'demo123', username: 'Patrick', avatar: 'https://ui-avatars.com/api/?name=Patrick&background=059669&color=fff', role: 'manager', isAdmin: true, managerId: null },
  { id: 2, email: 'david@santi.com', password: 'demo123', username: 'David', avatar: 'https://ui-avatars.com/api/?name=David&background=0ea5e9&color=fff', role: 'manager', isAdmin: false, managerId: 1 },
  { id: 3, email: 'jean@santi.com', password: 'demo123', username: 'Jean', avatar: 'https://ui-avatars.com/api/?name=Jean&background=8b5cf6&color=fff', role: 'worker', isAdmin: false, managerId: 2 },
  { id: 4, email: 'ball@santi.com', password: 'demo123', username: 'Ball', avatar: 'https://ui-avatars.com/api/?name=Ball&background=f59e0b&color=fff', role: 'procurement', isAdmin: false, managerId: 1 },
];

const PROCUREMENT_USER_ID = 4; // Ball
const MANAGER_USER_ID = 1; // Patrick (Admin)

// ============ INITIAL DATA ============
const initialKanbanTasks = [
  { id: 'k1', title: 'Review site safety protocols', assignedTo: 3, column: 'today', dueDate: '2026-01-05', type: 'manual', createdAt: '2026-01-04' },
  { id: 'k2', title: 'Coordinate with architect on changes', assignedTo: 2, column: 'thisWeek', dueDate: '2026-01-08', type: 'manual', createdAt: '2026-01-03' },
  { id: 'k3', title: 'Order additional safety gear', assignedTo: 4, column: 'later', dueDate: '2026-01-15', type: 'manual', createdAt: '2026-01-02' },
  { id: 'k4', title: 'Weekly progress report', assignedTo: 1, column: 'thisWeek', dueDate: '2026-01-10', type: 'manual', createdAt: '2026-01-01' },
];

const initialRecurringTasks = [
  { id: 'r1', title: 'Daily safety inspection', assignedTo: 3, frequency: 'daily', days: [], specificDates: [], createdAt: '2026-01-01' },
  { id: 'r2', title: 'Weekly team standup', assignedTo: 1, frequency: 'weekly', days: ['Monday'], specificDates: [], createdAt: '2026-01-01' },
  { id: 'r3', title: 'Monthly inventory check', assignedTo: 4, frequency: 'monthly', days: ['1'], specificDates: [], createdAt: '2026-01-01' },
  { id: 'r4', title: 'Quarterly safety audit', assignedTo: 2, frequency: 'specific', days: [], specificDates: ['2026-03-01', '2026-06-01', '2026-09-01', '2026-12-01'], createdAt: '2026-01-01' },
];

const initialComments = {
  1: [{ id: 1, taskId: 1, userId: 4, text: 'Re-bar delivery confirmed', timestamp: '2026-01-04T09:30:00', mentions: [] }],
};

const initialNotifications = [];

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
];

// SC Tasks linked to building sequence
const initialSCTasks = [
  { id: 'sc1', buildingTaskId: 5, title: 'SC for Concrete Pour - Concrete - Base Foundation (incl columns) - Villa 3', assignedTo: PROCUREMENT_USER_ID, column: 'thisWeek', scStatus: 'research', dueDate: '2026-01-08', deadlineOnSite: '2026-01-08', expectedArrival: '', type: 'sc', createdAt: '2026-01-04' },
  { id: 'sc2', buildingTaskId: 8, title: 'SC for Brick Laying - Brick Work - Strip Foundation - Villa 3', assignedTo: PROCUREMENT_USER_ID, column: 'later', scStatus: 'research', dueDate: '2026-01-13', deadlineOnSite: '2026-01-13', expectedArrival: '', type: 'sc', createdAt: '2026-01-04' },
  { id: 'sc3', buildingTaskId: 9, title: 'SC for Concrete Pouring - Concrete - Strip Foundation - Villa 3', assignedTo: PROCUREMENT_USER_ID, column: 'later', scStatus: 'research', dueDate: '2026-01-18', deadlineOnSite: '2026-01-18', expectedArrival: '', type: 'sc', createdAt: '2026-01-04' },
];

const initialOptions = {
  status: ['Done', 'In Progress', 'Ready to start (Supply Chain confirmed on-site)', 'Supply Chain Pending Order', 'Supply Chain Pending Arrival', 'Blocked', 'On Hold'],
  mainCategory: ['1 Site Prep', '2 Foundation', '3 Structure', '4 Roofing', '5 MEP', '6 Finishes', 'Landscaping', 'Infrastructure'],
  subCategory: {
    '2 Foundation': ['Base Foundation (incl columns)', 'Strip Foundation', 'Plumbing', 'Main Slab Foundation'],
    '3 Structure': ['Columns', 'Beams', 'Walls', 'Slabs'],
    'Landscaping': ['Garden', 'Trees', 'Irrigation'],
    'Infrastructure': ['Pathways', 'Drainage', 'Lighting', 'Fencing'],
  },
  task: {
    'Base Foundation (incl columns)': ['Formwork', 'Re-Bar', 'Concrete'],
    'Strip Foundation': ['Brick Work', 'Concrete', 'Plinch-Beam', 'Formwork'],
    'Plumbing': ['Rough-in', 'Connections', 'Testing'],
    'Garden': ['Preparation', 'Planting', 'Mulching'],
  },
  skilledWorker: ['zin', 'Joshua', 'zaw', 'diesel', 'San Shwe'],
  unskilledWorker: ['Tun Sein Maung', 'Sone', 'Min Pyea', 'Thein Win']
};

// ============ UTILITIES ============
const TODAY = '2026-01-05';

const getReadiness = (task, categoryTasks, index) => {
  const status = task.status || '';
  if (status === 'Done') return { type: 'done', label: 'Done', color: '#6b7280', bg: '#f3f4f6', icon: '✓' };
  if (status === 'In Progress') return { type: 'in-progress', label: 'In Progress', color: '#7c3aed', bg: '#f3e8ff', icon: '◐' };
  if (status.includes('Supply Chain Pending')) return { type: 'blocked-supply', label: 'Supply Chain', color: '#dc2626', bg: '#fef2f2', icon: '!' };
  if (status === 'On Hold' || status === 'Blocked') return { type: 'on-hold', label: status, color: '#9ca3af', bg: '#f9fafb', icon: '⏸' };
  if (index > 0) {
    const pred = categoryTasks[index - 1];
    if (pred?.status === 'Done') return { type: 'ready', label: 'Ready Now', color: '#16a34a', bg: '#f0fdf4', icon: '●' };
    if (pred?.status === 'In Progress') return { type: 'unlocking', label: 'Unlocking Soon', color: '#d97706', bg: '#fffbeb', icon: '◔' };
    return { type: 'sequenced', label: '', color: '#9ca3af', bg: 'transparent', icon: '' };
  }
  if (status === 'Ready to start (Supply Chain confirmed on-site)') return { type: 'ready', label: 'Ready Now', color: '#16a34a', bg: '#f0fdf4', icon: '●' };
  return { type: 'sequenced', label: '', color: '#9ca3af', bg: 'transparent', icon: '' };
};

const getStatusStyle = (status) => {
  const styles = {
    'Done': { bg: 'rgba(107,114,128,0.1)', color: '#4b5563', dot: '#6b7280' },
    'Supply Chain Pending Order': { bg: 'rgba(220,38,38,0.1)', color: '#dc2626', dot: '#dc2626' },
    'Supply Chain Pending Arrival': { bg: 'rgba(245,158,11,0.1)', color: '#d97706', dot: '#f59e0b' },
    'Ready to start (Supply Chain confirmed on-site)': { bg: 'rgba(59,130,246,0.1)', color: '#2563eb', dot: '#3b82f6' },
    'In Progress': { bg: 'rgba(124,58,237,0.1)', color: '#7c3aed', dot: '#8b5cf6' },
    'Blocked': { bg: 'rgba(239,68,68,0.1)', color: '#dc2626', dot: '#ef4444' },
    'On Hold': { bg: 'rgba(107,114,128,0.1)', color: '#4b5563', dot: '#6b7280' },
  };
  return styles[status] || { bg: 'rgba(107,114,128,0.06)', color: '#9ca3af', dot: '#9ca3af' };
};

const formatTime = (ts) => {
  const d = new Date(ts), now = new Date(TODAY);
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(TODAY);
};

const isThisWeek = (date) => {
  if (!date) return false;
  const d = new Date(date);
  const today = new Date(TODAY);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  return d >= startOfWeek && d <= endOfWeek;
};

const isToday = (date) => date === TODAY;

const calculateDeadlineOnSite = (earliestStart) => {
  if (!earliestStart) return '';
  const d = new Date(earliestStart);
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
};

// ============ ICONS ============
const Icon = ({ name, size = 20 }) => {
  const icons = {
    leaf: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>,
    calendar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
    package: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    chart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    settings: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    list: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    kanban: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="8" rx="1"/></svg>,
    repeat: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>,
    message: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>,
    send: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    logout: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
    grip: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>,
    bell: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    chevronDown: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
    chevronRight: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
    clock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    link: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  };
  return icons[name] || null;
};

// ============ COMPONENTS ============
// ============ CLERK LOGIN SCREEN ============
const LoginScreen = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #065f46, #10b981)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fff' }}><Icon name="leaf" /></div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0, color: '#fff' }}>Santi Management V2</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>Sustainable Development</p>
        </div>
        <SignIn routing="hash" />
      </div>
    </div>
  );
};

const KanbanColumn = ({ id, title, tasks, onDrop, onDragOver, users, onTaskClick, onDragStart, dragOverColumn, onReorder, dragOverTaskId, setDragOverTaskId }) => {
  const isOver = dragOverColumn === id;
  
  const handleTaskDragOver = (e, taskId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTaskId(taskId);
  };

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); onDragOver(id); }}
      onDrop={(e) => onDrop(e, id)}
      style={{ 
        flex: '1', 
        minWidth: '250px', 
        maxWidth: '300px',
        background: isOver ? '#f0fdf4' : '#f9fafb', 
        borderRadius: '12px', 
        padding: '12px',
        border: isOver ? '2px dashed #059669' : '1px solid #e5e7eb',
        transition: 'all 0.2s'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: 0 }}>{title}</h3>
        <span style={{ fontSize: '12px', color: '#9ca3af', background: '#fff', padding: '2px 8px', borderRadius: '10px' }}>{tasks.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '100px' }}>
        {tasks.map((task, index) => {
          const assignee = users.find(u => u.id === task.assignedTo);
          const overdue = isOverdue(task.dueDate) && task.column !== 'done';
          const isTaskDragOver = dragOverTaskId === task.id;
          return (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => onDragStart(e, task)}
              onDragOver={(e) => handleTaskDragOver(e, task.id)}
              onDragLeave={() => setDragOverTaskId(null)}
              onDrop={(e) => {
                e.stopPropagation();
                onReorder(e, task.id, id);
              }}
              onClick={() => onTaskClick(task)}
              style={{
                background: '#fff',
                borderRadius: '8px',
                padding: '12px',
                border: isTaskDragOver ? '2px dashed #059669' : overdue ? '1px solid #fca5a5' : '1px solid #e5e7eb',
                cursor: 'grab',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transform: isTaskDragOver ? 'scale(1.02)' : 'scale(1)',
                transition: 'transform 0.15s, border 0.15s',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#1f2937' }}>{task.title}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {assignee && <img src={assignee.avatar} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />}
                  {task.type === 'sc' && <span style={{ fontSize: '10px', background: '#dbeafe', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>SC</span>}
                  {task.type === 'recurring' && <span style={{ fontSize: '10px', background: '#f3e8ff', color: '#7c3aed', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>↻</span>}
                </div>
                {task.dueDate && (
                  <span style={{ fontSize: '11px', color: overdue ? '#dc2626' : '#6b7280', fontWeight: overdue ? '600' : '400', background: overdue ? '#fef2f2' : 'transparent', padding: overdue ? '2px 6px' : '0', borderRadius: '4px' }}>
                    {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
              {task.type === 'sc' && task.scStatus && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280' }}>
                  Status: <span style={{ fontWeight: '500', color: task.scStatus === 'research' ? '#2563eb' : task.scStatus === 'researchApproval' ? '#d97706' : task.scStatus === 'pendingArrival' ? '#7c3aed' : '#059669' }}>
                    {task.scStatus === 'research' ? 'Research' : task.scStatus === 'researchApproval' ? 'Research Approval' : task.scStatus === 'pendingArrival' ? 'Pending Arrival' : task.scStatus === 'readyToStart' ? 'Ready to Start' : task.scStatus}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TaskModal = ({ task, onClose, onUpdate, onDelete, users, buildingTasks, setBuildingTasks, isManager }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo || '');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [column, setColumn] = useState(task?.column || 'later');
  const [scStatus, setScStatus] = useState(task?.scStatus || '');
  const [expectedArrival, setExpectedArrival] = useState(task?.expectedArrival || '');

  const isSC = task?.type === 'sc';
  const linkedBuildingTask = isSC ? buildingTasks.find(bt => bt.id === task.buildingTaskId) : null;

  const handleSave = () => {
    const updated = { ...task, title, assignedTo: Number(assignedTo), dueDate, column };
    
    if (isSC) {
      updated.scStatus = scStatus;
      updated.expectedArrival = expectedArrival;
      
      // Sync to building sequence
      if (linkedBuildingTask) {
        let newBuildingStatus = linkedBuildingTask.status;
        if (scStatus === 'pendingArrival') {
          newBuildingStatus = 'Supply Chain Pending Arrival';
        } else if (scStatus === 'readyToStart' || scStatus === 'done') {
          newBuildingStatus = 'Ready to start (Supply Chain confirmed on-site)';
        }
        
        setBuildingTasks(prev => prev.map(bt => 
          bt.id === task.buildingTaskId 
            ? { ...bt, status: newBuildingStatus, expectedArrival: expectedArrival }
            : bt
        ));
      }
    }
    
    onUpdate(updated);
    onClose();
  };

  const scStatusOptions = [
    { value: 'research', label: 'Research' },
    { value: 'researchApproval', label: 'Research Approval' },
    { value: 'pendingArrival', label: 'Supply Chain Pending Arrival' },
    { value: 'readyToStart', label: 'Ready to Start' },
    { value: 'done', label: 'Done' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={onClose}>
      <div style={{ width: '500px', background: '#fff', borderRadius: '16px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>{task ? 'Edit Task' : 'New Task'}</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="x" size={20} /></button>
        </div>

        {isSC && linkedBuildingTask && (
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#0369a1', marginBottom: '4px' }}>Linked to Building Sequence</div>
            <div style={{ fontSize: '13px', color: '#0c4a6e' }}>{linkedBuildingTask.villa} → {linkedBuildingTask.subCategory} → {linkedBuildingTask.step}</div>
            {task.deadlineOnSite && <div style={{ fontSize: '12px', color: '#0369a1', marginTop: '4px' }}>Deadline on site: {task.deadlineOnSite}</div>}
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} disabled={isSC} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', boxSizing: 'border-box', background: isSC ? '#f9fafb' : '#fff' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Assigned To</label>
            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <option value="">Select...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Column</label>
          <select value={column} onChange={e => setColumn(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <option value="today">Today</option>
            <option value="thisWeek">This Week</option>
            <option value="waiting">Waiting/Follow Up</option>
            <option value="review">Ready to Review</option>
            <option value="later">Later</option>
            <option value="done">Done</option>
          </select>
        </div>

        {isSC && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '6px' }}>SC Status</label>
              <select value={scStatus} onChange={e => setScStatus(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                {scStatusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            {(scStatus === 'pendingArrival' || scStatus === 'readyToStart') && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Expected Arrival Date</label>
                <input type="date" value={expectedArrival} onChange={e => setExpectedArrival(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', boxSizing: 'border-box' }} />
              </div>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          {task && !isSC && <button type="button" onClick={() => { onDelete(task.id); onClose(); }} style={{ padding: '10px 20px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Delete</button>}
          <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
          <button type="button" onClick={handleSave} style={{ padding: '10px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Save</button>
        </div>
      </div>
    </div>
  );
};

const RecurringTaskModal = ({ task, onClose, onSave, users }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo || '');
  const [frequency, setFrequency] = useState(task?.frequency || 'daily');
  const [days, setDays] = useState(task?.days || []);
  const [specificDates, setSpecificDates] = useState(task?.specificDates?.join(', ') || '');

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const monthDays = Array.from({ length: 31 }, (_, i) => String(i + 1));

  const toggleDay = (day) => {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSave = () => {
    onSave({
      id: task?.id || 'r' + Date.now(),
      title,
      assignedTo: Number(assignedTo),
      frequency,
      days,
      specificDates: specificDates.split(',').map(d => d.trim()).filter(d => d),
      createdAt: task?.createdAt || new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={onClose}>
      <div style={{ width: '500px', background: '#fff', borderRadius: '16px', padding: '24px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>{task ? 'Edit Recurring Task' : 'New Recurring Task'}</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="x" size={20} /></button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Assigned To</label>
            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <option value="">Select...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Frequency</label>
            <select value={frequency} onChange={e => { setFrequency(e.target.value); setDays([]); }} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="specific">Specific Dates</option>
            </select>
          </div>
        </div>

        {frequency === 'weekly' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Days of Week</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {weekDays.map(day => (
                <button key={day} type="button" onClick={() => toggleDay(day)} style={{ padding: '6px 12px', fontSize: '12px', background: days.includes(day) ? '#059669' : '#f3f4f6', color: days.includes(day) ? '#fff' : '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{day.slice(0, 3)}</button>
              ))}
            </div>
          </div>
        )}

        {frequency === 'monthly' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Day of Month</label>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {monthDays.map(day => (
                <button key={day} type="button" onClick={() => toggleDay(day)} style={{ width: '32px', height: '32px', fontSize: '12px', background: days.includes(day) ? '#059669' : '#f3f4f6', color: days.includes(day) ? '#fff' : '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{day}</button>
              ))}
            </div>
          </div>
        )}

        {frequency === 'specific' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Specific Dates (comma separated: YYYY-MM-DD)</label>
            <input value={specificDates} onChange={e => setSpecificDates(e.target.value)} placeholder="2026-03-01, 2026-06-01" style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', boxSizing: 'border-box' }} />
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
          <button type="button" onClick={handleSave} style={{ padding: '10px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Save</button>
        </div>
      </div>
    </div>
  );
};

// Building Sequence Components (simplified from before)
const Dropdown = ({ value, options, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(!open)} style={{ width: '100%', padding: '6px 10px', fontSize: '13px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', textAlign: 'left', cursor: 'pointer', color: value ? '#1f2937' : '#9ca3af' }}>{value || placeholder}</button>
      {open && <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '180px', overflowY: 'auto' }}>{options.map((o,i) => <div key={i} onClick={() => { onChange(o); setOpen(false); }} style={{ padding: '8px 12px', cursor: 'pointer', background: o === value ? '#f3f4f6' : 'transparent' }}>{o}</div>)}</div>}
    </div>
  );
};

const StatusDropdown = ({ value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const style = getStatusStyle(value);
  useEffect(() => { const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  const short = s => s === 'Ready to start (Supply Chain confirmed on-site)' ? 'Ready' : (s || 'Set status').replace('Supply Chain Pending', 'SC');
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', fontSize: '12px', fontWeight: '500', background: style.bg, border: 'none', borderRadius: '6px', color: style.color, cursor: 'pointer' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: style.dot }} />{short(value)}</button>
      {open && <div style={{ position: 'absolute', top: '100%', left: 0, minWidth: '220px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 100 }}>{options.map((o,i) => { const s = getStatusStyle(o); return <div key={i} onClick={() => { onChange(o); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', cursor: 'pointer' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.dot }} />{o}</div>; })}</div>}
    </div>
  );
};

const EditableCell = ({ value, onChange, placeholder }) => {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value);
  const ref = useRef(null);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);
  if (editing) return <input ref={ref} value={temp} onChange={e => setTemp(e.target.value)} onBlur={() => { setEditing(false); onChange(temp); }} onKeyDown={e => e.key === 'Enter' && (setEditing(false), onChange(temp))} style={{ width: '100%', padding: '6px', fontSize: '13px', border: '1px solid #059669', borderRadius: '6px' }} />;
  return <div onClick={() => { setTemp(value); setEditing(true); }} style={{ padding: '6px', fontSize: '13px', color: value ? '#1f2937' : '#9ca3af', cursor: 'text', minHeight: '28px' }}>{value || placeholder}</div>;
};

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
  const [selectedTaskUser, setSelectedTaskUser] = useState(null); // null = my tasks
  const [taskModal, setTaskModal] = useState(null);
  const [recurringModal, setRecurringModal] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragOverTaskId, setDragOverTaskId] = useState(null);
  const [search, setSearch] = useState('');

  // Map Clerk user to app user by email
  const currentUser = clerkUser ? users.find(u => u.email === clerkUser.primaryEmailAddress?.emailAddress) || {
    id: 999,
    email: clerkUser.primaryEmailAddress?.emailAddress || 'unknown',
    username: clerkUser.firstName || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User',
    avatar: clerkUser.imageUrl || 'https://ui-avatars.com/api/?name=User&background=059669&color=fff',
    role: 'worker',
    isAdmin: false,
    managerId: 1
  } : null;

  // Generate recurring task instances
  useEffect(() => {
    if (!currentUser) return;
    recurringTasks.forEach(rt => {
      let shouldCreate = false;
      if (rt.frequency === 'daily') shouldCreate = true;
      if (rt.frequency === 'weekly') {
        const dayName = new Date(TODAY).toLocaleDateString('en-US', { weekday: 'long' });
        shouldCreate = rt.days.includes(dayName);
      }
      if (rt.frequency === 'monthly') {
        const dayOfMonth = String(new Date(TODAY).getDate());
        shouldCreate = rt.days.includes(dayOfMonth);
      }
      if (rt.frequency === 'specific') {
        shouldCreate = rt.specificDates.includes(TODAY);
      }

      if (shouldCreate) {
        const existingToday = kanbanTasks.find(kt => kt.recurringId === rt.id && kt.createdAt === TODAY);
        if (!existingToday) {
          setKanbanTasks(prev => [...prev, {
            id: 'kr' + Date.now() + rt.id,
            title: rt.title,
            assignedTo: rt.assignedTo,
            column: 'today',
            dueDate: TODAY,
            type: 'recurring',
            recurringId: rt.id,
            createdAt: TODAY,
          }]);
        }
      }
    });
  }, [recurringTasks, currentUser]);

  // Loading state
  if (!isLoaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)' }}>
        <div style={{ color: '#fff', fontSize: '18px' }}>Loading...</div>
      </div>
    );
  }

  // Not signed in - show Clerk SignIn
  if (!isSignedIn) return <LoginScreen />;

  const isManager = currentUser.role === 'manager';
  const viewingUserId = selectedTaskUser || currentUser.id;

  // Handle status change in building sequence - create SC task
  const handleBuildingStatusChange = (taskId, newStatus, oldStatus) => {
    setBuildingTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    if (newStatus === 'Supply Chain Pending Order' && oldStatus !== 'Supply Chain Pending Order') {
      const task = buildingTasks.find(t => t.id === taskId);
      if (task) {
        const existingSC = kanbanTasks.find(kt => kt.type === 'sc' && kt.buildingTaskId === taskId);
        if (!existingSC) {
          const scTitle = `SC for ${task.step} - ${task.task} - ${task.subCategory} - ${task.villa}`;
          const deadlineOnSite = calculateDeadlineOnSite(task.earliestStart);
          setKanbanTasks(prev => [...prev, {
            id: 'sc' + Date.now(),
            buildingTaskId: taskId,
            title: scTitle,
            assignedTo: PROCUREMENT_USER_ID,
            column: 'thisWeek',
            scStatus: 'research',
            dueDate: deadlineOnSite,
            deadlineOnSite,
            expectedArrival: '',
            type: 'sc',
            createdAt: TODAY,
          }]);
        }
      }
    }
  };

  // Kanban filtering
  const getVisibleTasks = () => {
    let tasks = kanbanTasks;
    
    // Filter by user - Manager sees all by default, others see their own
    if (selectedTaskUser === 'all' || (isManager && selectedTaskUser === null)) {
      // Show all tasks
    } else if (selectedTaskUser) {
      // Specific user selected
      tasks = tasks.filter(t => t.assignedTo === selectedTaskUser);
    } else {
      // Default: my tasks only (non-managers)
      tasks = tasks.filter(t => t.assignedTo === currentUser.id);
    }

    // Additionally, manager always sees "Research Approval" tasks from reports in their view
    if (isManager) {
      const reportIds = users.filter(u => u.managerId === currentUser.id).map(u => u.id);
      const approvalTasks = kanbanTasks.filter(t => 
        t.type === 'sc' && 
        t.scStatus === 'researchApproval' && 
        reportIds.includes(t.assignedTo)
      );
      tasks = [...tasks, ...approvalTasks.filter(t => !tasks.find(x => x.id === t.id))];
    }

    return tasks;
  };

  const visibleTasks = getVisibleTasks().sort((a, b) => (a.order || 0) - (b.order || 0));

  const columns = [
    { id: 'today', title: 'Today' },
    { id: 'thisWeek', title: 'This Week' },
    { id: 'waiting', title: 'Waiting/Follow Up' },
    { id: 'review', title: 'Ready to Review' },
    { id: 'later', title: 'Later' },
    { id: 'done', title: 'Done' },
  ];

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    if (!draggedTask) return;
    
    setKanbanTasks(prev => prev.map(t => 
      t.id === draggedTask.id ? { ...t, column: columnId } : t
    ));
    
    setDraggedTask(null);
    setDragOverColumn(null);
    setDragOverTaskId(null);
  };

  const handleReorder = (e, targetTaskId, columnId) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.id === targetTaskId) {
      setDraggedTask(null);
      setDragOverTaskId(null);
      return;
    }

    // Get all tasks in this column, sorted by current order
    const columnTasks = kanbanTasks
      .filter(t => t.column === columnId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    const draggedIndex = columnTasks.findIndex(t => t.id === draggedTask.id);
    const targetIndex = columnTasks.findIndex(t => t.id === targetTaskId);
    
    // If dragged task is from different column, insert it
    if (draggedIndex === -1) {
      // Moving from another column - insert at target position
      const newColumnTasks = [...columnTasks];
      newColumnTasks.splice(targetIndex, 0, { ...draggedTask, column: columnId });
      
      // Update orders
      const updates = newColumnTasks.map((t, i) => ({ id: t.id, order: i, column: columnId }));
      
      setKanbanTasks(prev => prev.map(t => {
        const update = updates.find(u => u.id === t.id);
        if (update) return { ...t, order: update.order, column: update.column };
        return t;
      }));
    } else {
      // Reordering within same column
      const newColumnTasks = [...columnTasks];
      const [removed] = newColumnTasks.splice(draggedIndex, 1);
      newColumnTasks.splice(targetIndex, 0, removed);
      
      // Update orders
      const updates = newColumnTasks.map((t, i) => ({ id: t.id, order: i }));
      
      setKanbanTasks(prev => prev.map(t => {
        const update = updates.find(u => u.id === t.id);
        if (update) return { ...t, order: update.order };
        return t;
      }));
    }
    
    setDraggedTask(null);
    setDragOverColumn(null);
    setDragOverTaskId(null);
  };

  const handleTaskUpdate = (updated) => {
    setKanbanTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleTaskDelete = (id) => {
    setKanbanTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleNewTask = () => {
    setTaskModal({
      id: 'new' + Date.now(),
      title: '',
      assignedTo: currentUser.id,
      column: 'later',
      dueDate: '',
      type: 'manual',
      createdAt: TODAY,
    });
  };

  const handleRecurringSave = (task) => {
    setRecurringTasks(prev => {
      const existing = prev.find(t => t.id === task.id);
      if (existing) return prev.map(t => t.id === task.id ? task : t);
      return [...prev, task];
    });
  };

  const handleRecurringDelete = (id) => {
    setRecurringTasks(prev => prev.filter(t => t.id !== id));
  };

  // Navigation
  const navItems = [
    { id: 'taskBoard', label: 'Task Board', icon: 'kanban' },
    { id: 'recurring', label: 'Recurring Tasks', icon: 'repeat' },
    { id: 'sequence', label: 'Building Sequence', icon: 'list', subItems: [
      { id: 'sequence-villa1', label: 'Villa 1' },
      { id: 'sequence-villa2', label: 'Villa 2' },
      { id: 'sequence-villa3', label: 'Villa 3' },
      { id: 'sequence-landscaping', label: 'Landscaping' },
    ]},
    { id: 'schedule', label: 'Schedule', icon: 'calendar' },
    { id: 'workers', label: 'Workforce', icon: 'users' },
    { id: 'materials', label: 'Materials', icon: 'package' },
    { id: 'reports', label: 'Reports', icon: 'chart' },
  ];

  const currentVilla = activeNav === 'sequence-villa1' ? 'Villa 1' : activeNav === 'sequence-villa2' ? 'Villa 2' : activeNav === 'sequence-villa3' ? 'Villa 3' : 'Landscaping';

  const filteredBuildingTasks = buildingTasks.filter(t => t.villa === currentVilla);
  const grouped = {};
  filteredBuildingTasks.forEach(t => { (grouped[t.subCategory] = grouped[t.subCategory] || []).push(t); });
  Object.keys(grouped).forEach(k => grouped[k].sort((a, b) => (a.order || 0) - (b.order || 0)));

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', display: 'flex' }}>
      {/* Sidebar */}
      <nav style={{ width: '260px', height: '100vh', background: '#fafafa', borderRight: '1px solid #e5e7eb', padding: '20px 12px', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 12px', marginBottom: '24px' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #065f46, #10b981)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Icon name="leaf" /></div>
          <div><div style={{ fontSize: '15px', fontWeight: '700', color: '#065f46' }}>Santi Management</div><div style={{ fontSize: '11px', color: '#6b7280' }}>Sustainable Development</div></div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
          <img src={currentUser.avatar} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '600' }}>{currentUser.username}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'capitalize' }}>{currentUser.role}</div>
          </div>
          <SignOutButton>
            <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><Icon name="logout" size={18} /></button>
          </SignOutButton>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {navItems.map(item => (
            <div key={item.id}>
              <button type="button" onClick={() => { 
                if (item.subItems) { 
                  setExpandedNav(p => p.includes(item.id) ? p.filter(x => x !== item.id) : [...p, item.id]); 
                } else { 
                  setActiveNav(item.id); 
                }
              }} style={{ 
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                padding: '10px 14px', fontSize: '14px', fontWeight: '500', 
                background: (activeNav === item.id || item.subItems?.some(s => s.id === activeNav)) ? '#fff' : 'transparent', 
                border: (activeNav === item.id || item.subItems?.some(s => s.id === activeNav)) ? '1px solid #e5e7eb' : '1px solid transparent', 
                borderRadius: '10px', 
                color: (activeNav === item.id || item.subItems?.some(s => s.id === activeNav)) ? '#059669' : '#4b5563', 
                cursor: 'pointer', marginBottom: '2px' 
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Icon name={item.icon} />{item.label}</span>
                {item.subItems && <span style={{ transform: expandedNav.includes(item.id) ? 'rotate(90deg)' : '', transition: '0.2s' }}><Icon name="chevronRight" size={14} /></span>}
              </button>
              {item.subItems && expandedNav.includes(item.id) && (
                <div style={{ marginLeft: '20px', marginBottom: '8px' }}>
                  {item.subItems.map(sub => (
                    <button key={sub.id} type="button" onClick={() => setActiveNav(sub.id)} style={{ 
                      width: '100%', display: 'flex', alignItems: 'center', gap: '8px', 
                      padding: '8px 14px', fontSize: '13px', 
                      background: activeNav === sub.id ? 'rgba(5,150,105,0.08)' : 'transparent', 
                      border: 'none', borderRadius: '8px', 
                      color: activeNav === sub.id ? '#059669' : '#6b7280', 
                      cursor: 'pointer', marginBottom: '2px' 
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeNav === sub.id ? '#059669' : '#d1d5db' }} />
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <button type="button" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', fontSize: '14px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="settings" />Settings</button>
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: '260px', padding: '24px 32px' }}>
        {/* Task Board */}
        {activeNav === 'taskBoard' && (
          <div style={{ display: 'flex', gap: '24px' }}>
            {/* Left Sidebar - Quick User Selection */}
            <div style={{ width: '200px', flexShrink: 0 }}>
              <div style={{ background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>View Tasks</h3>
                
                {isManager && (
                  <button
                    type="button"
                    onClick={() => setSelectedTaskUser('all')}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      marginBottom: '8px',
                      background: (selectedTaskUser === 'all' || (isManager && selectedTaskUser === null)) ? '#ecfdf5' : '#fff',
                      border: (selectedTaskUser === 'all' || (isManager && selectedTaskUser === null)) ? '2px solid #059669' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: '600' }}>All</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>All Tasks</div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>{kanbanTasks.length} tasks</div>
                    </div>
                  </button>
                )}

                {users.map(u => {
                  const userTaskCount = kanbanTasks.filter(t => t.assignedTo === u.id).length;
                  const isSelected = selectedTaskUser === u.id || (!isManager && selectedTaskUser === null && u.id === currentUser.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedTaskUser(u.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        marginBottom: '6px',
                        background: isSelected ? '#ecfdf5' : '#fff',
                        border: isSelected ? '2px solid #059669' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <img src={u.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {u.username.split(' ')[0]}
                          {u.id === currentUser.id && <span style={{ fontSize: '10px', color: '#059669' }}>(me)</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>{userTaskCount} tasks</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Kanban Area */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>Task Board</h1>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
                    {selectedTaskUser === 'all' || (isManager && selectedTaskUser === null) ? 'All Tasks' : selectedTaskUser ? users.find(u => u.id === selectedTaskUser)?.username + "'s Tasks" : 'My Tasks'}
                  </p>
                </div>
                <button type="button" onClick={handleNewTask} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: '600', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                  <Icon name="plus" size={16} />Add Task
                </button>
              </div>

              <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
                {columns.map(col => (
                  <KanbanColumn
                    key={col.id}
                    id={col.id}
                    title={col.title}
                    tasks={visibleTasks.filter(t => t.column === col.id)}
                    users={users}
                    onTaskClick={setTaskModal}
                    onDragStart={(e, task) => setDraggedTask(task)}
                    onDragOver={setDragOverColumn}
                    onDrop={handleDrop}
                    onReorder={handleReorder}
                    dragOverColumn={dragOverColumn}
                    dragOverTaskId={dragOverTaskId}
                    setDragOverTaskId={setDragOverTaskId}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recurring Tasks */}
        {activeNav === 'recurring' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>Recurring Tasks</h1>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Manage scheduled recurring tasks</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <select 
                  value={selectedTaskUser || ''} 
                  onChange={e => setSelectedTaskUser(e.target.value === '' ? null : e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  style={{ padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px' }}
                >
                  <option value="">My Tasks</option>
                  <option value="all">All Tasks</option>
                  {users.filter(u => u.id !== currentUser.id).map(u => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setRecurringModal({})} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '14px', fontWeight: '600', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                  <Icon name="plus" size={16} />Add Recurring
                </button>
              </div>
            </div>

            {['daily', 'weekly', 'monthly', 'specific'].map(freq => {
              const freqTasks = recurringTasks.filter(t => 
                t.frequency === freq && 
                (selectedTaskUser === 'all' || t.assignedTo === (selectedTaskUser || currentUser.id))
              );
              if (freqTasks.length === 0) return null;
              
              return (
                <div key={freq} style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', textTransform: 'capitalize' }}>{freq === 'specific' ? 'Specific Dates' : freq}</h3>
                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                    {freqTasks.map((task, i) => {
                      const assignee = users.find(u => u.id === task.assignedTo);
                      return (
                        <div key={task.id} onClick={() => setRecurringModal(task)} style={{ 
                          padding: '16px 20px', 
                          borderBottom: i < freqTasks.length - 1 ? '1px solid #f3f4f6' : 'none',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          cursor: 'pointer',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Icon name="repeat" size={16} />
                            <span style={{ fontWeight: '500' }}>{task.title}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {task.days.length > 0 && <span style={{ fontSize: '12px', color: '#6b7280' }}>{task.days.join(', ')}</span>}
                            {assignee && <img src={assignee.avatar} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />}
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleRecurringDelete(task.id); }} style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer' }}><Icon name="trash" size={16} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Building Sequence */}
        {activeNav.startsWith('sequence-') && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>{currentVilla} Building Sequence</h1>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{filteredBuildingTasks.length} steps</p>
              </div>
              <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '180px', padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '10px' }} />
            </div>

            {Object.entries(grouped).map(([subCat, catTasks]) => (
              <div key={subCat} style={{ marginBottom: '32px', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>{subCat}</h3>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>{catTasks.length} steps</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                    <thead>
                      <tr style={{ background: '#fafafa' }}>
                        {['Readiness', 'Status', 'Task', 'Step', 'Notes', 'Earliest Start', 'Expected Arrival'].map((h, i) => (
                          <th key={i} style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '600', color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {catTasks.map((t, i) => {
                        const r = getReadiness(t, catTasks, i);
                        const hasSCTask = kanbanTasks.some(kt => kt.type === 'sc' && kt.buildingTaskId === t.id);
                        return (
                          <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6', background: r.type === 'ready' ? 'rgba(22,163,74,0.04)' : 'transparent' }}>
                            <td style={{ padding: '8px' }}>
                              {r.type !== 'sequenced' && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: '600', background: r.bg, color: r.color, borderRadius: '4px' }}>
                                  {r.icon} {r.label}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <StatusDropdown 
                                  value={t.status} 
                                  options={options.status} 
                                  onChange={v => handleBuildingStatusChange(t.id, v, t.status)} 
                                />
                                {hasSCTask && <span title="Has SC Task" style={{ color: '#2563eb' }}><Icon name="link" size={14} /></span>}
                              </div>
                            </td>
                            <td style={{ padding: '8px' }}><Dropdown value={t.task} options={options.task[subCat] || []} onChange={v => setBuildingTasks(p => p.map(x => x.id === t.id ? { ...x, task: v } : x))} placeholder="Task" /></td>
                            <td style={{ padding: '8px' }}><EditableCell value={t.step} onChange={v => setBuildingTasks(p => p.map(x => x.id === t.id ? { ...x, step: v } : x))} placeholder="Step" /></td>
                            <td style={{ padding: '8px' }}><EditableCell value={t.notes} onChange={v => setBuildingTasks(p => p.map(x => x.id === t.id ? { ...x, notes: v } : x))} placeholder="Notes" /></td>
                            <td style={{ padding: '8px' }}><input type="date" value={t.earliestStart || ''} onChange={e => setBuildingTasks(p => p.map(x => x.id === t.id ? { ...x, earliestStart: e.target.value } : x))} style={{ padding: '6px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }} /></td>
                            <td style={{ padding: '8px' }}><input type="date" value={t.expectedArrival || ''} onChange={e => setBuildingTasks(p => p.map(x => x.id === t.id ? { ...x, expectedArrival: e.target.value } : x))} style={{ padding: '6px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Placeholder pages */}
        {['schedule', 'workers', 'materials', 'reports'].includes(activeNav) && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#9ca3af' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#6b7280' }}>{navItems.find(n => n.id === activeNav)?.label}</h2>
            <p>Coming soon</p>
          </div>
        )}
      </main>

      {/* Modals */}
      {taskModal && (
        <TaskModal
          task={taskModal}
          onClose={() => setTaskModal(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
          users={users}
          buildingTasks={buildingTasks}
          setBuildingTasks={setBuildingTasks}
          isManager={isManager}
        />
      )}

      {recurringModal && (
        <RecurringTaskModal
          task={recurringModal.id ? recurringModal : null}
          onClose={() => setRecurringModal(null)}
          onSave={handleRecurringSave}
          users={users}
        />
      )}
    </div>
  );
}
