import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import axiosClient from '../../api/axiosClient';
import { getCurrentUserId } from '../../utils/auth';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Textarea } from '../ui/textarea';
import { Star, ArrowLeft, MessageSquare, BookOpen, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Input } from '../ui/input';

interface ProfessorDetailProps {
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
  professorId?: number;
  professorName?: string;
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

interface RatingFormValues {
  courseId?: string;
  ratingValue: number;
  comment: string;
}

export function ProfessorDetail({ onNavigate }: ProfessorDetailProps) {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [professor, setProfessor] = useState<ProfessorDto | null>(null);
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [ratings, setRatings] = useState<RatingDto[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const userId = getCurrentUserId();

  const { control, handleSubmit, reset } = useForm<RatingFormValues>({
    defaultValues: {
      courseId: '',
      ratingValue: 5,
      comment: '',
    },
  });

  useEffect(() => {
    if (id) {
      fetchProfessorDetails();
    }
  }, [id]);

  const fetchProfessorDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [profRes, coursesRes, ratingsRes, avgRes] = await Promise.all([
        axiosClient.get<ProfessorDto>(`/professors/${id}`),
        axiosClient.get<CourseDto[]>(`/courses/professor/${id}`),
        axiosClient.get<RatingDto[]>(`/ratings/professor/${id}`),
        axiosClient.get<number>(`/ratings/professor/${id}/average`).catch(() => ({ data: 0 })),
      ]);

      setProfessor(profRes.data);
      setCourses(coursesRes.data || []);
      setRatings(ratingsRes.data || []);
      setAverageRating(avgRes.data || 0);
    } catch (error) {
      console.error('Failed to fetch professor details:', error);
      toast.error('Failed to load professor details');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitRating = async (data: RatingFormValues) => {
    if (!userId) {
      toast.error('Please log in to submit a rating');
      return;
    }

    if (!id) return;

    setSubmittingRating(true);
    try {
      const ratingData: Partial<RatingDto> = {
        professorId: Number(id),
        courseId: data.courseId ? Number(data.courseId) : undefined,
        ratingValue: data.ratingValue,
        comment: data.comment || undefined,
      };

      await axiosClient.post('/ratings', ratingData);
      toast.success('Rating submitted successfully!');
      setRatingDialogOpen(false);
      reset();
      fetchProfessorDetails(); // Refresh to show new rating
    } catch (error: any) {
      console.error('Failed to submit rating:', error);
      toast.error(error?.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!professor) {
    return (
      <Card className="p-12 rounded-xl shadow-sm border-border text-center">
        <h3 className="mb-2">Professor not found</h3>
        <Button onClick={() => onNavigate('professors')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Professors
        </Button>
      </Card>
    );
  }

  const avatar = professor.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => onNavigate('professors')} className="rounded-lg">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Professors
      </Button>

      {/* Professor Header */}
      <Card className="p-8 rounded-xl shadow-sm border-border">
        <div className="flex flex-col md:flex-row gap-6">
          <Avatar className="h-24 w-24">
            <AvatarFallback className="bg-primary/10 text-primary text-3xl">
              {avatar}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="mb-2">{professor.name}</h1>
            <p className="text-muted-foreground mb-4">
              {professor.department}
              {professor.universityName && ` • ${professor.universityName}`}
            </p>
            {professor.email && (
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Mail className="h-4 w-4" />
                <span>{professor.email}</span>
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-chart-5 fill-chart-5" />
                <span className="text-2xl font-semibold">
                  {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
                </span>
              </div>
              <span className="text-muted-foreground">
                ({ratings.length} {ratings.length === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          </div>
          <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-lg">
                <Star className="mr-2 h-4 w-4" />
                Rate Professor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Rate {professor.name}</DialogTitle>
                <DialogDescription>
                  Share your experience to help other students
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmitRating)}>
                <div className="space-y-4 py-4">
                  {courses.length > 0 && (
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
                              {courses.map((course) => (
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
                      reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 rounded-lg"
                    disabled={submittingRating}
                  >
                    {submittingRating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Review'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Courses */}
      {courses.length > 0 && (
        <Card className="p-6 rounded-xl shadow-sm border-border">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3>Courses</h3>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {courses.map((course) => (
              <Card
                key={course.courseId}
                className="p-4 rounded-lg border-border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onNavigate('course-detail', String(course.courseId))}
              >
                <h4 className="mb-2">{course.name}</h4>
                {course.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Ratings/Reviews */}
      <Card className="p-6 rounded-xl shadow-sm border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3>Reviews ({ratings.length})</h3>
          </div>
        </div>

        {ratings.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No reviews yet. Be the first to rate this professor!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {ratings.map((rating) => (
              <div key={rating.ratingId} className="pb-6 border-b border-border last:border-0 last:pb-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {rating.userName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{rating.userName || 'Anonymous'}</p>
                      {rating.courseName && (
                        <p className="text-sm text-muted-foreground">{rating.courseName}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {rating.createdAt 
                          ? new Date(rating.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })
                          : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < rating.ratingValue
                            ? 'text-chart-5 fill-chart-5'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {rating.comment && (
                  <p className="text-muted-foreground">{rating.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

