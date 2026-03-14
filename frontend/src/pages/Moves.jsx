import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const Moves = () => {
    const [moves, setMoves] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMoves();
    }, []);

    const fetchMoves = async () => {
        try {
            const res = await api.get('/moves');
            setMoves(res.data);
        } catch (err) {
            toast.error('Failed to load stock moves');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center glass-panel p-6 rounded-xl shadow-sm border border-white/5">
                <div>
                    <h1 className="text-2xl font-bold text-white">📈 Stock Move History</h1>
                    <p className="text-slate-400 text-sm mt-1">Audit log of all inventory transactions</p>
                </div>
            </div>

            <div className="glass-panel rounded-xl shadow-sm border border-white/5 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading history...</div>
                ) : moves.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">No stock moves recorded yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="glass-panel/5 border-b">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Product</th>
                                    <th className="px-6 py-4">From</th>
                                    <th className="px-6 py-4">To</th>
                                    <th className="px-6 py-4 text-right">Qty</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {moves.map(m => (
                                    <tr key={m._id} className="hover:glass-panel/5">
                                        <td className="px-6 py-4 text-sm text-slate-400">{new Date(m.createdAt).toLocaleString()}</td>
                                        <td className="px-6 py-4 font-medium">{m.product?.name || 'Unknown'}</td>
                                        <td className="px-6 py-4 text-sm">{m.sourceLocation}</td>
                                        <td className="px-6 py-4 text-sm">{m.destinationLocation}</td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-200">{m.quantity}</td>
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

export default Moves;