const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { uploadFile, getFile } = require('./r2');

const DB_PATH = path.join(__dirname, '../db.json');

// Helper: convert R2 readable stream to string
function streamToString(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
}

/**
 * Called once on server startup.
 * Downloads db.json from R2 so data survives Render's ephemeral disk resets.
 */
async function initDB() {
    try {
        console.log('[DB] Restoring database from Cloudflare R2...');
        const response = await getFile('_backup/db.json');
        if (response && response.Body) {
            const data = await streamToString(response.Body);
            // Validate it's proper JSON before writing
            JSON.parse(data);
            fs.writeFileSync(DB_PATH, data, 'utf8');
            console.log('[DB] ✅ Database restored from R2 backup.');
        }
    } catch (err) {
        if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
            console.log('[DB] No backup found on R2 — starting fresh.');
        } else {
            console.error('[DB] ⚠️ Could not restore from R2:', err.message);
        }
    }
}

function readDB() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            const initialData = { users: [], events: [], event_participants: [], photos: [] };
            fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf8');
            return initialData;
        }
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading database:', err);
        return { users: [], events: [], event_participants: [], photos: [] };
    }
}

function writeDB(data) {
    try {
        const json = JSON.stringify(data, null, 2);
        fs.writeFileSync(DB_PATH, json, 'utf8');
        // Backup to R2 in the background (non-blocking)
        uploadFile('_backup/db.json', Buffer.from(json), 'application/json')
            .then(() => console.log('[DB] Backup synced to R2.'))
            .catch((err) => console.error('[DB] Backup sync failed:', err.message));
    } catch (err) {
        console.error('Error writing database:', err);
    }
}

const createQueryBuilder = (data) => {
    let currentData = data || [];

    const builder = {
        eq: (field, value) => {
            currentData = currentData.filter(item => item[field] === value);
            return builder;
        },
        lt: (field, value) => {
            currentData = currentData.filter(item => item[field] < value);
            return builder;
        },
        in: (field, values) => {
            if (!Array.isArray(values)) values = [values];
            currentData = currentData.filter(item => values.includes(item[field]));
            return builder;
        },
        order: (sortField, { ascending = true } = {}) => {
            currentData = [...currentData].sort((a, b) => {
                if (a[sortField] < b[sortField]) return ascending ? -1 : 1;
                if (a[sortField] > b[sortField]) return ascending ? 1 : -1;
                return 0;
            });
            return builder;
        },
        single: () => {
            return { data: currentData[0] || null, error: null };
        },
        get data() {
            return currentData;
        },
        get error() {
            return null;
        },
        // For Promise handling if needed (though we use async/await conventionally)
        then: (onSuccess) => {
            return onSuccess({ data: currentData, error: null });
        },
        select: (query = '*') => {
            // In this simple mock, we just return everything or specified fields if we wanted to be fancy
            return builder;
        }
    };

    return builder;
};

const db = {
    initDB,
    from: (collectionName) => ({
        select: (query = '*') => {
            const data = readDB()[collectionName] || [];
            return createQueryBuilder(data);
        },
        insert: (records) => {
            const currentDB = readDB();
            const newRecords = (Array.isArray(records) ? records : [records]).map(record => ({
                id: uuidv4(),
                created_at: new Date().toISOString(),
                ...record
            }));
            currentDB[collectionName].push(...newRecords);
            writeDB(currentDB);

            return {
                select: () => createQueryBuilder(newRecords),
                single: () => ({ data: newRecords[0], error: null }),
                data: newRecords[0], // for simple access
                error: null,
                then: (onSuccess) => onSuccess({ data: newRecords[0], error: null })
            };
        },
        delete: () => {
            let filterField, filterValue;
            return {
                eq: (field, value) => {
                    const currentDB = readDB();
                    currentDB[collectionName] = currentDB[collectionName].filter(item => item[field] !== value);
                    writeDB(currentDB);
                    return { error: null };
                }
            };
        },
        update: (updates) => ({
            eq: (field, value) => {
                const currentDB = readDB();
                currentDB[collectionName] = currentDB[collectionName].map(item => {
                    if (item[field] === value) {
                        return { ...item, ...updates };
                    }
                    return item;
                });
                writeDB(currentDB);
                return { error: null };
            }
        })
    })
};

module.exports = db;
