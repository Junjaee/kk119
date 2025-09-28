/**
 * Comment Repository Implementation
 * Following Single Responsibility Principle - only handles comment operations
 */

import { ICommentRepository, Comment } from '../interfaces';
import { idGenerationService } from '../id-generation-service';
import { STORAGE_KEYS, ERROR_MESSAGES } from '../constants';

/**
 * LocalStorage-based Comment Repository
 * Following Single Responsibility Principle
 */
export class LocalCommentRepository implements ICommentRepository {
  /**
   * Get all comments from localStorage
   */
  async getAllComments(): Promise<Comment[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMMUNITY_COMMENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading comments from localStorage:', error);
      return [];
    }
  }

  /**
   * Get comments by post ID
   */
  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    const comments = await this.getAllComments();
    return comments
      .filter(comment => comment.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  /**
   * Create new comment
   */
  async createComment(commentData: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>): Promise<Comment | null> {
    const comments = await this.getAllComments();

    const newComment: Comment = {
      ...commentData,
      id: idGenerationService.generateCommentId(),
      likes: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    comments.push(newComment);
    await this.saveComments(comments);

    return newComment;
  }

  /**
   * Like/Unlike comment
   */
  async toggleCommentLike(commentId: string, userId: string): Promise<Comment | null> {
    const comments = await this.getAllComments();
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
    await this.saveComments(comments);
    return comments[index];
  }

  /**
   * Delete comment
   */
  async deleteComment(id: string): Promise<boolean> {
    const comments = await this.getAllComments();
    const filteredComments = comments.filter(comment => comment.id !== id);

    if (filteredComments.length === comments.length) {
      return false; // Comment not found
    }

    await this.saveComments(filteredComments);
    return true;
  }

  /**
   * Save comments to localStorage
   * Following Single Responsibility Principle
   */
  private async saveComments(comments: Comment[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_COMMENTS, JSON.stringify(comments));
    } catch (error) {
      console.error('Error saving comments to localStorage:', error);
      throw new Error(ERROR_MESSAGES.FAILED_TO_SAVE_COMMENT);
    }
  }

  /**
   * Initialize with sample data (for development/demo)
   */
  async initWithSampleData(posts: any[]): Promise<void> {
    const existingComments = await this.getAllComments();

    if (existingComments.length === 0 && posts.length > 0) {
      const sampleComments: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy'>[] = [
        {
          postId: posts[0].id,
          content: '정말 좋은 경험 공유 감사합니다. 저도 비슷한 상황을 겪었는데 많은 도움이 됩니다.',
          author: '최교사',
          authorId: 'teacher_004'
        },
        {
          postId: posts[0].id,
          content: '상담사와의 협력이 정말 중요하다는 걸 느꼈어요. 체계적인 대응 방법이 궁금합니다.',
          author: '정선생',
          authorId: 'teacher_005'
        }
      ];

      for (const comment of sampleComments) {
        await this.createComment(comment);
      }
    }
  }

  /**
   * Delete comments by post ID (when post is deleted)
   * Following Single Responsibility Principle
   */
  async deleteCommentsByPostId(postId: string): Promise<number> {
    const comments = await this.getAllComments();
    const filteredComments = comments.filter(comment => comment.postId !== postId);
    const deletedCount = comments.length - filteredComments.length;

    if (deletedCount > 0) {
      await this.saveComments(filteredComments);
    }

    return deletedCount;
  }
}