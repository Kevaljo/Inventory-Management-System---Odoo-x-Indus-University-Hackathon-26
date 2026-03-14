import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data);
        } catch (err) {
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center glass-panel p-6 rounded-xl shadow-sm border border-white/5">
                <div>
                    <h1 className="text-2xl font-bold text-white">📂 Categories</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage product classification and hierarchy</p>
                </div>
                <Link to="/categories/new" className="mt-4 md:mt-0 bg-purple-700 hover:bg-purple-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm inline-flex items-center space-x-2">
                    <span>+ New Category</span>
                </Link>
            </div>

            <div className="glass-panel rounded-xl shadow-sm border border-white/5 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-400 animate-pulse">Loading categories...</div>
                ) : categories.length === 0 ? (
                     <div className="p-12 text-center flex flex-col items-center">
                         <div className="w-16 h-16 glass-panel/5 rounded-full flex items-center justify-center mb-4">
                             <span className="text-2xl">📂</span>
                         </div>
                         <h3 className="text-lg font-medium text-white mb-1">No Categories Found</h3>
                         <p className="text-slate-400 max-w-sm mx-auto mb-6">Create your first product category to organize your inventory effectively.</p>
                     </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-max">
                            <thead className="glass-panel/5 text-slate-300 font-medium text-sm border-b">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4">Created</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {categories.map(cat => (
                                    <tr key={cat._id} className="hover:bg-purple-500/10 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{cat.name}</td>
                                        <td className="px-6 py-4 text-slate-300 truncate max-w-xs">{cat.description || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-400">{new Date(cat.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Link to={`/categories/${cat._id}`} className="text-purple-400 hover:text-purple-400 font-medium text-sm">Edit</Link>
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

export default Categories;