require('dotenv').config();
const express = require('express');
const { testConnection } = require('./config/db');
const corsMiddleware = require('./middleware/cors');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const metaRoutes = require('./routes/metaRoutes');
const patientRoutes = require('./routes/patientRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const metaController = require('./controllers/metaController');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(corsMiddleware);

app.get('/', metaController.getRoot);
app.use('/api/auth', authRoutes);
app.use('/api', metaRoutes);
app.use('/api', patientRoutes);
app.use('/api', invoiceRoutes);
app.use('/api', paymentRoutes);
app.use('/api', prescriptionRoutes);
app.use('/api', resourceRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

testConnection();

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
