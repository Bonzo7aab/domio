"use client";

import { Building2, ClipboardList, Euro, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import { formatBudget } from '../../../types/budget';
import { getStatusBadgeConfig } from '../../../components/manager-dashboard/shared/utils';
import type { Budget } from '../../../types/budget';

interface OverviewData {
  dashboardStats: {
    totalProperties: number;
    totalUnits: number;
    activeJobs: number;
    completedJobs: number;
    avgRating: number;
    monthlyBudget: number;
  };
  recentJobs: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    budget: Budget;
    applications: number;
    deadline: string;
    address: string;
  }>;
  contractors: Array<{
    id: string;
    name: string;
    specialization: string;
    rating: number;
    completedJobs: number;
    currentJob: string;
    avatar: string;
  }>;
}

interface OverviewContentProps {
  data: OverviewData;
}

export function OverviewContent({ data }: OverviewContentProps) {
  const { dashboardStats, recentJobs, contractors } = data;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nieruchomości</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.totalUnits} lokali mieszkalnych
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktywne zlecenia</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.activeJobs}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardStats.completedJobs} zakończonych w tym roku
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocena wykonawców</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.avgRating}</div>
            <p className="text-xs text-muted-foreground">
              Średnia ocena z ostatnich projektów
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budżet miesięczny</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.monthlyBudget.toLocaleString('pl-PL')} zł</div>
            <p className="text-xs text-muted-foreground">
              Planowany na luty 2024
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Najnowsze zlecenia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentJobs.length > 0 ? recentJobs.slice(0, 3).map((job) => {
              const statusConfig = getStatusBadgeConfig(job.status);
              return (
                <div key={job.id} className="flex items-center justify-between border-b pb-3">
                  <div className="flex-1">
                    <h4 className="font-medium">{job.title}</h4>
                    <p className="text-sm text-gray-600">{job.address}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                      <span className="text-xs text-gray-500">{job.applications} ofert</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatBudget(job.budget)}</p>
                    <p className="text-xs text-gray-500">{job.deadline}</p>
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-muted-foreground text-center py-4">Brak zleceń</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sprawdzeni wykonawcy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contractors.length > 0 ? contractors.map((contractor) => (
              <div key={contractor.id} className="flex items-center gap-3 border-b pb-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={contractor.avatar} />
                  <AvatarFallback>{contractor.name.split(' ')[0][0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-medium">{contractor.name}</h4>
                  <p className="text-sm text-gray-600">{contractor.specialization}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs">{contractor.rating}</span>
                    </div>
                    <span className="text-xs text-gray-500">{contractor.completedJobs} projektów</span>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">Brak wykonawców</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
