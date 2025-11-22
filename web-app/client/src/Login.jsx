import React, { useState, useEffect } from 'react'
import Icon from './Icon.jsx'

function LoginForm({ authUsername, authPassword, setAuthUsername, setAuthPassword, authError, handleAuth }) {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    try {
      const remembered = localStorage.getItem('rememberedUser')
      if (remembered) {
        setAuthUsername(remembered)
        setRememberMe(true)
      }
    } catch (e) {}
  }, [setAuthUsername])

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await handleAuth()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div style={{marginBottom: '24px'}}>
        <label style={{display: 'block', marginBottom: '10px', color: '#555', fontWeight: '600'}}><Icon name="customers" size={16} /> Username</label>
        <input
          type="text"
          value={authUsername}
          onChange={(e)=>setAuthUsername(e.target.value)}
          placeholder="Enter your username"
          required
          autoFocus
          style={{width: '100%', padding: '14px 16px', border: '2px solid #e8ebf0', borderRadius: '12px'}}
        />
      </div>
      <div style={{marginBottom: '28px'}}>
        <label style={{display: 'block', marginBottom: '10px', color: '#555', fontWeight: '600'}}><Icon name="lock" size={16} /> Password</label>
        <div style={{position: 'relative'}}>
          <input
            type={showPassword ? "text" : "password"}
            value={authPassword}
            onChange={(e)=>setAuthPassword(e.target.value)}
            placeholder="Enter your password"
            required
            style={{width: '100%', padding: '14px 16px', border: '2px solid #e8ebf0', borderRadius: '12px'}}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            <Icon name={showPassword ? "lock" : "spark"} size={16} />
          </button>
        </div>
      </div>
      <div style={{marginBottom: '24px'}}>
        <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span style={{fontSize: '14px', color: '#666'}}>Remember me</span>
        </label>
      </div>
      {authError && <div style={{padding: '14px 16px', background: '#fee', borderRadius: '12px', color: '#c33', marginBottom: '24px'}}>{authError}</div>}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary important-btn btn-icon"
        style={{width: '100%', padding: '16px', border: 'none'}}
      >
        {loading ? <span className="spinner-small"></span> : <><Icon name="dashboard" size={16} /> <span>Login to Dashboard</span></>}
      </button>
    </form>
  )
}

function RegisterForm({ registerUsername, registerPassword, setRegisterUsername, setRegisterPassword, registerError, handleRegister }) {
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await handleRegister()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div style={{marginBottom:'24px'}}>
        <label style={{display:'block', marginBottom:'10px', color:'#555', fontWeight:'600'}}><Icon name="customers" size={16} /> Username</label>
        <input
          type="text"
          value={registerUsername}
          onChange={(e)=>setRegisterUsername(e.target.value)}
          placeholder="Choose a unique username (min 3 characters)"
          required
          minLength="3"
          style={{width:'100%', padding:'14px 16px', border:'2px solid #e8ebf0', borderRadius:'12px'}}
        />
      </div>
      {/* Email removed — registration now only needs username and password */}
      <div style={{marginBottom:'28px'}}>
        <label style={{display:'block', marginBottom:'10px', color:'#555', fontWeight:'600'}}><Icon name="lock" size={16} /> Password</label>
        <input
          type="password"
          value={registerPassword}
          onChange={(e)=>setRegisterPassword(e.target.value)}
          placeholder="Create a strong password (min 6 characters)"
          required
          minLength="6"
          style={{width:'100%', padding:'14px 16px', border:'2px solid #e8ebf0', borderRadius:'12px'}}
        />
      </div>
      {registerError && <div style={{padding:'14px 16px', background:'#fee', borderRadius:'12px', color:'#c33', marginBottom:'24px'}}>{registerError}</div>}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary important-btn btn-icon"
        style={{width:'100%', padding:'16px', border:'none'}}
      >
        {loading ? <span className="spinner-small"></span> : <><Icon name="add" size={16} /> <span>Create Your Account</span></>}
      </button>
    </form>
  )
}

export default function Login(props) {
  const {
    showLoginPage,
    setShowLoginPage,
    authUsername,
    setAuthUsername,
    authPassword,
    setAuthPassword,
    authError,
    handleAuth,
    registerUsername,
    setRegisterUsername,
    registerPassword,
    setRegisterPassword,
    handleRegister,
    registerError
  } = props

  return (
    <div className="app login-root">
      <div className="login-center">
        <div className="login-card">
          <div className="login-brand">
            <div className="brand-icon"><Icon name="spark" size={36} /></div>
            <div className="brand-text">
              <h2>26:07 Electronics</h2>
              <p>Premium Electronics & Smart Solutions</p>
            </div>
          </div>

          <div className="tab-bar">
            <button className={`tab-btn ${showLoginPage ? 'active' : ''}`} onClick={() => setShowLoginPage(true)}><Icon name="lock" size={16} /> <span>Login</span></button>
            <button className={`tab-btn ${!showLoginPage ? 'active' : ''}`} onClick={() => setShowLoginPage(false)}><Icon name="add" size={16} /> <span>Register</span></button>
          </div>

          <div className="card-body animated-panel">
            {showLoginPage ? (
              <div>
                <h3><Icon name="spark" size={20} /> Welcome Back!</h3>
                <p className="muted">Please login to continue to your account</p>
                <LoginForm
                  authUsername={authUsername}
                  authPassword={authPassword}
                  setAuthUsername={setAuthUsername}
                  setAuthPassword={setAuthPassword}
                  authError={authError}
                  handleAuth={handleAuth}
                />

                <div className="info-box"><Icon name="spark" size={16} /> Admin credentials required for owner access</div>
              </div>
            ) : (
              <div>
                <h3><Icon name="spark" size={20} /> Create Account</h3>
                <p className="muted">Sign up to start managing your inventory</p>
                <RegisterForm
                  registerUsername={registerUsername}
                  registerPassword={registerPassword}
                  setRegisterUsername={setRegisterUsername}
                  setRegisterPassword={setRegisterPassword}
                  registerError={registerError}
                  handleRegister={handleRegister}
                />

                <div className="info-box"><Icon name="check" size={16} /> Admin will review and approve your access</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
