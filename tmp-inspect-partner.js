const mongoose = require('mongoose');
const { User, Partner, Medicine } = require('./models');

(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://sanusishafii989_db_user:Rnj4o4Fq6b8XdnBf@ac-irp1zto-shard-00-00.ufgrxb3.mongodb.net:27017,ac-irp1zto-shard-00-01.ufgrxb3.mongodb.net:27017,ac-irp1zto-shard-00-02.ufgrxb3.mongodb.net:27017/aetheris?ssl=true&replicaSet=atlas-aje56g-shard-0&authSource=admin&appName=Cluster0';
  await mongoose.connect(uri);

  const user = await User.findOne({ clerkId: 'user_3GsDaFXmxaRiODG5V24BfquMVki' }).lean();
  console.log('USER');
  console.log(JSON.stringify(user, null, 2));

  const partners = await Partner.find({
    $or: [
      { email: user?.email },
      { owner_name: user?.fullName },
      { business_name: { $regex: 'City|Pharmacy', $options: 'i' } },
    ],
  }).lean();
  console.log('PARTNERS');
  console.log(JSON.stringify(partners, null, 2));

  const meds = await Medicine.find({ status: 'active' }).lean();
  console.log('MEDICINES');
  console.log(JSON.stringify(meds, null, 2));

  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
