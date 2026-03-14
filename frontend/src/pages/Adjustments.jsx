import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';

const Adjustments = () => {
    const [adjustments, setAdjustments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdjustments();
    }, []);

    const fetchAdjustments = async () => {
        try {
            const res = await api.get('/adjustments');
            setAdjustments(res.data);
        } catch (err) {
            toast.error('Failed to load adjustments');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (id) => {
        if (window.confirm('Apply this stock adjustment permanently?')) {
            try {
                await api.post(`/adjustments/${id}/apply`);
                toast.success('Adjustment applied successfully');
                fetchAdjustments();
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to apply adjustment');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center glass-panel p-6 rounded-xl shadow-sm border border-white/5">
                <div>
                    <h1 className="text-2xl font-bold text-white">⚖️ Stock Adjustments</h1>
                    <p className="text-slate-400 text-sm mt-1">Audit and correct true inventory counts</p>
                </div>
                <Link to="/adjustments/new" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
                    + Initial / Audit Count
                </Link>
            </div>

            <div className="glass-panel rounded-xl shadow-sm border border-white/5 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading records...</div>
                ) : adjustments.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">No stock adjustments found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="glass-panel/5 border-b">
                                <tr>
                                    <th className="px-6 py-4">Reference</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {adjustments.map(adj => (
                                    <tr key={adj._id} className="hover:glass-panel/5">
                                        <td className="px-6 py-4 font-medium">{adj.reference || 'Missing Ref'}</td>
                                        <td className="px-6 py-4">{adj.location || 'Default WH'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${adj.status === 'applied' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'}`}>
                                                {adj.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">{new Date(adj.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 space-x-3">
                                            <Link to={`/adjustments/${adj._id}`} className="text-blue-400 hover:underline text-sm font-medium">View</Link>
                                            {adj.status !== 'applied' && (
                                                <button onClick={() => handleApply(adj._id)} className="text-emerald-400 hover:underline text-sm font-medium">Apply</button>
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

export default Adjustments;