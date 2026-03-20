<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <div class="flex items-center gap-4 w-full sm:w-auto">
        <div class="relative flex-1 sm:flex-none sm:w-64">
          <IconField iconPosition="left">
            <InputIcon class="pi pi-search"></InputIcon>
            <InputText v-model="searchQuery" placeholder="Tìm kiếm phiếu xuất..." class="w-full pl-10" />
          </IconField>
        </div>
        <Dropdown v-model="filterProject" :options="projects" optionLabel="name" optionValue="id" 
          placeholder="Lọc theo Công trình" showClear class="w-full sm:w-56" />
      </div>
      <Button icon="pi pi-plus" label="Tạo Phiếu Xuất" class="w-full sm:w-auto p-button-primary shadow-sm" @click="openNew" />
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <DataTable :value="filteredStockOuts" paginator :rows="10" :rowsPerPageOptions="[10, 20, 50]"
        responsiveLayout="scroll" class="p-datatable-sm" stripedRows emptyMessage="Không có phiếu xuất kho nào."
        @row-click="viewDetail" rowHover :loading="loadingTable">
        <template #empty>
          <div class="text-center py-8">
            <i class="pi pi-inbox text-4xl text-slate-300 mb-3"></i>
            <p class="text-slate-500">Chưa có phiếu xuất kho nào</p>
            <Button label="Tạo phiếu xuất đầu tiên" text class="mt-2" @click="openNew" />
          </div>
        </template>
        
        <Column field="code" header="Mã phiếu" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="font-mono font-medium text-amber-600">{{ data.code }}</span>
          </template>
        </Column>

        <Column field="date" header="Ngày xuất" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="text-slate-600">{{ formatDate(data.date) }}</span>
          </template>
        </Column>

        <Column field="project.name" header="Công trình" sortable style="min-width: 14rem">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <i class="pi pi-building text-slate-400"></i>
              <span class="text-slate-700">{{ data.project?.name || '—' }}</span>
            </div>
          </template>
        </Column>

        <Column header="Số vật tư" style="min-width: 8rem">
          <template #body="{ data }">
            <Tag :value="(data.items?.length || 0) + ' món'" severity="secondary" />
          </template>
        </Column>

        <Column field="total_cost" header="Tổng giá vốn" sortable style="min-width: 12rem">
          <template #body="{ data }">
            <span class="font-medium text-slate-800">{{ formatCurrency(data.total_cost) }}</span>
          </template>
        </Column>

        <Column header="Chi phí" style="min-width: 8rem">
          <template #body="{ data }">
            <Tag v-if="data.expense" value="Đã tạo" severity="success" />
            <Tag v-else value="Chưa tạo" severity="secondary" />
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

    <Dialog v-model:visible="stockOutDialog" :style="{ width: '900px' }" :header="dialogTitle" :modal="true" class="p-fluid" :closable="!saving">
      <div class="flex flex-col gap-4 mt-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="font-medium text-slate-700">Công trình * <span class="text-red-500">*</span></label>
            <Dropdown v-model="stockOut.project_id" :options="projects" optionLabel="name" optionValue="id" 
              placeholder="Chọn công trình" class="w-full" :class="{ 'p-invalid': submitted && !stockOut.project_id }"
              :disabled="saving" />
            <small class="p-error text-red-500" v-if="submitted && !stockOut.project_id">Công trình là bắt buộc.</small>
          </div>
          <div class="flex flex-col gap-1">
            <label class="font-medium text-slate-700">Ngày xuất</label>
            <Calendar v-model="stockOut.date" dateFormat="dd/mm/yy" showIcon iconDisplay="input" class="w-full" :disabled="saving" />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <label class="font-medium text-slate-700">Danh sách vật tư * <span class="text-red-500">*</span></label>
            <Button label="Thêm vật tư" icon="pi pi-plus" text size="small" @click="addItem" :disabled="saving" />
          </div>
          
          <div v-if="stockOut.items.length === 0" class="p-6 border-2 border-dashed border-slate-200 rounded-lg text-center text-slate-400">
            <i class="pi pi-plus-circle text-3xl mb-2"></i>
            <p>Chưa có vật tư nào</p>
            <small>Click "Thêm vật tư" để thêm.</small>
          </div>

          <div v-else class="border rounded-lg overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-slate-50">
                <tr>
                  <th class="p-2 text-left text-slate-600">Vật tư</th>
                  <th class="p-2 text-center text-slate-600 w-24">SL tồn</th>
                  <th class="p-2 text-center text-slate-600 w-24">SL xuất</th>
                  <th class="p-2 text-center text-slate-600 w-36">Đơn giá</th>
                  <th class="p-2 text-right text-slate-600 w-32">Thành tiền</th>
                  <th class="p-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in stockOut.items" :key="index" class="border-t hover:bg-slate-50">
                  <td class="p-2">
                    <Dropdown v-model="item.material_id" :options="availableMaterials(item)" optionLabel="name" optionValue="id"
                      placeholder="Chọn vật tư" class="w-full text-sm" :disabled="saving" @change="onMaterialChange(index)">
                      <template #option="{ option }">
                        <div class="flex justify-between items-center">
                          <span>{{ option.name }}</span>
                          <span class="text-xs" :class="option.current_stock <= option.min_stock_level ? 'text-red-500' : 'text-slate-400'">
                            Còn {{ option.current_stock }} {{ option.unit }}
                          </span>
                        </div>
                      </template>
                    </Dropdown>
                  </td>
                  <td class="p-2 text-center">
                    <span class="font-medium" :class="getAvailableStock(item.material_id) <= getMinStock(item.material_id) ? 'text-red-600' : 'text-slate-600'">
                      {{ getAvailableStock(item.material_id) }}
                    </span>
                  </td>
                  <td class="p-2">
                    <InputNumber v-model="item.quantity" :min="1" :max="getAvailableStock(item.material_id)" class="w-full text-center" :disabled="saving || !item.material_id" @input="calculateItemTotal(index)" />
                  </td>
                  <td class="p-2">
                    <InputNumber v-model="item.unit_cost" mode="currency" currency="VND" locale="vi-VN" :min="0" class="w-full" :disabled="saving" @input="calculateItemTotal(index)" />
                  </td>
                  <td class="p-2 text-right font-medium text-amber-600">
                    {{ formatCurrency(item.total_cost) }}
                  </td>
                  <td class="p-2 text-center">
                    <Button icon="pi pi-times" text severity="danger" size="small" @click="removeItem(index)" :disabled="saving" />
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-amber-50">
                <tr>
                  <td colspan="4" class="p-2 text-right font-bold text-slate-700">Tổng cộng:</td>
                  <td class="p-2 text-right font-bold text-xl text-amber-600">{{ formatCurrency(stockOut.total_cost) }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <small class="p-error text-red-500" v-if="submitted && stockOut.items.length === 0">Phải có ít nhất 1 vật tư xuất kho.</small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-medium text-slate-700">Ghi chú</label>
          <InputText v-model="stockOut.note" placeholder="Ghi chú phiếu xuất..." :disabled="saving" />
        </div>

        <div class="p-3 bg-blue-50 rounded-lg">
          <p class="text-sm text-blue-700">
            <i class="pi pi-info-circle mr-1"></i>
            Chi phí sẽ được tự động tạo với tổng giá trị: <strong>{{ formatCurrency(stockOut.total_cost) }}</strong>
          </p>
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" :disabled="saving" class="text-slate-600" />
        <Button :label="saving ? 'Đang lưu...' : 'Lưu'" icon="pi pi-check" :loading="saving" @click="saveStockOut" :disabled="saving" />
      </template>
    </Dialog>

    <Dialog v-model:visible="detailDialog" :style="{ width: '800px' }" header="Chi Tiết Phiếu Xuất" :modal="true">
      <div v-if="selectedStockOut" class="mt-4 space-y-4">
        <div class="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
          <div>
            <label class="text-xs text-slate-500">Mã phiếu</label>
            <p class="font-medium text-amber-600 text-lg">{{ selectedStockOut.code }}</p>
          </div>
          <div>
            <label class="text-xs text-slate-500">Ngày xuất</label>
            <p class="font-medium">{{ formatDate(selectedStockOut.date) }}</p>
          </div>
          <div>
            <label class="text-xs text-slate-500">Công trình</label>
            <p class="font-medium">{{ selectedStockOut.project?.name }}</p>
          </div>
          <div>
            <label class="text-xs text-slate-500">Người tạo</label>
            <p class="font-medium">{{ selectedStockOut.user?.name }}</p>
          </div>
        </div>

        <div>
          <label class="text-sm text-slate-500 font-medium">Danh sách vật tư ({{ selectedStockOut.items?.length || 0 }} món)</label>
          <DataTable :value="selectedStockOut.items" class="mt-2" size="small" stripedRows>
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
            <Column field="unit_cost" header="Đơn giá" style="width: 130px">
              <template #body="{ data }">{{ formatCurrency(data.unit_cost) }}</template>
            </Column>
            <Column field="total_cost" header="Thành tiền" style="width: 150px">
              <template #body="{ data }" class="font-medium">{{ formatCurrency(data.total_cost) }}</template>
            </Column>
          </DataTable>
        </div>

        <div class="flex justify-end gap-6 p-4 bg-amber-50 rounded-lg">
          <div>
            <label class="text-sm text-slate-500">Tổng giá vốn</label>
            <p class="text-2xl font-bold text-amber-600">{{ formatCurrency(selectedStockOut.total_cost) }}</p>
          </div>
        </div>

        <div v-if="selectedStockOut.expense" class="p-3 bg-green-50 rounded-lg border border-green-200">
          <label class="text-sm text-green-600 font-medium">
            <i class="pi pi-check-circle mr-1"></i>
            Chi phí đã được tạo tự động
          </label>
          <p class="text-green-700 mt-1">
            ID: {{ selectedStockOut.expense.id.slice(0,8) }}... | 
            Loại: {{ selectedStockOut.expense.type === 'material' ? 'Vật tư' : 'Khác' }} | 
            Số tiền: <strong>{{ formatCurrency(selectedStockOut.expense.amount) }}</strong>
          </p>
        </div>

        <div v-if="selectedStockOut.note" class="p-3 bg-slate-50 rounded-lg">
          <label class="text-xs text-slate-500">Ghi chú</label>
          <p class="text-slate-600">{{ selectedStockOut.note }}</p>
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
const filterProject = ref(null)
const saving = ref(false)
const loadingTable = ref(false)
const submitted = ref(false)
const stockOutDialog = ref(false)
const detailDialog = ref(false)
const dialogTitle = ref('Phiếu xuất kho')
const selectedStockOut = ref(null)

const emptyStockOut = () => ({
  project_id: null,
  date: new Date(),
  items: [],
  note: '',
  total_cost: 0
})

const stockOut = ref(emptyStockOut())

const { data: stockOutsData, refresh: refreshStockOuts } = await useFetch('/api/stock-out', { default: () => [] })
const { data: projectsData, refresh: refreshProjects } = await useFetch('/api/projects', { default: () => [] })
const { data: materialsData, refresh: refreshMaterials } = await useFetch('/api/materials', { default: () => [] })

const projects = computed(() => projectsData.value || [])
const materials = computed(() => materialsData.value || [])
const stockOuts = computed(() => stockOutsData.value || [])

const filteredStockOuts = computed(() => {
  let result = stockOuts.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(so => 
      so.code?.toLowerCase().includes(q) ||
      so.project?.name?.toLowerCase().includes(q)
    )
  }
  if (filterProject.value) {
    result = result.filter(so => so.project?.id === filterProject.value)
  }
  return result
})

