# 🎓 CampusHub Frontend Implementation Guide

Complete guide for building the Next.js frontend for your college portal.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Project Setup](#project-setup)
3. [Key Implementation Examples](#key-implementation-examples)
4. [API Integration](#api-integration)
5. [Component Examples](#component-examples)
6. [Best Practices](#best-practices)

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js 18+
pnpm (recommended) or npm
```

### Installation Commands

```bash
# Create Next.js project
npx create-next-app@latest campushub-frontend --typescript --tailwind --app --src-dir

cd campushub-frontend

# Install core dependencies
pnpm add axios next-auth @tanstack/react-query zustand
pnpm add react-hook-form @hookform/resolvers zod
pnpm add date-fns clsx tailwind-merge

# Install UI components (shadcn/ui)
pnpm dlx shadcn-ui@latest init
pnpm dlx shadcn-ui@latest add button card dialog form input label table toast
pnpm dlx shadcn-ui@latest add dropdown-menu avatar badge tabs select

# Development dependencies
pnpm add -D @types/node @types/react @types/react-dom
```

---

## 🏗️ Project Setup

### 1. Environment Variables (.env.local)

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_API_BASE=http://localhost:8000

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl

# Optional: Analytics, Error Tracking
NEXT_PUBLIC_SENTRY_DSN=
```

### 2. NextAuth Configuration (src/app/api/auth/[...nextauth]/route.ts)

```typescript
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/users/login`,
            {
              email: credentials?.email,
              password: credentials?.password,
            }
          );

          if (response.data.success && response.data.data) {
            return {
              id: response.data.data.loggedInUser._id,
              email: response.data.data.loggedInUser.email,
              name: response.data.data.loggedInUser.username,
              role: response.data.data.loggedInUser.role,
              avatar: response.data.data.loggedInUser.avatar,
              accessToken: response.data.data.accessToken,
              refreshToken: response.data.data.refreshToken,
            };
          }
          return null;
        } catch (error) {
          throw new Error("Invalid credentials");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### 3. Axios Instance with Interceptors (src/lib/axios.ts)

```typescript
import axios from "axios";
import { getSession } from "next-auth/react";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

### 4. TanStack Query Setup (src/app/providers.tsx)

```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  );
}
```

### 5. Middleware for Route Protection (src/middleware.ts)

```typescript
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Role-based access control
    if (path.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (path.startsWith("/faculty") && !["admin", "faculty"].includes(token?.role as string)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (path.startsWith("/student") && !["admin", "student"].includes(token?.role as string)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/faculty/:path*", "/student/:path*", "/profile/:path*"],
};
```

---

## 🔧 Key Implementation Examples

### Custom Hooks

#### 1. useCourses Hook (src/hooks/useCourses.ts)

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { toast } from "@/components/ui/use-toast";

interface Course {
  _id: string;
  title: string;
  content: string;
  priceInPaise: number;
  creator: {
    username: string;
    fullName: string;
  };
  createdAt: string;
}

interface CoursesResponse {
  courses: Course[];
  metadata: {
    totalPages: number;
    currentPage: number;
    totalCourses: number;
  };
}

export function useCourses(page = 1, limit = 10, search = "") {
  return useQuery({
    queryKey: ["courses", page, limit, search],
    queryFn: async () => {
      const response = await axiosInstance.get<{ data: CoursesResponse }>(
        `/courses?page=${page}&limit=${limit}&search=${search}`
      );
      return response.data.data;
    },
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; content: string; priceInPaise: number }) => {
      const response = await axiosInstance.post("/courses", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({
        title: "Success",
        description: "Course created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create course",
        variant: "destructive",
      });
    },
  });
}

export function useEnrollCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const response = await axiosInstance.post("/enrollments", { courseId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      toast({
        title: "Enrolled!",
        description: "You have successfully enrolled in this course",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to enroll",
        variant: "destructive",
      });
    },
  });
}
```

#### 2. useNotifications Hook (src/hooks/useNotifications.ts)

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

interface Notification {
  _id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["notifications", page, limit],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/notifications?page=${page}&limit=${limit}`
      );
      return response.data.data;
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

export function useUnreadNotifications() {
  return useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      const response = await axiosInstance.get("/notifications/unread");
      return response.data.data;
    },
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await axiosInstance.patch(
        `/notifications/${notificationId}/read`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkMultipleRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const response = await axiosInstance.patch("/notifications/mark-read", {
        notificationIds,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
```

---

## 🎨 Component Examples

### 1. Login Form (src/components/auth/LoginForm.tsx)

```typescript
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Error",
          description: "Invalid email or password",
          variant: "destructive",
        });
        return;
      }

      // Get session to determine role-based redirect
      const response = await fetch("/api/auth/session");
      const session = await response.json();

      if (session?.user?.role) {
        const roleRedirects = {
          admin: "/admin",
          faculty: "/faculty",
          student: "/student",
        };
        router.push(roleRedirects[session.user.role as keyof typeof roleRedirects]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </Form>
  );
}
```

### 2. Course Card (src/components/courses/CourseCard.tsx)

```typescript
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface CourseCardProps {
  course: {
    _id: string;
    title: string;
    content: string;
    priceInPaise: number;
    creator: {
      username: string;
      fullName: string;
    };
  };
  onEnroll?: () => void;
  isEnrolled?: boolean;
}

export function CourseCard({ course, onEnroll, isEnrolled }: CourseCardProps) {
  const priceInRupees = (course.priceInPaise / 100).toFixed(2);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="line-clamp-2">{course.title}</CardTitle>
          <Badge variant={isEnrolled ? "default" : "secondary"}>
            {isEnrolled ? "Enrolled" : `₹${priceInRupees}`}
          </Badge>
        </div>
        <CardDescription>By {course.creator.fullName}</CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">{course.content}</p>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button variant="outline" asChild className="flex-1">
          <Link href={`/student/courses/${course._id}`}>View Details</Link>
        </Button>
        {!isEnrolled && (
          <Button onClick={onEnroll} className="flex-1">
            Enroll Now
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
```

### 3. Dashboard Layout (src/components/layout/DashboardLayout.tsx)

```typescript
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserNav } from "@/components/layout/UserNav";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  Bell,
  Settings,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  roles: string[];
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "faculty", "student"] },
  { title: "Courses", href: "/courses", icon: BookOpen, roles: ["admin", "faculty", "student"] },
  { title: "Users", href: "/admin/users", icon: Users, roles: ["admin"] },
  { title: "Assessments", href: "/assessments", icon: FileText, roles: ["faculty", "student"] },
  { title: "Results", href: "/student/results", icon: FileText, roles: ["student"] },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userRole = session?.user?.role || "student";
  const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform lg:translate-x-0 lg:static",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-xl font-bold text-blue-600">CampusHub</h1>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-4 ml-auto">
            <NotificationBell />
            <UserNav />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

### 4. Notification Bell (src/components/notifications/NotificationBell.tsx)

```typescript
"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUnreadNotifications, useMarkNotificationRead } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell() {
  const { data, isLoading } = useUnreadNotifications();
  const markAsRead = useMarkNotificationRead();

  const unreadCount = data?.notifications?.length || 0;

  const handleNotificationClick = (notificationId: string) => {
    markAsRead.mutate(notificationId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="px-4 py-2 border-b">
          <h3 className="font-semibold">Notifications</h3>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : unreadCount === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No new notifications</div>
          ) : (
            data?.notifications.map((notification: any) => (
              <DropdownMenuItem
                key={notification._id}
                className="flex flex-col items-start p-4 cursor-pointer"
                onClick={() => handleNotificationClick(notification._id)}
              >
                <p className="text-sm font-medium">{notification.message}</p>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## 📊 Best Practices Summary

### 1. Performance Optimization
- Use Next.js Server Components for static content
- Implement pagination for large lists
- Add loading skeletons instead of spinners
- Optimize images with next/image
- Use dynamic imports for heavy components

### 2. Security
- Never store sensitive data in localStorage
- Validate all user inputs with Zod
- Use HTTPS in production
- Implement CSRF protection
- Add rate limiting on API calls

### 3. UX Improvements
- Add optimistic updates for instant feedback
- Show loading states for all async operations
- Provide clear error messages
- Add confirmation dialogs for destructive actions
- Implement keyboard shortcuts for power users

### 4. Code Organization
- Keep components small and focused (single responsibility)
- Use custom hooks for reusable logic
- Separate API logic into service files
- Use TypeScript for type safety
- Write descriptive variable and function names

### 5. Testing Strategy
- Unit tests for utility functions
- Integration tests for API calls
- E2E tests for critical user flows
- Test error states and edge cases
- Aim for 80%+ code coverage

---

## 🎯 Next Steps

1. **Week 1-2**: Setup project, authentication, and basic layouts
2. **Week 3-4**: Implement course management and enrollment
3. **Week 5-6**: Build assessment and submission system
4. **Week 7-8**: Add grading, results, and notifications
5. **Week 9-10**: Polish UI/UX, testing, and deployment

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TanStack Query Guide](https://tanstack.com/query/latest)
- [shadcn/ui Components](https://ui.shadcn.com)
- [React Hook Form](https://react-hook-form.com)
- [Tailwind CSS](https://tailwindcss.com)

---

**Happy Coding! 🚀**
