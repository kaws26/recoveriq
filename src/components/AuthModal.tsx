import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Building2,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
  Sparkles,
  Zap,
  User,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import { EnterpriseRole, EnterpriseUser } from '../types';
import * as api from '../lib/api';
import { ROLE_DEFINITIONS } from './UserProfileMenu';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: EnterpriseUser, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('finance@apexdigital.in');
  const [loginPassword, setLoginPassword] = useState('RecoverIQ@2026!');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [companyName, setCompanyName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('RecoverIQ@2026!');
  const [selectedRole, setSelectedRole] = useState<EnterpriseRole>('MERCHANT_ADMIN');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await api.login(loginEmail, loginPassword);
      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickRoleLogin = async (role: EnterpriseRole) => {
    const meta = ROLE_DEFINITIONS[role];
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await api.login(meta.email, 'RecoverIQ@2026!');
      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      // If direct login fails, fallback to switchRole
      try {
        const switchData = await api.switchRole(role);
        onAuthSuccess(switchData.user, switchData.token);
        onClose();
      } catch (innerErr: any) {
        setErrorMsg(innerErr.message || 'Quick login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !registerEmail) {
      setErrorMsg('Company name and business email are required');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await api.register({
        company_name: companyName,
        business_email: registerEmail,
        password: registerPassword,
        role: selectedRole,
        currency: 'INR',
        country: 'India',
      });
      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const demoRoles: EnterpriseRole[] = [
    'MERCHANT_ADMIN',
    'PAYMENT_OPS',
    'RISK_OFFICER',
    'SUPER_ADMIN',
    'AUDITOR',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              R
            </div>
            <span className="font-extrabold tracking-tight text-lg text-white">RecoverIQ</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Enterprise Access
            </span>
          </div>

          <h2 className="text-xl font-bold text-white mt-2">
            {authMode === 'login' ? 'Merchant Authentication' : 'Create Merchant Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {authMode === 'login'
              ? 'Sign in to access your revenue recovery workspace, automated dunning, and audit trails.'
              : 'Deploy an automated recovery instance for your Razorpay payment gateway.'}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => {
                setAuthMode('login');
                setErrorMsg(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                authMode === 'login'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Sign In with Account
            </button>
            <button
              onClick={() => {
                setAuthMode('register');
                setErrorMsg(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                authMode === 'register'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Register New Organization
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {authMode === 'login' ? (
            <div className="space-y-5">
              {/* Quick Role Selectors */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Instant Demo Login (Select Role)
                  </span>
                  <span className="text-[10px] text-blue-600 font-semibold">1-Click Auth</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {demoRoles.map((roleKey) => {
                    const meta = ROLE_DEFINITIONS[roleKey];
                    return (
                      <button
                        key={roleKey}
                        type="button"
                        onClick={() => handleQuickRoleLogin(roleKey)}
                        disabled={isLoading}
                        className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all group cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${meta.avatarBg} ${meta.avatarText}`}
                          >
                            {meta.initials}
                          </div>
                          <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 truncate">
                            {meta.title}
                          </span>
                        </div>
                        <span className="block text-[10px] text-slate-500 mt-1 truncate">
                          {meta.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-slate-200" />
                <span className="shrink mx-3 text-slate-400 text-[11px] font-semibold">
                  Or enter credentials
                </span>
                <div className="grow border-t border-slate-200" />
              </div>

              {/* Standard Email/Password Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="finance@company.com"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Default demo password:{' '}
                    <code className="text-slate-600 font-mono">RecoverIQ@2026!</code>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Authenticating...' : 'Sign In to Workspace'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ) : (
            /* Register Organization Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company / Organization Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Digital Technologies Pvt Ltd"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="billing@company.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Account Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Administrative Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as EnterpriseRole)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="MERCHANT_ADMIN">Merchant Admin (Full Access)</option>
                  <option value="PAYMENT_OPS">Payment Operations (Maker)</option>
                  <option value="RISK_OFFICER">Risk Officer (Checker)</option>
                  <option value="SUPER_ADMIN">Platform Super Admin</option>
                  <option value="AUDITOR">Compliance Auditor (Read-Only)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Creating Tenant...' : 'Deploy Merchant Recovery Workspace'}
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
