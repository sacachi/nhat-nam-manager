<template>
  <div class="space-y-6">
    <!-- Header Controls -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-start sm:items-center">
        <div class="relative w-full sm:w-64">
          <IconField iconPosition="left">
              <InputIcon class="pi pi-search"> </InputIcon>
              <InputText v-model="searchQuery" placeholder="Tìm theo tên công trình..." class="w-full pl-10" />
          </IconField>
        </div>
                <MultiSelect
                    v-model="selectedStatuses"
                    :options="statuses"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Lọc theo trạng thái"
                    display="chip"
                    filter
                    class="w-full sm:w-72"
                />
        <CustomCalendar v-model="filterDate" selectionMode="range" :manualInput="false" placeholder="Lọc theo ngày" dateFormat="dd/mm/yy" class="w-full sm:w-64" showClear />
      </div>
      <Button v-if="!isDesign" icon="pi pi-plus" label="Thêm Công Trình" class="w-full sm:w-auto p-button-primary shadow-sm" @click="openNew" />
    </div>

    <!-- Data Table -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <div v-if="selectedProjects.length" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                <div class="text-sm text-emerald-800 font-medium">
                    Đã chọn {{ selectedProjects.length }} công trình.
                </div>
                <Button icon="pi pi-file-excel" label="Xuất Excel" severity="success" @click="exportSelectedProjects" />
            </div>

            <DataTable v-model:selection="selectedProjects" dataKey="id" :value="filteredProjects" paginator :rows="10" :rowsPerPageOptions="[10, 20, 50]" 
        responsiveLayout="scroll" class="p-datatable-sm" hoverRole stripedRows emptyMessage="Không tìm thấy dữ liệu.">
                <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
        <Column field="name" header="Tên công trình" sortable style="min-width: 14rem">
          <template #body="{ data }">
            <span class="font-medium text-slate-800">{{ data.name }}</span>
          </template>
        </Column>
        <Column field="customer_name" header="Khách hàng" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="text-slate-600">{{ data.customer_name || '—' }}</span>
          </template>
        </Column>
        <Column v-if="canViewFinance" field="contract_value" header="Hợp đồng (VNĐ)" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="text-slate-700 font-medium">{{ formatCurrency(data.contract_value) }}</span>
          </template>
        </Column>
        <Column v-if="canViewFinance" field="total_received" header="Đã thu" sortable style="min-width: 9rem">
          <template #body="{ data }">
            <span class="text-emerald-600 font-semibold">{{ formatCurrency(data.total_received) }}</span>
          </template>
        </Column>
        <Column v-if="canViewFinance" field="total_spent" header="Đã chi" sortable style="min-width: 9rem">
          <template #body="{ data }">
            <span class="text-red-500 font-semibold">{{ formatCurrency(data.total_spent) }}</span>
          </template>
        </Column>
        <Column field="status" header="Trạng thái" sortable style="min-width: 8rem">
          <template #body="{ data }">
            <Tag :severity="getStatusSeverity(data.status)" :value="data.status"></Tag>
          </template>
        </Column>
        <Column field="start_date" header="Ngày BĐ" sortable style="min-width: 7rem">
           <template #body="{ data }">
              <span class="text-slate-500 text-sm">{{ formatDate(data.start_date) }}</span>
           </template>
        </Column>
        <Column header="Công việc" style="min-width: 8rem">
           <template #body="{ data }">
              <div v-if="data.tasks_count > 0" class="flex items-center gap-2">
                 <span class="text-slate-700">{{ data.tasks_completed }}/{{ data.tasks_count }}</span>
                 <div class="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div class="h-full bg-green-500 rounded-full" :style="{ width: (data.tasks_completed / data.tasks_count * 100) + '%' }"></div>
                 </div>
              </div>
              <span v-else class="text-slate-400 text-sm">—</span>
           </template>
        </Column>
        <Column header="Thao tác" :exportable="false" style="min-width: 10rem">
            <template #body="{ data }">
                <Button icon="pi pi-eye" outlined rounded severity="secondary" class="mr-1" v-tooltip.top="'Xem chi tiết'" @click="viewDetail(data)" />
                <Button v-if="!isDesign" icon="pi pi-pencil" outlined rounded severity="info" class="mr-1" @click="editProject(data)" />
                <Button v-if="!isDesign" icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteProject(data)" />
            </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:visible="productDialog" :style="{ width: '500px' }" :header="dialogTitle" :modal="true" class="p-fluid">
      <div class="flex flex-col gap-4 mt-4">
        <div class="flex flex-col gap-1">
            <label for="name" class="font-medium text-slate-700">Tên công trình *</label>
            <InputText id="name" v-model.trim="project.name" required="true" :invalid="submitted && !project.name" />
            <small class="p-error text-red-500" v-if="submitted && !project.name">Tên là bắt buộc.</small>
        </div>

        <div class="flex flex-col gap-1">
            <div class="flex justify-between items-center">
                <label for="customer" class="font-medium text-slate-700">Khách hàng</label>
                <button type="button" class="text-xs text-primary-600 hover:underline font-medium" @click="showNewCustomer = !showNewCustomer">
                    <i class="pi pi-plus mr-1"></i>{{ showNewCustomer ? 'Hủy tạo mới' : 'Tạo KH mới' }}
                </button>
            </div>
            <Dropdown v-if="!showNewCustomer" id="customer" v-model="project.customer_id" :options="customers" optionLabel="name" optionValue="id" placeholder="Chọn khách hàng" showClear />
            <div v-else class="flex gap-2">
                <InputText v-model.trim="newCustomerName" placeholder="Tên khách hàng mới" class="flex-1" />
                <Button icon="pi pi-check" severity="success" size="small" :loading="creatingCustomer" @click="createQuickCustomer" />
            </div>
        </div>

        <div class="flex flex-col gap-1">
            <label for="contract_value" class="font-medium text-slate-700">Giá trị hợp đồng *</label>
            <InputNumber id="contract_value" v-model="project.contract_value" mode="currency" currency="VND" locale="vi-VN" :invalid="submitted && !project.contract_value" />
            <small class="p-error text-red-500" v-if="submitted && !project.contract_value">Giá trị hợp đồng là bắt buộc.</small>
        </div>

        <div class="flex flex-col gap-1">
            <label for="status" class="font-medium text-slate-700">Trạng thái</label>
            <Dropdown id="status" v-model="project.status" :options="statuses" optionLabel="label" optionValue="value" placeholder="Chọn trạng thái" />
        </div>

        <div class="flex flex-col gap-1">
            <label for="start_date" class="font-medium text-slate-700">Ngày bắt đầu</label>
            <CustomCalendar id="start_date" v-model="project.start_date" dateFormat="dd/mm/yy" :showIcon="true" />
        </div>

         <div class="flex flex-col gap-1">
             <label for="note" class="font-medium text-slate-700">Ghi chú</label>
             <Textarea id="note" v-model="project.note" rows="3" />
         </div>
      </div>

      <template #footer>
          <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" class="text-slate-600" />
          <Button label="Lưu" icon="pi pi-check" :loading="loading" @click="saveProject" />
      </template>
    </Dialog>

    <!-- Detail Dialog -->
    <Dialog v-model:visible="detailDialog" :style="{ width: '700px' }" :header="'Chi tiết: ' + (detailProject?.name || '')" :modal="true">
        <div v-if="detailLoading" class="flex justify-center py-8">
            <i class="pi pi-spin pi-spinner text-2xl text-slate-400"></i>
        </div>
        <div v-else-if="detailProject" class="flex flex-col gap-6 mt-2">
            <!-- Summary Cards -->
            <div v-if="canViewFinance" class="grid grid-cols-3 gap-4">
                <div class="bg-slate-50 rounded-lg p-4 border text-center">
                    <p class="text-xs text-slate-500 mb-1">Hợp đồng</p>
                    <p class="text-lg font-bold text-slate-800">{{ formatCurrency(detailProject.contract_value) }}</p>
                </div>
                <div class="bg-emerald-50 rounded-lg p-4 border border-emerald-200 text-center">
                    <p class="text-xs text-emerald-600 mb-1">Tổng thu</p>
                    <p class="text-lg font-bold text-emerald-700">{{ formatCurrency(detailTotalReceived) }}</p>
                </div>
                <div class="bg-red-50 rounded-lg p-4 border border-red-200 text-center">
                    <p class="text-xs text-red-500 mb-1">Tổng chi</p>
                    <p class="text-lg font-bold text-red-600">{{ formatCurrency(detailTotalSpent) }}</p>
                </div>
            </div>

            <!-- Receipts -->
            <div v-if="canViewFinance">
                <h4 class="font-bold text-slate-700 mb-2 flex items-center gap-2"><i class="pi pi-arrow-down text-emerald-500"></i> Phiếu thu ({{ detailProject.receipts?.length || 0 }})</h4>
                <DataTable :value="detailProject.receipts" class="p-datatable-sm" stripedRows emptyMessage="Chưa có phiếu thu nào." :rows="5" paginator>
                    <Column field="date" header="Ngày" style="width: 8rem">
                        <template #body="{ data }"><span class="text-sm">{{ formatDate(data.date) }}</span></template>
                    </Column>
                    <Column field="amount" header="Số tiền">
                        <template #body="{ data }"><span class="text-emerald-600 font-medium">{{ formatCurrency(data.amount) }}</span></template>
                    </Column>
                    <Column field="note" header="Ghi chú">
                        <template #body="{ data }"><span class="text-slate-500 text-sm">{{ data.note || '—' }}</span></template>
                    </Column>
                </DataTable>
            </div>

            <!-- Expenses -->
            <div>
                <h4 class="font-bold text-slate-700 mb-2 flex items-center gap-2"><i class="pi pi-arrow-up text-red-500"></i> Phiếu chi ({{ detailProject.expenses?.length || 0 }})</h4>
                <DataTable :value="detailProject.expenses" class="p-datatable-sm" stripedRows emptyMessage="Chưa có phiếu chi nào." :rows="5" paginator>
                    <Column field="date" header="Ngày" style="width: 8rem">
                        <template #body="{ data }"><span class="text-sm">{{ formatDate(data.date) }}</span></template>
                    </Column>
                    <Column field="type" header="Loại" style="width: 6rem">
                        <template #body="{ data }"><Tag :severity="data.type === 'material' ? 'warn' : 'info'" :value="data.type === 'material' ? 'Vật tư' : 'Nhân công'" /></template>
                    </Column>
                    <Column field="amount" header="Số tiền">
                        <template #body="{ data }"><span class="text-red-500 font-medium">{{ formatCurrency(data.amount) }}</span></template>
                    </Column>
                    <Column field="note" header="Ghi chú">
                        <template #body="{ data }"><span class="text-slate-500 text-sm">{{ data.note || '—' }}</span></template>
                    </Column>
                </DataTable>
            </div>

            <!-- Contracts -->
            <div>
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-bold text-slate-700 flex items-center gap-2"><i class="pi pi-file-pdf text-blue-500"></i> Hợp đồng ({{ contracts.length || 0 }})</h4>
                    <Button v-if="canUploadContract" icon="pi pi-upload" label="Upload HĐ" size="small" @click="showContractUpload = true" />
                </div>
                <DataTable :value="contracts" class="p-datatable-sm" stripedRows emptyMessage="Chưa có hợp đồng nào.">
                    <Column field="file_name" header="Tên file">
                        <template #body="{ data }">
                            <a :href="data.drive_url" target="_blank" class="text-primary-600 hover:underline flex items-center gap-2">
                                <i :class="getFileIcon(data.file_type)"></i>
                                {{ data.file_name }}
                            </a>
                        </template>
                    </Column>
                    <Column field="file_type" header="Loại" style="width: 5rem">
                        <template #body="{ data }"><Tag :severity="getFileTypeSeverity(data.file_type)" :value="data.file_type.toUpperCase()" /></template>
                    </Column>
                    <Column field="file_size" header="Size" style="width: 6rem">
                        <template #body="{ data }"><span class="text-slate-500 text-sm">{{ formatFileSize(data.file_size) }}</span></template>
                    </Column>
                    <Column field="uploaded_by_name" header="Người upload" style="width: 10rem">
                        <template #body="{ data }"><span class="text-slate-600">{{ data.uploaded_by_name }}</span></template>
                    </Column>
                    <Column field="created_at" header="Ngày" style="width: 8rem">
                        <template #body="{ data }"><span class="text-sm text-slate-500">{{ formatDate(data.created_at) }}</span></template>
                    </Column>
                    <Column header="" style="width: 3rem" v-if="isAdmin">
                        <template #body="{ data }">
                            <Button icon="pi pi-trash" outlined rounded severity="danger" size="small" @click="deleteContract(data)" />
                        </template>
                    </Column>
                </DataTable>
            </div>

            <!-- Tasks -->
            <div>
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-bold text-slate-700 flex items-center gap-2"><i class="pi pi-list-check text-purple-500"></i> Công việc ({{ projectTasks.length || 0 }})</h4>
                    <Button v-if="canManageTasks" icon="pi pi-plus" label="Thêm" size="small" @click="openTaskDialog" />
                </div>
                <DataTable :value="projectTasks" class="p-datatable-sm" stripedRows emptyMessage="Chưa có công việc nào.">
                    <Column field="title" header="Công việc">
                        <template #body="{ data }">
                            <div class="flex items-center gap-2">
                                <span class="font-medium">{{ data.title }}</span>
                                <Tag :severity="getTaskPrioritySeverity(data.priority)" :value="getTaskPriorityLabel(data.priority)" class="text-xs" />
                            </div>
                        </template>
                    </Column>
                    <Column field="type" header="Loại" style="width: 8rem">
                        <template #body="{ data }"><Tag :severity="getTaskTypeSeverity(data.type)" :value="getTaskTypeLabel(data.type)" /></template>
                    </Column>
                    <Column field="status" header="Trạng thái" style="width: 8rem">
                        <template #body="{ data }"><Tag :severity="getTaskStatusSeverity(data.status)" :value="getTaskStatusLabel(data.status)" /></template>
                    </Column>
                    <Column field="assignee_name" header="Người phụ trách" style="width: 10rem">
                        <template #body="{ data }"><span class="text-slate-600">{{ data.assignee_name || '—' }}</span></template>
                    </Column>
                    <Column field="deadline" header="Hạn" style="width: 8rem">
                        <template #body="{ data }">
                            <span v-if="data.deadline" :class="isTaskOverdue(data.deadline, data.status) ? 'text-red-500 font-medium' : 'text-slate-500'">
                                {{ formatDate(data.deadline) }}
                            </span>
                            <span v-else class="text-slate-400">—</span>
                        </template>
                    </Column>
                    <Column field="total_expense" header="Chi phí" style="width: 8rem">
                        <template #body="{ data }">
                            <span v-if="data.total_expense" class="text-red-500 font-medium">{{ formatCurrency(data.total_expense) }}</span>
                            <span v-else class="text-slate-400">—</span>
                        </template>
                    </Column>
                    <Column header="" style="width: 9rem" v-if="canManageTasks">
                        <template #body="{ data }">
                            <Button icon="pi pi-wallet" outlined rounded severity="warn" size="small" class="mr-1" v-tooltip.top="'Thêm chi phí'" @click="openTaskExpense(data)" />
                            <Button icon="pi pi-pencil" outlined rounded severity="info" size="small" class="mr-1" @click="editTask(data)" />
                            <Button v-if="isAdmin" icon="pi pi-trash" outlined rounded severity="danger" size="small" @click="deleteTask(data)" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </Dialog>

    <!-- Contract Upload Dialog -->
    <Dialog v-model:visible="showContractUpload" :style="{ width: '450px' }" header="Upload Hợp Đồng" :modal="true">
        <div class="flex flex-col gap-4 mt-4">
            <div class="flex flex-col gap-2">
                <label class="font-medium text-slate-700">Chọn file (PDF, DOC, DOCX - max 20MB)</label>
                <FileUpload
                    mode="advanced"
                    :maxFileSize="20000000"
                    accept=".pdf,.doc,.docx"
                    :auto="true"
                    chooseLabel="Chọn file"
                    @select="onContractFileSelect"
                >
                    <template #empty>
                        <p class="text-slate-500 text-sm">Kéo thả file hoặc click để chọn</p>
                    </template>
                </FileUpload>
            </div>
            <div class="flex flex-col gap-1">
                <label class="font-medium text-slate-700">Ghi chú</label>
                <Textarea v-model="contractNote" rows="2" placeholder="Nhập ghi chú (tùy chọn)" />
            </div>
        </div>
        <template #footer>
            <Button label="Hủy" icon="pi pi-times" text @click="showContractUpload = false" />
            <Button label="Upload" icon="pi pi-upload" :loading="uploadingContract" :disabled="!selectedContractFile" @click="uploadContract" />
        </template>
    </Dialog>

    <!-- Task Dialog -->
    <Dialog v-model:visible="showTaskDialog" :style="{ width: '500px' }" :header="taskDialogTitle" :modal="true" class="p-fluid">
        <div class="flex flex-col gap-4 mt-4">
            <div class="flex flex-col gap-1">
                <label class="font-medium text-slate-700">Tiêu đề *</label>
                <InputText v-model="taskForm.title" required :invalid="taskSubmitted && !taskForm.title" />
            </div>
            <div class="flex flex-col gap-1">
                <label class="font-medium text-slate-700">Mô tả</label>
                <Textarea v-model="taskForm.description" rows="2" />
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1">
                    <label class="font-medium text-slate-700">Loại</label>
                    <Dropdown v-model="taskForm.type" :options="taskTypes" optionLabel="label" optionValue="value" />
                </div>
                <div class="flex flex-col gap-1">
                    <label class="font-medium text-slate-700">Ưu tiên</label>
                    <Dropdown v-model="taskForm.priority" :options="taskPriorities" optionLabel="label" optionValue="value" />
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1">
                    <label class="font-medium text-slate-700">Người phụ trách</label>
                    <Dropdown v-model="taskForm.assignee_id" :options="allUsers" optionLabel="name" optionValue="id" placeholder="Chọn người" showClear />
                </div>
                <div class="flex flex-col gap-1">
                    <label class="font-medium text-slate-700">Hạn hoàn thành</label>
                    <CustomCalendar v-model="taskForm.deadline" dateFormat="dd/mm/yy" :showIcon="true" />
                </div>
            </div>
        </div>
        <template #footer>
            <Button label="Hủy" icon="pi pi-times" text @click="showTaskDialog = false" />
            <Button label="Lưu" icon="pi pi-check" :loading="savingTask" @click="saveTask" />
        </template>
    </Dialog>

    <!-- Task Expense Dialog -->
    <Dialog v-model:visible="showTaskExpenseDialog" :style="{ width: '500px' }" :header="'Chi phí: ' + (taskExpenseTarget?.title || '')" :modal="true" class="p-fluid">
        <div class="flex flex-col gap-4 mt-4">
            <div v-if="taskExpenseTarget?.expenses?.length > 0" class="mb-2">
                <h5 class="text-sm font-medium text-slate-600 mb-2">Chi phí đã có:</h5>
                <div class="space-y-2">
                    <div v-for="exp in taskExpenseTarget.expenses" :key="exp.id" class="flex justify-between items-center p-2 bg-slate-50 rounded border">
                        <div>
                            <Tag :severity="exp.type === 'material' ? 'warn' : 'info'" :value="exp.type === 'material' ? 'Vật tư' : 'Nhân công'" class="text-xs" />
                            <span class="text-sm text-slate-600 ml-2">{{ exp.note || '—' }}</span>
                        </div>
                        <span class="text-red-500 font-medium text-sm">{{ formatCurrency(exp.amount) }}</span>
                    </div>
                </div>
                <div class="flex justify-end mt-2 pt-2 border-t">
                    <span class="font-bold text-slate-700">Tổng: {{ formatCurrency(taskExpenseTarget.total_expense || 0) }}</span>
                </div>
            </div>
            <div class="border-t pt-4">
                <h5 class="font-medium text-slate-700 mb-3">Thêm chi phí mới</h5>
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="font-medium text-slate-700">Loại *</label>
                        <Dropdown v-model="taskExpenseForm.type" :options="expenseTypes" optionLabel="label" optionValue="value" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="font-medium text-slate-700">Số tiền *</label>
                        <InputNumber v-model="taskExpenseForm.amount" mode="currency" currency="VND" locale="vi-VN" :invalid="taskExpenseSubmitted && !taskExpenseForm.amount" />
                    </div>
                </div>
                <div class="flex flex-col gap-1 mt-3">
                    <label class="font-medium text-slate-700">Ghi chú</label>
                    <InputText v-model="taskExpenseForm.note" placeholder="Ghi chú chi phí..." />
                </div>
            </div>
        </div>
        <template #footer>
            <Button label="Đóng" icon="pi pi-times" text @click="showTaskExpenseDialog = false" />
            <Button label="Thêm chi phí" icon="pi pi-plus" :loading="savingTaskExpense" @click="saveTaskExpense" />
        </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const { user: currentUser } = useAuth()
