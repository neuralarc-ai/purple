'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Download } from 'lucide-react';

interface FeedbackTicket {
  id: string;
  issue_type: string;
  description: string;
  shared_link: string | null;
  email: string;
  screenshot_path: string | null;
  screenshot_url: string | null;
  status: string;
  priority: string;
  created_at: string;
  user_id: string;
}

export default function FeedbackAdminPage() {
  const [tickets, setTickets] = useState<FeedbackTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tickets:', error);
        return;
      }

      setTickets(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-muted-foreground">Loading feedback tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Feedback Tickets</h1>
          <p className="text-muted-foreground mt-2">
            Manage and review user feedback submissions
          </p>
        </div>

        <div className="grid gap-6">
          {tickets.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No feedback tickets found.</p>
              </CardContent>
            </Card>
          ) : (
            tickets.map((ticket) => (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{ticket.issue_type}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {ticket.screenshot_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(ticket.screenshot_url!, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Screenshot
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Description:</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {ticket.description}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-1">Email:</h4>
                        <p className="text-sm text-muted-foreground">{ticket.email}</p>
                      </div>
                      
                      {ticket.shared_link && (
                        <div>
                          <h4 className="font-medium mb-1">Shared Link:</h4>
                          <a 
                            href={ticket.shared_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {ticket.shared_link}
                          </a>
                        </div>
                      )}
                    </div>

                    {ticket.screenshot_path && (
                      <div>
                        <h4 className="font-medium mb-2">Screenshot:</h4>
                        <div className="flex items-center gap-2">
                          <img
                            src={ticket.screenshot_url!}
                            alt="Screenshot"
                            className="max-w-xs max-h-32 object-contain border rounded"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = ticket.screenshot_url!;
                              link.download = `screenshot-${ticket.id}`;
                              link.click();
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
