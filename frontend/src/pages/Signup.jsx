import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'warehouse_staff'
  });

  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', formData);
      login(res.data);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4">
      <div className="glass-panel p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">📦</div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400">Join CoreInventory system</p>
        </div>

        <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Full Name</label>
              <input
                name="name" type="text" required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                value={formData.name} onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Email</label>
              <input
                name="email" type="email" required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                value={formData.email} onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Password</label>
              <input
                name="password" type="password" required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                value={formData.password} onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">Role</label>
              <select
                  name="role" required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  value={formData.role} onChange={handleChange}
              >
                  <option value="warehouse_staff">Warehouse Staff</option>
                  <option value="inventory_manager">Inventory Manager</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50 mt-4"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

        <div className="mt-6 text-center text-sm">
            <Link to="/login" className="text-purple-400 hover:underline">
              Already have an account? Sign In
            </Link>
          </div>
      </div>
    </div>
  );
};

export default Signup;