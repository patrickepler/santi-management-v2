import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create Supabase client instance only if credentials are provided
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// ============================================
// Helper Functions (Reusable)
// ============================================

// Convert snake_case to camelCase
const toCamelCase = (str) => str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

// Convert camelCase to snake_case
const toSnakeCase = (str) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

// Convert object keys from snake_case to camelCase (recursively for arrays)
const convertKeysToCamelCase = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map(convertKeysToCamelCase);
    }
    if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
        return Object.keys(obj).reduce((acc, key) => {
            acc[toCamelCase(key)] = obj[key];
            return acc;
        }, {});
    }
    return obj;
};

// Convert object keys from camelCase to snake_case (recursively for arrays)
const convertKeysToSnakeCase = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map(convertKeysToSnakeCase);
    }
    if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
        return Object.keys(obj).reduce((acc, key) => {
            acc[toSnakeCase(key)] = obj[key];
            return acc;
        }, {});
    }
    return obj;
};

// Sanitize date fields - convert empty strings to null for PostgreSQL
const DATE_FIELDS = ['due_date', 'expected_arrival', 'completed_at', 'created_at', 'deadline_on_site', 'updated_at'];
const sanitizeDateFields = (records) => {
    return records.map(record => {
        const sanitized = { ...record };
        DATE_FIELDS.forEach(field => {
            if (sanitized[field] === '' || sanitized[field] === undefined) {
                sanitized[field] = null;
            }
        });
        return sanitized;
    });
};

// ============================================
// Database Operations
// ============================================

