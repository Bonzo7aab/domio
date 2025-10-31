import {
  ArrowLeft,
  BarChart3,
  Clock,
  DollarSign,
  Eye,
  FileText,
  MapPin,
  Plus,
  Search,
  Trophy,
  Users
} from 'lucide-react';
import React, { useState } from 'react';
import { TenderStatusBadge } from './TenderStatusBadge';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// Types now imported from centralized types folder

interface TenderSystemProps {
  userRole: 'manager' | 'contractor';
  onTenderCreate?: () => void;
  onTenderSelect?: (tenderId: string) => void;
  onBidSubmit?: (tenderId: string) => void;
  onBack?: () => void;
}

import { mockTenders, Tender, TenderDocument, EvaluationCriteria, TenderStatus } from '../mocks';

export const TenderSystem: React.FC<TenderSystemProps> = ({
  userRole,
  onTenderCreate,
  onTenderSelect,
  onBidSubmit,
  onBack
}) => {
  const [tenders, setTenders] = useState<Tender[]>(mockTenders);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TenderStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Filter tenders based on search and filters
  const filteredTenders = tenders.filter(tender => {
    const matchesSearch = tender.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tender.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tender.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tender.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || tender.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(tenders.map(t => t.category)));

  // Statistics for manager dashboard
  const getStatistics = () => {
    const activeTenders = tenders.filter(t => t.status === 'active').length;
    const totalBids = tenders.reduce((sum, t) => sum + t.bidCount, 0);
    const avgBidsPerTender = totalBids / tenders.length || 0;
    const completedTenders = tenders.filter(t => t.status === 'awarded').length;
    
    return { activeTenders, totalBids, avgBidsPerTender, completedTenders };
  };

  const stats = getStatistics();

  const formatCurrency = (amount: string, currency: string) => {
    return `${parseInt(amount).toLocaleString('pl-PL')} ${currency}`;
  };

  const getDaysRemaining = (deadline: Date) => {
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleTenderClick = (tenderId: string) => {
    if (onTenderSelect) {
      onTenderSelect(tenderId);
    }
  };

  const handleBidClick = (tenderId: string) => {
    if (onBidSubmit) {
      onBidSubmit(tenderId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with statistics */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System przetargów</h1>
          <p className="text-gray-600">
            {userRole === 'manager' 
              ? 'Zarządzaj przetargami i oceniaj oferty wykonawców'
              : 'Przeglądaj i składaj oferty w przetargach'
            }
          </p>
        </div>
        
        {userRole === 'manager' && (
          <Button onClick={onTenderCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nowy przetarg
          </Button>
        )}
        
        {onBack && (
          <Button onClick={onBack} variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Wróć do listy
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Aktywne przetargi</p>
                <p className="text-2xl font-bold">{stats.activeTenders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Łączne oferty</p>
                <p className="text-2xl font-bold">{stats.totalBids}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Średnio ofert/przetarg</p>
                <p className="text-2xl font-bold">{stats.avgBidsPerTender.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Trophy className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Zakończone</p>
                <p className="text-2xl font-bold">{stats.completedTenders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Szukaj przetargów..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TenderStatus | 'all')}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie statusy</SelectItem>
                <SelectItem value="active">Aktywne</SelectItem>
                <SelectItem value="evaluation">W ocenie</SelectItem>
                <SelectItem value="awarded">Rozstrzygnięte</SelectItem>
                <SelectItem value="cancelled">Anulowane</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Kategoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie kategorie</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenders List */}
      <div className="space-y-4">
        {filteredTenders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-600 mb-2">Brak przetargów</h3>
              <p className="text-sm text-gray-500">
                Nie znaleziono przetargów spełniających wybrane kryteria
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTenders.map((tender) => (
            <Card 
              key={tender.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleTenderClick(tender.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{tender.title}</h3>
                      <TenderStatusBadge status={tender.status} />
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="font-medium">{tender.createdBy}</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{tender.location}</span>
                      </div>
                      <Badge variant="outline">{tender.category}</Badge>
                    </div>
                    
                    <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                      {tender.description}
                    </p>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span>Wartość: {formatCurrency(tender.estimatedValue, tender.currency)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{tender.bidCount} ofert</span>
                      </div>
                      
                      {tender.status === 'active' && (
                        <div className="flex items-center gap-2 text-orange-600">
                          <Clock className="h-4 w-4" />
                          <span>{getDaysRemaining(tender.submissionDeadline)} dni do końca</span>
                        </div>
                      )}

                      {tender.status === 'awarded' && tender.winnerName && (
                        <div className="flex items-center gap-2 text-green-600">
                          <Trophy className="h-4 w-4" />
                          <span>Wygrał: {tender.winnerName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-6">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTenderClick(tender.id);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Szczegóły
                    </Button>
                    
                    {userRole === 'contractor' && tender.status === 'active' && (
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBidClick(tender.id);
                        }}
                      >
                        Złóż ofertę
                      </Button>
                    )}
                    
                    {userRole === 'manager' && tender.status === 'evaluation' && (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onTenderSelect) {
                            onTenderSelect(tender.id);
                          }
                        }}
                      >
                        Oceń oferty
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TenderSystem;