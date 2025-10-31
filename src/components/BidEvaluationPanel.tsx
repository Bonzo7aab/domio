import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { 
  Crown, 
  Eye, 
  Download,
  Star,
  DollarSign,
  Calendar,
  Clock,
  Shield,
  Award,
  MessageSquare,
  FileText,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  X,
  Plus
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';

interface BidEvaluationPanelProps {
  tenderId: string;
  tenderTitle: string;
  evaluationCriteria: EvaluationCriterion[];
  bids: TenderBid[];
  onClose: () => void;
  onAwardTender: (bidId: string, notes: string) => void;
  onRejectBid: (bidId: string, reason: string) => void;
}

interface EvaluationCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  type: 'price' | 'quality' | 'time' | 'experience';
}

interface TenderBid {
  id: string;
  contractorId: string;
  contractorName: string;
  contractorCompany: string;
  contractorAvatar?: string;
  contractorRating: number;
  contractorCompletedJobs: number;
  totalPrice: number;
  currency: string;
  proposedTimeline: number;
  proposedStartDate: Date;
  guaranteePeriod: number;
  description: string;
  technicalProposal: string;
  attachments: BidAttachment[];
  criteriaResponses: CriteriaResponse[];
  submittedAt: Date;
  status: 'submitted' | 'under_review' | 'shortlisted' | 'rejected' | 'awarded';
  evaluation?: BidEvaluation;
}

interface BidAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

interface CriteriaResponse {
  criterionId: string;
  response: string;
}

interface BidEvaluation {
  criteriaScores: Record<string, number>; // criterionId -> score (0-100)
  totalScore: number;
  evaluatorNotes: string;
  evaluatedAt: Date;
  evaluatorId: string;
}

// Mock data
const mockBids: TenderBid[] = [
  {
    id: 'bid-1',
    contractorId: 'c-1',
    contractorName: 'Jan Kowalski',
    contractorCompany: 'BudoMaster Sp. z o.o.',
    contractorAvatar: '',
    contractorRating: 4.8,
    contractorCompletedJobs: 23,
    totalPrice: 420000,
    currency: 'PLN',
    proposedTimeline: 45,
    proposedStartDate: new Date('2024-03-01'),
    guaranteePeriod: 24,
    description: 'Kompleksowa oferta z wykorzystaniem najnowszych technologii i materiałów najwyższej jakości.',
    technicalProposal: 'Realizacja będzie przeprowadzona etapami z minimalizacją uciążliwości dla mieszkańców...',
    attachments: [
      { id: 'att-1', name: 'Portfolio_BudoMaster.pdf', type: 'portfolio', url: '#', size: 2048000 },
      { id: 'att-2', name: 'Certyfikat_ISO9001.pdf', type: 'certificates', url: '#', size: 512000 }
    ],
    criteriaResponses: [
      { criterionId: 'price', response: 'Oferujemy konkurencyjną cenę przy zachowaniu najwyższej jakości materiałów i wykonania.' },
      { criterionId: 'quality', response: 'Posiadamy 15 lat doświadczenia w remontach elewacji budynków mieszkalnych...' }
    ],
    submittedAt: new Date('2024-01-15T10:30:00'),
    status: 'submitted'
  },
  {
    id: 'bid-2',
    contractorId: 'c-2',
    contractorName: 'Anna Nowak',
    contractorCompany: 'ElewacjePro Sp. z o.o.',
    contractorAvatar: '',
    contractorRating: 4.6,
    contractorCompletedJobs: 18,
    totalPrice: 445000,
    currency: 'PLN',
    proposedTimeline: 35,
    proposedStartDate: new Date('2024-02-15'),
    guaranteePeriod: 18,
    description: 'Szybka realizacja z gwarancją terminu i jakości wykonania.',
    technicalProposal: 'Wykorzystamy zaawansowane techniki renowacji z systemem rusztowań...',
    attachments: [
      { id: 'att-3', name: 'Referencje_ElewacjePro.pdf', type: 'references', url: '#', size: 1024000 }
    ],
    criteriaResponses: [
      { criterionId: 'price', response: 'Nasza oferta zapewnia optymalne połączenie ceny i jakości.' },
      { criterionId: 'time', response: 'Gwarantujemy realizację w ciągu 35 dni roboczych...' }
    ],
    submittedAt: new Date('2024-01-16T14:20:00'),
    status: 'submitted'
  },
  {
    id: 'bid-3',
    contractorId: 'c-3',
    contractorName: 'Piotr Wiśniewski',
    contractorCompany: 'Renovate Plus',
    contractorAvatar: '',
    contractorRating: 4.9,
    contractorCompletedJobs: 31,
    totalPrice: 398000,
    currency: 'PLN',
    proposedTimeline: 50,
    proposedStartDate: new Date('2024-02-20'),
    guaranteePeriod: 36,
    description: 'Najlepsza oferta cenowa z rozszerzoną gwarancją i ekologicznymi rozwiązaniami.',
    technicalProposal: 'Zastosujemy materiały ekologiczne i energooszczędne rozwiązania...',
    attachments: [
      { id: 'att-4', name: 'Certyfikat_Ekologiczny.pdf', type: 'certificates', url: '#', size: 256000 },
      { id: 'att-5', name: 'Portfolio_2023.pdf', type: 'portfolio', url: '#', size: 3072000 }
    ],
    criteriaResponses: [
      { criterionId: 'price', response: 'Oferujemy najlepszą cenę przy zachowaniu wysokiej jakości.' },
      { criterionId: 'quality', response: 'Nasze prace są objęte 3-letnią gwarancją i certyfikatem ekologicznym...' }
    ],
    submittedAt: new Date('2024-01-18T09:45:00'),
    status: 'submitted'
  }
];

