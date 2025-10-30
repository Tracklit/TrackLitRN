import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { LoginData, insertUserSchema } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Terminal } from 'lucide-react';
import { signInWithGoogle } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import authVideoUrl from '@assets/THE ULTIMATE TOOLKIT FOR TRACK & FIELD_1761861653988.mp4';

// Extend the schemas with validation
const loginFormSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const registerFormSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, { message: "Confirm your password" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Valid email is required" }),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(1, { message: "Confirm your password" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>('login');
  const [resetToken, setResetToken] = useState<string>('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<string>('');
  const [isSubmittingForgotPassword, setIsSubmittingForgotPassword] = useState(false);
  const [resetPasswordMessage, setResetPasswordMessage] = useState<string>('');
  const [isSubmittingResetPassword, setIsSubmittingResetPassword] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const { toast } = useToast();

  // Check for reset token in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
      setResetToken(tokenFromUrl);
      setActiveTab('reset-password');
      
      // Verify token validity
      setIsVerifyingToken(true);
      fetch(`/api/auth/verify-reset-token/${tokenFromUrl}`)
        .then(response => response.json())
        .then(data => {
          if (!data.valid) {
            toast({
              title: 'Invalid Token',
              description: 'This password reset link is invalid or has expired.',
              variant: 'destructive',
            });
            setActiveTab('forgot-password');
          }
        })
        .catch(() => {
          toast({
            title: 'Error',
            description: 'Could not verify reset token. Please request a new reset link.',
            variant: 'destructive',
          });
          setActiveTab('forgot-password');
        })
        .finally(() => {
          setIsVerifyingToken(false);
        });
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  // Login form
  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      name: "",
      email: "",
    },
  });

  // Forgot password form
  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Reset password form
  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Handle login submission
  const onLoginSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  // Handle register submission
  const onRegisterSubmit = (data: z.infer<typeof registerFormSchema>) => {
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate(userData);
  };

  // Handle forgot password submission
  const onForgotPasswordSubmit = async (data: z.infer<typeof forgotPasswordSchema>) => {
    setIsSubmittingForgotPassword(true);
    setForgotPasswordMessage('');
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setForgotPasswordMessage('Password reset email sent! Check your inbox.');
        toast({
          title: 'Email sent',
          description: 'Please check your inbox for password reset instructions.',
        });
      } else {
        setForgotPasswordMessage(result.error || 'An error occurred sending the reset email.');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to send password reset email',
        });
      }
    } catch (error) {
      setForgotPasswordMessage('Network error. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Network Error',
        description: 'Please check your connection and try again.',
      });
    } finally {
      setIsSubmittingForgotPassword(false);
    }
  };

  // Handle reset password submission
  const onResetPasswordSubmit = async (data: z.infer<typeof resetPasswordSchema>) => {
    setIsSubmittingResetPassword(true);
    setResetPasswordMessage('');
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword: data.newPassword,
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setResetPasswordMessage('Password reset successfully! You can now log in.');
        toast({
          title: 'Password reset',
          description: 'Your password has been reset successfully.',
        });
        setActiveTab('login');
      } else {
        setResetPasswordMessage(result.error || 'An error occurred resetting the password.');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to reset password',
        });
      }
    } catch (error) {
      setResetPasswordMessage('Network error. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Network Error',
        description: 'Please check your connection and try again.',
      });
    } finally {
      setIsSubmittingResetPassword(false);
    }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      if (result.idToken) {
        // Send the ID token to our backend for verification
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken: result.idToken }),
        });
        
        if (response.ok) {
          const data = await response.json();
          // Check if user needs onboarding
          if (data.requiresOnboarding) {
            window.location.href = '/onboarding';
          } else {
            window.location.href = '/';
          }
        } else {
          const errorData = await response.json();
          toast({
            title: "Sign-in failed",
            description: errorData.error || "Could not sign in with Google.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Sign-in failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Redirect if user is already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <>
      {/* Loading Video Overlay */}
      {!isVideoLoaded && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <video
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            onCanPlayThrough={() => setIsVideoLoaded(true)}
          >
            <source src={authVideoUrl} type="video/mp4" />
          </video>
        </div>
      )}

      <div className="min-h-screen grid md:grid-cols-2">
        {/* Auth Form Section */}
        <div className="flex flex-col justify-center p-6 md:p-12">
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center mb-8">
            <h1 className="text-3xl font-bold">TrackLit</h1>
          </div>
          
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register' | 'forgot-password' | 'reset-password')}>
            {activeTab === 'forgot-password' || activeTab === 'reset-password' ? (
              <div className="mb-8 text-center">
                <h2 className="text-xl font-semibold">
                  {activeTab === 'forgot-password' ? 'Reset Password' : 'Set New Password'}
                </h2>
              </div>
            ) : (
              <TabsList className="grid grid-cols-2 mb-8">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
            )}
            
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full mt-6 bg-primary text-white"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Logging in..." : "Log In"}
                  </Button>
                </form>
              </Form>
              
              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-4"
                  onClick={handleGoogleSignIn}
                  disabled={registerMutation.isPending}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </div>
              
              <div className="mt-6 text-center text-sm text-darkGray">
                <p>
                  Don't have an account?{" "}
                  <button 
                    className="text-primary font-medium hover:underline" 
                    onClick={() => setActiveTab('register')}
                  >
                    Sign up
                  </button>
                </p>
                <div className="mt-2">
                  <button 
                    className="text-primary font-medium hover:underline text-sm" 
                    onClick={() => setActiveTab('forgot-password')}
                    data-testid="link-forgot-password"
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit as any)} className="space-y-4">
                  <FormField
                    control={registerForm.control as any}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control as any}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control as any}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Choose a username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control as any}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Create a password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control as any}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full mt-6 bg-primary text-white"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </Form>
              
              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-4"
                  onClick={handleGoogleSignIn}
                  disabled={registerMutation.isPending}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </div>
              
              <div className="mt-6 text-center text-sm text-darkGray">
                <p>
                  Already have an account?{" "}
                  <button 
                    className="text-primary font-medium hover:underline" 
                    onClick={() => setActiveTab('login')}
                  >
                    Log in
                  </button>
                </p>
              </div>
            </TabsContent>
            
            {/* Forgot Password Tab */}
            <TabsContent value="forgot-password">
              <Form {...forgotPasswordForm}>
                <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                  <div className="mb-4 text-center text-sm text-muted-foreground">
                    Enter your email address and we'll send you a link to reset your password.
                  </div>
                  
                  <FormField
                    control={forgotPasswordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="Enter your email address" 
                            data-testid="input-forgot-email"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {forgotPasswordMessage && (
                    <div className={`text-sm p-3 rounded ${forgotPasswordMessage.includes('sent') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {forgotPasswordMessage}
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full mt-6 bg-primary text-white"
                    disabled={isSubmittingForgotPassword}
                    data-testid="button-send-reset-email"
                  >
                    {isSubmittingForgotPassword ? "Sending..." : "Send Reset Email"}
                  </Button>
                </form>
              </Form>
              
              <div className="mt-6 text-center text-sm text-darkGray">
                <button 
                  className="text-primary font-medium hover:underline" 
                  onClick={() => setActiveTab('login')}
                  data-testid="link-back-to-login"
                >
                  Back to Login
                </button>
              </div>
            </TabsContent>
            
            {/* Reset Password Tab */}
            <TabsContent value="reset-password">
              <Form {...resetPasswordForm}>
                <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4">
                  <div className="mb-4 text-center text-sm text-muted-foreground">
                    Enter your new password below.
                  </div>
                  
                  <FormField
                    control={resetPasswordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter your new password" 
                            data-testid="input-new-password"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={resetPasswordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Confirm your new password" 
                            data-testid="input-confirm-password"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {resetPasswordMessage && (
                    <div className={`text-sm p-3 rounded ${resetPasswordMessage.includes('successfully') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {resetPasswordMessage}
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full mt-6 bg-primary text-white"
                    disabled={isSubmittingResetPassword}
                    data-testid="button-reset-password"
                  >
                    {isSubmittingResetPassword ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              </Form>
              
              <div className="mt-6 text-center text-sm text-darkGray">
                <button 
                  className="text-primary font-medium hover:underline" 
                  onClick={() => setActiveTab('login')}
                  data-testid="link-back-to-login-2"
                >
                  Back to Login
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Hero Video Section */}
      <div className="hidden md:flex items-center justify-center bg-black overflow-hidden relative">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={authVideoUrl} type="video/mp4" />
        </video>
      </div>
    </div>
    </>
  );
}
