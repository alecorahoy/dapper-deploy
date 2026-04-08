import { useState } from "react"
import { X, Mail, Lock, User, Eye, EyeOff, Loader } from "lucide-react"

const NAVY = "#080f1e"
const GOLD = "#C9A84C"

// Google "G" SVG icon
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function Input({ icon: Icon, type = "text", placeholder, value, onChange, right }) {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Icon size={16}/>
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border-2 py-3 text-sm focus:outline-none transition-colors"
        style={{
          paddingLeft: Icon ? "2.5rem" : "1rem",
          paddingRight: right ? "2.75rem" : "1rem",
          borderColor: "#f1f5f9",
          background: "#fafafa",
        }}
        onFocus={e  => e.target.style.borderColor = GOLD}
        onBlur={e   => e.target.style.borderColor = "#f1f5f9"}
      />
      {right && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>
      )}
    </div>
  )
}

export default function AuthModal({ onClose, useAuthHook }) {
  const { signIn, signUp, signInGoogle, loading, error, clearError } = useAuthHook
  const [mode,        setMode]        = useState("signin") // "signin" | "signup"
  const [email,       setEmail]       = useState("")
  const [password,    setPassword]    = useState("")
  const [name,        setName]        = useState("")
  const [showPass,    setShowPass]    = useState(false)

  const switchMode = () => { setMode(m => m === "signin" ? "signup" : "signin"); clearError() }

  const handleSubmit = async () => {
    if (mode === "signin") {
      const u = await signIn(email, password)
      if (u) onClose()
    } else {
      const u = await signUp(email, password, name)
      if (u) onClose()
    }
  }

  const handleGoogle = async () => {
    const u = await signInGoogle()
    if (u) onClose()
  }

  const handleKey = (e) => { if (e.key === "Enter" && !loading && email && password) handleSubmit() }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4" style={{borderBottom:"1px solid #f1f5f9"}}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{background:GOLD}}>
                <span style={{fontSize:"11px",color:NAVY,fontWeight:900}}>D</span>
              </div>
              <span className="font-black tracking-widest text-sm" style={{color:NAVY}}>DAPPER</span>
            </div>
            <h2 className="text-xl font-black text-gray-900">
              {mode === "signin" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {mode === "signin" ? "Sign in to access your closet & calendar" : "Start building your style profile"}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={18} className="text-gray-400"/>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3" onKeyDown={handleKey}>

          {/* Google button */}
          <button onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border-2 text-sm font-bold transition-all hover:bg-gray-50 disabled:opacity-50"
            style={{borderColor:"#e5e7eb",color:"#374151"}}>
            <GoogleIcon/>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100"/>
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-100"/>
          </div>

          {/* Name (signup only) */}
          {mode === "signup" && (
            <Input
              icon={User}
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          )}

          {/* Email */}
          <Input
            icon={Mail}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          {/* Password */}
          <Input
            icon={Lock}
            type={showPass ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            right={
              <button onClick={() => setShowPass(p => !p)} className="text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            }
          />

          {/* Error */}
          {error && (
            <div className="text-xs text-red-600 font-semibold bg-red-50 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading || !email || !password}
            className="w-full py-3 rounded-xl font-black text-sm transition-all disabled:opacity-40"
            style={{background:NAVY, color:"white"}}
            onKeyDown={handleKey}>
            {loading
              ? <span className="flex items-center justify-center gap-2"><Loader size={15} className="animate-spin"/> Please wait…</span>
              : mode === "signin" ? "Sign In" : "Create Account"
            }
          </button>

          {/* Switch mode */}
          <p className="text-center text-xs text-gray-400">
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={switchMode} className="font-black" style={{color:GOLD}}>
              {mode === "signin" ? "Sign up free" : "Sign in"}
            </button>
          </p>
        </div>

        {/* Footer note */}
        <div className="px-6 pb-5 text-center">
          <p className="text-xs text-gray-300">
            Your closet syncs across all devices. No card required.
          </p>
        </div>
      </div>
    </div>
  )
}
