'use client'

import React, { useState } from 'react';
import { Mail, Phone, Building, Edit2, X, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { updateUserAction } from '../lib/auth/actions';
import type { AuthUser } from '../types/auth';
import { Separator } from './ui/separator';

interface ProfileFormProps {
  user: AuthUser;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Separate editing states for each section
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phone: user.phone || '',
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSavePersonal = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!profileData.firstName || !profileData.lastName) {
      setError('Imię i nazwisko są wymagane');
      setIsLoading(false);
      return;
    }

    try {
      const result = await updateUserAction({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        phone: profileData.phone || null,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Dane osobowe zostały zaktualizowane');
        setIsEditingPersonal(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Wystąpił błąd podczas aktualizacji');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveContact = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const result = await updateUserAction({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        phone: profileData.phone || null,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Dane kontaktowe zostały zaktualizowane');
        setIsEditingContact(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Wystąpił błąd podczas aktualizacji');
    } finally {
      setIsLoading(false);
    }
  };


  const handleCancelPersonal = () => {
    setProfileData(prev => ({
      ...prev,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    }));
    setIsEditingPersonal(false);
    setError('');
  };

  const handleCancelContact = () => {
    setProfileData(prev => ({
      ...prev,
      email: user.email || '',
      phone: user.phone || '',
    }));
    setIsEditingContact(false);
    setError('');
  };


  return (
    <div className="space-y-4">
      {(error || success) && (
        <Alert variant={error ? "destructive" : "default"}>
          <AlertDescription>{error || success}</AlertDescription>
        </Alert>
      )}

      {/* Personal Information Section */}
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Dane osobowe</h4>
          {!isEditingPersonal ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditingPersonal(true)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edytuj
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCancelPersonal}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Anuluj
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={handleSavePersonal}
                disabled={isLoading}
              >
                <Check className="h-4 w-4 mr-2" />
                {isLoading ? 'Zapisywanie...' : 'Zapisz'}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Imię *</Label>
            {isEditingPersonal ? (
              <Input
                id="firstName"
                name="firstName"
                value={profileData.firstName}
                onChange={handleProfileChange}
                required
              />
            ) : (
              <p className="text-sm py-2 px-3 bg-muted rounded-md">{profileData.firstName || '—'}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nazwisko *</Label>
            {isEditingPersonal ? (
              <Input
                id="lastName"
                name="lastName"
                value={profileData.lastName}
                onChange={handleProfileChange}
                required
              />
            ) : (
              <p className="text-sm py-2 px-3 bg-muted rounded-md">{profileData.lastName || '—'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Dane kontaktowe</h4>
          {!isEditingContact ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditingContact(true)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edytuj
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCancelContact}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Anuluj
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={handleSaveContact}
                disabled={isLoading}
              >
                <Check className="h-4 w-4 mr-2" />
                {isLoading ? 'Zapisywanie...' : 'Zapisz'}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Adres email *</Label>
            {isEditingContact ? (
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="pl-10"
                  required
                  disabled
                />
              </div>
            ) : (
              <div className="flex items-center py-2 px-3 bg-muted rounded-md">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <p className="text-sm">{profileData.email || '—'}</p>
              </div>
            )}
            {isEditingContact && (
              <p className="text-xs text-muted-foreground">Email nie może być zmieniony</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            {isEditingContact ? (
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  className="pl-10"
                  placeholder="+48 000 000 000"
                />
              </div>
            ) : (
              <div className="flex items-center py-2 px-3 bg-muted rounded-md">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                <p className="text-sm">{profileData.phone || 'Nie podano'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