const availableMaterials = (currentItem) => {
  return materials.value.filter(m => {
    if (!currentItem.material_id || m.id !== currentItem.material_id) {
      return m.current_stock > 0
    }
    return true
  })
}

const getAvailableStock = (id) => materials.value.find(m => m.id === id)?.current_stock || 0
const getMinStock = (id) => materials.value.find(m => m.id === id)?.min_stock_level || 0

const addItem = () => {
  stockOut.value.items.push({ material_id: null, quantity: 1, unit_cost: 0, total_cost: 0 })
}

const removeItem = (index) => {
  stockOut.value.items.splice(index, 1)
  calculateTotal()
}

const onMaterialChange = (index) => {
  const item = stockOut.value.items[index]
  const material = materials.value.find(m => m.id === item.material_id)
  if (material) {
    item.unit_cost = material.avg_cost || 0
    calculateItemTotal(index)
  }
}

const calculateItemTotal = (index) => {
  const item = stockOut.value.items[index]
  item.total_cost = (item.quantity || 0) * (item.unit_cost || 0)
  calculateTotal()
}

const calculateTotal = () => {
  stockOut.value.total_cost = stockOut.value.items.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unit_cost || 0)
  }, 0)
}

const openNew = () => {
  stockOut.value = emptyStockOut()
  submitted.value = false
  dialogTitle.value = 'Tạo Phiếu Xuất Kho'
  stockOutDialog.value = true
}

