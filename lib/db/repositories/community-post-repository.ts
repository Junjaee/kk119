/**
 * Community Post Repository Implementation
 * Following Single Responsibility Principle - only handles community post operations
 */

import { ICommunityPostRepository, CommunityPost } from '../interfaces';
import { idGenerationService } from '../id-generation-service';
import { STORAGE_KEYS, ERROR_MESSAGES, COMMUNITY_CATEGORY } from '../constants';

/**
 * LocalStorage-based Community Post Repository
 * Following Single Responsibility Principle
 */
export class LocalCommunityPostRepository implements ICommunityPostRepository {
  /**
   * Get all posts from localStorage
   */
  async getAllPosts(): Promise<CommunityPost[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMMUNITY_POSTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading posts from localStorage:', error);
      return [];
    }
  }

  /**
   * Get post by ID
   */
  async getPostById(id: string): Promise<CommunityPost | null> {
    const posts = await this.getAllPosts();
    return posts.find(post => post.id === id) || null;
  }

  /**
   * Create new post
   */
  async createPost(postData: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>): Promise<CommunityPost | null> {
    const posts = await this.getAllPosts();

    const newPost: CommunityPost = {
      ...postData,
      id: idGenerationService.generatePostId(),
      likes: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    posts.push(newPost);
    await this.savePosts(posts);

    return newPost;
  }

  /**
   * Update post
   */
  async updatePost(id: string, updates: Partial<Omit<CommunityPost, 'id' | 'createdAt'>>): Promise<CommunityPost | null> {
    const posts = await this.getAllPosts();
    const index = posts.findIndex(post => post.id === id);

    if (index === -1) {
      return null;
    }

    posts[index] = {
      ...posts[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.savePosts(posts);
    return posts[index];
  }

  /**
   * Like/Unlike post
   */
  async togglePostLike(postId: string, userId: string): Promise<CommunityPost | null> {
    const posts = await this.getAllPosts();
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
    await this.savePosts(posts);
    return posts[index];
  }

  /**
   * Delete post
   */
  async deletePost(id: string): Promise<boolean> {
    const posts = await this.getAllPosts();
    const filteredPosts = posts.filter(post => post.id !== id);

    if (filteredPosts.length === posts.length) {
      return false; // Post not found
    }

    await this.savePosts(filteredPosts);
    return true;
  }

  /**
   * Save posts to localStorage
   * Following Single Responsibility Principle
   */
  private async savePosts(posts: CommunityPost[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_POSTS, JSON.stringify(posts));
    } catch (error) {
      console.error('Error saving posts to localStorage:', error);
      throw new Error(ERROR_MESSAGES.FAILED_TO_SAVE_POST);
    }
  }

  /**
   * Initialize with sample data (for development/demo)
   */
  async initWithSampleData(): Promise<void> {
    const existingPosts = await this.getAllPosts();

    if (existingPosts.length === 0) {
      const samplePosts: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>[] = [
        {
          title: '교권 침해 대응 경험 공유',
          content: '안녕하세요. 최근 학부모 민원으로 힘든 시간을 보냈는데, 학교 상담사와 함께 체계적으로 대응한 경험을 공유하고 싶습니다. 무엇보다 혼자 감당하려 하지 말고 도움을 요청하는 것이 중요했어요.',
          author: '김선생',
          authorId: 'teacher_001',
          category: COMMUNITY_CATEGORY.EXPERIENCE
        },
        {
          title: '법적 대응 절차에 대해 궁금합니다',
          content: '학생으로부터 지속적인 욕설과 위협을 받고 있습니다. 여러 차례 경고했지만 개선되지 않고 있어 법적 대응을 고려하고 있는데, 어떤 절차를 거쳐야 하는지 조언 부탁드립니다.',
          author: '박교사',
          authorId: 'teacher_002',
          category: COMMUNITY_CATEGORY.LEGAL
        },
        {
          title: '교사들의 멘탈케어가 정말 중요해요',
          content: '교권 침해를 당한 후 우울감과 불안감이 심해져서 전문 상담을 받았습니다. 교사 대상 심리상담 지원 서비스가 있으니 혼자 고민하지 마시고 도움을 받으세요. 많이 도움이 됐습니다.',
          author: '이선생님',
          authorId: 'teacher_003',
          category: COMMUNITY_CATEGORY.SUPPORT
        }
      ];

      for (const post of samplePosts) {
        await this.createPost(post);
      }
    }
  }
}