<template>
  <div class="space-y-4">
    <div class="flex flex-wrap justify-between items-center gap-4">
      <h1 class="text-xl font-semibold text-slate-800">Kanban Công việc</h1>
      <div class="flex flex-wrap gap-2">
        <Button label="Bảng" icon="pi pi-th-large" severity="secondary" :outlined="currentView !== 'kanban'" @click="currentView = 'kanban'" />
        <Button label="Dòng thời gian" icon="pi pi-calendar" severity="secondary" :outlined="currentView !== 'timeline'" @click="currentView = 'timeline'" />
      </div>
    </div>

    <!-- Kanban View -->
    <div v-if="currentView === 'kanban'" class="flex gap-4 overflow-x-auto pb-4">
      <div v-for="column in columns" :key="column.status" 
           class="flex-shrink-0 w-72 bg-slate-100 rounded-xl p-3"
           @dragover.prevent="onDragOver($event, column.status)"
           @dragleave="onDragLeave"
           @drop="onDrop($event, column.status)">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-semibold text-slate-700">{{ column.label }}</h3>
          <span class="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-sm font-medium">
            {{ getTasksByStatus(column.status).length }}
          </span>
        </div>
        
        <div class="space-y-3 min-h-[200px]"
             :class="{ 'bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg': isDraggingOver === column.status }">
          <div v-for="task in getTasksByStatus(column.status)" :key="task.id"
               class="bg-white rounded-lg p-3 shadow-sm border border-slate-200 cursor-grab hover:shadow-md transition-shadow"
               draggable="true"
               @dragstart="onDragStart($event, task)"
               @dragend="onDragEnd">
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="flex flex-wrap gap-1">
                <Tag :severity="getPrioritySeverity(task.priority)" :value="getPriorityLabel(task.priority)" class="text-xs" />
                <Tag v-if="task.source_type === 'lead'" severity="contrast" value="Lead" class="text-xs" />
              </div>
              <div v-if="task.deadline" 
                   class="text-xs px-1.5 py-0.5 rounded"
                   :class="isOverdue(task.deadline, task.status) ? 'bg-red-100 text-red-600' : isDueSoon(task.deadline) ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'">
                {{ formatDateShort(task.deadline) }}
              </div>
            </div>
            
            <p class="font-medium text-slate-800 text-sm mb-1 line-clamp-2">{{ task.title }}</p>
            <p class="text-xs text-slate-500 mb-2">{{ task.source_name }}</p>
            
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-400">{{ task.assignee_name || '—' }}</span>
              <div class="flex gap-1">
                <Button v-if="column.status === 'pending'" icon="pi pi-play" size="small" severity="success" text @click.stop="updateStatus(task, 'in_progress')" />
                <Button v-if="column.status === 'in_progress'" icon="pi pi-check" size="small" severity="info" text @click.stop="updateStatus(task, 'completed')" />
              </div>
            </div>
          </div>
          
          <div v-if="getTasksByStatus(column.status).length === 0" 
               class="text-center text-slate-400 text-sm py-8">
            Không có công việc
          </div>
        </div>
      </div>
    </div>

    <!-- Timeline View -->
    <div v-if="currentView === 'timeline'" class="bg-white rounded-xl shadow-sm border border-slate-100 p-6 overflow-x-auto">
      <h3 class="font-semibold text-slate-800 mb-4">Dòng thời gian</h3>
      
      <div class="flex items-center gap-4 mb-4">
        <span class="text-sm text-slate-500">Phóng to:</span>
        <Slider v-model="zoomLevel" :min="1" :max="3" :step="1" class="w-32" />
        <span class="text-sm text-slate-500">{{ zoomLabel }}</span>
      </div>
      
      <div class="relative min-w-full">
        <!-- Timeline Header -->
        <div class="flex border-b border-slate-200 pb-2 mb-4 sticky top-0 bg-white z-10">
          <div class="w-48 flex-shrink-0"></div>
          <div v-for="(month, idx) in timelineMonths" :key="idx" 
               class="flex-shrink-0 text-center border-l border-slate-200 px-2"
               :style="{ width: (30 * zoomLevel) + 'px' }">
            <span class="text-xs font-medium text-slate-600">{{ month }}</span>
          </div>
        </div>
        
        <!-- Timeline Rows -->
        <div v-for="task in tasksWithDeadline" :key="task.id" 
             class="flex items-center mb-2 min-h-[40px]">
          <div class="w-48 flex-shrink-0 pr-3">
            <p class="text-sm font-medium text-slate-700 truncate" :title="task.title">{{ task.title }}</p>
            <p class="text-xs text-slate-400 truncate">{{ task.source_name }}</p>
          </div>
          
          <div class="relative flex-1 h-6 bg-slate-50 rounded">
            <!-- Today marker -->
            <div class="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20" 
                 :style="{ left: todayPosition + '%' }">
              <div class="absolute -top-4 left-1/2 -translate-x-1/2 text-xs text-red-500 whitespace-nowrap">Hôm nay</div>
            </div>
            
            <!-- Task bar -->
            <div v-if="task.deadline"
                 class="absolute top-1 bottom-1 rounded-md flex items-center justify-center text-xs font-medium text-white"
                 :class="getStatusBarClass(task.status, task.deadline)"
                 :style="getTaskBarStyle(task)"
                 :title="`${task.title}: ${formatDate(task.deadline)}`">
              <span class="truncate px-2">{{ formatDateShort(task.deadline) }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="tasksWithDeadline.length === 0" class="text-center text-slate-400 py-8">
          Không có công việc với deadline
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'

const toast = useToast()
const currentView = ref('kanban')
const zoomLevel = ref(1)
const draggedTask = ref(null)
const isDraggingOver = ref(null)

const columns = [
  { status: 'pending', label: 'Đang chờ', color: 'slate' },
  { status: 'in_progress', label: 'Đang làm', color: 'blue' },
  { status: 'completed', label: 'Hoàn thành', color: 'green' },
  { status: 'cancelled', label: 'Đã hủy', color: 'gray' }
]

const { data: tasks, refresh } = await useFetch('/api/tasks', { default: () => [] })

const zoomLabel = computed(() => {
  const labels = { 1: '1 tháng', 2: '2 tuần', 3: '1 tuần' }
  return labels[zoomLevel.value] || '1 tháng'
})

const tasksWithDeadline = computed(() => {
  return (tasks.value || []).filter(t => t.deadline && t.status !== 'cancelled')
})

const timelineMonths = computed(() => {
  const months = []
  const now = new Date()
  for (let i = -1; i <= 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    months.push(d.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' }))
  }
  return months
})

const todayPosition = computed(() => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dayOfMonth = now.getDate()
  return (dayOfMonth / daysInMonth) * 100
})

const getTasksByStatus = (status) => {
  return (tasks.value || []).filter(t => t.status === status)
}

const getPrioritySeverity = (priority) => {
  const map = { low: 'secondary', medium: 'info', high: 'warn', urgent: 'danger' }
  return map[priority] || 'info'
}

const getPriorityLabel = (priority) => {
  const map = { low: 'Thấp', medium: 'TB', high: 'Cao', urgent: 'Gấp' }
  return map[priority] || priority
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

const formatDateShort = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
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

const getStatusBarClass = (status, deadline) => {
  if (status === 'completed') return 'bg-green-500'
  if (isOverdue(deadline, status)) return 'bg-red-500'
  if (isDueSoon(deadline)) return 'bg-amber-500'
  return 'bg-blue-500'
}

const getTaskBarStyle = (task) => {
  const deadline = new Date(task.deadline)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0)
  
  const totalDays = (endOfMonth - startOfMonth) / (1000 * 60 * 60 * 24)
  const taskDay = (deadline - startOfMonth) / (1000 * 60 * 60 * 24)
  
  const left = Math.max(0, Math.min(100, (taskDay / totalDays) * 100))
  const width = Math.max(20, 30 * zoomLevel.value)
  
  return {
    left: `${left}%`,
    width: `${width}px`
  }
}

const onDragStart = (event, task) => {
  draggedTask.value = task
  event.dataTransfer.effectAllowed = 'move'
}

const onDragOver = (event, columnStatus) => {
  event.preventDefault()
  if (draggedTask.value && draggedTask.value.status !== columnStatus) {
    isDraggingOver.value = columnStatus
  }
}

const onDragLeave = () => {
  isDraggingOver.value = null
}

const onDragEnd = () => {
  draggedTask.value = null
  isDraggingOver.value = null
}

const onDrop = async (event, newStatus) => {
  event.preventDefault()
  isDraggingOver.value = null
  
  if (!draggedTask.value || draggedTask.value.status === newStatus) {
    draggedTask.value = null
    return
  }
  
  await updateStatus(draggedTask.value, newStatus)
  draggedTask.value = null
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
    toast.add({ severity: 'error', summary: 'Lỗi', detail: e.data?.message || e.message || 'Cập nhật thất bại', life: 5000 })
  }
}
</script>
