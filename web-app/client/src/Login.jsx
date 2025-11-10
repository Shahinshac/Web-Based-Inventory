import React from 'react'

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

          <div style={{display: 'flex', padding: '8px', background: '#f8f9fa', gap: '8px'}}>
            <button
              onClick={() => setShowLoginPage(true)}
              style={{
                flex: 1,
                padding: '14px',
                border: 'none',
                background: showLoginPage ? 'white' : 'transparent',
                borderRadius: '12px',
                color: showLoginPage ? '#667eea' : '#999',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🔐 Login
            </button>
            <button
              onClick={() => setShowLoginPage(false)}
              style={{
                flex: 1,
                padding: '14px',
                border: 'none',
                background: !showLoginPage ? 'white' : 'transparent',
                borderRadius: '12px',
                color: !showLoginPage ? '#667eea' : '#999',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              📝 Register
            </button>
          </div>

          {showLoginPage ? (
            <div style={{padding: '45px 40px'}}>
              <h3 style={{marginTop: 0, marginBottom: '10px', color: '#333', fontSize: '24px', fontWeight: 'bold'}}>Welcome Back! 👋</h3>
              <p style={{margin: '0 0 30px 0', color: '#999', fontSize: '14px'}}>Please login to continue to your account</p>
              <form onSubmit={handleAuth}>
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
              <form onSubmit={handleRegister}>
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
