<template>
  <div class="space-y-6">
    <!-- Header Controls -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <div class="flex gap-4 w-full sm:w-auto">
          <div class="relative w-full sm:w-64">
            <IconField iconPosition="left">
                <InputIcon class="pi pi-search"> </InputIcon>
                <InputText v-model="searchQuery" placeholder="Tìm theo công trình..." class="w-full pl-10" />
            </IconField>
          </div>
          <Dropdown v-model="selectedProject" :options="projects" optionLabel="name" optionValue="id" placeholder="Lọc theo công trình" class="w-full sm:w-64" showClear />
          <CustomCalendar v-model="filterDate" selectionMode="range" :manualInput="false" placeholder="Lọc theo ngày" dateFormat="dd/mm/yy" class="w-full sm:w-64" showClear />
      </div>

      <Button icon="pi pi-plus" label="Thêm Khoản Thu" class="w-full sm:w-auto p-button-success shadow-sm" @click="openNew" />
    </div>

    <!-- Data Table -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <DataTable :value="filteredReceipts" paginator :rows="10" :rowsPerPageOptions="[10, 20, 50]" 
        responsiveLayout="scroll" class="p-datatable-sm" hoverRole stripedRows emptyMessage="Không tìm thấy dữ liệu.">
        
        <Column field="date" header="Ngày thu" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="text-slate-600 font-medium">{{ formatDate(data.date) }}</span>
          </template>
        </Column>

        <Column field="projectName" header="Thuộc Công trình" sortable style="min-width: 14rem">
          <template #body="{ data }">
            <span class="font-medium text-slate-800">{{ getProjectName(data.project_id) }}</span>
          </template>
        </Column>

        <Column field="amount" header="Số tiền (VNĐ)" sortable style="min-width: 12rem">
          <template #body="{ data }">
            <span class="text-green-600 font-bold bg-green-50 px-2 py-1 rounded-md">{{ formatCurrency(data.amount) }}</span>
          </template>
        </Column>

        <Column field="note" header="Ghi chú" style="min-width: 12rem">
            <template #body="{ data }">
                <span class="text-slate-500 italic text-sm">{{ data.note || 'Không có' }}</span>
            </template>
        </Column>

        <Column field="created_by_name" header="Người thu" sortable style="min-width: 10rem">
             <template #body="{ data }">
            <Tag severity="secondary" rounded :value="data.created_by_name || data.created_by"></Tag>
            </template>
        </Column>

        <Column header="Thao tác" :exportable="false" style="min-width: 8rem">
            <template #body="{ data }">
                <Button icon="pi pi-pencil" outlined rounded severity="info" class="mr-2" @click="editReceipt(data)" />
                <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteReceipt(data)" />
            </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:visible="receiptDialog" :style="{ width: '450px' }" :header="dialogTitle" :modal="true" class="p-fluid">
      <div class="flex flex-col gap-4 mt-4">
        <div class="flex flex-col gap-1">
            <label for="project" class="font-medium text-slate-700">Công trình *</label>
            <Dropdown id="project" v-model="receipt.project_id" :options="projects" optionLabel="name" optionValue="id" placeholder="Chọn công trình" :invalid="submitted && !receipt.project_id" />
            <small class="p-error text-red-500" v-if="submitted && !receipt.project_id">Bắt buộc chọn công trình.</small>
        </div>

        <div class="flex flex-col gap-1">
            <label for="amount" class="font-medium text-slate-700">Số tiền thu *</label>
            <InputNumber id="amount" v-model="receipt.amount" mode="currency" currency="VND" locale="vi-VN" :invalid="submitted && !receipt.amount" />
            <small class="p-error text-red-500" v-if="submitted && !receipt.amount">Số tiền là bắt buộc.</small>
        </div>

        <div class="flex flex-col gap-1">
            <label for="date" class="font-medium text-slate-700">Ngày thu</label>
            <CustomCalendar id="date" v-model="receipt.date" dateFormat="dd/mm/yy" :showIcon="true" />
        </div>

         <div class="flex flex-col gap-1">
             <label for="note" class="font-medium text-slate-700">Ghi chú</label>
             <Textarea id="note" v-model="receipt.note" rows="3" placeholder="Nhập lý do hoặc thông tin người nộp..." />
         </div>
      </div>

      <template #footer>
          <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" class="text-slate-600" />
          <Button label="Lưu" icon="pi pi-check" :loading="loading" @click="saveReceipt" severity="success" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const searchQuery = ref('');
