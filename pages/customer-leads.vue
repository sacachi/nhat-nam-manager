<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <div class="flex gap-2 w-full sm:w-auto">
        <div class="relative w-full sm:w-64">
          <IconField iconPosition="left">
            <InputIcon class="pi pi-search"> </InputIcon>
            <InputText v-model="searchQuery" placeholder="Tìm kiếm..." class="w-full pl-10" />
          </IconField>
        </div>
        <Dropdown v-model="statusFilter" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Lọc trạng thái" class="w-full sm:w-40" />
      </div>
      <Button icon="pi pi-plus" label="Tạo Phiếu" class="w-full sm:w-auto" @click="openNew" />
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <DataTable :value="filteredLeads" paginator :rows="10" :rowsPerPageOptions="[10, 20, 50]"
        responsiveLayout="scroll" class="p-datatable-sm" stripedRows emptyMessage="Không có dữ liệu">
        <Column field="customer_name" header="Khách hàng" sortable style="min-width: 14rem">
          <template #body="{ data }">
            <span class="font-medium text-slate-800">{{ data.customer_name }}</span>
          </template>
        </Column>

        <Column field="phone" header="SĐT" style="min-width: 10rem">
          <template #body="{ data }">
            <div v-if="isPhoneMasked(data.phone)" class="flex items-center gap-2 text-slate-400 italic">
              <i class="pi pi-lock"></i>
              <span>Không có quyền xem</span>
            </div>
            <span v-else>{{ data.phone }}</span>
          </template>
        </Column>

        <Column field="sale_name" header="Sale" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="text-slate-600">{{ data.sale_name }}</span>
          </template>
        </Column>

        <Column field="construction_value" header="Giá trị" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="text-slate-800">{{ formatCurrency(data.construction_value) }}</span>
          </template>
        </Column>

        <Column field="status" header="Trạng thái" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <Tag :severity="getStatusSeverity(data.status)" :value="getStatusLabel(data.status)"></Tag>
          </template>
        </Column>

        <Column field="design_status" header="Thiết kế" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <Tag v-if="data.design_status && data.design_status !== 'not_assigned'" :severity="getDesignStatusSeverity(data.design_status)" :value="getDesignStatusLabel(data.design_status)"></Tag>
            <span v-else class="text-slate-400 text-sm italic">Chưa giao</span>
          </template>
        </Column>

        <Column header="Thao tác" :exportable="false" style="min-width: 8rem">
          <template #body="{ data }">
            <Button icon="pi pi-eye" outlined rounded severity="info" class="mr-2" @click="viewLead(data)" />
            <Button v-if="data.status === 'pending'" icon="pi pi-pencil" outlined rounded severity="warning" class="mr-2" @click="editLead(data)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <Dialog v-model:visible="leadDialog" :style="{ width: '600px' }" :header="dialogTitle" :modal="true" class="p-fluid">
      <div class="flex flex-col gap-4 mt-4">
        <div class="flex flex-col gap-1">
          <label class="font-medium text-slate-700">Tên Sale</label>
          <InputText :modelValue="currentUser?.name" readonly disabled />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label for="customer_name" class="font-medium text-slate-700">Họ và Tên KH *</label>
            <InputText id="customer_name" v-model="lead.customer_name" required :invalid="submitted && !lead.customer_name" />
            <small class="p-error" v-if="submitted && !lead.customer_name">Bắt buộc</small>
          </div>

          <div class="flex flex-col gap-1">
            <label for="phone" class="font-medium text-slate-700">Số Điện Thoại *</label>
            <InputText id="phone" v-model="lead.phone" required :invalid="submitted && !lead.phone" />
            <small class="p-error" v-if="submitted && !lead.phone">Bắt buộc</small>
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label for="address" class="font-medium text-slate-700">Địa chỉ *</label>
          <InputText id="address" v-model="lead.address" required :invalid="submitted && !lead.address" />
          <small class="p-error" v-if="submitted && !lead.address">Bắt buộc</small>
        </div>

        <div class="flex flex-col gap-2">
          <label class="font-medium text-slate-700">Hạng mục thi công *</label>
          <div class="flex flex-wrap gap-2">
            <div v-for="cat in constructionCategories" :key="cat.value" class="flex items-center gap-2">
              <Checkbox v-model="selectedCategories" :inputId="cat.value" :value="cat.value" />
              <label :for="cat.value" class="text-sm cursor-pointer">{{ cat.label }}</label>
            </div>
          </div>
          <div v-if="selectedCategories.includes('Khac')" class="flex flex-col gap-1 mt-2">
            <InputText v-model="lead.construction_categories_other" placeholder="Nhập hạng mục khác..." class="w-full" />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label for="description" class="font-medium text-slate-700">Mô tả chi tiết *</label>
          <Textarea id="description" v-model="lead.description" rows="3" required :invalid="submitted && !lead.description" />
          <small class="p-error" v-if="submitted && !lead.description">Bắt buộc</small>
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-medium text-slate-700">Hình ảnh thực tế (max 10, 10MB)</label>
          <FileUpload
            mode="advanced"
            :multiple="true"
            :maxFileSize="10000000"
            :fileLimit="10"
            accept="image/*"
            :auto="true"
            chooseLabel="Chọn ảnh"
            @select="onFileSelect"
          >
            <template #empty>
              <p class="text-slate-500 text-sm">Kéo thả file hoặc click để chọn</p>
            </template>
          </FileUpload>
          <div v-if="uploadedImages.length > 0" class="flex flex-wrap gap-2 mt-2">
            <div v-for="(img, idx) in uploadedImages" :key="idx" class="relative">
              <img :src="getImageSrc(img)" alt="image" class="w-20 h-20 object-cover rounded border" />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label for="construction_value" class="font-medium text-slate-700">Giá trị công trình *</label>
            <InputNumber
              id="construction_value"
              v-model="lead.construction_value"
              mode="currency"
              currency="VND"
              locale="vi-VN"
              required
              :invalid="submitted && !lead.construction_value"
            />
            <small class="p-error" v-if="submitted && !lead.construction_value">Bắt buộc</small>
          </div>

          <div class="flex flex-col gap-1">
            <label for="design_date" class="font-medium text-slate-700">Ngày gửi sơ bộ TK</label>
            <Calendar id="design_date" v-model="lead.design_submission_date" dateFormat="dd/mm/yy" :showIcon="true" />
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" />
        <Button label="Gửi Phiếu" icon="pi pi-check" :loading="saving" @click="saveLead" />
      </template>
    </Dialog>

    <Dialog v-model:visible="detailDialog" :style="{ width: '700px' }" header="Chi tiết Phiếu Thu Thập" :modal="true">
      <div v-if="selectedLead" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-slate-500">Khách hàng</label>
            <p class="font-medium">{{ selectedLead.customer_name }}</p>
          </div>
          <div>
            <label class="text-sm text-slate-500">SĐT</label>
            <div v-if="isPhoneMasked(selectedLead.phone)" class="flex items-center gap-2 text-slate-400 italic">
              <i class="pi pi-lock"></i>
              <span>Không có quyền xem</span>
            </div>
            <p v-else class="font-medium">{{ selectedLead.phone }}</p>
          </div>
          <div>
            <label class="text-sm text-slate-500">Địa chỉ</label>
            <p class="font-medium">{{ selectedLead.address }}</p>
          </div>
          <div>
            <label class="text-sm text-slate-500">Sale</label>
            <p class="font-medium">{{ selectedLead.sale_name }}</p>
          </div>
          <div>
            <label class="text-sm text-slate-500">Giá trị công trình</label>
            <p class="font-medium">{{ formatCurrency(selectedLead.construction_value) }}</p>
          </div>
          <div>
            <label class="text-sm text-slate-500">Trạng thái</label>
            <Tag :severity="getStatusSeverity(selectedLead.status)" :value="getStatusLabel(selectedLead.status)" />
          </div>
        </div>

        <div>
          <label class="text-sm text-slate-500">Hạng mục thi công</label>
          <div class="flex flex-wrap gap-2 mt-1">
            <Tag v-for="cat in parsedCategories(selectedLead.construction_categories)" :key="cat" :value="cat" severity="info" />
          </div>
        </div>

        <div>
          <label class="text-sm text-slate-500">Mô tả</label>
          <p class="mt-1 p-3 bg-slate-50 rounded">{{ selectedLead.description }}</p>
        </div>

        <div v-if="selectedLead.images">
          <label class="text-sm text-slate-500">Hình ảnh</label>
          <div class="flex flex-wrap gap-2 mt-1">
            <a v-for="(img, idx) in parsedImages(selectedLead.images)" :key="idx" :href="img.url" target="_blank" class="block">
              <img :src="getImageSrc(img)" :alt="img.name" class="w-24 h-24 object-cover rounded border hover:opacity-80 cursor-pointer" />
            </a>
          </div>
        </div>

        <div v-if="selectedLead.note">
          <label class="text-sm text-slate-500">Ghi chú</label>
          <p class="mt-1 p-3 bg-amber-50 rounded text-amber-800">{{ selectedLead.note }}</p>
        </div>

        <div v-if="isAdmin && selectedLead.status === 'pending'" class="flex flex-col gap-2 border-t pt-4">
          <label class="font-medium text-slate-700">Cập nhật trạng thái</label>
          <div class="flex gap-2">
            <Button label="Duyệt" severity="success" size="small" @click="updateStatus('reviewed')" />
            <Button label="Từ chối" severity="danger" size="small" @click="updateStatus('rejected')" />
            <Button label="Chuyển đổi" severity="info" size="small" @click="convertLead" />
          </div>
          <div class="flex flex-col gap-1 mt-2">
            <label class="text-sm text-slate-600">Ghi chú</label>
            <Textarea v-model="reviewNote" rows="2" class="w-full" />
            <Button label="Lưu ghi chú" size="small" class="mt-2 self-start" @click="saveNote" />
          </div>
        </div>

        <div v-if="isAdmin && (selectedLead.status === 'pending' || selectedLead.status === 'reviewed') && !selectedLead.designer" class="flex flex-col gap-3 border-t pt-4">
          <label class="font-medium text-slate-700">Giao Designer</label>
          <div class="flex gap-2 items-end">
            <div class="flex flex-col gap-1 flex-1">
              <label class="text-sm text-slate-600">Chọn Designer</label>
              <Dropdown v-model="selectedDesignerId" :options="designers" optionLabel="name" optionValue="id" placeholder="-- Chọn --" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm text-slate-600">Hạn TK</label>
              <Calendar v-model="designDeadline" dateFormat="dd/mm/yy" :showIcon="true" class="w-40" />
            </div>
            <Button label="Giao" icon="pi pi-check" @click="assignDesigner" :loading="saving" />
          </div>
        </div>

        <div v-if="selectedLead.designer" class="flex flex-col gap-2 border-t pt-4">
          <label class="font-medium text-slate-700">Thông tin thiết kế</label>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label class="text-slate-500">Designer</label>
              <p class="font-medium">{{ selectedLead.designer.name }}</p>
            </div>
            <div>
              <label class="text-slate-500">Hạn thiết kế</label>
              <p class="font-medium">{{ selectedLead.design_deadline ? formatDate(selectedLead.design_deadline) : 'Chưa đặt' }}</p>
            </div>
          </div>
          
          <div v-if="canUpdateDesignStatus" class="flex flex-col gap-2 mt-2">
            <div class="flex gap-2 items-center">
              <Dropdown v-model="selectedDesignStatus" :options="designStatusOptions" optionLabel="label" optionValue="value" placeholder="Trạng thái TK" class="flex-1" />
              <Button label="Cập nhật" size="small" @click="updateDesignStatus" :loading="saving" />
            </div>
            <div>
              <Textarea v-model="designNote" rows="2" placeholder="Ghi chú thiết kế..." class="w-full" />
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { ensureAcceptedResponseStatus, getRequestErrorMessage } from '~/utils/request-feedback'

