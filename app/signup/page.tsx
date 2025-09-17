'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Mail, 
  Lock, 
  School, 
  Briefcase, 
  Phone, 
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle,
  Shield,
  Plus,
  Minus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { associationUtils } from '@/lib/data/associations';

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    school: '',
    position: '',
    phone: '',
    associations: [''] // 배열로 변경하고 빈 문자열 하나로 시작
  });

  const [passwordStrength, setPasswordStrength] = useState({
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false
  });

  // 협회 관리 함수들
  const addAssociation = () => {
    setFormData(prev => ({
      ...prev,
      associations: [...prev.associations, '']
    }));
  };

  const removeAssociation = (index: number) => {
    if (formData.associations.length > 1) {
      setFormData(prev => ({
        ...prev,
        associations: prev.associations.filter((_, i) => i !== index)
      }));
    }
  };

  const updateAssociation = (index: number, value: string) => {
    // 중복 검사: 다른 인덱스에서 이미 선택된 협회인지 확인
    const isDuplicate = formData.associations.some((assoc, i) => i !== index && assoc === value && value !== '');

    if (isDuplicate && value !== '') {
      toast.error('이미 선택된 협회입니다. 다른 협회를 선택해주세요.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      associations: prev.associations.map((assoc, i) => i === index ? value : assoc)
    }));
  };

  // 특정 인덱스에서 선택 가능한 협회 목록 반환 (이미 선택된 협회 제외)
  const getAvailableAssociations = (currentIndex: number) => {
    const allAssociations = associationUtils.getActiveAssociations();
    const selectedAssociations = formData.associations.filter((assoc, i) => i !== currentIndex && assoc !== '');

    return allAssociations.filter(assoc => !selectedAssociations.includes(assoc.id));
  };

  const checkPasswordStrength = (password: string) => {
    setPasswordStrength({
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*]/.test(password),
      hasMinLength: password.length >= 8
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Check password strength
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (!Object.values(passwordStrength).every(Boolean)) {
      newErrors.password = '비밀번호 조건을 모두 충족해주세요.';
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    // Name validation
    if (!formData.name) {
      newErrors.name = '이름을 입력해주세요.';
    }

    // Phone validation (optional)
    if (formData.phone && !/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(formData.phone.replace(/-/g, ''))) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // 빈 협회를 제거하고 API에 전송할 데이터 준비
      const submitData = {
        ...formData,
        associations: formData.associations.filter(assoc => assoc.trim() !== '')
      };

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '회원가입에 실패했습니다.');
      }

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      toast.success('회원가입이 완료되었습니다!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-protection-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">교권119 회원가입</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            교사의 권익 보호를 위한 첫 걸음을 시작하세요
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>회원 정보 입력</CardTitle>
            <CardDescription>
              * 표시는 필수 입력 항목입니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  이메일 *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@school.ac.kr"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  비밀번호 *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 입력하세요"
                    value={formData.password}
                    onChange={handleChange}
                    className={errors.password ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Password strength indicator */}
                {formData.password && (
                  <div className="space-y-1 mt-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400">비밀번호 조건:</p>
                    <div className="space-y-1">
                      {[
                        { check: passwordStrength.hasMinLength, text: '8자 이상' },
                        { check: passwordStrength.hasLowerCase, text: '소문자 포함' },
                        { check: passwordStrength.hasNumber, text: '숫자 포함' },
                        { check: passwordStrength.hasSpecialChar, text: '특수문자(!@#$%^&*) 포함' }
                      ].map((item, index) => (
                        <div key={index} className={`text-xs flex items-center gap-1 ${item.check ? 'text-green-600' : 'text-gray-400'}`}>
                          <CheckCircle className="h-3 w-3" />
                          {item.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {errors.password && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  비밀번호 확인 *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 다시 입력하세요"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  이름 *
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* School */}
                <div className="space-y-2">
                  <Label htmlFor="school" className="flex items-center gap-2">
                    <School className="h-4 w-4" />
                    학교
                  </Label>
                  <Input
                    id="school"
                    name="school"
                    type="text"
                    placeholder="○○초등학교"
                    value={formData.school}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>

                {/* Position */}
                <div className="space-y-2">
                  <Label htmlFor="position" className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    직위
                  </Label>
                  <Input
                    id="position"
                    name="position"
                    type="text"
                    placeholder="교사"
                    value={formData.position}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  전화번호
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="010-1234-5678"
                  value={formData.phone}
                  onChange={handleChange}
                  className={errors.phone ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Associations */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    소속 협회
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAssociation}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    협회 추가
                  </Button>
                </div>

                <div className="space-y-2">
                  {formData.associations.map((association, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1">
                        <Select
                          value={association}
                          onValueChange={(value) => updateAssociation(index, value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger className={errors.associations ? 'border-red-500' : ''}>
                            <SelectValue placeholder="협회를 선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableAssociations(index).map((assoc) => (
                              <SelectItem key={assoc.id} value={assoc.id}>
                                {assoc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.associations.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeAssociation(index)}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {errors.associations && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.associations}
                  </p>
                )}
              </div>

              <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm">
                  개인정보는 안전하게 암호화되어 저장되며, 교권 보호 서비스 제공 목적으로만 사용됩니다.
                </AlertDescription>
              </Alert>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? '회원가입 중...' : '회원가입'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                로그인
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}