import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInterviewsByPlacementId, Interview, InterviewData, addInterview, updateInterview, deleteInterview } from '@/api/interviewService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, PlusCircle, Edit, Trash2, LinkIcon, ListChecks } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from '@/hooks/use-toast';

interface PlacementInterviewsProps {
  placementId: string;
}

const interviewSchema = z.object({
  interviewDate: z.string().min(1, "Interview date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  mode: z.string().min(1, "Mode is required"),
  meetingLink: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  shortlistedStudentsDoc: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  additionalNotes: z.string().optional(),
});

type InterviewFormData = z.infer<typeof interviewSchema>;

const PlacementInterviews: React.FC<PlacementInterviewsProps> = ({ placementId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);

  const { data: interviews, isLoading, error, refetch } = useQuery<Interview[], Error>({
    queryKey: ['interviews', placementId],
    queryFn: () => getInterviewsByPlacementId(placementId),
  });

  const addInterviewForm = useForm<InterviewFormData>({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      interviewDate: '',
      startTime: '',
      endTime: '',
      mode: 'Online',
      meetingLink: '',
      shortlistedStudentsDoc: '',
      additionalNotes: '',
    },
  });

  const editInterviewForm = useForm<InterviewFormData>({
    resolver: zodResolver(interviewSchema),
  });

  const addMutation = useMutation({
    mutationFn: (data: InterviewData) => addInterview(placementId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews', placementId] });
      toast({ title: "Success", description: "Interview added successfully." });
      setShowAddDialog(false);
      addInterviewForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to add interview.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InterviewData> }) => updateInterview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews', placementId] });
      toast({ title: "Success", description: "Interview updated successfully." });
      setEditingInterview(null);
      editInterviewForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to update interview.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInterview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews', placementId] });
      toast({ title: "Success", description: "Interview deleted successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to delete interview.", variant: "destructive" });
    },
  });

  const handleAddSubmit = (data: InterviewFormData) => {
    const interviewData: InterviewData = {
      interviewDate: data.interviewDate,
      startTime: data.startTime,
      endTime: data.endTime,
      mode: data.mode,
      meetingLink: data.meetingLink || undefined,
      shortlistedStudentsDoc: data.shortlistedStudentsDoc || undefined,
      additionalNotes: data.additionalNotes ? data.additionalNotes.split('\n').map(s => s.trim()).filter(s => s) : [],
    };
    addMutation.mutate(interviewData);
  };

  const handleEditSubmit = (data: InterviewFormData) => {
    if (!editingInterview) return;
    const interviewData: Partial<InterviewData> = {
      interviewDate: data.interviewDate,
      startTime: data.startTime,
      endTime: data.endTime,
      mode: data.mode,
      meetingLink: data.meetingLink || undefined,
      shortlistedStudentsDoc: data.shortlistedStudentsDoc || undefined,
      additionalNotes: data.additionalNotes ? data.additionalNotes.split('\n').map(s => s.trim()).filter(s => s) : [],
    };
    updateMutation.mutate({ id: editingInterview._id, data: interviewData });
  };

  const handleEdit = (interview: Interview) => {
    setEditingInterview(interview);
    editInterviewForm.reset({
      interviewDate: interview.interviewDate.split('T')[0], // Assuming ISO string, take date part
      startTime: interview.startTime,
      endTime: interview.endTime,
      mode: interview.mode,
      meetingLink: interview.meetingLink || '',
      shortlistedStudentsDoc: interview.shortlistedStudentsDoc || '',
      additionalNotes: interview.additionalNotes?.join('\n') || '',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span>Loading interview rounds...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-red-600">
        <AlertTriangle className="mr-2 h-6 w-6" />
        <span>Error loading interview rounds: {error.message}</span>
        <Button onClick={() => refetch()} variant="outline" className="mt-2">Retry</Button>
      </div>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex sm:flex-row flex-col sm:justify-between sm:items-center">
        <div>
          <CardTitle className="text-xl">Interview Rounds</CardTitle>
          <CardDescription>Details about scheduled interviews for this placement.</CardDescription>
        </div>
        {user?.role === 'admin' && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Interview
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Interview</DialogTitle>
                <DialogDescription>Schedule a new interview round for this placement.</DialogDescription>
              </DialogHeader>
              <Form {...addInterviewForm}>
                <form onSubmit={addInterviewForm.handleSubmit(handleAddSubmit)} className="space-y-4">
                  <FormField
                    control={addInterviewForm.control}
                    name="interviewDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interview Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addInterviewForm.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input placeholder="10:00 AM" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addInterviewForm.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input placeholder="12:00 PM" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={addInterviewForm.control}
                    name="mode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mode</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Online">Online</SelectItem>
                            <SelectItem value="Offline">Offline</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addInterviewForm.control}
                    name="meetingLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting Link (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://meet.google.com/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addInterviewForm.control}
                    name="shortlistedStudentsDoc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shortlisted Students Document (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Document URL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addInterviewForm.control}
                    name="additionalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes (Optional, one per line)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any additional information..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" disabled={addMutation.isPending}>
                      {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Interview
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {interviews && interviews.length > 0 ? (
          <div className="space-y-4">
            {interviews.map((interview) => (
              <Card key={interview._id} className="bg-slate-50 dark:bg-slate-800">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Interview on {new Date(interview.interviewDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </CardTitle>
                      <CardDescription>
                        {interview.startTime} - {interview.endTime} ({interview.mode})
                      </CardDescription>
                    </div>
                    {user?.role === 'admin' && (
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(interview)} className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Interview</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this interview? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(interview._id)} disabled={deleteMutation.isPending}>
                                {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {interview.meetingLink && (
                    <div className="flex items-center">
                      <LinkIcon className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all dark:text-blue-400">
                        Meeting Link
                      </a>
                    </div>
                  )}
                  {interview.shortlistedStudentsDoc && (
                    <div className="flex items-center">
                      <ListChecks className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                       <a href={interview.shortlistedStudentsDoc} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all dark:text-blue-400">
                        Shortlisted Students
                      </a>
                    </div>
                  )}
                  {interview.additionalNotes && interview.additionalNotes.length > 0 && (
                    <div>
                      <p className="font-semibold">Additional Notes:</p>
                      <ul className="list-disc list-inside pl-4">
                        {interview.additionalNotes.map((note, index) => <li key={index}>{note}</li>)}
                      </ul>
                    </div>
                  )}
                   {(!interview.meetingLink && !interview.shortlistedStudentsDoc && (!interview.additionalNotes || interview.additionalNotes.length === 0)) && (
                     <p className="text-slate-500 dark:text-slate-400 italic">No additional details provided.</p>
                   )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400">No interview rounds scheduled yet.</p>
        )}

        {/* Edit Interview Dialog */}
        <Dialog open={!!editingInterview} onOpenChange={(isOpen) => { if (!isOpen) setEditingInterview(null); }}>
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Interview</DialogTitle>
              <DialogDescription>Update the interview details.</DialogDescription>
            </DialogHeader>
            <Form {...editInterviewForm}>
              <form onSubmit={editInterviewForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                <FormField
                  control={editInterviewForm.control}
                  name="interviewDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interview Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editInterviewForm.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input placeholder="10:00 AM" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editInterviewForm.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input placeholder="12:00 PM" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editInterviewForm.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mode</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Online">Online</SelectItem>
                          <SelectItem value="Offline">Offline</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editInterviewForm.control}
                  name="meetingLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Link (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://meet.google.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editInterviewForm.control}
                  name="shortlistedStudentsDoc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shortlisted Students Document (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Document URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editInterviewForm.control}
                  name="additionalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes (Optional, one per line)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Any additional information..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" onClick={() => setEditingInterview(null)}>Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Interview
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default PlacementInterviews;