const toast = useToast()
const { user: currentUser } = useAuth()
const isAdmin = computed(() => currentUser.value?.role === 'Admin')
const isDesigner = computed(() => currentUser.value?.role === 'Design')

const searchQuery = ref('')
const statusFilter = ref(null)
const submitted = ref(false)
const saving = ref(false)
const leadDialog = ref(false)
const detailDialog = ref(false)
const dialogTitle = ref('Phiếu Thu Thập Thông Tin KH')
const reviewNote = ref('')
const selectedDesignerId = ref(null)
const designDeadline = ref(null)
const selectedDesignStatus = ref(null)
const designNote = ref('')

const { data: designers } = await useFetch('/api/designers', { default: () => [] })

const canUpdateDesignStatus = computed(() => {
  if (!selectedLead.value?.designer) return false
  return isAdmin.value || selectedLead.value.designer.id === currentUser.value?.id
})

const statusOptions = [
  { label: 'Chờ duyệt', value: 'pending' },
  { label: 'Đã duyệt', value: 'reviewed' },
  { label: 'Đã chuyển đổi', value: 'converted' },
  { label: 'Từ chối', value: 'rejected' }
]

const constructionCategories = [
  { label: 'Tủ Bếp', value: 'TuBep' },
  { label: 'Tủ Áo', value: 'TuAo' },
  { label: 'Tủ Tivi', value: 'TuTivi' },
  { label: 'Ốp Tường', value: 'OpTuong' },
  { label: 'Trần', value: 'Tran' },
  { label: 'Cầu Thang', value: 'CauThang' },
  { label: 'Khác', value: 'Khac' }
]