const isAdmin = computed(() => currentUser.value?.role === 'Admin')
const isDesign = computed(() => currentUser.value?.role === 'Design')
const isConstruction = computed(() => currentUser.value?.role === 'Construction')
const canUploadContract = computed(() => ['Admin', 'Sale'].includes(currentUser.value?.role))
const canViewFinance = computed(() => ['Admin', 'Sale'].includes(currentUser.value?.role))

const searchQuery = ref('');
const filterDate = ref(null);
const selectedStatuses = ref([]);
const selectedProjects = ref([]);
const loading = ref(false);
const submitted = ref(false);
const productDialog = ref(false);
const dialogTitle = ref('Chi Tiết Công Trình');
const detailDialog = ref(false);
const detailProject = ref(null);
const detailLoading = ref(false);

// Contract state
const contracts = ref([])
const showContractUpload = ref(false)
const selectedContractFile = ref(null)
const contractNote = ref('')
const uploadingContract = ref(false)

// Task state
const projectTasks = ref([])
const showTaskDialog = ref(false)
const taskDialogTitle = ref('Thêm Công Việc')
const taskForm = ref({
    id: null,
    title: '',
    description: '',
    type: 'construction',
    priority: 'medium',
    assignee_id: null,
    deadline: null
})
const taskSubmitted = ref(false)
const savingTask = ref(false)
const { data: allUsers } = await useFetch('/api/users', { default: () => [] })

// Task Expense state
const showTaskExpenseDialog = ref(false)
const taskExpenseTarget = ref(null)
const taskExpenseForm = ref({ type: 'material', amount: null, note: '' })
const taskExpenseSubmitted = ref(false)
const savingTaskExpense = ref(false)
const expenseTypes = [
    { label: 'Vật tư', value: 'material' },
    { label: 'Nhân công', value: 'labor' }
]

const taskTypes = [
    { label: 'Thiết kế', value: 'design' },
    { label: 'Thi công', value: 'construction' },
    { label: 'Kiểm tra', value: 'inspection' },
    { label: 'Khác', value: 'other' }
]

const taskPriorities = [
    { label: 'Thấp', value: 'low' },
    { label: 'Trung bình', value: 'medium' },
    { label: 'Cao', value: 'high' },
    { label: 'Gấp', value: 'urgent' }
]

const canManageTasks = computed(() => ['Admin', 'Sale', 'Design', 'Construction'].includes(currentUser.value?.role))

const emptyProject = {
    id: null,
    name: '',
    customer_id: null,
    contract_value: null,
    status: 'đang thi công',
    start_date: null,
    note: ''
};
const project = ref({ ...emptyProject });
const showNewCustomer = ref(false);
const newCustomerName = ref('');
const creatingCustomer = ref(false);

const statuses = ref([
    { label: 'Đang thi công', value: 'đang thi công' },
    { label: 'Tạm dừng', value: 'tạm dừng' },
    { label: 'Đã hoàn thành', value: 'đã hoàn thành' }
]);

// Fetch Data from Server
const { data: projects, refresh } = await useFetch('/api/projects', { default: () => [] });
const { data: customers, refresh: refreshCustomers } = await useFetch('/api/customers', { default: () => [] });

const createQuickCustomer = async () => {
    if (!newCustomerName.value.trim()) return;
    creatingCustomer.value = true;
    try {
        const newC = await $fetch('/api/customers', { method: 'POST', body: { name: newCustomerName.value } });
        await refreshCustomers();
        project.value.customer_id = newC.id;
        newCustomerName.value = '';
        showNewCustomer.value = false;
    } catch (e) {
        console.error(e);
    } finally {
        creatingCustomer.value = false;
    }
};

const filteredProjects = computed(() => {
    let result = projects.value;

    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        result = result.filter(p => p.name.toLowerCase().includes(q) || (p.customer_name && p.customer_name.toLowerCase().includes(q)));
    }

    if (selectedStatuses.value.length) {
        result = result.filter(p => selectedStatuses.value.includes(p.status));
    }

    if (filterDate.value && filterDate.value.length === 2 && filterDate.value[0]) {
        const start = new Date(filterDate.value[0]);
        start.setHours(0, 0, 0, 0);
        let end = filterDate.value[1] ? new Date(filterDate.value[1]) : new Date(filterDate.value[0]);
        end.setHours(23, 59, 59, 999);
        result = result.filter(r => {
            if (!r.start_date) return false;
            const rDate = new Date(r.start_date);
            return rDate >= start && rDate <= end;
        });
    }

    return result;
});

const formatCurrency = (value) => {
    return value != null ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value) : '0 ₫';
};

const formatDate = (value) => {
    return value ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) : '';
};

const getStatusSeverity = (status) => {
    switch (status) {
        case 'đang thi công': return 'success';
        case 'tạm dừng': return 'warn';
        case 'đã hoàn thành': return 'info';
        default: return null;
    }
};

const exportSelectedProjects = async () => {
    if (!selectedProjects.value.length || !import.meta.client) return;

    const XLSX = await import('xlsx');
    const rows = selectedProjects.value.map((item, index) => ({
        'STT': index + 1,
        'Tên công trình': item.name,
        'Khách hàng': item.customer_name || '',
        'Giá trị hợp đồng': item.contract_value || 0,
        'Đã thu': item.total_received || 0,
        'Đã chi': item.total_spent || 0,
        'Trạng thái': item.status || '',
        'Ngày bắt đầu': formatDate(item.start_date),
        'Ghi chú': item.note || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CongTrinh');
    XLSX.writeFile(workbook, `cong-trinh-${new Date().toISOString().slice(0, 10)}.xlsx`);
};

const detailTotalReceived = computed(() => detailProject.value?.receipts?.reduce((s, r) => s + (r.amount || 0), 0) || 0);
const detailTotalSpent = computed(() => detailProject.value?.expenses?.reduce((s, e) => s + (e.amount || 0), 0) || 0);

const viewDetail = async (data) => {
    detailDialog.value = true;
    detailLoading.value = true;
    detailProject.value = null;
    contracts.value = [];
    projectTasks.value = [];
    try {
        detailProject.value = await $fetch(`/api/projects/${data.id}`);
        await Promise.all([
            loadContracts(data.id),
            loadTasks(data.id)
        ]);
    } catch (e) {
        console.error(e);
    } finally {
        detailLoading.value = false;
    }
};

const openNew = () => {
    project.value = { ...emptyProject };
    submitted.value = false;
    showNewCustomer.value = false;
    dialogTitle.value = 'Thêm Công Trình Mới';
    productDialog.value = true;
};

const hideDialog = () => {
    productDialog.value = false;
    submitted.value = false;
};

const editProject = (prod) => {
    project.value = { 
        ...prod,
        start_date: prod.start_date ? new Date(prod.start_date) : null,
        contract_value: Number(prod.contract_value) || null
    };
    showNewCustomer.value = false;
    dialogTitle.value = 'Sửa Công Trình';
    productDialog.value = true;
};

const confirmDeleteProject = async (prod) => {
    if (confirm(`Bạn có chắc chắn muốn xóa công trình "${prod.name}"? Dữ liệu không thể khôi phục.`)) {
        try {
            await $fetch(`/api/projects/${prod.id}`, { method: 'DELETE' });
            await refresh();
        } catch (e) {
            console.error("Lỗi khi xóa:", e);
        }
    }
};

const saveProject = async () => {
    submitted.value = true;
    if (project.value.name?.trim() && project.value.contract_value) {
        loading.value = true;
        try {
            if (project.value.id) {
                await $fetch(`/api/projects/${project.value.id}`, {
                    method: 'PUT',
                    body: project.value
                });
            } else {
                await $fetch('/api/projects', {
                    method: 'POST',
                    body: project.value
                });
            }
            await refresh();
            productDialog.value = false;
            project.value = { ...emptyProject };
        } catch (e) {
            console.error("Lỗi khi lưu:", e);
        } finally {
            loading.value = false;
        }
    }
};

// Contract functions
const loadContracts = async (projectId) => {
    try {
        contracts.value = await $fetch(`/api/contracts?project_id=${projectId}`)
    } catch (e) {
        console.error('Error loading contracts:', e)
        contracts.value = []
    }
}

const onContractFileSelect = (event) => {
    if (event.files && event.files.length > 0) {
        selectedContractFile.value = event.files[0]
    }
}

const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const getFileIcon = (fileType) => {
    switch (fileType) {
        case 'pdf': return 'pi pi-file-pdf text-red-500'
        case 'doc': return 'pi pi-file-word text-blue-500'
        case 'docx': return 'pi pi-file-word text-blue-500'
        default: return 'pi pi-file text-slate-500'
    }
}

const getFileTypeSeverity = (fileType) => {
    switch (fileType) {
        case 'pdf': return 'danger'
        case 'doc': return 'info'
        case 'docx': return 'info'
        default: return 'secondary'
    }
}

const uploadContract = async () => {
    if (!selectedContractFile.value || !detailProject.value?.id) return
    
    uploadingContract.value = true
    try {
        const formData = new FormData()
        formData.append('file', selectedContractFile.value)
        formData.append('note', contractNote.value)
        
        await $fetch(`/api/contracts?project_id=${detailProject.value.id}&note=${encodeURIComponent(contractNote.value)}`, {
            method: 'POST',
            body: formData
        })
        
        await loadContracts(detailProject.value.id)
        showContractUpload.value = false
        selectedContractFile.value = null
        contractNote.value = ''
    } catch (e) {
        console.error('Error uploading contract:', e)
        alert('Upload thất bại: ' + (e.data?.message || e.message))
    } finally {
        uploadingContract.value = false
    }
}

const deleteContract = async (contract) => {
    if (!confirm(`Xóa hợp đồng "${contract.file_name}"?`)) return
    
    try {
        await $fetch(`/api/contracts/${contract.id}`, { method: 'DELETE' })
        await loadContracts(detailProject.value.id)
    } catch (e) {
        console.error('Error deleting contract:', e)
    }
}

// Task functions
const loadTasks = async (projectId) => {
    try {
        projectTasks.value = await $fetch(`/api/tasks?project_id=${projectId}`)
    } catch (e) {
        console.error('Error loading tasks:', e)
        projectTasks.value = []
    }
}

const openTaskDialog = () => {
    taskForm.value = {
        id: null,
        title: '',
        description: '',
        type: 'construction',
        priority: 'medium',
        assignee_id: null,
        deadline: null
    }
    taskSubmitted.value = false
    taskDialogTitle.value = 'Thêm Công Việc'
    showTaskDialog.value = true
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
    taskSubmitted.value = false
    taskDialogTitle.value = 'Sửa Công Việc'
    showTaskDialog.value = true
}

const saveTask = async () => {
    taskSubmitted.value = true
    if (!taskForm.value.title?.trim()) return
    
    savingTask.value = true
    try {
        const payload = {
            project_id: detailProject.value.id,
            title: taskForm.value.title,
            description: taskForm.value.description,
            type: taskForm.value.type,
            priority: taskForm.value.priority,
            assignee_id: taskForm.value.assignee_id,
            deadline: taskForm.value.deadline
        }
        
        if (taskForm.value.id) {
            await $fetch(`/api/tasks/${taskForm.value.id}`, {
                method: 'PUT',
                body: payload
            })
        } else {
            await $fetch('/api/tasks', {
                method: 'POST',
                body: payload
            })
        }
        
        await loadTasks(detailProject.value.id)
        showTaskDialog.value = false
    } catch (e) {
        console.error('Error saving task:', e)
    } finally {
        savingTask.value = false
    }
}

const deleteTask = async (task) => {
    if (!confirm(`Xóa công việc "${task.title}"?`)) return
    
    try {
        await $fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
        await loadTasks(detailProject.value.id)
    } catch (e) {
        console.error('Error deleting task:', e)
    }
}

const openTaskExpense = (task) => {
    taskExpenseTarget.value = task
    taskExpenseForm.value = { type: 'material', amount: null, note: '' }
    taskExpenseSubmitted.value = false
    showTaskExpenseDialog.value = true
}

const saveTaskExpense = async () => {
    taskExpenseSubmitted.value = true
    if (!taskExpenseForm.value.amount) return
    
    savingTaskExpense.value = true
    try {
        await $fetch('/api/expenses', {
            method: 'POST',
            body: {
                project_id: detailProject.value.id,
                task_id: taskExpenseTarget.value.id,
                type: taskExpenseForm.value.type,
                amount: taskExpenseForm.value.amount,
                note: taskExpenseForm.value.note
            }
        })
        
        // Reload tasks and project detail to refresh expense totals
        await Promise.all([
            loadTasks(detailProject.value.id),
            (async () => { detailProject.value = await $fetch(`/api/projects/${detailProject.value.id}`) })()
        ])
        
        // Update the target task in dialog with new data
        const updatedTask = projectTasks.value.find(t => t.id === taskExpenseTarget.value.id)
        if (updatedTask) taskExpenseTarget.value = updatedTask
        
        taskExpenseForm.value = { type: 'material', amount: null, note: '' }
        taskExpenseSubmitted.value = false
    } catch (e) {
        console.error('Error saving task expense:', e)
    } finally {
        savingTaskExpense.value = false
    }
}

const getTaskStatusSeverity = (status) => {
    const map = { pending: 'warn', in_progress: 'info', completed: 'success', cancelled: 'secondary' }
    return map[status] || 'info'
}

const getTaskStatusLabel = (status) => {
    const map = { pending: 'Đang chờ', in_progress: 'Đang làm', completed: 'Hoàn thành', cancelled: 'Đã hủy' }
    return map[status] || status
}

const getTaskPrioritySeverity = (priority) => {
    const map = { low: 'secondary', medium: 'info', high: 'warn', urgent: 'danger' }
    return map[priority] || 'info'
}

const getTaskPriorityLabel = (priority) => {
    const map = { low: 'Thấp', medium: 'TB', high: 'Cao', urgent: 'Gấp' }
    return map[priority] || priority
}

const getTaskTypeSeverity = (type) => {
    const map = { design: 'help', construction: 'warning', inspection: 'info', other: 'secondary' }
    return map[type] || 'secondary'
}

const getTaskTypeLabel = (type) => {
    const map = { design: 'Thiết kế', construction: 'Thi công', inspection: 'Kiểm tra', other: 'Khác' }
    return map[type] || type
}

const isTaskOverdue = (deadline, status) => {
    if (!deadline || status === 'completed') return false
    return new Date(deadline) < new Date()
}
</script>
