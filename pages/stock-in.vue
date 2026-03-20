<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <div class="flex items-center gap-4 w-full sm:w-auto">
        <div class="relative flex-1 sm:flex-none sm:w-64">
          <IconField iconPosition="left">
            <InputIcon class="pi pi-search"></InputIcon>
            <InputText v-model="searchQuery" placeholder="Tìm kiếm phiếu nhập..." class="w-full pl-10" />
          </IconField>
        </div>
        <Dropdown v-model="filterSupplier" :options="suppliers" optionLabel="name" optionValue="id" 
          placeholder="Lọc theo NCC" showClear class="w-full sm:w-48" />
      </div>
      <Button icon="pi pi-plus" label="Tạo Phiếu Nhập" class="w-full sm:w-auto p-button-primary shadow-sm" @click="openNew" />
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <DataTable :value="filteredStockIns" paginator :rows="10" :rowsPerPageOptions="[10, 20, 50]"
        responsiveLayout="scroll" class="p-datatable-sm" stripedRows emptyMessage="Không có phiếu nhập kho nào."
        @row-click="viewDetail" rowHover :loading="loadingTable">
        <template #empty>
          <div class="text-center py-8">
            <i class="pi pi-inbox text-4xl text-slate-300 mb-3"></i>
            <p class="text-slate-500">Chưa có phiếu nhập kho nào</p>
            <Button label="Tạo phiếu nhập đầu tiên" text class="mt-2" @click="openNew" />
          </div>
        </template>
        
        <Column field="code" header="Mã phiếu" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="font-mono font-medium text-indigo-600">{{ data.code }}</span>
          </template>
        </Column>

        <Column field="date" header="Ngày nhập" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="text-slate-600">{{ formatDate(data.date) }}</span>
          </template>
        </Column>

        <Column field="supplier.name" header="Nhà cung cấp" sortable style="min-width: 14rem">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <i class="pi pi-building text-slate-400"></i>
              <span class="text-slate-700">{{ data.supplier?.name || '—' }}</span>
            </div>
          </template>
        </Column>

        <Column field="total_amount" header="Tổng tiền" sortable style="min-width: 12rem">
          <template #body="{ data }">
            <span class="font-medium text-slate-800">{{ formatCurrency(data.total_amount) }}</span>
          </template>
        </Column>

        <Column field="paid_amount" header="Đã trả" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="text-green-600">{{ formatCurrency(data.paid_amount) }}</span>
          </template>
        </Column>

        <Column header="Còn nợ" style="min-width: 10rem">
          <template #body="{ data }">
            <Tag v-if="data.debt_amount > 0" :value="'Còn ' + formatCurrency(data.debt_amount)" severity="warning" />
            <Tag v-else value="Đã thanh toán" severity="success" />
          </template>
        </Column>

        <Column header="SL vật tư" style="min-width: 8rem">
          <template #body="{ data }">
            <Tag :value="(data.items?.length || 0) + ' món'" severity="secondary" />
          </template>
        </Column>

        <Column header="Thao tác" :exportable="false" style="min-width: 8rem">
          <template #body="{ data }">
            <Button icon="pi pi-eye" outlined rounded severity="info" class="mr-1" size="small" v-tooltip.top="'Xem chi tiết'" @click.stop="viewDetail(data)" />
            <Button icon="pi pi-trash" outlined rounded severity="danger" size="small" v-tooltip.top="'Hủy phiếu'" @click.stop="confirmDelete(data)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="stockInDialog" :style="{ width: '900px' }" :header="dialogTitle" :modal="true" class="p-fluid" :closable="!saving">
      <div class="flex flex-col gap-4 mt-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="font-medium text-slate-700">Nhà cung cấp * <span class="text-red-500">*</span></label>
            <Dropdown v-model="stockIn.supplier_id" :options="suppliers" optionLabel="name" optionValue="id" 
              placeholder="Chọn nhà cung cấp" class="w-full" :class="{ 'p-invalid': submitted && !stockIn.supplier_id }"
              :disabled="saving" @change="onSupplierChange" />
            <small class="p-error text-red-500" v-if="submitted && !stockIn.supplier_id">Nhà cung cấp là bắt buộc.</small>
          </div>
          <div class="flex flex-col gap-1">
            <label class="font-medium text-slate-700">Ngày nhập</label>
            <Calendar v-model="stockIn.date" dateFormat="dd/mm/yy" showIcon iconDisplay="input" class="w-full" :disabled="saving" />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <label class="font-medium text-slate-700">Danh sách vật tư * <span class="text-red-500">*</span></label>
            <Button label="Thêm vật tư" icon="pi pi-plus" text size="small" @click="addItem" :disabled="saving" />
          </div>
          
          <div v-if="stockIn.items.length === 0" class="p-6 border-2 border-dashed border-slate-200 rounded-lg text-center text-slate-400">
            <i class="pi pi-plus-circle text-3xl mb-2"></i>
            <p>Chưa có vật tư nào</p>
            <small>Click "Thêm vật tư" để thêm.</small>
          </div>

          <div v-else class="border rounded-lg overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-slate-50">
                <tr>
                  <th class="p-2 text-left text-slate-600">Vật tư</th>
                  <th class="p-2 text-center text-slate-600 w-24">Số lượng</th>
                  <th class="p-2 text-center text-slate-600 w-36">Đơn giá</th>
                  <th class="p-2 text-right text-slate-600 w-32">Thành tiền</th>
                  <th class="p-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in stockIn.items" :key="index" class="border-t hover:bg-slate-50">
                  <td class="p-2">
                    <Dropdown v-model="item.material_id" :options="materials" optionLabel="name" optionValue="id"
                      placeholder="Chọn vật tư" class="w-full text-sm" :disabled="saving" @change="onMaterialChange(index)">
                      <template #option="{ option }">
                        <div class="flex justify-between items-center">
                          <span>{{ option.name }}</span>
                          <span class="text-xs text-slate-400 ml-2">{{ option.code }}</span>
                        </div>
                      </template>
                    </Dropdown>
                    <small v-if="item.material_id" class="text-slate-400">
                      Tồn: {{ getMaterialStock(item.material_id) }} {{ getMaterialUnit(item.material_id) }}
                    </small>
                  </td>
                  <td class="p-2">
                    <InputNumber v-model="item.quantity" :min="1" class="w-full text-center" :disabled="saving" @input="calculateItemTotal(index)" />
                  </td>
                  <td class="p-2">
                    <InputNumber v-model="item.unit_price" mode="currency" currency="VND" locale="vi-VN" :min="0" class="w-full" :disabled="saving" @input="calculateItemTotal(index)" />
                  </td>
                  <td class="p-2 text-right font-medium text-indigo-600">
                    {{ formatCurrency(item.total_price) }}
                  </td>
                  <td class="p-2 text-center">
                    <Button icon="pi pi-times" text severity="danger" size="small" @click="removeItem(index)" :disabled="saving" />
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-indigo-50">
                <tr>
                  <td colspan="3" class="p-2 text-right font-bold text-slate-700">Tổng cộng:</td>
                  <td class="p-2 text-right font-bold text-xl text-indigo-600">{{ formatCurrency(stockIn.total_amount) }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <small class="p-error text-red-500" v-if="submitted && stockIn.items.length === 0">Phải có ít nhất 1 vật tư nhập kho.</small>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="font-medium text-slate-700">Số tiền thanh toán</label>
            <InputNumber v-model="stockIn.paid_amount" mode="currency" currency="VND" locale="vi-VN" :min="0" :max="stockIn.total_amount" class="w-full" :disabled="saving" />
            <small class="text-slate-400">Tối đa: {{ formatCurrency(stockIn.total_amount) }}</small>
          </div>
          <div class="flex flex-col gap-1">
            <label class="font-medium text-slate-700">Ghi chú</label>
            <InputText v-model="stockIn.note" placeholder="Ghi chú phiếu nhập..." :disabled="saving" />
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" :disabled="saving" class="text-slate-600" />
        <Button :label="saving ? 'Đang lưu...' : 'Lưu'" icon="pi pi-check" :loading="saving" @click="saveStockIn" :disabled="saving" />
      </template>
    </Dialog>

    <Dialog v-model:visible="detailDialog" :style="{ width: '800px' }" header="Chi Tiết Phiếu Nhập" :modal="true">
      <div v-if="selectedStockIn" class="mt-4 space-y-4">
        <div class="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
          <div>
            <label class="text-xs text-slate-500">Mã phiếu</label>
            <p class="font-medium text-indigo-600 text-lg">{{ selectedStockIn.code }}</p>
          </div>
          <div>
            <label class="text-xs text-slate-500">Ngày nhập</label>
            <p class="font-medium">{{ formatDate(selectedStockIn.date) }}</p>
          </div>
          <div>
            <label class="text-xs text-slate-500">Nhà cung cấp</label>
            <p class="font-medium">{{ selectedStockIn.supplier?.name }}</p>
          </div>
          <div>
            <label class="text-xs text-slate-500">Người tạo</label>
            <p class="font-medium">{{ selectedStockIn.user?.name }}</p>
          </div>
        </div>

        <div>
          <label class="text-sm text-slate-500 font-medium">Danh sách vật tư ({{ selectedStockIn.items?.length || 0 }} món)</label>
          <DataTable :value="selectedStockIn.items" class="mt-2" size="small" stripedRows>
            <Column field="material_name" header="Vật tư">
              <template #body="{ data }">
                <div>
                  <span class="font-medium">{{ data.material_name }}</span>
                  <br><span class="text-xs text-slate-400">{{ data.material_code }}</span>
                </div>
              </template>
            </Column>
            <Column field="quantity" header="SL" style="width: 100px">
              <template #body="{ data }">{{ data.quantity }} {{ data.unit }}</template>
            </Column>
            <Column field="unit_price" header="Đơn giá" style="width: 130px">
              <template #body="{ data }">{{ formatCurrency(data.unit_price) }}</template>
            </Column>
            <Column field="total_price" header="Thành tiền" style="width: 150px">
              <template #body="{ data }" class="font-medium">{{ formatCurrency(data.total_price) }}</template>
            </Column>
          </DataTable>
        </div>

        <div class="flex justify-end gap-6 p-4 bg-indigo-50 rounded-lg">
          <div>
            <label class="text-sm text-slate-500">Tổng tiền</label>
            <p class="text-2xl font-bold text-indigo-600">{{ formatCurrency(selectedStockIn.total_amount) }}</p>
          </div>
          <div>
            <label class="text-sm text-slate-500">Đã thanh toán</label>
            <p class="text-2xl font-bold text-green-600">{{ formatCurrency(selectedStockIn.paid_amount) }}</p>
          </div>
          <div>
            <label class="text-sm text-slate-500">Còn nợ</label>
            <p class="text-2xl font-bold" :class="selectedStockIn.debt_amount > 0 ? 'text-red-600' : 'text-green-600'">
              {{ formatCurrency(selectedStockIn.debt_amount) }}
            </p>
          </div>
        </div>

        <div v-if="selectedStockIn.note" class="p-3 bg-slate-50 rounded-lg">
          <label class="text-xs text-slate-500">Ghi chú</label>
          <p class="text-slate-600">{{ selectedStockIn.note }}</p>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

definePageMeta({ roles: ['Admin', 'Accounting'] })

const toast = useToast()

const searchQuery = ref('')
const filterSupplier = ref(null)
const saving = ref(false)
const loadingTable = ref(false)
const submitted = ref(false)
const stockInDialog = ref(false)
const detailDialog = ref(false)
const dialogTitle = ref('Phiếu nhập kho')
const selectedStockIn = ref(null)

const emptyStockIn = () => ({
  supplier_id: null,
  date: new Date(),
  items: [],
  paid_amount: 0,
  note: '',
  total_amount: 0
})

const stockIn = ref(emptyStockIn())

const { data: stockInsData, refresh: refreshStockIns } = await useFetch('/api/stock-in', { default: () => [] })
const { data: suppliersData, refresh: refreshSuppliers } = await useFetch('/api/suppliers', { default: () => [] })
const { data: materialsData, refresh: refreshMaterials } = await useFetch('/api/materials', { default: () => [] })

const suppliers = computed(() => suppliersData.value || [])
const materials = computed(() => materialsData.value || [])
const stockIns = computed(() => stockInsData.value || [])

const filteredStockIns = computed(() => {
  let result = stockIns.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(si => 
      si.code?.toLowerCase().includes(q) ||
      si.supplier?.name?.toLowerCase().includes(q)
    )
  }
  if (filterSupplier.value) {
    result = result.filter(si => si.supplier?.id === filterSupplier.value)
  }
  return result
})

