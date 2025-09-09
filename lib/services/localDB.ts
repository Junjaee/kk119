// Local Database Service using localStorage
// This service manages report and community data in the browser's local storage

export interface Report {
  id: string;
  type: string;
  title: string;
  incident_date: string;
  incident_time: string;
  location: string;
  witnesses: string;
  content: string;
  desired_action: string;
  status: 'pending' | 'processing' | 'resolved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  fileNames?: string[]; // Store only file names, not actual files
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  category: 'general' | 'experience' | 'advice' | 'legal' | 'support';
  likes: number;
  likedBy: string[]; // Array of user IDs who liked this post
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  author: string;
  authorId: string;
  likes: number;
  likedBy: string[]; // Array of user IDs who liked this comment
  createdAt: string;
  updatedAt: string;
}

const DB_KEY = 'kk119_reports';
const POSTS_DB_KEY = 'kk119_community_posts';
const COMMENTS_DB_KEY = 'kk119_community_comments';

class LocalDB {
  // Get all reports
  getAllReports(): Report[] {
    try {
      const data = localStorage.getItem(DB_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading reports from localStorage:', error);
      return [];
    }
  }

  // Get report by ID
  getReportById(id: string): Report | null {
    const reports = this.getAllReports();
    return reports.find(report => report.id === id) || null;
  }

  // Create new report
  createReport(reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Report {
    const reports = this.getAllReports();
    
    const newReport: Report = {
      ...reportData,
      id: this.generateId(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    reports.push(newReport);
    this.saveReports(reports);
    
    return newReport;
  }

  // Update report
  updateReport(id: string, updates: Partial<Omit<Report, 'id' | 'createdAt'>>): Report | null {
    const reports = this.getAllReports();
    const index = reports.findIndex(report => report.id === id);
    
    if (index === -1) {
      return null;
    }

    reports[index] = {
      ...reports[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveReports(reports);
    return reports[index];
  }

  // Delete report
  deleteReport(id: string): boolean {
    const reports = this.getAllReports();
    const filteredReports = reports.filter(report => report.id !== id);
    
    if (filteredReports.length === reports.length) {
      return false; // Report not found
    }

    this.saveReports(filteredReports);
    return true;
  }

  // Get reports by status
  getReportsByStatus(status: Report['status']): Report[] {
    const reports = this.getAllReports();
    return reports.filter(report => report.status === status);
  }

  // Get reports count by status
  getReportsCountByStatus(): { pending: number; processing: number; resolved: number; rejected: number } {
    const reports = this.getAllReports();
    
    return {
      pending: reports.filter(r => r.status === 'pending').length,
      processing: reports.filter(r => r.status === 'processing').length,
      resolved: reports.filter(r => r.status === 'resolved').length,
      rejected: reports.filter(r => r.status === 'rejected').length
    };
  }

  // Clear all reports (use with caution)
  clearAllReports(): void {
    localStorage.removeItem(DB_KEY);
  }

  // Private methods
  private saveReports(reports: Report[]): void {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(reports));
    } catch (error) {
      console.error('Error saving reports to localStorage:', error);
      throw new Error('Failed to save report');
    }
  }

  private generateId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // COMMUNITY POST METHODS
  
  // Get all posts
  getAllPosts(): CommunityPost[] {
    try {
      const data = localStorage.getItem(POSTS_DB_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading posts from localStorage:', error);
      return [];
    }
  }

  // Get post by ID
  getPostById(id: string): CommunityPost | null {
    const posts = this.getAllPosts();
    return posts.find(post => post.id === id) || null;
  }

  // Create new post
  createPost(postData: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>): CommunityPost {
    const posts = this.getAllPosts();
    
    const newPost: CommunityPost = {
      ...postData,
      id: this.generatePostId(),
      likes: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    posts.push(newPost);
    this.savePosts(posts);
    
    return newPost;
  }

  // Update post
  updatePost(id: string, updates: Partial<Omit<CommunityPost, 'id' | 'createdAt'>>): CommunityPost | null {
    const posts = this.getAllPosts();
    const index = posts.findIndex(post => post.id === id);
    
    if (index === -1) {
      return null;
    }

    posts[index] = {
      ...posts[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.savePosts(posts);
    return posts[index];
  }

  // Like/Unlike post
  togglePostLike(postId: string, userId: string): CommunityPost | null {
    const posts = this.getAllPosts();
    const index = posts.findIndex(post => post.id === postId);
    
    if (index === -1) {
      return null;
    }

    const post = posts[index];
    const hasLiked = post.likedBy.includes(userId);

    if (hasLiked) {
      post.likedBy = post.likedBy.filter(id => id !== userId);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      post.likedBy.push(userId);
      post.likes += 1;
    }

    post.updatedAt = new Date().toISOString();
    this.savePosts(posts);
    return posts[index];
  }

  // Delete post
  deletePost(id: string): boolean {
    const posts = this.getAllPosts();
    const filteredPosts = posts.filter(post => post.id !== id);
    
    if (filteredPosts.length === posts.length) {
      return false; // Post not found
    }

    // Also delete all comments for this post
    const comments = this.getAllComments();
    const filteredComments = comments.filter(comment => comment.postId !== id);
    this.saveComments(filteredComments);

    this.savePosts(filteredPosts);
    return true;
  }

  // COMMENT METHODS

  // Get all comments
  getAllComments(): Comment[] {
    try {
      const data = localStorage.getItem(COMMENTS_DB_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading comments from localStorage:', error);
      return [];
    }
  }

  // Get comments by post ID
  getCommentsByPostId(postId: string): Comment[] {
    const comments = this.getAllComments();
    return comments.filter(comment => comment.postId === postId)
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // Create new comment
  createComment(commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>): Comment {
    const comments = this.getAllComments();
    
    const newComment: Comment = {
      ...commentData,
      id: this.generateCommentId(),
      likes: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    comments.push(newComment);
    this.saveComments(comments);
    
    return newComment;
  }

  // Like/Unlike comment
  toggleCommentLike(commentId: string, userId: string): Comment | null {
    const comments = this.getAllComments();
    const index = comments.findIndex(comment => comment.id === commentId);
    
    if (index === -1) {
      return null;
    }

    const comment = comments[index];
    const hasLiked = comment.likedBy.includes(userId);

    if (hasLiked) {
      comment.likedBy = comment.likedBy.filter(id => id !== userId);
      comment.likes = Math.max(0, comment.likes - 1);
    } else {
      comment.likedBy.push(userId);
      comment.likes += 1;
    }

    comment.updatedAt = new Date().toISOString();
    this.saveComments(comments);
    return comments[index];
  }

  // Delete comment
  deleteComment(id: string): boolean {
    const comments = this.getAllComments();
    const filteredComments = comments.filter(comment => comment.id !== id);
    
    if (filteredComments.length === comments.length) {
      return false; // Comment not found
    }

    this.saveComments(filteredComments);
    return true;
  }

  // PRIVATE METHODS FOR COMMUNITY

  private savePosts(posts: CommunityPost[]): void {
    try {
      localStorage.setItem(POSTS_DB_KEY, JSON.stringify(posts));
    } catch (error) {
      console.error('Error saving posts to localStorage:', error);
      throw new Error('Failed to save post');
    }
  }

  private saveComments(comments: Comment[]): void {
    try {
      localStorage.setItem(COMMENTS_DB_KEY, JSON.stringify(comments));
    } catch (error) {
      console.error('Error saving comments to localStorage:', error);
      throw new Error('Failed to save comment');
    }
  }

  private generatePostId(): string {
    return `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCommentId(): string {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Initialize with sample data (for development/demo)
  initWithSampleData(): void {
    const existingReports = this.getAllReports();
    
    if (existingReports.length === 0) {
      const sampleReports: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          type: 'parent',
          title: '학부모 폭언 및 협박 사건',
          incident_date: '2024-03-15',
          incident_time: '14:30',
          location: '3학년 2반 교실',
          witnesses: '김○○ 선생님, 이○○ 선생님',
          content: '학생 성적 문제로 찾아온 학부모가 교실에서 큰소리로 폭언을 하며 협박하는 일이 발생했습니다. 수업 중이었으며 학생들이 모두 목격했습니다.',
          desired_action: '법적 조치 및 학교 차원의 보호 조치',
          status: 'processing',
          fileNames: []
        },
        {
          type: 'student',
          title: '학생의 수업 방해 및 폭력 행위',
          incident_date: '2024-03-10',
          incident_time: '10:20',
          location: '음악실',
          witnesses: '박○○ 학생 외 3명',
          content: '수업 중 학생이 지속적으로 수업을 방해하고, 제지하는 과정에서 교사를 밀치는 등의 폭력 행위가 있었습니다.',
          desired_action: '학생 상담 및 학부모 면담',
          status: 'resolved',
          fileNames: ['incident_report.pdf']
        },
        {
          type: 'verbal',
          title: '온라인 수업 중 욕설 사건',
          incident_date: '2024-03-05',
          incident_time: '09:00',
          location: '온라인 수업 (Zoom)',
          witnesses: '수업 참여 학생 전원',
          content: '온라인 수업 중 특정 학생이 채팅창에 교사를 향한 욕설을 반복적으로 게시했습니다. 화면 캡처 자료 보유.',
          desired_action: '학생 징계 및 사과 요구',
          status: 'pending',
          fileNames: ['screenshot1.png', 'screenshot2.png']
        }
      ];

      sampleReports.forEach(report => {
        this.createReport(report);
      });
    }

    // Initialize community sample data
    const existingPosts = this.getAllPosts();
    
    if (existingPosts.length === 0) {
      const samplePosts: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>[] = [
        {
          title: '교권 침해 대응 경험 공유',
          content: '안녕하세요. 최근 학부모 민원으로 힘든 시간을 보냈는데, 학교 상담사와 함께 체계적으로 대응한 경험을 공유하고 싶습니다. 무엇보다 혼자 감당하려 하지 말고 도움을 요청하는 것이 중요했어요.',
          author: '김선생',
          authorId: 'teacher_001',
          category: 'experience'
        },
        {
          title: '법적 대응 절차에 대해 궁금합니다',
          content: '학생으로부터 지속적인 욕설과 위협을 받고 있습니다. 여러 차례 경고했지만 개선되지 않고 있어 법적 대응을 고려하고 있는데, 어떤 절차를 거쳐야 하는지 조언 부탁드립니다.',
          author: '박교사',
          authorId: 'teacher_002',
          category: 'legal'
        },
        {
          title: '교사들의 멘탈케어가 정말 중요해요',
          content: '교권 침해를 당한 후 우울감과 불안감이 심해져서 전문 상담을 받았습니다. 교사 대상 심리상담 지원 서비스가 있으니 혼자 고민하지 마시고 도움을 받으세요. 많이 도움이 됐습니다.',
          author: '이선생님',
          authorId: 'teacher_003',
          category: 'support'
        }
      ];

      samplePosts.forEach(post => {
        this.createPost(post);
      });

      // Add sample comments
      const posts = this.getAllPosts();
      if (posts.length > 0) {
        this.createComment({
          postId: posts[0].id,
          content: '정말 좋은 경험 공유 감사합니다. 저도 비슷한 상황을 겪었는데 많은 도움이 됩니다.',
          author: '최교사',
          authorId: 'teacher_004'
        });

        this.createComment({
          postId: posts[0].id,
          content: '상담사와의 협력이 정말 중요하다는 걸 느꼈어요. 체계적인 대응 방법이 궁금합니다.',
          author: '정선생',
          authorId: 'teacher_005'
        });
      }
    }
  }
}

export const localDB = new LocalDB();