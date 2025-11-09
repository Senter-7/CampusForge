import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import axiosClient from '../../api/axiosClient';
import { getCurrentUserId } from '../../utils/auth';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Search, Star, 
  MessageSquare, BookOpen, Award, Plus, UserPlus
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface ProfessorsProps {
  onNavigate: (page: string, id?: string) => void;
}

interface ProfessorDto {
  professorId?: number;
  name?: string;
  department?: string;
  email?: string;
  universityId?: number;
  universityName?: string;
}

interface CourseDto {
  courseId?: number;
  name?: string;
  description?: string;
  professorId?: number;
  professorName?: string;
  universityId?: number;
  universityName?: string;
}

interface RatingDto {
  ratingId?: number;
  userId?: number;
  professorId?: number;
  courseId?: number;
  ratingValue: number;
  comment?: string;
  createdAt?: string;
  userName?: string;
  professorName?: string;
  courseName?: string;
}

interface ReviewDto {
  reviewId?: number;
  userId?: number;
  userName?: string;
  ratingId?: number;
  courseDetailId?: number;
  courseDetailName?: string;
  professorId?: number;
  professorName?: string;
  title?: string;
  content: string;
  helpfulCount?: number;
  createdAt?: string;
  updatedAt?: string;
  ratingValue?: number;
}

interface ProfessorDisplay {
  professorId: number;
  name: string;
  department: string;
  email?: string;
  avatar: string;
  rating: number;
  reviews: number;
  courses: CourseDto[];
}

interface RatingFormValues {
  professorId: string;
  courseId?: string;
  ratingValue: number;
  comment: string;
}

interface ProfessorFormValues {
  name: string;
  email: string;
  department: string;
  universityId: string;
  courseName?: string;
  courseDescription?: string;
}

interface University {
  universityId: number;
  name: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
}

