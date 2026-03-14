<template>
  <div class="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center text-primary-600 text-5xl">
        <i class="pi pi-building"></i>
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-slate-900">
        Nhat Nam Manager
      </h2>
      <p class="mt-2 text-center text-sm text-slate-600">
        Hệ thống quản lý công trình nội bộ
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100">
        <form class="space-y-6" @submit.prevent="handleLogin">
          
          <div v-if="errorMsg" class="p-3 bg-red-50 text-red-600 rounded-md text-sm font-medium flex items-center gap-2">
            <i class="pi pi-exclamation-triangle"></i>
            {{ errorMsg }}
          </div>

          <div>
            <label for="username" class="block text-sm font-medium text-slate-700">Tên đăng nhập</label>
            <div class="mt-1">
              <InputText id="username" v-model="username" type="text" autocomplete="username" class="w-full" required placeholder="Nhập tên đăng nhập" :disabled="loading" />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-700">Mật khẩu</label>
            <div class="mt-1">
              <Password id="password" v-model="password" class="w-full" :inputStyle="{ width: '100%' }" required :feedback="false" toggleMask placeholder="Nhập mật khẩu" :disabled="loading" />
            </div>
          </div>

          <div>
            <Button type="submit" :loading="loading" label="Đăng nhập" class="w-full py-3" size="large" />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '~/composables/useAuth';

definePageMeta({
  layout: false // Override to not use the default sidebar layout
});

const username = ref('');
const password = ref('');
const errorMsg = ref('');
const loading = ref(false);

const { user, checkAuth } = useAuth();
const router = useRouter();

const handleLogin = async () => {
    loading.value = true;
    errorMsg.value = '';

    try {
        const res = await $fetch('/api/auth/login', {
            method: 'POST',
            body: {
                username: username.value,
                password: password.value
            }
        });
        
        // After successful API call, cookie is set. Fetch user into state.
        await checkAuth();

        if (user.value) {
            router.push('/');
        }
    } catch (e) {
        if (e.data && e.data.statusMessage) {
            errorMsg.value = e.data.statusMessage;
        } else {
            errorMsg.value = "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
        }
    } finally {
        loading.value = false;
    }
}
</script>
