const express = require('express');
const multer = require('multer');
const path = require('path');
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed.'));
        }
    },
});

// POST /api/photos/upload/:eventId - Upload photos to an event
router.post('/upload/:eventId', authMiddleware, upload.array('photos', 20), async (req, res) => {
    try {
        const { eventId } = req.params;

        // Check participation
        const { data: participation } = await supabase
            .from('event_participants')
            .select('id')
            .eq('event_id', eventId)
            .eq('user_id', req.user.id)
            .single();

        if (!participation) {
            return res.status(403).json({ error: 'You must join this event first.' });
        }

        // Check if event is expired
        const { data: event } = await supabase
            .from('events')
            .select('expires_at')
            .eq('id', eventId)
            .single();

        if (!event || new Date(event.expires_at) < new Date()) {
            return res.status(410).json({ error: 'This event has expired.' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded.' });
        }

        const uploadedPhotos = [];

        for (const file of req.files) {
            const ext = path.extname(file.originalname) || '.jpg';
            const fileName = `${eventId}/${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from(process.env.SUPABASE_BUCKET)
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false,
                });

            if (error) {
                console.error('Upload error:', error);
                continue;
            }

            // Get public URL
            const { data: publicUrlData } = supabase.storage
                .from(process.env.SUPABASE_BUCKET)
                .getPublicUrl(fileName);

            // Save photo record
            const { data: photoRecord, error: dbError } = await supabase
                .from('photos')
                .insert([{
                    event_id: eventId,
                    uploader_id: req.user.id,
                    file_name: file.originalname,
                    storage_path: fileName,
                    url: publicUrlData.publicUrl,
                    size: file.size,
                    mime_type: file.mimetype,
                }])
                .select('*')
                .single();

            if (!dbError) {
                uploadedPhotos.push(photoRecord);
            }
        }

        res.status(201).json({
            message: `${uploadedPhotos.length} photo(s) uploaded successfully!`,
            photos: uploadedPhotos,
        });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Failed to upload photos.' });
    }
});

// GET /api/photos/:eventId - Get all photos for an event
router.get('/:eventId', authMiddleware, async (req, res) => {
    try {
        const { eventId } = req.params;

        // Check participation
        const { data: participation } = await supabase
            .from('event_participants')
            .select('id')
            .eq('event_id', eventId)
            .eq('user_id', req.user.id)
            .single();

        if (!participation) {
            return res.status(403).json({ error: 'You must join this event first.' });
        }

        const { data: photos, error } = await supabase
            .from('photos')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ photos: photos || [] });
    } catch (err) {
        console.error('Get photos error:', err);
        res.status(500).json({ error: 'Failed to fetch photos.' });
    }
});

// DELETE /api/photos/:photoId - Delete a photo (uploader or event creator only)
router.delete('/:photoId', authMiddleware, async (req, res) => {
    try {
        const { photoId } = req.params;

        const { data: photo } = await supabase
            .from('photos')
            .select('*')
            .eq('id', photoId)
            .single();

        if (!photo) {
            return res.status(404).json({ error: 'Photo not found.' });
        }

        // Check if user is uploader or event creator
        const { data: event } = await supabase
            .from('events')
            .select('creator_id')
            .eq('id', photo.event_id)
            .single();

        if (photo.uploader_id !== req.user.id && event?.creator_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only delete your own photos.' });
        }

        // Delete from storage
        await supabase.storage
            .from(process.env.SUPABASE_BUCKET)
            .remove([photo.storage_path]);

        // Delete record
        await supabase.from('photos').delete().eq('id', photoId);

        res.json({ message: 'Photo deleted successfully.' });
    } catch (err) {
        console.error('Delete photo error:', err);
        res.status(500).json({ error: 'Failed to delete photo.' });
    }
});

module.exports = router;
