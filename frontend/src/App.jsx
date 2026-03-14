import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './layout/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import DeliveryOrders from './pages/DeliveryOrders';
import DeliveryForm from './pages/DeliveryForm';
import Receipts from './pages/Receipts';
import ReceiptForm from './pages/ReceiptForm';
import InternalTransfers from './pages/InternalTransfers';
import TransferForm from './pages/TransferForm';
import Categories from './pages/Categories';
import CategoryForm from './pages/CategoryForm';
import Warehouses from './pages/Warehouses';
import WarehouseForm from './pages/WarehouseForm';
import Adjustments from './pages/Adjustments';
import AdjustmentForm from './pages/AdjustmentForm';
import Moves from './pages/Moves';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id" element={<ProductForm />} />
            
            <Route path="categories" element={<Categories />} />
            <Route path="categories/new" element={<CategoryForm />} />
            <Route path="categories/:id" element={<CategoryForm />} />

            <Route path="warehouses" element={<Warehouses />} />
            <Route path="warehouses/new" element={<WarehouseForm />} />
            <Route path="warehouses/:id" element={<WarehouseForm />} />
            
            <Route path="deliveries" element={<DeliveryOrders />} />
            <Route path="deliveries/new" element={<DeliveryForm />} />
            <Route path="deliveries/:id" element={<DeliveryForm />} />

            <Route path="receipts" element={<Receipts />} />
            <Route path="receipts/new" element={<ReceiptForm />} />
            <Route path="receipts/:id" element={<ReceiptForm />} />

            <Route path="transfers" element={<InternalTransfers />} />
            <Route path="transfers/new" element={<TransferForm />} />
            <Route path="transfers/:id" element={<TransferForm />} />

            <Route path="adjustments" element={<Adjustments />} />
            <Route path="adjustments/new" element={<AdjustmentForm />} />
            <Route path="adjustments/:id" element={<AdjustmentForm />} />

            <Route path="moves" element={<Moves />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        <ToastContainer position="bottom-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;
