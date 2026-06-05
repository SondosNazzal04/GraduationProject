import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { authGuard } from './auth.guard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fakeRoute(data: Record<string, unknown> = {}): ActivatedRouteSnapshot {
  return { data } as unknown as ActivatedRouteSnapshot;
}

function fakeState(url = '/test'): RouterStateSnapshot {
  return { url } as RouterStateSnapshot;
}

// ---------------------------------------------------------------------------
// Mock firebase/auth — controls onAuthStateChanged per test
// ---------------------------------------------------------------------------

let onAuthStateChangedHandler: ((innerCb: (user: any) => void) => void) | null = null;

vi.mock('firebase/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/auth')>();
  return {
    ...actual,
    onAuthStateChanged: (_auth: any, callback: any) => {
      if (onAuthStateChangedHandler) {
        onAuthStateChangedHandler(callback);
      } else {
        callback(null);
      }
      return () => {};
    },
  };
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('authGuard', () => {
  let mockAuth: { currentUser: any };
  let router: Router;

  beforeEach(() => {
    onAuthStateChangedHandler = null;
    mockAuth = { currentUser: null };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: Auth, useValue: mockAuth },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('should allow navigation when currentUser is present', async () => {
    mockAuth.currentUser = { uid: 'user-123' };

    const result = await TestBed.runInInjectionContext(() =>
      authGuard(fakeRoute(), fakeState()),
    );

    expect(result).toBe(true);
  });

  it('should redirect to /login when there is no user', async () => {
    mockAuth.currentUser = null;
    onAuthStateChangedHandler = (cb) => cb(null);

    const result = await TestBed.runInInjectionContext(() =>
      authGuard(fakeRoute(), fakeState('/admin-dashboard')),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login');
  });

  it('should wait for auth state and allow if user resolves', async () => {
    const fakeUser = { uid: 'delayed-user-456' };
    mockAuth.currentUser = null;
    onAuthStateChangedHandler = (cb) => {
      setTimeout(() => cb(fakeUser), 10);
    };

    const result = await TestBed.runInInjectionContext(() =>
      authGuard(fakeRoute(), fakeState('/student-dashboard')),
    );

    expect(result).toBe(true);
  });
});
