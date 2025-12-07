"use client";

import { CheckCircle, Edit, Euro, Eye, Loader2, MessageSquare, Send, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { formatTimeAgo } from '../../../components/contractor-dashboard/shared/utils';
import type { ContractorStats } from '../../../lib/database/contractors';

interface DashboardData {
  stats: ContractorStats;
  recentActivities: Array<{
    id: string;
    type: 'application_accepted' | 'application_rejected' | 'bid_accepted' | 'bid_rejected' | 'review_received' | 'message_received' | 'status_update';
    title: string;
    description: string;
    timestamp: Date;
    color: string;
    icon: string;
    linkUrl?: string;
  }>;
  allApplications: Array<{
    id: string;
    status: 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'cancelled';
  }>;
}

interface DashboardContentProps {
  data: DashboardData;
}

export function DashboardContent({ data }: DashboardContentProps) {
  const router = useRouter();
  const { stats, recentActivities, allApplications } = data;

  const handleMessagesClick = () => {
    router.push('/messages');
  };

  // Filter out cancelled applications
  const activeApplications = allApplications.filter(app => app.status !== 'cancelled');
  const statusCounts = {
    wyslane: activeApplications.filter(app => app.status === 'submitted').length,
    wOcenie: activeApplications.filter(app => app.status === 'under_review').length,
    zaakceptowane: activeApplications.filter(app => app.status === 'accepted').length,
    odrzucone: activeApplications.filter(app => app.status === 'rejected').length
  };
  const totalActive = activeApplications.length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktywne oferty</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-3">
              {totalActive > 0 ? totalActive : '—'}
            </div>
            {totalActive > 0 ? (
              <div className="space-y-2">
                {statusCounts.wyslane > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Wysłane:</span>
                    <span className="font-medium">{statusCounts.wyslane}</span>
                  </div>
                )}
                {statusCounts.wOcenie > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">W ocenie:</span>
                    <span className="font-medium text-yellow-600">{statusCounts.wOcenie}</span>
                  </div>
                )}
                {statusCounts.zaakceptowane > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Zaakceptowane:</span>
                    <span className="font-medium text-green-600">{statusCounts.zaakceptowane}</span>
                  </div>
                )}
                {statusCounts.odrzucone > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Odrzucone:</span>
                    <span className="font-medium text-red-600">{statusCounts.odrzucone}</span>
                  </div>
                )}
                {statusCounts.wyslane === 0 && statusCounts.wOcenie === 0 && 
                 statusCounts.zaakceptowane === 0 && statusCounts.odrzucone === 0 && (
                  <p className="text-xs text-muted-foreground">Brak aktywnych ofert</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Brak aktywnych ofert</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Miesięczne zarobki</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalEarnings > 0 
                ? `${stats.totalEarnings.toLocaleString('pl-PL')} zł`
                : '— zł'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.completedProjects > 0
                ? `${stats.completedProjects} ukończonych projektów`
                : 'Brak danych o średniej wartości'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satysfakcja klientów</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageRating > 0 
                ? `${((stats.averageRating / 5) * 100).toFixed(0)}%`
                : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.averageRating > 0
                ? `Ocena: ${stats.averageRating.toFixed(1)}/5.0`
                : 'Brak ocen'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Realizacja na czas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.onTimeCompletion > 0 
                ? `${stats.onTimeCompletion}%`
                : '—'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.completedProjects > 0
                ? `${stats.completedProjects} ukończonych projektów`
                : 'Brak ukończonych projektów'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Szybkie akcje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" onClick={() => router.push('/bookmarked-jobs')}>
              <Eye className="w-4 h-4 mr-2" />
              Przeglądaj zapisane oferty
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/account?tab=company')}>
              <Edit className="w-4 h-4 mr-2" />
              Edytuj profil firmy
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handleMessagesClick}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Sprawdź wiadomości
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ostatnie aktywności</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`flex items-center gap-3 ${activity.linkUrl ? 'cursor-pointer hover:bg-gray-50 rounded p-2 -m-2 transition-colors' : ''}`}
                    onClick={() => {
                      if (activity.linkUrl) {
                        router.push(activity.linkUrl);
                      }
                    }}
                  >
                    <div className={`w-2 h-2 ${activity.color} rounded-full`}></div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.title}</p>
                      <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Brak ostatnich aktywności</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

