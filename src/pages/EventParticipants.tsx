import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layouts/DashboardLayout';

// Define the API URL
const API_URL = "https://api.aiapplabs.io";

interface Participant {
  user: {
    uuid: string;
    first: string | null;
    avatar: string | null;
  };
  status: 'INREVIEW' | 'ACCEPTED' | 'REJECTED';
}

export default function EventParticipants() {
  const { eventId } = useParams();
  const { token } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!token || !eventId) return;

      try {
        const response = await fetch(`${API_URL}/api/event/${eventId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch participants');
        }

        const data = await response.json();
        setParticipants(data.data || []);
      } catch (error: any) {
        console.error('Error fetching participants:', error);
        toast.error(error.message || 'Failed to load participants');
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipants();
  }, [token, eventId]);

  const handleStatusUpdate = async (participantId: string, newStatus: 'ACCEPTED' | 'REJECTED') => {
    if (!token || !eventId) return;

    try {
      const response = await fetch(`${API_URL}/api/event/participant/update/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId,
          userId: participantId,
          status: newStatus
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update participant status');
      }

      // Update local state
      setParticipants(prev => 
        prev.map(p => 
          p.user.uuid === participantId 
            ? { ...p, status: newStatus }
            : p
        )
      );

      toast.success(`Participant ${newStatus.toLowerCase()}`);
    } catch (error: any) {
      console.error('Error updating participant status:', error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Event Participants</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
              </div>
            ) : participants.length > 0 ? (
              <div className="space-y-4">
                {participants.map((participant) => (
                  <div
                    key={participant.user.uuid}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gray-200">
                        {participant.user.avatar ? (
                          <img
                            src={participant.user.avatar}
                            alt={participant.user.first || 'Participant'}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-500">
                            {participant.user.first?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {participant.user.first || 'Anonymous User'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Status: {participant.status}
                        </p>
                      </div>
                    </div>
                    {participant.status === 'INREVIEW' && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          className="bg-green-50 text-green-700 hover:bg-green-100"
                          onClick={() => handleStatusUpdate(participant.user.uuid, 'ACCEPTED')}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          className="bg-red-50 text-red-700 hover:bg-red-100"
                          onClick={() => handleStatusUpdate(participant.user.uuid, 'REJECTED')}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No participants found for this event.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 