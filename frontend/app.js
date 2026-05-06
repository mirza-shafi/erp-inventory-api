const { createApp, ref, computed, watch, onMounted, nextTick } = Vue;

const API_BASE = '/api/v1/products';

createApp({
    setup() {
        const currentView = ref('dashboard');
        const products = ref([]);
        const loading = ref(false);
        const saving = ref(false);
        
        // Search & Filter & Sort
        const searchQuery = ref('');
        const selectedCategory = ref('');
        const sortKey = ref('name');
        const sortAsc = ref(true);

        // Modal Form State
        const showModal = ref(false);
        const isEditing = ref(false);
        const form = ref({
            id: null,
            sku: '',
            name: '',
            description: '',
            cost_price: 0.0,
            price: 0.0,
            quantity: 0,
            category: '',
            location: '',
            supplier: '',
            status: 'Active'
        });

        // Notifications
        const toasts = ref([]);

        // Computed Analytics
        const totalProducts = computed(() => products.value.length);
        const totalValue = computed(() => products.value.reduce((acc, p) => acc + (p.price * p.quantity), 0));
        const totalCost = computed(() => products.value.reduce((acc, p) => acc + ((p.cost_price||0) * p.quantity), 0));
        const lowStockCount = computed(() => products.value.filter(p => p.quantity < 10).length);
        
        const categories = computed(() => {
            const cats = new Set(products.value.map(p => p.category).filter(Boolean));
            return Array.from(cats);
        });

        // Filter and Sort Logic
        const filteredProducts = computed(() => {
            let result = products.value;
            
            if (searchQuery.value) {
                const q = searchQuery.value.toLowerCase();
                result = result.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
            }
            if (selectedCategory.value) {
                result = result.filter(p => p.category === selectedCategory.value);
            }
            
            result.sort((a, b) => {
                let valA = a[sortKey.value] || '';
                let valB = b[sortKey.value] || '';
                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();
                
                if (valA < valB) return sortAsc.value ? -1 : 1;
                if (valA > valB) return sortAsc.value ? 1 : -1;
                return 0;
            });
            
            return result;
        });

        // Toggle Sort Function
        const toggleSort = (key) => {
            if (sortKey.value === key) {
                sortAsc.value = !sortAsc.value;
            } else {
                sortKey.value = key;
                sortAsc.value = true;
            }
        };

        // HTTP Calls
        const fetchProducts = async () => {
            loading.value = true;
            try {
                const response = await axios.get(API_BASE);
                products.value = response.data;
                if (currentView.value === 'dashboard') {
                    nextTick(() => renderChart());
                }
            } catch (error) {
                showToast("Failed to fetch product data", "error");
            } finally {
                loading.value = false;
            }
        };

        const saveProduct = async () => {
            saving.value = true;
            try {
                const payload = {
                    sku: form.value.sku,
                    name: form.value.name,
                    description: form.value.description,
                    cost_price: Number(form.value.cost_price),
                    price: Number(form.value.price),
                    quantity: Number(form.value.quantity),
                    category: form.value.category || null,
                    location: form.value.location || null,
                    supplier: form.value.supplier || null,
                    status: form.value.status
                };

                if (isEditing.value) {
                    await axios.put(`${API_BASE}/${form.value.id}`, payload);
                    showToast('Record updated in database');
                } else {
                    await axios.post(API_BASE, payload);
                    showToast('New asset recorded successfully');
                }
                
                await fetchProducts();
                closeModal();
            } catch (error) {
                let msg = 'Failed to save record';
                if(error.response && error.response.data && error.response.data.detail) {
                    msg = error.response.data.detail;
                }
                showToast(msg, 'error');
            } finally {
                saving.value = false;
            }
        };

        const confirmDelete = async (product) => {
            if (confirm(`WARNING: Deleting record for "${product.sku} - ${product.name}". This action cannot be reversed. Proceed?`)) {
                try {
                    await axios.delete(`${API_BASE}/${product.id}`);
                    showToast('Record purged from database');
                    await fetchProducts();
                } catch (error) {
                    showToast('Delete operation failed', 'error');
                }
            }
        };

        // Quick Stock Adjustments
        const adjustStock = async (product, amount) => {
            const newQty = product.quantity + amount;
            if(newQty < 0) return;
            try {
                await axios.put(`${API_BASE}/${product.id}`, { ...product, quantity: newQty });
                product.quantity = newQty; // Optimistic UI update
                showToast(`Stock updated to ${newQty}`, 'success');
            } catch(e) {
                showToast('Failed to update stock', 'error');
            }
        }

        // Form Handling
        const openModal = (product = null) => {
            if (product) {
                isEditing.value = true;
                form.value = { ...product };
            } else {
                isEditing.value = false;
                form.value = {
                    id: null, sku: '', name: '', description: '', cost_price: 0, price: 0, 
                    quantity: 0, category: '', location: '', supplier: '', status: 'Active'
                };
            }
            showModal.value = true;
        };

        const closeModal = () => {
            showModal.value = false;
        };

        // Toast notifications
        const showToast = (message, type = 'success') => {
            const id = Date.now();
            toasts.value.push({ id, message, type });
            setTimeout(() => {
                toasts.value = toasts.value.filter(t => t.id !== id);
            }, 3000);
        };

        // Chart.js Setup
        let chartInstance = null;
        const renderChart = () => {
            const ctx = document.getElementById('inventoryChart');
            if (!ctx) return;
            
            if (chartInstance) {
                chartInstance.destroy();
            }

            // Aggregate data by status or category depending on preference. Let's do category
            const dataMap = {};
            products.value.forEach(p => {
                const cat = p.category || 'Uncategorized';
                dataMap[cat] = (dataMap[cat] || 0) + p.quantity;
            });

            chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(dataMap),
                    datasets: [{
                        data: Object.values(dataMap),
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.8)', // blue-500
                            'rgba(16, 185, 129, 0.8)', // emerald-500
                            'rgba(245, 158, 11, 0.8)', // orange-500
                            'rgba(139, 92, 246, 0.8)', // violet-500
                            'rgba(239, 68, 68, 0.8)'   // red-500
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#9CA3AF' } }
                    }
                }
            });
        };

        // CSV Export
        const exportCSV = () => {
            const headers = ['SKU', 'Name', 'Description', 'Category', 'Location', 'Supplier', 'Cost Price', 'Selling Price', 'Quantity', 'Status'];
            const rows = filteredProducts.value.map(p => [
                p.sku, p.name, p.description||'', p.category||'', p.location||'', 
                p.supplier||'', p.cost_price, p.price, p.quantity, p.status
            ]);
            
            let csvContent = "data:text/csv;charset=utf-8," 
                + headers.join(",") + "\n" 
                + rows.map(e => e.join(",")).join("\n");
                
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `erp_inventory_export_${new Date().getTime()}.csv`);
            document.body.appendChild(link);
            link.click();
        };

        onMounted(() => {
            fetchProducts();
        });

        watch(currentView, (newVal) => {
            if (newVal === 'dashboard') {
                nextTick(() => renderChart());
            }
        });

        return {
            currentView, products, filteredProducts, loading, saving,
            searchQuery, selectedCategory, categories, 
            sortKey, sortAsc, toggleSort,
            showModal, isEditing, form, openModal, closeModal, saveProduct, confirmDelete, adjustStock,
            toasts, totalProducts, totalValue, totalCost, lowStockCount, exportCSV
        };
    }
}).mount('#app');