export const db = {
    // Load all data at once (for initial page load)
    loadAllData: async () => {
        if (!supabase) {
            console.log('⚠️ Supabase not configured, returning empty data');
            return {
                profiles: [],
                buildingTasks: [],
                kanbanTasks: [],
                recurringTasks: [],
                comments: {},
                workforce: [],
                options: {},
                buildingSequences: { standalone: [], commons: { label: 'Commons / Infrastructure', zones: [] } },
            };
        }

        try {
            // Fetch all data in parallel for better performance
            const [
                profilesResult,
                buildingTasksResult,
                kanbanTasksResult,
                recurringTasksResult,
                commentsResult,
                workforceResult,
                optionsResult,
                buildingSequencesResult,
            ] = await Promise.all([
                supabase.from('profiles').select('*'),
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
                convertKeysToCamelCase(commentsResult.data).forEach(comment => {
                    const taskId = comment.taskId;
                    if (!commentsData[taskId]) {
                        commentsData[taskId] = [];
                    }
                    commentsData[taskId].push(comment);
                });
            }

            // Process options into object format
            const optionsData = {};
            if (optionsResult.data) {
                optionsResult.data.forEach(opt => {
                    optionsData[opt.key] = opt.value;
                });
            }

            // Process building sequences
            const buildingSequencesData = {
                standalone: [],
                commons: { label: 'Commons / Infrastructure', zones: [] }
            };
            if (buildingSequencesResult.data?.[0]?.data) {
                const { standalone, commons } = buildingSequencesResult.data[0].data;
                buildingSequencesData.standalone = standalone || [];
                buildingSequencesData.commons = commons || buildingSequencesData.commons;
            }

            return {
                profiles: convertKeysToCamelCase(profilesResult.data || []),
                buildingTasks: convertKeysToCamelCase(buildingTasksResult.data || []),
                kanbanTasks: convertKeysToCamelCase(kanbanTasksResult.data || []),
                recurringTasks: convertKeysToCamelCase(recurringTasksResult.data || []),
                comments: commentsData,
                workforce: convertKeysToCamelCase(workforceResult.data || []),
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
        if (!supabase) {
            console.log('⚠️ Supabase not configured, skipping save');
            return;
        }

        try {
            const saveOperations = [];

            // Save building tasks
            if (buildingTasks?.length > 0) {
                const converted = sanitizeDateFields(convertKeysToSnakeCase(buildingTasks));
                saveOperations.push(
                    supabase.from('building_tasks').upsert(converted, { onConflict: 'id' })
                );
            }

            // Save kanban tasks
            if (kanbanTasks?.length > 0) {
                const converted = sanitizeDateFields(convertKeysToSnakeCase(kanbanTasks));
                saveOperations.push(
                    supabase.from('kanban_tasks').upsert(converted, { onConflict: 'id' })
                );
            }

            // Save recurring tasks
            if (recurringTasks?.length > 0) {
                const converted = sanitizeDateFields(convertKeysToSnakeCase(recurringTasks));
                saveOperations.push(
                    supabase.from('recurring_tasks').upsert(converted, { onConflict: 'id' })
                );
            }

            // Save workforce
            if (workforce?.length > 0) {
                const converted = convertKeysToSnakeCase(workforce);
                saveOperations.push(
                    supabase.from('workforce').upsert(converted, { onConflict: 'id' })
                );
            }

            // Save options as key-value pairs
            if (options && Object.keys(options).length > 0) {
                const optionsArray = Object.entries(options).map(([key, value]) => ({ key, value }));
                saveOperations.push(
                    supabase.from('options').upsert(optionsArray, { onConflict: 'key' })
                );
            }

            // Save building sequences as a single row
            if (buildingSequences) {
                saveOperations.push(
                    supabase.from('building_sequences').upsert({
                        id: 1,
                        data: buildingSequences,
                    }, { onConflict: 'id' })
                );
            }

            // Execute all save operations in parallel
            const results = await Promise.all(saveOperations);

            // Check for errors
            const errors = results.filter(r => r.error);
            if (errors.length > 0) {
                errors.forEach((result, index) => {
                    console.error(`❌ Error in save operation ${index}:`, result.error);
                });
            }

            console.log('✅ All data saved to Supabase');
        } catch (error) {
            console.error('❌ Error in saveAllData:', error);
            throw error;
        }
    },

    // ============================================
    // Individual CRUD Operations (if needed)
    // ============================================

    buildingTasks: {
        getAll: async () => {
            if (!supabase) return [];
            const { data, error } = await supabase.from('building_tasks').select('*');
            if (error) throw error;
            return convertKeysToCamelCase(data);
        },
        upsert: async (task) => {
            if (!supabase) return null;
            const converted = sanitizeDateFields([convertKeysToSnakeCase(task)])[0];
            const { data, error } = await supabase.from('building_tasks').upsert(converted, { onConflict: 'id' }).select().single();
            if (error) throw error;
            return convertKeysToCamelCase(data);
        },
        delete: async (id) => {
            if (!supabase) return;
            const { error } = await supabase.from('building_tasks').delete().eq('id', id);
            if (error) throw error;
        },
    },

    kanbanTasks: {
        getAll: async () => {
            if (!supabase) return [];
            const { data, error } = await supabase.from('kanban_tasks').select('*');
            if (error) throw error;
            return convertKeysToCamelCase(data);
        },
        upsert: async (task) => {
            if (!supabase) return null;
            const converted = sanitizeDateFields([convertKeysToSnakeCase(task)])[0];
            const { data, error } = await supabase.from('kanban_tasks').upsert(converted, { onConflict: 'id' }).select().single();
            if (error) throw error;
            return convertKeysToCamelCase(data);
        },
        delete: async (id) => {
            if (!supabase) return;
            const { error } = await supabase.from('kanban_tasks').delete().eq('id', id);
            if (error) throw error;
        },
    },

    recurringTasks: {
        getAll: async () => {
            if (!supabase) return [];
            const { data, error } = await supabase.from('recurring_tasks').select('*');
            if (error) throw error;
            return convertKeysToCamelCase(data);
        },
        upsert: async (task) => {
            if (!supabase) return null;
            const converted = sanitizeDateFields([convertKeysToSnakeCase(task)])[0];
            const { data, error } = await supabase.from('recurring_tasks').upsert(converted, { onConflict: 'id' }).select().single();
            if (error) throw error;
            return convertKeysToCamelCase(data);
        },
        delete: async (id) => {
            if (!supabase) return;
            const { error } = await supabase.from('recurring_tasks').delete().eq('id', id);
            if (error) throw error;
        },
    },

    workforce: {
        getAll: async () => {
            if (!supabase) return [];
            const { data, error } = await supabase.from('workforce').select('*');
            if (error) throw error;
            return convertKeysToCamelCase(data);
        },
        upsert: async (worker) => {
            if (!supabase) return null;
            const converted = convertKeysToSnakeCase(worker);
            const { data, error } = await supabase.from('workforce').upsert(converted, { onConflict: 'id' }).select().single();
            if (error) throw error;
            return convertKeysToCamelCase(data);
        },
        delete: async (id) => {
            if (!supabase) return;
            const { error } = await supabase.from('workforce').delete().eq('id', id);
            if (error) throw error;
        },
    },

    comments: {
        getByTask: async (taskId) => {
            if (!supabase) return [];
            const { data, error } = await supabase.from('comments').select('*').eq('task_id', taskId);
            if (error) throw error;
            return convertKeysToCamelCase(data);
        },
        create: async (comment) => {
            if (!supabase) return null;
            const converted = convertKeysToSnakeCase(comment);
            const { data, error } = await supabase.from('comments').insert(converted).select().single();
            if (error) throw error;
            return convertKeysToCamelCase(data);
        },
        delete: async (id) => {
            if (!supabase) return;
            const { error } = await supabase.from('comments').delete().eq('id', id);
            if (error) throw error;
        },
    },

    // ============================================
    // Profiles (User sync from Clerk)
    // ============================================
    profiles: {
        getAll: async () => {
            if (!supabase) return [];
            const { data, error } = await supabase.from('profiles').select('*');
            if (error) throw error;
            return convertKeysToCamelCase(data);
        },
        getByEmail: async (email) => {
            if (!supabase) return null;
            const { data, error } = await supabase.from('profiles').select('*').eq('email', email).single();
            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
            return data ? convertKeysToCamelCase(data) : null;
        },
        upsert: async (profile) => {
            if (!supabase) return null;
            const converted = convertKeysToSnakeCase(profile);
            const { data, error } = await supabase.from('profiles').upsert(converted, { onConflict: 'email' }).select().single();
            if (error) throw error;
            return convertKeysToCamelCase(data);
        },
    },
};
