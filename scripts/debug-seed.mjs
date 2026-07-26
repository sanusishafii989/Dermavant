import dotenv from 'dotenv';
import { connectDB } from '../lib/db.ts';
import { User, Doctor, Patient, Partner, Wallet, Admin } from '../models/index.ts';

dotenv.config({ path: '.env.local' });

async function main() {
  try {
    console.log('Connecting');
    await connectDB();
    console.log('Connected');

    const clerkId = process.env.ADMIN_CLERK_ID;
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const fullName = process.env.ADMIN_FULLNAME || 'Admin Test';

    let user = await User.findOne({ clerkId });
    if (!user) {
      user = await User.create({ clerkId, fullName, email, role: 'admin', status: 'active' });
    }
    console.log('User', user._id.toString());

    let wallet = await Wallet.findOne({ ownerId: user._id });
    if (!wallet) {
      wallet = await Wallet.create({ ownerId: user._id, ownerRole: 'admin', balance: 0, currency: 'NGN' });
    }
    console.log('Wallet', wallet._id.toString());

    let adminDoc = await Admin.findOne({ userId: user._id });
    if (!adminDoc) {
      adminDoc = await Admin.create({ userId: user._id, adminLevel: 'super', permissions: [] });
    }
    console.log('Admin', adminDoc._id.toString());
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
