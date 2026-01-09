'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useUser, SignIn, SignOutButton } from '@clerk/nextjs';
import { db, supabase } from '../lib/supabase';

// ============ USERS ============
const mockUsers = [
  { id: 1, email: 'patrick@northstar-performance.com', username: 'Patrick', avatar: 'https://ui-avatars.com/api/?name=Patrick&background=059669&color=fff', role: 'manager', isAdmin: true, managerId: null, approvers: [] },
  { id: 2, email: 'david@northstar-performance.com', username: 'David', avatar: 'https://ui-avatars.com/api/?name=David&background=0ea5e9&color=fff', role: 'manager', isAdmin: false, managerId: 1, approvers: [1] },
  { id: 3, email: 'jiratchaya@northstar-performance.com', username: 'Jean', avatar: 'https://ui-avatars.com/api/?name=Jean&background=8b5cf6&color=fff', role: 'supply/back end manager', isAdmin: false, managerId: 2, approvers: [1, 2] },
  { id: 4, email: 'jirapongthong@gmail.com', username: 'Ball', avatar: 'https://ui-avatars.com/api/?name=Ball&background=f59e0b&color=fff', role: 'supply/back end manager', isAdmin: false, managerId: 1, approvers: [1] },
];

const CONSTRUCTION_MANAGER_ID = 2; // David - confirms SC arrivals

const PROCUREMENT_USER_ID = 4;
const TODAY = '2026-01-06';

// ============ INITIAL DATA ============
const initialKanbanTasks = [
  { id: 'k1', title: 'Review site safety protocols', assignedTo: 3, column: 'today', dueDate: '2026-01-06', type: 'manual', estTime: 1, actualTime: null, createdAt: '2026-01-04' },
  { id: 'k2', title: 'Coordinate with architect', assignedTo: 2, column: 'thisWeek', dueDate: '2026-01-08', type: 'manual', estTime: 2, actualTime: null, createdAt: '2026-01-03' },
  { id: 'k3', title: 'Order safety gear', assignedTo: 4, column: 'waiting', dueDate: '2026-01-15', expectedArrival: '2026-01-12', type: 'manual', estTime: 0.5, actualTime: null, createdAt: '2026-01-02' },
  { id: 'k4', title: 'Weekly progress report', assignedTo: 1, column: 'thisWeek', dueDate: '2026-01-10', type: 'manual', estTime: 1.5, actualTime: null, createdAt: '2026-01-01' },
  { id: 'k5', title: 'Daily inbox zero & emails', assignedTo: 3, column: 'today', dueDate: '2026-01-06', type: 'recurring', estTime: 1, actualTime: null, createdAt: '2026-01-06' },
  { id: 'k6', title: 'Research concrete suppliers', assignedTo: 3, column: 'today', dueDate: '2026-01-06', type: 'manual', estTime: 2, actualTime: null, createdAt: '2026-01-05' },
  { id: 'k7', title: 'Update project timeline', assignedTo: 2, column: 'today', dueDate: '2026-01-06', type: 'manual', estTime: 1.5, actualTime: null, createdAt: '2026-01-05' },
  { id: 'k8', title: 'Check material inventory', assignedTo: 4, column: 'today', dueDate: '2026-01-06', type: 'manual', estTime: 1, actualTime: null, createdAt: '2026-01-05' },
  { id: 'k9', title: 'Supplier price comparison', assignedTo: 3, column: 'review', dueDate: '2026-01-06', type: 'manual', estTime: 2, actualTime: null, createdAt: '2026-01-04' },
  { id: 'k10', title: 'Follow up on rebar delivery', assignedTo: 4, column: 'waiting', dueDate: '2026-01-10', expectedArrival: '2026-01-09', type: 'manual', estTime: 0.5, actualTime: null, createdAt: '2026-01-03' },
  // Done tasks for Patrick
  { id: 'k11', title: 'Review Q4 budget allocation', assignedTo: 1, column: 'done', dueDate: '2026-01-03', type: 'manual', estTime: 2, actualTime: 2.5, createdAt: '2026-01-01', completedAt: '2026-01-03' },
  { id: 'k12', title: 'Sign contractor agreements', assignedTo: 1, column: 'done', dueDate: '2026-01-04', type: 'manual', estTime: 1, actualTime: 1, createdAt: '2026-01-02', completedAt: '2026-01-04' },
  { id: 'k13', title: 'Approve villa 3 foundation plan', assignedTo: 1, column: 'done', dueDate: '2026-01-05', type: 'manual', estTime: 1.5, actualTime: 1, createdAt: '2026-01-03', completedAt: '2026-01-05' },
  // Done tasks for David
  { id: 'k14', title: 'Site inspection - Villa 3', assignedTo: 2, column: 'done', dueDate: '2026-01-04', type: 'manual', estTime: 2, actualTime: 2, createdAt: '2026-01-02', completedAt: '2026-01-04' },
  { id: 'k15', title: 'Update worker schedule', assignedTo: 2, column: 'done', dueDate: '2026-01-05', type: 'manual', estTime: 1, actualTime: 0.5, createdAt: '2026-01-04', completedAt: '2026-01-05' },
  { id: 'k16', title: 'QA - Base foundation formwork', assignedTo: 2, column: 'done', dueDate: '2026-01-05', type: 'manual', estTime: 1.5, actualTime: 1.5, createdAt: '2026-01-03', completedAt: '2026-01-05' },
  // Done tasks for Jean
  { id: 'k17', title: 'Contact cement suppliers', assignedTo: 3, column: 'done', dueDate: '2026-01-03', type: 'manual', estTime: 1.5, actualTime: 2, createdAt: '2026-01-01', completedAt: '2026-01-03' },
  { id: 'k18', title: 'Process invoice #2341', assignedTo: 3, column: 'done', dueDate: '2026-01-04', type: 'manual', estTime: 0.5, actualTime: 0.5, createdAt: '2026-01-03', completedAt: '2026-01-04' },
  { id: 'k19', title: 'Negotiate rebar pricing', assignedTo: 3, column: 'done', dueDate: '2026-01-05', type: 'manual', estTime: 2, actualTime: 3, createdAt: '2026-01-02', completedAt: '2026-01-05' },
  // Done tasks for Ball
  { id: 'k20', title: 'Inventory count - tools', assignedTo: 4, column: 'done', dueDate: '2026-01-03', type: 'manual', estTime: 1, actualTime: 1.5, createdAt: '2026-01-02', completedAt: '2026-01-03' },
  { id: 'k21', title: 'Order PPE equipment', assignedTo: 4, column: 'done', dueDate: '2026-01-04', type: 'manual', estTime: 0.5, actualTime: 0.5, createdAt: '2026-01-03', completedAt: '2026-01-04' },
  { id: 'k22', title: 'Track delivery - formwork materials', assignedTo: 4, column: 'done', dueDate: '2026-01-05', type: 'manual', estTime: 1, actualTime: 1, createdAt: '2026-01-04', completedAt: '2026-01-05' },
];

const initialRecurringTasks = [
  { id: 'r1', title: 'Daily safety inspection', assignedTo: 3, frequency: 'daily', days: [], specificDates: [], estTime: 0.5, createdAt: '2026-01-01' },
  { id: 'r2', title: 'Weekly team standup', assignedTo: 1, frequency: 'weekly', days: ['Monday'], specificDates: [], estTime: 1, createdAt: '2026-01-01' },
  { id: 'r3', title: 'Monthly inventory check', assignedTo: 4, frequency: 'monthly', days: ['1'], specificDates: [], estTime: 2, createdAt: '2026-01-01' },
  { id: 'r4', title: 'Quarterly safety audit', assignedTo: 2, frequency: 'specific', days: [], specificDates: ['2026-03-01', '2026-06-01', '2026-09-01', '2026-12-01'], estTime: 4, createdAt: '2026-01-01' },
  { id: 'r5', title: 'Daily inbox zero & emails', assignedTo: 3, frequency: 'daily', days: [], specificDates: [], estTime: 1, createdAt: '2026-01-01' },
  { id: 'r6', title: 'Check supplier status updates', assignedTo: 4, frequency: 'daily', days: [], specificDates: [], estTime: 0.5, createdAt: '2026-01-01' },
];

// Generate recurring task instances for the last 7 days
const generateRecurringTaskInstances = () => {
  const today = new Date(TODAY);
  const checkDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    checkDays.push(d.toISOString().split('T')[0]);
  }

  const tasks = [];
  initialRecurringTasks.forEach(rt => {
    // Skip paused or archived tasks
    if (rt.status === 'paused' || rt.status === 'archived') return;

    checkDays.forEach(dateStr => {
      const checkDate = new Date(dateStr);
      const checkDayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][checkDate.getDay()];
      const checkDayOfMonth = checkDate.getDate().toString();

      let shouldCreate = false;

      if (rt.frequency === 'daily') {
        shouldCreate = true;
      } else if (rt.frequency === 'weekly' && rt.days.includes(checkDayOfWeek)) {
        shouldCreate = true;
      } else if (rt.frequency === 'monthly' && rt.days.includes(checkDayOfMonth)) {
        shouldCreate = true;
      } else if (rt.frequency === 'specific' && rt.specificDates.includes(dateStr)) {
        shouldCreate = true;
      }

      if (shouldCreate) {
        const taskId = `rec-${rt.id}-${dateStr}`;
        tasks.push({
          id: taskId,
          title: rt.title,
          assignedTo: rt.assignedTo,
          column: 'today',
          dueDate: dateStr,
          type: 'recurring',
          recurringTaskId: rt.id,
          estTime: rt.estTime,
          actualTime: null,
          createdAt: dateStr
        });
      }
    });
  });
  return tasks;
};

const generatedRecurringTasks = generateRecurringTaskInstances();

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
  { id: 'sc1', buildingTaskId: 5, title: 'SC: Concrete Pour - Base Foundation - Villa 3', assignedTo: PROCUREMENT_USER_ID, column: 'thisWeek', scStatus: 'research', dueDate: '2026-01-08', deadlineOnSite: '2026-01-08', expectedArrival: '', type: 'sc', estTime: 2, actualTime: null, createdAt: '2026-01-04' },
  { id: 'sc2', buildingTaskId: 8, title: 'SC: Brick Laying - Strip Foundation - Villa 3', assignedTo: PROCUREMENT_USER_ID, column: 'waiting', scStatus: 'pendingArrival', dueDate: '2026-01-13', deadlineOnSite: '2026-01-13', expectedArrival: '2026-01-10', type: 'sc', estTime: 1.5, actualTime: null, createdAt: '2026-01-04' },
  { id: 'sc3', buildingTaskId: 9, title: 'SC: Concrete Pouring - Strip Foundation - Villa 3', assignedTo: PROCUREMENT_USER_ID, column: 'later', scStatus: 'research', dueDate: '2026-01-18', deadlineOnSite: '2026-01-18', expectedArrival: '', type: 'sc', estTime: 2, actualTime: null, createdAt: '2026-01-04' },
];

const initialOptions = {
  status: ['Done', 'In Progress', 'Ready to start (Supply Chain confirmed on-site)', 'Supply Chain Arrived to be Confirmed', 'Supply Chain Pending Arrival', 'Supply Chain Pending Order', 'Blocked', 'On Hold'],
  mainCategory: ['1 Site Prep', '2 Foundation', '3 Structure', '4 Roofing', '5 MEP', '6 Finishes', 'Landscaping', 'Infrastructure'],
  subCategory: { '2 Foundation': ['Base Foundation (incl columns)', 'Strip Foundation', 'Plumbing', 'Main Slab Foundation'], '3 Structure': ['Columns', 'Beams', 'Walls', 'Slabs'], 'Landscaping': ['Garden', 'Trees', 'Irrigation'], 'Infrastructure': ['Pathways', 'Drainage', 'Lighting'] },
  task: { 'Base Foundation (incl columns)': ['Formwork', 'Re-Bar', 'Concrete'], 'Strip Foundation': ['Brick Work', 'Concrete', 'Plinch-Beam', 'Formwork'], 'Plumbing': ['Rough-in', 'Connections', 'Testing'], 'Garden': ['Preparation', 'Planting', 'Mulching'], 'Pathways': ['Groundwork', 'Base Layer', 'Surface'], 'Drainage': ['Main Drains', 'Connections', 'Testing'] },
  skilledWorker: ['zin', 'Joshua', 'zaw', 'diesel', 'San Shwe'],
  unskilledWorker: ['Tun Sein Maung', 'Sone', 'Min Pyea', 'Thein Win']
};

