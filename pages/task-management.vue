<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <h1 class="text-xl font-semibold text-slate-800">Quản lý Công việc</h1>
      <div class="flex flex-wrap gap-2">
        <Dropdown v-model="statusFilter" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Trạng thái" class="w-36" />
        <Dropdown v-model="priorityFilter" :options="priorityOptions" optionLabel="label" optionValue="value" placeholder="Ưu tiên" class="w-32" showClear />
        <Dropdown v-model="assigneeFilter" :options="users" optionLabel="name" optionValue="id" placeholder="Người phụ trách" class="w-48" showClear />
      </div>
    </div>

    <!-- Bulk Actions Bar -->
    <div v-if="selectedTasks.length > 0" class="bg-primary-50 border border-primary-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <Checkbox v-model="selectAll" binary @change="toggleSelectAll" />
        <span class="font-medium text-primary-800">{{ selectedTasks.length }} công việc được chọn</span>
      </div>
      <div class="flex flex-wrap gap-2">
        <Dropdown v-model="bulkAction" :options="bulkActions" optionLabel="label" optionValue="value" placeholder="Hành động hàng loạt" class="w-48" />
        <Button v-if="bulkAction === 'status'" label="Cập nhật trạng thái" severity="info" size="small" @click="showBulkStatusDialog = true" />
        <Button v-if="bulkAction === 'priority'" label="Cập nhật ưu tiên" severity="warn" size="small" @click="showBulkPriorityDialog = true" />
        <Button v-if="bulkAction === 'assignee'" label="Gán người phụ trách" severity="success" size="small" @click="showBulkAssigneeDialog = true" />
        <Button v-if="bulkAction === 'deadline'" label="Đặt hạn deadline" severity="secondary" size="small" @click="showBulkDeadlineDialog = true" />
        <Button v-if="bulkAction === 'delete'" label="Xóa các công việc" severity="danger" size="small" @click="confirmBulkDelete" />
      </div>
    </div>

    <!-- Quick Filters -->
    <div class="flex flex-wrap gap-2">
      <Button label="Quá hạn" severity="danger" size="small" outlined :class="{ 'bg-red-100': quickFilter === 'overdue' }" @click="quickFilter = quickFilter === 'overdue' ? null : 'overdue'" />
      <Button label="Sắp đến hạn (3 ngày)" severity="warn" size="small" outlined :class="{ 'bg-amber-100': quickFilter === 'due_soon' }" @click="quickFilter = quickFilter === 'due_soon' ? null : 'due_soon'" />
      <Button label="Chưa gán người" severity="secondary" size="small" outlined :class="{ 'bg-slate-200': quickFilter === 'unassigned' }" @click="quickFilter = quickFilter === 'unassigned' ? null : 'unassigned'" />
      <Button label="Từ Lead chưa convert" severity="contrast" size="small" outlined :class="{ 'bg-slate-700 text-white': quickFilter === 'unconverted_leads' }" @click="quickFilter = quickFilter === 'unconverted_leads' ? null : 'unconverted_leads'" />
    </div>

    <!-- Tasks Table -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <DataTable 
        v-model:selection="selectedTasks" 
        :value="filteredTasks" 
        dataKey="id"
        :paginator="filteredTasks.length > 20" 
        :rows="20"
        :rowsPerPageOptions="[10, 20, 50]"
        stripedRows
        class="p-datatable-sm"
      >
        <Column selectionMode="multiple" headerStyle="width: 3rem" />

        <Column field="title" header="Công việc" sortable style="min-width: 200px">
          <template #body="{ data }">
            <div class="flex flex-col gap-1">
              <div class="flex flex-wrap gap-1">
                <Tag :severity="getPrioritySeverity(data.priority)" :value="getPriorityLabel(data.priority)" class="text-xs" />
                <Tag :severity="getTypeSeverity(data.type)" :value="getTypeLabel(data.type)" class="text-xs" />
                <Tag v-if="data.source_type === 'lead'" severity="contrast" value="Lead" class="text-xs" />
              </div>
              <span class="font-medium">{{ data.title }}</span>
              <span class="text-sm text-slate-500">{{ data.source_name }}</span>
            </div>
          </template>
        </Column>

        <Column field="status" header="Trạng thái" sortable style="width: 120px">
          <template #body="{ data }">
            <Tag :severity="getStatusSeverity(data.status)" :value="getStatusLabel(data.status)" />
          </template>
        </Column>

        <Column field="assignee_name" header="Phụ trách" sortable style="width: 140px">
          <template #body="{ data }">
            <span :class="data.assignee_name ? 'text-slate-700' : 'text-slate-400 italic'">
              {{ data.assignee_name || '— Chưa gán —' }}
            </span>
          </template>
        </Column>

        <Column field="deadline" header="Hạn" sortable style="width: 100px">
          <template #body="{ data }">
            <div v-if="data.deadline" :class="isOverdue(data.deadline, data.status) ? 'text-red-500 font-medium' : isDueSoon(data.deadline) ? 'text-amber-500' : 'text-slate-500'">
              {{ formatDate(data.deadline) }}
              <Tag v-if="isOverdue(data.deadline, data.status)" value="Quá hạn" severity="danger" class="text-xs ml-1" />
            </div>
            <span v-else class="text-slate-400">—</span>
          </template>
        </Column>

        <Column field="total_expense" header="Chi phí" style="width: 100px">
          <template #body="{ data }">
            <span v-if="data.total_expense > 0" class="text-red-500">
              {{ formatCurrency(data.total_expense) }}
            </span>
            <span v-else class="text-slate-400">—</span>
          </template>
        </Column>

        <Column header="Thao tác" style="width: 150px">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button icon="pi pi-pencil" outlined rounded severity="info" size="small" @click="editTask(data)" />
              <Button v-if="data.status === 'pending'" icon="pi pi-play" outlined rounded severity="success" size="small" @click="updateStatus(data, 'in_progress')" />
              <Button v-if="data.status === 'in_progress'" icon="pi pi-check" outlined rounded severity="success" size="small" @click="updateStatus(data, 'completed')" />
              <Button icon="pi pi-trash" outlined rounded severity="danger" size="small" @click="confirmDelete(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Task Dialog -->
    <Dialog v-model:visible="showTaskDialog" :style="{ width: '500px' }" :header="taskDialogTitle" :modal="true">
      <div class="flex flex-col gap-4 mt-4">
        <div class="flex flex-col gap-1">
          <label class="font-medium text-slate-700">Tiêu đề *</label>
          <InputText v-model="taskForm.title" :invalid="taskSubmitted && !taskForm.title" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-medium text-slate-700">Mô tả</label>
          <Textarea v-model="taskForm.description" rows="2" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="font-medium text-slate-700">Loại</label>
            <Dropdown v-model="taskForm.type" :options="typeOptions" optionLabel="label" optionValue="value" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="font-medium text-slate-700">Ưu tiên</label>
            <Dropdown v-model="taskForm.priority" :options="priorityOptions" optionLabel="label" optionValue="value" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="font-medium text-slate-700">Người phụ trách</label>
            <Dropdown v-model="taskForm.assignee_id" :options="users" optionLabel="name" optionValue="id" placeholder="Chọn người" showClear />
          </div>
          <div class="flex flex-col gap-1">
            <label class="font-medium text-slate-700">Hạn hoàn thành</label>
            <CustomCalendar v-model="taskForm.deadline" dateFormat="dd/mm/yy" :showIcon="true" />
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Hủy" text @click="showTaskDialog = false" />
        <Button label="Lưu" :loading="saving" @click="saveTask" />
      </template>
    </Dialog>

    <!-- Bulk Status Dialog -->
    <Dialog v-model:visible="showBulkStatusDialog" header="Cập nhật trạng thái hàng loạt" :style="{ width: '400px' }" modal>
      <div class="mt-4">
        <Dropdown v-model="bulkStatus" :options="statusOptions.filter(s => s.value)" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" class="w-full" />
      </div>
      <template #footer>
        <Button label="Hủy" text @click="showBulkStatusDialog = false" />
        <Button label="Cập nhật" severity="info" @click="executeBulkUpdate('status')" :loading="bulkSaving" />
      </template>
    </Dialog>

    <!-- Bulk Priority Dialog -->
    <Dialog v-model:visible="showBulkPriorityDialog" header="Cập nhật ưu tiên hàng loạt" :style="{ width: '400px' }" modal>
      <div class="mt-4">
        <Dropdown v-model="bulkPriority" :options="priorityOptions" optionLabel="label" optionValue="value" placeholder="Chọn ưu tiên" class="w-full" />
      </div>
      <template #footer>
        <Button label="Hủy" text @click="showBulkPriorityDialog = false" />
        <Button label="Cập nhật" severity="warn" @click="executeBulkUpdate('priority')" :loading="bulkSaving" />
      </template>
    </Dialog>

    <!-- Bulk Assignee Dialog -->
    <Dialog v-model:visible="showBulkAssigneeDialog" header="Gán người phụ trách hàng loạt" :style="{ width: '400px' }" modal>
      <div class="mt-4">
        <Dropdown v-model="bulkAssigneeId" :options="users" optionLabel="name" optionValue="id" placeholder="Chọn người phụ trách" class="w-full" />
      </div>
      <template #footer>
        <Button label="Hủy" text @click="showBulkAssigneeDialog = false" />
        <Button label="Cập nhật" severity="success" @click="executeBulkUpdate('assignee')" :loading="bulkSaving" />
      </template>
    </Dialog>

    <!-- Bulk Deadline Dialog -->
    <Dialog v-model:visible="showBulkDeadlineDialog" header="Đặt deadline hàng loạt" :style="{ width: '400px' }" modal>
      <div class="mt-4">
        <CustomCalendar v-model="bulkDeadline" dateFormat="dd/mm/yy" :showIcon="true" placeholder="Chọn ngày deadline" class="w-full" />
      </div>
      <template #footer>
        <Button label="Hủy" text @click="showBulkDeadlineDialog = false" />
        <Button label="Cập nhật" severity="secondary" @click="executeBulkUpdate('deadline')" :loading="bulkSaving" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const toast = useToast()
