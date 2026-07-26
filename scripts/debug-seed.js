const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: '.env.local' });

async function main() {
  try {
    console.log('Connecting to', process.env.MONGODB_URI?.slice(0, 80));
    await mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false });
    console.log('Connected');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Connection failed');
    console.error(error);
    process.exit(1);
  }
}

main();
