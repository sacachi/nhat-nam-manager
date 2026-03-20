<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <div class="flex items-center gap-4 w-full sm:w-auto">
        <div class="relative flex-1 sm:flex-none sm:w-64">
          <IconField iconPosition="left">
            <InputIcon class="pi pi-search"></InputIcon>
            <InputText v-model="searchQuery" placeholder="Tìm kiếm nhà cung cấp..." class="w-full pl-10" />
          </IconField>
        </div>
      </div>
      <div class="flex gap-2 w-full sm:w-auto">
        <Button icon="pi pi-file-excel" label="Thêm hàng loạt" class="p-button-success" outlined @click="bulkImportVisible = true" />
        <Button icon="pi pi-plus" label="Thêm Nhà Cung Cấp" class="p-button-primary shadow-sm" @click="openNew" />
      </div>
    </div>

    <BulkImportDialog v-model="bulkImportVisible" entityLabel="Nhà Cung Cấp" apiEndpoint="/api/suppliers" :columns="bulkColumns" @imported="refresh" />

    <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <DataTable :value="filteredSuppliers" paginator :rows="10" :rowsPerPageOptions="[10, 20, 50]"
        responsiveLayout="scroll" class="p-datatable-sm" stripedRows emptyMessage="Không tìm thấy nhà cung cấp nào.">
        
        <Column field="code" header="Mã NCC" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="font-mono text-sm text-slate-600">{{ data.code }}</span>
          </template>
        </Column>

        <Column field="name" header="Tên nhà cung cấp" sortable style="min-width: 14rem">
          <template #body="{ data }">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                {{ data.name.charAt(0).toUpperCase() }}
              </div>
              <span class="font-medium text-slate-800">{{ data.name }}</span>
            </div>
          </template>
        </Column>

        <Column field="phone" header="Số điện thoại" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="text-slate-600">{{ data.phone || '—' }}</span>
          </template>
        </Column>

        <Column field="email" header="Email" sortable style="min-width: 12rem">
          <template #body="{ data }">
            <span class="text-slate-600">{{ data.email || '—' }}</span>
          </template>
        </Column>

        <Column header="Công nợ" style="min-width: 10rem">
          <template #body="{ data }">
            <NuxtLink v-if="data._count?.stockIns > 0" to="/supplier-debt" class="font-medium" :class="getDebtClass(data)">
              {{ formatCurrency(getDebt(data)) }}
            </NuxtLink>
            <span v-else class="text-slate-400">—</span>
          </template>
        </Column>

        <Column header="Thao tác" :exportable="false" style="min-width: 10rem">
          <template #body="{ data }">
            <Button icon="pi pi-pencil" outlined rounded severity="info" class="mr-2" @click="editSupplier(data)" />
            <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDelete(data)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="supplierDialog" :style="{ width: '500px' }" :header="dialogTitle" :modal="true" class="p-fluid">
      <div class="flex flex-col gap-4 mt-4">
        <div class="flex flex-col gap-1">
          <label for="name" class="font-medium text-slate-700">Tên nhà cung cấp *</label>
          <InputText id="name" v-model.trim="supplier.name" required :invalid="submitted && !supplier.name" />
          <small class="p-error text-red-500" v-if="submitted && !supplier.name">Tên nhà cung cấp là bắt buộc.</small>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label for="code" class="font-medium text-slate-700">Mã NCC</label>
            <InputText id="code" v-model.trim="supplier.code" placeholder="Tự động nếu để trống" />
          </div>
          <div class="flex flex-col gap-1">
            <label for="tax_code" class="font-medium text-slate-700">Mã số thuế</label>
            <InputText id="tax_code" v-model.trim="supplier.tax_code" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label for="phone" class="font-medium text-slate-700">Số điện thoại</label>
            <InputText id="phone" v-model.trim="supplier.phone" />
          </div>
          <div class="flex flex-col gap-1">
            <label for="email" class="font-medium text-slate-700">Email</label>
            <InputText id="email" type="email" v-model.trim="supplier.email" />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label for="address" class="font-medium text-slate-700">Địa chỉ</label>
          <InputText id="address" v-model.trim="supplier.address" />
        </div>

        <div class="flex flex-col gap-1">
          <label for="note" class="font-medium text-slate-700">Ghi chú</label>
          <Textarea id="note" v-model="supplier.note" rows="2" />
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" class="text-slate-600" />
        <Button label="Lưu" icon="pi pi-check" :loading="loading" @click="saveSupplier" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

