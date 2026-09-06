const STORAGE_KEY = 'nexo-supply-products';

const defaultProducts = [
  { id: 'NS-001', name: 'Auriculares Pro X2', category: 'Tecnología', price: 129.99, stock: 148, icon: '◉', tone: '' },
  { id: 'NS-002', name: 'Teclado mecánico K8', category: 'Tecnología', price: 89.50, stock: 86, icon: '⌨', tone: 'tone-two' },
  { id: 'NS-003', name: 'Cámara web Horizon', category: 'Tecnología', price: 74.25, stock: 12, icon: '▣', tone: 'tone-three' },
  { id: 'NS-004', name: 'Mochila Transit 20L', category: 'Accesorios', price: 56.00, stock: 241, icon: '▰', tone: 'tone-four' },
  { id: 'NS-005', name: 'Lámpara de escritorio Luma', category: 'Hogar', price: 42.80, stock: 7, icon: '◐', tone: 'tone-two' },
  { id: 'NS-006', name: 'Hub USB-C Essential', category: 'Tecnología', price: 35.90, stock: 195, icon: '⊞', tone: 'tone-three' },
  { id: 'NS-007', name: 'Botella térmica 750ml', category: 'Accesorios', price: 24.90, stock: 0, icon: '♧', tone: 'tone-four' },
  { id: 'NS-008', name: 'Organizador modular', category: 'Hogar', price: 18.75, stock: 559, icon: '▤', tone: '' }
];

let products = loadProducts();
let editingId = null;
let toastTimer;

const elements = {
  tableBody: document.querySelector('#productTableBody'),
  emptyState: document.querySelector('#emptyState'),
  search: document.querySelector('#searchInput'),
  categoryFilter: document.querySelector('#categoryFilter'),
  statusFilter: document.querySelector('#statusFilter'),
  clearFilters: document.querySelector('#clearFilters'),
  selectAll: document.querySelector('#selectAll'),
  modal: document.querySelector('#productModal'),
  form: document.querySelector('#productForm'),
  modalTitle: document.querySelector('#modalTitle'),
  productId: document.querySelector('#productId'),
  productName: document.querySelector('#productName'),
  productCategory: document.querySelector('#productCategory'),
  productPrice: document.querySelector('#productPrice'),
  productStock: document.querySelector('#productStock'),
  toast: document.querySelector('#toast')
};

function loadProducts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [...defaultProducts];
  } catch (error) {
    return [...defaultProducts];
  }
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD' }).format(value);
}

function getStatus(stock) {
  if (stock === 0) return { key: 'out', label: 'Agotado' };
  if (stock <= 15) return { key: 'low', label: 'Stock bajo' };
  return { key: 'available', label: 'Disponible' };
}

function getFilteredProducts() {
  const query = elements.search.value.trim().toLowerCase();
  const category = elements.categoryFilter.value;
  const status = elements.statusFilter.value;
  return products.filter((product) => {
    const matchesQuery = !query || product.name.toLowerCase().includes(query) || product.id.toLowerCase().includes(query);
    const matchesCategory = category === 'all' || product.category === category;
    const matchesStatus = status === 'all' || getStatus(product.stock).key === status;
    return matchesQuery && matchesCategory && matchesStatus;
  });
}

function renderCategories() {
  const categories = [...new Set(products.map((product) => product.category))].sort();
  const currentFilter = elements.categoryFilter.value;
  elements.categoryFilter.innerHTML = '<option value="all">Todas</option>' + categories.map((category) => `<option value="${category}">${category}</option>`).join('');
  elements.categoryFilter.value = categories.includes(currentFilter) ? currentFilter : 'all';
  elements.productCategory.innerHTML = categories.map((category) => `<option value="${category}">${category}</option>`).join('');
}

function renderTable() {
  const filteredProducts = getFilteredProducts();
  elements.tableBody.innerHTML = filteredProducts.map((product) => {
    const status = getStatus(product.stock);
    const stockClass = status.key === 'low' ? 'stock-low' : status.key === 'out' ? 'stock-out' : '';
    return `<tr>
      <td><input type="checkbox" class="row-check" aria-label="Seleccionar ${product.name}"></td>
      <td><div class="product-cell"><span class="product-image ${product.tone}">${product.icon}</span><div><div class="product-name">${product.name}</div><div class="product-sku">SKU · ${product.id}</div></div></div></td>
      <td>${product.id}</td><td>${product.category}</td><td class="price">${formatCurrency(product.price)}</td><td class="stock ${stockClass}">${product.stock} uds.</td>
      <td><span class="badge ${status.key}">${status.label}</span></td><td><div class="row-actions"><button class="row-action edit-product" data-id="${product.id}" aria-label="Editar ${product.name}">✎</button><button class="row-action delete-product" data-id="${product.id}" aria-label="Eliminar ${product.name}">⌫</button></div></td>
    </tr>`;
  }).join('');
  elements.emptyState.hidden = filteredProducts.length !== 0;
  elements.selectAll.checked = false;
  document.querySelector('#resultsSummary').textContent = `Mostrando ${filteredProducts.length} de ${products.length} productos`;
  document.querySelector('#productCountBadge').textContent = products.length;
  document.querySelector('#navProductCount').textContent = products.length;
  elements.clearFilters.disabled = !elements.search.value && elements.categoryFilter.value === 'all' && elements.statusFilter.value === 'all';
  bindRowActions();
}

