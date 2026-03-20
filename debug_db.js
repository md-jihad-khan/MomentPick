const db = require('./backend/utils/db');

async function test() {
    try {
        const id = 'f6f52245-4765-4314-9252-0b7209934562';
        const userId = 'b8fc6373-bfa8-43bd-88c9-fa96b6925866';

        console.log('Testing event fetch...');
        
        const res1 = await db
            .from('event_participants')
            .select('id')
            .eq('event_id', id)
            .eq('user_id', userId)
            .single();
        
        console.log('Participation:', res1);

        const res2 = await db
            .from('events')
            .select('*')
            .eq('id', id)
            .single();
        
        console.log('Event:', res2);

        const participants = db.from('event_participants').select().data.filter(p => p.event_id === id);
        console.log('Participants count:', participants.length);

        const participantIds = participants.map(p => p.user_id);
        const users = db.from('users').select().data.filter(u => participantIds.includes(u.id));
        console.log('Users count:', users.length);

        const res3 = await db
            .from('photos')
            .select('*')
            .eq('event_id', id)
            .order('created_at', { ascending: false });
        
        console.log('Photos:', res3.data.length);

        console.log('Test complete success');
    } catch (err) {
        console.error('Test FAILED:', err);
    }
}

test();
