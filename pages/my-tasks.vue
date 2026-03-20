<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <h1 class="text-xl font-semibold text-slate-800">Công việc của tôi</h1>
      <div class="flex flex-wrap gap-2">
        <Dropdown v-model="statusFilter" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Lọc trạng thái" class="w-36" />
        <Dropdown v-model="priorityFilter" :options="priorityOptions" optionLabel="label" optionValue="value" placeholder="Lọc ưu tiên" class="w-36" showClear />
        <Dropdown v-model="typeFilter" :options="typeOptions" optionLabel="label" optionValue="value" placeholder="Lọc loại" class="w-36" showClear />
      </div>
    </div>

    <!-- Quick Filters -->
    <div class="flex flex-wrap gap-2">
      <Button label="Quá hạn" severity="danger" size="small" outlined :class="{ 'bg-red-100': quickFilter === 'overdue' }" @click="quickFilter = quickFilter === 'overdue' ? null : 'overdue'" />
      <Button label="Sắp đến hạn (3 ngày)" severity="warn" size="small" outlined :class="{ 'bg-amber-100': quickFilter === 'due_soon' }" @click="quickFilter = quickFilter === 'due_soon' ? null : 'due_soon'" />
      <Button label="Đã hoàn thành" severity="success" size="small" outlined :class="{ 'bg-green-100': quickFilter === 'completed' }" @click="quickFilter = quickFilter === 'completed' ? null : 'completed'" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div class="lg:col-span-3">
        <div v-if="filteredTasks.length === 0" class="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
          <div class="text-slate-400 mb-2">
            <i class="pi pi-check-circle text-4xl"></i>
          </div>
          <p class="text-slate-500">Không có công việc nào</p>
        </div>

        <div class="space-y-3">
          <div v-for="task in filteredTasks" :key="task.id" 
               class="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
               :class="{ 'border-l-4 border-l-red-500': isOverdue(task.deadline, task.status) }"
               @dblclick="openTaskDetail(task)">
            <div class="flex justify-between items-start mb-3">
              <div class="flex-1">
                <div class="flex flex-wrap items-center gap-2 mb-1">
                  <Tag :severity="getPrioritySeverity(task.priority)" :value="getPriorityLabel(task.priority)" class="text-xs" />
                  <Tag :severity="getTypeSeverity(task.type)" :value="getTypeLabel(task.type)" class="text-xs" />
                  <Tag :severity="task.source_type === 'lead' ? 'contrast' : 'info'" :value="task.source_type === 'lead' ? 'Lead' : 'Project'" class="text-xs" />
                  <span v-if="parsedAttachments(task.attachments).length" class="text-xs text-slate-400">
                    <i class="pi pi-paperclip"></i> {{ parsedAttachments(task.attachments).length }}
                  </span>
                </div>
                <h3 class="font-semibold text-slate-800">{{ task.title }}</h3>
                <div class="flex items-center gap-2 mt-1">
                  <i class="pi pi-link text-slate-400 text-xs"></i>
                  <span class="text-sm text-slate-500">{{ task.source_name }}</span>
                  <span v-if="task.project_name && task.project_name !== task.source_name" class="text-slate-400 text-xs">
                    ({{ task.project_name }})
                  </span>
                </div>
              </div>
              <Tag :severity="getStatusSeverity(task.status)" :value="getStatusLabel(task.status)" />
            </div>

            <p v-if="task.description" class="text-sm text-slate-600 mb-3 line-clamp-2">{{ task.description }}</p>

            <div class="flex justify-between items-center text-sm">
              <div class="flex flex-wrap items-center gap-4">
                <div v-if="task.deadline" class="flex items-center gap-1" :class="isOverdue(task.deadline, task.status) ? 'text-red-500' : isDueSoon(task.deadline) ? 'text-amber-500' : 'text-slate-500'">
                  <i class="pi pi-calendar"></i>
                  <span>{{ formatDate(task.deadline) }}</span>
                  <Tag v-if="isOverdue(task.deadline, task.status)" value="Quá hạn" severity="danger" class="text-xs" />
                  <Tag v-else-if="isDueSoon(task.deadline)" value="Sắp đến hạn" severity="warn" class="text-xs" />
                </div>
                <div v-if="task.completed_at" class="flex items-center gap-1 text-green-600">
                  <i class="pi pi-check-circle"></i>
                  <span>{{ formatDate(task.completed_at) }}</span>
                </div>
                <div v-if="task.total_expense > 0" class="flex items-center gap-1 text-slate-500">
                  <i class="pi pi-money-bill"></i>
                  <span>{{ formatCurrency(task.total_expense) }}</span>
                </div>
              </div>
              <div class="flex gap-2">
                <Button v-if="task.status === 'pending'" label="Bắt đầu" icon="pi pi-play" size="small" severity="success" @click.stop="updateStatus(task, 'in_progress')" />
                <Button v-if="task.status === 'in_progress'" label="Hoàn thành" icon="pi pi-check" size="small" severity="info" @click.stop="updateStatus(task, 'completed')" />
                <Button v-if="task.status === 'in_progress'" label="Hủy" icon="pi pi-times" size="small" severity="secondary" text @click.stop="updateStatus(task, 'cancelled')" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <h3 class="font-semibold text-slate-800 mb-3">Tổng quan</h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-slate-500">Tổng công việc</span>
              <span class="font-medium">{{ tasks.length }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-amber-600">Đang chờ</span>
              <span class="font-medium text-amber-600">{{ countByStatus('pending') }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-blue-600">Đang làm</span>
              <span class="font-medium text-blue-600">{{ countByStatus('in_progress') }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-green-600">Hoàn thành</span>
              <span class="font-medium text-green-600">{{ countByStatus('completed') }}</span>
            </div>
            <div class="flex justify-between items-center pt-2 border-t">
              <span class="text-red-600">Quá hạn</span>
              <span class="font-medium text-red-600">{{ overdueTasks.length }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-amber-600">Sắp đến hạn</span>
              <span class="font-medium text-amber-600">{{ dueSoonTasks.length }}</span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <h3 class="font-semibold text-slate-800 mb-3">Công việc quá hạn</h3>
          <div v-if="overdueTasks.length === 0" class="text-slate-400 text-sm">Không có công việc quá hạn</div>
          <div v-else class="space-y-2 max-h-48 overflow-y-auto">
            <div v-for="task in overdueTasks" :key="task.id" class="p-2 bg-red-50 rounded-lg cursor-pointer" @click="openTaskDetail(task)">
              <p class="font-medium text-slate-800 text-sm">{{ task.title }}</p>
              <p class="text-xs text-red-500">{{ formatDate(task.deadline) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Detail Dialog -->
    <Dialog v-model:visible="detailDialog" :style="{ width: '850px' }" header="Chi tiết công việc" :modal="true">
      <div v-if="selectedTask" class="space-y-5">
        <!-- Task Info -->
        <div class="flex justify-between items-start">
          <div>
            <h2 class="text-lg font-semibold text-slate-800">{{ selectedTask.title }}</h2>
            <div class="flex flex-wrap items-center gap-2 mt-2">
              <Tag :severity="getPrioritySeverity(selectedTask.priority)" :value="getPriorityLabel(selectedTask.priority)" />
              <Tag :severity="getTypeSeverity(selectedTask.type)" :value="getTypeLabel(selectedTask.type)" />
              <Tag :severity="selectedTask.source_type === 'lead' ? 'contrast' : 'info'" :value="selectedTask.source_type === 'lead' ? 'Lead' : 'Project'" />
            </div>
          </div>
          <Tag :severity="getStatusSeverity(selectedTask.status)" :value="getStatusLabel(selectedTask.status)" class="text-sm" />
        </div>

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label class="text-slate-500">Nguồn</label>
            <p class="font-medium">{{ selectedTask.source_name }}</p>
          </div>
          <div v-if="selectedTask.deadline">
            <label class="text-slate-500">Hạn chót</label>
            <p class="font-medium" :class="isOverdue(selectedTask.deadline, selectedTask.status) ? 'text-red-500' : ''">
              {{ formatDate(selectedTask.deadline) }}
            </p>
          </div>
          <div v-if="selectedTask.assignee_name">
            <label class="text-slate-500">Người thực hiện</label>
            <p class="font-medium">{{ selectedTask.assignee_name }}</p>
          </div>
          <div v-if="selectedTask.total_expense > 0">
            <label class="text-slate-500">Chi phí</label>
            <p class="font-medium">{{ formatCurrency(selectedTask.total_expense) }}</p>
          </div>
        </div>

        <div v-if="selectedTask.description">
          <label class="text-sm text-slate-500">Mô tả</label>
          <p class="mt-1 p-3 bg-slate-50 rounded text-sm">{{ selectedTask.description }}</p>
        </div>

        <!-- Status Actions -->
        <div class="flex gap-2">
          <Button v-if="selectedTask.status === 'pending'" label="Bắt đầu làm" icon="pi pi-play" severity="success" @click="updateStatusAndRefreshDetail(selectedTask, 'in_progress')" />
          <Button v-if="selectedTask.status === 'in_progress'" label="Hoàn thành" icon="pi pi-check" severity="info" @click="updateStatusAndRefreshDetail(selectedTask, 'completed')" />
          <Button v-if="selectedTask.status === 'in_progress'" label="Hủy" icon="pi pi-times" severity="secondary" text @click="updateStatusAndRefreshDetail(selectedTask, 'cancelled')" />
        </div>

        <!-- Tabs: Attachments & History -->
        <TabView>
          <!-- Tab: Attachments -->
          <TabPanel header="Đính kèm / Thiết kế">
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-sm text-slate-500">{{ taskAttachments.length }} file đính kèm</span>
                <Button label="Upload file" icon="pi pi-upload" size="small" @click="uploadDialog = true" />
              </div>

              <div v-if="taskAttachments.length > 0" class="flex flex-wrap gap-3">
                <a v-for="(file, idx) in taskAttachments" :key="idx" :href="file.url" target="_blank"
                   class="group relative block">
                  <img v-if="isImage(file.name)" :src="getImageSrc(file)" :alt="file.name"
                       class="w-24 h-24 object-cover rounded-lg border hover:opacity-80" />
                  <div v-else class="w-24 h-24 flex flex-col items-center justify-center rounded-lg border bg-slate-50 hover:bg-slate-100">
                    <i class="pi pi-file-pdf text-red-500 text-2xl" v-if="file.name.endsWith('.pdf')"></i>
                    <i class="pi pi-file text-slate-400 text-2xl" v-else></i>
                    <span class="text-xs text-slate-500 mt-1 truncate max-w-20 px-1">{{ file.name }}</span>
                  </div>
                </a>
              </div>
              <p v-else class="text-slate-400 text-sm italic">Chưa có file đính kèm</p>
            </div>
          </TabPanel>

          <!-- Tab: History -->
          <TabPanel header="Lịch sử thay đổi">
            <div v-if="loadingHistory" class="text-center py-4">
              <i class="pi pi-spin pi-spinner text-xl text-slate-400"></i>
            </div>
            <div v-else-if="taskHistory.length === 0" class="text-slate-400 text-sm italic py-4">
              Chưa có lịch sử thay đổi
            </div>
            <div v-else class="space-y-3 max-h-80 overflow-y-auto">
              <div v-for="log in taskHistory" :key="log.id" class="flex gap-3 p-3 rounded-lg bg-slate-50">
                <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                     :class="getActionIconClass(log.action)">
                  <i :class="getActionIcon(log.action)" class="text-xs"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-slate-800 text-sm">{{ log.user_name }}</span>
                    <span class="text-xs text-slate-400">{{ getActionLabel(log.action) }}</span>
                  </div>
                  <div v-if="log.action === 'update' && log.old_data && log.new_data" class="mt-1">
                    <div v-for="change in getChanges(log.old_data, log.new_data)" :key="change.field" class="text-xs text-slate-500">
                      <span class="font-medium">{{ change.label }}:</span>
                      <span class="text-red-400 line-through mr-1">{{ change.old }}</span>
                      <span class="text-green-600">→ {{ change.new }}</span>
                    </div>
                  </div>
                  <p class="text-xs text-slate-400 mt-1">{{ formatDateTime(log.created_at) }}</p>
                </div>
              </div>
            </div>
          </TabPanel>
        </TabView>
      </div>
    </Dialog>

    <!-- Upload Dialog -->
    <Dialog v-model:visible="uploadDialog" :style="{ width: '500px' }" header="Upload file đính kèm" :modal="true">
      <div class="flex flex-col gap-4 mt-4">
        <FileUpload
          mode="advanced"
          :multiple="true"
          :maxFileSize="20000000"
          :fileLimit="20"
          accept="image/*,.pdf"
          :auto="false"
          chooseLabel="Chọn files"
          @select="onFileSelect"
        >
          <template #empty>
            <p class="text-slate-500 text-sm">Kéo thả file hoặc click để chọn (max 20 files, 20MB mỗi file)</p>
          </template>
        </FileUpload>
        <p class="text-sm text-slate-500">Hỗ trợ: JPG, PNG, WebP, PDF</p>
      </div>
      <template #footer>
        <Button label="Hủy" icon="pi pi-times" text @click="uploadDialog = false" />
        <Button label="Upload" icon="pi pi-upload" :loading="uploading" @click="uploadAttachments" />
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
const priorityFilter = ref(null)
const typeFilter = ref(null)
const quickFilter = ref(null)

// Detail dialog
const detailDialog = ref(false)
const selectedTask = ref(null)
const taskHistory = ref([])
const loadingHistory = ref(false)

// Upload dialog
const uploadDialog = ref(false)
const uploading = ref(false)
const filesToUpload = ref([])

const statusOptions = [
  { label: 'Tất cả', value: null },
  { label: 'Đang chờ', value: 'pending' },
  { label: 'Đang làm', value: 'in_progress' },
  { label: 'Hoàn thành', value: 'completed' },
  { label: 'Đã hủy', value: 'cancelled' }
]

const priorityOptions = [
  { label: 'Thấp', value: 'low' },
  { label: 'Trung bình', value: 'medium' },
  { label: 'Cao', value: 'high' },
  { label: 'Gấp', value: 'urgent' }
]

const typeOptions = [
  { label: 'Thiết kế', value: 'design' },
  { label: 'Thi công', value: 'construction' },
  { label: 'Kiểm tra', value: 'inspection' },
  { label: 'Khác', value: 'other' }
]

const { data: tasks, refresh } = await useFetch('/api/tasks', { default: () => [] })

const filteredTasks = computed(() => {
  let result = tasks.value || []
  
  if (statusFilter.value) {
    result = result.filter(t => t.status === statusFilter.value)
  }
  
  if (priorityFilter.value) {
    result = result.filter(t => t.priority === priorityFilter.value)
  }
  
  if (typeFilter.value) {
    result = result.filter(t => t.type === typeFilter.value)
  }
  
  if (quickFilter.value === 'overdue') {
    result = result.filter(t => isOverdue(t.deadline, t.status))
  } else if (quickFilter.value === 'due_soon') {
    result = result.filter(t => isDueSoon(t.deadline) && t.status !== 'completed')
  } else if (quickFilter.value === 'completed') {
    result = result.filter(t => t.status === 'completed')
  }
  
  return result
})

const overdueTasks = computed(() => {
  return (tasks.value || []).filter(t => 
    t.status !== 'completed' && 
    t.deadline && 
    isOverdue(t.deadline, t.status)
  )
})

const dueSoonTasks = computed(() => {
  return (tasks.value || []).filter(t => 
    t.status !== 'completed' && 
    t.deadline && 
    isDueSoon(t.deadline)
  )
})

const taskAttachments = computed(() => {
  return parsedAttachments(selectedTask.value?.attachments)
})

const countByStatus = (status) => {
  return (tasks.value || []).filter(t => t.status === status).length
}

const parsedAttachments = (json) => {
  if (!json) return []
  try { return JSON.parse(json) } catch { return [] }
}

const getImageSrc = (file) => {
  return file.thumbnailUrl || (file.fileId ? `https://lh3.googleusercontent.com/d/${file.fileId}` : file.url)
}

const isImage = (name) => {
  if (!name) return false
  return /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(name)
}

const getStatusSeverity = (status) => {
  const map = { pending: 'warn', in_progress: 'info', completed: 'success', cancelled: 'secondary' }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = { pending: 'Đang chờ', in_progress: 'Đang làm', completed: 'Hoàn thành', cancelled: 'Đã hủy' }
  return map[status] || status
}

const getPrioritySeverity = (priority) => {
  const map = { low: 'secondary', medium: 'info', high: 'warn', urgent: 'danger' }
  return map[priority] || 'info'
}

const getPriorityLabel = (priority) => {
  const map = { low: 'Thấp', medium: 'TB', high: 'Cao', urgent: 'Gấp' }
  return map[priority] || priority
}

const getTypeSeverity = (type) => {
  const map = { design: 'help', construction: 'warning', inspection: 'info', other: 'secondary' }
  return map[type] || 'secondary'
}

const getTypeLabel = (type) => {
  const map = { design: 'Thiết kế', construction: 'Thi công', inspection: 'Kiểm tra', other: 'Khác' }
  return map[type] || type
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('vi-VN')
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

const isOverdue = (dateStr, status) => {
  if (!dateStr || status === 'completed') return false
  return new Date(dateStr) < new Date()
}

const isDueSoon = (dateStr) => {
  if (!dateStr) return false
  const threeDays = 3 * 24 * 60 * 60 * 1000
  const deadline = new Date(dateStr)
  const now = new Date()
  return deadline >= now && deadline <= new Date(now.getTime() + threeDays)
}

// History helpers
const fieldLabels = {
  status: 'Trạng thái', priority: 'Ưu tiên', title: 'Tiêu đề', description: 'Mô tả',
  type: 'Loại', assignee_id: 'Người thực hiện', deadline: 'Hạn chót', attachments: 'Đính kèm'
}

const getActionIcon = (action) => {
  const map = { create: 'pi pi-plus', update: 'pi pi-pencil', delete: 'pi pi-trash' }
  return map[action] || 'pi pi-info-circle'
}

const getActionIconClass = (action) => {
  const map = { create: 'bg-green-100 text-green-600', update: 'bg-blue-100 text-blue-600', delete: 'bg-red-100 text-red-600' }
  return map[action] || 'bg-slate-100 text-slate-600'
}

const getActionLabel = (action) => {
  const map = { create: 'đã tạo công việc', update: 'đã cập nhật', delete: 'đã xóa' }
  return map[action] || action
}

const getChanges = (oldStr, newStr) => {
  try {
    const oldData = JSON.parse(oldStr)
    const newData = JSON.parse(newStr)
    const changes = []
    const trackedFields = ['status', 'priority', 'title', 'type', 'deadline', 'assignee_id', 'attachments']
    for (const field of trackedFields) {
      const oldVal = oldData[field]
      const newVal = newData[field]
      if (oldVal !== newVal && (oldVal || newVal)) {
        let displayOld = oldVal || '(trống)'
        let displayNew = newVal || '(trống)'
        if (field === 'status') { displayOld = getStatusLabel(oldVal) || displayOld; displayNew = getStatusLabel(newVal) || displayNew }
        if (field === 'priority') { displayOld = getPriorityLabel(oldVal) || displayOld; displayNew = getPriorityLabel(newVal) || displayNew }
        if (field === 'type') { displayOld = getTypeLabel(oldVal) || displayOld; displayNew = getTypeLabel(newVal) || displayNew }
        if (field === 'deadline') { displayOld = formatDate(oldVal) || displayOld; displayNew = formatDate(newVal) || displayNew }
        if (field === 'attachments') { displayOld = `${parsedAttachments(oldVal).length} files`; displayNew = `${parsedAttachments(newVal).length} files` }
        changes.push({ field, label: fieldLabels[field] || field, old: displayOld, new: displayNew })
      }
    }
    return changes
  } catch { return [] }
}

// Task detail
const openTaskDetail = async (task) => {
  selectedTask.value = { ...task }
  detailDialog.value = true
  loadingHistory.value = true
  taskHistory.value = []
  try {
    taskHistory.value = await $fetch(`/api/tasks/${task.id}/history`)
  } catch (e) {
    console.error('Error fetching history:', e)
  } finally {
    loadingHistory.value = false
  }
}

const updateStatus = async (task, newStatus) => {
  try {
    await $fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      body: { status: newStatus }
    })
    await refresh()
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật trạng thái', life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: e.data?.message || 'Cập nhật thất bại', life: 5000 })
  }
}

const updateStatusAndRefreshDetail = async (task, newStatus) => {
  await updateStatus(task, newStatus)
  const updated = (tasks.value || []).find(t => t.id === task.id)
  if (updated) {
    selectedTask.value = { ...updated }
    // Reload history
    try { taskHistory.value = await $fetch(`/api/tasks/${task.id}/history`) } catch {}
  }
}

// Upload
const onFileSelect = (event) => {
  filesToUpload.value = event.files
}

const uploadAttachments = async () => {
  if (!selectedTask.value || filesToUpload.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Vui lòng chọn file', life: 3000 })
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    filesToUpload.value.forEach(file => formData.append('files', file))

    const result = await $fetch(`/api/tasks/${selectedTask.value.id}/attachments`, {
      method: 'POST',
      body: formData
    })

    // Update local state
    const existingAttachments = taskAttachments.value
    const allAttachments = [...existingAttachments, ...result.files]
    selectedTask.value.attachments = JSON.stringify(allAttachments)

    // Also update in the tasks list
    const idx = (tasks.value || []).findIndex(t => t.id === selectedTask.value.id)
    if (idx !== -1) tasks.value[idx].attachments = selectedTask.value.attachments

    uploadDialog.value = false
    filesToUpload.value = []
    toast.add({ severity: 'success', summary: 'Thành công', detail: `Đã upload ${result.files.length} files`, life: 3000 })

    // Reload history
    try { taskHistory.value = await $fetch(`/api/tasks/${selectedTask.value.id}/history`) } catch {}
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: e.data?.message || 'Upload thất bại', life: 5000 })
  } finally {
    uploading.value = false
  }
}
</script>
