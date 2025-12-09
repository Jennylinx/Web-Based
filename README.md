# Referral Management System

A student referral management system with MongoDB backend.

## Setup Instructions

1. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Setup MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Update the `MONGODB_URI` in `.env` file with your connection string

3. **Start the Server**
   \`\`\`bash
   npm start
   \`\`\`
   
   For development with auto-reload:
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Access the Application**
   - Open your browser and navigate to `http://localhost:3000`

## Environment Variables

Create a `.env` file in the root directory with:
\`\`\`
MONGODB_URI=mongodb://localhost:27017/referral_management
PORT=3000
JWT_SECRET=your_secret_key
\`\`\`

## API Endpoints

### Referrals
- `GET /api/referrals` - Get all referrals
- `GET /api/referrals/:id` - Get single referral
- `POST /api/referrals` - Create new referral
- `PUT /api/referrals/:id` - Update referral
- `DELETE /api/referrals/:id` - Delete referral

### Users
- `POST /api/users/login` - User login
- `POST /api/users/register` - User registration
