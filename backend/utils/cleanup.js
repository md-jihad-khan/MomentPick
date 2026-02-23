const supabase = require('../config/supabase');
require('dotenv').config();

/**
 * Deletes events that have expired (older than 7 days).
 * Also removes associated photos from Supabase Storage and database records.
 */
async function cleanupExpiredEvents() {
    const now = new Date().toISOString();

    // Find expired events
    const { data: expiredEvents, error } = await supabase
        .from('events')
        .select('id')
        .lt('expires_at', now);

    if (error) {
        console.error('[Cleanup] Error fetching expired events:', error.message);
        return;
    }

    if (!expiredEvents || expiredEvents.length === 0) {
        console.log('[Cleanup] No expired events found.');
        return;
    }

    console.log(`[Cleanup] Found ${expiredEvents.length} expired event(s).`);

    for (const event of expiredEvents) {
        try {
            // Delete photos from storage
            const { data: photos } = await supabase
                .from('photos')
                .select('storage_path')
                .eq('event_id', event.id);

            if (photos && photos.length > 0) {
                const paths = photos.map(p => p.storage_path);
                await supabase.storage.from(process.env.SUPABASE_BUCKET).remove(paths);
                console.log(`[Cleanup] Removed ${paths.length} photo(s) from storage for event ${event.id}`);
            }

            // Delete photo records
            await supabase.from('photos').delete().eq('event_id', event.id);

            // Delete participants
            await supabase.from('event_participants').delete().eq('event_id', event.id);

            // Delete the event
            await supabase.from('events').delete().eq('id', event.id);

            console.log(`[Cleanup] Deleted event ${event.id}`);
        } catch (err) {
            console.error(`[Cleanup] Error deleting event ${event.id}:`, err.message);
        }
    }
}

module.exports = { cleanupExpiredEvents };