export function Professors({ onNavigate }: ProfessorsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [loading, setLoading] = useState(true);
  const [professors, setProfessors] = useState<ProfessorDisplay[]>([]);
  const [allCourses, setAllCourses] = useState<CourseDto[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [addProfessorDialogOpen, setAddProfessorDialogOpen] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [submittingProfessor, setSubmittingProfessor] = useState(false);
  const [reviewsDialogOpen, setReviewsDialogOpen] = useState(false);
  const [selectedProfessorForReviews, setSelectedProfessorForReviews] = useState<ProfessorDisplay | null>(null);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [isAlreadyRated, setIsAlreadyRated] = useState(false);
  const userId = getCurrentUserId();

  const { control, handleSubmit, reset, watch } = useForm<RatingFormValues>({
    defaultValues: {
      professorId: '',
      courseId: '',
      ratingValue: 5,
      comment: '',
    },
  });

  const professorForm = useForm<ProfessorFormValues>({
    defaultValues: {
      name: '',
      email: '',
      department: '',
      universityId: '',
      courseName: '',
      courseDescription: '',
    },
  });

  const selectedProfessorId = watch('professorId');

  // Fetch professors and courses
  useEffect(() => {
    fetchProfessors();
    fetchCourses();
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      const res = await axiosClient.get<University[]>('/universities');
      setUniversities(res.data || []);
    } catch (error) {
      console.error('Failed to fetch universities:', error);
    }
  };

  const fetchProfessors = async () => {
    setLoading(true);
    try {
      const [professorsRes, coursesRes] = await Promise.all([
        axiosClient.get<ProfessorDto[]>('/professors'),
        axiosClient.get<CourseDto[]>('/courses'),
      ]);

      const professorsData = professorsRes.data || [];
      const coursesData = coursesRes.data || [];
      setAllCourses(coursesData);

      // Fetch ratings for each professor
      const professorsWithRatings = await Promise.all(
        professorsData.map(async (prof) => {
          try {
            const ratingsRes = await axiosClient.get<RatingDto[]>(`/ratings/professor/${prof.professorId}`);
            const ratings = ratingsRes.data || [];
            const avgRating = ratings.length > 0
              ? ratings.reduce((sum, r) => sum + r.ratingValue, 0) / ratings.length
              : 0;

            // Get courses for this professor
            const profCourses = coursesData.filter(c => c.professorId === prof.professorId);

            return {
              professorId: prof.professorId || 0,
              name: prof.name || 'Unknown',
              department: prof.department || 'Unknown',
              email: prof.email,
              avatar: prof.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?',
              rating: Math.round(avgRating * 10) / 10,
              reviews: ratings.length,
              courses: profCourses,
            };
          } catch (error) {
            console.error(`Failed to fetch ratings for professor ${prof.professorId}:`, error);
            return {
              professorId: prof.professorId || 0,
              name: prof.name || 'Unknown',
              department: prof.department || 'Unknown',
              email: prof.email,
              avatar: prof.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?',
              rating: 0,
              reviews: 0,
              courses: coursesData.filter(c => c.professorId === prof.professorId),
            };
          }
        })
      );

      setProfessors(professorsWithRatings);
    } catch (error) {
      console.error('Failed to fetch professors:', error);
      toast.error('Failed to load professors');
      setProfessors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await axiosClient.get<CourseDto[]>('/courses');
      setAllCourses(res.data || []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const onSubmitRating = async (data: RatingFormValues) => {
    if (!userId) {
      toast.error('Please log in to submit a rating');
      return;
    }

    setSubmittingRating(true);
    try {
      const ratingData: Partial<RatingDto> = {
        professorId: data.professorId ? Number(data.professorId) : undefined,
        courseId: data.courseId ? Number(data.courseId) : undefined,
        ratingValue: data.ratingValue,
        comment: data.comment || undefined,
      };

      await axiosClient.post('/ratings', ratingData);
      toast.success('Rating submitted successfully!');
      if (data.comment && data.comment.trim()) {
        toast.info('Review created automatically from your rating comment');
      }
      setRatingDialogOpen(false);
      setRatingError(null);
      setIsAlreadyRated(false);
      reset();
      // Refresh professors to show updated ratings
      fetchProfessors();
    } catch (error: any) {
      console.error('Failed to submit rating:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to submit rating';
      const statusCode = error?.response?.status;
      
      // Handle duplicate rating (409 Conflict)
      if (statusCode === 409 || errorMessage.includes('already rated')) {
        setIsAlreadyRated(true);
        setRatingError('You have already rated this professor. You cannot submit another rating for the same professor.');
        toast.error('You have already rated this professor.');
      } else {
        setRatingError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleViewReviews = async (professor: ProfessorDisplay) => {
    setSelectedProfessorForReviews(professor);
    setReviewsDialogOpen(true);
    setLoadingReviews(true);
    try {
      const res = await axiosClient.get<ReviewDto[]>(`/reviews/professor/${professor.professorId}`);
      setReviews(res.data || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      toast.error('Failed to load reviews');
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const onSubmitProfessor = async (data: ProfessorFormValues) => {
    if (!userId) {
      toast.error('Please log in to add a professor');
      return;
    }

    setSubmittingProfessor(true);
    try {
      // First, create the professor
      const professorData: Partial<ProfessorDto> = {
        name: data.name.trim(),
        email: data.email.trim() || undefined,
        department: data.department.trim() || undefined,
        universityId: data.universityId ? Number(data.universityId) : undefined,
      };

      const professorRes = await axiosClient.post<ProfessorDto>('/professors', professorData);
      const createdProfessor = professorRes.data;

      // If course name is provided, create the course
      if (data.courseName && data.courseName.trim()) {
        try {
          const courseData: Partial<CourseDto> = {
            name: data.courseName.trim(),
            description: data.courseDescription?.trim() || undefined,
            professorId: createdProfessor.professorId,
            universityId: data.universityId ? Number(data.universityId) : undefined,
          };

          await axiosClient.post('/courses', courseData);
          toast.success('Professor and course added successfully!');
        } catch (courseError: any) {
          // If course creation fails but professor was created, show partial success
          console.error('Failed to create course:', courseError);
          toast.warning(
            `Professor added successfully, but course creation failed: ${courseError?.response?.data?.message || 'Unknown error'}`
          );
        }
      } else {
        toast.success('Professor added successfully!');
      }

      setAddProfessorDialogOpen(false);
      professorForm.reset();
      // Refresh professors list
      fetchProfessors();
      fetchCourses();
    } catch (error: any) {
      console.error('Failed to add professor:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to add professor';
      toast.error(errorMessage);
    } finally {
      setSubmittingProfessor(false);
    }
  };

  // Get courses for selected professor
  const professorCourses = selectedProfessorId
    ? allCourses.filter(c => c.professorId?.toString() === selectedProfessorId)
    : [];

  // Filter professors
  const filteredProfessors = professors.filter((prof) => {
    const matchesSearch = prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'all' || 
      prof.department.toLowerCase().includes(selectedDept.toLowerCase());
    return matchesSearch && matchesDept;
  });

  const topRated = [...filteredProfessors]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3)
    .filter(p => p.rating > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-2">Professor Ratings</h1>
        <p className="text-muted-foreground">
          Read and share reviews to help fellow students make informed decisions
        </p>
      </div>

      {/* Top Rated */}
      {topRated.length > 0 && (
      <Card className="p-6 rounded-xl shadow-sm border-border bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-5 w-5 text-primary" />
            <h3>Top Rated Professors</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
            {topRated.map((prof) => (
              <div 
                key={prof.professorId} 
                className="flex items-center gap-3 p-3 bg-card rounded-lg cursor-pointer hover:bg-muted transition-colors"
                onClick={() => onNavigate('professor-detail', String(prof.professorId))}
              >
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {prof.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{prof.name}</p>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-chart-5 fill-chart-5" />
                    <span className="text-sm">{prof.rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({prof.reviews})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      )}

      {/* Search and Filters */}
      <Card className="p-4 rounded-xl shadow-sm border-border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search professors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={addProfessorDialogOpen} onOpenChange={setAddProfessorDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-lg">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Professor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Add New Professor</DialogTitle>
                <DialogDescription>
                  Add a professor to the database. If a professor with the same email exists, it will not be duplicated.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={professorForm.handleSubmit(onSubmitProfessor)} className="flex flex-col flex-1 min-h-0">
                <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-2">
                  <div className="space-y-2">
                    <Label htmlFor="professor-name">Professor Name *</Label>
                    <Controller
                      name="name"
                      control={professorForm.control}
                      rules={{ required: 'Professor name is required' }}
                      render={({ field }) => (
                        <Input
                          id="professor-name"
                          placeholder="Dr. John Smith"
                          {...field}
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="professor-email">Email</Label>
                    <Controller
                      name="email"
                      control={professorForm.control}
                      render={({ field }) => (
                        <Input
                          id="professor-email"
                          type="email"
                          placeholder="john.smith@university.edu"
                          {...field}
                        />
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      Email is used to prevent duplicates. If a professor with this email exists, it will not be added.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="professor-department">Department</Label>
                    <Controller
                      name="department"
                      control={professorForm.control}
                      render={({ field }) => (
                        <Input
                          id="professor-department"
                          placeholder="Computer Science"
                          {...field}
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="professor-university">University</Label>
                    <Controller
                      name="universityId"
                      control={professorForm.control}
                      render={({ field }) => (
                        <Select 
                          value={field.value || undefined} 
                          onValueChange={(value: string) => field.onChange(value === "none" ? "" : value)}
                        >
                          <SelectTrigger id="professor-university">
                            <SelectValue placeholder="Select university (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {universities.map((university) => (
                              <SelectItem key={university.universityId} value={String(university.universityId)}>
                                {university.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="text-sm font-medium mb-3">Optional: Add a Course</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="course-name">Course Name</Label>
                        <Controller
                          name="courseName"
                          control={professorForm.control}
                          render={({ field }) => (
                            <Input
                              id="course-name"
                              placeholder="CS 101 - Introduction to Computer Science"
                              {...field}
                            />
                          )}
                        />
                        <p className="text-xs text-muted-foreground">
                          If a course with this name already exists for this professor, it will not be duplicated.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="course-description">Course Description</Label>
                        <Controller
                          name="courseDescription"
                          control={professorForm.control}
                          render={({ field }) => (
                            <Textarea
                              id="course-description"
                              placeholder="Course description..."
                              rows={3}
                              {...field}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-border mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-lg"
                    onClick={() => {
                      setAddProfessorDialogOpen(false);
                      professorForm.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 rounded-lg"
                    disabled={submittingProfessor}
                  >
                    {submittingProfessor ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Professor
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={ratingDialogOpen} onOpenChange={(open: boolean) => {
            setRatingDialogOpen(open);
            if (!open) {
              setRatingError(null);
              setIsAlreadyRated(false);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="rounded-lg">
                <Star className="mr-2 h-4 w-4" />
                Rate Professor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Rate a Professor</DialogTitle>
                <DialogDescription>
                  Share your experience to help other students
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmitRating)}>
              <div className="space-y-4 py-4">
                {isAlreadyRated && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <strong>Already Rated:</strong> You have already rated this professor. You cannot submit another rating for the same professor.
                    </AlertDescription>
                  </Alert>
                )}
                {ratingError && !isAlreadyRated && (
                  <Alert variant="destructive">
                    <AlertDescription>{ratingError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                    <Label htmlFor="professor">Professor *</Label>
                    <Controller
                      name="professorId"
                      control={control}
                      rules={{ required: 'Please select a professor' }}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="professor">
                            <SelectValue placeholder="Select professor" />
                          </SelectTrigger>
                          <SelectContent>
                            {professors.map((prof) => (
                              <SelectItem key={prof.professorId} value={String(prof.professorId)}>
                                {prof.name} - {prof.department}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {selectedProfessorId && professorCourses.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="course">Course (Optional)</Label>
                      <Controller
                        name="courseId"
                        control={control}
                        render={({ field }) => (
                          <Select 
                            value={field.value || undefined} 
                            onValueChange={(value: string) => field.onChange(value === "none" ? "" : value)}
                          >
                            <SelectTrigger id="course">
                              <SelectValue placeholder="Select course (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {professorCourses.map((course) => (
                                <SelectItem key={course.courseId} value={String(course.courseId)}>
                                  {course.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating *</Label>
                    <Controller
                      name="ratingValue"
                      control={control}
                      rules={{ 
                        required: 'Rating is required',
                        min: { value: 1, message: 'Rating must be at least 1' },
                        max: { value: 5, message: 'Rating must be at most 5' }
                      }}
                      render={({ field }) => (
                <div className="space-y-2">
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((value) => (
                              <Button
                                key={value}
                                type="button"
                                variant={field.value === value ? 'default' : 'outline'}
                                size="sm"
                                className="flex-1"
                                onClick={() => field.onChange(value)}
                              >
                                <Star className={`h-4 w-4 mr-1 ${field.value >= value ? 'fill-chart-5 text-chart-5' : ''}`} />
                                {value}
                              </Button>
                            ))}
                          </div>
                          <Input
                            type="number"
                            min="1"
                            max="5"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="w-20"
                          />
                </div>
                      )}
                    />
                </div>

                  <div className="space-y-2">
                    <Label htmlFor="comment">Review (Optional)</Label>
                    <Controller
                      name="comment"
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          id="comment"
                          placeholder="Share your experience..."
                          rows={4}
                          {...field}
                        />
                      )}
                    />
                </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-lg"
                    onClick={() => {
                      setRatingDialogOpen(false);
                      setRatingError(null);
                      setIsAlreadyRated(false);
                      reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 rounded-lg"
                    disabled={submittingRating || isAlreadyRated}
                  >
                    {submittingRating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : isAlreadyRated ? (
                      'Already Rated'
                    ) : (
                      'Submit Review'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={reviewsDialogOpen} onOpenChange={setReviewsDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  Reviews for {selectedProfessorForReviews?.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedProfessorForReviews?.department} • {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto py-4 pr-2">
                {loadingReviews ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No reviews yet. Be the first to review this professor!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.reviewId} className="p-4 rounded-lg border-border">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{review.userName || 'Anonymous'}</p>
                                {review.ratingValue && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-chart-5 fill-chart-5" />
                                    <span className="text-sm">{review.ratingValue}</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(review.createdAt)}
                              </p>
                            </div>
                            {review.helpfulCount !== undefined && review.helpfulCount > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {review.helpfulCount} helpful
                              </Badge>
                            )}
                          </div>
                          {review.title && (
                            <h4 className="font-medium text-sm">{review.title}</h4>
                          )}
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {review.content}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          <Button
            variant={selectedDept === 'all' ? 'default' : 'outline'}
            size="sm"
            className="rounded-lg whitespace-nowrap"
            onClick={() => setSelectedDept('all')}
          >
            All Departments
          </Button>
          {Array.from(new Set(professors.map(p => p.department))).map((dept) => (
            <Button
              key={dept}
              variant={selectedDept === dept.toLowerCase() ? 'default' : 'outline'}
              size="sm"
              className="rounded-lg whitespace-nowrap"
              onClick={() => setSelectedDept(dept.toLowerCase())}
            >
              {dept}
            </Button>
          ))}
        </div>
      </Card>

      {/* Professors Grid */}
      {filteredProfessors.length === 0 ? (
        <Card className="p-12 rounded-xl shadow-sm border-border text-center">
          <div className="max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2">No professors found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
            <Button onClick={() => { setSearchQuery(''); setSelectedDept('all'); }}>
              Clear Filters
            </Button>
          </div>
        </Card>
      ) : (
      <div className="grid md:grid-cols-2 gap-6">
          {filteredProfessors.map((professor) => (
            <Card 
              key={professor.professorId} 
              className="p-6 rounded-xl shadow-sm border-border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onNavigate('professor-detail', String(professor.professorId))}
            >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {professor.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="mb-1">{professor.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                      {professor.department}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-chart-5 fill-chart-5" />
                        <span>{professor.rating > 0 ? professor.rating.toFixed(1) : 'N/A'}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                        ({professor.reviews} {professor.reviews === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Courses */}
                {professor.courses.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Courses</p>
                <div className="flex flex-wrap gap-2">
                      {professor.courses.slice(0, 3).map((course) => (
                        <Badge key={course.courseId} variant="secondary" className="rounded-lg">
                          {course.name}
                    </Badge>
                  ))}
                      {professor.courses.length > 3 && (
                        <Badge variant="secondary" className="rounded-lg">
                          +{professor.courses.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

              {/* Actions */}
              <div className="pt-4 border-t border-border flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 rounded-lg"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleViewReviews(professor);
                    }}
                  >
                  <MessageSquare className="mr-2 h-4 w-4" />
                    View Reviews
                </Button>
                  {professor.courses.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 rounded-lg"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        // Navigate to courses page filtered by professor
                        onNavigate('courses');
                      }}
                    >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Courses
                </Button>
                  )}
              </div>
            </div>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}
