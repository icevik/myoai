const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/course');
const conversationRoutes = require('./routes/conversation');
const categoryRoutes = require('./routes/category');
const reportRoutes = require('./routes/reports');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reports', reportRoutes); 