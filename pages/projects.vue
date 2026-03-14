<template>
  <div class="space-y-6">
    <!-- Header Controls -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-start sm:items-center">
        <div class="relative w-full sm:w-64">
          <IconField iconPosition="left">
              <InputIcon class="pi pi-search"> </InputIcon>
              <InputText v-model="searchQuery" placeholder="Tìm theo tên công trình..." class="w-full pl-10" />
          </IconField>
        </div>
                <MultiSelect
                    v-model="selectedStatuses"
                    :options="statuses"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Lọc theo trạng thái"
                    display="chip"
                    filter
                    class="w-full sm:w-72"
                />
        <CustomCalendar v-model="filterDate" selectionMode="range" :manualInput="false" placeholder="Lọc theo ngày" dateFormat="dd/mm/yy" class="w-full sm:w-64" showClear />
      </div>
      <Button icon="pi pi-plus" label="Thêm Công Trình" class="w-full sm:w-auto p-button-primary shadow-sm" @click="openNew" />
    </div>

    <!-- Data Table -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <div v-if="selectedProjects.length" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                <div class="text-sm text-emerald-800 font-medium">
                    Đã chọn {{ selectedProjects.length }} công trình.
                </div>
                <Button icon="pi pi-file-excel" label="Xuất Excel" severity="success" @click="exportSelectedProjects" />
            </div>

            <DataTable v-model:selection="selectedProjects" dataKey="id" :value="filteredProjects" paginator :rows="10" :rowsPerPageOptions="[10, 20, 50]" 
        responsiveLayout="scroll" class="p-datatable-sm" hoverRole stripedRows emptyMessage="Không tìm thấy dữ liệu.">
                <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
        <Column field="name" header="Tên công trình" sortable style="min-width: 14rem">
          <template #body="{ data }">
            <span class="font-medium text-slate-800">{{ data.name }}</span>
          </template>
        </Column>
        <Column field="customer_name" header="Khách hàng" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="text-slate-600">{{ data.customer_name || '—' }}</span>
          </template>
        </Column>
        <Column field="contract_value" header="Hợp đồng (VNĐ)" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="text-slate-700 font-medium">{{ formatCurrency(data.contract_value) }}</span>
          </template>
        </Column>
        <Column field="total_received" header="Đã thu" sortable style="min-width: 9rem">
          <template #body="{ data }">
            <span class="text-emerald-600 font-semibold">{{ formatCurrency(data.total_received) }}</span>
          </template>
        </Column>
        <Column field="total_spent" header="Đã chi" sortable style="min-width: 9rem">
          <template #body="{ data }">
            <span class="text-red-500 font-semibold">{{ formatCurrency(data.total_spent) }}</span>
          </template>
        </Column>
        <Column field="status" header="Trạng thái" sortable style="min-width: 8rem">
          <template #body="{ data }">
            <Tag :severity="getStatusSeverity(data.status)" :value="data.status"></Tag>
          </template>
        </Column>
        <Column field="start_date" header="Ngày BĐ" sortable style="min-width: 7rem">
          <template #body="{ data }">
             <span class="text-slate-500 text-sm">{{ formatDate(data.start_date) }}</span>
          </template>
        </Column>
        <Column header="Thao tác" :exportable="false" style="min-width: 10rem">
            <template #body="{ data }">
                <Button icon="pi pi-eye" outlined rounded severity="secondary" class="mr-1" v-tooltip.top="'Xem chi tiết'" @click="viewDetail(data)" />
                <Button icon="pi pi-pencil" outlined rounded severity="info" class="mr-1" @click="editProject(data)" />
                <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteProject(data)" />
            </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:visible="productDialog" :style="{ width: '500px' }" :header="dialogTitle" :modal="true" class="p-fluid">
      <div class="flex flex-col gap-4 mt-4">
        <div class="flex flex-col gap-1">
            <label for="name" class="font-medium text-slate-700">Tên công trình *</label>
            <InputText id="name" v-model.trim="project.name" required="true" :invalid="submitted && !project.name" />
            <small class="p-error text-red-500" v-if="submitted && !project.name">Tên là bắt buộc.</small>
        </div>

        <div class="flex flex-col gap-1">
            <div class="flex justify-between items-center">
                <label for="customer" class="font-medium text-slate-700">Khách hàng</label>
                <button type="button" class="text-xs text-primary-600 hover:underline font-medium" @click="showNewCustomer = !showNewCustomer">
                    <i class="pi pi-plus mr-1"></i>{{ showNewCustomer ? 'Hủy tạo mới' : 'Tạo KH mới' }}
                </button>
            </div>
            <Dropdown v-if="!showNewCustomer" id="customer" v-model="project.customer_id" :options="customers" optionLabel="name" optionValue="id" placeholder="Chọn khách hàng" showClear />
            <div v-else class="flex gap-2">
                <InputText v-model.trim="newCustomerName" placeholder="Tên khách hàng mới" class="flex-1" />
                <Button icon="pi pi-check" severity="success" size="small" :loading="creatingCustomer" @click="createQuickCustomer" />
            </div>
        </div>

        <div class="flex flex-col gap-1">
            <label for="contract_value" class="font-medium text-slate-700">Giá trị hợp đồng *</label>
            <InputNumber id="contract_value" v-model="project.contract_value" mode="currency" currency="VND" locale="vi-VN" :invalid="submitted && !project.contract_value" />
            <small class="p-error text-red-500" v-if="submitted && !project.contract_value">Giá trị hợp đồng là bắt buộc.</small>
        </div>

        <div class="flex flex-col gap-1">
            <label for="status" class="font-medium text-slate-700">Trạng thái</label>
            <Dropdown id="status" v-model="project.status" :options="statuses" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" />
        </div>

        <div class="flex flex-col gap-1">
            <label for="start_date" class="font-medium text-slate-700">Ngày bắt đầu</label>
            <CustomCalendar id="start_date" v-model="project.start_date" dateFormat="dd/mm/yy" :showIcon="true" />
        </div>

         <div class="flex flex-col gap-1">
             <label for="note" class="font-medium text-slate-700">Ghi chú</label>
             <Textarea id="note" v-model="project.note" rows="3" />
         </div>
      </div>

      <template #footer>
          <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" class="text-slate-600" />
          <Button label="Lưu" icon="pi pi-check" :loading="loading" @click="saveProject" />
      </template>
    </Dialog>

    <!-- Detail Dialog -->
    <Dialog v-model:visible="detailDialog" :style="{ width: '700px' }" :header="'Chi tiết: ' + (detailProject?.name || '')" :modal="true">
        <div v-if="detailLoading" class="flex justify-center py-8">
            <i class="pi pi-spin pi-spinner text-2xl text-slate-400"></i>
        </div>
        <div v-else-if="detailProject" class="flex flex-col gap-6 mt-2">
            <!-- Summary Cards -->
            <div class="grid grid-cols-3 gap-4">
                <div class="bg-slate-50 rounded-lg p-4 border text-center">
                    <p class="text-xs text-slate-500 mb-1">Hợp đồng</p>
                    <p class="text-lg font-bold text-slate-800">{{ formatCurrency(detailProject.contract_value) }}</p>
                </div>
                <div class="bg-emerald-50 rounded-lg p-4 border border-emerald-200 text-center">
                    <p class="text-xs text-emerald-600 mb-1">Tổng thu</p>
                    <p class="text-lg font-bold text-emerald-700">{{ formatCurrency(detailTotalReceived) }}</p>
                </div>
                <div class="bg-red-50 rounded-lg p-4 border border-red-200 text-center">
                    <p class="text-xs text-red-500 mb-1">Tổng chi</p>
                    <p class="text-lg font-bold text-red-600">{{ formatCurrency(detailTotalSpent) }}</p>
                </div>
            </div>

            <!-- Receipts -->
            <div>
                <h4 class="font-bold text-slate-700 mb-2 flex items-center gap-2"><i class="pi pi-arrow-down text-emerald-500"></i> Phiếu thu ({{ detailProject.receipts?.length || 0 }})</h4>
                <DataTable :value="detailProject.receipts" class="p-datatable-sm" stripedRows emptyMessage="Chưa có phiếu thu nào." :rows="5" paginator>
                    <Column field="date" header="Ngày" style="width: 8rem">
                        <template #body="{ data }"><span class="text-sm">{{ formatDate(data.date) }}</span></template>
                    </Column>
                    <Column field="amount" header="Số tiền">
                        <template #body="{ data }"><span class="text-emerald-600 font-medium">{{ formatCurrency(data.amount) }}</span></template>
                    </Column>
                    <Column field="note" header="Ghi chú">
                        <template #body="{ data }"><span class="text-slate-500 text-sm">{{ data.note || '—' }}</span></template>
                    </Column>
                </DataTable>
            </div>

            <!-- Expenses -->
            <div>
                <h4 class="font-bold text-slate-700 mb-2 flex items-center gap-2"><i class="pi pi-arrow-up text-red-500"></i> Phiếu chi ({{ detailProject.expenses?.length || 0 }})</h4>
                <DataTable :value="detailProject.expenses" class="p-datatable-sm" stripedRows emptyMessage="Chưa có phiếu chi nào." :rows="5" paginator>
                    <Column field="date" header="Ngày" style="width: 8rem">
                        <template #body="{ data }"><span class="text-sm">{{ formatDate(data.date) }}</span></template>
                    </Column>
                    <Column field="type" header="Loại" style="width: 6rem">
                        <template #body="{ data }"><Tag :severity="data.type === 'material' ? 'warn' : 'info'" :value="data.type === 'material' ? 'Vật tư' : 'Nhân công'" /></template>
                    </Column>
                    <Column field="amount" header="Số tiền">
                        <template #body="{ data }"><span class="text-red-500 font-medium">{{ formatCurrency(data.amount) }}</span></template>
                    </Column>
                    <Column field="note" header="Ghi chú">
                        <template #body="{ data }"><span class="text-slate-500 text-sm">{{ data.note || '—' }}</span></template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const searchQuery = ref('');
