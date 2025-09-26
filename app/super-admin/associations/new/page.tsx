'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AssociationForm {
  name: string;
  code: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  established_date: string;
}

export default function NewAssociation() {
  const [form, setForm] = useState<AssociationForm>({
    name: '',
    code: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    established_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = '협회명은 필수입니다.';
    }

    if (!form.code.trim()) {
      newErrors.code = '협회 코드는 필수입니다.';
    } else if (!/^[A-Z0-9]+$/.test(form.code)) {
      newErrors.code = '협회 코드는 대문자와 숫자만 사용할 수 있습니다.';
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = '유효한 이메일 주소를 입력해주세요.';
    }

    if (form.phone && !/^[0-9-]+$/.test(form.phone)) {
      newErrors.phone = '전화번호는 숫자와 하이픈(-)만 사용할 수 있습니다.';
    }

    if (form.website && !form.website.startsWith('http')) {
      setForm(prev => ({ ...prev, website: `https://${form.website}` }));
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Prepare data, removing empty strings
      const data = Object.entries(form).reduce((acc, [key, value]) => {
        if (value.trim()) {
          acc[key] = value.trim();
        }
        return acc;
      }, {} as Record<string, string>);

      const response = await fetch('/api/super-admin/associations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const result = await response.json();
        alert('협회가 성공적으로 생성되었습니다.');
        router.push('/super-admin/associations');
      } else {
        const error = await response.json();
        if (response.status === 409) {
          setErrors({ code: '이미 존재하는 협회 코드입니다.' });
        } else {
          alert(`생성 실패: ${error.error}`);
        }
      }
    } catch (error) {
      console.error('Create association error:', error);
      alert('협회 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <Link href="/super-admin/associations" className="text-blue-500 hover:text-blue-700 mr-2">
                ← 협회 관리
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 inline">새 협회 생성</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    협회명 *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 ${
                      errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="예: 서울교사협회"
                  />
                  {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                    협회 코드 *
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 uppercase ${
                      errors.code ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="예: SEOUL001"
                    style={{ textTransform: 'uppercase' }}
                  />
                  {errors.code && <p className="text-red-600 text-sm mt-1">{errors.code}</p>}
                  <p className="text-gray-500 text-xs mt-1">대문자와 숫자만 사용 (예: SEOUL001)</p>
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  협회 설명
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500"
                  placeholder="협회에 대한 간단한 설명을 입력하세요"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">연락처 정보</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    주소
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500"
                    placeholder="예: 서울시 중구 세종대로 110"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      전화번호
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className={`w-full border rounded-md px-3 py-2 ${
                        errors.phone ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="예: 02-1234-5678"
                    />
                    {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      이메일
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className={`w-full border rounded-md px-3 py-2 ${
                        errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="예: info@seoul-teachers.kr"
                    />
                    {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h2 className="text-lg font-semibold mb-4">추가 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                    웹사이트
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500"
                    placeholder="예: seoul-teachers.kr"
                  />
                </div>

                <div>
                  <label htmlFor="established_date" className="block text-sm font-medium text-gray-700 mb-1">
                    설립일
                  </label>
                  <input
                    type="date"
                    id="established_date"
                    name="established_date"
                    value={form.established_date}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Link
                href="/super-admin/associations"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? '생성 중...' : '협회 생성'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}