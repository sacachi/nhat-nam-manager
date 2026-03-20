<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <div class="flex items-center gap-4 w-full sm:w-auto">
        <div class="relative flex-1 sm:flex-none sm:w-64">
          <IconField iconPosition="left">
            <InputIcon class="pi pi-search"></InputIcon>
            <InputText v-model="searchQuery" placeholder="Tìm kiếm vật tư..." class="w-full pl-10" />
          </IconField>
        </div>
      </div>
      <div class="flex gap-2 w-full sm:w-auto">
        <Button icon="pi pi-file-excel" label="Thêm hàng loạt" class="p-button-success" outlined @click="bulkImportVisible = true" />
        <Button icon="pi pi-plus" label="Thêm Vật Tư" class="p-button-primary shadow-sm" @click="openNew" />
      </div>
    </div>

    <BulkImportDialog v-model="bulkImportVisible" entityLabel="Vật Tư" apiEndpoint="/api/materials" :columns="bulkColumns" @imported="refresh" />

    <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <DataTable :value="filteredMaterials" paginator :rows="10" :rowsPerPageOptions="[10, 20, 50]"
        responsiveLayout="scroll" class="p-datatable-sm" stripedRows emptyMessage="Không tìm thấy vật tư nào."
        rowHover :loading="loadingTable">
        
        <Column field="code" header="Mã vật tư" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="font-mono text-sm text-slate-600">{{ data.code }}</span>
          </template>
        </Column>

        <Column field="name" header="Tên vật tư" sortable style="min-width: 14rem">
          <template #body="{ data }">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                {{ data.name.charAt(0).toUpperCase() }}
              </div>
              <span class="font-medium text-slate-800">{{ data.name }}</span>
            </div>
          </template>
        </Column>

        <Column field="unit" header="Đơn vị" sortable style="min-width: 8rem">
          <template #body="{ data }">
            <Tag :value="data.unit" severity="secondary" />
          </template>
        </Column>

        <Column field="current_stock" header="Tồn kho" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="font-medium flex items-center gap-2" :class="data.current_stock <= data.min_stock_level ? 'text-red-600' : 'text-slate-800'">
              {{ data.current_stock.toLocaleString() }}
              <i v-if="data.current_stock <= data.min_stock_level" class="pi pi-exclamation-triangle text-xs" v-tooltip="'Dưới mức tối thiểu'"></i>
            </span>
          </template>
        </Column>

        <Column field="avg_cost" header="Giá nhập TB" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="text-slate-600">{{ formatCurrency(data.avg_cost) }}</span>
          </template>
        </Column>

        <Column header="Giá trị tồn kho" sortable style="min-width: 12rem">
          <template #body="{ data }">
            <span class="text-slate-600">{{ formatCurrency(data.stock_value) }}</span>
          </template>
        </Column>

        <Column header="Thao tác" :exportable="false" style="min-width: 10rem">
          <template #body="{ data }">
            <Button icon="pi pi-history" outlined rounded severity="info" class="mr-1" size="small" v-tooltip.top="'Lịch sử tồn kho'" @click="viewStockLog(data)" />
            <Button icon="pi pi-pencil" outlined rounded severity="info" class="mr-1" size="small" v-tooltip.top="'Sửa'" @click="editMaterial(data)" />
            <Button icon="pi pi-trash" outlined rounded severity="danger" size="small" v-tooltip.top="'Xóa'" @click="confirmDelete(data)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="materialDialog" :style="{ width: '500px' }" :header="dialogTitle" :modal="true" class="p-fluid" :closable="!saving">
      <div class="flex flex-col gap-4 mt-4">
        <div class="flex flex-col gap-1">
          <label for="name" class="font-medium text-slate-700">Tên vật tư * <span class="text-red-500">*</span></label>
          <InputText id="name" v-model.trim="material.name" :disabled="saving" 
            :class="{ 'p-invalid': submitted && !material.name?.trim() }"
            placeholder="VD: Gỗ MDF phủ melamine" maxlength="200" />
          <small class="p-error text-red-500" v-if="submitted && !material.name?.trim()">Tên vật tư là bắt buộc.</small>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label for="code" class="font-medium text-slate-700">Mã vật tư</label>
            <InputText id="code" v-model.trim="material.code" :disabled="saving" placeholder="Tự động nếu để trống" />
            <small class="text-slate-400">Mã sẽ tự động tạo (VT0001, VT0002...)</small>
          </div>
          <div class="flex flex-col gap-1">
            <label for="unit" class="font-medium text-slate-700">Đơn vị * <span class="text-red-500">*</span></label>
            <Dropdown id="unit" v-model="material.unit" :options="unitOptions" :disabled="saving" 
              :class="{ 'p-invalid': submitted && !material.unit }"
              placeholder="Chọn đơn vị" class="w-full" />
            <small class="p-error text-red-500" v-if="submitted && !material.unit">Đơn vị là bắt buộc.</small>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label for="min_stock_level" class="font-medium text-slate-700">Tồn kho tối thiểu</label>
            <InputNumber id="min_stock_level" v-model="material.min_stock_level" :min="0" :disabled="saving" showButtons />
            <small class="text-slate-400">Cảnh báo khi tồn kho thấp hơn mức này</small>
          </div>
          <div class="flex flex-col gap-1">
            <label for="standard_price" class="font-medium text-slate-700">Giá bán</label>
            <InputNumber id="standard_price" v-model="material.standard_price" :disabled="saving" mode="currency" currency="VND" locale="vi-VN" />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label for="description" class="font-medium text-slate-700">Mô tả / Quy cách</label>
          <Textarea id="description" v-model="material.description" :disabled="saving" rows="2" 
            placeholder="VD: 1220x2440x18mm - Gỗ MDF phủ melamine trắng" maxlength="500" />
          <small class="text-slate-400">{{ (material.description?.length || 0) }}/500 ký tự</small>
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" :disabled="saving" class="text-slate-600" />
        <Button :label="saving ? 'Đang lưu...' : 'Lưu'" icon="pi pi-check" :loading="saving" @click="saveMaterial" :disabled="saving" />
      </template>
    </Dialog>

    <Dialog v-model:visible="stockLogDialog" :style="{ width: '900px' }" :header="'Thẻ Kho: ' + (selectedMaterial?.name || '')" :modal="true">
      <div class="mt-4">
        <div class="grid grid-cols-3 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
          <div class="text-center">
            <p class="text-xs text-slate-500 mb-1">Tồn kho hiện tại</p>
            <p class="text-xl font-bold text-indigo-600">{{ selectedMaterial?.current_stock?.toLocaleString() }} {{ selectedMaterial?.unit }}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-slate-500 mb-1">Giá nhập TB</p>
            <p class="text-xl font-bold">{{ formatCurrency(selectedMaterial?.avg_cost) }}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-slate-500 mb-1">Giá trị tồn kho</p>
            <p class="text-xl font-bold">{{ formatCurrency(selectedMaterial?.stock_value) }}</p>
          </div>
        </div>

        <DataTable :value="stockLogs" paginator :rows="10" responsiveLayout="scroll" class="p-datatable-sm" stripedRows emptyMessage="Không có lịch sử tồn kho." :loading="loadingLogs">
          <Column field="created_at" header="Ngày" sortable style="min-width: 10rem">
            <template #body="{ data }">
              <span class="text-slate-600">{{ formatDate(data.created_at) }}</span>
            </template>
          </Column>
          <Column field="type" header="Loại" sortable style="min-width: 8rem">
            <template #body="{ data }">
              <Tag :value="getTypeLabel(data.type)" :severity="getTypeSeverity(data.type)" />
            </template>
          </Column>
          <Column field="reference_code" header="Mã phiếu" style="min-width: 10rem">
            <template #body="{ data }">
              <span class="font-mono text-sm text-indigo-600">{{ data.reference_code }}</span>
            </template>
          </Column>
          <Column field="quantity" header="Số lượng" sortable style="min-width: 10rem">
            <template #body="{ data }">
              <span :class="getQuantityClass(data.type)">
                {{ getQuantityPrefix(data.type) }}{{ data.quantity.toLocaleString() }}
              </span>
            </template>
          </Column>
          <Column field="stock_after" header="Tồn sau" sortable style="min-width: 8rem">
            <template #body="{ data }">
              <span class="font-medium">{{ data.stock_after.toLocaleString() }}</span>
            </template>
          </Column>
          <Column field="unit_price" header="Đơn giá" style="min-width: 10rem">
            <template #body="{ data }">
              <span class="text-slate-600">{{ formatCurrency(data.unit_price) }}</span>
            </template>
          </Column>
        </DataTable>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

