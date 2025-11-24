import React, { useState } from 'react';
import { User } from '../types';
import { loginUser, registerUser } from '../services/auth';
import { UserCircle, Lock, ArrowRight, Loader } from 'lucide-react';

interface AuthFormProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!username || !password) {
        throw new Error('请输入账号和密码');
      }

      const res = isLogin 
        ? await loginUser(username, password)
        : await registerUser(username, password);

      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.message || '操作失败');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {isLogin ? '用户登录' : '注册账号'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
            <UserCircle className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
                type="text"
                placeholder="用户名"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            />
        </div>
        
        <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
                type="password"
                placeholder="密码"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            />
        </div>

        {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">
                {error}
            </div>
        )}

        <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center space-x-2 transition-all transform active:scale-95
                ${loading ? 'bg-gray-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30'}
            `}
        >
            {loading ? <Loader className="animate-spin" size={20} /> : (
                <>
                    <span>{isLogin ? '登录' : '注册'}</span>
                    <ArrowRight size={20} />
                </>
            )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        {isLogin ? '还没有账号? ' : '已有账号? '}
        <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-blue-600 font-bold hover:underline"
        >
            {isLogin ? '立即注册' : '直接登录'}
        </button>
      </div>
    </div>
  );
};