const getMaterialStock = (id) => materials.value.find(m => m.id === id)?.current_stock || 0
const getMaterialUnit = (id) => materials.value.find(m => m.id === id)?.unit || ''

const addItem = () => {
  stockIn.value.items.push({ material_id: null, quantity: 1, unit_price: 0, total_price: 0 })
}

const removeItem = (index) => {
  stockIn.value.items.splice(index, 1)
  calculateTotal()
}

const onSupplierChange = () => {
  // Optional: filter materials by supplier
}

const onMaterialChange = (index) => {
  const item = stockIn.value.items[index]
  const material = materials.value.find(m => m.id === item.material_id)
  if (material) {
    item.unit_price = material.avg_cost || 0
    calculateItemTotal(index)
  }
}

const calculateItemTotal = (index) => {
  const item = stockIn.value.items[index]
  item.total_price = (item.quantity || 0) * (item.unit_price || 0)
  calculateTotal()
}

const calculateTotal = () => {
  stockIn.value.total_amount = stockIn.value.items.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unit_price || 0)
  }, 0)
}

const openNew = () => {
  stockIn.value = emptyStockIn()
  submitted.value = false
  dialogTitle.value = 'Tạo Phiếu Nhập Kho'
  stockInDialog.value = true
}

const hideDialog = () => {
  if (saving.value) return
  stockInDialog.value = false
  submitted.value = false
}

