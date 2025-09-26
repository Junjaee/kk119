'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface PostFormData {
  category: string
  title: string
  content: string
}

const CommunityNewPost: React.FC = () => {
  const [formData, setFormData] = useState<PostFormData>({
    category: '',
    title: '',
    content: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)

  const categories = [
    { id: 'general', name: '일반' },
    { id: 'curriculum', name: '교육과정' },
    { id: 'teaching-method', name: '교수법' },
    { id: 'student-guidance', name: '학생지도' },
    { id: 'school-life', name: '학교생활' },
    { id: 'legal-info', name: '법률정보' }
  ]

  const handleInputChange = (field: keyof PostFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCategorySelect = (categoryId: string) => {
    const selectedCategory = categories.find(cat => cat.id === categoryId)
    if (selectedCategory) {
      handleInputChange('category', selectedCategory.name)
      setShowCategoryDropdown(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.category || !formData.title.trim() || !formData.content.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      // Submit logic here
      console.log('Submitting:', formData)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = formData.category && formData.title.trim() && formData.content.trim()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">새 게시글 작성</h1>
              <p className="text-sm text-gray-600 mt-1">교육 커뮤니티에 지식과 경험을 공유해보세요</p>
            </div>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium"
              onClick={() => window.history.back()}
            >
              취소
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Category Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              카테고리 선택
            </label>
            <div className="relative">
              <button
                type="button"
                className="w-full max-w-xs bg-white border border-gray-300 rounded-lg px-4 py-3 text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-colors"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <span className={formData.category ? 'text-gray-900' : 'text-gray-500'}>
                  {formData.category || '카테고리를 선택하세요'}
                </span>
                <ChevronDown 
                  className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${
                    showCategoryDropdown ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              {showCategoryDropdown && (
                <div className="absolute z-10 mt-2 w-full max-w-xs bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-3">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              제목
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="게시글 제목을 입력하세요"
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-4 text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-colors"
              maxLength={100}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>명확하고 구체적인 제목을 작성해주세요</span>
              <span>{formData.title.length}/100</span>
            </div>
          </div>

          {/* Content Textarea */}
          <div className="space-y-3">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              내용
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="교육 현장의 경험과 지식을 자세히 공유해주세요.&#10;&#10;• 구체적인 사례와 경험을 포함해주세요&#10;• 다른 교육자들에게 도움이 될 수 있는 실용적인 정보를 작성해주세요&#10;• 법률 관련 내용의 경우 정확한 근거를 제시해주세요"
              className="w-full min-h-96 bg-white border border-gray-300 rounded-lg px-4 py-4 text-base placeholder-gray-500 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 transition-colors resize-vertical"
              rows={16}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>최소 100자 이상 작성해주세요</span>
              <span>{formData.content.length}자</span>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">게시글 작성 가이드</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 교육 현장의 실제 경험과 노하우를 공유해주세요</li>
              <li>• 법률 정보의 경우 정확한 법령과 근거를 명시해주세요</li>
              <li>• 타인을 존중하는 건설적인 내용으로 작성해주세요</li>
              <li>• 개인정보나 민감한 정보는 포함하지 마세요</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              onClick={() => window.history.back()}
            >
              취소
            </button>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                임시저장
              </button>
              
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`px-8 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isFormValid && !isSubmitting
                    ? 'bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? '게시 중...' : '게시하기'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

export default CommunityNewPost