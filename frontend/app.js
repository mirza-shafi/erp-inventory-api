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
            name: '',
            price: 0.0,
            quantity: 0,
            category: ''
        });

        // Notifications
        const toasts = ref([]);
        let toastIdSequence = 0;
        
        // Chart Instance
        let inventoryChart = null;

        // Computed Properties
        const stats = computed(() => {
            let totalValue = 0;
            products.value.forEach(p => totalValue += (p.price * p.quantity));
            return {
                totalItems: products.value.length,
                totalValue: totalValue
            };
        });

        const categories = computed(() => {
            const cats = new Set(products.value.map(p => p.category).filter(c => c));
            return Array.from(cats).sort();
        });

        const lowStockProducts = computed(() => {
            return products.value.filter(p => p.quantity < 5).sort((a, b) => a.quantity - b.quantity);
        });

        const lowStockCount = computed(() => lowStockProducts.value.length);

        const sortedFilteredProducts = computed(() => {
            let result = products.value.filter(p => {
                const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase());
                const matchesCategory = selectedCategory.value === '' || p.category === selectedCategory.value;
                return matchesSearch && matchesCategory;
            });

            // Sorting logic
            result.sort((a, b) => {
                let valA = a[sortKey.value];
                let valB = b[sortKey.value];
                
                // Handle nulls/undefined for Category sorting
                if(valA === null) valA = '';
                if(valB === null) valB = '';

                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();
                
                if (valA < valB) return sortAsc.value ? -1 : 1;
                if (valA > valB) return sortAsc.value ? 1 : -1;
                return 0;
            });

            return result;
        });

        // View switching
        const switchView = (view) => {
            currentView.value = view;
            if (view === 'dashboard') {
                nextTick(() => renderChart());
            }
        };

        // Actions
        const toggleSort = (key) => {
            if (sortKey.value === key) {
                sortAsc.value = !sortAsc.value;
            } else {
                sortKey.value = key;
                sortAsc.value = true; // default to ascending when switching columns
            }
        };

        const showToast = (message, type = 'success') => {
            const id = toastIdSequence++;
            toasts.value.push({ id, message, type });
            setTimeout(() => {
                removeToast(id);
            }, 4000);
        };

        const removeToast = (id) => {
            toasts.value = toasts.value.filter(t => t.id !== id);
        };

        const fetchProducts = async () => {
            loading.value = true;
            try {
                const response = await axios.get(API_BASE);
                products.value = response.data;
                // Re-render chart if dashboard is active
                if (currentView.value === 'dashboard') {
                    nextTick(() => renderChart());
                }
            } catch (error) {
                showToast('Failed to synchronize with server', 'error');
                console.error(error);
            } finally {
                loading.value = false;
            }
        };

        const exportCSV = () => {
            const headers = ['System_ID', 'Product_Name', 'Category', 'Unit_Price', 'Stock_Level', 'Status'];
            
            const rows = sortedFilteredProducts.value.map(p => {
                let status = p.quantity > 15 ? 'Optimal' : (p.quantity > 5 ? 'Warning' : 'Critical');
                return `${p.id},"${p.name}","${p.category || ''}",${p.price},${p.quantity},${status}`;
            });

            const csvContent = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `ERP_Export_${new Date().toISOString().slice(0,10)}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast('Data exported successfully', 'success');
        };

        // Chart Initialization
        const renderChart = () => {
            const canvas = document.getElementById('inventoryChart');
            if(!canvas) return;

            const ctx = canvas.getContext('2d');
            
            // Distribute items into chart formats
            const catData = {};
            products.value.forEach(p => {
                const c = p.category || 'Uncategorized';
                catData[c] = (catData[c] || 0) + 1;
            });
            
            if (inventoryChart) {
                inventoryChart.destroy();
            }

            // High end color palette
            const colors = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#0ea5e9'];

            inventoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(catData),
                    datasets: [{
                        data: Object.values(catData),
                        backgroundColor: colors,
                        hoverOffset: 4,
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: {
                                    family: "'Inter', sans-serif",
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            padding: 12,
                            cornerRadius: 8,
                            titleFont: { size: 14, family: "'Inter', sans-serif" },
                            bodyFont: { size: 13, family: "'Inter', sans-serif" }
                        }
                    }
                }
            });
        };

        // Modals
        const openCreateModal = () => {
            isEditing.value = false;
            form.value = { id: null, name: '', price: null, quantity: null, category: '' };
            showModal.value = true;
        };

        const openEditModal = (product) => {
            isEditing.value = true;
            form.value = { ...product };
            showModal.value = true;
        };

        const closeModal = () => {
            showModal.value = false;
        };

        const saveProduct = async () => {
            saving.value = true;
            try {
                const payload = {
                    name: form.value.name,
                    price: Number(form.value.price),
                    quantity: Number(form.value.quantity),
                    category: form.value.category || null
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
                const errorMsg = error.response?.data?.detail || 'Transaction failed';
                showToast(errorMsg, 'error');
            } finally {
                saving.value = false;
            }
        };

        const confirmDelete = async (product) => {
            if (confirm(`WARNING: Deleting record for "${product.name}". This action cannot be reversed. Proceed?`)) {
                try {
                    await axios.delete(`${API_BASE}/${product.id}`);
                    showToast('Record purged from database');
                    await fetchProducts();
                } catch (error) {
                    showToast('Delete operation failed', 'error');
                }
            }
        };

        // Initialization
        onMounted(() => {
            fetchProducts();
        });

        // Watch for window resize to redraw chart gracefully
        window.addEventListener('resize', () => {
            if (currentView.value === 'dashboard' && inventoryChart) {
                inventoryChart.resize();
            }
        });

        return {
            currentView, products, loading, saving,
            searchQuery, selectedCategory, sortKey, sortAsc, categories,
            stats, lowStockProducts, lowStockCount, sortedFilteredProducts,
            showModal, isEditing, form, toasts,
            switchView, toggleSort, exportCSV,
            openCreateModal, openEditModal, closeModal, saveProduct, confirmDelete, removeToast, fetchProducts
        };
    }
}).mount('#app');