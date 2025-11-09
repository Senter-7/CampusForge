import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import axiosClient from '../../api/axiosClient';
import { getCurrentUserId } from '../../utils/auth';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Search, Star, BookOpen, Users, 
  Clock, TrendingUp, Filter 
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

interface CoursesProps {
  onNavigate: (page: string, id?: string) => void;
}

interface CourseDetailDto {
  courseId?: number;
  universityId?: number;
  universityName?: string;
  professorId?: number;
  professorName?: string;
  code?: string;
  name?: string;
  credits?: number;
  description?: string;
  rating?: number;
  reviews?: number;
  difficulty?: number;
  workload?: string;
  enrolled?: number;
  ratingContent?: number;
  ratingTeaching?: number;
  ratingAssignments?: number;
  ratingExams?: number;
  tags?: string[];
  prerequisites?: string[];
}

interface ProfessorDto {
  professorId?: number;
  name?: string;
  department?: string;
  email?: string;
  universityId?: number;
  universityName?: string;
}

interface University {
  universityId: number;
  name: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface CourseFormValues {
  code: string;
  name: string;
  credits: string;
  description: string;
  universityId: string;
  professorId: string;
  tags: string;
  prerequisites: string;
}

interface RatingFormValues {
  courseId: string;
  ratingValue: number;
  comment: string;
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

interface CourseDisplay {
  courseId: number;
  code: string;
  name: string;
  professor: string;
  professorId?: number;
  department: string;
  credits: number;
  rating: number;
  reviews: number;
  difficulty: number;
  workload: string;
  enrolled: number;
  categories: {
    content: number;
    teaching: number;
    assignments: number;
    exams: number;
  };
  tags: string[];
  prerequisites: string[];
  description: string;
}

export function Courses({ onNavigate }: CoursesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedFilter, setSelectedFilter] = useState<string>('all'); // 'all', 'high-rated'
  const [addCourseDialogOpen, setAddCourseDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [submittingCourse, setSubmittingCourse] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseDisplay[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [professors, setProfessors] = useState<ProfessorDto[]>([]);
  const [reviewsDialogOpen, setReviewsDialogOpen] = useState(false);
  const [selectedCourseForReviews, setSelectedCourseForReviews] = useState<CourseDisplay | null>(null);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [isAlreadyRated, setIsAlreadyRated] = useState(false);
  const userId = getCurrentUserId();

  const courseForm = useForm<CourseFormValues>({
    defaultValues: {
      code: '',
      name: '',
      credits: '',
      description: '',
      universityId: '',
      professorId: '',
      tags: '',
      prerequisites: '',
    },
  });

  const ratingForm = useForm<RatingFormValues>({
    defaultValues: {
      courseId: '',
      ratingValue: 5,
      comment: '',
    },
  });

  useEffect(() => {
    fetchCourses();
    fetchUniversities();
    fetchProfessors();
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
    try {
      const res = await axiosClient.get<ProfessorDto[]>('/professors');
      setProfessors(res.data || []);
    } catch (error) {
      console.error('Failed to fetch professors:', error);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get<CourseDetailDto[]>('/course-details');
      const coursesData: CourseDetailDto[] = res.data || [];
      
      // Transform to display format and fetch ratings
      const coursesWithRatings = await Promise.all(
        coursesData.map(async (course) => {
          let avgRating = course.rating || 0;
          let reviewCount = course.reviews || 0;
          
          // Try to fetch actual ratings if course has an ID
          if (course.courseId) {
            try {
              const ratingsRes = await axiosClient.get(`/ratings/course/${course.courseId}`);
              const ratings = ratingsRes.data || [];
              if (ratings.length > 0) {
                reviewCount = ratings.length;
                avgRating = ratings.reduce((sum: number, r: any) => sum + (r.ratingValue || 0), 0) / ratings.length;
              }
            } catch (error) {
              // If ratings fetch fails, use course details data
              console.log('Could not fetch ratings for course', course.courseId);
            }
          }

          // Find professor's department
          const professor = professors.find(p => p.professorId === course.professorId);
          const department = professor?.department || '';

          return {
            courseId: course.courseId || 0,
            code: course.code || 'N/A',
            name: course.name || 'Untitled Course',
            professor: course.professorName || 'TBA',
            professorId: course.professorId,
            department: department,
            credits: course.credits || 0,
            rating: avgRating,
            reviews: reviewCount,
            difficulty: course.difficulty ? Number(course.difficulty) : 0,
            workload: course.workload || 'N/A',
            enrolled: course.enrolled || 0,
            categories: {
              content: course.ratingContent ? Number(course.ratingContent) : 0,
              teaching: course.ratingTeaching ? Number(course.ratingTeaching) : 0,
              assignments: course.ratingAssignments ? Number(course.ratingAssignments) : 0,
              exams: course.ratingExams ? Number(course.ratingExams) : 0,
            },
            tags: course.tags || [],
            prerequisites: course.prerequisites || [],
            description: course.description || 'No description available',
          };
        })
      );
      
      setCourses(coursesWithRatings);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitCourse = async (data: CourseFormValues) => {
    if (!userId) {
      toast.error('Please log in to add a course');
      return;
    }

    setSubmittingCourse(true);
    try {
      const courseData: Partial<CourseDetailDto> = {
        code: data.code.trim(),
        name: data.name.trim(),
        credits: data.credits ? Number(data.credits) : undefined,
        description: data.description.trim() || undefined,
        universityId: data.universityId ? Number(data.universityId) : undefined,
        professorId: data.professorId ? Number(data.professorId) : undefined,
        tags: data.tags
          ? data.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
          : undefined,
        prerequisites: data.prerequisites
          ? data.prerequisites.split(',').map(p => p.trim()).filter(p => p.length > 0)
          : undefined,
      };

      await axiosClient.post('/course-details', courseData);
      toast.success('Course added successfully!');
      setAddCourseDialogOpen(false);
      courseForm.reset();
      // Refresh the courses list
      await fetchCourses();
    } catch (error: any) {
      console.error('Failed to add course:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to add course';
      toast.error(errorMessage);
    } finally {
      setSubmittingCourse(false);
    }
  };

  const handleRateCourse = (courseId: number) => {
    setSelectedCourseId(courseId);
    setRatingError(null);
    setIsAlreadyRated(false);
    ratingForm.reset({
      courseId: String(courseId),
      ratingValue: 5,
      comment: '',
    });
    setRatingDialogOpen(true);
  };

  const onSubmitRating = async (data: RatingFormValues) => {
    if (!userId) {
      toast.error('Please log in to submit a rating');
      return;
    }

    setSubmittingRating(true);
    try {
      const ratingData: Partial<RatingDto> = {
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
      ratingForm.reset();
      // Refresh courses to show updated ratings
      await fetchCourses();
    } catch (error: any) {
      console.error('Failed to submit rating:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to submit rating';
      const statusCode = error?.response?.status;
      
      // Handle duplicate rating (409 Conflict)
      if (statusCode === 409 || errorMessage.includes('already rated')) {
        setIsAlreadyRated(true);
        setRatingError('You have already rated this course. You cannot submit another rating for the same course.');
        toast.error('You have already rated this course.');
      } else {
        setRatingError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleViewReviews = async (course: CourseDisplay) => {
    setSelectedCourseForReviews(course);
    setReviewsDialogOpen(true);
    setLoadingReviews(true);
    try {
      const res = await axiosClient.get<ReviewDto[]>(`/reviews/course/${course.courseId}`);
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

  // Get unique departments from professors
  const getDepartments = () => {
    const deptSet = new Set<string>();
    professors.forEach(prof => {
      if (prof.department) {
        deptSet.add(prof.department);
      }
    });
    return Array.from(deptSet).sort();
  };

  // Filter courses based on search query and filters
  const filteredCourses = courses.filter((course) => {
    // Search filter - search in code, name, professor, description, tags, and prerequisites
    const searchLower = searchQuery.trim().toLowerCase();
    const matchesSearch = searchLower === '' ||
      course.code.toLowerCase().includes(searchLower) ||
      course.name.toLowerCase().includes(searchLower) ||
      course.professor.toLowerCase().includes(searchLower) ||
      course.description.toLowerCase().includes(searchLower) ||
      (course.tags && course.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
      (course.prerequisites && course.prerequisites.some(prereq => prereq.toLowerCase().includes(searchLower)));

    // Department filter - match by professor's department
    const matchesDepartment = selectedDepartment === 'all' || 
      (course.department && course.department.toLowerCase().includes(selectedDepartment.toLowerCase()));

    // Rating filter
    const matchesRating = selectedFilter === 'all' || 
      (selectedFilter === 'high-rated' && course.rating >= 4.0);

    return matchesSearch && matchesDepartment && matchesRating;
  });

  // Calculate stats (based on filtered courses for display)
  const totalCourses = courses.length;
  const filteredCount = filteredCourses.length;
  const avgRating = filteredCourses.length > 0
    ? filteredCourses.reduce((sum, c) => sum + c.rating, 0) / filteredCourses.length
    : courses.length > 0
    ? courses.reduce((sum, c) => sum + c.rating, 0) / courses.length
    : 0;
  const totalStudents = filteredCourses.reduce((sum, c) => sum + c.enrolled, 0);
  const totalReviews = filteredCourses.reduce((sum, c) => sum + c.reviews, 0);

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
        <h1 className="mb-2">Course Ratings</h1>
        <p className="text-muted-foreground">
          Explore course reviews and ratings from fellow students
          {(searchQuery || selectedDepartment !== 'all' || selectedFilter !== 'all') && (
            <span className="ml-2">
              ({filteredCount} {filteredCount === 1 ? 'course' : 'courses'} found)
            </span>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 rounded-xl shadow-sm border-border">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <p className="text-muted-foreground text-sm">Total Courses</p>
          </div>
          <p className="text-2xl">{totalCourses}</p>
        </Card>
        <Card className="p-4 rounded-xl shadow-sm border-border">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-chart-5" />
            <p className="text-muted-foreground text-sm">Avg Rating</p>
          </div>
          <p className="text-2xl">{avgRating > 0 ? avgRating.toFixed(1) : 'N/A'}</p>
        </Card>
        <Card className="p-4 rounded-xl shadow-sm border-border">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-accent" />
            <p className="text-muted-foreground text-sm">Students</p>
          </div>
          <p className="text-2xl">{totalStudents > 1000 ? `${(totalStudents / 1000).toFixed(1)}K` : totalStudents}</p>
        </Card>
        <Card className="p-4 rounded-xl shadow-sm border-border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-chart-4" />
            <p className="text-muted-foreground text-sm">Reviews</p>
          </div>
          <p className="text-2xl">{totalReviews}</p>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 rounded-xl shadow-sm border-border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses by code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={addCourseDialogOpen} onOpenChange={setAddCourseDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-lg">
                <Plus className="mr-2 h-4 w-4" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Add New Course</DialogTitle>
                <DialogDescription>
                  Add a course to the database. If a course with the same code already exists at this university, it will not be duplicated.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={courseForm.handleSubmit(onSubmitCourse)} className="flex flex-col flex-1 min-h-0">
                <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-2">
                  <div className="space-y-2">
                    <Label htmlFor="course-code">Course Code *</Label>
                    <Controller
                      name="code"
                      control={courseForm.control}
                      rules={{ required: 'Course code is required' }}
                      render={({ field }) => (
                        <Input
                          id="course-code"
                          placeholder="CS 101"
                          {...field}
                        />
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      Course code must be unique within the selected university.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course-name">Course Name *</Label>
                    <Controller
                      name="name"
                      control={courseForm.control}
                      rules={{ required: 'Course name is required' }}
                      render={({ field }) => (
                        <Input
                          id="course-name"
                          placeholder="Introduction to Computer Science"
                          {...field}
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course-credits">Credits</Label>
                    <Controller
                      name="credits"
                      control={courseForm.control}
                      render={({ field }) => (
                        <Input
                          id="course-credits"
                          type="number"
                          min="1"
                          max="6"
                          placeholder="3"
                          {...field}
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course-description">Description</Label>
                    <Controller
                      name="description"
                      control={courseForm.control}
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

                  <div className="space-y-2">
                    <Label htmlFor="course-university">University *</Label>
                    <Controller
                      name="universityId"
                      control={courseForm.control}
                      rules={{ required: 'University is required' }}
                      render={({ field }) => (
                        <Select 
                          value={field.value || undefined} 
                          onValueChange={(value: string) => field.onChange(value === "none" ? "" : value)}
                        >
                          <SelectTrigger id="course-university">
                            <SelectValue placeholder="Select university" />
                          </SelectTrigger>
                          <SelectContent>
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

                  <div className="space-y-2">
                    <Label htmlFor="course-professor">Professor</Label>
                    <Controller
                      name="professorId"
                      control={courseForm.control}
                      render={({ field }) => (
                        <Select 
                          value={field.value || undefined} 
                          onValueChange={(value: string) => field.onChange(value === "none" ? "" : value)}
                        >
                          <SelectTrigger id="course-professor">
                            <SelectValue placeholder="Select professor (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {professors.map((professor) => (
                              <SelectItem key={professor.professorId} value={String(professor.professorId)}>
                                {professor.name} {professor.department ? `- ${professor.department}` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course-tags">Tags (comma separated)</Label>
                    <Controller
                      name="tags"
                      control={courseForm.control}
                      render={({ field }) => (
                        <Input
                          id="course-tags"
                          placeholder="Theory Heavy, Coding Projects, Group Work"
                          {...field}
                        />
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate multiple tags with commas.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course-prerequisites">Prerequisites (comma separated)</Label>
                    <Controller
                      name="prerequisites"
                      control={courseForm.control}
                      render={({ field }) => (
                        <Input
                          id="course-prerequisites"
                          placeholder="CS 101, MATH 201"
                          {...field}
                        />
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate multiple prerequisites with commas (e.g., course codes).
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-border mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded-lg"
                    onClick={() => {
                      setAddCourseDialogOpen(false);
                      courseForm.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 rounded-lg"
                    disabled={submittingCourse}
                  >
                    {submittingCourse ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Course
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
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Rate a Course</DialogTitle>
                <DialogDescription>
                  Share your experience to help other students
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={ratingForm.handleSubmit(onSubmitRating)}>
                <div className="space-y-4 py-4">
                  {isAlreadyRated && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        <strong>Already Rated:</strong> You have already rated this course. You cannot submit another rating for the same course.
                      </AlertDescription>
                    </Alert>
                  )}
                  {ratingError && !isAlreadyRated && (
                    <Alert variant="destructive">
                      <AlertDescription>{ratingError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="course">Course *</Label>
                    <Controller
                      name="courseId"
                      control={ratingForm.control}
                      rules={{ required: 'Please select a course' }}
                      render={({ field }) => (
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                          disabled={selectedCourseId !== null}
                        >
                          <SelectTrigger id="course">
                            <SelectValue placeholder="Select course" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem key={course.courseId} value={String(course.courseId)}>
                                {course.code} - {course.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {selectedCourseId !== null && (
                      <p className="text-xs text-muted-foreground">
                        Rating for the selected course
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating *</Label>
                    <Controller
                      name="ratingValue"
                      control={ratingForm.control}
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
                      control={ratingForm.control}
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
                      setSelectedCourseId(null);
                      ratingForm.reset();
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
                  Reviews for {selectedCourseForReviews?.code} - {selectedCourseForReviews?.name}
                </DialogTitle>
                <DialogDescription>
                  {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto py-4 pr-2">
                {loadingReviews ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No reviews yet. Be the first to review this course!</p>
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
          <Button variant="outline" className="rounded-lg">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button 
            variant={selectedFilter === 'all' ? 'default' : 'outline'} 
            size="sm" 
            className="rounded-lg whitespace-nowrap"
            onClick={() => setSelectedFilter('all')}
          >
            All Courses
          </Button>
          <Button 
            variant={selectedFilter === 'high-rated' ? 'default' : 'outline'} 
            size="sm" 
            className="rounded-lg whitespace-nowrap"
            onClick={() => setSelectedFilter('high-rated')}
          >
            High Rated (4.0+)
          </Button>
          {selectedDepartment !== 'all' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-lg whitespace-nowrap"
              onClick={() => setSelectedDepartment('all')}
            >
              Clear Department Filter
            </Button>
          )}
        </div>
        
        {/* Department Filters */}
        {getDepartments().length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground mb-2">Filter by Department:</p>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={selectedDepartment === 'all' ? 'default' : 'outline'} 
                size="sm" 
                className="rounded-lg whitespace-nowrap"
                onClick={() => setSelectedDepartment('all')}
              >
                All Departments
              </Button>
              {getDepartments().map((dept) => (
                <Button
                  key={dept}
                  variant={selectedDepartment === dept.toLowerCase() ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-lg whitespace-nowrap"
                  onClick={() => setSelectedDepartment(dept.toLowerCase())}
                >
                  {dept}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card className="p-12 rounded-xl shadow-sm border-border text-center">
          <div className="max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2">No courses found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search' : 'No courses available yet. Be the first to add one!'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setAddCourseDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Course
              </Button>
            )}
          </div>
        </Card>
      ) : (
      <div className="grid lg:grid-cols-2 gap-6">
          {filteredCourses.map((course) => (
            <Card 
              key={course.courseId} 
              className="p-6 rounded-xl shadow-sm border-border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onNavigate('course-detail', String(course.courseId))}
            >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="rounded-lg">{course.code}</Badge>
                    <Badge variant="outline" className="rounded-lg">{course.credits} credits</Badge>
                  </div>
                  <h3 className="mb-1">{course.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {course.professor}
                    {course.department && ` • ${course.department}`}
                  </p>
                </div>
                <div className="text-right">
                  {course.rating > 0 ? (
                    <>
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="h-4 w-4 text-chart-5 fill-chart-5" />
                        <span>{course.rating.toFixed(1)}</span>
                  </div>
                      <p className="text-xs text-muted-foreground">{course.reviews} {course.reviews === 1 ? 'review' : 'reviews'}</p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">No ratings yet</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground">{course.description}</p>

              {/* Info Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Difficulty</p>
                  <div className="flex items-center gap-1">
                    <span>{course.difficulty > 0 ? course.difficulty.toFixed(1) : 'N/A'}</span>
                    {course.difficulty > 0 && <span className="text-xs text-muted-foreground">/ 5</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Workload</p>
                  <p className="text-sm">{course.workload !== 'N/A' ? course.workload : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Enrolled</p>
                  <p className="text-sm">{course.enrolled}</p>
                </div>
              </div>

              {/* Ratings Breakdown */}
              {(course.categories.content > 0 || course.categories.teaching > 0 || 
                course.categories.assignments > 0 || course.categories.exams > 0) && (
              <div className="space-y-2 pt-2">
                  {Object.entries(course.categories)
                    .filter(([_, value]) => value > 0)
                    .map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground capitalize">{key}</span>
                          <span>{Number(value).toFixed(1)}</span>
                    </div>
                        <Progress value={Number(value) * 20} className="h-1" />
                  </div>
                ))}
              </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {course.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-lg text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Prerequisites */}
              {course.prerequisites.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Prerequisites</p>
                  <div className="flex flex-wrap gap-2">
                    {course.prerequisites.map((prereq) => (
                      <Badge key={prereq} variant="outline" className="rounded-lg text-xs">
                        {prereq}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1 rounded-lg"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleViewReviews(course);
                  }}
                >
                  View Reviews
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 rounded-lg"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleRateCourse(course.courseId);
                  }}
                >
                  Rate Course
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}
