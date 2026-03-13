const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: './.env' });

async function seed() {
    try {
        let uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/adaptive_fitness';
        uri = uri.replace('localhost', '127.0.0.1');
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const email = 'admin@reio.com';
        const password = 'password123';

        // Check if user exists
        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name: 'Admin User',
                email: email,
                passwordHash: password,
                primarySport: 'other',
                experienceLevel: 'intermediate',
                height: 180,
                weight: 80
            });
            console.log(`✅ Default user created!\nEmail: ${email}\nPassword: ${password}`);
        } else {
            // Update password just in case
            user.passwordHash = password;
            await user.save();
            console.log(`✅ Default user already exists, password reset.\nEmail: ${email}\nPassword: ${password}`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
}

seed();