const filterDate = ref(null);
const selectedStatuses = ref([]);
const selectedProjects = ref([]);
const loading = ref(false);
const submitted = ref(false);
const productDialog = ref(false);
const dialogTitle = ref('Chi Tiết Công Trình');
const detailDialog = ref(false);
const detailProject = ref(null);
const detailLoading = ref(false);

const emptyProject = {
    id: null,
    name: '',
    customer_id: null,
    contract_value: null,
    status: 'đang thi công',
    start_date: null,
    note: ''
};
const project = ref({ ...emptyProject });
const showNewCustomer = ref(false);
const newCustomerName = ref('');
const creatingCustomer = ref(false);

const statuses = ref([
    { label: 'Đang thi công', value: 'đang thi công' },
    { label: 'Tạm dừng', value: 'tạm dừng' },
    { label: 'Đã hoàn thành', value: 'đã hoàn thành' }
]);

// Fetch Data from Server
const { data: projects, refresh } = await useFetch('/api/projects', { default: () => [] });
const { data: customers, refresh: refreshCustomers } = await useFetch('/api/customers', { default: () => [] });

const createQuickCustomer = async () => {
    if (!newCustomerName.value.trim()) return;
    creatingCustomer.value = true;
    try {
        const newC = await $fetch('/api/customers', { method: 'POST', body: { name: newCustomerName.value } });
        await refreshCustomers();
        project.value.customer_id = newC.id;
        newCustomerName.value = '';
        showNewCustomer.value = false;
    } catch (e) {
        console.error(e);
    } finally {
        creatingCustomer.value = false;
    }
};

