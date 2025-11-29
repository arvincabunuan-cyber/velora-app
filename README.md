# Velora - Web Delivery Application

A complete web-based delivery platform with role-based dashboards for buyers, sellers, riders, and superadmins.

## Features

### 🛒 Buyer Dashboard
- Browse and search products
- Place orders with multiple items
- Track order status in real-time
- View order history
- Cancel pending orders

### 🏪 Seller Dashboard
- Manage product inventory
- Add, edit, and delete products
- Receive and manage orders
- Update order status
- Track sales and revenue

### 🚴 Rider Dashboard
- View available deliveries
- Accept and manage delivery assignments
- Update delivery status
- Track delivery history
- Real-time location updates

### 👨‍💼 SuperAdmin Dashboard
- Monitor overall platform statistics
- Manage users (buyers, sellers, riders)
- View all orders and deliveries
- Activate/deactivate users
- Platform-wide analytics

## Tech Stack

### Backend
- **Node.js** with **Express.js**
- **MongoDB** with **Mongoose** ORM
- **JWT** for authentication
- **Socket.IO** for real-time updates
- **bcrypt** for password hashing

### Frontend
- **React 18** with **Vite**
- **React Router** for navigation
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Axios** for API calls
- **Socket.IO Client** for real-time features
- **React Hot Toast** for notifications
- **Lucide React** for icons

## Project Structure

```
velora-app/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Authentication middleware
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   └── sockets/        # Socket.IO handlers
│   ├── server.js           # Entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from `.env.example`:
```bash
copy .env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/velora
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Database Models

### User Model
- Supports multiple roles: buyer, seller, rider, superadmin
- Role-specific fields for sellers and riders
- Encrypted password storage
- Location tracking for riders

### Product Model
- Product information and pricing
- Stock management
- Categories and tags
- Seller reference

### Order Model
- Multiple items per order
- Status tracking with history
- Delivery address with coordinates
- Payment method and status

### Delivery Model
- Order reference
- Rider assignment
- Real-time location tracking
- Proof of delivery
- Rating system

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/update-password` - Update password

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Seller)
- `PUT /api/products/:id` - Update product (Seller)
- `DELETE /api/products/:id` - Delete product (Seller)

### Orders
- `POST /api/orders` - Create order (Buyer)
- `GET /api/orders/buyer` - Get buyer's orders
- `GET /api/orders/seller` - Get seller's orders
- `PUT /api/orders/:id/status` - Update order status (Seller)
- `PUT /api/orders/:id/cancel` - Cancel order (Buyer)

### Deliveries
- `GET /api/deliveries/pending` - Get pending deliveries (Rider)
- `GET /api/deliveries/rider` - Get rider's deliveries
- `PUT /api/deliveries/:id/assign` - Assign delivery to rider
- `PUT /api/deliveries/:id/status` - Update delivery status
- `PUT /api/deliveries/:id/complete` - Complete delivery
- `GET /api/deliveries/:id/track` - Track delivery

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/stats` - Get dashboard statistics
- `PUT /api/admin/users/:id/toggle-status` - Activate/deactivate user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/deliveries` - Get all deliveries

## User Roles & Permissions

### Buyer
- Browse and purchase products
- Place and track orders
- Cancel pending orders
- View order history

### Seller
- Add and manage products
- Receive and process orders
- Update order status
- View sales analytics

### Rider
- View available deliveries
- Accept delivery assignments
- Update delivery status
- Complete deliveries with proof

### SuperAdmin
- Full platform access
- User management
- Order and delivery oversight
- Platform analytics

## Real-time Features

The application uses Socket.IO for real-time updates:
- Order status notifications
- Delivery location tracking
- New order alerts for sellers
- Delivery assignment notifications

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Protected API routes
- Input validation

## Development

### Running in Development Mode

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

### Building for Production

Frontend:
```bash
cd frontend
npm run build
```

Backend:
```bash
cd backend
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC

## Support

For issues and questions, please create an issue in the repository.

---

Built with ❤️ for efficient delivery management