const hideDialog = () => {
  if (saving.value) return
  stockOutDialog.value = false
  submitted.value = false
}

const viewDetail = (data) => {
  selectedStockOut.value = data
  detailDialog.value = true
}

const confirmDelete = async (data) => {
  if (confirm(`Bạn có chắc chắn muốn hủy phiếu xuất "${data.code}"? Thao tác này sẽ hoàn lại tồn kho và xóa chi phí liên quan.`)) {
    try {
      await $fetch(`/api/stock-out/${data.id}`, { method: 'DELETE' })
      toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã hủy phiếu xuất kho', life: 3000 })
      await refreshStockOuts()
      await refreshMaterials()
      await refreshProjects()
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Lỗi', detail: e.data?.message || e.message || 'Không thể hủy phiếu xuất.', life: 5000 })
    }
  }
}

const saveStockOut = async () => {
  submitted.value = true
  
  if (!stockOut.value.project_id) {
    toast.add({ severity: 'warn', summary: 'Thiếu thông tin', detail: 'Vui lòng chọn công trình', life: 3000 })
    return
  }
  
  const validItems = stockOut.value.items.filter(item => item.material_id && item.quantity > 0)
  if (validItems.length === 0) {
    toast.add({ severity: 'warn', summary: 'Thiếu thông tin', detail: 'Phải có ít nhất 1 vật tư xuất kho', life: 3000 })
    return
  }

  for (const item of validItems) {
    const material = materials.value.find(m => m.id === item.material_id)
    if (material && item.quantity > material.current_stock) {
      toast.add({ severity: 'warn', summary: 'Tồn kho không đủ', detail: `Vật tư "${material.name}" không đủ. Tồn: ${material.current_stock} ${material.unit}`, life: 5000 })
      return
    }
  }

  saving.value = true
  try {
    const payload = {
      project_id: stockOut.value.project_id,
      date: stockOut.value.date,
      items: validItems.map(item => ({
        material_id: item.material_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost
      })),
      note: stockOut.value.note || ''
    }

    await $fetch('/api/stock-out', { method: 'POST', body: payload })
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã tạo phiếu xuất kho và chi phí', life: 3000 })
    await refreshStockOuts()
    await refreshMaterials()
    await refreshProjects()
    stockOutDialog.value = false
    stockOut.value = emptyStockOut()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: e.data?.message || e.message || 'Không thể tạo phiếu xuất.', life: 5000 })
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
