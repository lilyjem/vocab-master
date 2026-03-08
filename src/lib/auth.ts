/**
 * NextAuth.js 认证配置
 */
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { checkLoginLimit, recordFailedLogin, clearFailedLogins } from "@/lib/login-limiter";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // 邮箱/密码登录
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("请输入邮箱和密码");
        }

        // 检查登录限流
        const limitStatus = checkLoginLimit(credentials.email);
        if (limitStatus.locked) {
          throw new Error(`登录尝试过多，请 ${limitStatus.remainingMinutes} 分钟后再试`);
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          recordFailedLogin(credentials.email);
          const remaining = checkLoginLimit(credentials.email);
          if (remaining.remainingAttempts > 0) {
            throw new Error(`邮箱或密码错误，还可尝试 ${remaining.remainingAttempts} 次`);
          } else {
            throw new Error(`登录尝试过多，请 15 分钟后再试`);
          }
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          recordFailedLogin(credentials.email);
          const remaining = checkLoginLimit(credentials.email);
          if (remaining.remainingAttempts > 0) {
            throw new Error(`邮箱或密码错误，还可尝试 ${remaining.remainingAttempts} 次`);
          } else {
            throw new Error(`登录尝试过多，请 15 分钟后再试`);
          }
        }

        clearFailedLogins(credentials.email);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
  },
};
