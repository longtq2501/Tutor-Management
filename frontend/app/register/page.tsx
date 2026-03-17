'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authService } from '@/lib/services';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<'TUTOR' | 'STUDENT'>('TUTOR');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const { isAuthenticated, logout } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authService.register({ email, password, fullName, role });

            // If there is an existing session, clear it so login page does not auto-redirect
            // back to the previously authenticated account.
            if (isAuthenticated) {
                await logout();
            } else {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
            }

            router.replace('/login?registered=true');
        } catch (err: unknown) {
            const errorResponse = err as { response?: { data?: { message?: string; data?: Record<string, string> } } };
            console.error('Registration error details:', errorResponse.response?.data);
            const errorData = errorResponse.response?.data;
            let message = errorData?.message || 'Đăng ký thất bại. Vui lòng thử lại.';

            // Handle validation errors (Map of field -> message)
            if (errorData?.data && typeof errorData.data === 'object') {
                const validationErrors = Object.values(errorData.data).join(', ');
                if (validationErrors) message = `${message}: ${validationErrors}`;
            }

            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        window.location.href = `${apiUrl.replace(/\/$/, '')}/oauth2/authorization/google?role=${role}`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 -right-40 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md relative z-10 shadow-2xl border-2">
                <CardHeader className="space-y-4 text-center pb-2">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <GraduationCap className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-bold">
                            {role === 'TUTOR' ? 'Trở thành Gia sư' : 'Đăng ký Học sinh'}
                        </CardTitle>
                        <CardDescription className="text-base mt-2">
                            {role === 'TUTOR'
                                ? 'Quản lý lớp học và học sinh hiệu quả hơn với Tutor Pro'
                                : 'Theo dõi lộ trình học tập và tài liệu cùng Tutor Pro'}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Role Selection */}
                    <div className="grid grid-cols-2 gap-4 p-1 bg-muted rounded-xl">
                        <button
                            type="button"
                            onClick={() => setRole('TUTOR')}
                            className={cn(
                                "flex items-center justify-center py-2 px-4 rounded-lg text-sm font-bold transition-all",
                                role === 'TUTOR'
                                    ? "bg-background text-primary shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Gia sư
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('STUDENT')}
                            className={cn(
                                "flex items-center justify-center py-2 px-4 rounded-lg text-sm font-bold transition-all",
                                role === 'STUDENT'
                                    ? "bg-background text-primary shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Học sinh
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive" className="animate-in fade-in-50">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="fullName">Họ và tên</Label>
                            <Input
                                id="fullName"
                                placeholder="Nguyễn Văn A"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                disabled={loading}
                                className="h-11 border-muted-foreground/20 focus:border-primary"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="example@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                                className="h-11 border-muted-foreground/20 focus:border-primary"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Mật khẩu</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="h-11 pr-10 border-muted-foreground/20 focus:border-primary"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    disabled={loading}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-primary/20"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Đang tạo tài khoản...
                                </>
                            ) : (
                                <>
                                    Đăng ký ngay
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-muted-foreground/20" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-4 text-muted-foreground font-medium">Hoặc</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full h-12 border-2 hover:bg-muted transition-all flex items-center justify-center gap-3"
                        disabled={loading}
                        onClick={handleGoogleSignUp}
                    >
                        <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                        </svg>
                        <span>Đăng ký {role === 'TUTOR' ? 'Gia sư' : 'Học sinh'} với Google</span>
                    </Button>

                    <div className="text-center text-sm">
                        <span className="text-muted-foreground">Đã có tài khoản? </span>
                        <Link href="/login" className="text-primary font-bold hover:underline transition-all">
                            Đăng nhập
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