const designStatusOptions = [
  { label: 'Đang thiết kế', value: 'in_progress' },
  { label: 'Gửi duyệt TK', value: 'review_requested' },
  { label: 'Đã duyệt TK', value: 'approved' },
  { label: 'Từ chối TK', value: 'rejected' }
]

const emptyLead = {
  customer_name: '',
  phone: '',
  address: '',
  description: '',
  construction_value: null,
  construction_categories_other: '',
  design_submission_date: null
}

const lead = ref({ ...emptyLead })
const selectedCategories = ref([])
const uploadedImages = ref([])
const tempFolderId = ref(null)
const selectedLead = ref(null)

const fetchWithLeadToast = async (url, options = {}, fallbackMessage = 'Yêu cầu thất bại') => {
  try {
    const response = await $fetch.raw(url, options)
    ensureAcceptedResponseStatus(response.status)
    return response._data
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: getRequestErrorMessage(error, fallbackMessage),
      life: 5000
    })
    throw error
  }
}

const { data: leads, refresh } = await useFetch('/api/customer-leads', { default: () => [] })

const filteredLeads = computed(() => {
  let result = leads.value || []
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(l => 
      l.customer_name.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      l.sale_name?.toLowerCase().includes(q)
    )
  }
  if (statusFilter.value) {
    result = result.filter(l => l.status === statusFilter.value)
  }
  return result
})

