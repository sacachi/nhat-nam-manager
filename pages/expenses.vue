<template>
  <div class="space-y-6">
    <!-- Header Controls -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div class="relative w-full sm:w-64">
            <IconField iconPosition="left">
                <InputIcon class="pi pi-search"> </InputIcon>
                <InputText v-model="searchQuery" placeholder="Tìm kiếm ghi chú..." class="w-full pl-10" />
            </IconField>
          </div>
          <Dropdown v-model="selectedProject" :options="projects" optionLabel="name" optionValue="id" placeholder="Lọc theo công trình" class="w-full sm:w-64" showClear />
          <Dropdown v-model="selectedType" :options="types" optionLabel="label" optionValue="value" placeholder="Loại chi" class="w-full sm:w-40" showClear />
          <CustomCalendar v-model="filterDate" selectionMode="range" :manualInput="false" placeholder="Lọc theo ngày" dateFormat="dd/mm/yy" class="w-full sm:w-64" showClear />
      </div>

      <Button icon="pi pi-plus" label="Thêm Khoản Chi" class="w-full sm:w-auto p-button-danger shadow-sm" @click="openNew" />
    </div>

    <!-- Data Table -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <DataTable :value="filteredExpenses" paginator :rows="10" :rowsPerPageOptions="[10, 20, 50]" 
        responsiveLayout="scroll" class="p-datatable-sm" hoverRole stripedRows emptyMessage="Không tìm thấy dữ liệu.">
        
        <Column field="date" header="Ngày chi" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="text-slate-600 font-medium">{{ formatDate(data.date) }}</span>
          </template>
        </Column>

        <Column field="projectName" header="Thuộc Công trình" sortable style="min-width: 14rem">
          <template #body="{ data }">
            <span class="font-medium text-slate-800">{{ getProjectName(data.project_id) }}</span>
          </template>
        </Column>

        <Column field="type" header="Loại" sortable style="min-width: 8rem">
          <template #body="{ data }">
            <Tag :severity="data.type === 'labor' ? 'warning' : 'info'" :value="getTypeLabel(data.type)"></Tag>
          </template>
        </Column>

        <Column field="amount" header="Số tiền (VNĐ)" sortable style="min-width: 12rem">
          <template #body="{ data }">
            <span class="text-red-600 font-bold bg-red-50 px-2 py-1 rounded-md">{{ formatCurrency(data.amount) }}</span>
          </template>
        </Column>

        <Column field="note" header="Ghi chú" style="min-width: 12rem">
            <template #body="{ data }">
                <span class="text-slate-500 italic text-sm">{{ data.note || 'Không có' }}</span>
            </template>
        </Column>

        <Column header="Ảnh" style="min-width: 6rem">
          <template #body="{ data }">
            <div v-if="data.images" class="flex gap-1">
              <a v-for="(img, idx) in parsedImages(data.images).slice(0, 2)" :key="idx" :href="img.url" target="_blank">
                <img :src="getImageSrc(img)" :alt="img.name" class="w-10 h-10 object-cover rounded border hover:opacity-80" />
              </a>
              <span v-if="parsedImages(data.images).length > 2" class="w-10 h-10 bg-slate-100 rounded border flex items-center justify-center text-xs text-slate-500">
                +{{ parsedImages(data.images).length - 2 }}
              </span>
            </div>
            <span v-else class="text-slate-300 text-sm">—</span>
          </template>
        </Column>

        <Column field="created_by_name" header="Người chi" sortable style="min-width: 8rem">
             <template #body="{ data }">
            <Tag severity="secondary" rounded :value="data.created_by_name || data.created_by"></Tag>
            </template>
        </Column>

        <Column header="Thao tác" :exportable="false" style="min-width: 8rem">
            <template #body="{ data }">
                <Button icon="pi pi-pencil" outlined rounded severity="info" class="mr-2" @click="editExpense(data)" />
                <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteExpense(data)" />
            </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:visible="expenseDialog" :style="{ width: '550px' }" :header="dialogTitle" :modal="true" class="p-fluid">
      <div class="flex flex-col gap-4 mt-4">
        <div class="flex flex-col gap-1">
            <label for="project" class="font-medium text-slate-700">Công trình *</label>
            <Dropdown id="project" v-model="expense.project_id" :options="projects" optionLabel="name" optionValue="id" placeholder="Chọn công trình" :invalid="submitted && !expense.project_id" />
            <small class="p-error text-red-500" v-if="submitted && !expense.project_id">Bắt buộc chọn công trình.</small>
        </div>

        <div class="flex flex-col gap-1">
            <label for="type" class="font-medium text-slate-700">Loại chi phí *</label>
            <Dropdown id="type" v-model="expense.type" :options="types" optionLabel="label" optionValue="value" placeholder="Chọn loại chi" :invalid="submitted && !expense.type" />
             <small class="p-error text-red-500" v-if="submitted && !expense.type">Loại chi là bắt buộc.</small>
        </div>

        <div class="flex flex-col gap-1">
            <label for="amount" class="font-medium text-slate-700">Số tiền chi *</label>
            <InputNumber id="amount" v-model="expense.amount" mode="currency" currency="VND" locale="vi-VN" :invalid="submitted && !expense.amount" />
            <small class="p-error text-red-500" v-if="submitted && !expense.amount">Số tiền là bắt buộc.</small>
        </div>

        <div class="flex flex-col gap-1">
            <label for="date" class="font-medium text-slate-700">Ngày chi</label>
            <CustomCalendar id="date" v-model="expense.date" dateFormat="dd/mm/yy" :showIcon="true" />
        </div>

         <div class="flex flex-col gap-1">
             <label for="note" class="font-medium text-slate-700">Ghi chú (Chi tiết)</label>
             <Textarea id="note" v-model="expense.note" rows="3" placeholder="Nhập hạng mục, số lượng..." />
         </div>

        <div class="flex flex-col gap-1">
          <label class="font-medium text-slate-700">Hình ảnh chứng từ</label>
          <FileUpload
            mode="basic"
            :multiple="true"
            accept="image/*"
            :maxFileSize="10000000"
            :auto="true"
            chooseLabel="Chọn ảnh"
            class="w-full"
            :disabled="uploading"
            @select="onFileSelect"
          />
          <small class="text-slate-400">Tối đa 5 ảnh, mỗi ảnh ≤ 10MB</small>
          <div v-if="uploading" class="flex items-center gap-2 text-sm text-blue-600">
            <i class="pi pi-spin pi-spinner"></i> Đang tải ảnh lên...
          </div>
          <div v-if="uploadedImages.length > 0" class="flex flex-wrap gap-2 mt-2">
            <div v-for="(img, idx) in uploadedImages" :key="idx" class="relative group">
              <img :src="getImageSrc(img)" :alt="img.name" class="w-20 h-20 object-cover rounded border" />
              <button type="button" @click="removeImage(idx)" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <i class="pi pi-times text-[10px]"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
          <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" class="text-slate-600" />
          <Button label="Lưu" icon="pi pi-check" :loading="loading" @click="saveExpense" severity="danger" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const searchQuery = ref('');
