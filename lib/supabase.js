import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Make sure to set these environment variables in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create Supabase client instance only if credentials are provided
// Otherwise, the app will run in demo/mock mode
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Database helper object for common operations
export const db = {
    // Users
    users: {
        getAll: async () => {
            const { data, error } = await supabase.from('users').select('*');
            if (error) throw error;
            return data;
        },
        getById: async (id) => {
            const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
            if (error) throw error;
            return data;
        },
        create: async (user) => {
            const { data, error } = await supabase.from('users').insert(user).select().single();
            if (error) throw error;
            return data;
        },
        update: async (id, updates) => {
            const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        delete: async (id) => {
            const { error } = await supabase.from('users').delete().eq('id', id);
            if (error) throw error;
        },
    },

    // Tasks
    tasks: {
        getAll: async () => {
            const { data, error } = await supabase.from('tasks').select('*');
            if (error) throw error;
            return data;
        },
        getByAssignee: async (userId) => {
            const { data, error } = await supabase.from('tasks').select('*').eq('assigned_to', userId);
            if (error) throw error;
            return data;
        },
        create: async (task) => {
            const { data, error } = await supabase.from('tasks').insert(task).select().single();
            if (error) throw error;
            return data;
        },
        update: async (id, updates) => {
            const { data, error } = await supabase.from('tasks').update(updates).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        delete: async (id) => {
            const { error } = await supabase.from('tasks').delete().eq('id', id);
            if (error) throw error;
        },
    },

    // Building Tasks
    buildingTasks: {
        getAll: async () => {
            const { data, error } = await supabase.from('building_tasks').select('*');
            if (error) throw error;
            return data;
        },
        getByVilla: async (villa) => {
            const { data, error } = await supabase.from('building_tasks').select('*').eq('villa', villa);
            if (error) throw error;
            return data;
        },
        create: async (task) => {
            const { data, error } = await supabase.from('building_tasks').insert(task).select().single();
            if (error) throw error;
            return data;
        },
        update: async (id, updates) => {
            const { data, error } = await supabase.from('building_tasks').update(updates).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        delete: async (id) => {
            const { error } = await supabase.from('building_tasks').delete().eq('id', id);
            if (error) throw error;
        },
    },

    // Recurring Tasks
    recurringTasks: {
        getAll: async () => {
            const { data, error } = await supabase.from('recurring_tasks').select('*');
            if (error) throw error;
            return data;
        },
        create: async (task) => {
            const { data, error } = await supabase.from('recurring_tasks').insert(task).select().single();
            if (error) throw error;
            return data;
        },
        update: async (id, updates) => {
            const { data, error } = await supabase.from('recurring_tasks').update(updates).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        delete: async (id) => {
            const { error } = await supabase.from('recurring_tasks').delete().eq('id', id);
            if (error) throw error;
        },
    },

    // Comments
    comments: {
        getByTask: async (taskId) => {
            const { data, error } = await supabase.from('comments').select('*').eq('task_id', taskId);
            if (error) throw error;
            return data;
        },
        create: async (comment) => {
            const { data, error } = await supabase.from('comments').insert(comment).select().single();
            if (error) throw error;
            return data;
        },
        delete: async (id) => {
            const { error } = await supabase.from('comments').delete().eq('id', id);
            if (error) throw error;
        },
    },

    // Workforce
    workforce: {
        getAll: async () => {
            const { data, error } = await supabase.from('workforce').select('*');
            if (error) throw error;
            return data;
        },
        create: async (worker) => {
            const { data, error } = await supabase.from('workforce').insert(worker).select().single();
            if (error) throw error;
            return data;
        },
        update: async (id, updates) => {
            const { data, error } = await supabase.from('workforce').update(updates).eq('id', id).select().single();
            if (error) throw error;
            return data;
        },
        delete: async (id) => {
            const { error } = await supabase.from('workforce').delete().eq('id', id);
            if (error) throw error;
        },
    },

    // Notifications
    notifications: {
        getByUser: async (userId) => {
            const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId);
            if (error) throw error;
            return data;
        },
        create: async (notification) => {
            const { data, error } = await supabase.from('notifications').insert(notification).select().single();
            if (error) throw error;
            return data;
        },
        markAsRead: async (id) => {
            const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
            if (error) throw error;
        },
        delete: async (id) => {
            const { error } = await supabase.from('notifications').delete().eq('id', id);
            if (error) throw error;
        },
    },
};
