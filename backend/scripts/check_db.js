require('dotenv').config();
const { testConnection } = require('../src/config/supabase');

(async () => {
    console.log('Verifying Database Connection...');
    const connected = await testConnection();
    if (connected) {
        console.log('Success!');
        process.exit(0);
    } else {
        console.error('Failed to connect.');
        process.exit(1);
    }
})();
