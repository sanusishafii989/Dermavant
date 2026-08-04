import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { User, Partner, Medicine } from './models/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uri = process.env.MONGODB_URI || 'mongodb://sanusishafii989_db_user:Rnj4o4Fq6b8XdnBf@ac-irp1zto-shard-00-00.ufgrxb3.mongodb.net:27017,ac-irp1zto-shard-00-01.ufgrxb3.mongodb.net:27017,ac-irp1zto-shard-00-02.ufgrxb3.mongodb.net:27017/aetheris?ssl=true&replicaSet=atlas-aje56g-shard-0&authSource=admin&appName=Cluster0';
await mongoose.connect(uri);
const userDoc = await User.findOne({ clerkId: 'user_3GsDaFXmxaRiODG5V24BfquMVki' }).lean();
console.log('USER');
console.log(JSON.stringify(userDoc, null, 2));
const partnerDoc = await Partner.findOne({
  $or: [
    { email: userDoc?.email },
    { owner_name: userDoc?.fullName },
    { business_name: { $regex: 'City|Pharmacy', $options: 'i' } },
  ],
}).lean();
console.log('PARTNER');
console.log(JSON.stringify(partnerDoc, null, 2));
if (partnerDoc) {
  const medicines = await Medicine.find({ partner_id: partnerDoc._id, status: 'active' }).lean();
  console.log('MEDICINES');
  console.log(JSON.stringify(medicines, null, 2));
}
await mongoose.disconnect();