definePageMeta({ roles: ['Admin', 'Accounting'] })

const toast = useToast()

const searchQuery = ref('')
const saving = ref(false)
const loadingTable = ref(false)
const loadingLogs = ref(false)
const submitted = ref(false)
const materialDialog = ref(false)
const stockLogDialog = ref(false)
const dialogTitle = ref('Vật tư')
const selectedMaterial = ref(null)
const stockLogs = ref([])
const bulkImportVisible = ref(false)

const unitOptions = ['Tấm', 'Thanh', 'Bộ', 'Cái', 'Kg', 'Lít', 'Thùng', 'Mét', 'm²', 'm³']

const bulkColumns = [
  { field: 'name', header: 'Tên vật tư', required: true, width: '200px', excelFields: ['Tên', 'Tên VT', 'name'] },
  { field: 'code', header: 'Mã vật tư', width: '120px', placeholder: 'Tự động', excelFields: ['Mã', 'Mã VT', 'code'] },
  { field: 'unit', header: 'Đơn vị', required: true, type: 'select', options: unitOptions.map(u => ({ label: u, value: u })), width: '120px', excelFields: ['ĐVT', 'Đơn vị', 'unit'] },
  { field: 'standard_price', header: 'Giá bán', type: 'number', width: '140px', excelFields: ['Giá bán', 'Giá', 'standard_price'] },
  { field: 'min_stock_level', header: 'Tồn tối thiểu', type: 'number', width: '130px', excelFields: ['Tồn tối thiểu', 'Min', 'min_stock_level'] },
  { field: 'description', header: 'Mô tả', width: '200px', excelFields: ['Mô tả', 'Quy cách', 'description'] }
]

