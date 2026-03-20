<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <h1 class="text-xl font-semibold text-slate-800">Workspace Designer</h1>
      <div class="flex gap-2">
        <Dropdown v-model="statusFilter" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Lọc trạng thái" class="w-48" />
      </div>
    </div>

    <div v-if="filteredLeads.length === 0" class="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
      <div class="text-slate-400 mb-2">
        <i class="pi pi-inbox text-4xl"></i>
      </div>
      <p class="text-slate-500">Không có công việc thiết kế được giao</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="lead in filteredLeads" :key="lead.id" 
           class="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
           @click="openLeadDetail(lead)">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="font-semibold text-slate-800">{{ lead.customer_name }}</h3>
            <p class="text-sm text-slate-500">{{ lead.address }}</p>
          </div>
          <Tag :severity="getDesignStatusSeverity(lead.design_status)" :value="getDesignStatusLabel(lead.design_status)" />
        </div>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-500">Hạng mục:</span>
            <div class="flex flex-wrap gap-1">
              <Tag v-for="cat in parsedCategories(lead.construction_categories)" :key="cat" :value="cat" severity="info" class="text-xs" />
            </div>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Giá trị:</span>
            <span class="font-medium">{{ formatCurrency(lead.construction_value) }}</span>
          </div>
          <div v-if="lead.design_deadline" class="flex justify-between">
            <span class="text-slate-500">Hạn TK:</span>
            <span :class="isOverdue(lead.design_deadline) ? 'text-red-500 font-medium' : ''">
              {{ formatDate(lead.design_deadline) }}
            </span>
          </div>
        </div>

        <div class="flex gap-2 mt-4">
          <Button v-if="lead.design_status === 'assigned'" label="Bắt đầu" icon="pi pi-play" size="small" severity="success" class="flex-1" @click.stop="updateStatus(lead, 'in_progress')" />
          <Button v-if="lead.design_status === 'in_progress'" label="Gửi duyệt" icon="pi pi-send" size="small" severity="info" class="flex-1" @click.stop="requestReview(lead)" />
        </div>
      </div>
    </div>

    <Dialog v-model:visible="detailDialog" :style="{ width: '800px' }" header="Chi tiết công việc" :modal="true">
      <div v-if="selectedLead" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-slate-500">Khách hàng</label>
            <p class="font-medium">{{ selectedLead.customer_name }}</p>
          </div>
          <div>
            <label class="text-sm text-slate-500">SĐT</label>
            <p class="font-medium">{{ selectedLead.phone }}</p>
          </div>
          <div>
            <label class="text-sm text-slate-500">Địa chỉ</label>
            <p class="font-medium">{{ selectedLead.address }}</p>
          </div>
          <div>
            <label class="text-sm text-slate-500">Sale phụ trách</label>
            <p class="font-medium">{{ selectedLead.sale_name }}</p>
          </div>
        </div>

        <div>
          <label class="text-sm text-slate-500">Hạng mục thi công</label>
          <div class="flex flex-wrap gap-2 mt-1">
            <Tag v-for="cat in parsedCategories(selectedLead.construction_categories)" :key="cat" :value="cat" severity="info" />
          </div>
        </div>

        <div>
          <label class="text-sm text-slate-500">Mô tả yêu cầu</label>
          <p class="mt-1 p-3 bg-slate-50 rounded">{{ selectedLead.description }}</p>
        </div>

        <div v-if="selectedLead.images">
          <label class="text-sm text-slate-500">Hình ảnh hiện trường</label>
          <div class="flex flex-wrap gap-2 mt-1">
            <a v-for="(img, idx) in parsedImages(selectedLead.images)" :key="idx" :href="img.url" target="_blank" class="block">
              <img :src="getImageSrc(img)" :alt="img.name" class="w-20 h-20 object-cover rounded border hover:opacity-80 cursor-pointer" />
            </a>
          </div>
        </div>

        <div v-if="selectedLead.design_deadline" class="flex items-center gap-2">
          <label class="text-sm text-slate-500">Hạn thiết kế:</label>
          <span :class="isOverdue(selectedLead.design_deadline) ? 'text-red-500 font-medium' : 'font-medium'">
            {{ formatDate(selectedLead.design_deadline) }}
          </span>
          <Tag v-if="isOverdue(selectedLead.design_deadline)" value="Quá hạn" severity="danger" />
        </div>

        <div class="border-t pt-4">
          <div class="flex justify-between items-center mb-3">
            <label class="font-medium text-slate-700">Bản thiết kế ({{ parsedDesignFiles.length }})</label>
            <Button label="Upload thiết kế" icon="pi pi-upload" size="small" @click="uploadDialog = true" />
          </div>
          
          <div v-if="parsedDesignFiles.length > 0" class="flex flex-wrap gap-2">
            <a v-for="(file, idx) in parsedDesignFiles" :key="idx" :href="file.url" target="_blank" 
               class="flex items-center gap-2 p-2 bg-slate-50 rounded hover:bg-slate-100">
              <i class="pi pi-file-pdf text-red-500" v-if="file.name.endsWith('.pdf')"></i>
              <i class="pi pi-image text-blue-500" v-else></i>
              <span class="text-sm truncate max-w-32">{{ file.name }}</span>
            </a>
          </div>
          <p v-else class="text-slate-400 text-sm italic">Chưa có bản thiết kế</p>
        </div>

        <div v-if="selectedLead.design_note" class="border-t pt-4">
          <label class="text-sm text-slate-500">Ghi chú thiết kế</label>
          <p class="mt-1 p-3 bg-blue-50 rounded text-blue-800">{{ selectedLead.design_note }}</p>
        </div>

        <div class="border-t pt-4">
          <label class="text-sm text-slate-500 mb-2 block">Cập nhật trạng thái</label>
          <div class="flex gap-2">
            <Dropdown v-model="newDesignStatus" :options="designStatusOptions" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" class="flex-1" />
            <Button label="Cập nhật" @click="updateDesignStatus" :loading="saving" />
          </div>
          <div class="mt-2">
            <Textarea v-model="designNote" rows="2" placeholder="Ghi chú thiết kế..." class="w-full" />
          </div>
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="uploadDialog" :style="{ width: '500px' }" header="Upload bản thiết kế" :modal="true">
      <div class="flex flex-col gap-4 mt-4">
        <FileUpload
          mode="advanced"
          :multiple="true"
          :maxFileSize="20000000"
          :fileLimit="20"
          accept="image/*,.pdf"
          :auto="true"
          chooseLabel="Chọn files"
          @select="onDesignFileSelect"
        >
          <template #empty>
            <p class="text-slate-500 text-sm">Kéo thả file hoặc click để chọn (max 20 files, 20MB each)</p>
          </template>
        </FileUpload>
        <p class="text-sm text-slate-500">Hỗ trợ: JPG, PNG, WebP, PDF</p>
      </div>
      <template #footer>
        <Button label="Hủy" icon="pi pi-times" text @click="uploadDialog = false" />
        <Button label="Upload" icon="pi pi-upload" :loading="uploading" @click="uploadDesignFiles" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'

