import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://otyweitjnalqaheudyae.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
    console.warn('Supabase anon key not found. Set NEXT_PUBLIC_SUPABASE_ANON_KEY in environment.');
}

export const supabase = supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Test connection to Supabase
export const testConnection = async () => {
    if (!supabase) {
        console.error('Supabase not configured');
        return false;
    }

    try {
        // Try a simple query to test connection
        const { error } = await supabase.from('building_tasks').select('id').limit(1);
        if (error) {
            console.error('Connection test failed:', error);
            return false;
        }
        return true;
    } catch (err) {
        console.error('Connection test error:', err);
        return false;
    }
};

// =============================================
// DATABASE OPERATIONS
// =============================================

// Building Sequences (Projects/Zones)
export const db = {
    // ===== BUILDING SEQUENCES =====
    async getSequences() {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('building_sequences')
            .select('*')
            .order('sort_order');
        if (error) console.error('Error fetching sequences:', error);
        return data;
    },

    async upsertSequence(sequence) {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('building_sequences')
            .upsert(sequence)
            .select()
            .single();
        if (error) console.error('Error upserting sequence:', error);
        return data;
    },

    // ===== BUILDING TASKS =====
    async getBuildingTasks(villa = null) {
        if (!supabase) return null;
        let query = supabase.from('building_tasks').select('*').order('sort_order');
        if (villa) query = query.eq('villa', villa);
        const { data, error } = await query;
        if (error) console.error('Error fetching building tasks:', error);
        return data;
    },

    async upsertBuildingTask(task) {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('building_tasks')
            .upsert(task)
            .select()
            .single();
        if (error) console.error('Error upserting building task:', error);
        return data;
    },

    async deleteBuildingTask(id) {
        if (!supabase) return null;
        const { error } = await supabase.from('building_tasks').delete().eq('id', id);
        if (error) console.error('Error deleting building task:', error);
        return !error;
    },

    // ===== KANBAN TASKS =====
    async getKanbanTasks() {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('kanban_tasks')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) console.error('Error fetching kanban tasks:', error);
        return data;
    },

    async upsertKanbanTask(task) {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('kanban_tasks')
            .upsert(task)
            .select()
            .single();
        if (error) console.error('Error upserting kanban task:', error);
        return data;
    },

    async deleteKanbanTask(id) {
        if (!supabase) return null;
        const { error } = await supabase.from('kanban_tasks').delete().eq('id', id);
        if (error) console.error('Error deleting kanban task:', error);
        return !error;
    },

    // ===== RECURRING TASKS =====
    async getRecurringTasks() {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('recurring_tasks')
            .select('*')
            .order('created_at');
        if (error) console.error('Error fetching recurring tasks:', error);
        return data;
    },

    async upsertRecurringTask(task) {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('recurring_tasks')
            .upsert(task)
            .select()
            .single();
        if (error) console.error('Error upserting recurring task:', error);
        return data;
    },

    async deleteRecurringTask(id) {
        if (!supabase) return null;
        const { error } = await supabase.from('recurring_tasks').delete().eq('id', id);
        if (error) console.error('Error deleting recurring task:', error);
        return !error;
    },

    // ===== COMMENTS =====
    async getComments(taskType = null, taskId = null) {
        if (!supabase) return null;
        let query = supabase.from('comments').select('*').order('created_at');
        if (taskType) query = query.eq('task_type', taskType);
        if (taskId) query = query.eq('task_id', taskId);
        const { data, error } = await query;
        if (error) console.error('Error fetching comments:', error);
        return data;
    },

    async addComment(comment) {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('comments')
            .insert(comment)
            .select()
            .single();
        if (error) console.error('Error adding comment:', error);
        return data;
    },

    // ===== NOTIFICATIONS =====
    async getNotifications(userId) {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) console.error('Error fetching notifications:', error);
        return data;
    },

    async markNotificationRead(id) {
        if (!supabase) return null;
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);
        if (error) console.error('Error marking notification read:', error);
        return !error;
    },

    // ===== WORKFORCE =====
    async getWorkforce() {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('workforce')
            .select('*')
            .order('name');
        if (error) console.error('Error fetching workforce:', error);
        return data;
    },

    async upsertWorker(worker) {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('workforce')
            .upsert(worker)
            .select()
            .single();
        if (error) console.error('Error upserting worker:', error);
        return data;
    },

    // ===== OPTIONS =====
    async getOptions() {
        if (!supabase) return null;
        const { data, error } = await supabase.from('options').select('*');
        if (error) console.error('Error fetching options:', error);
        // Convert array to object
        return data?.reduce((acc, opt) => ({ ...acc, [opt.key]: opt.value }), {});
    },

    async setOption(key, value) {
        if (!supabase) return null;
        const { error } = await supabase
            .from('options')
            .upsert({ key, value, updated_at: new Date().toISOString() });
        if (error) console.error('Error setting option:', error);
        return !error;
    },

    // ===== USERS =====
    async getUsers() {
        if (!supabase) return null;
        const { data, error } = await supabase.from('users').select('*');
        if (error) console.error('Error fetching users:', error);
        return data;
    },

    async upsertUser(user) {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('users')
            .upsert(user, { onConflict: 'clerk_id' })
            .select()
            .single();
        if (error) console.error('Error upserting user:', error);
        return data;
    },

    // ===== PROFILES (for Clerk user sync) =====
    profiles: {
        async getByEmail(email) {
            if (!supabase) return null;
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', email)
                .single();
            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
                console.error('Error fetching profile by email:', error);
            }
            return data;
        },

        async upsert(profileData) {
            if (!supabase) return null;
            const { data, error } = await supabase
                .from('profiles')
                .upsert({
                    email: profileData.email,
                    username: profileData.username,
                    avatar_url: profileData.avatarUrl,
                    role: profileData.role,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'email' })
                .select()
                .single();
            if (error) console.error('Error upserting profile:', error);
            // Transform to page.js format
            return data ? {
                id: data.id,
                email: data.email,
                username: data.username,
                avatarUrl: data.avatar_url,
                role: data.role,
                managerId: data.manager_id
            } : null;
        }
    },

    // ===== BULK LOAD/SAVE (used by page.js) =====
    async loadAllData() {
        if (!supabase) {
            console.log('📦 Supabase not configured');
            return { buildingTasks: [], kanbanTasks: [], recurringTasks: [], workforce: [], options: {}, buildingSequences: null, pendingChanges: [], bugReports: [], comments: {}, profiles: [] };
        }

        try {
            console.log('🔄 Loading all data from Supabase...');

            // Load building_tasks
            const { data: buildingTasksRaw, error: btError } = await supabase
                .from('building_tasks')
                .select('*')
                .order('sort_order', { ascending: true });

            if (btError) console.error('Error loading building_tasks:', btError);

            // Load kanban_tasks
            const { data: kanbanTasksRaw, error: ktError } = await supabase
                .from('kanban_tasks')
                .select('*');

            if (ktError) console.error('Error loading kanban_tasks:', ktError);

            // Load recurring_tasks
            const { data: recurringTasksRaw, error: rtError } = await supabase
                .from('recurring_tasks')
                .select('*');

            if (rtError) console.error('Error loading recurring_tasks:', rtError);

            // Load workforce
            const { data: workforceRaw, error: wfError } = await supabase
                .from('workforce')
                .select('*');

            if (wfError) console.error('Error loading workforce:', wfError);

            // Load options
            const { data: optionsRaw, error: optError } = await supabase
                .from('options')
                .select('*');

            if (optError) console.error('Error loading options:', optError);

            // Convert options array to object
            const options = optionsRaw?.reduce((acc, opt) => ({ ...acc, [opt.key]: opt.value }), {}) || {};

            // Load comments
            const { data: commentsRaw, error: commError } = await supabase
                .from('comments')
                .select('*')
                .order('created_at', { ascending: true });

            if (commError) console.error('Error loading comments:', commError);

            // Group comments by task_id or kanban_task_id
            const comments = {};
            (commentsRaw || []).forEach(c => {
                // Use kanban_task_id if task_id is null
                const taskId = c.task_id || c.kanban_task_id;
                if (!taskId) return; // Skip comments without any task reference
                if (!comments[taskId]) comments[taskId] = [];
                comments[taskId].push({
                    id: c.id,
                    userId: c.user_id,
                    text: c.text,
                    timestamp: c.created_at
                });
            });

            // Load profiles
            const { data: profilesRaw, error: profError } = await supabase
                .from('profiles')
                .select('*');

            if (profError) console.error('Error loading profiles:', profError);

            // Transform building tasks to page.js format
            const buildingTasks = (buildingTasksRaw || []).map(t => ({
                id: t.id,
                order: t.sort_order,
                villa: t.villa,
                mainCategory: t.main_category,
                subCategory: t.sub_category,
                step: t.step,
                task: t.task,
                notes: t.notes,
                status: t.status,
                expectedArrival: t.expected_arrival,
                earliestStart: t.earliest_start,
                skilledWorkers: t.skilled_workers || [],
                unskilledWorkers: t.unskilled_workers || [],
                duration: t.duration
            }));

            // Transform kanban tasks to page.js format
            const kanbanTasks = (kanbanTasksRaw || []).map(t => ({
                id: t.id,
                title: t.title,
                assignedTo: t.assigned_to,
                column: t.status_column,
                dueDate: t.due_date,
                type: t.type,
                estTime: t.est_time,
                actualTime: t.actual_time,
                buildingTaskId: t.building_task_id,
                linkedChangeId: t.linked_change_id,
                scStatus: t.sc_status,
                deadlineOnSite: t.deadline_on_site,
                expectedArrival: t.expected_arrival,
                completedAt: t.completed_at,
                statusHistory: t.status_history || [],
                recurringTaskId: t.recurring_id,
                createdAt: t.created_at
            }));

            // Transform profiles
            const profiles = (profilesRaw || []).map(p => ({
                id: p.id,
                email: p.email,
                username: p.username,
                avatarUrl: p.avatar_url,
                role: p.role,
                managerId: p.manager_id
            }));

            console.log(`✅ Loaded: ${buildingTasks.length} building tasks, ${kanbanTasks.length} kanban tasks, ${Object.keys(comments).length} comment threads`);

            // Extract special keys from options (stored as JSON in options table)
            const buildingSequences = options.buildingSequences || null;
            const pendingChanges = options.pendingChanges || [];
            const bugReports = options.bugReports || [];

            // Remove special keys from options object so they don't get double-stored
            delete options.buildingSequences;
            delete options.pendingChanges;
            delete options.bugReports;

            if (buildingSequences) {
                console.log('✅ Loaded buildingSequences from Supabase');
            }

            // Transform recurring tasks to page.js format
            const recurringTasks = (recurringTasksRaw || []).map(t => ({
                id: t.id,
                title: t.title,
                assignedTo: t.assigned_to,
                frequency: t.frequency,
                days: t.days || [],
                specificDates: t.specific_dates || [],
                estTime: t.est_time,
                dueDate: t.due_date,
                archived: t.archived || false,
                createdAt: t.created_at
            }));

            return {
                buildingTasks,
                kanbanTasks,
                recurringTasks,
                workforce: workforceRaw || [],
                options,
                buildingSequences,
                pendingChanges,
                bugReports,
                comments,
                profiles
            };
        } catch (err) {
            console.error('❌ Error in loadAllData:', err);
            return { buildingTasks: [], kanbanTasks: [], recurringTasks: [], workforce: [], options: {}, buildingSequences: null, pendingChanges: [], bugReports: [], comments: {}, profiles: [] };
        }
    },

    async saveAllData(data) {
        if (!supabase) {
            console.log('📦 Supabase not configured, skipping save');
            return;
        }

        try {
            console.log('💾 Saving all data to Supabase...');

            // Save building_tasks
            if (data.buildingTasks && data.buildingTasks.length > 0) {
                const rows = data.buildingTasks.map(t => ({
                    id: t.id,
                    sort_order: t.order,
                    villa: t.villa,
                    main_category: t.mainCategory,
                    sub_category: t.subCategory,
                    step: t.step || '',
                    task: t.task || '',
                    notes: t.notes || '',
                    status: t.status || 'Supply Chain Pending Order',
                    expected_arrival: t.expectedArrival || null,
                    earliest_start: t.earliestStart || null,
                    skilled_workers: t.skilledWorkers || [],
                    unskilled_workers: t.unskilledWorkers || [],
                    duration: t.duration || null,
                    updated_at: new Date().toISOString()
                }));

                const { error } = await supabase
                    .from('building_tasks')
                    .upsert(rows, { onConflict: 'id' });

                if (error) console.error('Error saving building_tasks:', error);
            }

            // Save kanban_tasks
            if (data.kanbanTasks && data.kanbanTasks.length > 0) {
                const rows = data.kanbanTasks.map(t => ({
                    id: t.id,
                    title: t.title,
                    assigned_to: t.assignedTo,
                    status_column: t.column,
                    due_date: t.dueDate || null,
                    type: t.type,
                    est_time: t.estTime || null,
                    actual_time: t.actualTime || null,
                    building_task_id: t.buildingTaskId || null,
                    linked_change_id: t.linkedChangeId || null,
                    sc_status: t.scStatus || null,
                    deadline_on_site: t.deadlineOnSite || null,
                    expected_arrival: t.expectedArrival || null,
                    completed_at: t.completedAt || null,
                    status_history: t.statusHistory || [],
                    recurring_id: t.recurringTaskId || null,
                    created_at: t.createdAt,
                    updated_at: new Date().toISOString()
                }));

                const { error } = await supabase
                    .from('kanban_tasks')
                    .upsert(rows, { onConflict: 'id' });

                if (error) console.error('Error saving kanban_tasks:', error);

                // Delete tasks that are no longer in state (sync delete)
                const currentIds = data.kanbanTasks.map(t => t.id);
                const { data: dbTasks } = await supabase
                    .from('kanban_tasks')
                    .select('id');

                if (dbTasks) {
                    const dbIds = dbTasks.map(t => t.id);
                    const toDelete = dbIds.filter(id => !currentIds.includes(id));
                    if (toDelete.length > 0) {
                        const { error: delError } = await supabase
                            .from('kanban_tasks')
                            .delete()
                            .in('id', toDelete);
                        if (delError) console.error('Error deleting kanban_tasks:', delError);
                        else console.log(`🗑️ Deleted ${toDelete.length} kanban tasks from DB`);
                    }
                }
            }

            // Save options
            if (data.options && Object.keys(data.options).length > 0) {
                const rows = Object.entries(data.options).map(([key, value]) => ({
                    key,
                    value,
                    updated_at: new Date().toISOString()
                }));

                const { error } = await supabase
                    .from('options')
                    .upsert(rows, { onConflict: 'key' });

                if (error) console.error('Error saving options:', error);
            }

            // Save buildingSequences as a special option (stores entire structure as JSON)
            if (data.buildingSequences) {
                const { error } = await supabase
                    .from('options')
                    .upsert({
                        key: 'buildingSequences',
                        value: data.buildingSequences,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'key' });

                if (error) console.error('Error saving buildingSequences:', error);
                else console.log('✅ Saved buildingSequences to Supabase');
            }

            // Save pendingChanges as a special option (stores as JSON)
            if (data.pendingChanges !== undefined) {
                const { error } = await supabase
                    .from('options')
                    .upsert({
                        key: 'pendingChanges',
                        value: data.pendingChanges || [],
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'key' });

                if (error) console.error('Error saving pendingChanges:', error);
            }

            // Save bugReports as a special option (stores as JSON)
            if (data.bugReports !== undefined) {
                const { error } = await supabase
                    .from('options')
                    .upsert({
                        key: 'bugReports',
                        value: data.bugReports || [],
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'key' });

                if (error) console.error('Error saving bugReports:', error);
            }

            // Save workforce
            if (data.workforce && data.workforce.length > 0) {
                const { error } = await supabase
                    .from('workforce')
                    .upsert(data.workforce.map(w => ({
                        ...w,
                        updated_at: new Date().toISOString()
                    })), { onConflict: 'id' });

                if (error) console.error('Error saving workforce:', error);
            }

            // Save recurring_tasks
            if (data.recurringTasks && data.recurringTasks.length > 0) {
                const rows = data.recurringTasks.map(t => ({
                    id: t.id,
                    title: t.title,
                    assigned_to: t.assignedTo,
                    frequency: t.frequency,
                    days: t.days || [],
                    specific_dates: t.specificDates || [],
                    est_time: t.estTime,
                    due_date: t.dueDate || null,
                    archived: t.archived || false,
                    created_at: t.createdAt,
                    updated_at: new Date().toISOString()
                }));

                const { error } = await supabase
                    .from('recurring_tasks')
                    .upsert(rows, { onConflict: 'id' });

                if (error) console.error('Error saving recurring_tasks:', error);
            }

            // Save comments
            if (data.comments && Object.keys(data.comments).length > 0) {
                // Flatten comments object into array
                const allComments = [];
                Object.entries(data.comments).forEach(([taskId, taskComments]) => {
                    taskComments.forEach(c => {
                        // Determine which FK to use based on taskId format:
                        // - Numeric (1, 2, 3...) = building_task → task_id
                        // - String starting with k, sc, review, rec- = kanban_task → kanban_task_id
                        // - String starting with r- = recurring task comment (no FK needed)
                        const isNumeric = /^\d+$/.test(taskId);
                        const isKanbanTask = /^(k|sc|review|rec-)/.test(taskId);
                        const isRecurringComment = taskId.startsWith('r-');

                        allComments.push({
                            id: c.id,
                            task_id: isNumeric ? parseInt(taskId) : null,
                            kanban_task_id: isKanbanTask && !isRecurringComment ? taskId : null,
                            user_id: c.userId,
                            text: c.text,
                            created_at: c.timestamp
                        });
                    });
                });

                if (allComments.length > 0) {
                    const { error } = await supabase
                        .from('comments')
                        .upsert(allComments, { onConflict: 'id' });

                    if (error) console.error('Error saving comments:', error);
                }
            }

            console.log('✅ Saved to Supabase');
        } catch (err) {
            console.error('❌ Error in saveAllData:', err);
            throw err; // Re-throw to trigger error overlay
        }
    },
};

