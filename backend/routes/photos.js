const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../utils/db');
const { uploadFile, deleteFile } = require('../utils/r2');
const authMiddleware = require('../middleware/auth');


const router = express.Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { 
        fileSize: 50 * 1024 * 1024, // 50MB max per file
        files: 1000, // Max number of files
        parts: 2000 // Max number of parts (fields + files)
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed.'));
        }
    },
});

// POST /api/photos/upload/:eventId - Admin only
router.post('/upload/:eventId', authMiddleware, upload.array('photos', 1000), async (req, res) => {
    try {
        const { eventId } = req.params;

        // Check if event is expired
        const { data: event } = await db
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();
        
        if (!event) {
            return res.status(404).json({ error: 'Event not found.' });
        }

        if (new Date(event.expires_at) < new Date()) {
            return res.status(410).json({ error: 'This event has expired.' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded.' });
        }

        const photoRecords = [];

        for (const file of req.files) {
            const ext = path.extname(file.originalname) || '.jpg';
            const fileName = `${eventId}/${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;

            // Upload to Cloudflare R2
            const uploadResult = await uploadFile(fileName, file.buffer, file.mimetype);

            // Add photo record to batch
            photoRecords.push({
                event_id: eventId,
                uploader_id: 'anonymous',
                file_name: file.originalname,
                storage_path: uploadResult.path,
                url: uploadResult.url,
                size: file.size,
                mime_type: file.mimetype,
            });
        }

        // Save photo records in bulk
        const { data: uploadedPhotos } = await db
            .from('photos')
            .insert(photoRecords);

        res.status(201).json({
            message: `${(uploadedPhotos || []).length} photo(s) uploaded successfully!`,
            photos: uploadedPhotos || [],
        });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Failed to upload photos.' });
    }
});

// GET /api/photos/:eventId - Get all photos for an event (public access by ID)
router.get('/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;

        const { data: photos } = await db
            .from('photos')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

        res.json({ photos: photos || [] });
    } catch (err) {
        console.error('Get photos error:', err);
        res.status(500).json({ error: 'Failed to fetch photos.' });
    }
});

// DELETE /api/photos/:photoId - Admin only
router.delete('/:photoId', authMiddleware, async (req, res) => {
    try {
        const { photoId } = req.params;

        const { data: photo } = await db
            .from('photos')
            .select('*')
            .eq('id', photoId)
            .single();

        if (!photo) {
            return res.status(404).json({ error: 'Photo not found.' });
        }

        // For simplicity in anonymous mode, allow deletion if found
        // In a real app we might want a session token, but user said "remove databases"
        // so we'll just allow direct deletion if someone has the photoId.
        
        // Delete from storage
        await deleteFile(photo.storage_path);

        // Delete record
        await db.from('photos').delete().eq('id', photoId);

        res.json({ message: 'Photo deleted successfully.' });
    } catch (err) {
        console.error('Delete photo error:', err);
        res.status(500).json({ error: 'Failed to delete photo.' });
    }
});

module.exports = router;

