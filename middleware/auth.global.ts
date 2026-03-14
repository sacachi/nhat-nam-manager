export default defineNuxtRouteMiddleware(async (to, from) => {
    // Không chạy middleware auth trên server trong lúc pre-render để tránh lỗi cookie
    if (import.meta.server) return;

    const { user, checkAuth } = useAuth();
    
    // Nếu chưa load user (mới F5), gọi cookie để lấy user
    if (!user.value) {
        await checkAuth();
    }

    const isAuthenticated = !!user.value;

    // Chặn người lạ không đăng nhập
    if (!isAuthenticated && to.path !== '/login') {
        return navigateTo('/login');
    }

    // Đã đăng nhập nhưng lại vào /login thì văng ra Dashboard
    if (isAuthenticated && to.path === '/login') {
        return navigateTo('/');
    }
});
