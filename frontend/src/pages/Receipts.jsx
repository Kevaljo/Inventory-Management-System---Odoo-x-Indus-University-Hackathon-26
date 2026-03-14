import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';

const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchReceipts();
  }, [status]);

  const fetchReceipts = async () => {
    try {
      const url = status ? `/receipts?status=${status}` : '/receipts';
      const res = await api.get(url);
      setReceipts(res.data);
    } catch (err) {
      toast.error('Failed to fetch receipts');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (id) => {
    if (window.confirm('Validate this receipt? This will permanently add stock.')) {
      try {
        const res = await api.put(`/receipts/${id}/validate`);
        toast.success(res.data.message || 'Receipt Validated Successfully');
        fetchReceipts();
      } catch (err) {
         toast.error(err.response?.data?.message || 'Failed to validate');
      }
    }
  };
  
  const handleCancel = async (id) => {
      if (window.confirm('Cancel this receipt?')) {
          try {
              await api.put(`/receipts/${id}/cancel`);
              toast.info('Receipt Cancelled');
              fetchReceipts();
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
        <h1 className="text-2xl font-bold text-white">📥 Receipts (Incoming Goods)</h1>
        <Link to="/receipts/new" className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          + New Receipt
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
          <div className="p-8 text-center text-slate-400">Loading receipts...</div>
        ) : receipts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-medium">No receipts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-max">
              <thead className="glass-panel/5 text-slate-300 font-medium text-sm">
                <tr>
                  <th className="px-6 py-3 border-b">Reference</th>
                  <th className="px-6 py-3 border-b">Supplier</th>
                  <th className="px-6 py-3 border-b">Items</th>
                  <th className="px-6 py-3 border-b">Status</th>
                  <th className="px-6 py-3 border-b">Date</th>
                  <th className="px-6 py-3 border-b">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {receipts.map(rec => (
                  <tr key={rec._id} className="hover:glass-panel/5">
                    <td className="px-6 py-4 font-medium">{rec.reference}</td>
                    <td className="px-6 py-4">{rec.supplier}</td>
                    <td className="px-6 py-4 text-slate-300">{rec.items.length} items</td>
                    <td className="px-6 py-4">{getStatusBadge(rec.status)}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{new Date(rec.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 space-x-3">
                        <Link to={`/receipts/${rec._id}`} className="text-blue-400 hover:underline text-sm font-medium">View</Link>
                        {rec.status !== 'done' && rec.status !== 'cancelled' && (
                            <>
                                <button onClick={() => handleValidate(rec._id)} className="text-emerald-400 hover:underline text-sm font-medium">Validate</button>
                                <button onClick={() => handleCancel(rec._id)} className="text-rose-400 hover:underline text-sm font-medium">Cancel</button>
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

export default Receipts;