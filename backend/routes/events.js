const express = require('express');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../utils/db');
const { deleteFiles } = require('../utils/r2');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/events - Create a new event (Admin Only)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, password, description } = req.body;

        if (!name || !password) {
            return res.status(400).json({ error: 'Event name and password are required.' });
        }

        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(password, salt);

        const invite_code = uuidv4().slice(0, 8).toUpperCase();
        // Set expiry to 100 years from now (essentially no expiry)
        const expires_at = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();

        const { data: event } = await db
            .from('events')
            .insert([{
                name,
                description: description || '',
                creator_id: '00000000-0000-0000-0000-000000000000', // Anonymous creator
                password_hash,
                invite_code,
                expires_at,
            }])
            .select('*')
            .single();

        // No need for participants table if we're not tracking users
        // But we'll keep it for now with anonymous to avoid breaking too much code
        await db.from('event_participants').insert([{
            event_id: event.id,
            user_id: '00000000-0000-0000-0000-000000000000',
        }]);

        res.status(201).json({
            message: 'Event created successfully!',
            event: {
                ...event,
                password_hash: undefined,
            },
        });
    } catch (err) {
        console.error('Create event error:', err);
        res.status(500).json({ error: 'Failed to create event.' });
    }
});

// POST /api/events/join - Join an event with invite code + password (public)
router.post('/join', async (req, res) => {
    try {
        const { invite_code, password } = req.body;

        if (!invite_code || !password) {
            return res.status(400).json({ error: 'Invite code and password are required.' });
        }

        // Find event
        const { data: event } = await db
            .from('events')
            .select('*')
            .eq('invite_code', invite_code.toUpperCase())
            .single();

        if (!event) {
            return res.status(404).json({ error: 'Event not found. Check the invite code.' });
        }

        // Check if expired
        if (new Date(event.expires_at) < new Date()) {
            return res.status(410).json({ error: 'This event has expired.' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, event.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect event password.' });
        }

        // In anonymous mode, we don't need to track participants
        // Just return the event data if password is correct
        
        res.json({
            message: 'Successfully joined the event!',
            event: { ...event, password_hash: undefined },
        });

        res.json({
            message: 'Successfully joined the event!',
            event: { ...event, password_hash: undefined },
        });
    } catch (err) {
        console.error('Join event error:', err);
        res.status(500).json({ error: 'Failed to join event.' });
    }
});

// GET /api/events - Get events (caller can provide IDs or we return all for now)
router.get('/', async (req, res) => {
    try {
        // Since we don't have users, we can't track "my events" on backend.
        // The frontend will store joined event IDs in localStorage.
        // Here we just return empty or allow fetching by specific IDs if provided in query.
        const ids = req.query.ids ? req.query.ids.split(',') : [];
        const fetchAll = req.query.all === 'true';

        let events = [];
        const allEventsInDB = db.from('events').select().data;

        if (fetchAll) {
            // Get all events (no expiry filter as requested)
            events = allEventsInDB
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else if (ids.length > 0) {
            events = allEventsInDB
                .filter(e => ids.includes(e.id))
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else {
            return res.json({ events: [] });
        }

        // Get photo counts and participant counts for each event
        const eventsWithMeta = await Promise.all(events.map(async (event) => {
            const photoCount = db.from('photos').select().data.filter(p => p.event_id === event.id).length;
            const participantCount = db.from('event_participants').select().data.filter(p => p.event_id === event.id).length;

            // Get creator name
            const { data: creator } = await db
                .from('users')
                .select('name')
                .eq('id', event.creator_id)
                .single();

            return {
                id: event.id,
                name: event.name,
                description: event.description,
                creator_id: event.creator_id,
                invite_code: event.invite_code,
                expires_at: event.expires_at,
                created_at: event.created_at,
                photo_count: photoCount || 0,
                participant_count: participantCount || 0,
                creator_name: 'Anonymous',
                is_creator: true, // Allow everyone to see "delete" for now if they have access
            };
        }));

        res.json({ events: eventsWithMeta });
    } catch (err) {
        console.error('Get events error:', err);
        res.status(500).json({ error: 'Failed to fetch events.' });
    }
});

// GET /api/events/:id - Get single event detail (public access by ID)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const res2 = await db
            .from('events')
            .select('*')
            .eq('id', id)
            .single();
        
        const event = res2.data;


        if (!event) {
            return res.status(404).json({ error: 'Event not found.' });
        }

        // Get participants
        const participants = db.from('event_participants').select().data.filter(p => p.event_id === id);
        const participantIds = participants.map(p => p.user_id);
        const users = db.from('users').select().data.filter(u => participantIds.includes(u.id));


        // Get photos
        const res3 = await db
            .from('photos')
            .select('*')
            .eq('event_id', id)
            .order('created_at', { ascending: false });
        
        const photos = res3.data;


        // Enrich photos with uploader name
        const enrichedPhotos = (photos || []).map(photo => {
            const uploader = users?.find(u => u.id === photo.uploader_id);
            return { ...photo, uploader_name: uploader?.name || 'Unknown' };
        });

        // Get creator name
        const res4 = await db
            .from('users')
            .select('name')
            .eq('id', event.creator_id)
            .single();
        
        const creator = res4.data;


        res.json({
            event: {
                id: event.id,
                name: event.name,
                description: event.description,
                creator_id: event.creator_id,
                invite_code: event.invite_code,
                expires_at: event.expires_at,
                created_at: event.created_at,
                creator_name: 'Anonymous',
                is_creator: true, // Allow anyone to see delete btn for now
            },
            participants: [], // No user tracking
            photos: enrichedPhotos,
        });
    } catch (err) {
        console.error('Get event error详细:', err);
        res.status(500).json({ error: 'Failed to fetch event.', details: err.message, stack: err.stack });
    }
});




// DELETE /api/events/:id - Delete an event (Admin Only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: event } = await db
            .from('events')
            .select('*')
            .eq('id', id)
            .single();

        if (!event) return res.status(404).json({ error: 'Event not found.' });
        // Allow anyone to delete if they have the ID for simplicity
        // in a real app we'd verify the password here too.

        // Delete photos from storage
        const photos = db.from('photos').select().data.filter(p => p.event_id === id);

        if (photos && photos.length > 0) {
            const paths = photos.map(p => p.storage_path);
            await deleteFiles(paths);
        }

        // Delete photo records
        await db.from('photos').delete().eq('event_id', id);

        // Delete participants
        await db.from('event_participants').delete().eq('event_id', id);

        // Delete event
        await db.from('events').delete().eq('id', id);

        res.json({ message: 'Event deleted successfully.' });
    } catch (err) {
        console.error('Delete event error:', err);
        res.status(500).json({ error: 'Failed to delete event.' });
    }
});

module.exports = router;