const filteredProjects = computed(() => {
    let result = projects.value;

    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        result = result.filter(p => p.name.toLowerCase().includes(q) || (p.customer_name && p.customer_name.toLowerCase().includes(q)));
    }

    if (selectedStatuses.value.length) {
        result = result.filter(p => selectedStatuses.value.includes(p.status));
    }

    if (filterDate.value && filterDate.value.length === 2 && filterDate.value[0]) {
        const start = new Date(filterDate.value[0]);
        start.setHours(0, 0, 0, 0);
        let end = filterDate.value[1] ? new Date(filterDate.value[1]) : new Date(filterDate.value[0]);
        end.setHours(23, 59, 59, 999);
        result = result.filter(r => {
            if (!r.start_date) return false;
            const rDate = new Date(r.start_date);
            return rDate >= start && rDate <= end;
        });
    }

    return result;
});

const formatCurrency = (value) => {
    return value != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value) : '0 ₫';
};

const formatDate = (value) => {
    return value ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) : '';
};

const getStatusSeverity = (status) => {
    switch (status) {
        case 'đang thi công': return 'success';
        case 'tạm dừng': return 'warn';
        case 'đã hoàn thành': return 'info';
        default: return null;
    }
};

const exportSelectedProjects = async () => {
    if (!selectedProjects.value.length || !import.meta.client) return;

    const XLSX = await import('xlsx');
    const rows = selectedProjects.value.map((item, index) => ({
        'STT': index + 1,
        'Tên công trình': item.name,
        'Khách hàng': item.customer_name || '',
        'Giá trị hợp đồng': item.contract_value || 0,
        'Đã thu': item.total_received || 0,
        'Đã chi': item.total_spent || 0,
        'Trạng thái': item.status || '',
        'Ngày bắt đầu': formatDate(item.start_date),
        'Ghi chú': item.note || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CongTrinh');
    XLSX.writeFile(workbook, `cong-trinh-${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const detailTotalReceived = computed(() => detailProject.value?.receipts?.reduce((s, r) => s + (r.amount || 0), 0) || 0);
const detailTotalSpent = computed(() => detailProject.value?.expenses?.reduce((s, e) => s + (e.amount || 0), 0) || 0);

const viewDetail = async (data) => {
    detailDialog.value = true;
    detailLoading.value = true;
    detailProject.value = null;
    try {
        detailProject.value = await $fetch(`/api/projects/${data.id}`);
    } catch (e) {
        console.error(e);
    } finally {
        detailLoading.value = false;
    }
};

const openNew = () => {
    project.value = { ...emptyProject };
    submitted.value = false;
    showNewCustomer.value = false;
    dialogTitle.value = 'Thêm Công Trình Mới';
    productDialog.value = true;
};

const hideDialog = () => {
    productDialog.value = false;
    submitted.value = false;
};

const editProject = (prod) => {
    project.value = { 
        ...prod,
        start_date: prod.start_date ? new Date(prod.start_date) : null,
        contract_value: Number(prod.contract_value) || null
    };
    showNewCustomer.value = false;
    dialogTitle.value = 'Sửa Công Trình';
    productDialog.value = true;
};

const confirmDeleteProject = async (prod) => {
    if (confirm(`Bạn có chắc chắn muốn xóa công trình "${prod.name}"? Dữ liệu không thể khôi phục.`)) {
        try {
            await $fetch(`/api/projects/${prod.id}`, { method: 'DELETE' });
            await refresh();
        } catch (e) {
            console.error("Lỗi khi xóa:", e);
        }
    }
};

const saveProject = async () => {
    submitted.value = true;
    if (project.value.name?.trim() && project.value.contract_value) {
        loading.value = true;
        try {
            if (project.value.id) {
                await $fetch(`/api/projects/${project.value.id}`, {
                    method: 'PUT',
                    body: project.value
                });
            } else {
                await $fetch('/api/projects', {
                    method: 'POST',
                    body: project.value
                });
            }
            await refresh();
            productDialog.value = false;
            project.value = { ...emptyProject };
        } catch (e) {
            console.error("Lỗi khi lưu:", e);
        } finally {
            loading.value = false;
        }
    }
};
</script>
