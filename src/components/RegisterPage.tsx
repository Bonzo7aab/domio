'use client'

import React, { useState, useTransition } from 'react';
import { Building, User, Phone, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { registerAction } from '../lib/auth/actions';

interface RegisterPageProps {
  searchParams?: {
    error?: string;
    message?: string;
    userType?: 'contractor' | 'manager';
  };
}

export function RegisterPage({ searchParams }: RegisterPageProps) {
  const error = searchParams?.error;
  const message = searchParams?.message;
  const defaultUserType = searchParams?.userType || 'contractor';
  
  const [selectedUserType, setSelectedUserType] = useState<'contractor' | 'manager'>(defaultUserType);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Utwórz konto
            </h1>
            <p className="text-slate-600">
              Wypełnij formularz aby założyć nowe konto
            </p>
          </div>

          {/* Alerts */}
          {(error || formError) && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error || formError}</AlertDescription>
            </Alert>
          )}
          
          {message && (
            <Alert className="mb-6">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {/* Registration Form */}
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardContent className="p-6">
              <form action={async (formData) => {
                setFormError(null);
                startTransition(async () => {
                  try {
                    await registerAction(formData);
                    // If successful, the function will redirect
                  } catch (error) {
                    // Handle any unexpected errors
                    setFormError('Wystąpił nieoczekiwany błąd. Spróbuj ponownie.');
                  }
                });
              }} className="space-y-6">
                {/* Hidden userType input */}
                <input type="hidden" name="userType" value={selectedUserType} />
                
                {/* User Type Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-900">
                    Typ konta
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="radio"
                        name="userType"
                        value="manager"
                        id="manager"
                        checked={selectedUserType === 'manager'}
                        onChange={() => setSelectedUserType('manager')}
                        className="sr-only peer"
                      />
                      <Label
                        htmlFor="manager"
                        className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg cursor-pointer transition-all duration-200 peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:border-blue-300"
                      >
                        <div className="w-6 h-6 rounded-full border-2 border-slate-300 peer-checked:border-blue-500 peer-checked:bg-blue-500 flex items-center justify-center">
                          {selectedUserType === 'manager' && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <Building className="h-5 w-5 text-slate-600" />
                        <div>
                          <h3 className="font-medium text-slate-900">Zarządca</h3>
                          <p className="text-xs text-slate-600">Zarządzanie nieruchomościami</p>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="relative">
                      <input
                        type="radio"
                        name="userType"
                        value="contractor"
                        id="contractor"
                        checked={selectedUserType === 'contractor'}
                        onChange={() => setSelectedUserType('contractor')}
                        className="sr-only peer"
                      />
                      <Label
                        htmlFor="contractor"
                        className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg cursor-pointer transition-all duration-200 peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:border-blue-300"
                      >
                        <div className="w-6 h-6 rounded-full border-2 border-slate-300 peer-checked:border-blue-500 peer-checked:bg-blue-500 flex items-center justify-center">
                          {selectedUserType === 'contractor' && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <User className="h-5 w-5 text-slate-600" />
                        <div>
                          <h3 className="font-medium text-slate-900">Wykonawca</h3>
                          <p className="text-xs text-slate-600">Świadczenie usług</p>
                        </div>
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-slate-900">
                      Imię *
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="Jan"
                      className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-slate-600"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-slate-900">
                      Nazwisko *
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Kowalski"
                      className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-slate-600"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
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

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-900">
                    Telefon
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+48 123 456 789"
                      className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-slate-600"
                    />
                  </div>
                </div>

                {/* Company */}
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-medium text-slate-900">
                    {selectedUserType === 'manager' ? 'Zarząd/Firma' : 'Firma'}
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <Input
                      id="company"
                      name="company"
                      placeholder={selectedUserType === 'manager' ? 'Zarząd Nieruchomości ABC' : 'Firma Budowlana ABC'}
                      className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-slate-600"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-900">
                    Hasło *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Co najmniej 6 znaków"
                      className="pl-10 pr-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-slate-600"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div> 

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-900">
                    Potwierdź hasło *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Powtórz hasło"
                      className="pl-10 pr-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-slate-600"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit"
                  disabled={isPending}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 group disabled:opacity-50"
                >
                  <User className="mr-2 h-5 w-5" />
                  {isPending ? 'Tworzenie konta...' : 'Utwórz konto'}
                </Button>

                {/* Terms and Conditions */}
                <div className="text-center text-sm text-slate-600">
                  Tworząc konto akceptujesz nasze{' '}
                  <a href="/terms" className="text-blue-600 hover:underline">
                    Warunki użytkowania
                  </a>
                  {' '}i{' '}
                  <a href="/privacy" className="text-blue-600 hover:underline">
                    Politykę prywatności
                  </a>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <span className="text-slate-600">Masz już konto? </span>
            <a 
              href="/login" 
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
            >
              Zaloguj się
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;