const emptyMaterial = { id: null, name: '', code: '', unit: '', min_stock_level: 0, standard_price: 0, description: '' }
const material = ref({ ...emptyMaterial })

const { data: materials, refresh } = await useFetch('/api/materials', { default: () => [] })

const filteredMaterials = computed(() => {
  if (!materials.value?.length) return []
  if (!searchQuery.value) return materials.value
  const q = searchQuery.value.toLowerCase()
  return materials.value.filter(m => 
    m.name.toLowerCase().includes(q) ||
    (m.code && m.code.toLowerCase().includes(q)) ||
    (m.description && m.description.toLowerCase().includes(q))
  )
})

const openNew = () => {
  material.value = { ...emptyMaterial }
  submitted.value = false
  dialogTitle.value = 'Thêm Vật Tư Mới'
  materialDialog.value = true
}

const hideDialog = () => {
  if (saving.value) return
  materialDialog.value = false
  submitted.value = false
}

const editMaterial = (data) => {
  material.value = { ...data }
  submitted.value = false
  dialogTitle.value = 'Sửa Thông Tin Vật Tư'
  materialDialog.value = true
}

const viewStockLog = async (data) => {
  selectedMaterial.value = data
  stockLogs.value = []
  loadingLogs.value = true
  stockLogDialog.value = true
  try {
    const res = await $fetch(`/api/materials/${data.id}/stock-log`)
    stockLogs.value = res
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải lịch sử tồn kho', life: 3000 })
  } finally {
    loadingLogs.value = false
  }
}

const confirmDelete = async (data) => {
  toast.add({
    severity: 'warn',
    summary: 'Xác nhận xóa',
    detail: `Bạn có chắc chắn muốn xóa vật tư "${data.name}"?`,
    life: 5000,
    group: 'confirm'
  })
  
  if (confirm(`Bạn có chắc chắn muốn xóa vật tư "${data.name}"?`)) {
    try {
      await $fetch(`/api/materials/${data.id}`, { method: 'DELETE' })
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã xóa vật tư', life: 3000 })
      await refresh()
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Lỗi', detail: e.data?.message || e.message || 'Không thể xóa vật tư này.', life: 5000 })
    }
  }
}

const saveMaterial = async () => {
  submitted.value = true
  
  if (!material.value.name?.trim()) {
    toast.add({ severity: 'warn', summary: 'Thiếu thông tin', detail: 'Vui lòng nhập tên vật tư', life: 3000 })
    return
  }
  
  if (!material.value.unit) {
    toast.add({ severity: 'warn', summary: 'Thiếu thông tin', detail: 'Vui lòng chọn đơn vị tính', life: 3000 })
    return
  }

  saving.value = true
  try {
    if (material.value.id) {
      await $fetch(`/api/materials/${material.value.id}`, { method: 'PUT', body: material.value })
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã cập nhật vật tư', life: 3000 })
    } else {
      await $fetch('/api/materials', { method: 'POST', body: material.value })
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã thêm vật tư mới', life: 3000 })
    }
    await refresh()
    materialDialog.value = false
    material.value = { ...emptyMaterial }
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: e.data?.message || e.message || 'Không thể lưu vật tư.', life: 5000 })
  } finally {
    saving.value = false
  }
}

const getTypeLabel = (type) => {
  const labels = { 'IN': 'Nhập kho', 'OUT': 'Xuất kho', 'CANCEL_IN': 'Hủy nhập', 'CANCEL_OUT': 'Hủy xuất' }
  return labels[type] || type
}

const getTypeSeverity = (type) => {
  const severities = { 'IN': 'success', 'OUT': 'warning', 'CANCEL_IN': 'danger', 'CANCEL_OUT': 'secondary' }
  return severities[type] || 'info'
}

const getQuantityClass = (type) => {
  if (type === 'IN' || type === 'CANCEL_OUT') return 'text-green-600 font-medium'
  if (type === 'OUT' || type === 'CANCEL_IN') return 'text-red-600 font-medium'
  return ''
}

const getQuantityPrefix = (type) => {
  if (type === 'IN' || type === 'CANCEL_OUT') return '+'
  if (type === 'OUT' || type === 'CANCEL_IN') return '-'
  return ''
}

const formatCurrency = (value) => {
  if (!value && value !== 0) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>
