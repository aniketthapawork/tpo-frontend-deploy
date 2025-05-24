import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { addPlacementSchema, AddPlacementFormData, EditPlacementPayload } from '@/components/placements/addPlacementSchema';
import { getPlacementById, updatePlacement } from '@/api/placementService';
import { PlacementDetails } from '@/components/placements/detail/placementDetailTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const EditPlacementPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<AddPlacementFormData>({
    resolver: zodResolver(addPlacementSchema),
    defaultValues: {
      title: '',
      batches: '',
      company: { name: '', description: '', website: '' },
      jobDesignation: '',
      jobDescriptionLink: '',
      eligibleBranches: '',
      eligibilityCriteria: { activeBacklogs: '', deadBacklogs: '', otherEligibilities: '' },
      ctcDetails: '',
      location: '',
      modeOfRecruitment: '',
      selectionProcess: '',
      registrationLink: '',
      notes: '',
      // applicationDeadline and tentativeDriveDate are optional
    },
  });

  const { data: placementData, isLoading: isLoadingPlacement, error: fetchError } = useQuery({
    queryKey: ['placement', id],
    queryFn: () => {
      if (!id) throw new Error("Placement ID is required.");
      return getPlacementById(id);
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (placementData?.placement) {
      const placement = placementData.placement;
      const defaultValues: Partial<AddPlacementFormData> = {
        title: placement.title,
        batches: placement.batches ? placement.batches.join(', ') : '',
        company: {
          name: placement.company.name,
          description: placement.company.description || '',
          website: placement.company.website || '',
        },
        jobDesignation: placement.jobDesignation,
        jobDescriptionLink: placement.jobDescriptionLink || '',
        eligibleBranches: placement.eligibleBranches.join(', '),
        eligibilityCriteria: {
          activeBacklogs: placement.eligibilityCriteria?.activeBacklogs || '',
          deadBacklogs: placement.eligibilityCriteria?.deadBacklogs || '',
          otherEligibilities: placement.eligibilityCriteria?.otherEligibilities?.join(', ') || '',
        },
        ctcDetails: placement.ctcDetails,
        location: placement.location || '',
        modeOfRecruitment: placement.modeOfRecruitment || '',
        tentativeDriveDate: placement.tentativeDriveDate ? new Date(placement.tentativeDriveDate) : undefined,
        applicationDeadline: placement.applicationDeadline ? new Date(placement.applicationDeadline) : undefined,
        selectionProcess: placement.driveRounds ? placement.driveRounds.join(', ') : '', // Mapped from driveRounds
        registrationLink: placement.applyLink || '', // Mapped from applyLink
        notes: placement.notes ? placement.notes.join('\n') : '', // Assuming notes are newline separated for textarea
      };
      form.reset(defaultValues);
    }
  }, [placementData, form]);

  const mutation = useMutation({
    mutationFn: (payload: EditPlacementPayload) => {
      if (!id) throw new Error("Placement ID is required for update.");
      return updatePlacement(id, payload);
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Placement updated successfully!' });
      queryClient.invalidateQueries({ queryKey: ['placements'] });
      queryClient.invalidateQueries({ queryKey: ['placement', id] });
      navigate(`/placements/${id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update placement.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: AddPlacementFormData) => {
    const payload: EditPlacementPayload = {
      ...data,
      batches: data.batches.split(',').map(s => s.trim()).filter(s => s),
      eligibleBranches: data.eligibleBranches.split(',').map(s => s.trim()).filter(s => s),
      driveRounds: data.selectionProcess ? data.selectionProcess.split(',').map(s => s.trim()).filter(s => s) : undefined,
      applyLink: data.registrationLink || undefined,
      notes: data.notes ? data.notes.split('\n').map(s => s.trim()).filter(s => s) : undefined, // Assuming newline separated for notes
      eligibilityCriteria: data.eligibilityCriteria ? {
        ...data.eligibilityCriteria,
        otherEligibilities: data.eligibilityCriteria.otherEligibilities
          ? data.eligibilityCriteria.otherEligibilities.split(',').map(s => s.trim()).filter(s => s)
          : undefined,
      } : undefined,
    };
    mutation.mutate(payload);
  };
  
  if (isLoadingPlacement) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-slate-700" />
        <p className="mt-4 text-xl text-slate-600">Loading placement details...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <AlertTriangle className="h-16 w-16 text-red-500" />
        <h2 className="mt-4 text-2xl font-semibold text-red-700">Error Loading Placement</h2>
        <p className="mt-2 text-slate-600">{fetchError.message || "Could not load placement data."}</p>
        <Link to="/placements">
          <Button variant="outline" className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Placements
          </Button>
        </Link>
      </div>
    );
  }
  
  if (!placementData && !isLoadingPlacement) {
     return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <AlertTriangle className="h-16 w-16 text-yellow-500" />
        <h2 className="mt-4 text-2xl font-semibold text-yellow-700">Placement Not Found</h2>
        <Link to="/placements">
          <Button variant="outline" className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Placements
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Placement</CardTitle>
          <CardDescription>Update the details for the placement opportunity.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placement Title</FormLabel>
                    <FormControl><Input placeholder="e.g., Software Engineer Intern" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <FormField
                control={form.control}
                name="batches"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batches (Comma-separated)</FormLabel>
                    <FormControl><Input placeholder="e.g., 2025, 2026" {...field} /></FormControl>
                    <FormDescription>Enter batch years separated by commas.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Google" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company.description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Description (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="Brief description of the company" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company.website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Website (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., https://careers.google.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobDesignation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Designation</FormLabel>
                    <FormControl><Input placeholder="e.g., SDE 1, Analyst" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobDescriptionLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description Link (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., https://company.com/job-description" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eligibleBranches"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Eligible Branches (Comma-separated)</FormLabel>
                    <FormControl><Input placeholder="e.g., CSE, ECE, IT" {...field} /></FormControl>
                    <FormDescription>Enter branch codes separated by commas.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Card className="p-4 space-y-4">
                <CardTitle className="text-lg">Eligibility Criteria (Optional)</CardTitle>
                <FormField
                  control={form.control}
                  name="eligibilityCriteria.activeBacklogs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Active Backlogs</FormLabel>
                      <FormControl><Input placeholder="e.g., None, Max 1" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="eligibilityCriteria.deadBacklogs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dead Backlogs</FormLabel>
                      <FormControl><Input placeholder="e.g., None, Max 2" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="eligibilityCriteria.otherEligibilities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Eligibilities (Comma-separated)</FormLabel>
                      <FormControl><Textarea placeholder="e.g., CGPA > 7.0, No academic gaps" {...field} rows={2} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Card>

              <FormField
                control={form.control}
                name="ctcDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CTC Details</FormLabel>
                    <FormControl><Input placeholder="e.g., 12 LPA + Benefits" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location" // Updated from jobLocation
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., Bangalore, Remote" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="modeOfRecruitment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode of Recruitment (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Online">Online</SelectItem>
                        <SelectItem value="Off-Campus">Off-Campus</SelectItem>
                        <SelectItem value="On-Campus">On-Campus</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Specify how the recruitment will be conducted.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tentativeDriveDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tentative Drive Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="applicationDeadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Application Deadline (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="selectionProcess"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selection Process (Optional, Comma-separated rounds)</FormLabel>
                    <FormControl><Textarea placeholder="e.g., Online Test, Technical Interview, HR Interview" {...field} rows={3} /></FormControl>
                    <FormDescription>Describe the stages/rounds of the selection process.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registrationLink" // This maps to applyLink from backend
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration/Apply Link (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., https://forms.gle/xyz" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional, each note on a new line)</FormLabel>
                    <FormControl><Textarea placeholder="Important notes or reminders" {...field} rows={3} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => navigate(id ? `/placements/${id}` : '/placements')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending} className="md:w-auto">
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditPlacementPage;
