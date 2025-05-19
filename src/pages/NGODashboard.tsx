
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  url: string;
  location: string;
  participants: {
    accepted: number;
    pending: number;
    total: number;
  };
  image?: string;
}

export default function NGODashboard() {
  const { user, token } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [completedEvents, setCompletedEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!token) return;

      try {
        const response = await fetch("https://your-api-url.com/api/event/ngo/list", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }

        const data = await response.json();
        
        // For this example, we'll mock the data structure
        const mockEvents = data.data || [];
        setEvents(mockEvents);
        
        // Filter events based on dates
        const now = new Date();
        const upcoming = mockEvents.filter((event: any) => new Date(event.endDate) >= now);
        const completed = mockEvents.filter((event: any) => new Date(event.endDate) < now);
        
        setUpcomingEvents(upcoming);
        setCompletedEvents(completed);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [token]);

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="overflow-hidden bg-amber-50">
        <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-green-800">
              Welcome, {user?.first || "Organization"}
            </h1>
            <p className="text-sm text-green-700">
              Manage your volunteer opportunities and make a difference
            </p>
          </div>
          <Button 
            asChild
            className="bg-green-600 text-white hover:bg-green-700"
          >
            <Link to="/create-event">
              <Plus className="mr-2 h-4 w-4" />
              Create an Opportunity
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-gray-500">All time events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-gray-500">Events waiting for volunteers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Volunteers</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {upcomingEvents.reduce((acc, event) => acc + event.participants?.accepted || 0, 0)}
            </div>
            <p className="text-xs text-gray-500">Across all events</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Opportunities</CardTitle>
          <CardDescription>Manage your upcoming volunteer events</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <p>Loading events...</p>
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  <div className="aspect-video w-full bg-gray-200">
                    {event.image ? (
                      <img 
                        src={event.image} 
                        alt={event.title} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-green-100 text-green-600">
                        <Calendar className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">{event.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{formatDate(event.startDate)}</span>
                      <span className="flex items-center text-blue-600">
                        <Clock className="mr-1 h-4 w-4" />
                        {event.participants?.pending || 0} pending
                      </span>
                    </div>
                    <Button 
                      asChild 
                      variant="outline" 
                      className="mt-4 w-full"
                    >
                      <Link to={`/events/${event.id}`}>Manage Event</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center p-6">
              <AlertCircle className="mb-2 h-8 w-8 text-gray-400" />
              <h3 className="text-lg font-medium">No upcoming events</h3>
              <p className="text-sm text-gray-500">Create your first volunteer opportunity</p>
              <Button 
                asChild
                className="mt-4 bg-green-600 text-white hover:bg-green-700"
              >
                <Link to="/create-event">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Events */}
      {completedEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Opportunities</CardTitle>
            <CardDescription>Review your past volunteer events</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
              {completedEvents.slice(0, 3).map((event) => (
                <Card key={event.id} className="overflow-hidden opacity-80">
                  <div className="aspect-video w-full bg-gray-200">
                    {event.image ? (
                      <img 
                        src={event.image} 
                        alt={event.title} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                        <Calendar className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base">{event.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{formatDate(event.startDate)}</span>
                      <span className="flex items-center text-green-600">
                        <CheckCircle className="mr-1 h-4 w-4" />
                        {event.participants?.accepted || 0} participated
                      </span>
                    </div>
                    <Button 
                      asChild 
                      variant="outline" 
                      className="mt-4 w-full"
                    >
                      <Link to={`/events/${event.id}`}>View Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