const confirm = useConfirm()

const statusFilter = ref(null)
const priorityFilter = ref(null)
const assigneeFilter = ref(null)
const quickFilter = ref(null)
const selectedTasks = ref([])
const selectAll = ref(false)

const showTaskDialog = ref(false)
const taskDialogTitle = ref('Thêm Công Việc')
const taskForm = ref({ id: null, title: '', description: '', type: 'construction', priority: 'medium', assignee_id: null, deadline: null })
const taskSubmitted = ref(false)
const saving = ref(false)

const showBulkStatusDialog = ref(false)
const showBulkPriorityDialog = ref(false)
const showBulkAssigneeDialog = ref(false)
const showBulkDeadlineDialog = ref(false)
const bulkAction = ref(null)
const bulkStatus = ref(null)
const bulkPriority = ref(null)
const bulkAssigneeId = ref(null)
const bulkDeadline = ref(null)
const bulkSaving = ref(false)

const bulkActions = [
  { label: 'Đổi trạng thái', value: 'status' },
  { label: 'Đổi ưu tiên', value: 'priority' },
  { label: 'Gán người phụ trách', value: 'assignee' },
  { label: 'Đặt deadline', value: 'deadline' },
  { label: 'Xóa công việc', value: 'delete' }
]

const statusOptions = [
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
const { data: users } = await useFetch('/api/users', { default: () => [] })

const filteredTasks = computed(() => {
  let result = tasks.value || []
  
  if (statusFilter.value) {
    result = result.filter(t => t.status === statusFilter.value)
  }
  if (priorityFilter.value) {
    result = result.filter(t => t.priority === priorityFilter.value)
  }
  if (assigneeFilter.value) {
    result = result.filter(t => t.assignee_id === assigneeFilter.value)
  }
  if (quickFilter.value === 'overdue') {
    result = result.filter(t => isOverdue(t.deadline, t.status))
  } else if (quickFilter.value === 'due_soon') {
    result = result.filter(t => isDueSoon(t.deadline) && t.status !== 'completed')
  } else if (quickFilter.value === 'unassigned') {
    result = result.filter(t => !t.assignee_id)
  } else if (quickFilter.value === 'unconverted_leads') {
    result = result.filter(t => t.source_type === 'lead')
  }
  
  return result
})

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedTasks.value = [...filteredTasks.value]
  } else {
    selectedTasks.value = []
  }
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

