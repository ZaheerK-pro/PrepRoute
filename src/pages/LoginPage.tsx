import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { login, getLoginErrorMessage } from '../api/auth';
import { BrandLogo } from '../components/BrandLogo';
import { useAuthStore } from '../store/authStore';
import { notifyError } from '../store/notificationStore';

const loginSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { userId: '', password: '' },
  });

  const onSubmit = async (values: LoginForm) => {
    try {
      const { token, user } = await login(values);
      setAuth(token, user);
      navigate('/dashboard');
    } catch (err: unknown) {
      notifyError(getLoginErrorMessage(err), 'Login failed');
    }
  };

  return (
    <div className="login-page">
      <div className="login-illustration">
        <img src="/login_iocn.png" alt="" className="login-hero-image" />
      </div>

      <div className="login-form-panel">
        <div className="login-form-inner">
          <BrandLogo to="" className="login-logo" />

          <div className="login-heading">
            <h1>Login</h1>
            <p>Use your company provided Login credentials</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="login-form">
            <div className="form-group">
              <label htmlFor="userId">User ID</label>
              <input
                id="userId"
                type="text"
                placeholder="Enter User ID"
                autoComplete="username"
                {...register('userId')}
              />
              {errors.userId && <span className="field-error">{errors.userId.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter Password"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && (
                <span className="field-error">{errors.password.message}</span>
              )}
            </div>

            <a href="#" className="forgot-link" onClick={(e) => e.preventDefault()}>
              Forgot password?
            </a>

            <button type="submit" className="btn btn-primary btn-block btn-login" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