const toast = useToast()
const { user: currentUser } = useAuth()

const statusFilter = ref(null)
const saving = ref(false)
const uploading = ref(false)
const detailDialog = ref(false)
const uploadDialog = ref(false)
const selectedLead = ref(null)
const newDesignStatus = ref(null)
const designNote = ref('')
const designFilesToUpload = ref([])

const statusOptions = [
  { label: 'Tất cả', value: null },
  { label: 'Đã giao', value: 'assigned' },
  { label: 'Đang thiết kế', value: 'in_progress' },
  { label: 'Chờ duyệt TK', value: 'review_requested' },
  { label: 'Đã duyệt TK', value: 'approved' },
  { label: 'Từ chối TK', value: 'rejected' }
]

const designStatusOptions = [
  { label: 'Đang thiết kế', value: 'in_progress' },
  { label: 'Gửi duyệt TK', value: 'review_requested' },
  { label: 'Hoàn thành', value: 'approved' }
]

const { data: leads, refresh } = await useFetch('/api/customer-leads', { default: () => [] })

const filteredLeads = computed(() => {
  let result = leads.value || []
  if (statusFilter.value) {
    result = result.filter(l => l.design_status === statusFilter.value)
  }
  return result
})

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

const parsedDesignFiles = computed(() => {
  if (!selectedLead.value?.design_files) return []
  try {
    return JSON.parse(selectedLead.value.design_files)
  } catch {
    return []
  }
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

const isOverdue = (dateStr) => {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
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

const openLeadDetail = async (lead) => {
  try {
    selectedLead.value = await $fetch(`/api/customer-leads/${lead.id}`)
    newDesignStatus.value = null
    designNote.value = selectedLead.value.design_note || ''
    designFilesToUpload.value = []
    detailDialog.value = true
  } catch (e) {
    console.error('Error fetching lead:', e)
  }
}

const onDesignFileSelect = (event) => {
  designFilesToUpload.value = event.files
}

const uploadDesignFiles = async () => {
  if (!selectedLead.value || designFilesToUpload.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Vui lòng chọn file để upload', life: 3000 })
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    designFilesToUpload.value.forEach(file => formData.append('files', file))

    const result = await $fetch(`/api/customer-leads/${selectedLead.value.id}/design-files`, {
      method: 'POST',
      body: formData
    })

    selectedLead.value.design_files = JSON.stringify([
      ...parsedDesignFiles.value,
      ...result.files
    ])
    selectedLead.value.design_status = result.lead.design_status

    await refresh()
    uploadDialog.value = false
    designFilesToUpload.value = []

    toast.add({ severity: 'success', summary: 'Thành công', detail: `Đã upload ${result.files.length} files`, life: 3000 })
  } catch (e) {
    console.error('Upload error:', e)
    toast.add({ severity: 'error', summary: 'Lỗi', detail: e.data?.message || e.message || 'Upload thất bại', life: 5000 })
  } finally {
    uploading.value = false
  }
}

const updateStatus = async (lead, status) => {
  try {
    await $fetch(`/api/customer-leads/${lead.id}/design-status`, {
      method: 'PUT',
      body: { design_status: status }
    })
    await refresh()
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật trạng thái', life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: e.data?.message || e.message || 'Cập nhật thất bại', life: 5000 })
  }
}

const requestReview = async (lead) => {
  try {
    await $fetch(`/api/customer-leads/${lead.id}/design-status`, {
      method: 'PUT',
      body: { design_status: 'review_requested' }
    })
    await refresh()
    if (selectedLead.value?.id === lead.id) {
      selectedLead.value.design_status = 'review_requested'
    }
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã gửi yêu cầu duyệt', life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: e.data?.message || e.message || 'Thất bại', life: 5000 })
  }
}

const updateDesignStatus = async () => {
  if (!selectedLead.value || !newDesignStatus.value) return

  saving.value = true
  try {
    const result = await $fetch(`/api/customer-leads/${selectedLead.value.id}/design-status`, {
      method: 'PUT',
      body: { 
        design_status: newDesignStatus.value,
        design_note: designNote.value
      }
    })
    
    selectedLead.value.design_status = result.design_status
    selectedLead.value.design_note = result.design_note
    await refresh()
    
    newDesignStatus.value = null
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật trạng thái', life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: e.data?.message || e.message || 'Cập nhật thất bại', life: 5000 })
  } finally {
    saving.value = false
  }
}
</script>
