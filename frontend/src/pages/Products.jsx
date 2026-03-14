import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, [search, categoryFilter, stockFilter]);

  const fetchData = async () => {
    try {
      const catRes = await api.get('/categories');
      setCategories(catRes.data);

      let url = `/products?search=${search}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;
      if (stockFilter === 'lowStock') url += '&lowStock=true';
      if (stockFilter === 'outOfStock') url += '&outOfStock=true';
      if (stockFilter === 'deadStock') url += '&deadStock=true';

      const res = await api.get(url);
      setProducts(res.data);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        toast.success('Product deleted successfully');
        fetchData();
      } catch (err) {
        toast.error('Failed to delete product');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">📦 Products</h1>
        <Link to="/products/new" className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          + Add Product
        </Link>
      </div>

      <div className="glass-panel p-4 rounded-xl shadow-sm border border-white/5 flex flex-wrap gap-4">
        <input 
          type="text" 
          placeholder="🔍 Search by name or SKU..." 
          className="flex-1 min-w-[200px] border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select 
          className="border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
          ))}
        </select>
        <select 
          className="border px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
        >
          <option value="">All Stock Levels</option>
          <option value="lowStock">⚠️ Low Stock</option>
          <option value="outOfStock">🚫 Out of Stock</option>
          <option value="deadStock">💀 Dead Stock</option>
        </select>
      </div>

      <div className="glass-panel rounded-xl shadow-sm border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-medium">No products found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-max">
              <thead className="glass-panel/5 text-slate-300 font-medium text-sm">
                <tr>
                  <th className="px-6 py-3 border-b">Product</th>
                  <th className="px-6 py-3 border-b">SKU</th>
                  <th className="px-6 py-3 border-b">Category</th>
                  <th className="px-6 py-3 border-b">UoM</th>
                  <th className="px-6 py-3 border-b">Stock</th>
                  <th className="px-6 py-3 border-b">Status</th>
                  <th className="px-6 py-3 border-b">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(product => {
                  let statusBadge = <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full text-xs font-medium">In Stock</span>;
                  if (product.totalStock === 0) {
                    statusBadge = <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-1 rounded-full text-xs font-medium">Out of Stock</span>;
                  } else if (product.isDeadStock) {
                    statusBadge = <span className="bg-white/10 text-white px-2 py-1 rounded-full text-xs font-medium border border-white/20">💀 Dead Stock</span>;
                  } else if (product.totalStock <= product.reorderLevel) {
                    statusBadge = <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-1 rounded-full text-xs font-medium">Low Stock</span>;
                  }

                  return (
                    <tr key={product._id} className="hover:glass-panel/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{product.name}</td>
                      <td className="px-6 py-4 font-mono text-purple-400 text-sm">{product.sku}</td>
                      <td className="px-6 py-4">{product.category ? `${product.category.icon} ${product.category.name}` : '-'}</td>
                      <td className="px-6 py-4 text-slate-400">{product.unitOfMeasure}</td>
                      <td className="px-6 py-4 text-lg font-bold text-white">{product.totalStock}</td>
                      <td className="px-6 py-4">{statusBadge}</td>
                      <td className="px-6 py-4 space-x-3">
                        <Link to={`/products/${product._id}/edit`} className="text-blue-400 hover:underline text-sm font-medium">Edit</Link>
                        <button onClick={() => handleDelete(product._id)} className="text-rose-400 hover:underline text-sm font-medium">Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;