function clearFilters() {
  elements.search.value = '';
  elements.categoryFilter.value = 'all';
  elements.statusFilter.value = 'all';
  renderTable();
}

function renderMetrics() {
  const totalValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);
  const totalUnits = products.reduce((sum, product) => sum + Number(product.stock), 0);
  const lowStock = products.filter((product) => getStatus(product.stock).key === 'low').length;
  document.querySelector('#totalProducts').textContent = products.length;
  document.querySelector('#inventoryValue').textContent = formatCurrency(totalValue);
  document.querySelector('#totalUnits').textContent = totalUnits.toLocaleString('es-ES');
  document.querySelector('#lowStock').textContent = lowStock;
  document.querySelector('#activePercent').textContent = products.length ? '100%' : '0%';
}

function render() { renderCategories(); renderTable(); renderMetrics(); }

function openModal(product = null) {
  editingId = product?.id || null;
  elements.modalTitle.textContent = product ? 'Editar producto' : 'Nuevo producto';
  elements.productId.value = product?.id || '';
  elements.productName.value = product?.name || '';
  elements.productPrice.value = product?.price ?? '';
  elements.productStock.value = product?.stock ?? '';
  if (product && ![...elements.productCategory.options].some((option) => option.value === product.category)) {
    elements.productCategory.insertAdjacentHTML('beforeend', `<option value="${product.category}">${product.category}</option>`);
  }
  elements.productCategory.value = product?.category || elements.productCategory.options[0]?.value || '';
  elements.modal.hidden = false;
  elements.productName.focus();
}

function closeModal() { elements.modal.hidden = true; elements.form.reset(); editingId = null; }

function bindRowActions() {
  document.querySelectorAll('.edit-product').forEach((button) => button.addEventListener('click', () => openModal(products.find((product) => product.id === button.dataset.id))));
  document.querySelectorAll('.delete-product').forEach((button) => button.addEventListener('click', () => deleteProduct(button.dataset.id)));
}

function deleteProduct(id) {
  const product = products.find((item) => item.id === id);
  if (!product || !window.confirm(`¿Eliminar ${product.name} del inventario?`)) return;
  products = products.filter((item) => item.id !== id);
  saveProducts(); render(); showToast('Producto eliminado correctamente');
}

function exportCsv() {
  const headers = ['ID', 'Nombre', 'Precio', 'Categoría', 'Stock', 'Estado'];
  const rows = products.map((product) => [product.id, product.name, product.price, product.category, product.stock, getStatus(product.stock).label]);
  const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  link.download = 'nexo-supply-inventario.csv'; link.click(); URL.revokeObjectURL(link.href);
  showToast('Inventario exportado como CSV');
}

function showToast(message) { clearTimeout(toastTimer); elements.toast.textContent = message; elements.toast.classList.add('show'); toastTimer = setTimeout(() => elements.toast.classList.remove('show'), 2800); }

elements.form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = { name: elements.productName.value.trim(), category: elements.productCategory.value, price: Number(elements.productPrice.value), stock: Number(elements.productStock.value) };
  if (editingId) {
    products = products.map((product) => product.id === editingId ? { ...product, ...data } : product);
    showToast('Producto actualizado correctamente');
  } else {
    const nextNumber = products.reduce((max, product) => Math.max(max, Number(product.id.split('-')[1]) || 0), 0) + 1;
    products.unshift({ ...data, id: `NS-${String(nextNumber).padStart(3, '0')}`, icon: '◈', tone: 'tone-three' });
    showToast('Producto agregado al inventario');
  }
  saveProducts(); render(); closeModal();
});

document.querySelector('#newProductButton').addEventListener('click', () => openModal());
document.querySelector('#closeModal').addEventListener('click', closeModal);
document.querySelector('#cancelModal').addEventListener('click', closeModal);
elements.modal.addEventListener('click', (event) => { if (event.target === elements.modal) closeModal(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !elements.modal.hidden) closeModal(); });
elements.search.addEventListener('input', renderTable);
elements.categoryFilter.addEventListener('change', renderTable);
elements.statusFilter.addEventListener('change', renderTable);
elements.clearFilters.addEventListener('click', clearFilters);
elements.selectAll.addEventListener('change', () => document.querySelectorAll('.row-check').forEach((checkbox) => { checkbox.checked = elements.selectAll.checked; }));
document.querySelector('#exportButton').addEventListener('click', exportCsv);

render();