definePageMeta({ roles: ['Admin', 'Accounting'] })

const toast = useToast()
const searchQuery = ref('')
const loading = ref(false)
const submitted = ref(false)
const deleteLoading = ref(false)
const supplierDialog = ref(false)
const dialogTitle = ref('Nhà cung cấp')
const bulkImportVisible = ref(false)

const bulkColumns = [
  { field: 'name', header: 'Tên NCC', required: true, width: '200px', excelFields: ['Tên', 'Tên NCC', 'Nhà cung cấp', 'name'] },
  { field: 'code', header: 'Mã NCC', width: '120px', placeholder: 'Tự động', excelFields: ['Mã', 'Mã NCC', 'code'] },
  { field: 'phone', header: 'Số điện thoại', width: '140px', excelFields: ['SĐT', 'Điện thoại', 'phone'] },
  { field: 'email', header: 'Email', width: '180px', excelFields: ['email', 'Email'] },
  { field: 'address', header: 'Địa chỉ', width: '200px', excelFields: ['Địa chỉ', 'address'] },
  { field: 'tax_code', header: 'Mã số thuế', width: '140px', excelFields: ['MST', 'Mã số thuế', 'tax_code'] },
  { field: 'note', header: 'Ghi chú', width: '180px', excelFields: ['Ghi chú', 'note'] }
]

const emptySupplier = { id: null, name: '', code: '', phone: '', email: '', address: '', tax_code: '', note: '' }
const supplier = ref({ ...emptySupplier })

const { data: suppliers, refresh } = await useFetch('/api/suppliers', { default: () => [] })

const filteredSuppliers = computed(() => {
  if (!searchQuery.value) return suppliers.value
  const q = searchQuery.value.toLowerCase()
  return suppliers.value.filter(s => 
    s.name.toLowerCase().includes(q) ||
    (s.code && s.code.toLowerCase().includes(q)) ||
    (s.phone && s.phone.includes(q)) ||
    (s.email && s.email.toLowerCase().includes(q))
  )
})

const openNew = () => {
  supplier.value = { ...emptySupplier }
  submitted.value = false
  dialogTitle.value = 'Thêm Nhà Cung Cấp Mới'
  supplierDialog.value = true
}

const hideDialog = () => {
  supplierDialog.value = false
  submitted.value = false
}

const editSupplier = (data) => {
  supplier.value = { ...data }
  dialogTitle.value = 'Sửa Thông Tin Nhà Cung Cấp'
  supplierDialog.value = true
}

const confirmDelete = async (data) => {
  deleteLoading.value = true
  try {
    await $fetch(`/api/suppliers/${data.id}`, { method: 'DELETE' })
    await refresh()
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã xóa nhà cung cấp', life: 3000 })
  } catch (e) {
    console.error('Lỗi khi xóa:', e)
    toast.add({ severity: 'error', summary: 'Lỗi', detail: e.data?.message || e.message || 'Không thể xóa nhà cung cấp này.', life: 5000 })
  } finally {
    deleteLoading.value = false
  }
}

const saveSupplier = async () => {
  submitted.value = true
  if (supplier.value.name?.trim()) {
    loading.value = true
    try {
      if (supplier.value.id) {
        await $fetch(`/api/suppliers/${supplier.value.id}`, { method: 'PUT', body: supplier.value })
      } else {
        await $fetch('/api/suppliers', { method: 'POST', body: supplier.value })
      }
      await refresh()
      supplierDialog.value = false
      supplier.value = { ...emptySupplier }
    } catch (e) {
      console.error('Lỗi khi lưu:', e)
      toast.add({ severity: 'error', summary: 'Lỗi', detail: e.data?.message || e.message || 'Không thể lưu nhà cung cấp.', life: 5000 })
    } finally {
      loading.value = false
    }
  }
}

const getDebt = (data) => {
  return data.debt || 0
}

const getDebtClass = (data) => {
  const debt = getDebt(data)
  if (debt > 0) return 'text-red-600 hover:underline'
  return 'text-green-600'
}

const formatCurrency = (value) => {
  if (!value && value !== 0) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}
</script>
