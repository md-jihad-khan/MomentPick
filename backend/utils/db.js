const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '../db.json');

function readDB() {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading database:', err);
        return { users: [], events: [], event_participants: [], photos: [] };
    }
}

function writeDB(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
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