const selectedProject = ref(null);
const selectedType = ref(null);
const filterDate = ref(null);
const loading = ref(false);
const uploading = ref(false);
const submitted = ref(false);
const expenseDialog = ref(false);
const dialogTitle = ref('Khoản Chi');
const uploadedImages = ref([]);

const emptyExpense = {
    id: null,
    project_id: null,
    type: 'material',
    amount: null,
    date: new Date(),
    note: '',
    created_by: 'Admin'
};
const expense = ref({ ...emptyExpense });

const types = ref([
    { label: 'Vật tư (Material)', value: 'material' },
    { label: 'Khoán thợ (Labor)', value: 'labor' }
]);

// Fetch Data from Server
const { data: projects } = await useFetch('/api/projects', { default: () => [] });
const { data: expenses, refresh } = await useFetch('/api/expenses', { default: () => [] });

const filteredExpenses = computed(() => {
    let result = expenses.value;
    
    if (selectedProject.value) {
        result = result.filter(r => r.project_id === selectedProject.value);
    }

    if (selectedType.value) {
         result = result.filter(r => r.type === selectedType.value);
    }
    
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(r => {
            return (r.note && r.note.toLowerCase().includes(query));
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

const getTypeLabel = (type) => {
    return types.value.find(t => t.value === type)?.label || type;
}

const formatCurrency = (value) => {
    return value ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value) : '';
};

const formatDate = (value) => {
    return value ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) : '';
};

const openNew = () => {
    expense.value = { ...emptyExpense };
    uploadedImages.value = [];
    submitted.value = false;
    dialogTitle.value = 'Thêm Khoản Chi Mới';
    expenseDialog.value = true;
};

const hideDialog = () => {
    expenseDialog.value = false;
    submitted.value = false;
};

const editExpense = (data) => {
    expense.value = { 
        ...data,
        date: data.date ? new Date(data.date) : null,
        amount: Number(data.amount) || null
    };
    uploadedImages.value = parsedImages(data.images);
    dialogTitle.value = 'Chỉnh Sửa Khoản Chi';
    expenseDialog.value = true;
};

const confirmDeleteExpense = async (data) => {
    if (confirm(`Bạn có chắc chắn muốn xóa phiếu chi này?`)) {
        try {
            await $fetch(`/api/expenses/${data.id}`, { method: 'DELETE' });
            await refresh();
        } catch (e) {
            console.error("Lỗi khi xóa:", e);
        }
    }
};

const saveExpense = async () => {
    submitted.value = true;
    if (expense.value.amount && expense.value.project_id && expense.value.type) {
        loading.value = true;
        try {
            const payload = {
                ...expense.value,
                images: uploadedImages.value.length > 0 ? JSON.stringify(uploadedImages.value) : null
            };
            if (expense.value.id) {
                await $fetch(`/api/expenses/${expense.value.id}`, {
                    method: 'PUT',
                    body: payload
                });
            } else {
                await $fetch('/api/expenses', {
                    method: 'POST',
                    body: payload
                });
            }
            await refresh();
            expenseDialog.value = false;
            expense.value = { ...emptyExpense };
            uploadedImages.value = [];
        } catch (e) {
            console.error("Lỗi khi lưu:", e);
        } finally {
            loading.value = false;
        }
    }
};

const parsedImages = (json) => {
  try { return json ? JSON.parse(json) : [] }
  catch { return [] }
};

const getImageSrc = (img) => {
  return img.thumbnailUrl || (img.fileId ? `https://lh3.googleusercontent.com/d/${img.fileId}` : img.url)
};

const onFileSelect = async (event) => {
  uploading.value = true;
  try {
    const formData = new FormData();
    const filesToUpload = event.files || [event];
    for (const f of filesToUpload) {
      formData.append('files', f);
    }
    const projectName = getProjectName(expense.value.project_id) || 'expense';
    const response = await $fetch(`/api/upload-images?category=expenses&entity_name=${encodeURIComponent(projectName)}&entity_id=${expense.value.id || 'new'}`, {
      method: 'POST',
      body: formData
    });
    uploadedImages.value = [...uploadedImages.value, ...response.files];
  } catch (e) {
    console.error('Upload error:', e);
  } finally {
    uploading.value = false;
  }
};

const removeImage = (idx) => {
  uploadedImages.value.splice(idx, 1);
};
</script>