const isPhoneMasked = (phone) => {
  return phone && phone.includes('*')
}

const getStatusSeverity = (status) => {
  const map = { pending: 'warn', reviewed: 'info', converted: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = { pending: 'Chờ duyệt', reviewed: 'Đã duyệt', converted: 'Đã chuyển đổi', rejected: 'Từ chối' }
  return map[status] || status
}

const getDesignStatusSeverity = (status) => {
  const map = { 
    not_assigned: 'secondary', 
    assigned: 'info', 
    in_progress: 'warn', 
    review_requested: 'help', 
    approved: 'success', 
    rejected: 'danger' 
  }
  return map[status] || 'info'
}

const getDesignStatusLabel = (status) => {
  const map = { 
    not_assigned: 'Chưa giao', 
    assigned: 'Đã giao', 
    in_progress: 'Đang thiết kế', 
    review_requested: 'Chờ duyệt TK', 
    approved: 'Đã duyệt TK', 
    rejected: 'Từ chối TK' 
  }
  return map[status] || status
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('vi-VN')
}

const parsedCategories = (json) => {
  try {
    return JSON.parse(json)
  } catch {
    return []
  }
}

const getImageSrc = (img) => {
  return img.thumbnailUrl || (img.fileId ? `https://lh3.googleusercontent.com/d/${img.fileId}` : img.url)
}

const parsedImages = (json) => {
  try {
    return JSON.parse(json)
  } catch {
    return []
  }
}

const onFileSelect = async (event) => {
  saving.value = true
  try {
    const files = event.files
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))

    const leadName = lead.value.customer_name || 'temp'
    const leadId = lead.value.id || `temp-${Date.now()}`
    const response = await fetchWithLeadToast(`/api/customer-leads/upload-images?lead_name=${encodeURIComponent(leadName)}&lead_id=${leadId}`, {
      method: 'POST',
      body: formData
    }, 'Tải ảnh thất bại')

    uploadedImages.value = [...uploadedImages.value, ...response.files]
    tempFolderId.value = response.folderId
  } catch (e) {
    console.error('Upload error:', e)
  } finally {
    saving.value = false
  }
}

const openNew = () => {
  lead.value = { ...emptyLead }
  selectedCategories.value = []
  uploadedImages.value = []
  tempFolderId.value = null
  submitted.value = false
  dialogTitle.value = 'Phiếu Thu Thập Thông Tin KH'
  leadDialog.value = true
}

const hideDialog = () => {
  leadDialog.value = false
  submitted.value = false
}

const viewLead = async (data) => {
  try {
    selectedLead.value = await fetchWithLeadToast(`/api/customer-leads/${data.id}`, {}, 'Không thể tải chi tiết lead')
    reviewNote.value = selectedLead.value.note || ''
    detailDialog.value = true
  } catch (e) {
    console.error('Error fetching lead:', e)
  }
}

