import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';

const DeliveryOrders = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchDeliveries();
  }, [status]);

  const fetchDeliveries = async () => {
    try {
      const url = status ? `/deliveries?status=${status}` : '/deliveries';
      const res = await api.get(url);
      setDeliveries(res.data);
    } catch (err) {
      toast.error('Failed to fetch delivery orders');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (id) => {
    if (window.confirm('Validate this delivery? This will permanently deduct stock.')) {
      try {
        const res = await api.put(`/deliveries/${id}/validate`);
        if (res.data.alerts && res.data.alerts.length > 0) {
            res.data.alerts.forEach(alert => toast.warning(alert));
        } else {
            toast.success('Delivery Validated Successfully');
        }
        fetchDeliveries();
      } catch (err) {
         toast.error(err.response?.data?.message || 'Failed to validate');
      }
    }
  };
  
  const handleCancel = async (id) => {
      if (window.confirm('Cancel this delivery order?')) {
          try {
              await api.put(`/deliveries/${id}/cancel`);
              toast.info('Delivery Cancelled');
              fetchDeliveries();
          } catch (err) {
              toast.error('Failed to cancel');
          }
      }
  }

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'glass-panel/10 text-white',
      waiting: 'bg-blue-500/10 border border-blue-500/20 text-blue-400',
      ready: 'bg-amber-500/10 border border-amber-500/20 text-amber-400',
      done: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400',
      cancelled: 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${badges[status] || badges.draft}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">📤 Delivery Orders</h1>
        <Link to="/deliveries/new" className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          + New Delivery
        </Link>
      </div>

      <div className="glass-panel p-4 rounded-xl shadow-sm border border-white/5 flex gap-4">
        <select 
          className="border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none w-48"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="waiting">Waiting</option>
          <option value="ready">Ready</option>
          <option value="done">Done</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="glass-panel rounded-xl shadow-sm border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading deliveries...</div>
        ) : deliveries.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-medium">No deliveries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-max">
              <thead className="glass-panel/5 text-slate-300 font-medium text-sm">
                <tr>
                  <th className="px-6 py-3 border-b">Reference</th>
                  <th className="px-6 py-3 border-b">Customer</th>
                  <th className="px-6 py-3 border-b">Items</th>
                  <th className="px-6 py-3 border-b">Status</th>
                  <th className="px-6 py-3 border-b">Date</th>
                  <th className="px-6 py-3 border-b">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deliveries.map(del => (
                  <tr key={del._id} className="hover:glass-panel/5">
                    <td className="px-6 py-4 font-medium">{del.reference}</td>
                    <td className="px-6 py-4">{del.customer}</td>
                    <td className="px-6 py-4 text-slate-300">{del.items.length} items</td>
                    <td className="px-6 py-4">{getStatusBadge(del.status)}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{new Date(del.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 space-x-3">
                        <Link to={`/deliveries/${del._id}`} className="text-blue-400 hover:underline text-sm font-medium">View</Link>
                        {del.status !== 'done' && del.status !== 'cancelled' && (
                            <>
                                <button onClick={() => handleValidate(del._id)} className="text-emerald-400 hover:underline text-sm font-medium">Validate</button>
                                <button onClick={() => handleCancel(del._id)} className="text-rose-400 hover:underline text-sm font-medium">Cancel</button>
                            </>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryOrders;