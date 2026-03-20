<template>
  <div class="space-y-6">
    <!-- Header Controls -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <div class="relative w-full sm:w-64">
        <IconField iconPosition="left">
            <InputIcon class="pi pi-search"> </InputIcon>
            <InputText v-model="searchQuery" placeholder="Tìm kiếm nhân sự..." class="w-full pl-10" />
        </IconField>
      </div>
      <div class="flex gap-2 w-full sm:w-auto">
        <Button icon="pi pi-file-excel" label="Thêm hàng loạt" class="p-button-success" outlined @click="bulkImportVisible = true" />
        <Button icon="pi pi-user-plus" label="Thêm Nhân Sự" class="p-button-primary shadow-sm" @click="openNew" />
      </div>
    </div>

    <BulkImportDialog v-model="bulkImportVisible" entityLabel="Nhân Sự" apiEndpoint="/api/users" :columns="bulkColumns" @imported="refresh" />

    <!-- Data Table -->
    <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <DataTable :value="filteredUsers" paginator :rows="10" :rowsPerPageOptions="[10, 20, 50]" 
        responsiveLayout="scroll" class="p-datatable-sm" hoverRole stripedRows emptyMessage="Không tìm thấy dữ liệu.">
        
        <Column field="name" header="Họ Tên" sortable style="min-width: 14rem">
          <template #body="{ data }">
             <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                    {{ data.name.charAt(0).toUpperCase() }}
                </div>
                <div class="flex flex-col">
                    <span class="font-medium text-slate-800">{{ data.name }}</span>
                    <span class="text-xs text-slate-500">{{ data.email }}</span>
                </div>
             </div>
          </template>
        </Column>

        <Column field="username" header="Tên đăng nhập" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="text-slate-600">@{{ data.username }}</span>
          </template>
        </Column>

        <Column field="role" header="Phân quyền (Role)" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <Tag :severity="getRoleSeverity(data.role)" :value="data.role"></Tag>
          </template>
        </Column>

        <Column field="status" header="Trạng thái" sortable style="min-width: 8rem">
          <template #body="{ data }">
            <Tag :severity="data.status === 'active' ? 'success' : 'danger'" :value="data.status === 'active' ? 'Hoạt động' : 'Đã khóa'"></Tag>
          </template>
        </Column>

        <Column header="Thao tác" :exportable="false" style="min-width: 8rem">
            <template #body="{ data }">
                <Button icon="pi pi-pencil" outlined rounded severity="info" class="mr-2" @click="editUser(data)" />
                <Button icon="pi pi-lock" outlined rounded severity="warning" @click="toggleStatus(data)" v-if="data.status === 'active'" />
                <Button icon="pi pi-unlock" outlined rounded severity="success" @click="toggleStatus(data)" v-if="data.status === 'inactive'" />
            </template>
        </Column>
      </DataTable>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:visible="userDialog" :style="{ width: '450px' }" :header="dialogTitle" :modal="true" class="p-fluid">
      <div class="flex flex-col gap-4 mt-4">
        <div class="flex flex-col gap-1">
            <label for="name" class="font-medium text-slate-700">Họ Tên *</label>
            <InputText id="name" v-model.trim="user.name" required="true" :invalid="submitted && !user.name" />
            <small class="p-error text-red-500" v-if="submitted && !user.name">Họ tên là bắt buộc.</small>
        </div>

        <div class="flex flex-col gap-1">
            <label for="username" class="font-medium text-slate-700">Tên đăng nhập *</label>
            <InputText id="username" v-model.trim="user.username" required="true" :disabled="!!user.id" :invalid="submitted && !user.username" />
             <small class="p-error text-red-500" v-if="submitted && !user.username">Tên đăng nhập là bắt buộc.</small>
        </div>

         <div class="flex flex-col gap-1">
            <label for="email" class="font-medium text-slate-700">Email *</label>
            <InputText id="email" type="email" v-model.trim="user.email" required="true" :invalid="submitted && !user.email" />
             <small class="p-error text-red-500" v-if="submitted && !user.email">Email là bắt buộc.</small>
        </div>

        <div class="flex flex-col gap-1" v-if="!user.id">
            <label for="password" class="font-medium text-slate-700">Mật khẩu *</label>
            <Password id="password" v-model="user.password" required="true" toggleMask :feedback="false" :invalid="submitted && !user.password" />
            <small class="p-error text-red-500" v-if="submitted && !user.password">Mật khẩu là bắt buộc.</small>
        </div>

        <div class="flex flex-col gap-1">
            <label for="role" class="font-medium text-slate-700">Phân quyền</label>
            <Dropdown id="role" v-model="user.role" :options="roles" optionLabel="label" optionValue="value" placeholder="Chọn quyền" />
        </div>
      </div>

      <template #footer>
          <Button label="Hủy" icon="pi pi-times" text @click="hideDialog" class="text-slate-600" />
          <Button label="Lưu" icon="pi pi-check" :loading="loading" @click="saveUser" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const searchQuery = ref('');
const loading = ref(false);
const submitted = ref(false);
const userDialog = ref(false);
const dialogTitle = ref('Tài khoản Nhân sự');
const bulkImportVisible = ref(false);

const roleOptions = [
    { label: 'Admin', value: 'Admin' },
    { label: 'Sale', value: 'Sale' },
    { label: 'Design', value: 'Design' },
    { label: 'Thi công', value: 'Construction' },
    { label: 'Kế toán', value: 'Accounting' }
];

const bulkColumns = [
  { field: 'name', header: 'Họ tên', required: true, width: '180px', excelFields: ['Tên', 'Họ tên', 'name'] },
  { field: 'username', header: 'Tên đăng nhập', required: true, width: '150px', excelFields: ['Username', 'Tên đăng nhập', 'Tài khoản', 'username'] },
  { field: 'email', header: 'Email', required: true, width: '200px', excelFields: ['email', 'Email'] },
  { field: 'password', header: 'Mật khẩu', required: true, width: '150px', excelFields: ['Mật khẩu', 'password', 'Password'] },
  { field: 'role', header: 'Phân quyền', type: 'select', options: roleOptions, width: '140px', excelFields: ['Quyền', 'Role', 'role'] }
];

const emptyUser = {
    id: null,
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'Staff',
    status: 'active'
};
const user = ref({ ...emptyUser });

const roles = ref([
    { label: 'Admin', value: 'Admin' },
    { label: 'Sale', value: 'Sale' },
    { label: 'Design', value: 'Design' },
    { label: 'Thi công', value: 'Construction' }
]);

// Fetch Data from Server
const { data: users, refresh } = await useFetch('/api/users', { default: () => [] });

const filteredUsers = computed(() => {
    return users.value.filter(u => 
       u.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
       u.username.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
       u.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

const getRoleSeverity = (role) => {
    switch (role) {
        case 'Admin': return 'danger';
        case 'Sale': return 'success';
        case 'Design': return 'info';
        case 'Construction': return 'warn';
        default: return null;
    }
};

const openNew = () => {
    user.value = { ...emptyUser };
    submitted.value = false;
    dialogTitle.value = 'Thêm Nhân Sự Mới';
    userDialog.value = true;
};

const hideDialog = () => {
    userDialog.value = false;
    submitted.value = false;
};

const editUser = (data) => {
    user.value = { ...data };
    dialogTitle.value = 'Sửa Thông Tin Nhân Sự';
    userDialog.value = true;
};

const toggleStatus = async (data) => {
    const newStatus = data.status === 'active' ? 'inactive' : 'active';
    try {
        await $fetch(`/api/users/${data.id}`, {
            method: 'PUT',
            body: { ...data, status: newStatus }
        });
        await refresh();
    } catch (e) {
        console.error("Lỗi cập nhật trạng thái:", e);
    }
};

const saveUser = async () => {
    submitted.value = true;
    if (user.value.name?.trim() && user.value.username?.trim() && user.value.email?.trim() && (user.value.id || user.value.password)) {
        loading.value = true;
        try {
            if (user.value.id) {
                // Remove password field so it doesn't get sent unnecessarily on update
                const payload = { ...user.value };
                delete payload.password;
                delete payload.username; // Usually we don't update username

                await $fetch(`/api/users/${user.value.id}`, {
                    method: 'PUT',
                    body: payload
                });
            } else {
                await $fetch('/api/users', {
                    method: 'POST',
                    body: user.value
                });
            }
            await refresh();
            userDialog.value = false;
            user.value = { ...emptyUser };
        } catch (e) {
            console.error("Lỗi khi lưu:", e);
        } finally {
            loading.value = false;
        }
    }
};
</script>