const viewDetail = (data) => {
  selectedStockIn.value = data
  detailDialog.value = true
}

const confirmDelete = async (data) => {
  if (confirm(`Bạn có chắc chắn muốn hủy phiếu nhập "${data.code}"? Thao tác này sẽ hoàn lại tồn kho.`)) {
    try {
      await $fetch(`/api/stock-in/${data.id}`, { method: 'DELETE' })
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã hủy phiếu nhập kho', life: 3000 })
      await refreshStockIns()
      await refreshMaterials()
      await refreshSuppliers()
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Lỗi', detail: e.data?.message || e.message || 'Không thể hủy phiếu nhập.', life: 5000 })
    }
  }
}

const saveStockIn = async () => {
  submitted.value = true
  
  if (!stockIn.value.supplier_id) {
    toast.add({ severity: 'warn', summary: 'Thiếu thông tin', detail: 'Vui lòng chọn nhà cung cấp', life: 3000 })
    return
  }
  
  const validItems = stockIn.value.items.filter(item => item.material_id && item.quantity > 0)
  if (validItems.length === 0) {
    toast.add({ severity: 'warn', summary: 'Thiếu thông tin', detail: 'Phải có ít nhất 1 vật tư nhập kho', life: 3000 })
    return
  }

  saving.value = true
  try {
    const payload = {
      supplier_id: stockIn.value.supplier_id,
      date: stockIn.value.date,
      items: validItems.map(item => ({
        material_id: item.material_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      })),
      paid_amount: stockIn.value.paid_amount || 0,
      note: stockIn.value.note || ''
    }

    await $fetch('/api/stock-in', { method: 'POST', body: payload })
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã tạo phiếu nhập kho', life: 3000 })
    await refreshStockIns()
    await refreshMaterials()
    await refreshSuppliers()
    stockInDialog.value = false
    stockIn.value = emptyStockIn()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: e.data?.message || e.message || 'Không thể tạo phiếu nhập.', life: 5000 })
  } finally {
    saving.value = false
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
