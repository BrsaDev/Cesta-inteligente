import { useState, FormEvent } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Card } from '@/src/components/ui/Card';
import { Mail, Lock, User, Store, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onSuccess: () => void;
}

export const Login = ({ onSuccess }: LoginProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'market'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isSignUp) {
        // SIGN UP FLOW
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              name: name, 
              role: role,
              display_name: name 
            },
            emailRedirectTo: window.location.origin,
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // Try to create profile immediately
          // Note: If email confirmation is ON, this might fail depending on RLS.
          // We handle this by also checking/creating profile on the first login.
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              name,
              email,
              role,
              reputation_score: 0,
            });
          } catch (pErr) {
            console.log('Profile creation will be finalized after email confirmation');
          }

          if (data.session) {
            // Email confirmation is likely OFF in Supabase settings
            onSuccess();
          } else {
            // Email confirmation is likely ON
            setSuccessMessage('Conta criada com sucesso! Verifique seu e-mail para confirmar seu cadastro antes de entrar.');
            setIsSignUp(false);
          }
        }
      } else {
        // SIGN IN FLOW
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message.includes('Email not confirmed')) {
            throw new Error('Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.');
          }
          throw signInError;
        }

        if (data.user) {
          // Ensure profile exists (in case it wasn't created during signup due to RLS/Confirmation)
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const metadataRole = data.user.user_metadata.role || 'user';

          if (!profile) {
            console.log('Creating missing profile on login with role:', metadataRole);
            const { error: insertError } = await supabase.from('profiles').insert({
              id: data.user.id,
              name: data.user.user_metadata.name || 'Usuário',
              email: data.user.email!,
              role: metadataRole,
              reputation_score: 0,
            });
            if (insertError) console.error('Error creating profile:', insertError);
          } else if (profile.role !== metadataRole && metadataRole === 'market') {
            // Fix role if metadata says market but profile says user
            console.log('Fixing profile role to market based on metadata');
            const { error: updateError } = await supabase.from('profiles').update({ role: 'market' }).eq('id', data.user.id);
            if (updateError) console.error('Error updating profile role:', updateError);
          }
        }
        
        onSuccess();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.message?.includes('rate limit')) {
        setError('Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.');
      } else if (err.message?.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos.');
      } else {
        setError(err.message || 'Ocorreu um erro na autenticação.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto p-4"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {isSignUp ? 'Criar conta' : 'Bem-vindo de volta'}
        </h1>
        <p className="text-slate-500">
          {isSignUp 
            ? 'Junte-se à Cesta Inteligente e comece a economizar' 
            : 'Acesse sua conta para gerenciar suas listas e preços'}
        </p>
      </div>

      <Card className="p-6 shadow-xl border-slate-100">
        {successMessage ? (
          <div className="text-center space-y-4 py-4">
            <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <p className="text-slate-600 font-medium">{successMessage}</p>
            <Button onClick={() => setSuccessMessage(null)} className="w-full">
              Ir para o Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <>
                <Input
                  label="Nome completo"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  icon={<User size={18} />}
                  required
                />
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo de Perfil</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('user')}
                      className={`flex items-center justify-center space-x-2 p-3 rounded-2xl border-2 transition-all relative ${
                        role === 'user' 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      <User size={18} />
                      <span className="font-bold text-sm">Usuário</span>
                      {role === 'user' && (
                        <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-0.5 shadow-sm">
                          <CheckCircle2 size={12} />
                        </div>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('market')}
                      className={`flex items-center justify-center space-x-2 p-3 rounded-2xl border-2 transition-all relative ${
                        role === 'market' 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      <Store size={18} />
                      <span className="font-bold text-sm">Mercado</span>
                      {role === 'market' && (
                        <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-0.5 shadow-sm">
                          <CheckCircle2 size={12} />
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={18} />}
              required
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={18} />}
              required
            />

            {error && (
              <div className="p-3 bg-red-50 text-red-500 text-xs font-medium rounded-xl border border-red-100 flex items-start space-x-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-lg shadow-lg shadow-primary/20" 
              isLoading={loading}
            >
              {isSignUp ? (role === 'market' ? 'Criar conta de Mercado' : 'Criar conta de Usuário') : 'Entrar'}
              <ArrowRight size={20} className="ml-2" />
            </Button>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="text-sm font-bold text-primary hover:underline"
              >
                {isSignUp 
                  ? 'Já tem uma conta? Entre aqui' 
                  : 'Não tem uma conta? Crie agora'}
              </button>
            </div>
          </form>
        )}
      </Card>
      
      <p className="text-center text-[10px] text-slate-400 mt-8 uppercase font-bold tracking-widest">
        Segurança garantida por Supabase Auth
      </p>
    </motion.div>
  );
};
