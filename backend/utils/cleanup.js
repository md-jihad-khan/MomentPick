const db = require('./db');
const { deleteFiles } = require('./r2');
require('dotenv').config();

/**
 * Deletes events that have expired (older than 7 days).
 * Also removes associated photos from Cloudflare R2 and database records.
 */
async function cleanupExpiredEvents() {
    const now = new Date().toISOString();

    // Find expired events
    const { data: expiredEvents } = await db
        .from('events')
        .select('*')
        .lt('expires_at', now);

    if (!expiredEvents || expiredEvents.length === 0) {
        console.log('[Cleanup] No expired events found.');
        return;
    }

    console.log(`[Cleanup] Found ${expiredEvents.length} expired event(s).`);

    for (const event of expiredEvents) {
        try {
            // Delete photos from storage
            const photos = db.from('photos').select().data.filter(p => p.event_id === event.id);

            if (photos && photos.length > 0) {
                const paths = photos.map(p => p.storage_path);
                await deleteFiles(paths);
                console.log(`[Cleanup] Removed ${paths.length} photo(s) from storage for event ${event.id}`);
            }

            // Delete photo records
            await db.from('photos').delete().eq('event_id', event.id);

            // Delete participants
            await db.from('event_participants').delete().eq('event_id', event.id);

            // Delete the event
            await db.from('events').delete().eq('id', event.id);

            console.log(`[Cleanup] Deleted event ${event.id}`);
        } catch (err) {
            console.error(`[Cleanup] Error deleting event ${event.id}:`, err.message);
        }
    }
}

module.exports = { cleanupExpiredEvents };

