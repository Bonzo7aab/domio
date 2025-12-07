"use client";

import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';

interface Contractor {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  completedJobs: number;
  currentJob: string;
  avatar: string;
}

interface ContractorsContentProps {
  contractors: Contractor[];
}

export function ContractorsContent({ contractors }: ContractorsContentProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Wykonawcy</h2>
      </div>
      
      <div className="grid gap-4">
        {contractors.length > 0 ? (
          contractors.map((contractor) => (
            <Card key={contractor.id}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={contractor.avatar} />
                    <AvatarFallback>{contractor.name.split(' ')[0][0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{contractor.name}</h3>
                    <p className="text-gray-600 mb-2">{contractor.specialization}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{contractor.rating} • {contractor.completedJobs} projektów</span>
                      </div>
                      <Badge variant="outline">{contractor.currentJob}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Kliknij "Zobacz profil", aby zobaczyć portfolio wykonawcy
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Wyślij wiadomość</Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push(`/contractors/${contractor.id}`)}
                    >
                      Zobacz profil
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Brak wykonawców</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