const editTask = (task) => {
  taskForm.value = {
    id: task.id,
    title: task.title,
    description: task.description || '',
    type: task.type,
    priority: task.priority,
    assignee_id: task.assignee_id,
    deadline: task.deadline ? new Date(task.deadline) : null
  }
  taskDialogTitle.value = 'Sửa Công Việc'
  showTaskDialog.value = true
}

const saveTask = async () => {
  taskSubmitted.value = true
  if (!taskForm.value.title?.trim()) return
  
  saving.value = true
  try {
    const payload = { ...taskForm.value }
    if (payload.deadline) {
      payload.deadline = new Date(payload.deadline).toISOString()
    }
    
    if (taskForm.value.id) {
      await $fetch(`/api/tasks/${taskForm.value.id}`, { method: 'PUT', body: payload })
    } else {
      await $fetch('/api/tasks', { method: 'POST', body: { ...payload, project_id: 'temp' } })
    }
    
    await refresh()
    showTaskDialog.value = false
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Lưu công việc', life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: e.data?.message || 'Lưu thất bại', life: 5000 })
  } finally {
    saving.value = false
  }
}

const updateStatus = async (task, newStatus) => {
  try {
    await $fetch(`/api/tasks/${task.id}`, { method: 'PUT', body: { status: newStatus } })
    await refresh()
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật trạng thái', life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: e.data?.message || 'Cập nhật thất bại', life: 5000 })
  }
}

