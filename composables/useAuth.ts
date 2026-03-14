export const useAuth = () => {
    // global state for user using Nuxt's useState
    const user = useState<any>('user', () => null);

    const checkAuth = async () => {
        try {
            const data = await $fetch('/api/auth/me');
            user.value = data.user;
        } catch (error) {
            user.value = null; // Token không hợp lệ hoặc hết hạn
        }
    };

    const logout = async () => {
        try {
            await $fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error(e)
        }
        user.value = null;
        navigateTo('/login');
    };

    return {
        user,
        checkAuth,
        logout
    };
};
