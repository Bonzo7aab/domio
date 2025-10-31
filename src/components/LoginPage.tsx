import React from 'react';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { loginAction } from '../lib/auth/actions';

interface LoginPageProps {
  searchParams?: {
    error?: string;
    message?: string;
    redirectTo?: string;
  };
}

export function LoginPage({ searchParams }: LoginPageProps) {
  const error = searchParams?.error;
  const message = searchParams?.message;
  const redirectTo = searchParams?.redirectTo || '/';

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Zaloguj się
            </h1>
            <p className="text-slate-600">
              Wprowadź swoje dane aby się zalogować
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {message && (
            <Alert className="mb-6">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {/* Login Form Card */}
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardContent className="p-6">
              <form className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-900">
                    Adres email *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="twoj@email.pl"
                      className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-slate-600"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-900">
                    Hasło *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-slate-600"
                      required
                    />
                  </div>
                </div>

                <input type="hidden" name="redirectTo" value={redirectTo} />

                <Button 
                  formAction={loginAction} 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200"
                  type="submit"
                >
                  <User className="mr-2 h-5 w-5" />
                  Zaloguj się
                </Button>
              </form>

              <div className="mt-6 text-center">
                <a 
                  href="/forgot-password" 
                  className="text-sm text-slate-500 hover:text-slate-700 hover:underline transition-colors"
                >
                  Zapomniałeś hasła?
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <span className="text-slate-600">Nie masz konta? </span>
            <a 
              href="/register" 
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
            >
              Zarejestruj się
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;