const editLead = (data) => {
  lead.value = { ...data }
  selectedCategories.value = parsedCategories(data.construction_categories)
  uploadedImages.value = parsedImages(data.images || '[]')
  dialogTitle.value = 'Sửa Phiếu'
  leadDialog.value = true
}

const saveLead = async () => {
  submitted.value = true
  
  if (!lead.value.customer_name || !lead.value.phone || !lead.value.address || 
      !lead.value.description || !lead.value.construction_value || selectedCategories.value.length === 0) {
    return
  }

  saving.value = true
  try {
    const payload = {
      ...lead.value,
      construction_categories: JSON.stringify(selectedCategories.value),
      images: uploadedImages.value.length > 0 ? JSON.stringify(uploadedImages.value) : null,
      construction_value: lead.value.construction_value
    }

    if (lead.value.id) {
      await fetchWithLeadToast(`/api/customer-leads/${lead.value.id}`, { method: 'PUT', body: payload }, 'Lưu thất bại')
    } else {
      await fetchWithLeadToast('/api/customer-leads', { method: 'POST', body: payload }, 'Lưu thất bại')
    }

    await refresh()
    hideDialog()
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Lưu phiếu thành công', life: 3000 })
  } catch (e) {
    console.error('Save error:', e)
  } finally {
    saving.value = false
  }
}

const updateStatus = async (status) => {
  if (!selectedLead.value) return
  try {
    await fetchWithLeadToast(`/api/customer-leads/${selectedLead.value.id}`, {
      method: 'PUT',
      body: { status, note: reviewNote.value }
    }, 'Cập nhật thất bại')
    await refresh()
    selectedLead.value = { ...selectedLead.value, status, note: reviewNote.value }
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật trạng thái thành công', life: 3000 })
  } catch (e) {
    console.error('Update status error:', e)
  }
}

const saveNote = async () => {
  if (!selectedLead.value) return
  try {
    await fetchWithLeadToast(`/api/customer-leads/${selectedLead.value.id}`, {
      method: 'PUT',
      body: { note: reviewNote.value }
    }, 'Lưu ghi chú thất bại')
    selectedLead.value = { ...selectedLead.value, note: reviewNote.value }
  } catch (e) {
    console.error('Save note error:', e)
  }
}

const convertLead = async () => {
  if (!selectedLead.value) return
  
  if (!confirm(`Chuyển đổi lead "${selectedLead.value.customer_name}" thành Khách hàng và Công trình?`)) {
    return
  }
  
  saving.value = true
  try {
    const result = await fetchWithLeadToast(`/api/customer-leads/${selectedLead.value.id}/convert`, {
      method: 'POST'
    }, 'Chuyển đổi thất bại')
    
    await refresh()
    selectedLead.value = { ...selectedLead.value, status: 'converted' }
    detailDialog.value = false
    
    toast.add({ 
      severity: 'success', 
      summary: 'Thành công', 
      detail: `Đã tạo KH: ${result.customer.name} và Công trình: ${result.project.name}`, 
      life: 5000 
    })
  } catch (e) {
    console.error('Convert error:', e)
  } finally {
    saving.value = false
  }
}

const assignDesigner = async () => {
  if (!selectedLead.value || !selectedDesignerId.value) return
  
  saving.value = true
  try {
    const result = await fetchWithLeadToast(`/api/customer-leads/${selectedLead.value.id}/assign`, {
      method: 'POST',
      body: {
        designer_id: selectedDesignerId.value,
        design_deadline: designDeadline.value
      }
    }, 'Giao designer thất bại')
    
    await refresh()
    selectedLead.value = { ...selectedLead.value, ...result }
    selectedDesignerId.value = null
    designDeadline.value = null
    
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã giao designer', life: 3000 })
  } catch (e) {
    console.error('Assign designer error:', e)
  } finally {
    saving.value = false
  }
}

const updateDesignStatus = async () => {
  if (!selectedLead.value || !selectedDesignStatus.value) return
  
  saving.value = true
  try {
    const result = await fetchWithLeadToast(`/api/customer-leads/${selectedLead.value.id}/design-status`, {
      method: 'PUT',
      body: {
        design_status: selectedDesignStatus.value,
        design_note: designNote.value
      }
    }, 'Cập nhật thất bại')
    
    await refresh()
    selectedLead.value = { ...selectedLead.value, ...result }
    selectedDesignStatus.value = null
    designNote.value = ''
    
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật trạng thái thiết kế', life: 3000 })
  } catch (e) {
    console.error('Update design status error:', e)
  } finally {
    saving.value = false
  }
}
</script>