// ============ WORKFORCE DATA ============
const initialWorkforce = [
  { id: 'w1', name: 'zin', type: 'skilled', hourlyRate: 150, status: 'active', debt: 0, debtDescription: '', repaymentFrequency: 'none' },
  { id: 'w2', name: 'Joshua', type: 'skilled', hourlyRate: 180, status: 'active', debt: 5000, debtDescription: 'Tool advance', repaymentFrequency: 'weekly' },
  { id: 'w3', name: 'zaw', type: 'skilled', hourlyRate: 160, status: 'active', debt: 0, debtDescription: '', repaymentFrequency: 'none' },
  { id: 'w4', name: 'diesel', type: 'skilled', hourlyRate: 170, status: 'active', debt: 2000, debtDescription: 'Salary advance', repaymentFrequency: 'monthly' },
  { id: 'w5', name: 'San Shwe', type: 'skilled', hourlyRate: 200, status: 'active', debt: 0, debtDescription: '', repaymentFrequency: 'none' },
  { id: 'w6', name: 'Tun Sein Maung', type: 'unskilled', hourlyRate: 80, status: 'active', debt: 1500, debtDescription: 'Medical expense', repaymentFrequency: 'weekly' },
  { id: 'w7', name: 'Sone', type: 'unskilled', hourlyRate: 75, status: 'active', debt: 0, debtDescription: '', repaymentFrequency: 'none' },
  { id: 'w8', name: 'Min Pyea', type: 'unskilled', hourlyRate: 80, status: 'active', debt: 3000, debtDescription: 'Family emergency', repaymentFrequency: 'daily' },
  { id: 'w9', name: 'Thein Win', type: 'unskilled', hourlyRate: 70, status: 'active', debt: 0, debtDescription: '', repaymentFrequency: 'none' },
];

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
  const styles = { 'Done': { bg: 'rgba(22,163,74,0.1)', color: '#16a34a', dot: '#16a34a' }, 'In Progress': { bg: 'rgba(124,58,237,0.1)', color: '#7c3aed', dot: '#7c3aed' }, 'Ready to start (Supply Chain confirmed on-site)': { bg: 'rgba(5,150,105,0.1)', color: '#059669', dot: '#059669' }, 'Supply Chain Arrived to be Confirmed': { bg: 'rgba(14,165,233,0.1)', color: '#0ea5e9', dot: '#0ea5e9' }, 'Supply Chain Pending Order': { bg: 'rgba(220,38,38,0.1)', color: '#dc2626', dot: '#dc2626' }, 'Supply Chain Pending Arrival': { bg: 'rgba(217,119,6,0.1)', color: '#d97706', dot: '#d97706' }, 'Blocked': { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', dot: '#6b7280' }, 'On Hold': { bg: 'rgba(156,163,175,0.1)', color: '#9ca3af', dot: '#9ca3af' } };
  return styles[status] || { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af' };
};

const formatTime = (ts) => { if (!ts) return ''; const d = new Date(ts); const diff = Date.now() - d.getTime(); if (diff < 60000) return 'Just now'; if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago'; if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago'; return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date(TODAY);
const calculateDeadlineOnSite = (earliestStart) => { if (!earliestStart) return ''; const d = new Date(earliestStart); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0]; };

// ============ ICONS ============
const Icon = ({ name, size = 20 }) => {
  const icons = {
    leaf: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></svg>,
    calendar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
    package: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
    chart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
    list: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
    kanban: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="5" height="18" rx="1" /><rect x="10" y="3" width="5" height="12" rx="1" /><rect x="17" y="3" width="5" height="8" rx="1" /></svg>,
    repeat: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>,
    message: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>,
    send: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
    logout: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
    grip: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="5" r="1" fill="currentColor" /><circle cx="9" cy="12" r="1" fill="currentColor" /><circle cx="9" cy="19" r="1" fill="currentColor" /><circle cx="15" cy="5" r="1" fill="currentColor" /><circle cx="15" cy="12" r="1" fill="currentColor" /><circle cx="15" cy="19" r="1" fill="currentColor" /></svg>,
    bell: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
    chevronDown: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>,
    chevronRight: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>,
    link: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>,
    menu: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>,
    home: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
    copy: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>,
  };
  return icons[name] || null;
};

// ============ COMPONENTS ============
const LoginScreen = ({ onDemoLogin }) => (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', padding: '20px' }}>
    <div style={{ textAlign: 'center', width: '100%', maxWidth: '400px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fff' }}><Icon name="leaf" size={32} /></div>
        <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0, color: '#fff' }}>Santi Management</h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>Sustainable Development</p>
      </div>
      <SignIn routing="hash" />
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
        <button type="button" onClick={() => onDemoLogin('patrick')} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', backdropFilter: 'blur(4px)', minWidth: '220px' }}>
          Demo Login (Patrick - Admin)
        </button>
        <button type="button" onClick={() => onDemoLogin('david')} style={{ padding: '12px 24px', background: 'rgba(14,165,233,0.3)', color: '#fff', border: '1px solid rgba(14,165,233,0.5)', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', backdropFilter: 'blur(4px)', minWidth: '220px' }}>
          Demo Login (David - Manager)
        </button>
      </div>
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
const KanbanColumn = ({ id, title, tasks, onDrop, onDragOver, users, onTaskClick, onDragStart, dragOverColumn, dragOverTaskId, setDragOverTaskId, currentUserId, onQuickMove, columns }) => {
  const totalHours = tasks.reduce((sum, t) => sum + (t.estTime || 0), 0);
  return (
    <div onDragOver={(e) => { e.preventDefault(); onDragOver(id); }} onDrop={(e) => { e.preventDefault(); onDrop(id); }} style={{ flex: '0 0 280px', minWidth: '280px', background: dragOverColumn === id ? 'rgba(5,150,105,0.05)' : '#f9fafb', borderRadius: '12px', padding: '12px', border: dragOverColumn === id ? '2px dashed #059669' : '2px solid transparent' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', margin: 0 }}>{title}</h3>
          {totalHours > 0 && <span style={{ fontSize: '11px', color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>{totalHours}h</span>}
        </div>
        <span style={{ fontSize: '12px', color: '#9ca3af', background: '#fff', padding: '2px 8px', borderRadius: '10px' }}>{tasks.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '100px' }}>
        {tasks.map(task => {
          const assignee = users.find(u => u.id === task.assignedTo);
          const overdue = isOverdue(task.dueDate);
          const isReviewFromOther = task.column === 'review' && task.assignedTo !== currentUserId;
          const lastMove = task.statusHistory?.[task.statusHistory.length - 1];
          const mover = lastMove ? users.find(u => u.id === lastMove.userId) : null;
          return (
            <div key={task.id} draggable onDragStart={(e) => onDragStart(e, task)} onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverTaskId(task.id); }} style={{ background: isReviewFromOther ? '#fef3c7' : '#fff', borderRadius: '8px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'grab', border: dragOverTaskId === task.id ? '2px solid #059669' : isReviewFromOther ? '2px solid #f59e0b' : '1px solid #e5e7eb' }}>
              {isReviewFromOther && <div style={{ fontSize: '10px', fontWeight: '600', color: '#d97706', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>⭐ NEEDS YOUR REVIEW</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div onClick={() => onTaskClick(task)} style={{ flex: 1, cursor: 'pointer' }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#1f2937' }}>{task.title}</div>
                </div>
                {/* Quick action buttons */}
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  {id !== 'done' && (
                    <button
                      type="button"
                      onClick={() => onQuickMove(task, 'done')}
                      title="Mark Done"
                      style={{ width: '24px', height: '24px', padding: 0, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}
                    >✓</button>
                  )}
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) onQuickMove(task, e.target.value); }}
                    title="Move to..."
                    style={{ width: '24px', height: '24px', padding: 0, background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', appearance: 'none', textAlign: 'center' }}
                  >
                    <option value="">→</option>
                    {columns.filter(c => c.id !== id).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              </div>
              <div onClick={() => onTaskClick(task)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {task.type === 'sc' && <span style={{ fontSize: '10px', padding: '2px 6px', background: '#dbeafe', color: '#2563eb', borderRadius: '4px', fontWeight: '600' }}>SC</span>}
                    {task.type === 'recurring' && <span style={{ fontSize: '10px', padding: '2px 6px', background: '#f3e8ff', color: '#7c3aed', borderRadius: '4px', fontWeight: '600' }}>↻</span>}
                    {task.estTime && <span style={{ fontSize: '10px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '2px' }}>🕐 {task.estTime}h</span>}
                    {task.dueDate && <span style={{ fontSize: '11px', color: overdue ? '#dc2626' : '#6b7280', fontWeight: overdue ? '600' : '400' }}>📅 {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                  </div>
                  {assignee && <img src={assignee.avatar} alt="" title={assignee.username} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />}
                </div>
                {task.expectedArrival && <div style={{ marginTop: '6px', fontSize: '10px', color: '#0891b2', background: '#ecfeff', padding: '3px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>📦 {new Date(task.expectedArrival).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
                {/* Status history - show last move */}
                {lastMove && mover && (
                  <div style={{ marginTop: '6px', fontSize: '10px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Moved by {mover.username}</span>
                    <span>•</span>
                    <span>{formatTime(lastMove.timestamp)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
const TaskModal = ({ task, onClose, onUpdate, onDelete, users, buildingTasks, comments, setComments, currentUser, setNotifications }) => {
  const [form, setForm] = useState({ ...task });
  const [commentText, setCommentText] = useState('');
  const isSC = task?.type === 'sc';
  const linkedBT = isSC ? buildingTasks.find(bt => bt.id === task.buildingTaskId) : null;
  const scStatuses = ['research', 'researchApproval', 'pendingArrival', 'readyToStart'];
  const scLabels = { research: 'Research', researchApproval: 'Research Approval', pendingArrival: 'Pending Arrival', readyToStart: 'Ready to Start' };
  const taskComments = comments[task?.id] || [];

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const mentionMatches = commentText.match(/@(\w+)/g) || [];
    const mentionedUsers = mentionMatches.map(m => users.find(u => u.username.toLowerCase().startsWith(m.slice(1).toLowerCase()))).filter(Boolean);
    const newComment = { id: Date.now(), taskId: task.id, userId: currentUser.id, text: commentText, timestamp: new Date().toISOString(), mentions: mentionedUsers.map(u => u.id) };
    setComments(prev => ({ ...prev, [task.id]: [...(prev[task.id] || []), newComment] }));
    mentionedUsers.forEach(u => { if (u.id !== currentUser.id) setNotifications(prev => [...prev, { id: Date.now() + u.id, userId: u.id, fromUserId: currentUser.id, taskId: task.id, text: `${currentUser.username} mentioned you`, timestamp: new Date().toISOString(), read: false }]); });
    setCommentText('');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '600px', background: '#fff', borderRadius: '16px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Edit Task</h2><button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><Icon name="x" /></button></div>
        {isSC && linkedBT && <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}><div style={{ fontSize: '12px', fontWeight: '600', color: '#0369a1', marginBottom: '4px' }}>Linked to Building Sequence</div><div style={{ fontSize: '13px', color: '#0c4a6e' }}>{linkedBT.step} - {linkedBT.task} - {linkedBT.subCategory}</div></div>}
        <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Title</label><input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Due Date</label><input type="date" value={form.dueDate || ''} onChange={e => setForm({ ...form, dueDate: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} /></div>
          <div><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Assigned To</label><select value={form.assignedTo || ''} onChange={e => setForm({ ...form, assignedTo: Number(e.target.value) })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}>{users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}</select></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Est. Time (hours)</label><input type="number" step="0.5" min="0" value={form.estTime || ''} onChange={e => setForm({ ...form, estTime: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} /></div>
          <div><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Actual Time (hours)</label><input type="number" step="0.5" min="0" value={form.actualTime || ''} onChange={e => setForm({ ...form, actualTime: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} /></div>
        </div>
        <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Expected Arrival (for waiting items)</label><input type="date" value={form.expectedArrival || ''} onChange={e => setForm({ ...form, expectedArrival: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} /></div>
        {isSC && <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>SC Status</label><div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{scStatuses.map(s => <button key={s} type="button" onClick={() => setForm({ ...form, scStatus: s })} style={{ padding: '6px 12px', fontSize: '12px', border: form.scStatus === s ? '2px solid #059669' : '1px solid #e5e7eb', borderRadius: '6px', background: form.scStatus === s ? '#ecfdf5' : '#fff', color: form.scStatus === s ? '#059669' : '#6b7280', cursor: 'pointer' }}>{scLabels[s]}</button>)}</div></div>}

        {/* Status History Section */}
        {task?.statusHistory && task.statusHistory.length > 0 && (
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#6b7280' }}>Status History</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {task.statusHistory.slice().reverse().map((h, i) => {
                const mover = users.find(u => u.id === h.userId);
                const colNames = { today: 'Today', thisWeek: 'This Week', waiting: 'Waiting', review: 'To Be Reviewed', later: 'Later', done: 'Done' };
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <img src={mover?.avatar} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                    <span style={{ color: '#374151' }}>
                      <strong>{mover?.username}</strong> moved from <span style={{ color: '#6b7280' }}>{colNames[h.from] || h.from}</span> → <span style={{ color: '#059669', fontWeight: '500' }}>{colNames[h.to] || h.to}</span>
                    </span>
                    <span style={{ color: '#9ca3af', marginLeft: 'auto' }}>{formatTime(h.timestamp)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>Comments ({taskComments.length})</label>
          <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '12px' }}>
            {taskComments.length === 0 ? <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', padding: '20px' }}>No comments yet</p> : taskComments.map(c => {
              const author = users.find(u => u.id === c.userId);
              return <div key={c.id} style={{ marginBottom: '12px', padding: '10px', background: '#f9fafb', borderRadius: '8px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}><img src={author?.avatar} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} /><span style={{ fontSize: '12px', fontWeight: '600' }}>{author?.username}</span><span style={{ fontSize: '10px', color: '#9ca3af' }}>{formatTime(c.timestamp)}</span></div><p style={{ margin: 0, fontSize: '13px', color: '#374151' }}>{c.text.split(/(@\w+)/g).map((part, i) => part.startsWith('@') ? <span key={i} style={{ color: '#059669', fontWeight: '500' }}>{part}</span> : part)}</p></div>;
            })}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}><input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddComment()} placeholder="Add a comment... (use @ to mention)" style={{ flex: 1, padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }} /><button type="button" onClick={handleAddComment} style={{ padding: '10px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><Icon name="send" size={16} /></button></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>{task && !isSC ? <button type="button" onClick={() => { onDelete(task.id); onClose(); }} style={{ padding: '10px 20px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Delete</button> : <div />}<div style={{ display: 'flex', gap: '8px' }}><button type="button" onClick={onClose} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button><button type="button" onClick={() => { onUpdate(form); onClose(); }} style={{ padding: '10px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Save</button></div></div>
      </div>
    </div>
  );
};

const RecurringTaskModal = ({ task, onClose, onSave, onDelete, onArchive, users, comments, setComments, currentUser, setNotifications }) => {
  const [form, setForm] = useState(task || { title: '', assignedTo: 1, frequency: 'daily', days: [], specificDates: [], estTime: 1, notes: '', status: 'active' });
  const [newComment, setNewComment] = useState('');
  const toggleDay = (day) => setForm(f => ({ ...f, days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day] }));

  const taskComments = task?.id ? (comments[`r-${task.id}`] || []) : [];

  const handleAddComment = () => {
    if (!newComment.trim() || !task?.id) return;
    const comment = { id: Date.now(), taskId: `r-${task.id}`, userId: currentUser.id, text: newComment, timestamp: new Date().toISOString(), mentions: [] };
    setComments(prev => ({ ...prev, [`r-${task.id}`]: [...(prev[`r-${task.id}`] || []), comment] }));
    setNewComment('');
  };

  const isArchived = form.status === 'archived';
  const isPaused = form.status === 'paused';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '550px', maxHeight: '90vh', background: '#fff', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', padding: '4px 10px', background: '#f3e8ff', color: '#7c3aed', borderRadius: '4px', fontWeight: '600' }}>↻ Recurring</span>
            {isArchived && <span style={{ fontSize: '11px', padding: '4px 8px', background: '#f3f4f6', color: '#6b7280', borderRadius: '4px' }}>Archived</span>}
            {isPaused && <span style={{ fontSize: '11px', padding: '4px 8px', background: '#fef3c7', color: '#d97706', borderRadius: '4px' }}>Paused</span>}
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{task?.id ? 'Edit' : 'New'} Recurring Task</h2>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><Icon name="x" /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Status toggle for existing tasks */}
          {task?.id && (
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>Status</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setForm({ ...form, status: 'active' })} style={{ padding: '6px 12px', fontSize: '12px', border: form.status === 'active' ? '2px solid #059669' : '1px solid #e5e7eb', borderRadius: '6px', background: form.status === 'active' ? '#ecfdf5' : '#fff', color: form.status === 'active' ? '#059669' : '#6b7280', cursor: 'pointer' }}>✓ Active</button>
                <button type="button" onClick={() => setForm({ ...form, status: 'paused' })} style={{ padding: '6px 12px', fontSize: '12px', border: form.status === 'paused' ? '2px solid #d97706' : '1px solid #e5e7eb', borderRadius: '6px', background: form.status === 'paused' ? '#fef3c7' : '#fff', color: form.status === 'paused' ? '#d97706' : '#6b7280', cursor: 'pointer' }}>⏸ Paused</button>
                <button type="button" onClick={() => setForm({ ...form, status: 'archived' })} style={{ padding: '6px 12px', fontSize: '12px', border: form.status === 'archived' ? '2px solid #6b7280' : '1px solid #e5e7eb', borderRadius: '6px', background: form.status === 'archived' ? '#f3f4f6' : '#fff', color: '#6b7280', cursor: 'pointer' }}>📦 Archived</button>
              </div>
              {isPaused && <p style={{ fontSize: '11px', color: '#d97706', marginTop: '8px', margin: '8px 0 0' }}>Paused tasks won't generate new daily tasks but stay visible</p>}
              {isArchived && <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px', margin: '8px 0 0' }}>Archived tasks are hidden and won't generate tasks</p>}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} /></div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Assigned To</label><select value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: Number(e.target.value) })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}>{users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}</select></div>
            <div><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Est. Time (hours)</label><input type="number" step="0.5" min="0" value={form.estTime || ''} onChange={e => setForm({ ...form, estTime: parseFloat(e.target.value) || 0 })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} /></div>
          </div>

          <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Frequency</label><div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{['daily', 'weekly', 'monthly', 'specific'].map(f => <button key={f} type="button" onClick={() => setForm({ ...form, frequency: f, days: [], specificDates: [] })} style={{ padding: '8px 16px', fontSize: '13px', border: form.frequency === f ? '2px solid #059669' : '1px solid #e5e7eb', borderRadius: '8px', background: form.frequency === f ? '#ecfdf5' : '#fff', color: form.frequency === f ? '#059669' : '#6b7280', cursor: 'pointer', textTransform: 'capitalize' }}>{f}</button>)}</div></div>
          {form.frequency === 'weekly' && <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Days</label><div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <button key={d} type="button" onClick={() => toggleDay(d)} style={{ padding: '6px 10px', fontSize: '12px', border: form.days.includes(d) ? '2px solid #059669' : '1px solid #e5e7eb', borderRadius: '6px', background: form.days.includes(d) ? '#ecfdf5' : '#fff', color: form.days.includes(d) ? '#059669' : '#6b7280', cursor: 'pointer' }}>{d}</button>)}</div></div>}
          {form.frequency === 'monthly' && <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Day of Month</label><select value={form.days[0] || '1'} onChange={e => setForm({ ...form, days: [e.target.value] })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}>{Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{i + 1}</option>)}</select></div>}
          {form.frequency === 'specific' && <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Dates (comma-separated)</label><input value={form.specificDates.join(', ')} onChange={e => setForm({ ...form, specificDates: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="2026-03-01, 2026-06-01" style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} /></div>}

          <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Notes</label><textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Add notes..." style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }} /></div>

          {/* Comments Section */}
          {task?.id && (
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '8px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: '#6b7280' }}>Comments ({taskComments.length})</h3>
              <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '12px' }}>
                {taskComments.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', padding: '16px' }}>No comments yet</p>
                ) : (
                  taskComments.map(c => {
                    const author = users.find(u => u.id === c.userId);
                    return (
                      <div key={c.id} style={{ marginBottom: '8px', padding: '10px', background: '#f9fafb', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <img src={author?.avatar} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                          <span style={{ fontSize: '12px', fontWeight: '600' }}>{author?.username}</span>
                          <span style={{ fontSize: '10px', color: '#9ca3af' }}>{formatTime(c.timestamp)}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#374151' }}>{c.text}</p>
                      </div>
                    );
                  })
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." onKeyDown={e => e.key === 'Enter' && handleAddComment()} style={{ flex: 1, padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }} />
                <button type="button" onClick={handleAddComment} style={{ padding: '10px 16px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><Icon name="send" size={16} /></button>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
          {task?.id ? (
            <button type="button" onClick={() => { if (confirm('Permanently delete this recurring task?')) { onDelete(task.id); onClose(); } }} style={{ padding: '10px 20px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Delete Forever</button>
          ) : <div />}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            <button type="button" onClick={() => { onSave(form); onClose(); }} style={{ padding: '10px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ ADD STEP MODAL ============
// ============ ADD PHASE MODAL - Simplified for quick multi-add ============
const AddPhaseModal = ({ isOpen, onClose, onAdd, villa, options }) => {
  const [phaseName, setPhaseName] = useState('');
  const [addedPhases, setAddedPhases] = useState([]);

  if (!isOpen) return null;

  const handleAddPhase = () => {
    if (phaseName.trim()) {
      const name = phaseName.trim();
      // Use first category as default, or "General" if none
      const mainCat = options.mainCategory[0] || 'General';
      onAdd({ mainCat, subCat: name });
      setAddedPhases(prev => [...prev, name]);
      setPhaseName('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && phaseName.trim()) {
      e.preventDefault();
      handleAddPhase();
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '16px', padding: '24px' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '600' }}>Add Phase to {villa}</h2>
        <p style={{ margin: '0 0 20px', fontSize: '12px', color: '#6b7280' }}>Type a name and press Enter. Add as many as you need.</p>

        {/* Phase Name - Quick input */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={phaseName}
              onChange={e => setPhaseName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Dig Trenches, Install Wiring..."
              style={{ flex: 1, padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddPhase}
              disabled={!phaseName.trim()}
              style={{ padding: '12px 20px', background: phaseName.trim() ? '#059669' : '#d1d5db', color: '#fff', border: 'none', borderRadius: '8px', cursor: phaseName.trim() ? 'pointer' : 'not-allowed', fontWeight: '600' }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Recently Added */}
        {addedPhases.length > 0 && (
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f0fdf4', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#059669', marginBottom: '8px' }}>Added ({addedPhases.length}):</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {addedPhases.map((p, i) => (
                <span key={i} style={{ padding: '4px 10px', background: '#fff', borderRadius: '4px', fontSize: '12px', border: '1px solid #a7f3d0' }}>{p}</span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            {addedPhases.length > 0 ? 'Done' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ EDIT PHASE MODAL ============
const EditPhaseModal = ({ phase, onClose, onRename, onDelete }) => {
  const [name, setName] = useState(phase?.subCat || '');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '16px', padding: '24px' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '600' }}>Edit Phase</h2>
        <p style={{ margin: '0 0 20px', fontSize: '12px', color: '#6b7280' }}>Renaming will update all steps in this phase</p>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Phase Name *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
          <button
            type="button"
            onClick={() => { if (confirm('Delete this phase and all its steps? This cannot be undone.')) { onDelete(phase); onClose(); } }}
            style={{ padding: '10px 16px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
          >
            Delete Phase
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 16px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
            <button
              type="button"
              onClick={() => { if (name.trim() && name.trim() !== phase.subCat) { onRename(phase, name.trim()); } onClose(); }}
              disabled={!name.trim()}
              style={{ padding: '10px 16px', background: name.trim() ? '#059669' : '#d1d5db', color: '#fff', border: 'none', borderRadius: '8px', cursor: name.trim() ? 'pointer' : 'not-allowed', fontSize: '13px' }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ WORKER MODAL ============
const WorkerModal = ({ worker, onClose, onSave, onDelete, options, setOptions }) => {
  const [form, setForm] = useState(worker || { id: '', name: '', type: 'skilled', hourlyRate: 100, status: 'active', debt: 0, debtDescription: '', repaymentFrequency: 'none' });
  const isNew = !worker?.id;

  const handleSave = () => {
    if (!form.name) return;
    const savedWorker = { ...form, id: form.id || 'w' + Date.now() };
    onSave(savedWorker);

    // Update options to include new worker name
    if (isNew) {
      const key = form.type === 'skilled' ? 'skilledWorker' : 'unskilledWorker';
      if (!options[key].includes(form.name)) {
        setOptions(prev => ({ ...prev, [key]: [...prev[key], form.name] }));
      }
    }
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '500px', background: '#fff', borderRadius: '16px', padding: '24px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}><h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{isNew ? 'Add Worker' : 'Edit Worker'}</h2><button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><Icon name="x" /></button></div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} /></div>
          <div><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}><option value="skilled">Skilled</option><option value="unskilled">Unskilled</option></select></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Hourly Rate (THB)</label><input type="number" value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: Number(e.target.value) })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} /></div>
          <div><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        </div>

        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '8px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#6b7280' }}>Debt Tracking</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Debt Amount (THB)</label><input type="number" value={form.debt} onChange={e => setForm({ ...form, debt: Number(e.target.value) })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} /></div>
            <div><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Repayment Frequency</label><select value={form.repaymentFrequency} onChange={e => setForm({ ...form, repaymentFrequency: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}><option value="none">None</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
          </div>
          <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Debt Description</label><input value={form.debtDescription} onChange={e => setForm({ ...form, debtDescription: e.target.value })} placeholder="e.g., Salary advance, Medical expense" style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} /></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
          {!isNew ? <button type="button" onClick={() => { onDelete(worker.id); onClose(); }} style={{ padding: '10px 20px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Delete</button> : <div />}
          <div style={{ display: 'flex', gap: '8px' }}><button type="button" onClick={onClose} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button><button type="button" onClick={handleSave} style={{ padding: '10px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Save</button></div>
        </div>
      </div>
    </div>
  );
};

// ============ ADD SEQUENCE MODAL ============
const AddSequenceModal = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [fromTemplate, setFromTemplate] = useState('');

  const templates = [
    { id: 'villa', name: 'Standard Villa', description: 'Foundation, Structure, MEP, Finishing' },
    { id: 'pool', name: 'Pool House', description: 'Foundation, Pool, Structure, Finishing' },
    { id: 'guest', name: 'Guest House', description: 'Foundation, Structure, Finishing' },
    { id: 'landscape', name: 'Landscaping Area', description: 'Garden, Hardscape, Irrigation' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '500px', background: '#fff', borderRadius: '16px', padding: '24px' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600' }}>Add New Project</h2>

        {/* Name Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Project Name *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter any name (e.g., Villa 4, Pool House, Garage)"
            style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
          />
          <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>You can enter any name - it doesn't have to match existing projects</p>
        </div>

        {/* Template Selection (Optional) */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Start from Template (Optional)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {templates.map(t => (
              <div
                key={t.id}
                onClick={() => setFromTemplate(fromTemplate === t.id ? '' : t.id)}
                style={{
                  padding: '12px',
                  border: fromTemplate === t.id ? '2px solid #059669' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: fromTemplate === t.id ? '#ecfdf5' : '#fff'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '600', color: fromTemplate === t.id ? '#059669' : '#1f2937' }}>{t.name}</div>
                <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>{t.description}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px', fontStyle: 'italic' }}>Templates coming soon - for now projects start empty</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
          <button
            type="button"
            onClick={() => { if (name.trim()) { onAdd(name.trim()); onClose(); } }}
            disabled={!name.trim()}
            style={{ padding: '10px 20px', background: name.trim() ? '#059669' : '#d1d5db', color: '#fff', border: 'none', borderRadius: '8px', cursor: name.trim() ? 'pointer' : 'not-allowed' }}
          >
            Add Project
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ EDIT PROJECT/ZONE MODAL ============
const EditProjectModal = ({ item, type, onClose, onSave, onDelete, onArchive, onStar }) => {
  const [name, setName] = useState(item?.label || '');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '16px', padding: '24px' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600' }}>Edit {type === 'project' ? 'Project' : 'Zone'}</h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Name *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => { onStar(item); onClose(); }}
            style={{ flex: 1, padding: '10px', background: item?.starred ? '#fef3c7' : '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}
          >
            <span>{item?.starred ? '★' : '☆'}</span> {item?.starred ? 'Unstar' : 'Star'}
          </button>
          <button
            type="button"
            onClick={() => { onArchive(item); onClose(); }}
            style={{ flex: 1, padding: '10px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}
          >
            <span>📦</span> {item?.archived ? 'Unarchive' : 'Archive'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
          <button
            type="button"
            onClick={() => { if (confirm('Delete this ' + type + '? This cannot be undone.')) { onDelete(item); onClose(); } }}
            style={{ padding: '10px 16px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
          >
            Delete
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 16px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
            <button
              type="button"
              onClick={() => { if (name.trim()) { onSave({ ...item, label: name.trim() }); onClose(); } }}
              disabled={!name.trim()}
              style={{ padding: '10px 16px', background: name.trim() ? '#059669' : '#d1d5db', color: '#fff', border: 'none', borderRadius: '8px', cursor: name.trim() ? 'pointer' : 'not-allowed', fontSize: '13px' }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ ADD ZONE MODAL ============
const AddZoneModal = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '450px', background: '#fff', borderRadius: '16px', padding: '24px' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '600' }}>Add Zone to Commons / Infrastructure</h2>
        <p style={{ margin: '0 0 20px', fontSize: '12px', color: '#6b7280' }}>Zones are sub-areas like Parking, Main Water, Gardens, etc.</p>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Zone Name *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., Swimming Pool, Garden Shed, Staff Quarters"
            style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
          <button
            type="button"
            onClick={() => { if (name.trim()) { onAdd(name.trim()); onClose(); } }}
            disabled={!name.trim()}
            style={{ padding: '10px 20px', background: name.trim() ? '#059669' : '#d1d5db', color: '#fff', border: 'none', borderRadius: '8px', cursor: name.trim() ? 'pointer' : 'not-allowed' }}
          >
            Add Zone
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ PENDING REVIEW MODAL ============
const PendingReviewModal = ({ change, onClose, onApprove, onReject, onComment, users, buildingTasks }) => {
  const [commentText, setCommentText] = useState('');
  const requestedByUser = users.find(u => u.id === change.requestedBy);
  const task = change.taskId ? buildingTasks.find(t => t.id === change.taskId) : null;

  const getChangeDescription = () => {
    if (change.type === 'edit') return `Change ${change.field} from "${change.oldValue || '(empty)'}" to "${change.newValue}"`;
    if (change.type === 'add_step') return `Add new step: "${change.newTask?.step}" to ${change.subCategory}`;
    if (change.type === 'add_phase') return `Add new phase: ${change.subCategory} (${change.mainCategory})`;
    if (change.type === 'delete') return `Delete step: "${change.step}" from ${change.subCategory}`;
    if (change.type === 'add_sequence') return `Add new building sequence: "${change.sequenceLabel}"`;
    return 'Unknown change';
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '600px', background: '#fff', borderRadius: '16px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Review Proposed Change</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><Icon name="x" /></button>
        </div>

        {/* Change Details */}
        <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <img src={requestedByUser?.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>{requestedByUser?.username}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{formatTime(change.timestamp)}</div>
            </div>
          </div>

          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#1f2937' }}>{getChangeDescription()}</div>

          {change.villa && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>📍 {change.villa} → {change.subCategory}</div>}

          {change.type === 'edit' && task && (
            <div style={{ marginTop: '12px', padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>AFFECTED TASK</div>
              <div style={{ fontSize: '13px' }}>{task.step} - {task.task}</div>
            </div>
          )}

          {change.type === 'edit' && (
            <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#dc2626', marginBottom: '4px' }}>CURRENT ({change.field})</div>
                <div style={{ fontSize: '13px', color: '#1f2937' }}>{change.oldValue || '(empty)'}</div>
              </div>
              <div style={{ padding: '12px', background: '#ecfdf5', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#059669', marginBottom: '4px' }}>PROPOSED ({change.field})</div>
                <div style={{ fontSize: '13px', color: '#1f2937' }}>{change.newValue}</div>
              </div>
            </div>
          )}
        </div>

        {/* Comments */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>Comments ({change.comments?.length || 0})</div>
          <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '12px' }}>
            {(change.comments || []).length === 0 ? (
              <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', padding: '16px' }}>No comments yet</p>
            ) : (
              change.comments.map(c => {
                const author = users.find(u => u.id === c.userId);
                return (
                  <div key={c.id} style={{ marginBottom: '8px', padding: '10px', background: '#f9fafb', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <img src={author?.avatar} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                      <span style={{ fontSize: '12px', fontWeight: '600' }}>{author?.username}</span>
                      <span style={{ fontSize: '10px', color: '#9ca3af' }}>{formatTime(c.timestamp)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#374151' }}>{c.text}</p>
                  </div>
                );
              })
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              style={{ flex: 1, padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }}
            />
            <button
              type="button"
              onClick={() => { if (commentText.trim()) { onComment(change.id, commentText); setCommentText(''); } }}
              style={{ padding: '10px 16px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              <Icon name="send" size={16} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
          <button type="button" onClick={() => { onReject(change.id); onClose(); }} style={{ padding: '10px 24px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            ✕ Reject
          </button>
          <button type="button" onClick={() => { onApprove(change.id); onClose(); }} style={{ padding: '10px 24px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            ✓ Approve & Set Live
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ BUILDING SEQUENCE COMPONENTS ============
const Dropdown = ({ value, options, onChange, placeholder, allowNew, onAddNew }) => {
  const [open, setOpen] = useState(false);
  const [newValue, setNewValue] = useState('');
  const ref = useRef(null);
  useEffect(() => { const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  const handleAddNew = () => {
    if (newValue.trim() && onAddNew) {
      onAddNew(newValue.trim());
      setNewValue('');
      setOpen(false);
    }
  };
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(!open)} style={{ width: '100%', padding: '6px 10px', fontSize: '13px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', textAlign: 'left', cursor: 'pointer', color: value ? '#1f2937' : '#9ca3af' }}>{value || placeholder}</button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '220px', overflowY: 'auto', minWidth: '150px' }}>
          {options.map((o, i) => <div key={i} onClick={() => { onChange(o); setOpen(false); }} style={{ padding: '8px 12px', cursor: 'pointer', background: o === value ? '#f3f4f6' : 'transparent', fontSize: '13px' }}>{o}</div>)}
          {allowNew && (
            <div style={{ borderTop: '1px solid #e5e7eb', padding: '8px' }}>
              <input
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddNew()}
                placeholder="Type new..."
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}
                onClick={e => e.stopPropagation()}
              />
              {newValue.trim() && (
                <button type="button" onClick={handleAddNew} style={{ width: '100%', marginTop: '4px', padding: '4px', background: '#059669', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Add "{newValue}"</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StatusDropdown = ({ value, options, onChange }) => { const [open, setOpen] = useState(false); const ref = useRef(null); const style = getStatusStyle(value); useEffect(() => { const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []); const short = s => s === 'Ready to start (Supply Chain confirmed on-site)' ? 'Ready' : s === 'Supply Chain Arrived to be Confirmed' ? 'SC Arrived' : (s || 'Set status').replace('Supply Chain Pending', 'SC'); return (<div ref={ref} style={{ position: 'relative' }}><button type="button" onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', fontSize: '12px', fontWeight: '500', background: style.bg, border: 'none', borderRadius: '6px', color: style.color, cursor: 'pointer', whiteSpace: 'nowrap' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: style.dot }} />{short(value)}</button>{open && <div style={{ position: 'absolute', top: '100%', left: 0, minWidth: '260px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 100 }}>{options.map((o, i) => { const s = getStatusStyle(o); return <div key={i} onClick={() => { onChange(o); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', cursor: 'pointer' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.dot }} />{o}</div>; })}</div>}</div>); };

const EditableCell = ({ value, onChange, placeholder }) => { const [editing, setEditing] = useState(false); const [temp, setTemp] = useState(value); const ref = useRef(null); useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]); if (editing) return <input ref={ref} value={temp} onChange={e => setTemp(e.target.value)} onBlur={() => { setEditing(false); onChange(temp); }} onKeyDown={e => e.key === 'Enter' && (setEditing(false), onChange(temp))} style={{ width: '100%', padding: '6px', fontSize: '13px', border: '1px solid #059669', borderRadius: '6px', boxSizing: 'border-box' }} />; return <div onClick={() => { setTemp(value); setEditing(true); }} style={{ padding: '6px', fontSize: '13px', color: value ? '#1f2937' : '#9ca3af', cursor: 'text', minHeight: '28px' }}>{value || placeholder}</div>; };

const MultiSelect = ({ values = [], options, onChange, placeholder }) => { const [open, setOpen] = useState(false); const ref = useRef(null); useEffect(() => { const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []); const toggle = (opt) => onChange(values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt]); return (<div ref={ref} style={{ position: 'relative' }}><button type="button" onClick={() => setOpen(!open)} style={{ width: '100%', padding: '6px 10px', fontSize: '12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', color: values.length ? '#1f2937' : '#9ca3af', minHeight: '32px' }}>{values.length ? values.join(', ') : placeholder}</button>{open && <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '200px', overflowY: 'auto' }}><div onClick={() => onChange([])} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #e5e7eb', color: '#dc2626', fontSize: '12px' }}>Clear all</div>{options.map((o, i) => <div key={i} onClick={() => toggle(o)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', cursor: 'pointer', background: values.includes(o) ? '#ecfdf5' : 'transparent' }}><span style={{ width: '16px', height: '16px', border: values.includes(o) ? '2px solid #059669' : '1px solid #d1d5db', borderRadius: '4px', background: values.includes(o) ? '#059669' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px' }}>{values.includes(o) && '✓'}</span>{o}</div>)}</div>}</div>); };

// ============ MAIN APP ============
// LocalStorage helpers (fallback when Supabase not available)
const STORAGE_KEY = 'santi_management_data';

const loadFromStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error('Error loading from localStorage:', e);
    return null;
  }
};

const saveToStorage = (data) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
};

export default function Home() {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const [users, setUsers] = useState(mockUsers);
  const [demoMode, setDemoMode] = useState(null); // null, 'patrick', or 'david'
  const [dataLoaded, setDataLoaded] = useState(false);
  const [supabaseLoading, setSupabaseLoading] = useState(true);
  const [supabaseError, setSupabaseError] = useState(null);
  const saveTimeoutRef = useRef(null);

  // Load saved data from localStorage initially (will be overwritten by Supabase if available)
  const [savedData] = useState(() => loadFromStorage());

  const [buildingTasks, setBuildingTasks] = useState(() => savedData?.buildingTasks || initialBuildingTasks);
  const [kanbanTasks, setKanbanTasks] = useState(() => savedData?.kanbanTasks || [...initialKanbanTasks, ...initialSCTasks, ...generatedRecurringTasks]);
  const [recurringTasks, setRecurringTasks] = useState(() => savedData?.recurringTasks || initialRecurringTasks);
  const [comments, setComments] = useState(() => savedData?.comments || initialComments);
  const [notifications, setNotifications] = useState(() => savedData?.notifications || initialNotifications);
  const [options, setOptions] = useState(() => savedData?.options || initialOptions);
  const [workforce, setWorkforce] = useState(() => savedData?.workforce || initialWorkforce);
  const [buildingSequences, setBuildingSequences] = useState(() => savedData?.buildingSequences || {
    standalone: [
      { id: 'villa3', label: 'Villa 3', starred: true, archived: false },
      { id: 'villa2', label: 'Villa 2', starred: false, archived: false },
      { id: 'villa1', label: 'Villa 1', starred: false, archived: false },
    ],
    commons: {
      label: 'Commons / Infrastructure',
      zones: [
        { id: 'main-electricity', label: 'Main Electricity / Internet', starred: false, archived: false },
        { id: 'gardenbed-upper', label: 'Gardenbed 1 (Upper)', starred: false, archived: false },
        { id: 'gardenbed-lower', label: 'Gardenbed 2 (Lower)', starred: false, archived: false },
        { id: 'chicken-coop', label: 'Chicken Coop', starred: false, archived: false },
        { id: 'landscaping', label: 'Landscaping', starred: false, archived: false },
      ]
    }
  });

  const [workerModal, setWorkerModal] = useState(null);
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [activeNav, setActiveNav] = useState('taskBoard');
  const [expandedNav, setExpandedNav] = useState(['buildingSequence']);
  const [selectedTaskUser, setSelectedTaskUser] = useState(null);
  const [recurringFilter, setRecurringFilter] = useState('all');
  const [taskModal, setTaskModal] = useState(null);
  const [recurringModal, setRecurringModal] = useState(null);
  const [addPhaseModal, setAddPhaseModal] = useState(false);
  const [addSequenceModal, setAddSequenceModal] = useState(false);
  const [addZoneModal, setAddZoneModal] = useState(false);
  const [editProjectModal, setEditProjectModal] = useState(null); // { item, type: 'project'|'zone' }
  const [editPhaseModal, setEditPhaseModal] = useState(null); // { subCat, mainCat, villa }
  const [showArchived, setShowArchived] = useState(false);
  const [showArchivedRecurring, setShowArchivedRecurring] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(() => savedData?.pendingChanges || []);
  const [pendingReviewModal, setPendingReviewModal] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragOverTaskId, setDragOverTaskId] = useState(null);
  const [search, setSearch] = useState('');
  const [activeComments, setActiveComments] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [draggedRow, setDraggedRow] = useState(null);
  const [dragOverRow, setDragOverRow] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentUser = demoMode ? users.find(u => u.username.toLowerCase() === demoMode) || users[0] : clerkUser ? users.find(u => u.email === clerkUser.primaryEmailAddress?.emailAddress) || { id: 999, email: clerkUser.primaryEmailAddress?.emailAddress || 'unknown', username: clerkUser.firstName || 'User', avatar: clerkUser.imageUrl || 'https://ui-avatars.com/api/?name=User&background=059669&color=fff', role: 'worker', isAdmin: false, managerId: 1 } : null;

  // Close sidebar on mobile by default
  useEffect(() => { if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false); }, []);

  // Sync Clerk user to Supabase profiles when logged in
  useEffect(() => {
    const syncClerkUser = async () => {
      if (!isSignedIn || !clerkUser || demoMode) return;

      try {
        const email = clerkUser.primaryEmailAddress?.emailAddress;
        if (!email) return;

        // Check if user already exists in mockUsers (skip sync for demo users)
        if (mockUsers.some(u => u.email === email)) {
          console.log('📝 User exists in mockUsers, skipping Supabase sync');
          return;
        }

        // Check if profile already exists in Supabase
        const existingProfile = await db.profiles.getByEmail(email);

        // Only upsert basic info, preserve existing role
        const profileData = {
          email,
          username: clerkUser.firstName || clerkUser.username || email.split('@')[0],
          avatarUrl: clerkUser.imageUrl,
        };

        // Only set default role for new users
        if (!existingProfile) {
          profileData.role = 'worker';
        }

        // Upsert to Supabase profiles
        const profile = await db.profiles.upsert(profileData);

        if (profile) {
          // Add to local users state if not already there
          setUsers(prev => {
            if (prev.some(u => u.email === email)) return prev;
            return [...prev, {
              id: profile.id,
              email: profile.email,
              username: profile.username,
              avatar: profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username)}&background=059669&color=fff`,
              role: profile.role || 'worker',
              isAdmin: profile.role === 'manager',
              managerId: profile.managerId,
            }];
          });
          console.log('✅ Synced Clerk user to Supabase:', email, 'role:', profile.role);
        }
      } catch (err) {
        console.error('❌ Error syncing Clerk user to Supabase:', err);
      }
    };

    syncClerkUser();
  }, [isSignedIn, clerkUser, demoMode]);

  // Load data from Supabase on mount
  useEffect(() => {
    const loadFromSupabase = async () => {
      try {
        setSupabaseLoading(true);
        setSupabaseError(null);

        const data = await db.loadAllData();

        // Only update state if we got data back
        if (data.buildingTasks && data.buildingTasks.length > 0) {
          setBuildingTasks(data.buildingTasks);
        }
        if (data.kanbanTasks && data.kanbanTasks.length > 0) {
          setKanbanTasks(data.kanbanTasks);
        }
        if (data.recurringTasks && data.recurringTasks.length > 0) {
          setRecurringTasks(data.recurringTasks);
        }
        if (data.comments && Object.keys(data.comments).length > 0) {
          setComments(data.comments);
        }
        if (data.workforce && data.workforce.length > 0) {
          setWorkforce(data.workforce);
        }
        if (data.options && Object.keys(data.options).length > 0) {
          setOptions(data.options);
        }
        if (data.buildingSequences && data.buildingSequences.standalone) {
          setBuildingSequences(data.buildingSequences);
        }

        // Load profiles and merge with mockUsers (keep mockUsers as fallback for numeric IDs)
        if (data.profiles && data.profiles.length > 0) {
          const supabaseUsers = data.profiles.map(p => ({
            id: p.id, // UUID from Supabase
            email: p.email,
            username: p.username,
            avatar: p.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.username)}&background=059669&color=fff`,
            role: p.role || 'worker',
            isAdmin: p.role === 'manager',
            managerId: p.managerId,
          }));
          // Merge: mockUsers as base, append real users from Supabase
          const existingEmails = mockUsers.map(u => u.email);
          const newUsers = supabaseUsers.filter(u => !existingEmails.includes(u.email));
          setUsers([...mockUsers, ...newUsers]);
          console.log(`✅ Loaded ${supabaseUsers.length} profiles from Supabase`);
        }

        console.log('✅ Loaded data from Supabase');
        setDataLoaded(true);
      } catch (err) {
        console.error('❌ Error loading from Supabase:', err);
        setSupabaseError(err.message);
        // Fall back to localStorage data (already loaded)
        console.log('📦 Using localStorage fallback');
      } finally {
        setSupabaseLoading(false);
      }
    };

    loadFromSupabase();
  }, []);

  // Save data to Supabase (debounced) and localStorage whenever key state changes
  useEffect(() => {
    // Always save to localStorage immediately
    saveToStorage({
      buildingTasks,
      kanbanTasks,
      recurringTasks,
      comments,
      notifications,
      options,
      workforce,
      buildingSequences,
      pendingChanges
    });

    // Debounce Supabase saves to avoid too many requests
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await db.saveAllData({
          buildingTasks,
          kanbanTasks,
          recurringTasks,
          workforce,
          options,
          buildingSequences
        });
        console.log('💾 Saved to Supabase');
      } catch (err) {
        console.error('❌ Error saving to Supabase:', err);
      }
    }, 2000); // Wait 2 seconds after last change before saving

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [buildingTasks, kanbanTasks, recurringTasks, comments, notifications, options, workforce, buildingSequences, pendingChanges]);

  if (!isLoaded || supabaseLoading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)' }}><div style={{ color: '#fff', fontSize: '18px' }}>{supabaseLoading ? '🔄 Syncing with database...' : 'Loading...'}</div>{supabaseError && <div style={{ color: '#fef3c7', fontSize: '14px' }}>⚠️ Using offline mode</div>}</div>;
  if (!isSignedIn && !demoMode) return <LoginScreen onDemoLogin={(user) => setDemoMode(user)} />;

  const isManager = currentUser.role === 'manager';

  // ============ APPROVAL WORKFLOW ============
  const proposeChange = (type, data) => {
    const change = {
      id: 'pc' + Date.now(),
      type, // 'edit', 'add_step', 'add_phase', 'delete', 'reorder', 'add_sequence'
      ...data,
      requestedBy: currentUser.id,
      timestamp: new Date().toISOString(),
      status: 'pending',
      comments: []
    };
    setPendingChanges(prev => [...prev, change]);
    // Create task for admin to review
    setKanbanTasks(prev => [...prev, {
      id: 'review' + Date.now(),
      title: `Review: ${type} by ${currentUser.username}`,
      assignedTo: 1, // Patrick
      column: 'today',
      dueDate: TODAY,
      type: 'manual',
      estTime: 0.5,
      actualTime: null,
      linkedChangeId: change.id,
      createdAt: TODAY
    }]);
    setNotifications(prev => [...prev, {
      id: Date.now(),
      userId: 1, // Patrick
      fromUserId: currentUser.id,
      text: `${currentUser.username} proposed a change to Building Sequence`,
      timestamp: new Date().toISOString(),
      read: false
    }]);
  };

  const approveChange = (changeId) => {
    const change = pendingChanges.find(c => c.id === changeId);
    if (!change) return;

    // Apply the change
    if (change.type === 'edit') {
      setBuildingTasks(prev => prev.map(t => t.id === change.taskId ? { ...t, [change.field]: change.newValue } : t));
    } else if (change.type === 'add_step') {
      setBuildingTasks(prev => [...prev, change.newTask]);
    } else if (change.type === 'add_phase') {
      setBuildingTasks(prev => [...prev, change.newTask]);
    } else if (change.type === 'delete') {
      setBuildingTasks(prev => prev.filter(t => t.id !== change.taskId));
    } else if (change.type === 'add_sequence') {
      setBuildingSequences(prev => [...prev, { id: change.sequenceId, label: change.sequenceLabel }]);
    }

    // Mark as approved
    setPendingChanges(prev => prev.map(c => c.id === changeId ? { ...c, status: 'approved' } : c));
    // Remove review task
    setKanbanTasks(prev => prev.filter(t => t.linkedChangeId !== changeId));
  };

  const rejectChange = (changeId) => {
    setPendingChanges(prev => prev.map(c => c.id === changeId ? { ...c, status: 'rejected' } : c));
    setKanbanTasks(prev => prev.filter(t => t.linkedChangeId !== changeId));
  };

  const addChangeComment = (changeId, text) => {
    setPendingChanges(prev => prev.map(c => c.id === changeId ? {
      ...c,
      comments: [...c.comments, { id: Date.now(), userId: currentUser.id, text, timestamp: new Date().toISOString() }]
    } : c));
  };

  // Wrapper for building task edits - routes through approval if not admin
  const editBuildingTask = (taskId, field, newValue) => {
    const task = buildingTasks.find(t => t.id === taskId);
    if (!task) return;

    if (currentUser.isAdmin) {
      // Admin: apply immediately
      setBuildingTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: newValue } : t));
    } else {
      // Non-admin: propose change
      proposeChange('edit', {
        taskId,
        villa: task.villa,
        subCategory: task.subCategory,
        step: task.step,
        field,
        oldValue: task[field],
        newValue
      });
    }
  };

  const handleBuildingStatusChange = (taskId, newStatus, oldStatus) => {
    if (currentUser.isAdmin) {
      setBuildingTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      if (newStatus === 'Supply Chain Pending Order' && oldStatus !== 'Supply Chain Pending Order') {
        const task = buildingTasks.find(t => t.id === taskId);
        if (task && !kanbanTasks.find(kt => kt.type === 'sc' && kt.buildingTaskId === taskId)) {
          setKanbanTasks(prev => [...prev, { id: 'sc' + Date.now(), buildingTaskId: taskId, title: `SC: ${task.step} - ${task.task} - ${task.villa}`, assignedTo: PROCUREMENT_USER_ID, column: 'thisWeek', scStatus: 'research', dueDate: calculateDeadlineOnSite(task.earliestStart), deadlineOnSite: calculateDeadlineOnSite(task.earliestStart), expectedArrival: '', type: 'sc', estTime: 2, actualTime: null, createdAt: TODAY }]);
        }
      }
    } else {
      // Non-admin: propose status change
      const task = buildingTasks.find(t => t.id === taskId);
      proposeChange('edit', {
        taskId,
        villa: task?.villa,
        subCategory: task?.subCategory,
        step: task?.step,
        field: 'status',
        oldValue: oldStatus,
        newValue: newStatus
      });
    }
  };

  const getVisibleTasks = () => {
    let tasks = kanbanTasks;

    // Determine which user we're filtering for
    const filterUserId = selectedTaskUser === 'all' ? null : (selectedTaskUser || currentUser.id);

    if (filterUserId === null) {
      // "All Tasks" view - show everything
      return tasks;
    }

    // Filter for specific user: show tasks assigned to them OR tasks in "review" that need their review (if they're a manager)
    const userIsManager = users.find(u => u.id === filterUserId)?.role === 'manager';

    tasks = tasks.filter(t => {
      // Always include tasks assigned to this user
      if (t.assignedTo === filterUserId) return true;

      // For managers: also include "To Be Reviewed" tasks from their reports (tasks not assigned to them)
      if (userIsManager && t.column === 'review' && t.assignedTo !== filterUserId) return true;

      return false;
    });

    return tasks;
  };
  const visibleTasks = getVisibleTasks();
  const columns = [{ id: 'today', title: 'Today' }, { id: 'thisWeek', title: 'This Week' }, { id: 'waiting', title: 'Waiting / Follow-up' }, { id: 'review', title: 'To Be Reviewed' }, { id: 'later', title: 'Later' }, { id: 'done', title: 'Done' }];

  const handleDrop = (columnId) => {
    if (draggedTask) {
      const fromColumn = draggedTask.column;
      setKanbanTasks(prev => prev.map(t => t.id === draggedTask.id ? {
        ...t,
        column: columnId,
        completedAt: columnId === 'done' ? new Date().toISOString() : t.completedAt,
        statusHistory: [...(t.statusHistory || []), { from: fromColumn, to: columnId, userId: currentUser.id, timestamp: new Date().toISOString() }]
      } : t));
      setDraggedTask(null);
      setDragOverColumn(null);
      setDragOverTaskId(null);
    }
  };

  const handleQuickMove = (task, toColumn) => {
    const fromColumn = task.column;
    setKanbanTasks(prev => prev.map(t => t.id === task.id ? {
      ...t,
      column: toColumn,
      completedAt: toColumn === 'done' ? new Date().toISOString() : t.completedAt,
      statusHistory: [...(t.statusHistory || []), { from: fromColumn, to: toColumn, userId: currentUser.id, timestamp: new Date().toISOString() }]
    } : t));
  };
  const handleTaskUpdate = (updated) => { setKanbanTasks(prev => prev.map(t => t.id === updated.id ? updated : t)); if (updated.type === 'sc' && updated.buildingTaskId) { if (updated.scStatus === 'pendingArrival') setBuildingTasks(prev => prev.map(t => t.id === updated.buildingTaskId ? { ...t, status: 'Supply Chain Pending Arrival', expectedArrival: updated.expectedArrival } : t)); if (updated.scStatus === 'readyToStart' || updated.column === 'done') setBuildingTasks(prev => prev.map(t => t.id === updated.buildingTaskId ? { ...t, status: 'Ready to start (Supply Chain confirmed on-site)' } : t)); } };
  const handleTaskDelete = (id) => setKanbanTasks(prev => prev.filter(t => t.id !== id));
  const handleAddTask = () => { const newTask = { id: 'k' + Date.now(), title: 'New Task', assignedTo: currentUser.id, column: 'today', dueDate: TODAY, type: 'manual', createdAt: TODAY }; setKanbanTasks(prev => [...prev, newTask]); setTaskModal(newTask); };
  const handleRecurringSave = (task) => { if (task.id) { setRecurringTasks(prev => prev.map(t => t.id === task.id ? task : t)); } else { setRecurringTasks(prev => [...prev, { ...task, id: 'r' + Date.now(), createdAt: TODAY }]); } };
  const handleRecurringDelete = (id) => setRecurringTasks(prev => prev.filter(t => t.id !== id));
  const handleDuplicateRecurring = (task) => {
    const newTask = { ...task, id: 'r' + Date.now(), title: task.title + ' (copy)', createdAt: TODAY };
    setRecurringTasks(prev => [...prev, newTask]);
    setRecurringModal(newTask); // Open modal to edit the copy
  };

  const handleRowDragStart = (e, task, subCat) => { setDraggedRow({ ...task, subCategory: subCat }); e.dataTransfer.effectAllowed = 'move'; };
  const handleRowDragOver = (e, task) => { e.preventDefault(); if (draggedRow && task.id !== draggedRow.id) setDragOverRow(task.id); };
  const handleRowDrop = (e, targetTask, catTasks) => { e.preventDefault(); if (!draggedRow || draggedRow.subCategory !== targetTask.subCategory) { setDraggedRow(null); setDragOverRow(null); return; } const fromIndex = catTasks.findIndex(t => t.id === draggedRow.id); const toIndex = catTasks.findIndex(t => t.id === targetTask.id); if (fromIndex !== -1 && toIndex !== -1) { const newOrder = [...catTasks]; const [moved] = newOrder.splice(fromIndex, 1); newOrder.splice(toIndex, 0, moved); setBuildingTasks(prev => { const updated = [...prev]; newOrder.forEach((t, i) => { const idx = updated.findIndex(x => x.id === t.id); if (idx !== -1) updated[idx] = { ...updated[idx], order: i + 1 }; }); return updated; }); } setDraggedRow(null); setDragOverRow(null); };
  const handleDeleteBuildingTask = (id) => {
    if (currentUser.isAdmin) {
      setBuildingTasks(prev => prev.filter(t => t.id !== id));
    } else {
      const task = buildingTasks.find(t => t.id === id);
      proposeChange('delete', { taskId: id, villa: task?.villa, subCategory: task?.subCategory, step: task?.step });
    }
  };
  // Add blank step directly (no modal)
  const handleAddStep = (subCat) => {
    const tasksInPhase = buildingTasks.filter(t => t.villa === currentVilla && t.subCategory === subCat);
    const maxOrder = Math.max(0, ...tasksInPhase.map(t => t.order));
    const mainCat = tasksInPhase[0]?.mainCategory || '2 Foundation';
    const newTask = { id: Date.now(), order: maxOrder + 1, villa: currentVilla, mainCategory: mainCat, subCategory: subCat, task: '', step: '', notes: '', status: 'Ready to start (Supply Chain confirmed on-site)', expectedArrival: '', earliestStart: '', skilledWorkers: [], unskilledWorkers: [], duration: '' };
    if (currentUser.isAdmin) {
      setBuildingTasks(prev => [...prev, newTask]);
    } else {
      proposeChange('add_step', { villa: currentVilla, subCategory: subCat, newTask });
    }
  };

  // Duplicate an existing step (copy task, workers, etc.)
  const handleDuplicateStep = (sourceTask) => {
    const tasksInPhase = buildingTasks.filter(t => t.villa === currentVilla && t.subCategory === sourceTask.subCategory);
    const maxOrder = Math.max(0, ...tasksInPhase.map(t => t.order));
    const newTask = {
      ...sourceTask,
      id: Date.now(),
      order: maxOrder + 1,
      step: sourceTask.step + ' (copy)',
      status: 'Ready to start (Supply Chain confirmed on-site)',
      expectedArrival: '',
      earliestStart: ''
    };
    if (currentUser.isAdmin) {
      setBuildingTasks(prev => [...prev, newTask]);
    } else {
      proposeChange('add_step', { villa: currentVilla, subCategory: sourceTask.subCategory, newTask });
    }
  };

  const handleAddPhase = (data) => {
    const newTask = { id: Date.now(), order: 1, villa: currentVilla, mainCategory: data.mainCat, subCategory: data.subCat, task: '', step: '', notes: '', status: 'Ready to start (Supply Chain confirmed on-site)', expectedArrival: '', earliestStart: '', skilledWorkers: [], unskilledWorkers: [], duration: '' };
    if (currentUser.isAdmin) {
      setBuildingTasks(prev => [...prev, newTask]);
    } else {
      proposeChange('add_phase', { villa: currentVilla, mainCategory: data.mainCat, subCategory: data.subCat, newTask });
    }
  };

  const handleRenamePhase = (phase, newName) => {
    // Rename the subCategory for all tasks in this phase/villa
    setBuildingTasks(prev => prev.map(t =>
      (t.villa === phase.villa && t.subCategory === phase.subCat)
        ? { ...t, subCategory: newName }
        : t
    ));
    // Also update options.task to move task options to new name
    setOptions(prev => {
      const newTaskOptions = { ...prev.task };
      if (newTaskOptions[phase.subCat]) {
        newTaskOptions[newName] = newTaskOptions[phase.subCat];
        delete newTaskOptions[phase.subCat];
      }
      return { ...prev, task: newTaskOptions };
    });
  };

  const handleDeletePhase = (phase) => {
    // Delete all tasks in this phase/villa
    setBuildingTasks(prev => prev.filter(t =>
      !(t.villa === phase.villa && t.subCategory === phase.subCat)
    ));
  };

  const handleAddSequence = (label) => {
    const id = label.toLowerCase().replace(/\s+/g, '-');
    if (currentUser.isAdmin) {
      setBuildingSequences(prev => ({
        ...prev,
        standalone: [...prev.standalone, { id, label, starred: false, archived: false }]
      }));
    } else {
      proposeChange('add_sequence', { sequenceId: id, sequenceLabel: label });
    }
  };

  const handleAddZone = (label) => {
    const id = label.toLowerCase().replace(/\s+/g, '-');
    setBuildingSequences(prev => ({
      ...prev,
      commons: {
        ...prev.commons,
        zones: [...prev.commons.zones, { id, label, starred: false, archived: false }]
      }
    }));
    // Navigate to the new zone
    setActiveNav(`zone-${id}`);
  };

  // Project/Zone management handlers
  const handleUpdateProject = (updated) => {
    setBuildingSequences(prev => ({
      ...prev,
      standalone: prev.standalone.map(s => s.id === updated.id ? updated : s)
    }));
  };

  const handleDeleteProject = (item) => {
    setBuildingSequences(prev => ({
      ...prev,
      standalone: prev.standalone.filter(s => s.id !== item.id)
    }));
    // Navigate away if we deleted the current project
    if (activeNav === `project-${item.id}`) setActiveNav('taskBoard');
  };

  const handleArchiveProject = (item) => {
    setBuildingSequences(prev => ({
      ...prev,
      standalone: prev.standalone.map(s => s.id === item.id ? { ...s, archived: !s.archived } : s)
    }));
  };

  const handleStarProject = (item) => {
    setBuildingSequences(prev => ({
      ...prev,
      standalone: prev.standalone.map(s => s.id === item.id ? { ...s, starred: !s.starred } : s)
    }));
  };

  const handleUpdateZone = (updated) => {
    setBuildingSequences(prev => ({
      ...prev,
      commons: { ...prev.commons, zones: prev.commons.zones.map(z => z.id === updated.id ? updated : z) }
    }));
  };

  const handleDeleteZone = (item) => {
    setBuildingSequences(prev => ({
      ...prev,
      commons: { ...prev.commons, zones: prev.commons.zones.filter(z => z.id !== item.id) }
    }));
    if (activeNav === `zone-${item.id}`) setActiveNav('taskBoard');
  };

  const handleArchiveZone = (item) => {
    setBuildingSequences(prev => ({
      ...prev,
      commons: { ...prev.commons, zones: prev.commons.zones.map(z => z.id === item.id ? { ...z, archived: !z.archived } : z) }
    }));
  };

  const handleStarZone = (item) => {
    setBuildingSequences(prev => ({
      ...prev,
      commons: { ...prev.commons, zones: prev.commons.zones.map(z => z.id === item.id ? { ...z, starred: !z.starred } : z) }
    }));
  };

  const pendingCount = pendingChanges.filter(p => p.status === 'pending').length;

  // Sort and filter projects/zones
  const sortedProjects = [...buildingSequences.standalone]
    .filter(s => showArchived || !s.archived)
    .sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0));
  const sortedZones = [...buildingSequences.commons.zones]
    .filter(z => showArchived || !z.archived)
    .sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0));
  const archivedProjectCount = buildingSequences.standalone.filter(s => s.archived).length;
  const archivedZoneCount = buildingSequences.commons.zones.filter(z => z.archived).length;
  const totalArchived = archivedProjectCount + archivedZoneCount;

  // Build nav items from new structure
  const navItems = [
    { id: 'taskBoard', label: 'Task Board', icon: 'kanban' },
    { id: 'recurring', label: 'Recurring Tasks', icon: 'repeat' },
    // Building Sequence - parent that contains everything
    {
      id: 'buildingSequence',
      label: 'Building Sequence',
      icon: 'list',
      subItems: [
        // Standalone projects (sorted: starred first, filtered: hide archived)
        ...sortedProjects.map(s => ({
          id: `project-${s.id}`,
          label: s.label,
          type: 'project',
          starred: s.starred,
          archived: s.archived,
          itemData: s
        })),
        // Add Project button (admin only)
        ...(currentUser.isAdmin ? [{ id: 'add-project', label: '+ Add Project', isAddProject: true }] : []),
        // Section header for Commons
        { id: 'commons-header', label: buildingSequences.commons.label, isHeader: true },
        // Zones under Commons (sorted: starred first, filtered: hide archived)
        ...sortedZones.map(z => ({
          id: `zone-${z.id}`,
          label: z.label,
          type: 'zone',
          starred: z.starred,
          archived: z.archived,
          itemData: z
        })),
        // Add Zone button (admin only)
        ...(currentUser.isAdmin ? [{ id: 'add-zone', label: '+ Add Zone', isAddZone: true }] : []),
        // Show/Hide Archived toggle (if there are archived items)
        ...(totalArchived > 0 ? [{ id: 'toggle-archived', label: showArchived ? 'Hide Archived' : `Show Archived (${totalArchived})`, isToggleArchived: true }] : [])
      ]
    },
    // Pending Approvals for admin (always visible)
    ...(currentUser.isAdmin ? [{ id: 'pendingApprovals', label: 'Pending Approvals', icon: 'check', badge: pendingCount }] : []),
    // My Suggestions for non-admin
    ...(!currentUser.isAdmin ? [{ id: 'mySuggestions', label: 'My Suggestions', icon: 'edit', badge: pendingChanges.filter(p => p.requestedBy === currentUser.id && p.status === 'pending').length }] : []),
    { id: 'schedule', label: 'Daily Worker Schedule', icon: 'calendar' },
    { id: 'workers', label: 'Workforce', icon: 'users' },
    { id: 'materials', label: 'Materials', icon: 'package' },
    { id: 'reports', label: 'Reports', icon: 'chart' }
  ];

  // Get current project/zone name for filtering
  const getCurrentProject = () => {
    // Standalone projects
    if (activeNav.startsWith('project-')) {
      const projectId = activeNav.replace('project-', '');
      const project = buildingSequences.standalone.find(s => s.id === projectId);
      return project?.label || null;
    }
    // Zone projects under Commons
    if (activeNav.startsWith('zone-')) {
      const zoneId = activeNav.replace('zone-', '');
      const zone = buildingSequences.commons.zones.find(z => z.id === zoneId);
      return zone?.label || null;
    }
    return null;
  };

  const currentProject = getCurrentProject();
  const currentVilla = currentProject; // Keep for backward compatibility with buildingTasks.villa field
  const filteredBuildingTasks = currentProject ? buildingTasks.filter(t => t.villa === currentProject).filter(t => !search || t.step.toLowerCase().includes(search.toLowerCase()) || t.task.toLowerCase().includes(search.toLowerCase())) : [];
  
  // Get pending tasks for this project (add_step and add_phase)
  const pendingTasksForProject = pendingChanges
    .filter(c => c.status === 'pending' && c.villa === currentProject && (c.type === 'add_step' || c.type === 'add_phase'))
    .map(c => ({
      ...c.newTask,
      isPending: true,
      changeId: c.id,
      requestedBy: c.requestedBy,
      pendingType: c.type
    }));
  
  // Combine approved and pending tasks
  const allTasksForProject = [...filteredBuildingTasks, ...pendingTasksForProject];
  
  const grouped = allTasksForProject.reduce((acc, t) => { (acc[t.subCategory] = acc[t.subCategory] || []).push(t); return acc; }, {});
  Object.keys(grouped).forEach(k => grouped[k].sort((a, b) => (a.order || 999) - (b.order || 999)));

  const unreadCount = notifications.filter(n => n.userId === currentUser.id && !n.read).length;
  const activeTask = activeComments ? buildingTasks.find(t => t.id === activeComments) : null;
  const filteredRecurring = recurringTasks
    .filter(rt => showArchivedRecurring || rt.status !== 'archived')
    .filter(rt => recurringFilter === 'all' || rt.assignedTo === Number(recurringFilter));

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', background: '#f3f4f6' }}>
      {/* Mobile Header */}
      <div style={{ display: sidebarOpen ? 'none' : 'flex', position: 'fixed', top: 0, left: 0, right: 0, height: '60px', background: '#fff', borderBottom: '1px solid #e5e7eb', alignItems: 'center', padding: '0 16px', zIndex: 900, gap: '12px' }}>
        <button type="button" onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}><Icon name="menu" size={24} /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #065f46, #10b981)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Icon name="leaf" size={16} /></div><span style={{ fontWeight: '600', fontSize: '15px' }}>Santi</span></div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 999 }} />}

      {/* Sidebar */}
      <aside style={{ width: '260px', minWidth: '260px', background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: sidebarOpen ? 0 : '-260px', bottom: 0, zIndex: 1000, transition: 'left 0.3s ease' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #065f46, #10b981)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Icon name="leaf" size={20} /></div><div><div style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937' }}>Santi</div><div style={{ fontSize: '11px', color: '#6b7280' }}>Sustainable Dev</div></div></div>
          <button type="button" onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}><Icon name="x" size={20} /></button>
        </div>
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#f9fafb', borderRadius: '10px' }}><img src={currentUser.avatar} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%' }} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: '13px', fontWeight: '600' }}>{currentUser.username}</div><div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'capitalize' }}>{currentUser.role}</div></div><button type="button" onClick={() => setShowNotifications(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', position: 'relative', padding: '4px' }}><Icon name="bell" size={18} />{unreadCount > 0 && <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '16px', height: '16px', background: '#dc2626', color: '#fff', borderRadius: '50%', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' }}>{unreadCount}</span>}</button>{demoMode ? <button type="button" onClick={() => setDemoMode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><Icon name="logout" size={18} /></button> : <SignOutButton><button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><Icon name="logout" size={18} /></button></SignOutButton>}</div></div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>{navItems.map(item => (<div key={item.id}>
          <button type="button" onClick={() => {
            if (item.subItems) {
              setExpandedNav(p => p.includes(item.id) ? p.filter(x => x !== item.id) : [...p, item.id]);
            } else {
              setActiveNav(item.id);
              if (window.innerWidth < 768) setSidebarOpen(false);
            }
          }} style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
            background: activeNav === item.id ? '#ecfdf5' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            color: activeNav === item.id ? '#059669' : '#4b5563',
            marginBottom: '4px'
          }}>
            <Icon name={item.icon} size={18} />
            <span style={{ flex: 1, textAlign: 'left', fontSize: '14px', fontWeight: '500' }}>{item.label}</span>
            {item.badge > 0 && <span style={{ minWidth: '20px', height: '20px', background: item.id === 'pendingApprovals' ? '#dc2626' : '#f59e0b', color: '#fff', borderRadius: '10px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>{item.badge}</span>}
            {item.badge === 0 && (item.id === 'pendingApprovals' || item.id === 'mySuggestions') && <span style={{ fontSize: '11px', color: '#9ca3af' }}>✓</span>}
            {item.subItems && <Icon name={expandedNav.includes(item.id) ? 'chevronDown' : 'chevronRight'} size={16} />}
          </button>
          {item.subItems && expandedNav.includes(item.id) && (
            <div style={{ marginLeft: '16px', marginBottom: '8px' }}>
              {item.subItems.map(sub => {
                // Section header (Commons / Infrastructure)
                if (sub.isHeader) {
                  return (
                    <div key={sub.id} style={{ padding: '10px 12px 6px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '8px', borderTop: '1px solid #e5e7eb' }}>{sub.label}</div>
                  );
                }
                // Add Project button
                if (sub.isAddProject) {
                  return (
                    <button key={sub.id} type="button" onClick={() => setAddSequenceModal(true)} style={{ width: '100%', padding: '6px 12px', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#059669', fontSize: '12px', textAlign: 'left', marginBottom: '2px', fontWeight: '600' }}>{sub.label}</button>
                  );
                }
                // Add Zone button
                if (sub.isAddZone) {
                  return (
                    <button key={sub.id} type="button" onClick={() => setAddZoneModal(true)} style={{ width: '100%', padding: '6px 12px 6px 24px', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#059669', fontSize: '12px', textAlign: 'left', marginBottom: '2px', fontWeight: '600' }}>{sub.label}</button>
                  );
                }
                // Toggle archived button
                if (sub.isToggleArchived) {
                  return (
                    <button key={sub.id} type="button" onClick={() => setShowArchived(!showArchived)} style={{ width: '100%', padding: '6px 12px', background: 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#9ca3af', fontSize: '11px', textAlign: 'left', marginBottom: '2px', marginTop: '8px' }}>{sub.label}</button>
                  );
                }
                // Zone item (indented more) - with star and edit
                if (sub.type === 'zone') {
                  return (
                    <div key={sub.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '2px', position: 'relative' }} className="nav-item-hover">
                      <button type="button" onClick={() => { setActiveNav(sub.id); if (window.innerWidth < 768) setSidebarOpen(false); }} style={{ flex: 1, padding: '6px 12px 6px 24px', background: activeNav === sub.id ? '#ecfdf5' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', color: sub.archived ? '#d1d5db' : (activeNav === sub.id ? '#059669' : '#6b7280'), fontSize: '13px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px', fontStyle: sub.archived ? 'italic' : 'normal' }}>
                        {sub.starred && <span style={{ color: '#f59e0b', fontSize: '11px' }}>★</span>}
                        {sub.label}
                        {sub.archived && <span style={{ fontSize: '10px', color: '#9ca3af' }}>(archived)</span>}
                      </button>
                      {currentUser.isAdmin && (
                        <button type="button" onClick={(e) => { e.stopPropagation(); setEditProjectModal({ item: sub.itemData, type: 'zone' }); }} style={{ padding: '4px 6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '14px', opacity: 0.5 }} onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.5}>⋮</button>
                      )}
                    </div>
                  );
                }
                // Regular project item - with star and edit
                return (
                  <div key={sub.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '2px', position: 'relative' }} className="nav-item-hover">
                    <button type="button" onClick={() => { setActiveNav(sub.id); if (window.innerWidth < 768) setSidebarOpen(false); }} style={{ flex: 1, padding: '6px 12px', background: activeNav === sub.id ? '#ecfdf5' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer', color: sub.archived ? '#d1d5db' : (activeNav === sub.id ? '#059669' : '#6b7280'), fontSize: '13px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: activeNav === sub.id ? '600' : '400', fontStyle: sub.archived ? 'italic' : 'normal' }}>
                      {sub.starred && <span style={{ color: '#f59e0b', fontSize: '11px' }}>★</span>}
                      {sub.label}
                      {sub.archived && <span style={{ fontSize: '10px', color: '#9ca3af' }}>(archived)</span>}
                    </button>
                    {currentUser.isAdmin && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); setEditProjectModal({ item: sub.itemData, type: 'project' }); }} style={{ padding: '4px 6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '14px', opacity: 0.5 }} onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.5}>⋮</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>))}</div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '24px', marginLeft: sidebarOpen ? '260px' : '0', paddingTop: sidebarOpen ? '24px' : '84px', transition: 'margin-left 0.3s ease' }}>
        {/* Task Board */}
        {activeNav === 'taskBoard' && (<><div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}><div><h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Task Board</h1><p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{selectedTaskUser === 'all' ? 'All Tasks' : users.find(u => u.id === (selectedTaskUser || currentUser.id))?.username + "'s Tasks"}</p></div><select value={selectedTaskUser || currentUser.id} onChange={e => setSelectedTaskUser(e.target.value === 'all' ? 'all' : Number(e.target.value))} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', background: '#fff' }}>{isManager && <option value="all">All Tasks</option>}{users.map(u => <option key={u.id} value={u.id}>{u.username}{u.id === currentUser.id ? ' (me)' : ''}</option>)}</select></div><button type="button" onClick={handleAddTask} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}><Icon name="plus" size={18} /> Add Task</button></div><div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>{columns.map(col => <KanbanColumn key={col.id} id={col.id} title={col.title} tasks={visibleTasks.filter(t => t.column === col.id)} onDrop={handleDrop} onDragOver={setDragOverColumn} users={users} onTaskClick={setTaskModal} onDragStart={(e, task) => setDraggedTask(task)} dragOverColumn={dragOverColumn} dragOverTaskId={dragOverTaskId} setDragOverTaskId={setDragOverTaskId} currentUserId={currentUser.id} onQuickMove={handleQuickMove} columns={columns} />)}</div></>)}

        {/* Recurring Tasks */}
        {activeNav === 'recurring' && (<><div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}><div><h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Recurring Tasks</h1><p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{filteredRecurring.filter(rt => rt.status !== 'archived').length} active, {recurringTasks.filter(rt => rt.status === 'archived').length} archived</p></div><select value={recurringFilter} onChange={e => setRecurringFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', background: '#fff' }}><option value="all">All People</option>{users.map(u => <option key={u.id} value={u.id}>{u.username}{u.id === currentUser.id ? ' (me)' : ''}</option>)}</select><label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', cursor: 'pointer' }}><input type="checkbox" checked={showArchivedRecurring} onChange={e => setShowArchivedRecurring(e.target.checked)} style={{ cursor: 'pointer' }} />Show archived</label></div><button type="button" onClick={() => setRecurringModal({})} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}><Icon name="plus" size={18} /> Add</button></div>
          {['daily', 'weekly', 'monthly', 'specific'].map(freq => {
            const freqTasks = filteredRecurring.filter(rt => rt.frequency === freq); if (freqTasks.length === 0) return null; return (<div key={freq} style={{ marginBottom: '24px' }}><h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '12px', textTransform: 'capitalize' }}>{freq} ({freqTasks.filter(rt => rt.status !== 'paused' && rt.status !== 'archived').reduce((sum, rt) => sum + (rt.estTime || 0), 0)}h active)</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>{freqTasks.map(rt => {
              const assignee = users.find(u => u.id === rt.assignedTo); const commentCount = (comments[`r-${rt.id}`] || []).length; const isPaused = rt.status === 'paused'; const isArchived = rt.status === 'archived'; return (<div key={rt.id} style={{ background: isArchived ? '#f9fafb' : '#fff', borderRadius: '12px', border: `1px solid ${isPaused ? '#fbbf24' : isArchived ? '#d1d5db' : '#e5e7eb'}`, padding: '16px', cursor: 'pointer', opacity: isArchived ? 0.7 : 1 }} onClick={() => setRecurringModal(rt)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', padding: '3px 8px', background: '#f3e8ff', color: '#7c3aed', borderRadius: '4px', fontWeight: '600' }}>↻ {freq}</span>
                    {isPaused && <span style={{ fontSize: '10px', padding: '2px 6px', background: '#fef3c7', color: '#d97706', borderRadius: '4px' }}>⏸ Paused</span>}
                    {isArchived && <span style={{ fontSize: '10px', padding: '2px 6px', background: '#f3f4f6', color: '#6b7280', borderRadius: '4px' }}>📦 Archived</span>}
                  </div>
                  <img src={assignee?.avatar} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: isArchived ? '#9ca3af' : '#1f2937' }}>{rt.title}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                  {freq === 'weekly' && `Every ${rt.days.join(', ')}`}
                  {freq === 'monthly' && `Day ${rt.days[0]} of each month`}
                  {freq === 'specific' && `${rt.specificDates.length} scheduled dates`}
                  {freq === 'daily' && 'Every day'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {rt.estTime && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6b7280' }}>🕐 {rt.estTime}h</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6b7280' }}>👤 {assignee?.username}</span>
                    {commentCount > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#059669' }}>💬 {commentCount}</span>}
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleDuplicateRecurring(rt); }} title="Duplicate" style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' }}><Icon name="copy" size={14} /></button>
                </div>
              </div>);
            })}</div></div>);
          })}
        </>)}

        {/* Building Sequences Overview */}
        {/* Project View (Standalone or Zone) */}
        {(activeNav.startsWith('project-') || activeNav.startsWith('zone-')) && (<><div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}><div><h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>{currentProject}</h1><p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{activeNav.startsWith('zone-') && <span style={{ marginRight: '8px', padding: '2px 8px', background: '#f3f4f6', borderRadius: '4px', fontSize: '11px' }}>Commons / Infrastructure</span>}{filteredBuildingTasks.length} steps {!currentUser.isAdmin && <span style={{ fontSize: '12px', color: '#f59e0b' }}>(Your edits require approval)</span>}</p></div><div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '160px', padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '10px' }} /><button type="button" onClick={() => setAddPhaseModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}><Icon name="plus" size={16} /> Add Phase</button></div></div>
          {filteredBuildingTasks.length === 0 && Object.keys(grouped).length === 0 && (
            <div style={{ background: '#fff', borderRadius: '12px', border: '2px dashed #e5e7eb', padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏗️</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px' }}>No phases yet</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px' }}>Start by adding a phase to organize your work</p>
              <button type="button" onClick={() => setAddPhaseModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}><Icon name="plus" size={16} /> Add First Phase</button>
            </div>
          )}
          {Object.entries(grouped).map(([subCat, catTasks]) => { const mainCat = catTasks[0]?.mainCategory || ''; const approvedCount = catTasks.filter(t => !t.isPending).length; const pendingCount = catTasks.filter(t => t.isPending).length; return (<div key={subCat} style={{ marginBottom: '32px', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}><div style={{ padding: '16px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div><h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>{subCat}</h3><span style={{ fontSize: '12px', color: '#6b7280' }}>{approvedCount} steps{pendingCount > 0 && <span style={{ marginLeft: '8px', color: '#f59e0b' }}>+{pendingCount} pending</span>}</span></div>{currentUser.isAdmin && <button type="button" onClick={() => setEditPhaseModal({ subCat, mainCat, villa: currentVilla })} style={{ padding: '4px 8px', background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer', color: '#6b7280', fontSize: '12px' }} title="Edit phase">✏️</button>}</div><button type="button" onClick={() => handleAddStep(subCat)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: '#ecfdf5', color: '#059669', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}><Icon name="plus" size={14} /> Add Step</button></div><div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1400px' }}><thead><tr style={{ background: '#fafafa' }}>{['', 'Readiness', 'Status', 'Steps', 'Task', 'Notes', 'Earliest Start', 'Expected Arrival', 'Est. Duration', 'Skilled', 'Unskilled', 'Comments', ''].map((h, i) => <th key={i} style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '600', color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>{h}</th>)}</tr></thead><tbody>{catTasks.map((t, i) => { const r = getReadiness(t, catTasks, i); const hasSCTask = kanbanTasks.some(kt => kt.type === 'sc' && kt.buildingTaskId === t.id); const commentCount = (comments[t.id] || []).length; const isDragOver = dragOverRow === t.id; const isPending = t.isPending; const canEdit = !isPending || (isPending && t.requestedBy === currentUser.id) || currentUser.isAdmin; const requester = isPending ? users.find(u => u.id === t.requestedBy) : null; return (<tr key={t.id || t.changeId} draggable={!isPending} onDragStart={(e) => !isPending && handleRowDragStart(e, t, subCat)} onDragOver={(e) => !isPending && handleRowDragOver(e, t)} onDrop={(e) => !isPending && handleRowDrop(e, t, catTasks)} onDragEnd={() => { setDraggedRow(null); setDragOverRow(null); }} style={{ borderBottom: '1px solid #f3f4f6', background: isPending ? 'rgba(251,191,36,0.1)' : isDragOver ? 'rgba(5,150,105,0.1)' : r.type === 'ready' ? 'rgba(22,163,74,0.04)' : 'transparent', cursor: isPending ? 'default' : 'grab', opacity: draggedRow?.id === t.id ? 0.5 : 1 }}><td style={{ padding: '8px 4px', width: '30px' }}>{isPending ? <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}><span style={{ fontSize: '10px', background: '#fbbf24', color: '#78350f', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>PENDING</span>{requester && <span style={{ fontSize: '9px', color: '#92400e' }}>{requester.username}</span>}</div> : <div style={{ color: '#d1d5db', cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="grip" size={16} /></div>}</td><td style={{ padding: '8px' }}>{isPending && currentUser.isAdmin ? <div style={{ display: 'flex', gap: '4px' }}><button type="button" onClick={() => approveChange(t.changeId)} style={{ padding: '4px 8px', background: '#059669', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>✓</button><button type="button" onClick={() => rejectChange(t.changeId)} style={{ padding: '4px 8px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>✗</button></div> : r.type !== 'sequenced' && !isPending && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: '600', background: r.bg, color: r.color, borderRadius: '4px', whiteSpace: 'nowrap' }}>{r.icon} {r.label}</span>}</td><td style={{ padding: '8px' }}>{!isPending && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><StatusDropdown value={t.status} options={options.status} onChange={v => handleBuildingStatusChange(t.id, v, t.status)} />{hasSCTask && <span title="Has SC Task" style={{ color: '#2563eb' }}><Icon name="link" size={14} /></span>}</div>}{isPending && <span style={{ fontSize: '12px', color: '#92400e', fontStyle: 'italic' }}>Awaiting approval</span>}</td><td style={{ padding: '8px' }}><EditableCell value={t.step} onChange={v => canEdit && editBuildingTask(t.id, 'step', v)} placeholder="Step name" style={isPending ? { background: 'rgba(251,191,36,0.2)' } : {}} /></td><td style={{ padding: '8px' }}><Dropdown value={t.task} options={options.task[subCat] || []} onChange={v => canEdit && editBuildingTask(t.id, 'task', v)} placeholder="Select task..." allowNew onAddNew={(newTask) => { if (canEdit) { setOptions(prev => ({ ...prev, task: { ...prev.task, [subCat]: [...(prev.task[subCat] || []), newTask] } })); editBuildingTask(t.id, 'task', newTask); } }} /></td><td style={{ padding: '8px' }}><EditableCell value={t.notes} onChange={v => canEdit && editBuildingTask(t.id, 'notes', v)} placeholder="Notes" /></td><td style={{ padding: '8px' }}><input type="date" value={t.earliestStart || ''} onChange={e => canEdit && editBuildingTask(t.id, 'earliestStart', e.target.value)} style={{ padding: '6px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', background: isPending ? 'rgba(251,191,36,0.1)' : '#fff' }} disabled={!canEdit} /></td><td style={{ padding: '8px' }}><input type="date" value={t.expectedArrival || ''} onChange={e => canEdit && editBuildingTask(t.id, 'expectedArrival', e.target.value)} style={{ padding: '6px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', background: isPending ? 'rgba(251,191,36,0.1)' : '#fff' }} disabled={!canEdit} /></td><td style={{ padding: '8px' }}><EditableCell value={t.duration} onChange={v => canEdit && editBuildingTask(t.id, 'duration', v)} placeholder="0:00" /></td><td style={{ padding: '8px' }}><MultiSelect values={t.skilledWorkers || []} options={options.skilledWorker} onChange={v => canEdit && editBuildingTask(t.id, 'skilledWorkers', v)} placeholder="Select..." /></td><td style={{ padding: '8px' }}><MultiSelect values={t.unskilledWorkers || []} options={options.unskilledWorker} onChange={v => canEdit && editBuildingTask(t.id, 'unskilledWorkers', v)} placeholder="Select..." /></td><td style={{ padding: '8px' }}>{!isPending && <button type="button" onClick={() => setActiveComments(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '12px', background: commentCount > 0 ? '#ecfdf5' : '#f3f4f6', border: 'none', borderRadius: '6px', color: commentCount > 0 ? '#059669' : '#6b7280', cursor: 'pointer' }}><Icon name="message" size={14} />{commentCount > 0 && commentCount}</button>}</td><td style={{ padding: '8px', display: 'flex', gap: '4px' }}>{!isPending && <><button type="button" onClick={() => handleDuplicateStep(t)} title="Duplicate row" style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '6px' }}><Icon name="copy" size={16} /></button><button type="button" onClick={() => handleDeleteBuildingTask(t.id)} style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', padding: '6px' }}><Icon name="trash" size={16} /></button></>}{isPending && (currentUser.isAdmin || t.requestedBy === currentUser.id) && <button type="button" onClick={() => rejectChange(t.changeId)} title="Cancel" style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '6px' }}><Icon name="trash" size={16} /></button>}</td></tr>); })}</tbody></table></div></div>); })}
        </>)}

        {/* Daily Worker Schedule */}
        {activeNav === 'schedule' && (<>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Daily Worker Schedule</h1>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Track task completion and worker time</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button type="button" onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().split('T')[0]); }} style={{ padding: '8px 12px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>←</button>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px' }} />
              <button type="button" onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d.toISOString().split('T')[0]); }} style={{ padding: '8px 12px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>→</button>
            </div>
          </div>

          {/* Task-Based 3-Day Schedule */}
          {(() => {
            const yesterday = new Date(selectedDate); yesterday.setDate(yesterday.getDate() - 1);
            const tomorrow = new Date(selectedDate); tomorrow.setDate(tomorrow.getDate() + 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            const todayStr = selectedDate;
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            // Get all active tasks with workers - sorted by worker count (multi-worker first)
            const getActiveTasks = () => {
              return buildingTasks
                .filter(t => t.status === 'In Progress' || t.status === 'Ready to start (Supply Chain confirmed on-site)')
                .map(t => ({
                  ...t,
                  workerCount: (t.skilledWorkers?.length || 0) + (t.unskilledWorkers?.length || 0)
                }))
                .sort((a, b) => b.workerCount - a.workerCount);
            };

            // Get available tasks from Building Sequence for assignment
            const availableTasks = buildingTasks.filter(t =>
              t.status === 'Ready to start (Supply Chain confirmed on-site)' &&
              (t.skilledWorkers?.length === 0 && t.unskilledWorkers?.length === 0)
            );

            const activeTasks = getActiveTasks();

            // Dummy yesterday tasks with completed data
            const yesterdayTasks = [
              { id: 'y1', step: 'Prefab Re-Bar', task: 'Re-Bar', villa: 'Villa 3', workers: ['zin', 'Tun Sein Maung'], estTime: 8, realTime: 9, status: 'finished' },
              { id: 'y2', step: 'Set up Formwork', task: 'Formwork', villa: 'Villa 3', workers: ['Joshua', 'Sone', 'Min Pyea'], estTime: 8, realTime: 7.5, status: 'finished' },
              { id: 'y3', step: 'Site Preparation', task: 'General', villa: 'Villa 3', workers: ['diesel', 'Thein Win'], estTime: 6, realTime: 6, status: 'finished' },
              { id: 'y4', step: 'Material Transport', task: 'Logistics', villa: 'Villa 3', workers: ['San Shwe'], estTime: 4, realTime: 5, status: 'stillInProgress' },
            ].sort((a, b) => b.workers.length - a.workers.length);

            // Calculate stats
            const finishedCount = buildingTasks.filter(t => t.scheduleStatus === 'finished').length;
            const inProgressCount = buildingTasks.filter(t => t.scheduleStatus === 'stillInProgress').length;
            const blockedCount = buildingTasks.filter(t => t.scheduleStatus === 'blocked').length;

            // Workers with no tasks
            const allWorkers = workforce.filter(w => w.status === 'active');
            const assignedWorkers = new Set();
            activeTasks.forEach(t => {
              (t.skilledWorkers || []).forEach(w => assignedWorkers.add(w));
              (t.unskilledWorkers || []).forEach(w => assignedWorkers.add(w));
            });
            const unassignedWorkers = allWorkers.filter(w => !assignedWorkers.has(w.name));

            const StatusDropdownSchedule = ({ value, onChange, disabled }) => (
              <select
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  background: value === 'finished' ? '#dcfce7' : value === 'stillInProgress' ? '#fef3c7' : value === 'blocked' ? '#fee2e2' : '#fff',
                  color: value === 'finished' ? '#059669' : value === 'stillInProgress' ? '#d97706' : value === 'blocked' ? '#dc2626' : '#6b7280',
                  fontWeight: '600',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.7 : 1
                }}
              >
                <option value="pending">Pending</option>
                <option value="finished">✓ Finished</option>
                <option value="stillInProgress">→ In Progress</option>
                <option value="blocked">✕ Blocked</option>
              </select>
            );

            const TaskCard = ({ task, day, isYesterday }) => {
              const workers = isYesterday ? task.workers : [...(task.skilledWorkers || []), ...(task.unskilledWorkers || [])];
              const workerCount = workers.length;
              const isMultiWorker = workerCount > 1;

              return (
                <div style={{
                  background: '#fff',
                  borderRadius: '8px',
                  border: isMultiWorker ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  padding: '12px',
                  marginBottom: '8px'
                }}>
                  {/* Task Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        {isMultiWorker && <span style={{ fontSize: '10px', padding: '2px 6px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '4px', fontWeight: '600' }}>👥 {workerCount}</span>}
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>{task.step}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>{task.task} • {task.villa}</div>
                    </div>
                  </div>

                  {/* Workers List - Prominent */}
                  <div style={{ marginBottom: '10px', padding: '8px', background: '#f9fafb', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>WORKERS</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {workers.map((w, i) => {
                        const workerInfo = workforce.find(wf => wf.name === w);
                        const isSkilled = isYesterday ? i < 1 : (task.skilledWorkers || []).includes(w);
                        return (
                          <div key={i} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            background: isSkilled ? '#dbeafe' : '#f3f4f6',
                            borderRadius: '4px'
                          }}>
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: isSkilled ? '#1d4ed8' : '#6b7280',
                              color: '#fff',
                              fontSize: '9px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>{w.charAt(0).toUpperCase()}</div>
                            <span style={{ fontSize: '12px', fontWeight: '500', color: isSkilled ? '#1d4ed8' : '#374151' }}>{w}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time & Status Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>Est:</span>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>{isYesterday ? task.estTime : (parseFloat(task.duration) || 0)}h</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>Real:</span>
                      {isYesterday ? (
                        <span style={{ fontSize: '12px', fontWeight: '600', color: task.realTime > task.estTime ? '#dc2626' : '#059669' }}>{task.realTime}h</span>
                      ) : (
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={task.realTime || ''}
                          onChange={e => setBuildingTasks(prev => prev.map(t => t.id === task.id ? { ...t, realTime: parseFloat(e.target.value) || '' } : t))}
                          placeholder="0"
                          style={{ width: '45px', padding: '3px', border: '1px solid #e5e7eb', borderRadius: '4px', textAlign: 'center', fontSize: '12px' }}
                        />
                      )}
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      <StatusDropdownSchedule
                        value={isYesterday ? task.status : (task.scheduleStatus || 'pending')}
                        onChange={val => !isYesterday && setBuildingTasks(prev => prev.map(t => t.id === task.id ? { ...t, scheduleStatus: val } : t))}
                        disabled={isYesterday}
                      />
                    </div>
                  </div>
                </div>
              );
            };

            return (
              <div style={{ display: 'grid', gap: '24px' }}>
                {/* Performance Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669' }}>{finishedCount}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Finished as Planned</div>
                  </div>
                  <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>{inProgressCount}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Still in Progress</div>
                  </div>
                  <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>{blockedCount}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Blocked</div>
                  </div>
                  <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '16px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: unassignedWorkers.length > 0 ? '#dc2626' : '#059669' }}>{unassignedWorkers.length}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Unassigned Workers</div>
                  </div>
                </div>

                {/* 3-Day View */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '16px' }}>
                  {/* YESTERDAY */}
                  <div style={{ background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Yesterday</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        {yesterday.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ padding: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                      {yesterdayTasks.map(task => <TaskCard key={task.id} task={task} day="yesterday" isYesterday={true} />)}
                    </div>
                  </div>

                  {/* TODAY */}
                  <div style={{ background: '#fff', borderRadius: '12px', border: '2px solid #059669', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', background: '#ecfdf5', borderBottom: '1px solid #059669' }}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#059669', textTransform: 'uppercase' }}>Today</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        {new Date(todayStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ padding: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                      {activeTasks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                          <div style={{ fontSize: '13px' }}>No tasks with workers assigned</div>
                        </div>
                      ) : (
                        activeTasks.map(task => <TaskCard key={task.id} task={task} day="today" isYesterday={false} />)
                      )}

                      {/* Assign Task Button */}
                      {availableTasks.length > 0 && (
                        <div style={{ marginTop: '12px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px dashed #86efac' }}>
                          <div style={{ fontSize: '11px', fontWeight: '600', color: '#059669', marginBottom: '8px' }}>+ Assign Task from Building Sequence</div>
                          <select
                            onChange={e => {
                              if (e.target.value) {
                                const task = buildingTasks.find(t => t.id === Number(e.target.value));
                                if (task) setActiveComments(task.id);
                                e.target.value = '';
                              }
                            }}
                            style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', background: '#fff' }}
                          >
                            <option value="">Select a task to assign workers...</option>
                            {availableTasks.map(t => <option key={t.id} value={t.id}>{t.step} - {t.villa}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TOMORROW */}
                  <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', background: '#faf5ff', borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#7c3aed', textTransform: 'uppercase' }}>Tomorrow</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        {tomorrow.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ padding: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                      {activeTasks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                          <div style={{ fontSize: '13px' }}>No tasks planned</div>
                        </div>
                      ) : (
                        activeTasks.slice(0, 3).map(task => (
                          <div key={task.id} style={{
                            background: '#f9fafb',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            padding: '10px',
                            marginBottom: '8px',
                            opacity: 0.8
                          }}>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>{task.step}</div>
                            <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '6px' }}>{task.task} • {task.villa}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {[...(task.skilledWorkers || []), ...(task.unskilledWorkers || [])].map((w, i) => (
                                <span key={i} style={{ fontSize: '10px', padding: '2px 6px', background: '#e5e7eb', borderRadius: '4px', color: '#6b7280' }}>{w}</span>
                              ))}
                            </div>
                          </div>
                        ))
                      )}

                      {/* Assign for Tomorrow */}
                      {availableTasks.length > 0 && (
                        <div style={{ marginTop: '12px', padding: '12px', background: '#faf5ff', borderRadius: '8px', border: '1px dashed #c4b5fd' }}>
                          <div style={{ fontSize: '11px', fontWeight: '600', color: '#7c3aed', marginBottom: '8px' }}>+ Plan for Tomorrow</div>
                          <select
                            onChange={e => {
                              if (e.target.value) {
                                const task = buildingTasks.find(t => t.id === Number(e.target.value));
                                if (task) setActiveComments(task.id);
                                e.target.value = '';
                              }
                            }}
                            style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', background: '#fff' }}
                          >
                            <option value="">Select a task...</option>
                            {availableTasks.map(t => <option key={t.id} value={t.id}>{t.step} - {t.villa}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Unassigned Workers Alert */}
                {unassignedWorkers.length > 0 && (
                  <div style={{ background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca', padding: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626', marginBottom: '12px' }}>
                      ⚠️ {unassignedWorkers.length} Workers Without Tasks Today
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {unassignedWorkers.map(w => (
                        <div key={w.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          background: '#fff',
                          borderRadius: '6px',
                          border: '1px solid #fecaca'
                        }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: w.type === 'skilled' ? '#1d4ed8' : '#6b7280',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: '600'
                          }}>{w.name.charAt(0)}</div>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '500' }}>{w.name}</div>
                            <div style={{ fontSize: '10px', color: w.type === 'skilled' ? '#1d4ed8' : '#6b7280' }}>{w.type}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legend */}
                <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: '#6b7280' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: '2px solid #3b82f6' }} /> Multi-worker task (prioritized)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#1d4ed8' }} /> Skilled Worker
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#6b7280' }} /> Unskilled Worker
                  </div>
                </div>
              </div>
            );
          })()}
        </>)}

        {/* Workforce */}
        {activeNav === 'workers' && (<>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Workforce</h1>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{workforce.length} workers</p>
            </div>
            <button type="button" onClick={() => setWorkerModal({ id: '', name: '', type: 'skilled', hourlyRate: 100, status: 'active', debt: 0, debtDescription: '', repaymentFrequency: 'none' })} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#059669', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}><Icon name="plus" size={18} /> Add Worker</button>
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: '#6b7280', textAlign: 'left' }}>NAME</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: '#6b7280', textAlign: 'left' }}>TYPE</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: '#6b7280', textAlign: 'right' }}>HOURLY RATE</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: '#6b7280', textAlign: 'right' }}>DEBT</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: '#6b7280', textAlign: 'left' }}>DEBT DESCRIPTION</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: '#6b7280', textAlign: 'left' }}>REPAYMENT</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: '#6b7280', textAlign: 'center' }}>STATUS</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: '600', color: '#6b7280', textAlign: 'center' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {workforce.map(worker => (
                    <tr key={worker.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: worker.type === 'skilled' ? '#059669' : '#6b7280', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600' }}>{worker.name.charAt(0).toUpperCase()}</div>
                          <span style={{ fontSize: '14px', fontWeight: '500' }}>{worker.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}><span style={{ fontSize: '12px', padding: '4px 10px', background: worker.type === 'skilled' ? '#ecfdf5' : '#f3f4f6', color: worker.type === 'skilled' ? '#059669' : '#6b7280', borderRadius: '20px', fontWeight: '500', textTransform: 'capitalize' }}>{worker.type}</span></td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '500' }}>{worker.hourlyRate} THB</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: '500', color: worker.debt > 0 ? '#dc2626' : '#16a34a' }}>{worker.debt > 0 ? `-${worker.debt.toLocaleString()} THB` : '0 THB'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{worker.debtDescription || '-'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280', textTransform: 'capitalize' }}>{worker.repaymentFrequency === 'none' ? '-' : worker.repaymentFrequency}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}><span style={{ fontSize: '11px', padding: '4px 10px', background: worker.status === 'active' ? '#ecfdf5' : '#f3f4f6', color: worker.status === 'active' ? '#059669' : '#9ca3af', borderRadius: '20px', fontWeight: '500', textTransform: 'capitalize' }}>{worker.status}</span></td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}><button type="button" onClick={() => setWorkerModal(worker)} style={{ padding: '6px 12px', fontSize: '12px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#6b7280' }}>Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>)}

        {/* Pending Approvals (Admin only) */}
        {activeNav === 'pendingApprovals' && currentUser.isAdmin && (<>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Pending Approvals</h1>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Review proposed changes from your team</p>
          </div>

          {pendingChanges.filter(c => c.status === 'pending').length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', color: '#9ca3af' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#059669', margin: 0 }}>All caught up!</h3>
              <p style={{ fontSize: '14px', margin: '8px 0 0' }}>No pending changes to review</p>
            </div>
          ) : (
            <>
              {/* Quick Actions Header */}
              <div style={{ background: '#fef3c7', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>⚡</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>{pendingChanges.filter(c => c.status === 'pending').length} changes need your review</div>
                    <div style={{ fontSize: '12px', color: '#b45309' }}>Quick review keeps the team moving</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => { pendingChanges.filter(c => c.status === 'pending').forEach(c => approveChange(c.id)); }} style={{ padding: '8px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>✓ Approve All</button>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                {pendingChanges.filter(c => c.status === 'pending').map(change => {
                  const requestedByUser = users.find(u => u.id === change.requestedBy);
                  const task = change.taskId ? buildingTasks.find(t => t.id === change.taskId) : null;
                  return (
                    <div key={change.id} style={{ background: '#fff', borderRadius: '12px', border: '2px solid #fef3c7', padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={requestedByUser?.avatar} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600' }}>{requestedByUser?.username}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{formatTime(change.timestamp)}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', padding: '4px 10px', background: '#fef3c7', color: '#d97706', borderRadius: '20px', fontWeight: '600', textTransform: 'uppercase' }}>{change.type.replace('_', ' ')}</span>
                      </div>

                      <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                        {change.type === 'edit' && <>Change <span style={{ color: '#059669' }}>{change.field}</span>: <span style={{ textDecoration: 'line-through', color: '#9ca3af' }}>{change.oldValue || '(empty)'}</span> → <span style={{ color: '#059669' }}>{change.newValue}</span></>}
                        {change.type === 'add_step' && <>Add new step: <span style={{ color: '#059669' }}>"{change.newTask?.step}"</span> to {change.subCategory}</>}
                        {change.type === 'add_phase' && <>Add new phase: <span style={{ color: '#059669' }}>{change.subCategory}</span></>}
                        {change.type === 'delete' && <>Delete step: <span style={{ color: '#dc2626' }}>"{change.step}"</span></>}
                        {change.type === 'add_sequence' && <>Add new building sequence: <span style={{ color: '#059669' }}>"{change.sequenceLabel}"</span></>}
                      </div>

                      {change.villa && <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>📍 {change.villa} → {change.subCategory}</div>}

                      {change.comments?.length > 0 && <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>💬 {change.comments.length} comment(s)</div>}

                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button type="button" onClick={() => approveChange(change.id)} style={{ flex: 1, padding: '10px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>✓ Approve</button>
                        <button type="button" onClick={() => setPendingReviewModal(change)} style={{ padding: '10px 16px', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>Review</button>
                        <button type="button" onClick={() => rejectChange(change.id)} style={{ padding: '10px 16px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* History of past approvals/rejections */}
          {pendingChanges.filter(c => c.status !== 'pending').length > 0 && (
            <div style={{ marginTop: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#6b7280' }}>History</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {pendingChanges.filter(c => c.status !== 'pending').slice(-10).reverse().map(change => {
                  const requestedByUser = users.find(u => u.id === change.requestedBy);
                  return (
                    <div key={change.id} style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={requestedByUser?.avatar} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '500' }}>{change.type} by {requestedByUser?.username}</div>
                          <div style={{ fontSize: '11px', color: '#9ca3af' }}>{formatTime(change.timestamp)}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', padding: '4px 10px', background: change.status === 'approved' ? '#ecfdf5' : '#fef2f2', color: change.status === 'approved' ? '#059669' : '#dc2626', borderRadius: '20px', fontWeight: '600', textTransform: 'capitalize' }}>{change.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>)}

        {/* My Suggestions - for non-admins to track their proposals */}
        {activeNav === 'mySuggestions' && !currentUser.isAdmin && (<>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>My Suggestions</h1>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Track your proposed changes awaiting approval</p>
          </div>

          {(() => {
            const myPending = pendingChanges.filter(c => c.requestedBy === currentUser.id && c.status === 'pending');
            const myHistory = pendingChanges.filter(c => c.requestedBy === currentUser.id && c.status !== 'pending');

            return (
              <>
                {/* Pending Suggestions */}
                {myPending.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '30vh', color: '#9ca3af' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#6b7280', margin: 0 }}>No pending suggestions</h3>
                    <p style={{ fontSize: '14px', margin: '8px 0 0', textAlign: 'center' }}>When you edit Building Sequences, your changes will appear here for Patrick to approve</p>
                  </div>
                ) : (
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f59e0b', marginBottom: '16px' }}>⏳ Awaiting Approval ({myPending.length})</h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {myPending.map(change => (
                        <div key={change.id} style={{ background: '#fff', borderRadius: '12px', border: '2px solid #fef3c7', padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div>
                              <span style={{ fontSize: '11px', padding: '3px 8px', background: '#fef3c7', color: '#d97706', borderRadius: '4px', fontWeight: '600', textTransform: 'uppercase' }}>{change.type.replace('_', ' ')}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{formatTime(change.timestamp)}</div>
                          </div>

                          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                            {change.type === 'edit' && `Change ${change.field}: "${change.oldValue || '(empty)'}" → "${change.newValue}"`}
                            {change.type === 'add_step' && `Add new step: "${change.newTask?.step}"`}
                            {change.type === 'add_phase' && `Add new phase: ${change.subCategory}`}
                            {change.type === 'delete' && `Delete step: "${change.step}"`}
                            {change.type === 'add_sequence' && `Add new building sequence: "${change.sequenceLabel}"`}
                          </div>

                          {change.villa && <div style={{ fontSize: '12px', color: '#6b7280' }}>📍 {change.villa} → {change.subCategory}</div>}

                          {change.comments?.length > 0 && (
                            <div style={{ marginTop: '12px', padding: '10px', background: '#f9fafb', borderRadius: '6px' }}>
                              <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>Comments:</div>
                              {change.comments.map((c, i) => {
                                const commenter = users.find(u => u.id === c.userId);
                                return (
                                  <div key={i} style={{ fontSize: '12px', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: '500' }}>{commenter?.username}:</span> {c.text}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* History */}
                {myHistory.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '16px' }}>History</h3>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {myHistory.slice(-10).reverse().map(change => (
                        <div key={change.id} style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '500' }}>
                              {change.type === 'edit' && `Changed ${change.field}`}
                              {change.type === 'add_step' && `Added step: "${change.newTask?.step}"`}
                              {change.type === 'add_phase' && `Added phase: ${change.subCategory}`}
                              {change.type === 'delete' && `Deleted step`}
                              {change.type === 'add_sequence' && `Added sequence`}
                            </div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{change.villa} • {formatTime(change.timestamp)}</div>
                          </div>
                          <span style={{
                            fontSize: '11px',
                            padding: '4px 10px',
                            background: change.status === 'approved' ? '#ecfdf5' : '#fef2f2',
                            color: change.status === 'approved' ? '#059669' : '#dc2626',
                            borderRadius: '20px',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}>{change.status === 'approved' ? '✓ Approved' : '✕ Rejected'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </>)}

        {/* Placeholder pages */}
        {['materials', 'reports'].includes(activeNav) && <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#9ca3af' }}><h2 style={{ fontSize: '24px', fontWeight: '600', color: '#6b7280' }}>{navItems.find(n => n.id === activeNav)?.label}</h2><p>Coming soon</p></div>}
      </main>

      {/* Modals & Panels */}
      {taskModal && <TaskModal task={taskModal} onClose={() => setTaskModal(null)} onUpdate={handleTaskUpdate} onDelete={handleTaskDelete} users={users} buildingTasks={buildingTasks} comments={comments} setComments={setComments} currentUser={currentUser} setNotifications={setNotifications} />}
      {recurringModal && <RecurringTaskModal task={recurringModal.id ? recurringModal : null} onClose={() => setRecurringModal(null)} onSave={handleRecurringSave} onDelete={handleRecurringDelete} users={users} comments={comments} setComments={setComments} currentUser={currentUser} setNotifications={setNotifications} />}
      {addPhaseModal && <AddPhaseModal isOpen={addPhaseModal} onClose={() => setAddPhaseModal(false)} onAdd={handleAddPhase} villa={currentProject} options={options} />}
      {editPhaseModal && <EditPhaseModal phase={editPhaseModal} onClose={() => setEditPhaseModal(null)} onRename={handleRenamePhase} onDelete={handleDeletePhase} />}
      {workerModal && <WorkerModal worker={workerModal.id ? workerModal : null} onClose={() => setWorkerModal(null)} onSave={(w) => { if (w.id && workforce.find(x => x.id === w.id)) { setWorkforce(prev => prev.map(x => x.id === w.id ? w : x)); } else { setWorkforce(prev => [...prev, w]); } }} onDelete={(id) => setWorkforce(prev => prev.filter(w => w.id !== id))} options={options} setOptions={setOptions} />}
      {addSequenceModal && <AddSequenceModal onClose={() => setAddSequenceModal(false)} onAdd={handleAddSequence} />}
      {addZoneModal && <AddZoneModal onClose={() => setAddZoneModal(false)} onAdd={handleAddZone} />}
      {editProjectModal && <EditProjectModal
        item={editProjectModal.item}
        type={editProjectModal.type}
        onClose={() => setEditProjectModal(null)}
        onSave={editProjectModal.type === 'project' ? handleUpdateProject : handleUpdateZone}
        onDelete={editProjectModal.type === 'project' ? handleDeleteProject : handleDeleteZone}
        onArchive={editProjectModal.type === 'project' ? handleArchiveProject : handleArchiveZone}
        onStar={editProjectModal.type === 'project' ? handleStarProject : handleStarZone}
      />}
      {pendingReviewModal && <PendingReviewModal change={pendingReviewModal} onClose={() => setPendingReviewModal(null)} onApprove={approveChange} onReject={rejectChange} onComment={addChangeComment} users={users} buildingTasks={buildingTasks} />}
      {activeComments && <CommentsPanel taskId={activeComments} task={activeTask} comments={comments} setComments={setComments} currentUser={currentUser} users={users} onClose={() => setActiveComments(null)} setNotifications={setNotifications} />}
      {showNotifications && <NotificationsPanel notifications={notifications.filter(n => n.userId === currentUser.id)} setNotifications={setNotifications} users={users} onClose={() => setShowNotifications(false)} onGoToTask={(id) => { setActiveComments(id); setShowNotifications(false); }} />}
    </div>
  );
}
