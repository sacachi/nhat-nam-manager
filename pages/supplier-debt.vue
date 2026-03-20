<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <i class="pi pi-wallet text-red-600 text-xl"></i>
          </div>
          <div>
            <p class="text-sm text-slate-500">Tổng công nợ NCC</p>
            <p class="text-xl font-bold text-red-600">{{ formatCurrency(report?.totalDebt || 0) }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
            <i class="pi pi-building text-indigo-600 text-xl"></i>
          </div>
          <div>
            <p class="text-sm text-slate-500">Tổng số NCC</p>
            <p class="text-xl font-bold text-slate-800">{{ report?.totalSuppliers || 0 }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <i class="pi pi-exclamation-circle text-amber-600 text-xl"></i>
          </div>
          <div>
            <p class="text-sm text-slate-500">NCC có công nợ</p>
            <p class="text-xl font-bold text-amber-600">{{ report?.suppliersWithDebt || 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <div class="flex items-center gap-4 w-full sm:w-auto">
        <div class="relative flex-1 sm:flex-none sm:w-64">
          <IconField iconPosition="left">
            <InputIcon class="pi pi-search"></InputIcon>
            <InputText v-model="searchQuery" placeholder="Tìm kiếm..." class="w-full pl-10" />
          </IconField>
        </div>
        <Dropdown v-model="filterStatus" :options="statusOptions" optionLabel="label" optionValue="value" 
          placeholder="Lọc theo trạng thái" showClear class="w-full sm:w-48" />
      </div>
      <Button icon="pi pi-plus" label="Thanh Toán" class="w-full sm:w-auto p-button-primary shadow-sm" @click="openPayment" :disabled="!selectedSupplier" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <h3 class="font-medium text-slate-700 mb-4">Danh sách công nợ theo NCC</h3>
        <DataTable :value="filteredSuppliers" responsiveLayout="scroll" class="p-datatable-sm" stripedRows
          :selection="selectedSupplier" selectionMode="single" @row-select="onSupplierSelect"
          emptyMessage="Không có dữ liệu." rowHover>
          <Column field="name" header="Nhà cung cấp" style="min-width: 14rem">
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  {{ data.name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <p class="font-medium text-slate-800">{{ data.name }}</p>
                  <p class="text-xs text-slate-400">{{ data.code }}</p>
                </div>
              </div>
            </template>
          </Column>
          <Column field="debt" header="Công nợ" style="min-width: 10rem">
            <template #body="{ data }">
              <span class="font-bold" :class="data.debt > 0 ? 'text-red-600' : 'text-green-600'">
                {{ formatCurrency(data.debt) }}
              </span>
            </template>
          </Column>
          <Column header="Thao tác" style="min-width: 6rem">
            <template #body="{ data }">
              <Button icon="pi pi-eye" text rounded severity="info" size="small" @click.stop="viewDebtDetail(data)" />
            </template>
          </Column>
        </DataTable>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <h3 class="font-medium text-slate-700 mb-4">
          {{ selectedSupplier ? `Chi tiết: ${selectedSupplier.name}` : 'Chi tiết công nợ' }}
        </h3>
        
        <div v-if="!selectedSupplier" class="flex items-center justify-center h-48 text-slate-400">
          <div class="text-center">
            <i class="pi pi-hand-pointer text-3xl mb-2"></i>
            <p>Chọn một nhà cung cấp để xem chi tiết</p>
          </div>
        </div>

        <div v-else class="space-y-4">
          <div class="p-4 bg-slate-50 rounded-lg">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-slate-500">Công nợ hiện tại</span>
              <span class="text-xl font-bold" :class="supplierDebt?.supplier?.debt > 0 ? 'text-red-600' : 'text-green-600'">
                {{ formatCurrency(supplierDebt?.supplier?.debt || 0) }}
              </span>
            </div>
          </div>

          <div>
            <h4 class="font-medium text-slate-700 mb-2">Lịch sử thanh toán</h4>
            <DataTable :value="supplierDebt?.payments || []" size="small" stripedRows emptyMessage="Chưa có thanh toán nào.">
              <Column field="date" header="Ngày">
                <template #body="{ data }">{{ formatDate(data.created_at) }}</template>
              </Column>
              <Column field="amount" header="Số tiền">
                <template #body="{ data }">
                  <span class="text-green-600 font-medium">{{ formatCurrency(data.amount) }}</span>
                </template>
              </Column>
              <Column field="user.name" header="Người thanh toán" />
            </DataTable>
          </div>

          <div>
            <h4 class="font-medium text-slate-700 mb-2">Phiếu nhập gần đây</h4>
            <DataTable :value="(supplierDebt?.stockIns || []).slice(0, 5)" size="small" stripedRows emptyMessage="Chưa có phiếu nhập nào.">
              <Column field="code" header="Mã phiếu" />
              <Column field="date" header="Ngày">
                <template #body="{ data }">{{ formatDate(data.date) }}</template>
              </Column>
              <Column field="total_amount" header="Tổng tiền">
                <template #body="{ data }">{{ formatCurrency(data.total_amount) }}</template>
              </Column>
              <Column field="debt" header="Còn nợ">
                <template #body="{ data }">
                  <span :class="data.debt > 0 ? 'text-red-600' : 'text-green-600'">{{ formatCurrency(data.debt) }}</span>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </div>
    </div>

    <Dialog v-model:visible="paymentDialog" :style="{ width: '450px' }" header="Thanh Toán Công Nợ" :modal="true">
      <div class="flex flex-col gap-4 mt-4">
        <div class="p-3 bg-slate-50 rounded-lg">
          <p class="text-sm text-slate-500">Nhà cung cấp</p>
          <p class="font-medium">{{ selectedSupplier?.name }}</p>
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-medium text-slate-700">Số tiền thanh toán *</label>
          <InputNumber v-model="payment.amount" mode="currency" currency="VND" :min="0" :max="selectedSupplier?.debt" 
            class="w-full" :invalid="paymentSubmitted && (!payment.amount || payment.amount <= 0)" />
          <small class="text-red-500" v-if="paymentSubmitted && (!payment.amount || payment.amount <= 0)">Số tiền thanh toán phải lớn hơn 0.</small>
          <small v-else class="text-slate-500">Công nợ hiện tại: {{ formatCurrency(selectedSupplier?.debt || 0) }}</small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-medium text-slate-700">Ngày thanh toán</label>
          <Calendar v-model="payment.date" dateFormat="dd/mm/yy" showIcon iconDisplay="input" class="w-full" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-medium text-slate-700">Ghi chú</label>
          <InputText v-model="payment.note" placeholder="Ghi chú thanh toán..." />
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" icon="pi pi-times" text @click="paymentDialog = false; paymentSubmitted = false" />
        <Button label="Xác nhận thanh toán" icon="pi pi-check" :loading="loading" @click="confirmPayment" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

definePageMeta({ roles: ['Admin', 'Accounting'] })

const toast = useToast()
const searchQuery = ref('')
const filterStatus = ref(null)
const loading = ref(false)
const selectedSupplier = ref(null)
const supplierDebt = ref(null)
const paymentDialog = ref(false)
const paymentSubmitted = ref(false)

const payment = ref({
  amount: 0,
  date: new Date(),
  note: ''
})

const statusOptions = [
  { label: 'Có công nợ', value: 'has_debt' },
  { label: 'Không công nợ', value: 'no_debt' }
]

const { data: report, refresh: refreshReport } = await useFetch('/api/reports/supplier-debt', { default: () => null })

const filteredSuppliers = computed(() => {
  if (!report.value?.suppliers) return []
  let result = report.value.suppliers
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(s => 
      s.name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q))
    )
  }
  
  if (filterStatus.value === 'has_debt') {
    result = result.filter(s => s.debt > 0)
  } else if (filterStatus.value === 'no_debt') {
    result = result.filter(s => s.debt === 0)
  }
  
  return result.sort((a, b) => b.debt - a.debt)
})

const onSupplierSelect = async (event) => {
  selectedSupplier.value = event.data
  await loadDebtDetail(event.data.id)
}

const viewDebtDetail = async (data) => {
  selectedSupplier.value = data
  await loadDebtDetail(data.id)
}

const loadDebtDetail = async (id) => {
  try {
    supplierDebt.value = await $fetch(`/api/suppliers/${id}/debt`)
  } catch (e) {
    console.error('Lỗi khi tải chi tiết công nợ:', e)
  }
}

const openPayment = () => {
  if (!selectedSupplier.value) return
  payment.value = {
    amount: selectedSupplier.value.debt,
    date: new Date(),
    note: ''
  }
  paymentDialog.value = true
}

const confirmPayment = async () => {
  paymentSubmitted.value = true
  if (!selectedSupplier.value || !payment.value.amount || payment.value.amount <= 0) {
    return
  }

  if (payment.value.amount > selectedSupplier.value.debt) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Số tiền thanh toán không được lớn hơn công nợ hiện tại.', life: 5000 })
    return
  }

  loading.value = true
  try {
    await $fetch('/api/supplier-payments', {
      method: 'POST',
      body: {
        supplier_id: selectedSupplier.value.id,
        amount: payment.value.amount,
        date: payment.value.date,
        note: payment.value.note
      }
    })
    
    await refreshReport()
    await loadDebtDetail(selectedSupplier.value.id)
    paymentDialog.value = false
    paymentSubmitted.value = false
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Thanh toán công nợ thành công', life: 3000 })
  } catch (e) {
    console.error('Lỗi khi thanh toán:', e)
    toast.add({ severity: 'error', summary: 'Lỗi', detail: e.data?.message || e.message || 'Không thể thanh toán.', life: 5000 })
  } finally {
    loading.value = false
  }
}

const formatCurrency = (value) => {
  if (!value && value !== 0) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>
