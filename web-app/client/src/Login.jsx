import React, { useState, useEffect } from 'react'
import Icon from './Icon'

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
  )

  return (
    <div className="app login-root">
      <div className="login-center">
        <div className="login-card">
          <div className="login-brand">
            <div className="brand-icon">⚡</div>
            <div className="brand-text">
              <h2>26:07 Electronics</h2>
              <p>Premium Electronics & Smart Solutions</p>
            </div>
          </div>

          <div className="tab-bar">
            <button className={`tab-btn ${showLoginPage ? 'active' : ''}`} onClick={() => setShowLoginPage(true)}>🔐 Login</button>
            <button className={`tab-btn ${!showLoginPage ? 'active' : ''}`} onClick={() => setShowLoginPage(false)}>📝 Register</button>
          </div>

          <div className="card-body animated-panel">
            {showLoginPage ? (
              <div>
                <h3>Welcome Back! 👋</h3>
                <p className="muted">Please login to continue to your account</p>
                <LoginForm
                  authUsername={authUsername}
                  authPassword={authPassword}
                  setAuthUsername={setAuthUsername}
                  setAuthPassword={setAuthPassword}
                  authError={authError}
                  handleAuth={handleAuth}
                />

                <div className="info-box">💡 Admin credentials required for owner access</div>
              </div>
            ) : (
              <div>
                <h3>Create Account ✨</h3>
                <p className="muted">Sign up to start managing your inventory</p>
                <RegisterForm
                  registerUsername={registerUsername}
                  registerEmail={registerEmail}
                  registerPassword={registerPassword}
                  setRegisterUsername={setRegisterUsername}
                  setRegisterEmail={setRegisterEmail}
                  setRegisterPassword={setRegisterPassword}
                  registerError={registerError}
                  handleRegister={handleRegister}
                  handleSendOTP={handleSendOTP}
                />

                <div className="info-box">✅ Admin will review and approve your access</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
import React, { useState, useEffect } from 'react'

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
    registerEmail,
    setRegisterEmail,
    registerPassword,
    setRegisterPassword,
    handleRegister,
    registerError
  } = props

  return (
    <div className="app">
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
          width: '100%',
          maxWidth: '480px',
          overflow: 'hidden',
          animation: 'slideUp 0.5s ease-out',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '50px 40px',
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{fontSize: '64px', marginBottom: '15px'}}>⚡</div>
            <h2 style={{margin: 0, fontSize: '36px', fontWeight: 'bold'}}>26:07 Electronics</h2>
            <p style={{margin: 0, fontSize: '15px', opacity: 0.95}}>Premium Electronics & Smart Solutions</p>
          </div>

          <div className="tab-bar" style={{display: 'flex', padding: '8px', background: '#f8f9fa', gap: '8px'}}>
            <button
              onClick={() => setShowLoginPage(true)}
              className={"tab-btn " + (showLoginPage ? 'active' : '')}
              style={{ flex: 1 }}
            >
              🔐 Login
            </button>
            <button
              onClick={() => setShowLoginPage(false)}
              className={"tab-btn " + (!showLoginPage ? 'active' : '')}
              style={{ flex: 1 }}
            >
              📝 Register
            </button>
          </div>

          {showLoginPage ? (
            <div style={{padding: '45px 40px'}}>
              <h3 style={{marginTop: 0, marginBottom: '10px', color: '#333', fontSize: '24px', fontWeight: 'bold'}}>Welcome Back! 👋</h3>
              <p style={{margin: '0 0 30px 0', color: '#999', fontSize: '14px'}}>Please login to continue to your account</p>
              {/** local states for UX */}
              <LoginForm
                authUsername={authUsername}
                authPassword={authPassword}
                setAuthUsername={setAuthUsername}
                setAuthPassword={setAuthPassword}
                authError={authError}
                handleAuth={handleAuth}
              />
                <div style={{marginBottom: '24px'}}>
                  <label style={{display: 'block', marginBottom: '10px', color: '#555', fontWeight: '600'}}>👤 Username</label>
                  <input type="text" value={authUsername} onChange={(e)=>setAuthUsername(e.target.value)} placeholder="Enter your username" required autoFocus style={{width: '100%', padding: '14px 16px', border: '2px solid #e8ebf0', borderRadius: '12px'}} />
                </div>
                <div style={{marginBottom: '28px'}}>
                  <label style={{display: 'block', marginBottom: '10px', color: '#555', fontWeight: '600'}}>🔒 Password</label>
                  <input type="password" value={authPassword} onChange={(e)=>setAuthPassword(e.target.value)} placeholder="Enter your password" required style={{width: '100%', padding: '14px 16px', border: '2px solid #e8ebf0', borderRadius: '12px'}} />
                </div>
                {authError && <div style={{padding: '14px 16px', background: '#fee', borderRadius: '12px', color: '#c33', marginBottom: '24px'}}>{authError}</div>}
                <button type="submit" style={{width: '100%', padding: '16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '12px', border: 'none'}}>🚀 Login to Dashboard</button>
              </form>
              <div style={{textAlign: 'center', marginTop: '28px', padding: '16px', background: 'linear-gradient(135deg, #f0f4ff 0%, #e9f0ff 100%)', borderRadius: '12px'}}>
                <p style={{margin:0, color:'#667eea', fontSize:'13px', fontWeight:'500'}}>💡 Admin credentials required for owner access</p>
              </div>
            </div>
          ) : (
            <div style={{padding: '45px 40px'}}>
              <h3 style={{marginTop:0, marginBottom:'10px', color:'#333', fontSize:'24px', fontWeight:'bold', textAlign:'center'}}>Create Account ✨</h3>
              <p style={{textAlign:'center', color:'#999', fontSize:'14px', marginBottom:'30px'}}>Sign up to start managing your inventory</p>
              <RegisterForm
                registerUsername={registerUsername}
                registerEmail={registerEmail}
                registerPassword={registerPassword}
                setRegisterUsername={setRegisterUsername}
                setRegisterEmail={setRegisterEmail}
                setRegisterPassword={setRegisterPassword}
                registerError={registerError}
                handleRegister={handleRegister}
                handleSendOTP={props.handleSendOTP}
              />
                <div style={{marginBottom:'24px'}}>
                  <label style={{display:'block', marginBottom:'10px', color:'#555', fontWeight:'600'}}>👤 Username</label>
                  <input type="text" value={registerUsername} onChange={(e)=>setRegisterUsername(e.target.value)} placeholder="Choose a unique username (min 3 characters)" required minLength="3" style={{width:'100%', padding:'14px 16px', border:'2px solid #e8ebf0', borderRadius:'12px'}} />
                </div>
                <div style={{marginBottom:'24px'}}>
                  <label style={{display:'block', marginBottom:'10px', color:'#555', fontWeight:'600'}}>📧 Email Address</label>
                  <input type="email" value={registerEmail} onChange={(e)=>setRegisterEmail(e.target.value)} placeholder="your@email.com" required style={{width:'100%', padding:'14px 16px', border:'2px solid #e8ebf0', borderRadius:'12px'}} />
                </div>
                <div style={{marginBottom:'28px'}}>
                  <label style={{display:'block', marginBottom:'10px', color:'#555', fontWeight:'600'}}>🔒 Password</label>
                  <input type="password" value={registerPassword} onChange={(e)=>setRegisterPassword(e.target.value)} placeholder="Create a strong password (min 6 characters)" required minLength="6" style={{width:'100%', padding:'14px 16px', border:'2px solid #e8ebf0', borderRadius:'12px'}} />
                </div>
                {registerError && <div style={{padding:'14px 16px', background:'#fee', borderRadius:'12px', color:'#c33', marginBottom:'24px'}}>{registerError}</div>}
                <button type="submit" style={{width:'100%', padding:'16px', background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color:'white', borderRadius:'12px', border:'none'}}>🎉 Create Your Account</button>
              </form>
              <div style={{textAlign:'center', marginTop:'28px', padding:'16px', background:'linear-gradient(135deg, #f0f4ff 0%, #e9f0ff 100%)', borderRadius:'12px'}}>
                <p style={{margin:0, color:'#667eea', fontSize:'13px', fontWeight:'500'}}>✅ Admin will review and approve your access</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
