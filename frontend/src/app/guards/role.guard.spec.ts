import { Injector, runInInjectionContext } from '@angular/core';
import { Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot, DefaultUrlSerializer } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { roleGuard } from './role.guard';
import { AuthService } from '../shared/services/auth/auth';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const serializer = new DefaultUrlSerializer();

function fakeRoute(data: Record<string, unknown> = {}): ActivatedRouteSnapshot {
  return { data } as unknown as ActivatedRouteSnapshot;
}

function fakeState(url = '/test'): RouterStateSnapshot {
  return { url } as RouterStateSnapshot;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('roleGuard', () => {
  let mockAuth: { currentUser: any };
  let mockAuthService: { getCurrentUserRole: ReturnType<typeof vi.fn> };
  let mockRouter: { createUrlTree: ReturnType<typeof vi.fn> };

  function createInjector(): Injector {
    return Injector.create({
      providers: [
        { provide: Auth, useValue: mockAuth },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  }

  beforeEach(() => {
    mockAuth = { currentUser: { uid: 'user-123' } };
    mockAuthService = { getCurrentUserRole: vi.fn() };
    mockRouter = {
      createUrlTree: vi.fn((commands: string[]) => {
        // Use DefaultUrlSerializer to build a real UrlTree
        const url = commands.join('').replace(/\/+/g, '/');
        return serializer.parse(url);
      }),
    };
  });

  // ── Test 1 ──────────────────────────────────────────────────────
  it('should allow navigation when the user role matches an allowed role', async () => {
    mockAuthService.getCurrentUserRole.mockResolvedValue('admin');
    const injector = createInjector();

    const result = await runInInjectionContext(injector, () =>
      roleGuard(fakeRoute({ roles: ['admin'] }), fakeState('/admin-dashboard')),
    );

    expect(result).toBe(true);
  });

  // ── Test 2 ──────────────────────────────────────────────────────
  it('should block navigation when the user role does not match', async () => {
    mockAuthService.getCurrentUserRole.mockResolvedValue('student');
    const injector = createInjector();

    const result = await runInInjectionContext(injector, () =>
      roleGuard(fakeRoute({ roles: ['admin'] }), fakeState('/admin-dashboard')),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login');
  });

  // ── Test 3 ──────────────────────────────────────────────────────
  it('should block navigation when the user role is null', async () => {
    mockAuthService.getCurrentUserRole.mockResolvedValue(null);
    const injector = createInjector();

    const result = await runInInjectionContext(injector, () =>
      roleGuard(fakeRoute({ roles: ['admin'] }), fakeState('/admin-dashboard')),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login');
  });

  // ── Test 4 ──────────────────────────────────────────────────────
  it('should allow navigation when multiple roles are allowed and user has one', async () => {
    mockAuthService.getCurrentUserRole.mockResolvedValue('teacher');
    const injector = createInjector();

    const result = await runInInjectionContext(injector, () =>
      roleGuard(fakeRoute({ roles: ['teacher', 'admin'] }), fakeState('/gradebook')),
    );

    expect(result).toBe(true);
  });

  // ── Test 5 ──────────────────────────────────────────────────────
  it('should redirect to /login when there is no authenticated user', async () => {
    mockAuth.currentUser = null;
    const injector = createInjector();

    const result = await runInInjectionContext(injector, () =>
      roleGuard(fakeRoute({ roles: ['admin'] }), fakeState('/admin-dashboard')),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login');
    expect(mockAuthService.getCurrentUserRole).not.toHaveBeenCalled();
  });

  // ── Test 6 ──────────────────────────────────────────────────────
  it('should allow navigation when no roles are configured on the route', async () => {
    const injector = createInjector();

    const result = await runInInjectionContext(injector, () =>
      roleGuard(fakeRoute({}), fakeState('/some-page')),
    );

    expect(result).toBe(true);
    expect(mockAuthService.getCurrentUserRole).not.toHaveBeenCalled();
  });
});
