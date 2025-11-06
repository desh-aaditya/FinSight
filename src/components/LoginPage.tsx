'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, TrendingUp, Shield, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-slate-900 to-black p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:block space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                FinSight
              </h1>
              <p className="text-emerald-300/80">Intelligent Money Management</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-emerald-900/20 backdrop-blur border border-emerald-800/30">
              <div className="p-2 bg-emerald-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-emerald-50">ML-Powered Predictions</h3>
                <p className="text-sm text-emerald-300/70">
                  Predict your future expenses with advanced machine learning algorithms
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-lg bg-emerald-900/20 backdrop-blur border border-emerald-800/30">
              <div className="p-2 bg-teal-900/30 rounded-lg">
                <Sparkles className="h-6 w-6 text-teal-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-emerald-50">AI Financial Insights</h3>
                <p className="text-sm text-emerald-300/70">
                  Get personalized recommendations to optimize your spending
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-lg bg-emerald-900/20 backdrop-blur border border-emerald-800/30">
              <div className="p-2 bg-green-900/30 rounded-lg">
                <Shield className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-emerald-50">Secure & Private</h3>
                <p className="text-sm text-emerald-300/70">
                  Your financial data is encrypted and completely secure
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <Card className="shadow-2xl border-emerald-800/50">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to manage your finances</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="aarav@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6">
              <p className="text-sm text-muted-foreground text-center mb-3">
                Quick login with demo accounts:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin('aarav@example.com')}
                  disabled={loading}
                >
                  Aarav
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin('priya@example.com')}
                  disabled={loading}
                >
                  Priya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin('rohit@example.com')}
                  disabled={loading}
                >
                  Rohit
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Password: password123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}