const mockCriteria: EvaluationCriterion[] = [
  { id: 'price', name: 'Cena oferty', description: 'Łączna cena realizacji', weight: 40, type: 'price' },
  { id: 'quality', name: 'Jakość wykonania', description: 'Doświadczenie i referencje', weight: 30, type: 'quality' },
  { id: 'time', name: 'Termin realizacji', description: 'Czas wykonania prac', weight: 20, type: 'time' },
  { id: 'warranty', name: 'Gwarancja', description: 'Okres gwarancji i serwis', weight: 10, type: 'quality' }
];

export const BidEvaluationPanel: React.FC<BidEvaluationPanelProps> = ({
  tenderId,
  tenderTitle,
  evaluationCriteria = mockCriteria,
  bids: initialBids = mockBids,
  onClose,
  onAwardTender,
  onRejectBid
}) => {
  const [bids, setBids] = useState<TenderBid[]>(initialBids);
  const [selectedBidId, setSelectedBidId] = useState<string | null>(null);
  const [evaluationMode, setEvaluationMode] = useState<'overview' | 'detailed' | 'compare'>('overview');
  const [selectedBidsForComparison, setSelectedBidsForComparison] = useState<string[]>([]);

  const selectedBid = selectedBidId ? bids.find(b => b.id === selectedBidId) : null;

  // Calculate automatic scores based on criteria
  const calculateAutomaticScore = (bid: TenderBid, criterion: EvaluationCriterion): number => {
    switch (criterion.type) {
      case 'price':
        const lowestPrice = Math.min(...bids.map(b => b.totalPrice));
        const priceScore = (lowestPrice / bid.totalPrice) * 100;
        return Math.min(100, Math.max(0, priceScore));
      
      case 'time':
        const shortestTime = Math.min(...bids.map(b => b.proposedTimeline));
        const timeScore = (shortestTime / bid.proposedTimeline) * 100;
        return Math.min(100, Math.max(0, timeScore));
      
      default:
        return 75; // Default score for quality/experience criteria
    }
  };

  // Calculate total score for a bid
  const calculateTotalScore = (bid: TenderBid): number => {
    let totalScore = 0;
    
    evaluationCriteria.forEach(criterion => {
      const score = bid.evaluation?.criteriaScores[criterion.id] || calculateAutomaticScore(bid, criterion);
      totalScore += (score * criterion.weight) / 100;
    });
    
    return Math.round(totalScore);
  };

  // Update evaluation score
  const updateEvaluationScore = (bidId: string, criterionId: string, score: number) => {
    setBids(prev => prev.map(bid => {
      if (bid.id === bidId) {
        const evaluation = bid.evaluation || {
          criteriaScores: {},
          totalScore: 0,
          evaluatorNotes: '',
          evaluatedAt: new Date(),
          evaluatorId: 'current-user'
        };
        
        evaluation.criteriaScores[criterionId] = score;
        evaluation.totalScore = calculateTotalScore({...bid, evaluation});
        evaluation.evaluatedAt = new Date();
        
        return { ...bid, evaluation };
      }
      return bid;
    }));
  };

  // Get sorted bids by total score
  const getSortedBids = () => {
    return [...bids].sort((a, b) => calculateTotalScore(b) - calculateTotalScore(a));
  };

  // Handle bid status change
  const updateBidStatus = (bidId: string, status: TenderBid['status']) => {
    setBids(prev => prev.map(bid => 
      bid.id === bidId ? { ...bid, status } : bid
    ));
  };

  const handleAwardTender = (bidId: string) => {
    const notes = 'Oferta wybrana jako najlepsza po szczegółowej analizie wszystkich kryteriów.';
    updateBidStatus(bidId, 'awarded');
    onAwardTender(bidId, notes);
    toast.success('Przetarg został rozstrzygnięty');
  };

  const handleRejectBid = (bidId: string) => {
    const reason = 'Oferta nie spełnia wymagań jakościowych.';
    updateBidStatus(bidId, 'rejected');
    onRejectBid(bidId, reason);
    toast.success('Oferta została odrzucona');
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toLocaleString('pl-PL')} ${currency}`;
  };

  const getStatusBadge = (status: TenderBid['status']) => {
    const configs = {
      submitted: { color: 'bg-blue-100 text-blue-700', label: 'Złożona' },
      under_review: { color: 'bg-yellow-100 text-yellow-700', label: 'W ocenie' },
      shortlisted: { color: 'bg-green-100 text-green-700', label: 'Preselekacja' },
      rejected: { color: 'bg-red-100 text-red-700', label: 'Odrzucona' },
      awarded: { color: 'bg-purple-100 text-purple-700', label: 'Wybrana' }
    };
    
    const config = configs[status];
    return <Badge className={`${config.color} border-0`}>{config.label}</Badge>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold">Ocena ofert w przetargu</h2>
              <p className="text-gray-600">{tenderTitle}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm text-gray-500">{bids.length} ofert złożonych</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <div className="border-b">
            <Tabs value={evaluationMode} onValueChange={(value) => setEvaluationMode(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Przegląd ofert</TabsTrigger>
                <TabsTrigger value="detailed">Szczegółowa ocena</TabsTrigger>
                <TabsTrigger value="compare">Porównanie</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Overview Mode */}
            {evaluationMode === 'overview' && (
              <div className="space-y-6">
                {/* Statistics */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Złożone oferty</p>
                          <p className="text-2xl font-bold">{bids.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Najniższa cena</p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(Math.min(...bids.map(b => b.totalPrice)), 'PLN')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Najkrótszy czas</p>
                          <p className="text-2xl font-bold">
                            {Math.min(...bids.map(b => b.proposedTimeline))} dni
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Star className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Średnia ocena</p>
                          <p className="text-2xl font-bold">
                            {(bids.reduce((sum, b) => sum + b.contractorRating, 0) / bids.length).toFixed(1)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Bids Ranking */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Ranking ofert
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getSortedBids().map((bid, index) => {
                        const totalScore = calculateTotalScore(bid);
                        return (
                          <div
                            key={bid.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              setSelectedBidId(bid.id);
                              setEvaluationMode('detailed');
                            }}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                index === 1 ? 'bg-gray-100 text-gray-700' :
                                index === 2 ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-50 text-gray-600'
                              }`}>
                                {index === 0 && <Crown className="h-4 w-4" />}
                                {index !== 0 && (index + 1)}
                              </div>
                              
                              <Avatar>
                                <AvatarFallback>
                                  {bid.contractorName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div>
                                <h4 className="font-medium">{bid.contractorName}</h4>
                                <p className="text-sm text-gray-600">{bid.contractorCompany}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="font-medium">{formatCurrency(bid.totalPrice, bid.currency)}</p>
                                <p className="text-sm text-gray-600">{bid.proposedTimeline} dni</p>
                              </div>
                              
                              <div className="text-right">
                                <p className="font-bold text-lg">{totalScore}/100</p>
                                <Progress value={totalScore} className="w-20 h-2" />
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {getStatusBadge(bid.status)}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBidId(bid.id);
                                    setEvaluationMode('detailed');
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Detailed Evaluation Mode */}
            {evaluationMode === 'detailed' && selectedBid && (
              <div className="space-y-6">
                {/* Bid Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{selectedBid.contractorName}</h3>
                    <p className="text-gray-600">{selectedBid.contractorCompany}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleRejectBid(selectedBid.id)}
                      disabled={selectedBid.status === 'awarded' || selectedBid.status === 'rejected'}
                    >
                      Odrzuć
                    </Button>
                    <Button 
                      onClick={() => handleAwardTender(selectedBid.id)}
                      disabled={selectedBid.status === 'awarded' || selectedBid.status === 'rejected'}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Wybierz ofertę
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {/* Evaluation Criteria */}
                  <div className="col-span-2 space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Ocena według kryteriów</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {evaluationCriteria.map(criterion => {
                          const currentScore = selectedBid.evaluation?.criteriaScores[criterion.id] || 
                                             calculateAutomaticScore(selectedBid, criterion);
                          const response = selectedBid.criteriaResponses.find(r => r.criterionId === criterion.id);
                          
                          return (
                            <div key={criterion.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{criterion.name}</h4>
                                <Badge variant="outline">{criterion.weight}%</Badge>
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-3">{criterion.description}</p>
                              
                              {response && (
                                <div className="mb-3 p-3 bg-gray-50 rounded">
                                  <p className="text-sm">{response.response}</p>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <Label>Ocena (0-100 punktów)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={currentScore}
                                    onChange={(e) => updateEvaluationScore(
                                      selectedBid.id, 
                                      criterion.id, 
                                      Number(e.target.value)
                                    )}
                                  />
                                </div>
                                <div className="text-sm text-gray-600">
                                  {((currentScore * criterion.weight) / 100).toFixed(1)} pkt
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between text-lg font-bold">
                            <span>Łączna ocena:</span>
                            <span>{calculateTotalScore(selectedBid)}/100 punktów</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Bid Details */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Szczegóły oferty</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label>Cena całkowita</Label>
                          <p className="font-bold text-lg">{formatCurrency(selectedBid.totalPrice, selectedBid.currency)}</p>
                        </div>
                        
                        <div>
                          <Label>Czas realizacji</Label>
                          <p>{selectedBid.proposedTimeline} dni</p>
                        </div>
                        
                        <div>
                          <Label>Planowany start</Label>
                          <p>{selectedBid.proposedStartDate.toLocaleDateString('pl-PL')}</p>
                        </div>
                        
                        <div>
                          <Label>Gwarancja</Label>
                          <p>{selectedBid.guaranteePeriod} miesięcy</p>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <Label>Ocena wykonawcy</Label>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{selectedBid.contractorRating}</span>
                            <span className="text-sm text-gray-500">
                              ({selectedBid.contractorCompletedJobs} projektów)
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <Label>Status</Label>
                          <div className="mt-1">
                            {getStatusBadge(selectedBid.status)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {selectedBid.attachments.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Załączniki</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {selectedBid.attachments.map(attachment => (
                              <div key={attachment.id} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  <span className="text-sm">{attachment.name}</span>
                                </div>
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Compare Mode */}
            {evaluationMode === 'compare' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Porównanie ofert</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Wybierz maksymalnie 3 oferty do porównania
                      </AlertDescription>
                    </Alert>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Kryterium</th>
                            {bids.slice(0, 3).map(bid => (
                              <th key={bid.id} className="text-center p-2">
                                <div>
                                  <p className="font-medium">{bid.contractorName}</p>
                                  <p className="text-sm text-gray-600">{bid.contractorCompany}</p>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-2 font-medium">Cena</td>
                            {bids.slice(0, 3).map(bid => (
                              <td key={bid.id} className="text-center p-2">
                                {formatCurrency(bid.totalPrice, bid.currency)}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-medium">Czas realizacji</td>
                            {bids.slice(0, 3).map(bid => (
                              <td key={bid.id} className="text-center p-2">
                                {bid.proposedTimeline} dni
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-medium">Gwarancja</td>
                            {bids.slice(0, 3).map(bid => (
                              <td key={bid.id} className="text-center p-2">
                                {bid.guaranteePeriod} miesięcy
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-medium">Ocena wykonawcy</td>
                            {bids.slice(0, 3).map(bid => (
                              <td key={bid.id} className="text-center p-2">
                                <div className="flex items-center justify-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  {bid.contractorRating}
                                </div>
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b bg-blue-50">
                            <td className="p-2 font-bold">Łączna ocena</td>
                            {bids.slice(0, 3).map(bid => (
                              <td key={bid.id} className="text-center p-2 font-bold">
                                {calculateTotalScore(bid)}/100
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Bid Selection */}
          {evaluationMode === 'detailed' && (
            <div className="border-t p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {bids.map((bid, index) => (
                    <Button
                      key={bid.id}
                      variant={selectedBidId === bid.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedBidId(bid.id)}
                    >
                      {bid.contractorName}
                    </Button>
                  ))}
                </div>
                
                <div className="text-sm text-gray-600">
                  Oferta {bids.findIndex(b => b.id === selectedBidId) + 1} z {bids.length}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BidEvaluationPanel;