const selectedProject = ref(null);
const filterDate = ref(null);
const loading = ref(false);
const submitted = ref(false);
const receiptDialog = ref(false);
const dialogTitle = ref('Chi Tiết Khoản Thu');

const emptyReceipt = {
    id: null,
    project_id: null,
    amount: null,
    date: new Date(),
    note: '',
    created_by: 'Admin'
};
const receipt = ref({ ...emptyReceipt });

// Fetch Data from Server
const { data: projects } = await useFetch('/api/projects', { default: () => [] });
const { data: receipts, refresh } = await useFetch('/api/receipts', { default: () => [] });

const filteredReceipts = computed(() => {
    let result = receipts.value;
    
    // Filter by project dropdown
    if (selectedProject.value) {
        result = result.filter(r => r.project_id === selectedProject.value);
    }
    
    // Filter by text search
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(r => {
            const pName = getProjectName(r.project_id).toLowerCase();
            return pName.includes(query) || (r.note && r.note.toLowerCase().includes(query));
        });
    }

    // Filter by Date Range
    if (filterDate.value && filterDate.value.length === 2 && filterDate.value[0]) {
        const start = new Date(filterDate.value[0]);
        start.setHours(0, 0, 0, 0);
        
        let end = filterDate.value[1] ? new Date(filterDate.value[1]) : new Date(filterDate.value[0]);
        end.setHours(23, 59, 59, 999);

        result = result.filter(r => {
            const rDate = new Date(r.date);
            return rDate >= start && rDate <= end;
        });
    }

    // Sort by Date DESC
    return result.sort((a,b) => b.date - a.date);
});

const getProjectName = (id) => {
    const p = projects.value.find(p => p.id === id);
    return p ? p.name : 'Unknown';
}

const formatCurrency = (value) => {
    return value ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value) : '';
};

const formatDate = (value) => {
    return value ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) : '';
};

const openNew = () => {
    receipt.value = { ...emptyReceipt };
    submitted.value = false;
    dialogTitle.value = 'Thêm Khoản Thu Mới';
    receiptDialog.value = true;
};

const hideDialog = () => {
    receiptDialog.value = false;
    submitted.value = false;
};

const editReceipt = (data) => {
    receipt.value = { 
        ...data,
        date: data.date ? new Date(data.date) : null,
        amount: Number(data.amount) || null
    };
    dialogTitle.value = 'Chỉnh Sửa Khoản Thu';
    receiptDialog.value = true;
};

const confirmDeleteReceipt = async (data) => {
    if (confirm(`Bạn có chắc chắn muốn xóa phiếu thu này?`)) {
        try {
            await $fetch(`/api/receipts/${data.id}`, { method: 'DELETE' });
            await refresh();
        } catch (e) {
            console.error("Lỗi khi xóa:", e);
        }
    }
};

const saveReceipt = async () => {
    submitted.value = true;
    if (receipt.value.amount && receipt.value.project_id) {
        loading.value = true;
        try {
            if (receipt.value.id) {
                await $fetch(`/api/receipts/${receipt.value.id}`, {
                    method: 'PUT',
                    body: receipt.value
                });
            } else {
                await $fetch('/api/receipts', {
                    method: 'POST',
                    body: receipt.value
                });
            }
            await refresh();
            receiptDialog.value = false;
            receipt.value = { ...emptyReceipt };
        } catch (e) {
            console.error("Lỗi khi lưu:", e);
        } finally {
            loading.value = false;
        }
    }
};
</script>
