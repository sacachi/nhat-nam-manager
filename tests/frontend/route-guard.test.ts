import { describe, it, expect } from 'vitest'

/**
 * Test route guard middleware (auth.global.ts) logic.
 * Verifies the restrictedRoutes access matrix for all roles.
 */

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
]

function checkAccess(path: string, role: string | null): 'allow' | 'redirect-login' | 'redirect-home' | 'redirect-mytasks' {
  // Not authenticated
  if (!role) {
    if (path === '/login') return 'allow'
    return 'redirect-login'
  }

  // Authenticated but on login page
  if (path === '/login') return 'redirect-home'

  // Design workspace redirect
  if (path === '/design-workspace') return 'redirect-mytasks'

  // Check restricted routes
  for (const route of restrictedRoutes) {
    if (path.startsWith(route.path)) {
      if (!route.allowed.includes(role)) {
        return 'redirect-home'
      }
      break
    }
  }

  return 'allow'
}

describe('Route Guard — Unauthenticated', () => {
  it('/projects → redirect to login', () => {
    expect(checkAccess('/projects', null)).toBe('redirect-login')
  })

  it('/users → redirect to login', () => {
    expect(checkAccess('/users', null)).toBe('redirect-login')
  })

  it('/login → allow', () => {
    expect(checkAccess('/login', null)).toBe('allow')
  })

  it('/ → redirect to login', () => {
    expect(checkAccess('/', null)).toBe('redirect-login')
  })
})

describe('Route Guard — Authenticated on /login', () => {
  it('Admin on /login → redirect home', () => {
    expect(checkAccess('/login', 'Admin')).toBe('redirect-home')
  })

  it('Sale on /login → redirect home', () => {
    expect(checkAccess('/login', 'Sale')).toBe('redirect-home')
  })
})

describe('Route Guard — /design-workspace redirect', () => {
  it('Admin → /my-tasks', () => {
    expect(checkAccess('/design-workspace', 'Admin')).toBe('redirect-mytasks')
  })

  it('Design → /my-tasks', () => {
    expect(checkAccess('/design-workspace', 'Design')).toBe('redirect-mytasks')
  })
})

describe('Route Guard — /task-management (Admin only)', () => {
  it('Admin → allow', () => {
    expect(checkAccess('/task-management', 'Admin')).toBe('allow')
  })

  it('Sale → redirect home', () => {
    expect(checkAccess('/task-management', 'Sale')).toBe('redirect-home')
  })

  it('Design → redirect home', () => {
    expect(checkAccess('/task-management', 'Design')).toBe('redirect-home')
  })

  it('Construction → redirect home', () => {
    expect(checkAccess('/task-management', 'Construction')).toBe('redirect-home')
  })
})

describe('Route Guard — /receipts (Admin, Sale)', () => {
  it('Admin → allow', () => {
    expect(checkAccess('/receipts', 'Admin')).toBe('allow')
  })

  it('Sale → allow', () => {
    expect(checkAccess('/receipts', 'Sale')).toBe('allow')
  })

  it('Design → redirect home', () => {
    expect(checkAccess('/receipts', 'Design')).toBe('redirect-home')
  })

  it('Construction → redirect home', () => {
    expect(checkAccess('/receipts', 'Construction')).toBe('redirect-home')
  })
})

describe('Route Guard — /expenses (Admin, Construction)', () => {
  it('Admin → allow', () => {
    expect(checkAccess('/expenses', 'Admin')).toBe('allow')
  })

  it('Construction → allow', () => {
    expect(checkAccess('/expenses', 'Construction')).toBe('allow')
  })

  it('Sale → redirect home', () => {
    expect(checkAccess('/expenses', 'Sale')).toBe('redirect-home')
  })

  it('Design → redirect home', () => {
    expect(checkAccess('/expenses', 'Design')).toBe('redirect-home')
  })
})

describe('Route Guard — /reports (Admin only)', () => {
  it('Admin → allow', () => {
    expect(checkAccess('/reports', 'Admin')).toBe('allow')
  })

  it('Sale → redirect home', () => {
    expect(checkAccess('/reports', 'Sale')).toBe('redirect-home')
  })

  it('Design → redirect home', () => {
    expect(checkAccess('/reports', 'Design')).toBe('redirect-home')
  })
})

describe('Route Guard — /performance (Admin only)', () => {
  it('Admin → allow', () => {
    expect(checkAccess('/performance', 'Admin')).toBe('allow')
  })

  it('Design → redirect home', () => {
    expect(checkAccess('/performance', 'Design')).toBe('redirect-home')
  })
})

describe('Route Guard — /users (Admin only)', () => {
  it('Admin → allow', () => {
    expect(checkAccess('/users', 'Admin')).toBe('allow')
  })

  it('Sale → redirect home', () => {
    expect(checkAccess('/users', 'Sale')).toBe('redirect-home')
  })

  it('Design → redirect home', () => {
    expect(checkAccess('/users', 'Design')).toBe('redirect-home')
  })

  it('Construction → redirect home', () => {
    expect(checkAccess('/users', 'Construction')).toBe('redirect-home')
  })
})

describe('Route Guard — /logs (Admin only)', () => {
  it('Admin → allow', () => {
    expect(checkAccess('/logs', 'Admin')).toBe('allow')
  })

  it('Sale → redirect home', () => {
    expect(checkAccess('/logs', 'Sale')).toBe('redirect-home')
  })
})

describe('Route Guard — /customer-leads (Admin, Sale)', () => {
  it('Admin → allow', () => {
    expect(checkAccess('/customer-leads', 'Admin')).toBe('allow')
  })

  it('Sale → allow', () => {
    expect(checkAccess('/customer-leads', 'Sale')).toBe('allow')
  })

  it('Design → redirect home', () => {
    expect(checkAccess('/customer-leads', 'Design')).toBe('redirect-home')
  })

  it('Construction → redirect home', () => {
    expect(checkAccess('/customer-leads', 'Construction')).toBe('redirect-home')
  })
})

describe('Route Guard — /projects (All roles)', () => {
  it('Admin → allow', () => {
    expect(checkAccess('/projects', 'Admin')).toBe('allow')
  })

  it('Sale → allow', () => {
    expect(checkAccess('/projects', 'Sale')).toBe('allow')
  })

  it('Design → allow', () => {
    expect(checkAccess('/projects', 'Design')).toBe('allow')
  })

  it('Construction → allow', () => {
    expect(checkAccess('/projects', 'Construction')).toBe('allow')
  })
})

describe('Route Guard — Unrestricted routes', () => {
  it('/ (dashboard) → allow for all roles', () => {
    expect(checkAccess('/', 'Admin')).toBe('allow')
    expect(checkAccess('/', 'Sale')).toBe('allow')
    expect(checkAccess('/', 'Design')).toBe('allow')
    expect(checkAccess('/', 'Construction')).toBe('allow')
  })

  it('/my-tasks → allow for all roles', () => {
    expect(checkAccess('/my-tasks', 'Admin')).toBe('allow')
    expect(checkAccess('/my-tasks', 'Design')).toBe('allow')
    expect(checkAccess('/my-tasks', 'Construction')).toBe('allow')
  })

  it('/notifications → allow for all roles', () => {
    expect(checkAccess('/notifications', 'Admin')).toBe('allow')
    expect(checkAccess('/notifications', 'Sale')).toBe('allow')
  })
})
