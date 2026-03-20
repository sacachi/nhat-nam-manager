export default defineNuxtRouteMiddleware(async (to, from) => {
    if (import.meta.server) return;

    const { user, checkAuth } = useAuth();
    
    if (!user.value) {
        await checkAuth();
    }

    const isAuthenticated = !!user.value;
    const role = user.value?.role;

    if (!isAuthenticated && to.path !== '/login') {
        return navigateTo('/login');
    }

    if (isAuthenticated && to.path === '/login') {
        return navigateTo('/');
    }

    const restrictedRoutes = [
        { path: '/task-management', allowed: ['Admin'] },
        { path: '/receipts', allowed: ['Admin', 'Sale'] },
        { path: '/expenses', allowed: ['Admin', 'Construction'] },
        { path: '/reports', allowed: ['Admin'] },
        { path: '/performance', allowed: ['Admin'] },
        { path: '/users', allowed: ['Admin'] },
        { path: '/logs', allowed: ['Admin'] },
        { path: '/customer-leads', allowed: ['Admin', 'Sale'] },
        { path: '/projects', allowed: ['Admin', 'Sale', 'Design', 'Construction'] },
    ];

    for (const route of restrictedRoutes) {
        if (to.path.startsWith(route.path)) {
            if (!route.allowed.includes(role)) {
                return navigateTo('/');
            }
            break;
        }
    }

    if (isAuthenticated && to.path === '/design-workspace') {
        return navigateTo('/my-tasks');
    }
});
