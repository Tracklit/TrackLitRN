import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Mail, Users, Calendar, User, CheckCircle, XCircle, Clock } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface AffiliateSubmission {
  id: number;
  fullName: string;
  email: string;
  socialMediaHandles: string;
  audienceSize: number;
  trackLitUsername: string;
  hasTrackLitAccount: boolean;
  agreesToLOI: boolean;
  signature: string;
  assignedTier: string;
  submittedAt: string;
  formData: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewedBy?: number;
  adminNotes?: string;
  createdAt: string;
}

const tierColors = {
  'Athlete': 'bg-green-100 text-green-800 border-green-200',
  'Affiliate': 'bg-blue-100 text-blue-800 border-blue-200', 
  'Pro': 'bg-purple-100 text-purple-800 border-purple-200',
  'Champ': 'bg-orange-100 text-orange-800 border-orange-200',
  'Star': 'bg-yellow-100 text-yellow-800 border-yellow-200'
};

const statusColors = {
  'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'approved': 'bg-green-100 text-green-800 border-green-200',
  'rejected': 'bg-red-100 text-red-800 border-red-200'
};

const statusIcons = {
  'pending': Clock,
  'approved': CheckCircle,
  'rejected': XCircle
};

export default function AdminAffiliateSubmissions() {
  const [selectedSubmission, setSelectedSubmission] = useState<AffiliateSubmission | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['/api/admin/affiliate-submissions'],
    enabled: true
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: number; status: string; adminNotes?: string }) => {
      return apiRequest(`/api/admin/affiliate-submissions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, adminNotes })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/affiliate-submissions'] });
      setSelectedSubmission(null);
      setAdminNotes("");
      toast({
        title: "Status Updated",
        description: "Submission status has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update submission status.",
        variant: "destructive"
      });
    }
  });

  const handleStatusUpdate = (status: 'approved' | 'rejected') => {
    if (!selectedSubmission) return;
    
    updateStatusMutation.mutate({
      id: selectedSubmission.id,
      status,
      adminNotes
    });
  };

  const formatTierInfo = (tier: string) => {
    const tierInfo = {
      'Athlete': '$1 per referral (1,000-5,000 audience)',
      'Affiliate': '$3 per referral (5,000-10,000 audience)',
      'Pro': '$6 per referral (10,000-25,000 audience)',
      'Champ': '$6 + revenue share (25,000-100,000 audience)',
      'Star': 'Full sponsorship (100,000+ audience)'
    };
    return tierInfo[tier as keyof typeof tierInfo] || tier;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="text-slate-400 mt-2">Loading submissions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin-panel">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Panel
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Affiliate Submissions</h1>
            <p className="text-slate-400">Review and manage affiliate program applications</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total</p>
                  <p className="text-xl font-semibold text-white">{submissions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="h-4 w-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Pending</p>
                  <p className="text-xl font-semibold text-white">
                    {submissions.filter((s: AffiliateSubmission) => s.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Approved</p>
                  <p className="text-xl font-semibold text-white">
                    {submissions.filter((s: AffiliateSubmission) => s.status === 'approved').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Rejected</p>
                  <p className="text-xl font-semibold text-white">
                    {submissions.filter((s: AffiliateSubmission) => s.status === 'rejected').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions List */}
        <div className="grid gap-4">
          {submissions.map((submission: AffiliateSubmission) => {
            const StatusIcon = statusIcons[submission.status];
            
            return (
              <Card key={submission.id} className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-white text-lg">{submission.fullName}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {submission.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          @{submission.trackLitUsername}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={tierColors[submission.assignedTier as keyof typeof tierColors] || 'bg-gray-100 text-gray-800'}>
                        {submission.assignedTier}
                      </Badge>
                      <Badge className={statusColors[submission.status]}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Social Media</p>
                      <p className="text-white">{submission.socialMediaHandles}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Audience Size</p>
                      <p className="text-white">{submission.audienceSize.toLocaleString()} followers</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Tier Details</p>
                      <p className="text-white">{formatTierInfo(submission.assignedTier)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">TrackLit Account</p>
                      <p className="text-white">{submission.hasTrackLitAccount ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  {submission.adminNotes && (
                    <div className="bg-slate-800 p-3 rounded-lg">
                      <p className="text-slate-400 text-sm mb-1">Admin Notes</p>
                      <p className="text-white text-sm">{submission.adminNotes}</p>
                    </div>
                  )}

                  {submission.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setSelectedSubmission(submission)}
                        variant="outline" 
                        size="sm"
                        className="border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        Review Application
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {submissions.length === 0 && (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No affiliate submissions yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-slate-900 border-slate-800 w-full max-w-lg">
            <CardHeader>
              <CardTitle className="text-white">Review Application - {selectedSubmission.fullName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Admin Notes (Optional)</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes about this decision..."
                  className="bg-slate-800 border-slate-700 text-white"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={updateStatusMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={updateStatusMutation.isPending}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
              
              <Button
                onClick={() => {
                  setSelectedSubmission(null);
                  setAdminNotes("");
                }}
                variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}