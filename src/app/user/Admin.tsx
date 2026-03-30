import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/hooks/use-toast';
import { db } from "@/auth/firebase";
import { collection, getDocs, doc, updateDoc, orderBy, query } from "firebase/firestore";

// Use the Project's shared Temple and Submission types
import { Temple, TempleSubmission } from "@/types";
import { getTranslatedValue } from "@/shared/utils/translationUtils";
import { useTranslation } from "react-i18next";

export default function Admin() {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [submissions, setSubmissions] = useState<TempleSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const langCode = i18n?.language?.includes('hi') ? 'hi' : i18n?.language?.includes('mr') ? 'mr' : 'en';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [templesSnap, submissionsSnap] = await Promise.all([
        getDocs(query(collection(db, "temples"), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "temple_submissions"), orderBy("createdAt", "desc")))
      ]);

      const templesData = templesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Temple[];
      const submissionsData = submissionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TempleSubmission[];

      setTemples(templesData);
      setSubmissions(submissionsData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const approveSubmission = async (submissionId: string) => {
    try {
      await updateDoc(doc(db, "temple_submissions", submissionId), {
        status: 'approved',
        reviewed_at: new Date().toISOString()
      });

      toast({
        title: 'Success',
        description: 'Submission approved successfully',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const rejectSubmission = async (submissionId: string) => {
    try {
      await updateDoc(doc(db, "temple_submissions", submissionId), {
        status: 'rejected',
        reviewed_at: new Date().toISOString()
      });

      toast({
        title: 'Success',
        description: 'Submission rejected',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const togglePublish = async (templeId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "temples", templeId), {
        is_published: !currentStatus
      });

      toast({
        title: 'Success',
        description: `Temple ${!currentStatus ? 'published' : 'unpublished'} successfully`,
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <Button onClick={signOut} variant="outline">Logout</Button>
      </div>

      <Tabs defaultValue="temples" className="w-full">
        <TabsList>
          <TabsTrigger value="temples">Temples ({temples.length})</TabsTrigger>
          <TabsTrigger value="submissions">
            Submissions ({submissions.filter(s => s.status === 'pending').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="temples" className="space-y-4">
          {temples.map((temple) => (
            <Card key={temple.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{getTranslatedValue(temple.name, langCode)}</CardTitle>
                    <CardDescription>{getTranslatedValue(typeof temple.location === 'string' ? temple.location : (temple.location as any)?.address || temple.city, langCode)}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={temple.is_published ? 'default' : 'secondary'}>
                      {temple.is_published ? 'Published' : 'Draft'}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => togglePublish(temple.id, temple.is_published || false)}
                    >
                      {temple.is_published ? 'Unpublish' : 'Publish'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  District: {getTranslatedValue(temple.district, langCode)} | Taluka: {getTranslatedValue(temple.taluka, langCode)}
                </p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          {submissions.filter(s => s.status === 'pending').map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{submission.submission_type}</CardTitle>
                    <CardDescription>
                      Submitted on {new Date(submission.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge>{submission.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <pre className="text-sm bg-muted p-3 rounded">
                    {JSON.stringify(submission.data, null, 2)}
                  </pre>
                  {submission.notes && (
                    <p className="text-sm text-muted-foreground">Notes: {submission.notes}</p>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={() => approveSubmission(submission.id)}>
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => rejectSubmission(submission.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {submissions.filter(s => s.status === 'pending').length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending submissions
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
