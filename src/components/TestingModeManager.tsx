import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Settings, 
  TestTube2, 
  Users, 
  Shield, 
  Database, 
  Eye,
  EyeOff,
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react';
import { getDataSourceConfig } from '../lib/config/data-source';

interface TestingModeManagerProps {
  onBack: () => void;
}

interface TestingSettings {
  betaMode: boolean;
  mockData: boolean;
  debugMode: boolean;
  analyticsTracking: boolean;
  errorLogging: boolean;
  userFeedbackCollection: boolean;
  performanceMonitoring: boolean;
  featureFlags: {
    newTenderSystem: boolean;
    enhancedMap: boolean;
    advancedFilters: boolean;
    mobileOptimizations: boolean;
  };
}

export const TestingModeManager: React.FC<TestingModeManagerProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<TestingSettings>({
    betaMode: true,
    mockData: true,
    debugMode: false,
    analyticsTracking: true,
    errorLogging: true,
    userFeedbackCollection: true,
    performanceMonitoring: true,
    featureFlags: {
      newTenderSystem: true,
      enhancedMap: true,
      advancedFilters: true,
      mobileOptimizations: true
    }
  });

  const [testingStats, setTestingStats] = useState({
    activeTesters: 8,
    feedbackSubmissions: 23,
    bugsReported: 5,
    featuresRequested: 12,
    completedScenarios: 127,
    avgSessionTime: '24 min'
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('urbi-testing-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const updateSetting = (key: keyof TestingSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('urbi-testing-settings', JSON.stringify(newSettings));
    
    // Show confirmation
    console.log(`Testing setting updated: ${key} = ${value}`);
  };

  const updateFeatureFlag = (flag: keyof TestingSettings['featureFlags'], value: boolean) => {
    const newSettings = {
      ...settings,
      featureFlags: { ...settings.featureFlags, [flag]: value }
    };
    setSettings(newSettings);
    localStorage.setItem('urbi-testing-settings', JSON.stringify(newSettings));
    
    console.log(`Feature flag updated: ${flag} = ${value}`);
  };

  const resetToDefaults = () => {
    const defaultSettings: TestingSettings = {
      betaMode: true,
      mockData: true,
      debugMode: false,
      analyticsTracking: true,
      errorLogging: true,
      userFeedbackCollection: true,
      performanceMonitoring: true,
      featureFlags: {
        newTenderSystem: true,
        enhancedMap: true,
        advancedFilters: true,
        mobileOptimizations: true
      }
    };
    setSettings(defaultSettings);
    localStorage.setItem('urbi-testing-settings', JSON.stringify(defaultSettings));
  };

  const exportLogs = () => {
    const logs = {
      settings,
      testingStats,
      exportedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `urbi-testing-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={onBack} className="mb-2">
                ← Powrót
              </Button>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                Konfiguracja testów
              </h1>
              <p className="text-muted-foreground">
                Zarządzanie trybem beta i ustawieniami testowymi
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={settings.betaMode ? "default" : "secondary"}
                className={settings.betaMode ? "bg-primary" : ""}
              >
                {settings.betaMode ? "BETA AKTYWNA" : "TRYB PRODUKCYJNY"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="settings">Ustawienia</TabsTrigger>
            <TabsTrigger value="features">Feature Flags</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              {/* Beta Mode Alert */}
              <Alert className={settings.betaMode ? "border-primary bg-primary/5" : "border-warning bg-warning/5"}>
                <TestTube2 className="h-4 w-4" />
                <AlertDescription>
                  {settings.betaMode 
                    ? "Aplikacja działa w trybie BETA. Wszystkie dane są mockowane i bezpieczne do testowania."
                    : "UWAGA: Tryb produkcyjny wyłączony. Włącz go tylko po zakończeniu testów."
                  }
                </AlertDescription>
              </Alert>

              {/* Core Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Podstawowe ustawienia
                  </CardTitle>
                  <CardDescription>
                    Główne ustawienia trybu testowego i bezpieczeństwa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Tryb BETA</Label>
                        <div className="text-sm text-muted-foreground">
                          Włącza tryb testowy z mock danymi
                        </div>
                      </div>
                      <Switch
                        checked={settings.betaMode}
                        onCheckedChange={(value) => updateSetting('betaMode', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Mock dane</Label>
                        <div className="text-sm text-muted-foreground">
                          Używa przykładowych danych zamiast prawdziwych
                        </div>
                      </div>
                      <Switch
                        checked={settings.mockData}
                        onCheckedChange={(value) => updateSetting('mockData', value)}
                      />
                    </div>

                    {/* Data Source Indicator */}
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-medium">Źródło danych</Label>
                          <Badge variant={settings.mockData ? "secondary" : "default"} className="mt-1">
                            {settings.mockData ? "📦 Mock Data" : "🗄️ Database"}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(() => {
                            const config = getDataSourceConfig();
                            const sourceLabels: Record<string, string> = {
                              'localStorage': 'Local Storage',
                              'cookie': 'Cookie',
                              'env': 'Environment Variable',
                              'default': 'Default'
                            };
                            return sourceLabels[config.source] || config.source;
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Tryb debug</Label>
                        <div className="text-sm text-muted-foreground">
                          Pokazuje dodatkowe informacje diagnostyczne
                        </div>
                      </div>
                      <Switch
                        checked={settings.debugMode}
                        onCheckedChange={(value) => updateSetting('debugMode', value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Collection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-info" />
                    Zbieranie danych
                  </CardTitle>
                  <CardDescription>
                    Ustawienia zbierania danych testowych i analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Analytics tracking</Label>
                        <div className="text-sm text-muted-foreground">
                          Śledzi zachowania użytkowników (anonimowo)
                        </div>
                      </div>
                      <Switch
                        checked={settings.analyticsTracking}
                        onCheckedChange={(value) => updateSetting('analyticsTracking', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Logowanie błędów</Label>
                        <div className="text-sm text-muted-foreground">
                          Automatycznie zapisuje błędy i problemy
                        </div>
                      </div>
                      <Switch
                        checked={settings.errorLogging}
                        onCheckedChange={(value) => updateSetting('errorLogging', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Zbieranie feedback'u</Label>
                        <div className="text-sm text-muted-foreground">
                          Włącza widget feedback i zbieranie opinii
                        </div>
                      </div>
                      <Switch
                        checked={settings.userFeedbackCollection}
                        onCheckedChange={(value) => updateSetting('userFeedbackCollection', value)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Monitoring wydajności</Label>
                        <div className="text-sm text-muted-foreground">
                          Mierzy czasy ładowania i responsywność
                        </div>
                      </div>
                      <Switch
                        checked={settings.performanceMonitoring}
                        onCheckedChange={(value) => updateSetting('performanceMonitoring', value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Feature Flags Tab */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-success" />
                  Feature Flags
                </CardTitle>
                <CardDescription>
                  Włączaj/wyłączaj nowe funkcjonalności w czasie testów
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Nowy system przetargów</Label>
                      <div className="text-sm text-muted-foreground">
                        Ulepszona wersja systemu przetargowego
                      </div>
                    </div>
                    <Switch
                      checked={settings.featureFlags.newTenderSystem}
                      onCheckedChange={(value) => updateFeatureFlag('newTenderSystem', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Ulepszona mapa</Label>
                      <div className="text-sm text-muted-foreground">
                        Nowa wersja mapy z dodatkowymi funkcjami
                      </div>
                    </div>
                    <Switch
                      checked={settings.featureFlags.enhancedMap}
                      onCheckedChange={(value) => updateFeatureFlag('enhancedMap', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Zaawansowane filtry</Label>
                      <div className="text-sm text-muted-foreground">
                        Dodatkowe opcje filtrowania zleceń
                      </div>
                    </div>
                    <Switch
                      checked={settings.featureFlags.advancedFilters}
                      onCheckedChange={(value) => updateFeatureFlag('advancedFilters', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Optymalizacje mobile</Label>
                      <div className="text-sm text-muted-foreground">
                        Ulepszenia dla urządzeń mobilnych
                      </div>
                    </div>
                    <Switch
                      checked={settings.featureFlags.mobileOptimizations}
                      onCheckedChange={(value) => updateFeatureFlag('mobileOptimizations', value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Aktywni testerzy</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{testingStats.activeTesters}</div>
                  <p className="text-xs text-muted-foreground">w ostatnim tygodniu</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Feedback</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{testingStats.feedbackSubmissions}</div>
                  <p className="text-xs text-muted-foreground">opinii zebranych</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Zgłoszenia</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{testingStats.bugsReported + testingStats.featuresRequested}</div>
                  <p className="text-xs text-muted-foreground">
                    {testingStats.bugsReported} błędów, {testingStats.featuresRequested} funkcji
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Status monitoringu</CardTitle>
                <CardDescription>
                  Aktualny status systemów monitorowania
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Analytics tracking</span>
                    <Badge variant={settings.analyticsTracking ? "default" : "secondary"}>
                      {settings.analyticsTracking ? "Aktywny" : "Wyłączony"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Error logging</span>
                    <Badge variant={settings.errorLogging ? "default" : "secondary"}>
                      {settings.errorLogging ? "Aktywny" : "Wyłączony"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Performance monitoring</span>
                    <Badge variant={settings.performanceMonitoring ? "default" : "secondary"}>
                      {settings.performanceMonitoring ? "Aktywny" : "Wyłączony"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Feedback collection</span>
                    <Badge variant={settings.userFeedbackCollection ? "default" : "secondary"}>
                      {settings.userFeedbackCollection ? "Aktywny" : "Wyłączony"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-warning" />
                    Export danych testowych
                  </CardTitle>
                  <CardDescription>
                    Eksportuj logi, ustawienia i dane z testów
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Export zawiera anonimowe dane testowe, ustawienia i podstawowe statystyki.
                        Nie zawiera danych osobowych ani wrażliwych informacji.
                      </AlertDescription>
                    </Alert>

                    <div className="flex gap-2">
                      <Button onClick={exportLogs} className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Eksportuj dane testowe
                      </Button>
                      <Button variant="outline" onClick={resetToDefaults}>
                        Reset do domyślnych
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Podsumowanie konfiguracji</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>Tryb BETA: <Badge variant={settings.betaMode ? "default" : "secondary"}>{settings.betaMode ? "Włączony" : "Wyłączony"}</Badge></div>
                    <div>Mock dane: <Badge variant={settings.mockData ? "default" : "secondary"}>{settings.mockData ? "Włączone" : "Wyłączone"}</Badge></div>
                    <div>Debug mode: <Badge variant={settings.debugMode ? "default" : "secondary"}>{settings.debugMode ? "Włączony" : "Wyłączony"}</Badge></div>
                    <div>Analytics: <Badge variant={settings.analyticsTracking ? "default" : "secondary"}>{settings.analyticsTracking ? "Aktywne" : "Wyłączone"}</Badge></div>
                    <div>
                      Feature flags: {' '}
                      {Object.entries(settings.featureFlags).filter(([_, enabled]) => enabled).length} z {Object.keys(settings.featureFlags).length} włączonych
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};