import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/inicio');
    } catch {
      setError('Correo o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setResetMsg('');
    setResetLoading(true);
    try {
      await resetPassword(resetEmail);
      setResetMsg('✅ Te enviamos un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.');
    } catch {
      setResetMsg('❌ No encontramos ese correo. Verifica que esté bien escrito.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-logo">
        <div className="auth-logo-title">La Quiniela</div>
        <div className="auth-logo-sub">Mundial 2026 · USA · CAN · MEX</div>
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

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <span
            onClick={() => { setShowReset(!showReset); setResetMsg(''); }}
            style={{ fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            ¿Olvidaste tu contraseña?
          </span>
        </div>

        {showReset && (
          <form onSubmit={handleReset} style={{ marginTop: 12, padding: '14px', background: '#f5f7fa', borderRadius: 10 }}>
            <div style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 8 }}>
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </div>
            <input
              className="form-input"
              type="email"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              style={{ marginBottom: 8 }}
            />
            {resetMsg && <div style={{ fontSize: 13, marginBottom: 8, color: resetMsg.startsWith('✅') ? 'green' : 'red' }}>{resetMsg}</div>}
            <button className="primary-btn" type="submit" disabled={resetLoading} style={{ fontSize: 13, padding: '10px' }}>
              {resetLoading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}

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
  const [nombre,   setNombre]   = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail]       = useState('');
  const [countryCode, setCountryCode] = useState('+506');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!nombre.trim())   return setError('Ingresa tu nombre');
    if (!apellido.trim()) return setError('Ingresa tu apellido');
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 5) return setError('Ingresa un número de teléfono válido');
    if (password !== confirm) return setError('Las contraseñas no coinciden');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    setLoading(true);
    try {
      const displayName = `${nombre.trim()} ${apellido.trim()}`;
      const fullPhone = `${countryCode}${cleanPhone}`;
      await register(email, password, displayName, fullPhone);
      navigate('/inicio');
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
        <div className="auth-logo-title">La Quiniela</div>
        <div className="auth-logo-sub">Mundial 2026 · USA · CAN · MEX</div>
      </div>
      <div className="auth-card">
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, marginBottom: 20, letterSpacing: '0.04em' }}>
          Crear Cuenta
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input
                className="form-input"
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Ej: Juan"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Apellido</label>
              <input
                className="form-input"
                type="text"
                value={apellido}
                onChange={e => setApellido(e.target.value)}
                placeholder="Ej: Pérez"
                required
              />
            </div>
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
            <label className="form-label">Teléfono / WhatsApp</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <select
                className="form-input"
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                style={{ flex: '0 0 auto', width: 110 }}
                required
              >
                <option value="+506">🇨🇷 +506</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+52">🇲🇽 +52</option>
                <option value="+502">🇬🇹 +502</option>
                <option value="+503">🇸🇻 +503</option>
                <option value="+504">🇭🇳 +504</option>
                <option value="+505">🇳🇮 +505</option>
                <option value="+507">🇵🇦 +507</option>
                <option value="+53">🇨🇺 +53</option>
                <option value="+57">🇨🇴 +57</option>
                <option value="+58">🇻🇪 +58</option>
                <option value="+51">🇵🇪 +51</option>
                <option value="+593">🇪🇨 +593</option>
                <option value="+56">🇨🇱 +56</option>
                <option value="+54">🇦🇷 +54</option>
                <option value="+595">🇵🇾 +595</option>
                <option value="+598">🇺🇾 +598</option>
                <option value="+591">🇧🇴 +591</option>
                <option value="+55">🇧🇷 +55</option>
                <option value="+34">🇪🇸 +34</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+49">🇩🇪 +49</option>
                <option value="+33">🇫🇷 +33</option>
                <option value="+39">🇮🇹 +39</option>
                <option value="+31">🇳🇱 +31</option>
                <option value="+351">🇵🇹 +351</option>
                <option value="+81">🇯🇵 +81</option>
                <option value="+82">🇰🇷 +82</option>
                <option value="+86">🇨🇳 +86</option>
                <option value="+91">🇮🇳 +91</option>
                <option value="+61">🇦🇺 +61</option>
              </select>
              <input
                className="form-input"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Número"
                required
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Costa Rica: +506 · Ingresa solo el número sin código
            </div>
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
