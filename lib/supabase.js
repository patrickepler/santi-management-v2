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

    // Load all data at once (for initial page load)
    loadAllData: async () => {
        // If Supabase is not configured, return empty data
        if (!supabase) {
            console.log('⚠️ Supabase not configured, returning empty data');
            return {
                buildingTasks: [],
                kanbanTasks: [],
                recurringTasks: [],
                comments: {},
                workforce: [],
                options: {},
                buildingSequences: { standalone: [] },
            };
        }

        try {
            // Fetch all data in parallel for better performance
            const [
                buildingTasksResult,
                kanbanTasksResult,
                recurringTasksResult,
                commentsResult,
                workforceResult,
                optionsResult,
                buildingSequencesResult,
            ] = await Promise.all([
                supabase.from('building_tasks').select('*'),
                supabase.from('kanban_tasks').select('*'),
                supabase.from('recurring_tasks').select('*'),
                supabase.from('comments').select('*'),
                supabase.from('workforce').select('*'),
                supabase.from('options').select('*'),
                supabase.from('building_sequences').select('*'),
            ]);

            // Process comments into object format (grouped by task_id)
            const commentsData = {};
            if (commentsResult.data) {
                commentsResult.data.forEach(comment => {
                    const taskId = comment.task_id;
                    if (!commentsData[taskId]) {
                        commentsData[taskId] = [];
                    }
                    commentsData[taskId].push(comment);
                });
            }

            // Process options into object format
            const optionsData = {};
            if (optionsResult.data && optionsResult.data.length > 0) {
                optionsResult.data.forEach(opt => {
                    optionsData[opt.key] = opt.value;
                });
            }

            // Process building sequences
            const buildingSequencesData = { standalone: [] };
            if (buildingSequencesResult.data && buildingSequencesResult.data.length > 0) {
                const firstRow = buildingSequencesResult.data[0];
                if (firstRow.data) {
                    buildingSequencesData.standalone = firstRow.data.standalone || [];
                }
            }

            return {
                buildingTasks: buildingTasksResult.data || [],
                kanbanTasks: kanbanTasksResult.data || [],
                recurringTasks: recurringTasksResult.data || [],
                comments: commentsData,
                workforce: workforceResult.data || [],
                options: optionsData,
                buildingSequences: buildingSequencesData,
            };
        } catch (error) {
            console.error('❌ Error in loadAllData:', error);
            throw error;
        }
    },

    // Save all data at once (for batch updates)
    saveAllData: async ({ buildingTasks, kanbanTasks, recurringTasks, workforce, options, buildingSequences }) => {
        // If Supabase is not configured, skip saving
        if (!supabase) {
            console.log('⚠️ Supabase not configured, skipping save');
            return;
        }

        try {
            const saveOperations = [];

            // Save building tasks (upsert based on id)
            if (buildingTasks && buildingTasks.length > 0) {
                saveOperations.push(
                    supabase.from('building_tasks').upsert(buildingTasks, { onConflict: 'id' })
                );
            }

            // Save kanban tasks (upsert based on id)
            if (kanbanTasks && kanbanTasks.length > 0) {
                saveOperations.push(
                    supabase.from('kanban_tasks').upsert(kanbanTasks, { onConflict: 'id' })
                );
            }

            // Save recurring tasks (upsert based on id)
            if (recurringTasks && recurringTasks.length > 0) {
                saveOperations.push(
                    supabase.from('recurring_tasks').upsert(recurringTasks, { onConflict: 'id' })
                );
            }

            // Save workforce (upsert based on id)
            if (workforce && workforce.length > 0) {
                saveOperations.push(
                    supabase.from('workforce').upsert(workforce, { onConflict: 'id' })
                );
            }

            // Save options as key-value pairs
            if (options && Object.keys(options).length > 0) {
                const optionsArray = Object.entries(options).map(([key, value]) => ({
                    key,
                    value,
                }));
                saveOperations.push(
                    supabase.from('options').upsert(optionsArray, { onConflict: 'key' })
                );
            }

            // Save building sequences as a single row
            if (buildingSequences) {
                saveOperations.push(
                    supabase.from('building_sequences').upsert({
                        id: 1, // Use a fixed ID for the single config row
                        data: buildingSequences,
                    }, { onConflict: 'id' })
                );
            }

            // Execute all save operations in parallel
            const results = await Promise.all(saveOperations);

            // Check for errors
            results.forEach((result, index) => {
                if (result.error) {
                    console.error(`❌ Error in save operation ${index}:`, result.error);
                }
            });

            console.log('✅ All data saved to Supabase');
        } catch (error) {
            console.error('❌ Error in saveAllData:', error);
            throw error;
        }
    },
};