// =============================================
// REALTIME SUBSCRIPTIONS
// =============================================
export const subscribeToChanges = (table, callback) => {
    if (!supabase) return null;

    const subscription = supabase
        .channel(`${table}-changes`)
        .on('postgres_changes',
            { event: '*', schema: 'public', table },
            (payload) => callback(payload)
        )
        .subscribe();

    return () => {
        supabase.removeChannel(subscription);
    };
};

// Helper to subscribe to multiple tables
export const subscribeToAll = (callbacks) => {
    const unsubscribes = [];

    if (callbacks.buildingTasks) {
        unsubscribes.push(subscribeToChanges('building_tasks', callbacks.buildingTasks));
    }
    if (callbacks.kanbanTasks) {
        unsubscribes.push(subscribeToChanges('kanban_tasks', callbacks.kanbanTasks));
    }
    if (callbacks.recurringTasks) {
        unsubscribes.push(subscribeToChanges('recurring_tasks', callbacks.recurringTasks));
    }
    if (callbacks.comments) {
        unsubscribes.push(subscribeToChanges('comments', callbacks.comments));
    }
    if (callbacks.notifications) {
        unsubscribes.push(subscribeToChanges('notifications', callbacks.notifications));
    }

    return () => unsubscribes.forEach(unsub => unsub?.());
};
