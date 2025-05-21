
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

// API URL
const API_URL = "https://api.aiapplabs.io";

// Define participants interface
interface Participant {
  id: string;
  userId: string;
  eventId: string;
  status: "pending" | "approved" | "rejected";
  user: {
    uuid: string;
    email: string;
    first: string;
    last: string;
    avatar?: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface EventDetails {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  participants: {
    accepted: number;
    pending: number;
    total: number;
  };
}

export default function EventParticipants() {
  const { eventId } = useParams<{ eventId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);

  // Fetch event details and participants
  useEffect(() => {
    const fetchEventData = async () => {
      if (!token || !eventId) return;
      
      setIsLoading(true);
      
      try {
        // First fetch event details
        const eventResponse = await fetch(`${API_URL}/api/event/${eventId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!eventResponse.ok) {
          throw new Error("Failed to fetch event details");
        }
        
        const eventData = await eventResponse.json();
        console.log("Event data:", eventData);
        setEvent(eventData.data || eventData);
        
        // Then fetch participants
        const participantsResponse = await fetch(`${API_URL}/api/event/${eventId}/participants`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!participantsResponse.ok) {
          throw new Error("Failed to fetch participants");
        }
        
        const participantsData = await participantsResponse.json();
        console.log("Participants data:", participantsData);
        setParticipants(participantsData.data || participantsData || []);
      } catch (error) {
        console.error("Error fetching event data:", error);
        toast.error("Failed to load event data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEventData();
  }, [eventId, token]);
  
  // Update participant status
  const updateParticipantStatus = async (participantId: string, status: "approved" | "rejected") => {
    if (!token || !eventId) return;
    
    setUpdateLoading(participantId);
    
    try {
      const response = await fetch(`${API_URL}/api/event/participant/${participantId}/update-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update participant status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Status update response:", data);
      
      // Update local state
      setParticipants(prev => 
        prev.map(p => 
          p.id === participantId ? { ...p, status } : p
        )
      );
      
      toast.success(`Participant ${status === "approved" ? "approved" : "rejected"} successfully`);
    } catch (error) {
      console.error("Error updating participant status:", error);
      toast.error("Failed to update participant status");
    } finally {
      setUpdateLoading(null);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)} 
          className="mb-4"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>
        
        {/* Event Details Header */}
        {event && (
          <Card className="bg-green-50">
            <CardHeader>
              <CardTitle>{event.title}</CardTitle>
              <CardDescription>
                {formatDate(event.startDate)} - {formatDate(event.endDate)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{event.location}</p>
              <div className="mt-4 flex space-x-4">
                <div className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">
                    {event.participants?.accepted || 0} Approved
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">
                    {event.participants?.pending || 0} Pending
                  </span>
                </div>
                <div className="flex items-center">
                  <XCircle className="mr-2 h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">
                    {event.participants?.total - (event.participants?.accepted || 0) - (event.participants?.pending || 0)} Rejected
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Participants Table */}
        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
            <CardDescription>Manage volunteer registrations for this event</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <p>Loading participants...</p>
              </div>
            ) : participants.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered On</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map(participant => (
                    <TableRow key={participant.id}>
                      <TableCell>
                        {participant.user.first} {participant.user.last}
                      </TableCell>
                      <TableCell>{participant.user.email}</TableCell>
                      <TableCell>{participant.user.phone || "-"}</TableCell>
                      <TableCell>
                        {participant.status === "approved" && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Approved
                          </span>
                        )}
                        {participant.status === "pending" && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                            <Clock className="mr-1 h-3 w-3" />
                            Pending
                          </span>
                        )}
                        {participant.status === "rejected" && (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                            <XCircle className="mr-1 h-3 w-3" />
                            Rejected
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(participant.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {participant.status !== "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateParticipantStatus(participant.id, "approved")}
                              disabled={updateLoading === participant.id}
                              className="h-8 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Approve
                            </Button>
                          )}
                          {participant.status !== "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateParticipantStatus(participant.id, "rejected")}
                              disabled={updateLoading === participant.id}
                              className="h-8 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              Reject
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex h-40 items-center justify-center">
                <p className="text-muted-foreground">No participants have registered for this event yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
