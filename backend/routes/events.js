const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/events - Create a new event
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, password, description } = req.body;

        if (!name || !password) {
            return res.status(400).json({ error: 'Event name and password are required.' });
        }

        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(password, salt);

        const invite_code = uuidv4().slice(0, 8).toUpperCase();
        const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data: event, error } = await supabase
            .from('events')
            .insert([{
                name,
                description: description || '',
                creator_id: req.user.id,
                password_hash,
                invite_code,
                expires_at,
            }])
            .select('*')
            .single();

        if (error) throw error;

        // Auto-add creator as participant
        await supabase.from('event_participants').insert([{
            event_id: event.id,
            user_id: req.user.id,
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

// POST /api/events/join - Join an event with invite code + password
router.post('/join', authMiddleware, async (req, res) => {
    try {
        const { invite_code, password } = req.body;

        if (!invite_code || !password) {
            return res.status(400).json({ error: 'Invite code and password are required.' });
        }

        // Find event
        const { data: event, error } = await supabase
            .from('events')
            .select('*')
            .eq('invite_code', invite_code.toUpperCase())
            .single();

        if (error || !event) {
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

        // Check if already a participant
        const { data: existing } = await supabase
            .from('event_participants')
            .select('id')
            .eq('event_id', event.id)
            .eq('user_id', req.user.id)
            .single();

        if (existing) {
            return res.json({
                message: 'You have already joined this event.',
                event: { ...event, password_hash: undefined },
            });
        }

        // Add participant
        await supabase.from('event_participants').insert([{
            event_id: event.id,
            user_id: req.user.id,
        }]);

        res.json({
            message: 'Successfully joined the event!',
            event: { ...event, password_hash: undefined },
        });
    } catch (err) {
        console.error('Join event error:', err);
        res.status(500).json({ error: 'Failed to join event.' });
    }
});

// GET /api/events - Get all events for current user (created + joined)
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Get events where user is participant
        const { data: participations, error: pError } = await supabase
            .from('event_participants')
            .select('event_id')
            .eq('user_id', req.user.id);

        if (pError) throw pError;

        const eventIds = participations.map(p => p.event_id);

        if (eventIds.length === 0) {
            return res.json({ events: [] });
        }

        const { data: events, error } = await supabase
            .from('events')
            .select('id, name, description, creator_id, invite_code, expires_at, created_at')
            .in('id', eventIds)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Get photo counts and participant counts for each event
        const eventsWithMeta = await Promise.all(events.map(async (event) => {
            const { count: photoCount } = await supabase
                .from('photos')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', event.id);

            const { count: participantCount } = await supabase
                .from('event_participants')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', event.id);

            // Get creator name
            const { data: creator } = await supabase
                .from('users')
                .select('name')
                .eq('id', event.creator_id)
                .single();

            return {
                ...event,
                photo_count: photoCount || 0,
                participant_count: participantCount || 0,
                creator_name: creator?.name || 'Unknown',
                is_creator: event.creator_id === req.user.id,
            };
        }));

        res.json({ events: eventsWithMeta });
    } catch (err) {
        console.error('Get events error:', err);
        res.status(500).json({ error: 'Failed to fetch events.' });
    }
});

// GET /api/events/:id - Get single event detail (must be participant)
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Check participation
        const { data: participation } = await supabase
            .from('event_participants')
            .select('id')
            .eq('event_id', id)
            .eq('user_id', req.user.id)
            .single();

        if (!participation) {
            return res.status(403).json({ error: 'You do not have access to this event.' });
        }

        const { data: event, error } = await supabase
            .from('events')
            .select('id, name, description, creator_id, invite_code, expires_at, created_at')
            .eq('id', id)
            .single();

        if (error || !event) {
            return res.status(404).json({ error: 'Event not found.' });
        }

        // Get participants
        const { data: participants } = await supabase
            .from('event_participants')
            .select('user_id, joined_at')
            .eq('event_id', id);

        const participantIds = participants.map(p => p.user_id);
        const { data: users } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', participantIds);

        // Get photos
        const { data: photos } = await supabase
            .from('photos')
            .select('*')
            .eq('event_id', id)
            .order('created_at', { ascending: false });

        // Enrich photos with uploader name
        const enrichedPhotos = (photos || []).map(photo => {
            const uploader = users?.find(u => u.id === photo.uploader_id);
            return { ...photo, uploader_name: uploader?.name || 'Unknown' };
        });

        // Get creator name
        const { data: creator } = await supabase
            .from('users')
            .select('name')
            .eq('id', event.creator_id)
            .single();

        res.json({
            event: {
                ...event,
                creator_name: creator?.name || 'Unknown',
                is_creator: event.creator_id === req.user.id,
            },
            participants: users || [],
            photos: enrichedPhotos,
        });
    } catch (err) {
        console.error('Get event error:', err);
        res.status(500).json({ error: 'Failed to fetch event.' });
    }
});

// DELETE /api/events/:id - Delete an event (creator only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: event } = await supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .single();

        if (!event) {
            return res.status(404).json({ error: 'Event not found.' });
        }

        if (event.creator_id !== req.user.id) {
            return res.status(403).json({ error: 'Only the creator can delete this event.' });
        }

        // Delete photos from storage
        const { data: photos } = await supabase
            .from('photos')
            .select('storage_path')
            .eq('event_id', id);

        if (photos && photos.length > 0) {
            const paths = photos.map(p => p.storage_path);
            await supabase.storage.from(process.env.SUPABASE_BUCKET).remove(paths);
        }

        // Delete photo records
        await supabase.from('photos').delete().eq('event_id', id);

        // Delete participants
        await supabase.from('event_participants').delete().eq('event_id', id);

        // Delete event
        await supabase.from('events').delete().eq('id', id);

        res.json({ message: 'Event deleted successfully.' });
    } catch (err) {
        console.error('Delete event error:', err);
        res.status(500).json({ error: 'Failed to delete event.' });
    }
});

module.exports = router;
