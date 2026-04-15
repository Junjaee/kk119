import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        // 비밀번호 관리자(1Password/LastPass 등) 확장이 주입하는 style/data-* 속성으로 인한
        // 하이드레이션 경고를 무시한다. 서버 렌더 HTML과 차이가 나는 경우는 사용자 개입뿐이므로 안전.
        suppressHydrationWarning
        className={cn(
          // 토큰 기반: border, bg, ring 모두 시맨틱 변수 사용
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-small',
          'transition-colors duration-150',
          'ring-offset-background',
          'file:border-0 file:bg-transparent file:text-small file:font-medium',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