const confirmDelete = (task) => {
  confirm.require({
    message: `Xóa công việc "${task.title}"?`,
    header: 'Xác nhận xóa',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await $fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
        await refresh()
        toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã xóa công việc', life: 3000 })
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Lỗi', detail: e.data?.message || 'Xóa thất bại', life: 5000 })
      }
    }
  })
}

const confirmBulkDelete = () => {
  confirm.require({
    message: `Xóa ${selectedTasks.value.length} công việc đã chọn?`,
    header: 'Xác nhận xóa hàng loạt',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      bulkSaving.value = true
      try {
        for (const task of selectedTasks.value) {
          await $fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
        }
        selectedTasks.value = []
        selectAll.value = false
        await refresh()
        toast.add({ severity: 'success', summary: 'Thành công', detail: 'Đã xóa các công việc', life: 3000 })
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Lỗi', detail: e.data?.message || 'Xóa thất bại', life: 5000 })
      } finally {
        bulkSaving.value = false
      }
    }
  })
}

const executeBulkUpdate = async (action) => {
  if (selectedTasks.value.length === 0) return
  
  bulkSaving.value = true
  try {
    for (const task of selectedTasks.value) {
      const payload = {}
      
      if (action === 'status' && bulkStatus.value) {
        payload.status = bulkStatus.value
      } else if (action === 'priority' && bulkPriority.value) {
        payload.priority = bulkPriority.value
      } else if (action === 'assignee') {
        payload.assignee_id = bulkAssigneeId.value || null
      } else if (action === 'deadline' && bulkDeadline.value) {
        payload.deadline = new Date(bulkDeadline.value).toISOString()
      }
      
      if (Object.keys(payload).length > 0) {
        await $fetch(`/api/tasks/${task.id}`, { method: 'PUT', body: payload })
      }
    }
    
    selectedTasks.value = []
    selectAll.value = false
    bulkAction.value = null
    showBulkStatusDialog.value = false
    showBulkPriorityDialog.value = false
    showBulkAssigneeDialog.value = false
    showBulkDeadlineDialog.value = false
    
    await refresh()
    toast.add({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật hàng loạt thành công', life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Lỗi', detail: e.data?.message || 'Cập nhật thất bại', life: 5000 })
  } finally {
    bulkSaving.value = false
  }
}
</script>
