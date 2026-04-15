import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Correo o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-logo">
        <div className="auth-logo-title">La Quiniela Mundialista</div>
        <div className="auth-logo-sub">Copa Mundial de la FIFA 2026™ <br />USA · CAN · MEX</div>
      </div>
      <div className="auth-card">
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, marginBottom: 20, letterSpacing: '0.04em' }}>
          Iniciar Sesión
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-btn gold-btn" type="submit" disabled={loading} style={{ marginTop: 16 }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className="divider" />
        <div className="text-center text-muted">
          ¿No tienes cuenta?{' '}
          <span
            onClick={() => navigate('/register')}
            style={{ color: 'var(--navy)', fontWeight: 500, cursor: 'pointer' }}
          >
            Regístrate aquí
          </span>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Las contraseñas no coinciden');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('Este correo ya está registrado');
      else setError('Error al crear la cuenta. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-logo">
        <div className="auth-logo-title">La Quiniela Mundialista</div>
        <div className="auth-logo-sub">Copa Mundial de la FIFA 2026™ <br />USA · CAN · MEX</div>
      </div>
      <div className="auth-card">
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, marginBottom: 20, letterSpacing: '0.04em' }}>
          Crear Cuenta
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tu nombre</label>
            <input
              className="form-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Como quieres aparecer en el ranking"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirmar contraseña</label>
            <input
              className="form-input"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repite tu contraseña"
              required
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-btn" type="submit" disabled={loading} style={{ marginTop: 16 }}>
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>
        <div className="divider" />
        <div className="text-center text-muted">
          ¿Ya tienes cuenta?{' '}
          <span
            onClick={() => navigate('/login')}
            style={{ color: 'var(--navy)', fontWeight: 500, cursor: 'pointer' }}
          >
            Inicia sesión
          </span>
        </div>
      </div>
    </div>
  );
};
